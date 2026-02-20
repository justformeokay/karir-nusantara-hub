import { api } from './client';
import {
  InterviewTest,
  CreateInterviewTestInput,
  UpdateInterviewTestInput,
  InterviewQuestion,
  QuestionOption,
} from '@/types/interview-test';

// Backend API response types (snake_case)
interface BackendQuestionOption {
  id: number;
  option_text: string;
  is_correct: boolean;
  order: number;
}

interface BackendInterviewQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'essay';
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  explanation?: string;
  options?: BackendQuestionOption[];
}

interface BackendInterviewTest {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  total_points: number;
  passing_score: number;
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  status: 'draft' | 'active' | 'archived';
  questions?: BackendInterviewQuestion[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface InterviewTestResponse {
  success: boolean;
  message: string;
  data: BackendInterviewTest;
}

interface InterviewTestsResponse {
  success: boolean;
  message: string;
  data: BackendInterviewTest[];
}

// Transformed response types (camelCase)
interface TransformedTestResponse {
  success: boolean;
  message: string;
  data: InterviewTest;
}

interface TransformedTestsResponse {
  success: boolean;
  message: string;
  data: InterviewTest[];
}

// Transform functions: Backend (snake_case) → Frontend (camelCase for display)
const transformQuestionOption = (opt: BackendQuestionOption): QuestionOption => ({
  id: opt.id,
  text: opt.option_text,
  isCorrect: opt.is_correct,
  order: opt.order,
});

const transformQuestion = (q: BackendInterviewQuestion): InterviewQuestion => ({
  id: q.id,
  question: q.question_text,
  type: q.question_type === 'multiple_choice' ? 'multiple-choice' : 'essay',
  points: q.points,
  difficulty: q.difficulty,
  order: q.order,
  description: q.explanation,
  options: q.options?.map(transformQuestionOption),
});

const transformTest = (test: BackendInterviewTest): InterviewTest => ({
  id: test.id.toString(),
  title: test.title,
  description: test.description,
  duration: test.duration_minutes,
  totalPoints: test.total_points,
  passingScore: test.passing_score,
  status: test.status === 'active' ? 'published' : test.status as 'draft' | 'archived',
  questions: test.questions?.map(transformQuestion) || [],
  createdAt: test.created_at,
  updatedAt: test.updated_at,
  createdBy: test.created_by,
});

/**
 * Fetch all interview tests
 */
export const getInterviewTests = async (): Promise<TransformedTestsResponse | undefined> => {
  try {
    const response = await api.get<InterviewTestsResponse>('/api/v1/admin/interview-tests');
    // Transform response to frontend format
    if (response?.data) {
      return {
        ...response,
        data: response.data.map(transformTest),
      };
    }
    return response as any;
  } catch (error) {
    console.error('Failed to fetch interview tests:', error);
    throw error;
  }
};

/**
 * Fetch single interview test
 */
export const getInterviewTest = async (id: string | number): Promise<TransformedTestResponse | undefined> => {
  try {
    const response = await api.get<InterviewTestResponse>(`/api/v1/admin/interview-tests/${id}`);
    // Transform response to frontend format
    if (response?.data) {
      return {
        ...response,
        data: transformTest(response.data),
      };
    }
    return response as any;
  } catch (error) {
    console.error(`Failed to fetch interview test ${id}:`, error);
    throw error;
  }
};

/**
 * Create new interview test
 */
export const createInterviewTest = async (data: CreateInterviewTestInput): Promise<TransformedTestResponse | undefined> => {
  try {
    const response = await api.post<InterviewTestResponse>('/api/v1/admin/interview-tests', data);
    if (response?.data) {
      return {
        ...response,
        data: transformTest(response.data),
      };
    }
    return response as any;
  } catch (error) {
    console.error('Failed to create interview test:', error);
    throw error;
  }
};

/**
 * Update interview test
 */
export const updateInterviewTest = async (
  id: string | number,
  data: Partial<CreateInterviewTestInput>
): Promise<TransformedTestResponse | undefined> => {
  try {
    const response = await api.put<InterviewTestResponse>(`/api/v1/admin/interview-tests/${id}`, data);
    if (response?.data) {
      return {
        ...response,
        data: transformTest(response.data),
      };
    }
    return response as any;
  } catch (error) {
    console.error(`Failed to update interview test ${id}:`, error);
    throw error;
  }
};

/**
 * Delete interview test
 */
export const deleteInterviewTest = async (id: string | number) => {
  try {
    const response = await api.delete('/api/v1/admin/interview-tests/' + id);
    return response;
  } catch (error) {
    console.error(`Failed to delete interview test ${id}:`, error);
    throw error;
  }
};

/**
 * Publish interview test
 */
export const publishInterviewTest = async (id: string | number): Promise<TransformedTestResponse | undefined> => {
  try {
    const response = await api.post<InterviewTestResponse>(`/api/v1/admin/interview-tests/${id}/publish`, {});
    if (response?.data) {
      return {
        ...response,
        data: transformTest(response.data),
      };
    }
    return response as any;
  } catch (error) {
    console.error(`Failed to publish interview test ${id}:`, error);
    throw error;
  }
};

/**
 * Duplicate interview test
 */
export const duplicateInterviewTest = async (id: string | number): Promise<TransformedTestResponse | undefined> => {
  try {
    const response = await api.post<InterviewTestResponse>(`/api/v1/admin/interview-tests/${id}/duplicate`, {});
    if (response?.data) {
      return {
        ...response,
        data: transformTest(response.data),
      };
    }
    return response as any;
  } catch (error) {
    console.error(`Failed to duplicate interview test ${id}:`, error);
    throw error;
  }
};
