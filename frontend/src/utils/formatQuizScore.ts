export function formatQuizScore(score: number | null): string {
  return score === null ? "Chưa có" : `${score}/100`;
}
