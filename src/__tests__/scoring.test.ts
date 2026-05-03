import { calcPerformanceScore, calcTotalScore, detectSmurf } from '@/lib/scoring';

describe('calcPerformanceScore', () => {
  it('returns 0 for KD=0', () => {
    expect(calcPerformanceScore(0)).toBe(0);
  });

  it('returns 1.0 for KD >= 2.5', () => {
    expect(calcPerformanceScore(2.5)).toBeCloseTo(1.0);
    expect(calcPerformanceScore(5)).toBeCloseTo(1.0);
  });

  it('clamps KD above 2.5 to 1.0', () => {
    expect(calcPerformanceScore(10)).toBeCloseTo(1.0);
  });

  it('returns correct normalized result', () => {
    // KD=1.25 → 1.25/2.5 = 0.5
    expect(calcPerformanceScore(1.25)).toBeCloseTo(0.5);
  });
});

describe('calcTotalScore', () => {
  it('combines rank value and performance score', () => {
    // rankValue=10, perfScore=0.5 → 10*0.7 + 0.5*0.3*40 = 7 + 6 = 13
    expect(calcTotalScore(10, 0.5)).toBeCloseTo(13);
  });

  it('returns rank value only when perf score is 0', () => {
    // 20*0.7 + 0*0.3*40 = 14
    expect(calcTotalScore(20, 0)).toBeCloseTo(14);
  });

  it('scales correctly for Radiant', () => {
    // rankValue=40, perfScore=1.0 → 40*0.7 + 1.0*0.3*40 = 28 + 12 = 40
    expect(calcTotalScore(40, 1.0)).toBeCloseTo(40);
  });
});

describe('detectSmurf', () => {
  it('flags account with few matches + high winrate + high KDA', () => {
    expect(detectSmurf(15, 0.75, 3.5)).toBe(true);
  });

  it('does not flag normal account', () => {
    expect(detectSmurf(80, 0.52, 1.8)).toBe(false);
  });

  it('does not flag if only one condition met', () => {
    expect(detectSmurf(15, 0.52, 1.8)).toBe(false); // only low matches
    expect(detectSmurf(80, 0.80, 1.8)).toBe(false); // only high winrate
    expect(detectSmurf(80, 0.52, 4.0)).toBe(false); // only high KDA
  });

  it('flags with 2 of 3 conditions met', () => {
    expect(detectSmurf(15, 0.80, 1.8)).toBe(true); // low matches + high winrate
    expect(detectSmurf(80, 0.80, 4.0)).toBe(true); // high winrate + high KDA
  });
});
