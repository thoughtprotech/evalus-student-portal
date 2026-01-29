import { Info, ListChecks } from "lucide-react";
import ActionButton from "./ActionButton";
import WelcomeChip from "./WelcomeChip";

export default function ActionsBar({
  instructionsTitle,
  onOpenInstructions,
  onOpenQuestions,
  userName,
}: {
  instructionsTitle: string;
  onOpenInstructions: () => void;
  onOpenQuestions: () => void;
  userName: string;
}) {
  return (
    <div className="flex items-start justify-end bg-black w-full gap-2">
      <div className="flex items-center">
        <ActionButton
          label="Show Questions"
          title="Show questions"
          icon={<ListChecks className="w-4 h-4 text-green-500" aria-hidden />}
          onClick={onOpenQuestions}
        />
        <ActionButton
          label="Instructions"
          title={instructionsTitle}
          icon={<Info className="w-4 h-4 text-blue-500" aria-hidden />}
          onClick={onOpenInstructions}
        />
      </div>
    </div>
  );
}
