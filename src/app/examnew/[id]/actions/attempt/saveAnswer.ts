type SaveItem = { questionId: number; answer: string; status: string };

export async function saveAnswerAction(args: { attemptId: number; items: SaveItem[] }) {
  // TODO: Replace with real API call
  // Simulate a tiny delay
  await new Promise((r) => setTimeout(r, 5));
  return {
    status: 200,
    error: false,
    data: { saved: args.items.length },
    message: "Answers saved",
  } as const;
}
