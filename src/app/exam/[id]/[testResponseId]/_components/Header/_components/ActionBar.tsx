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
    <div className="flex flex-col items-end justify-between gap-2">
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center">
          <ActionButton
            label="Instructions"
            title={instructionsTitle}
            icon={<Info className="w-4 h-4" aria-hidden />}
            onClick={onOpenInstructions}
          />
          <ActionButton
            label="Show Questions"
            title="Show questions"
            icon={<ListChecks className="w-4 h-4" aria-hidden />}
            onClick={onOpenQuestions}
          />
        </div>
        <WelcomeChip userName={userName} />
      </div>
    </div>
  );
}
