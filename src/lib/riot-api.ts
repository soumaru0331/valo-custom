// src/lib/riot-api.ts
// SERVER-SIDE ONLY — do not import in client components

import { PlayerData } from '@/types';
import { RANK_VALUES } from '@/data/ranks';
import { calcTotalScore, calcPerformanceScore, detectSmurf } from '@/lib/scoring';

const RIOT_KEY = process.env.RIOT_API_KEY ?? '';
const HENRIK_KEY = process.env.HENRIK_API_KEY ?? '';
const ACCOUNT_BASE = 'https://asia.api.riotgames.com';
const HENRIK_BASE = 'https://api.henrikdev.xyz/valorant';

// ── Riot Account API ────────────────────────────────────────────────────────

async function riotFetch(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': RIOT_KEY },
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
  if (!RIOT_KEY) throw new Error('RIOT_API_KEY が設定されていません');

  const url = `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await riotFetch(url);

  if (res.status === 401 || res.status === 403) {
    throw new Error('Riot APIキーが無効または期限切れです');
  }
  if (res.status === 404) {
    throw new Error(`プレイヤーが見つかりません: ${gameName}#${tagLine}`);
  }
  if (!res.ok) throw new Error(`Riot API error ${res.status}`);

  const data = await res.json();
  return data.puuid as string;
}

// ── HenrikDev API ───────────────────────────────────────────────────────────

async function henrikFetch(path: string): Promise<unknown> {
  const res = await fetch(`${HENRIK_BASE}${path}`, {
    headers: { 'Authorization': HENRIK_KEY },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

interface HenrikStats {
  competitiveTier: number;
  avgKda: number;
  hsRate: number;
  winRate: number;
  matchCount: number;
  accountLevel: number;
}

async function fetchHenrikStats(
  gameName: string,
  tagLine: string,
): Promise<HenrikStats | null> {
  if (!HENRIK_KEY) return null;

  const name = encodeURIComponent(gameName);
  const tag = encodeURIComponent(tagLine);

  // force=true で毎回最新データを取得
  // HenrikのPUUID(UUID形式)はRiotのPUUID(base64形式)と別物なので必ずここから取得する
  const mmr = await henrikFetch(`/v2/mmr/ap/${name}/${tag}?force=true`) as Record<string, unknown> | null;
  const currentData = mmr?.current_data as Record<string, unknown> | undefined;
  const competitiveTier: number = (currentData?.currenttier as number) ?? 0;
  const puuid: string = (mmr?.puuid as string) ?? '';

  // PUUIDが取れなければ試合データの照合が不可能なのでスキップ
  if (!puuid) {
    return { competitiveTier, avgKda: 0, hsRate: 0, winRate: 0, matchCount: 0, accountLevel: 0 };
  }

  // force=true で最新20試合を取得
  const matches = await henrikFetch(`/v3/matches/ap/${name}/${tag}?mode=competitive&size=20&force=true`) as Record<string, unknown>[] | null;
  if (!matches || !Array.isArray(matches) || matches.length === 0) {
    return { competitiveTier, avgKda: 0, hsRate: 0, winRate: 0, matchCount: 0, accountLevel: 0 };
  }

  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalHeadshots = 0, totalBodyshots = 0, totalLegshots = 0;
  let wins = 0;
  let validMatches = 0;
  let accountLevel = 0;

  for (const match of matches) {
    const players = ((match?.players as Record<string, unknown>)?.all_players as Record<string, unknown>[]) ?? [];
    const me = players.find(p => p.puuid === puuid) as Record<string, unknown> | undefined;
    if (!me) continue;

    if (validMatches === 0) accountLevel = (me?.level as number) ?? 0;
    const stats = (me?.stats ?? {}) as Record<string, number>;
    const kills: number = stats.kills ?? 0;
    const deaths: number = stats.deaths ?? 0;
    const assists: number = stats.assists ?? 0;
    const hs: number = stats.headshots ?? 0;
    const bs: number = stats.bodyshots ?? 0;
    const ls: number = stats.legshots ?? 0;

    totalKills += kills;
    totalDeaths += deaths;
    totalAssists += assists;
    totalHeadshots += hs;
    totalBodyshots += bs;
    totalLegshots += ls;

    const myTeam: string = ((me?.team as string) ?? '').toLowerCase();
    const teams = match?.teams as Record<string, Record<string, unknown>> | undefined;
    const won: boolean =
      myTeam === 'red'
        ? teams?.red?.has_won === true
        : teams?.blue?.has_won === true;
    if (won) wins++;
    validMatches++;
  }

  if (validMatches === 0) {
    return { competitiveTier, avgKda: 0, hsRate: 0, winRate: 0, matchCount: 0, accountLevel: 0 };
  }

  const avgKda = totalDeaths > 0
    ? (totalKills + totalAssists) / totalDeaths
    : totalKills + totalAssists;

  const totalShots = totalHeadshots + totalBodyshots + totalLegshots;
  const hsRate = totalShots > 0 ? totalHeadshots / totalShots : 0;
  const winRate = wins / validMatches;

  return { competitiveTier, avgKda, hsRate, winRate, matchCount: validMatches, accountLevel };
}

// ── Main export ─────────────────────────────────────────────────────────────

export async function verifyAndBuildPlayer(
  gameName: string,
  tagLine: string
): Promise<PlayerData> {
  const puuid = await getPuuid(gameName, tagLine);
  const stats = await fetchHenrikStats(gameName, tagLine);

  const competitiveTier = stats?.competitiveTier ?? 0;
  const avgKda = stats?.avgKda ?? 0;
  const hsRate = stats?.hsRate ?? 0;
  const winRate = stats?.winRate ?? 0;
  const matchCount = stats?.matchCount ?? 0;
  const accountLevel = stats?.accountLevel ?? 0;

  const rankValue = RANK_VALUES[competitiveTier] ?? 0;
  const performanceScore = matchCount > 0
    ? calcPerformanceScore(avgKda, hsRate, winRate)
    : 0.5;
  const totalScore = calcTotalScore(rankValue, performanceScore);
  const isSmurf = detectSmurf(accountLevel, avgKda);

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
    accountLevel,
    isSmurf,
  };
}
