export default function WelcomeChip({ userName }: { userName: string }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-5 h-5 md:w-10 md:h-10 bg-indigo-200 text-indigo-800 rounded-full flex items-center justify-center shadow-inner font-bold">
        U
      </div>
      {/* <h1 className="text-sm font-semibold text-gray-900">
        <span className="text-indigo-700">{userName}</span>
      </h1> */}
    </div>
  );
}
