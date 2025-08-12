export async function submitAttemptAction(args: { attemptId: number }) {
  // TODO: Replace with real API call
  return {
    status: 200,
    error: false,
    data: { submitted: true },
    message: "Attempt submitted",
  } as const;
}
