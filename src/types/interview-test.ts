// Interview Test Types

export type QuestionType = 'multiple-choice' | 'essay';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type TestStatus = 'draft' | 'published' | 'archived';

export interface QuestionOption {
  id: number | string;
  text: string;
  isCorrect: boolean;
  order?: number;
}

export interface InterviewQuestion {
  id: number | string;
  question: string;
  type: QuestionType;
  points: number;
  difficulty: QuestionDifficulty;
  order: number;
  description?: string;
  options?: QuestionOption[];
  correctAnswer?: string; // For essay questions
}

export interface InterviewTest {
  id: string | number;
  title: string;
  description: string;
  duration: number; // in minutes
  totalPoints: number;
  passingScore: number; // percentage
  status: TestStatus;
  questions: InterviewQuestion[];
  createdAt: string;
  updatedAt: string;
  createdBy?: number;
}

export interface CreateInterviewTestInput {
  title: string;
  description: string;
  duration_minutes: number;
  passing_score: number;
  shuffle_questions?: boolean;
  show_results_immediately?: boolean;
  questions: CreateQuestionInput[];
}

export interface CreateQuestionInput {
  question_text: string;
  question_type: 'multiple_choice' | 'essay';
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  options?: CreateOptionInput[];
}

export interface CreateOptionInput {
  option_text: string;
  is_correct: boolean;
}

export interface UpdateInterviewTestInput extends Partial<CreateInterviewTestInput> {
  id: string;
}
