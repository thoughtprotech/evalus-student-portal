import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import {
  GetLanguagesResponse,
  GetQuestionByIdResponse,
  QuestionsMetaDataInterface,
} from "@/utils/api/types";
import { useEffect, useState } from "react";

export default function AssessmentAreaHeader({
  question,
  currentIndex,
}: {
  question: QuestionsMetaDataInterface;
  currentIndex: number;
}) {
  const [language, setLanguage] =
    useState<{ value: string; label: string }[]>();

  const fetchLanguages = async () => {
    const res = await fetchLanguagesAction();

    if (res.status === 200) {
      const options = res.data?.map((lan) => ({
        value: lan.language,
        label: lan.language,
      }));

      setLanguage(options);
    }
  };

  const handleLanguageChange = async (language: any) => {
    console.log({ language });

    // TODO: Implement language change
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  return (
    <div className="w-full flex flex-col gap-2 md:flex md:flex-row items-center justify-between font-semibold border-b border-b-gray-300 pb-2">
      <div>
        <h1 className="text-sm text-gray-600">
          Question {currentIndex + 1} -{" "}
          {question?.questionType}
        </h1>
      </div>
      <div className="flex gap-3 items-center">
        <div className="flex gap-3 text-xs md:text-sm">
          <h1 className="text-green-500">Mark(s)</h1>
          <h1>{question.marks}</h1>
        </div>
        <h1 className="text-gray-500">|</h1>
        <div className="flex gap-3 text-xs md:text-sm pr-1">
          <h1 className="text-red-500 text-nowrap">Negative Mark(s)</h1>
          <h1>{question.negativeMarks}</h1>
        </div>
        <h1 className="text-gray-500">|</h1>
        <div>
          <select
            className="border border-gray-300 px-4 py-1 rounded-md shadow-md cursor-pointer text-sm md:text:base"
            onChange={(e) => {
              handleLanguageChange(e.target.value);
            }}
          >
            {language?.map((lan) => {
              return (
                <option value={lan.value} key={lan.value}>
                  {lan.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}
