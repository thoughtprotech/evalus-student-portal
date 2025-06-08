"use server";

import { apiHandler } from "@/utils/api/client";
import { ApiResponse, GetQuestionListResponse } from "@/utils/api/types";
import { endpoints } from "@/utils/api/endpoints";

const mockQuestionList: GetQuestionListResponse[] = [
  {
    questionId: 101,
    questionText: "What is the capital of France?",
    questionType: {
      questionTypeId: 1,
      questionType: "Single MCQ",
    },
    questionStatus: "Attempted",
    marks: 4,
    negativeMarks: 1,
    questionSectionId: 10,
    options: '["Paris", "London", "Rome", "Berlin"]',
    userAnswer: '["Paris"]',
  },
  {
    questionId: 102,
    questionText: "Which cities are in Europe?",
    questionType: {
      questionTypeId: 2,
      questionType: "Multiple MCQ",
    },
    questionStatus: "Answered To Review",
    marks: 2,
    negativeMarks: 0,
    questionSectionId: 10,
    options: '["Paris", "London", "New York", "Bengaluru"]',
    userAnswer: '["Paris", "London"]',
  },
  {
    questionId: 103,
    questionText: "Match The Following",
    questionType: {
      questionTypeId: 3,
      questionType: "Match Pairs Single",
    },
    questionStatus: "Not Visited",
    marks: 10,
    negativeMarks: 0,
    questionSectionId: 11,
    options: '[["L1", "L2", "L3", "L4"], ["R1", "R2", "R3", "R4"]]',
    userAnswer: '["R1", "R2", "R3", "R4"]',
  },
  {
    questionId: 104,
    questionText: "Match The Following (Multiple)",
    questionType: {
      questionTypeId: 4,
      questionType: "Match Pairs Multiple",
    },
    questionStatus: "UnAttempted",
    marks: 5,
    negativeMarks: 2,
    questionSectionId: 11,
    options: '[["L1", "L2", "L3", "L4"], ["R1", "R2", "R3", "R4"]]',
    userAnswer:
      '[["R1", "R2"], ["R2", "R4", "R1"], ["R3"], ["R4", "R3", "R1"]]',
  },
  {
    questionId: 105,
    questionText: "Write an essay on India.",
    questionType: {
      questionTypeId: 4,
      questionType: "Write Up",
    },
    questionStatus: "UnAttempted",
    marks: 5,
    negativeMarks: 2,
    questionSectionId: 11,
    options: "",
    userAnswer: "India is a country.",
  },
  {
    questionId: 106,
    questionText: "2 + 3 = ?",
    questionType: {
      questionTypeId: 6,
      questionType: "Numeric",
    },
    questionStatus: "UnAttempted",
    marks: 5,
    negativeMarks: 2,
    questionSectionId: 11,
    options: "",
    userAnswer: "5",
  },
  {
    questionId: 107,
    questionText: "India is a country.",
    questionType: {
      questionTypeId: 7,
      questionType: "TrueFalse",
    },
    questionStatus: "UnAttempted",
    marks: 5,
    negativeMarks: 2,
    questionSectionId: 11,
    options: "",
    userAnswer: "True",
  },
  {
    questionId: 108,
    questionText: "Bengaluru is in ________.",
    questionType: {
      questionTypeId: 8,
      questionType: "Fill Answer",
    },
    questionStatus: "UnAttempted",
    marks: 5,
    negativeMarks: 2,
    questionSectionId: 11,
    options: "",
    userAnswer: "Karnataka",
  },
];

export async function fetchQuestionListAction(
  testid: number
): Promise<ApiResponse<GetQuestionListResponse>> {
  //   TODO: Add filters
  try {
    // const { status, error, data, errorMessage, message } = await apiHandler(
    //   endpoints.getQuestions,
    //   {
    //     testid,
    //   }
    // );

    // console.log({ status, error, data, errorMessage, message });

    return {
      status: 200,
      error: false,
      data: mockQuestionList[0],
      message: "Question Retrieved",
    };
  } catch (error) {
    console.log("Error Fetching Test List", error);
    return {
      status: 500,
      error: true,
      errorMessage: "Error Fetching Test List",
    };
  }
}
