// src/__tests__/history.test.ts
import { saveHistory, loadHistory, clearHistory } from '@/lib/history';
import { TeamResult } from '@/types';

// Mock localStorage for Node test environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  length: 0,
  key: () => null,
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

function makeTeamResult(): TeamResult {
  const makePlayer = (id: string) => ({
    gameName: id, tagLine: 'JP1', puuid: id,
    competitiveTier: 12, rankValue: 10,
    performanceScore: 0.5, totalScore: 12,
    topAgents: [], matchCount: 50,
    winRate: 0.5, avgKda: 2.0, isSmurf: false,
  });
  return {
    teamA: [makePlayer('p1'), makePlayer('p2')],
    teamB: [makePlayer('p3'), makePlayer('p4')],
    scoreDiff: 0,
  };
}

describe('history', () => {
  beforeEach(() => { clearHistory(); });

  it('returns null when no history exists', () => {
    expect(loadHistory()).toBeNull();
  });

  it('saves and loads history correctly', () => {
    const result = makeTeamResult();
    saveHistory(result);
    const loaded = loadHistory();
    expect(loaded).not.toBeNull();
    expect(loaded!.teamAPuuids).toEqual(['p1', 'p2']);
    expect(loaded!.teamBPuuids).toEqual(['p3', 'p4']);
  });

  it('history includes timestamp', () => {
    const before = Date.now();
    saveHistory(makeTeamResult());
    const loaded = loadHistory();
    expect(loaded!.timestamp).toBeGreaterThanOrEqual(before);
    expect(loaded!.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('overwrites previous history with new save', () => {
    saveHistory(makeTeamResult());
    const result2: TeamResult = {
      teamA: [{ gameName: 'x1', tagLine: 'JP1', puuid: 'x1', competitiveTier: 12, rankValue: 10, performanceScore: 0.5, totalScore: 12, topAgents: [], matchCount: 50, winRate: 0.5, avgKda: 2.0, isSmurf: false }],
      teamB: [{ gameName: 'x2', tagLine: 'JP1', puuid: 'x2', competitiveTier: 12, rankValue: 10, performanceScore: 0.5, totalScore: 12, topAgents: [], matchCount: 50, winRate: 0.5, avgKda: 2.0, isSmurf: false }],
      scoreDiff: 0,
    };
    saveHistory(result2);
    const loaded = loadHistory();
    expect(loaded!.teamAPuuids).toEqual(['x1']);
  });

  it('clearHistory removes saved data', () => {
    saveHistory(makeTeamResult());
    clearHistory();
    expect(loadHistory()).toBeNull();
  });

  it('loadHistory returns null for corrupted data', () => {
    mockStorage['valo-custom-history'] = 'not-valid-json{{{';
    expect(loadHistory()).toBeNull();
  });
});
