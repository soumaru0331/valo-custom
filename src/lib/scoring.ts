export function calcPerformanceScore(
  avgKda: number,
  hsRate: number,
  winRate: number
): number {
  const kdaNorm = Math.min(avgKda / 5.0, 1.0);
  return kdaNorm * 0.4 + hsRate * 0.3 + winRate * 0.3;
}

export function calcTotalScore(rankValue: number, performanceScore: number): number {
  return rankValue * 0.7 + performanceScore * 0.3 * 40;
}

export function detectSmurf(
  matchCount: number,
  winRate: number,
  avgKda: number
): boolean {
  const fewMatches = matchCount < 20;
  const highWinRate = winRate >= 0.70;
  const highKda = avgKda >= 3.0;
  const conditionsMet = [fewMatches, highWinRate, highKda].filter(Boolean).length;
  return conditionsMet >= 2;
}
