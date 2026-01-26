import OnHover from "@/components/OnHover";
import { Info } from "lucide-react";
import QuestionCountPreview from "../../QuestionCountPreview";
import { SectionsMetaDataInterface } from "@/utils/api/types";
import { useEffect, useState } from "react";

function getCharByIndex(index: number): string {
  // Convert index to corresponding uppercase character
  return String.fromCharCode(65 + index);
}

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
        {sections.map((s, i) => {
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
                "px-4 py-1 text-xs font-bold whitespace-nowrap` flex items-center gap-2 transition-colors text-white",
                "bg-sky-600 rounded-md py-2 px-6",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              {s?.sectionName}
              <OnHover
                trigger={
                  <Info className="w-4 h-4 text-gray-100 hover:text-gray-600 transition-colors" />
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
              </OnHover>
            </button>
          );
        })}
      </div>
    </div>
  );
}
