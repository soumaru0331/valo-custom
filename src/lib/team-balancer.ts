// src/lib/team-balancer.ts
import { PlayerData, TeamMode, TeamResult, HistoryEntry } from '@/types';

export function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [head, ...tail] = arr;
  const withHead = getCombinations(tail, k - 1).map(combo => [head, ...combo]);
  const withoutHead = getCombinations(tail, k);
  return [...withHead, ...withoutHead];
}

function calcRepeatPenalty(
  teamA: PlayerData[],
  teamB: PlayerData[],
  history: HistoryEntry
): number {
  const prevA = new Set(history.teamAPuuids);
  const prevB = new Set(history.teamBPuuids);
  let penalty = 0;

  const countPairs = (team: PlayerData[], prevTeam: Set<string>) => {
    const members = team.map(p => p.puuid).filter(id => prevTeam.has(id));
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        penalty += 5;
      }
    }
  };

  countPairs(teamA, prevA);
  countPairs(teamA, prevB);
  countPairs(teamB, prevA);
  countPairs(teamB, prevB);

  return penalty;
}

/**
 * Balances players into two teams based on the specified mode.
 *
 * DESIGN NOTE: 'handicap' and 'no-repeat-handicap' modes use identical balancing logic
 * to their 'simple' and 'no-repeat-simple' counterparts respectively. The difference
 * is that after balancing, the assignHandicaps() function (in handicap.ts) assigns ☆
 * handicaps to strong players separately. This balancer only handles team composition.
 */
export function balanceTeams(
  players: PlayerData[],
  mode: TeamMode,
  history?: HistoryEntry
): TeamResult {
  const n = players.length;
  const sizeA = Math.floor(n / 2);
  const combinations = getCombinations(players, sizeA);

  let bestResult: TeamResult | null = null;
  let bestEval = Infinity;

  for (const teamA of combinations) {
    const teamASet = new Set(teamA.map(p => p.puuid));
    const teamB = players.filter(p => !teamASet.has(p.puuid));

    const scoreA = teamA.reduce((s, p) => s + p.totalScore, 0);
    const scoreB = teamB.reduce((s, p) => s + p.totalScore, 0);
    const diff = Math.abs(scoreA - scoreB);

    let penalty = 0;
    if (history && (mode === 'no-repeat-simple' || mode === 'no-repeat-handicap')) {
      penalty = calcRepeatPenalty(teamA, teamB, history);
    }

    const evalScore = diff + penalty;
    if (evalScore < bestEval) {
      bestEval = evalScore;
      bestResult = { teamA, teamB, scoreDiff: diff };
    }
  }

  return bestResult!;
}
