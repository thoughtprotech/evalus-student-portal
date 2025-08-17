import QuestionEditSkeleton from "./QuestionEditSkeleton";

// Route-level loading UI (Next.js will render this during suspense/navigation)
export default function Loading() {
  return <QuestionEditSkeleton />;
}
