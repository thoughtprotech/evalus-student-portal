import { fetchLanguagesAction } from "@/app/actions/dashboard/questions/fetchLanguages";
import {
  GetLanguagesResponse,
  GetQuestionByIdResponse,
  QuestionsMetaDataInterface,
  TestSettingsInterface,
} from "@/utils/api/types";
import { QUESTION_STATUS } from "@/utils/constants";
import { useEffect, useState } from "react";

export default function AssessmentAreaHeader({
  question,
  currentIndex,
  settings,
}: {
  question: QuestionsMetaDataInterface;
  currentIndex: number;
  settings: TestSettingsInterface;
}) {
  // const [language, setLanguage] =
  //   useState<{ value: string; label: string }[]>();

  // const fetchLanguages = async () => {
  //   const res = await fetchLanguagesAction();

  //   if (res.status === 200) {
  //     const options = res.data?.map((lan) => ({
  //       value: lan.language,
  //       label: lan.language,
  //     }));

  //     setLanguage(options);
  //   }
  // };

  const handleLanguageChange = async (language: any) => {
    console.log({ language });

    // TODO: Implement language change
  };

  // useEffect(() => {
  //   fetchLanguages();
  // }, []);

  return (
    <div className="w-full flex flex-col gap-2 md:flex md:flex-row items-center justify-between font-semibold border-b border-b-gray-300 pb-2">
      <div className="flex gap-3 items-center">
        <div>
          <h1 className="text-sm text-black">
            Question <span className="text-lg">{currentIndex + 1}</span>
            {/* {question?.questionTypeName} */}
          </h1>
        </div>
        {/* {(question?.status === QUESTION_STATUS.TO_REVIEW ||
          question?.status === QUESTION_STATUS.ANSWERED_TO_REVIEW) && (
          <div className="bg-purple-600 rounded-md px-2 py-0.5">
            <h1 className="text-sm text-white">Marked For Review</h1>
          </div>
        )} */}
      </div>
      {Boolean(settings.displayMarksDuringTest) && (
        <div className="flex gap-3 items-center">
          <div className="flex gap-3 text-xs md:text-sm">
            <h1 className="text-green-500">Mark(s)</h1>
            <h1>{question.marks}</h1>
          </div>
          <div className="flex gap-3 text-xs md:text-sm pr-1">
            <h1 className="text-red-500 text-nowrap">Negative Mark(s)</h1>
            <h1>{question.negativeMarks}</h1>
          </div>
        </div>
      )}
    </div>
  );
}
