export type QuestionStatus =
  | "notVisited"
  | "viewed"
  | "answered"
  | "notAnswered"
  | "markedForReview"
  | "answeredMarkedForReview";

export interface ExamSettings {
  templateKey: string;
  theme?: "default" | "blue" | "orange";
  palettePosition?: "right" | "left" | "bottom";
  showLegend?: boolean;
  showZoom?: boolean;
  allowLanguageSwitch?: boolean;
}

export interface QuestionMeta {
  questionId: number;
  sectionId?: number;
  marks?: number;
  neg?: number;
}

export interface QuestionPayload {
  id: number;
  questionType?: { questionType?: string } | string | null;
  questionText?: string;
  passageHtml?: string | null;
  questionOptionsJson?: string | null;
  userAnswer?: string | null;
  marks?: number;
  neg?: number;
  [k: string]: any;
}

export interface Attempt {
  answer: string;
  status: QuestionStatus;
}

export interface ExamState {
  examId: number;
  attemptId?: number;
  title?: string;
  loading: boolean;
  error?: string;
  meta: QuestionMeta[];
  questions: Record<number, QuestionPayload>;
  attempts: Record<number, Attempt>;
  current: { index: number; questionId: number | null };
  counts: Record<QuestionStatus, number>;
  timeLeftMs?: number;
}

export interface ExamActions {
  loadMeta(): Promise<void>;
  ensureLoaded(questionId: number): Promise<void>;
  saveAnswer(questionId: number, answer: string): Promise<void>;
  clearAnswer(questionId: number): void;
  markForReview(questionId: number): void;
  next(): void;
  previous(): void;
  jumpTo(index: number): void;
  submit(): Promise<void>;
  timeout(): void;
  setTimeLeft(ms: number): void;
}

export interface UseExamControllerArgs {
  examId: number;
  settings: ExamSettings;
}

export interface ExamTemplateProps {
  state: ExamState;
  actions: ExamActions;
  settings: ExamSettings;
}
