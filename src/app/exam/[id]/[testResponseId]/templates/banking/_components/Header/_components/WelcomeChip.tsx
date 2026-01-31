import { User } from "lucide-react";

export default function WelcomeChip({ userName }: { userName: string }) {
  return (
    <div className="flex items-center space-x-2 bg-blue-200/50 p-2">
      <div className="w-5 h-5 md:w-12 md:h-12 bg-indigo-200 text-indigo-800 rounded-sm flex items-center justify-center shadow-inner font-bold">
        <User className="w-3 h-3 md:w-6 md:h-6" />
      </div>
      <h1 className="text-sm font-semibold text-gray-900">
        Welcome <span className="text-indigo-700">{userName}</span>
      </h1>
    </div>
  );
}
