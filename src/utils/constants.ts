export const USERNAME_TOKEN_KEY: string = "userName";

export const ROLE_TOKEN_KEY: string = "role";

export const QUESTION_TYPES: {
  SINGLE_MCQ: string;
  MULTIPLE_MCQ: string;
  MATCH_PAIRS_SINGLE: string;
  MATCH_PAIRS_MULTIPLE: string;
  WRITE_UP: string;
  NUMERIC: string;
  TRUEFALSE: string;
  FILL_ANSWER: string;
} = {
  SINGLE_MCQ: "MCQ Single",
  MULTIPLE_MCQ: "MCQ Multiple",
  MATCH_PAIRS_SINGLE: "Match Pairs Single",
  MATCH_PAIRS_MULTIPLE: "Match Pairs Multiple",
  WRITE_UP: "Write Up",
  NUMERIC: "Numeric",
  TRUEFALSE: "TrueFalse",
  FILL_ANSWER: "Fill Answer",
} as const;

export const QUESTION_STATUS: {
  NOT_VISITED: string;
  ATTEMPTED: string;
  UNATTEMPTED: string;
  TO_REVIEW: string;
  ANSWERED_TO_REVIEW: string;
} = {
  NOT_VISITED: "Not Visited",
  ATTEMPTED: "Attempted",
  UNATTEMPTED: "UnAttempted",
  TO_REVIEW: "To Review",
  ANSWERED_TO_REVIEW: "Answered To Review",
};
