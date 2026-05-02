// src/lib/riot-api.ts
// SERVER-SIDE ONLY — do not import in client components

import { PlayerData } from '@/types';
import { RANK_VALUES } from '@/data/ranks';
import { calcTotalScore } from '@/lib/scoring';

const API_KEY = process.env.RIOT_API_KEY ?? '';
const ACCOUNT_BASE = 'https://asia.api.riotgames.com';

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

// Verify player exists via Riot Account API, then build PlayerData with manually chosen rank.
export async function verifyAndBuildPlayer(
  gameName: string,
  tagLine: string,
  competitiveTier: number
): Promise<PlayerData> {
  const puuid = await getPuuid(gameName, tagLine);
  const rankValue = RANK_VALUES[competitiveTier] ?? 0;
  const totalScore = calcTotalScore(rankValue, 0.5); // performance defaults to mid (0.5)

  return {
    gameName,
    tagLine,
    puuid,
    competitiveTier,
    rankValue,
    performanceScore: 0.5,
    totalScore,
    topAgents: [],
    matchCount: 0,
    winRate: 0,
    avgKda: 0,
    isSmurf: false,
  };
}
