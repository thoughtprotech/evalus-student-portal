import { TextOrHtml } from "@/components/TextOrHtml";
import { QUESTION_TYPES } from "@/utils/constants";
import { Key } from "react";

export default function renderOptions(option: any, type: string) {
  if (!option) return <div>No question available.</div>;

  const options = JSON.parse(option);

  switch (type) {
    case QUESTION_TYPES.SINGLE_MCQ:
    case QUESTION_TYPES.MULTIPLE_MCQ:
      return (
        <div className="flex flex-col gap-2">
          <div>
            <h1 className="text-gray-600 font-bold text-sm">Options</h1>
          </div>
          {options.map((option: any, idx: number) => (
            <div
              key={idx}
              className="rounded-md px-4 py-1 text-sm sm:text-base flex gap-2"
            >
              <span className="text-gray-600">{idx + 1}.</span>
              <TextOrHtml content={option} />
            </div>
          ))}
        </div>
      );

    case QUESTION_TYPES.MATCH_PAIRS_SINGLE:
    case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE:
      // options is expected to be [columnA: string[], columnB: string[]]
      const [colA, colB] = options;
      return (
        <div className="w-full flex gap-8">
          <div className="flex flex-col gap-2">
            {colA.map((item: string, idx: Key | null | undefined) => (
              <div
                key={idx}
                className="border border-indigo-600 rounded-md px-4 py-2 text-sm sm:text-base"
              >
                <TextOrHtml content={item} />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {colB.map((item: string, idx: Key | null | undefined) => (
              <div
                key={idx}
                className="border rounded-md px-4 py-2 text-sm sm:text-base"
              >
                <TextOrHtml content={item} />
              </div>
            ))}
          </div>
        </div>
      );

    case QUESTION_TYPES.WRITE_UP:
    case QUESTION_TYPES.NUMERIC:
    case QUESTION_TYPES.FILL_ANSWER:
      return <div></div>;

    case QUESTION_TYPES.TRUEFALSE:
      return (
        <div className="flex flex-col gap-2 text-sm sm:text-base">
          <div>True</div>
          <div>False</div>
        </div>
      );

    default:
      return <div>Unknown question type.</div>;
  }
}
