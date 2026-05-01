// src/lib/handicap.ts
import { TeamResult, TeamResultWithHandicaps, PlayerWithHandicap, PlayerData } from '@/types';
import { pickRandomHandicap } from '@/data/handicaps';

export function getHandicapStar(scoreDiff: number): 1 | 2 | 3 | null {
  if (scoreDiff >= 15) return 3;
  if (scoreDiff >= 10) return 2;
  if (scoreDiff >= 5) return 1;
  return null;
}

function getHandicapCount(scoreDiff: number): number {
  if (scoreDiff >= 15) return 3;
  if (scoreDiff >= 10) return 2;
  if (scoreDiff >= 5) return 1;
  return 0;
}

export function assignHandicaps(result: TeamResult): TeamResultWithHandicaps {
  const { teamA, teamB, scoreDiff } = result;

  const scoreA = teamA.reduce((s, p) => s + p.totalScore, 0);
  const scoreB = teamB.reduce((s, p) => s + p.totalScore, 0);
  const strongerIsA = scoreA >= scoreB;

  const star = getHandicapStar(scoreDiff);
  const count = getHandicapCount(scoreDiff);

  const addHandicaps = (players: PlayerData[], isStronger: boolean): PlayerWithHandicap[] => {
    if (!star || !isStronger) return players.map(p => ({ ...p }));
    const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
    return sorted.map((p, i) => ({
      ...p,
      handicap: i < count ? pickRandomHandicap(star) : undefined,
    }));
  };

  return {
    teamA: addHandicaps(teamA, strongerIsA),
    teamB: addHandicaps(teamB, !strongerIsA),
    scoreDiff,
  };
}
