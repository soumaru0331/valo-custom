export function calcPerformanceScore(
  avgKd: number,
  hsRate: number,
  winRate: number
): number {
  const kdNorm = Math.min(avgKd / 2.5, 1.0); // KD 2.5を上限として正規化
  return kdNorm * 0.4 + hsRate * 0.3 + winRate * 0.3;
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
