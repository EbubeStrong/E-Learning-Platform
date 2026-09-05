export type QuizType = "practice" | "certification";

export type AttemptStatus = "in_progress" | "submitted";

export interface QuizDoc {
  _id: string;
  courseId: string;
  type: QuizType;
  title: string;
  totalQuestions: number;
  pointsPerQuestion: number;
  timeLimitSeconds?: number;
  passThreshold: number;
  enabled: boolean;
}

export interface Question {
  _id: string;
  prompt: string;
  options: string[];
  explanation?: string;
}

export interface QuestionRow {
  _id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty?: string;
  isCore?: boolean;
}

export interface QuizConfig {
  title: string;
  totalQuestions: number;
  pointPerQuestion: number;
  totalPoints: number;
  mode: "timed" | "untimed";
  timerType: "overall" | "per-question";
  timeLimitSeconds?: number;
  perQuestionSeconds?: number;
  passThreshold: number;
  deadlineAt?: number;
}

export interface StartPayload {
  attemptId: string;
  quiz: QuizConfig;
  questions: Question[];
  /**
   * Pre-selected answers from a resumed attempt (questionId -> chosenIndex).
   * Empty for a brand-new attempt.
   */
  answers: Record<string, number>;
  /**
   * Seconds left on the overall timer. null when untimed or per-question.
   * Anchored to the attempt's original start, so no extra time on resume.
   */
  overallRemainingSec: number | null;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  total: number;
  percent: number;
  correct: number;
  passed: boolean;
}

export interface AttemptRow {
  _id: string;
  startedAt: number;
  quizTitle: string;
  quizType: QuizType;
  status: AttemptStatus;
  percent?: number;
  score?: number;
  total?: number;
  passThreshold?: number;
  submittedAt?: number;
}
