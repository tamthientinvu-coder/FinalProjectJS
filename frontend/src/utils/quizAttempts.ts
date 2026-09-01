export function canRetryQuiz(
  submission: { passed: boolean; attemptNo: number },
  maxAttempts: number | null
): boolean {
  return !submission.passed &&
    (maxAttempts === null || submission.attemptNo < maxAttempts);
}
