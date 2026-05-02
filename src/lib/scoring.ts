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
  accountLevel: number,
  avgKda: number,
): boolean {
  return accountLevel > 0 && accountLevel < 100 && avgKda >= 2.0;
}
