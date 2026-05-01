// src/__tests__/team-balancer.test.ts
import { balanceTeams, getCombinations } from '@/lib/team-balancer';
import { PlayerData, HistoryEntry } from '@/types';

function makePlayer(id: string, score: number): PlayerData {
  return {
    gameName: id, tagLine: 'JP1', puuid: id,
    competitiveTier: 12, rankValue: score,
    performanceScore: 0, totalScore: score,
    topAgents: [], matchCount: 50,
    winRate: 0.5, avgKda: 2.0, isSmurf: false,
  };
}

describe('getCombinations', () => {
  it('returns correct number of combinations', () => {
    const result = getCombinations([1, 2, 3], 2);
    expect(result).toHaveLength(3);
  });

  it('contains correct combinations', () => {
    const result = getCombinations([1, 2, 3], 2);
    expect(result).toContainEqual([1, 2]);
    expect(result).toContainEqual([1, 3]);
    expect(result).toContainEqual([2, 3]);
  });

  it('handles k=0', () => {
    expect(getCombinations([1, 2], 0)).toEqual([[]]);
  });

  it('returns empty when k > arr length', () => {
    expect(getCombinations([1], 2)).toEqual([]);
  });
});

describe('balanceTeams simple', () => {
  it('splits 4 players into 2 teams of equal size', () => {
    const players = [
      makePlayer('a', 40), makePlayer('b', 30),
      makePlayer('c', 20), makePlayer('d', 10),
    ];
    const result = balanceTeams(players, 'simple');
    expect(result.teamA).toHaveLength(2);
    expect(result.teamB).toHaveLength(2);
  });

  it('finds minimum score difference for 4 players', () => {
    const players = [
      makePlayer('a', 40), makePlayer('b', 30),
      makePlayer('c', 20), makePlayer('d', 10),
    ];
    const result = balanceTeams(players, 'simple');
    // best split: [40,10] vs [30,20] → diff=0
    expect(result.scoreDiff).toBe(0);
  });

  it('handles odd number of players (5 players)', () => {
    const players = [
      makePlayer('a', 10), makePlayer('b', 10),
      makePlayer('c', 10), makePlayer('d', 10), makePlayer('e', 10),
    ];
    const result = balanceTeams(players, 'simple');
    const total = result.teamA.length + result.teamB.length;
    expect(total).toBe(5);
    expect(Math.abs(result.teamA.length - result.teamB.length)).toBe(1);
  });

  it('returns all players across both teams', () => {
    const players = [
      makePlayer('a', 10), makePlayer('b', 20),
      makePlayer('c', 30), makePlayer('d', 40),
    ];
    const result = balanceTeams(players, 'simple');
    const allPuuids = [...result.teamA, ...result.teamB].map(p => p.puuid).sort();
    expect(allPuuids).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('balanceTeams no-repeat', () => {
  it('avoids previous teammates when all scores are equal', () => {
    const p1 = makePlayer('p1', 10);
    const p2 = makePlayer('p2', 10);
    const p3 = makePlayer('p3', 10);
    const p4 = makePlayer('p4', 10);
    const history: HistoryEntry = {
      teamAPuuids: ['p1', 'p2'],
      teamBPuuids: ['p3', 'p4'],
      timestamp: Date.now(),
    };
    const result = balanceTeams([p1, p2, p3, p4], 'no-repeat-simple', history);
    const teamAPuuids = result.teamA.map(p => p.puuid);
    // p1 and p2 should NOT be on the same team
    const p1InA = teamAPuuids.includes('p1');
    const p2InA = teamAPuuids.includes('p2');
    expect(p1InA).not.toBe(p2InA);
  });
});
