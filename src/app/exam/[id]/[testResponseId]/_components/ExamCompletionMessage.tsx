import React from "react";
import { CheckCircle, Sparkles } from "lucide-react";

interface ExamCompletionMessageProps {
  message?: string;
}

const ExamCompletionMessage: React.FC<ExamCompletionMessageProps> = ({
  message,
}) => {
  const defaultMessage =
    "🎉 Congratulations! You’ve completed the exam. Great job on your effort and focus!";

  return (
    <div className="flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-2xl p-10 shadow-lg max-w-lg mx-auto transition-all">
      <div className="relative mb-6">
        <div className="absolute -inset-2 bg-indigo-300/20 blur-2xl rounded-full animate-pulse" />
        <CheckCircle className="w-16 h-16 text-green-600 relative z-10" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Exam Completed</h2>
      <p className="text-gray-600 text-base leading-relaxed">
        {message || defaultMessage}
      </p>
      <div className="flex items-center gap-2 mt-6 text-indigo-600 font-medium">
        <Sparkles className="w-4 h-4 animate-spin-slow" />
        <span>Keep up the great work!</span>
      </div>
      <div className="mt-4 text-gray-500">
        <h1 className="text-xs">You will be redirected in 5 seconds</h1>
      </div>
    </div>
  );
};

export default ExamCompletionMessage;
