import { ShieldQuestion } from "lucide-react";
import TimerChip from "./TimerChip";

export default function TitleWithTimer({
  testName,
  formattedTimeTest,
  formattedTimeSection,
  onTestTimeUp,
  onSectionTimeUp,
}: {
  onTestTimeUp: any;
  onSectionTimeUp: any;
  testName: string;
  formattedTimeTest: number;
  formattedTimeSection: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
          {testName}
        </h1>
      </div>
      <TimerChip
        title="Time Left"
        durationMs={Math.max(0, formattedTimeTest * 60_000)}
        onComplete={onTestTimeUp}
      />
      <TimerChip
        title="Section Time Left"
        durationMs={Math.max(0, formattedTimeSection * 60_000)}
        onComplete={onSectionTimeUp}
      />
    </div>
  );
}
