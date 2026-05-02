// src/types/index.ts

export interface AgentInfo {
  id: string;
  name: string;
  iconUrl: string;
}

export interface PlayerData {
  gameName: string;
  tagLine: string;
  puuid: string;
  competitiveTier: number; // Riot's tier number (3=Iron1 ... 27=Radiant)
  rankValue: number;       // Our score value (1-40)
  performanceScore: number; // 0.0 to 1.0
  totalScore: number;      // Combined final score
  topAgents: AgentInfo[];  // Top 3 agents by usage count
  matchCount: number;      // Number of competitive matches found
  winRate: number;         // 0.0 to 1.0
  avgKda: number;
  accountLevel: number;    // Account level (used for smurf detection)
  isSmurf: boolean;
}

export type TeamMode =
  | 'simple'
  | 'handicap'
  | 'no-repeat-simple'
  | 'no-repeat-handicap';

export interface HandicapItem {
  star: 1 | 2 | 3;
  description: string;
}

export interface PlayerWithHandicap extends PlayerData {
  handicap?: HandicapItem;
}

export interface TeamResult {
  teamA: PlayerData[];
  teamB: PlayerData[];
  scoreDiff: number;
}

export interface TeamResultWithHandicaps {
  teamA: PlayerWithHandicap[];
  teamB: PlayerWithHandicap[];
  scoreDiff: number;
}

export interface HistoryEntry {
  teamAPuuids: string[];
  teamBPuuids: string[];
  timestamp: number;
}

export interface BanState {
  bannedAgentIds: string[];
  currentTeam: 'A' | 'B';
  bansPerTeam: number;
  teamABansLeft: number;
  teamBBansLeft: number;
}
