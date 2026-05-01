// src/lib/history.ts
import { TeamResult, HistoryEntry } from '@/types';

const HISTORY_KEY = 'valo-custom-history';

export function saveHistory(result: TeamResult): void {
  const entry: HistoryEntry = {
    teamAPuuids: result.teamA.map(p => p.puuid),
    teamBPuuids: result.teamB.map(p => p.puuid),
    timestamp: Date.now(),
  };
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entry));
}

export function loadHistory(): HistoryEntry | null {
  const raw = localStorage.getItem(HISTORY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HistoryEntry;
  } catch {
    return null;
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
