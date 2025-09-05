import OnHover from "@/components/OnHover";
import { Info } from "lucide-react";
import QuestionCountPreview from "../../QuestionCountPreview";
import { SectionsMetaDataInterface } from "@/utils/api/types";

export default function SectionTabs({
  sections,
  activeSectionId,
  onSelectSection,
}: {
  sections: SectionsMetaDataInterface[];
  activeSectionId: number | null;
  onSelectSection?: (section: SectionsMetaDataInterface) => void;
}) {
  if (!sections.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 relative">
        {sections.map((s) => {
          const isActive = s.sectionId === activeSectionId;
          return (
            <button
              key={s.sectionId}
              type="button"
              onClick={() => {
                if (onSelectSection) {
                  onSelectSection(s);
                }
              }}
              className={[
                "px-4 py-1 text-sm font-bold whitespace-nowrap` flex items-center gap-2 rounded transition-colors text-white",
                isActive ? "bg-green-700" : "bg-blue-700",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {s.sectionName}
              {/* <OnHover
                trigger={
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                }
                dropdownClassName="w-96"
              >
                <QuestionCountPreview
                  answeredCount={0}
                  unansweredCount={0}
                  notVisitedCount={12}
                  reviewCount={0}
                  ansToReviewCount={0}
                />
              </OnHover> */}
            </button>
          );
        })}
      </div>
    </div>
  );
}
