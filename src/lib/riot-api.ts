// src/lib/riot-api.ts
// SERVER-SIDE ONLY — do not import in client components

import { AgentInfo, PlayerData } from '@/types';
import { RANK_VALUES } from '@/data/ranks';
import { calcPerformanceScore, calcTotalScore, detectSmurf } from '@/lib/scoring';

const API_KEY = process.env.RIOT_API_KEY!;
const ACCOUNT_BASE = 'https://asia.api.riotgames.com';
const MATCH_BASE = 'https://ap.api.riotgames.com';
const AGENT_API = 'https://valorant-api.com/v1/agents?isPlayableCharacter=true';

interface RiotMatchListEntry {
  matchId: string;
  gameStartTimeMillis: number;
  queueId: string;
}

interface RiotMatchPlayer {
  puuid: string;
  characterId: string;
  teamId: string;
  competitiveTier: number;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
  };
}

interface RiotTeam {
  teamId: string;
  won: boolean;
}

interface RiotRoundPlayerStat {
  puuid: string;
  damage: Array<{ headshots: number; bodyshots: number; legshots: number }>;
}

interface RiotMatch {
  matchInfo: { matchId: string; queueId: string };
  players: RiotMatchPlayer[];
  teams: RiotTeam[];
  roundResults: Array<{ playerStats: RiotRoundPlayerStat[] }>;
}

interface AgentApiItem {
  uuid: string;
  displayName: string;
  displayIcon: string;
}

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
  const url = `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const res = await riotFetch(url);
  if (!res.ok) throw new Error(`Player not found: ${gameName}#${tagLine}`);
  const data = await res.json();
  return data.puuid as string;
}

async function getMatchIds(puuid: string): Promise<string[]> {
  const url = `${MATCH_BASE}/val/match/v1/matchlists/by-puuid/${puuid}`;
  const res = await riotFetch(url);
  if (!res.ok) throw new Error('Failed to fetch match list');
  const data = await res.json();
  const history: RiotMatchListEntry[] = data.history ?? [];
  const competitive = history.filter(m => m.queueId === 'competitive');
  return competitive.slice(0, 50).map(m => m.matchId);
}

async function getMatchDetail(matchId: string): Promise<RiotMatch> {
  const url = `${MATCH_BASE}/val/match/v1/matches/${matchId}`;
  const res = await riotFetch(url);
  if (!res.ok) throw new Error(`Failed to fetch match ${matchId}`);
  return res.json() as Promise<RiotMatch>;
}

async function fetchMatchDetailsBatched(matchIds: string[]): Promise<RiotMatch[]> {
  const results: RiotMatch[] = [];
  const BATCH = 5;
  for (let i = 0; i < matchIds.length; i += BATCH) {
    const batch = matchIds.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(id => getMatchDetail(id)));
    results.push(...batchResults);
  }
  return results;
}

async function getAgentIconMap(): Promise<Record<string, AgentInfo>> {
  const res = await fetch(AGENT_API, { next: { revalidate: 3600 } });
  const data = await res.json();
  const map: Record<string, AgentInfo> = {};
  for (const agent of data.data as AgentApiItem[]) {
    map[agent.uuid.toLowerCase()] = {
      id: agent.uuid,
      name: agent.displayName,
      iconUrl: agent.displayIcon,
    };
  }
  return map;
}

function computeHeadshotRate(matches: RiotMatch[], puuid: string): number {
  let totalHS = 0;
  let totalShots = 0;
  for (const match of matches) {
    for (const round of match.roundResults) {
      const pStat = round.playerStats.find(p => p.puuid === puuid);
      if (!pStat) continue;
      for (const dmg of pStat.damage) {
        totalHS += dmg.headshots;
        totalShots += dmg.headshots + dmg.bodyshots + dmg.legshots;
      }
    }
  }
  return totalShots > 0 ? totalHS / totalShots : 0;
}

export async function fetchPlayerData(gameName: string, tagLine: string): Promise<PlayerData> {
  const puuid = await getPuuid(gameName, tagLine);
  const matchIds = await getMatchIds(puuid);
  const matchCount = matchIds.length;

  if (matchCount === 0) {
    return {
      gameName, tagLine, puuid,
      competitiveTier: 0, rankValue: 0,
      performanceScore: 0, totalScore: 0,
      topAgents: [], matchCount: 0,
      winRate: 0, avgKda: 0, isSmurf: false,
    };
  }

  const matches = await fetchMatchDetailsBatched(matchIds);
  const agentMap = await getAgentIconMap();

  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  const agentUsage: Record<string, number> = {};
  let latestTier = 0;

  for (const match of matches) {
    const player = match.players.find(p => p.puuid === puuid);
    if (!player) continue;

    const team = match.teams.find(t => t.teamId === player.teamId);
    if (team?.won) wins++;

    totalKills += player.stats.kills;
    totalDeaths += player.stats.deaths;
    totalAssists += player.stats.assists;

    const agentId = player.characterId.toLowerCase();
    agentUsage[agentId] = (agentUsage[agentId] ?? 0) + 1;

    if (player.competitiveTier > latestTier) latestTier = player.competitiveTier;
  }

  const winRate = wins / matches.length;
  const avgKda = (totalKills + totalAssists) / Math.max(totalDeaths, 1);
  const hsRate = computeHeadshotRate(matches, puuid);
  const performanceScore = calcPerformanceScore(avgKda, hsRate, winRate);
  const rankValue = RANK_VALUES[latestTier] ?? 0;
  const totalScore = calcTotalScore(rankValue, performanceScore);

  const topAgents = Object.entries(agentUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => agentMap[id] ?? { id, name: id, iconUrl: '' });

  return {
    gameName, tagLine, puuid,
    competitiveTier: latestTier,
    rankValue,
    performanceScore,
    totalScore,
    topAgents,
    matchCount,
    winRate,
    avgKda,
    isSmurf: detectSmurf(matchCount, winRate, avgKda),
  };
}
