// src/__tests__/handicap.test.ts
import { assignHandicaps, getHandicapStar } from '@/lib/handicap';
import { PlayerData, TeamResult } from '@/types';

function makePlayer(id: string, score: number): PlayerData {
  return {
    gameName: id, tagLine: 'JP1', puuid: id,
    competitiveTier: 12, rankValue: score,
    performanceScore: 0, totalScore: score,
    topAgents: [], matchCount: 50,
    winRate: 0.5, avgKda: 2.0, isSmurf: false,
  };
}

describe('getHandicapStar', () => {
  it('returns null for diff under 5', () => {
    expect(getHandicapStar(4)).toBeNull();
    expect(getHandicapStar(0)).toBeNull();
  });

  it('returns 1 for diff 5-9', () => {
    expect(getHandicapStar(5)).toBe(1);
    expect(getHandicapStar(9)).toBe(1);
  });

  it('returns 2 for diff 10-14', () => {
    expect(getHandicapStar(10)).toBe(2);
    expect(getHandicapStar(14)).toBe(2);
  });

  it('returns 3 for diff 15+', () => {
    expect(getHandicapStar(15)).toBe(3);
    expect(getHandicapStar(30)).toBe(3);
  });
});

describe('assignHandicaps', () => {
  it('assigns no handicap when score diff is less than 5', () => {
    const result: TeamResult = {
      teamA: [makePlayer('a', 20), makePlayer('b', 10)],
      teamB: [makePlayer('c', 18), makePlayer('d', 12)],
      scoreDiff: 0,
    };
    const out = assignHandicaps(result);
    expect(out.teamA.every(p => !p.handicap)).toBe(true);
    expect(out.teamB.every(p => !p.handicap)).toBe(true);
  });

  it('assigns handicap to top player of stronger team when diff >= 5', () => {
    // teamA total=40, teamB total=25, diff=15
    const result: TeamResult = {
      teamA: [makePlayer('a', 30), makePlayer('b', 10)],
      teamB: [makePlayer('c', 15), makePlayer('d', 10)],
      scoreDiff: 15,
    };
    const out = assignHandicaps(result);
    // teamA is stronger, top player (score 30) should have handicap
    const topAPlayer = out.teamA.find(p => p.puuid === 'a');
    expect(topAPlayer?.handicap).toBeDefined();
    expect(topAPlayer?.handicap?.star).toBe(3); // diff=15 → star 3
  });

  it('assigns no handicap to weaker team', () => {
    const result: TeamResult = {
      teamA: [makePlayer('a', 30), makePlayer('b', 10)],
      teamB: [makePlayer('c', 15), makePlayer('d', 10)],
      scoreDiff: 15,
    };
    const out = assignHandicaps(result);
    expect(out.teamB.every(p => !p.handicap)).toBe(true);
  });

  it('assigns correct number of handicaps based on score diff', () => {
    // diff=5 → 1 handicap to top 1 player of stronger team
    const result: TeamResult = {
      teamA: [makePlayer('a', 20), makePlayer('b', 15), makePlayer('c', 10)],
      teamB: [makePlayer('d', 18), makePlayer('e', 14), makePlayer('f', 8)],
      scoreDiff: 5,
    };
    const out = assignHandicaps(result);
    const handicappedA = out.teamA.filter(p => p.handicap);
    expect(handicappedA).toHaveLength(1);
  });

  it('preserves all players in output', () => {
    const result: TeamResult = {
      teamA: [makePlayer('a', 20), makePlayer('b', 10)],
      teamB: [makePlayer('c', 15), makePlayer('d', 10)],
      scoreDiff: 5,
    };
    const out = assignHandicaps(result);
    expect(out.teamA).toHaveLength(2);
    expect(out.teamB).toHaveLength(2);
  });
});
