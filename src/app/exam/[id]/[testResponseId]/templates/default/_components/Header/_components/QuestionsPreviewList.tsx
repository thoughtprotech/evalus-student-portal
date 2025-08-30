import { TextOrHtml } from "@/components/TextOrHtml";
import { SectionsMetaDataInterface } from "@/utils/api/types";

export default function QuestionsPreviewList({
  sections,
  currentSectionId,
}: {
  sections: SectionsMetaDataInterface[];
  currentSectionId: number | null | undefined;
}) {
  const section =
    sections.find((s) => s.sectionId === currentSectionId) ?? sections[0];

  if (!section) {
    return <div className="text-sm text-gray-600">No sections available.</div>;
  }

  return (
    <div className="h-full overflow-y-auto text-left">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            {section.sectionName}
          </h3>
          <div className="text-xs text-gray-500">
            Min {section.minDuration}m · Max {section.maxDuration}m
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {section.questions.map((q, idx) => (
          <li
            key={q.questionId}
            className="rounded-md border border-gray-200 p-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800 flex gap-1 items-start">
                Q{idx + 1}: <TextOrHtml content={q.questionText.trim()} />
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-600">
                {q.status}
              </span>
            </div>

            {q.options?.length ? (
              <div className="mt-1 text-xs text-gray-700">
                {q.options.map((o, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="font-semibold text-gray-800">
                      {String.fromCharCode(65 + i)})
                    </span>
                    <div className="text-gray-700">
                      <TextOrHtml content={o.optionText} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
