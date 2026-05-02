// src/lib/riot-api.ts
// SERVER-SIDE ONLY — do not import in client components

import { PlayerData } from '@/types';
import { RANK_VALUES } from '@/data/ranks';
import { calcTotalScore, calcPerformanceScore, detectSmurf } from '@/lib/scoring';

const API_KEY = process.env.RIOT_API_KEY ?? '';
const ACCOUNT_BASE = 'https://asia.api.riotgames.com';
const TRACKER_BASE = 'https://api.tracker.gg/api/v2/valorant/standard/profile/riot';

async function riotFetch(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': API_KEY },
      next: { revalidate: 0 },
    });
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '2');
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }
    return res;
  }
  throw new Error('Rate limit exceeded after 3 retries');
}

async function getPuuid(gameName: string, tagLine: string): Promise<string> {
  if (!API_KEY) throw new Error('RIOT_API_KEY が設定されていません');

  const url = `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await riotFetch(url);

  if (res.status === 401 || res.status === 403) {
    throw new Error('Riot APIキーが無効または期限切れです。developer.riotgames.com で新しいキーを取得してください。');
  }
  if (res.status === 404) {
    throw new Error(`プレイヤーが見つかりません: ${gameName}#${tagLine}`);
  }
  if (!res.ok) {
    throw new Error(`Riot API error ${res.status}`);
  }

  const data = await res.json();
  return data.puuid as string;
}

interface TrackerStats {
  competitiveTier: number;
  avgKda: number;
  winRate: number;
  matchCount: number;
}

function extractTierFromIconUrl(iconUrl: string): number {
  // e.g. "https://trackercdn.com/.../tiersv2/21.png" → 21
  const match = iconUrl.match(/tiersv2\/(\d+)\.png/);
  return match ? parseInt(match[1]) : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStatValue(stats: any, key: string): number {
  const raw = stats?.[key]?.value;
  return raw !== undefined && raw !== null ? parseFloat(String(raw)) || 0 : 0;
}

async function fetchTrackerStats(gameName: string, tagLine: string): Promise<TrackerStats | null> {
  const encoded = encodeURIComponent(`${gameName}#${tagLine}`);
  const url = `${TRACKER_BASE}/${encoded}?segments=overview`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://tracker.gg/valorant',
        'Accept': 'application/json',
        'Accept-Language': 'ja,en;q=0.9',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segments: any[] = data?.data?.segments ?? [];
    if (!segments.length) return null;

    // Overview segment has current rank + aggregate stats
    const overview = segments.find(s => s.type === 'overview');
    // Season segment has per-season stats
    const season = segments.find(s => s.type === 'season');
    // Peak rating segment for fallback rank
    const peakRating = segments.find(s => s.type === 'peak-rating');

    const statSeg = season ?? overview;
    const stats = statSeg?.stats ?? {};

    // Extract current rank from overview, fall back to peak-rating
    let competitiveTier = 0;
    const rankIconUrl: string = overview?.stats?.rank?.metadata?.iconUrl ?? '';
    if (rankIconUrl) {
      competitiveTier = extractTierFromIconUrl(rankIconUrl);
    }
    if (!competitiveTier && peakRating) {
      const peakIconUrl: string = peakRating?.stats?.peakRating?.metadata?.iconUrl ?? '';
      competitiveTier = extractTierFromIconUrl(peakIconUrl);
    }

    const avgKda = getStatValue(stats, 'kDRatio');
    const winRatePct = getStatValue(stats, 'matchesWinPct');
    const matchCount = getStatValue(stats, 'matchesPlayed');

    return {
      competitiveTier,
      avgKda,
      winRate: winRatePct / 100,
      matchCount,
    };
  } catch {
    return null;
  }
}

export async function verifyAndBuildPlayer(
  gameName: string,
  tagLine: string
): Promise<PlayerData> {
  const puuid = await getPuuid(gameName, tagLine);
  const tracker = await fetchTrackerStats(gameName, tagLine);

  const competitiveTier = tracker?.competitiveTier ?? 0;
  const avgKda = tracker?.avgKda ?? 0;
  const winRate = tracker?.winRate ?? 0;
  const matchCount = tracker?.matchCount ?? 0;

  const rankValue = RANK_VALUES[competitiveTier] ?? 0;
  const performanceScore = tracker
    ? calcPerformanceScore(avgKda, 0, winRate)
    : 0.5;
  const totalScore = calcTotalScore(rankValue, performanceScore);
  const isSmurf = tracker ? detectSmurf(matchCount, winRate, avgKda) : false;

  return {
    gameName,
    tagLine,
    puuid,
    competitiveTier,
    rankValue,
    performanceScore,
    totalScore,
    topAgents: [],
    matchCount,
    winRate,
    avgKda,
    isSmurf,
  };
}
