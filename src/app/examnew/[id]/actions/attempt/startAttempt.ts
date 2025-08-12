export async function startAttemptAction(testId: number) {
  // TODO: Replace with real API call
  return {
    status: 200,
    error: false,
    data: {
      attemptId: Math.floor(Date.now() / 1000),
      timeLeftMs: 45 * 60 * 1000,
      answers: [],
      testId,
    },
    message: "Attempt started",
  } as const;
}
