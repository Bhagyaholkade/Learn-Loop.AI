import api from './axios';

// AI-generated lesson content types
export interface LessonAiExample {
  title: string;
  explanation: string;
  code?: string;
  language?: string;
}

export interface LessonAiExercise {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedOutcome?: string;
}

export interface LessonKnowledgeCheck {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface LessonAiContent {
  learningObjectives: string[];
  theory: string;
  practicalExamples: LessonAiExample[];
  exercises: LessonAiExercise[];
  keyTakeaways: string[];
  knowledgeCheck: LessonKnowledgeCheck[];
}

// Lesson response interface
export interface Lesson {
  id: number;
  title: string;
  content: string | null;
  aiContent: LessonAiContent | null;
  order: number;

  videoUrl: string | null;
  pdfUrl: string | null;
  objectives: string[] | null;
  resources: string[] | null;

  course: {
    id: number;
    title: string;
  };

  createdAt?: string;
  updatedAt?: string;
}

// Payload for creating a lesson
export interface CreateLessonPayload {
  title: string;
  content?: string;
  courseId: number;
  order: number;

  videoUrl?: string;
  pdfUrl?: string;
  objectives?: string[];
  resources?: string[];
}

// Payload for updating a lesson
export interface UpdateLessonPayload {
  title?: string;
  content?: string | null;
  courseId?: number;
  order?: number;

  videoUrl?: string | null;
  pdfUrl?: string | null;
  objectives?: string[] | null;
  resources?: string[] | null;
}

// Get all lessons for a course
export const getLessonsByCourse = async (
  courseId: number,
): Promise<Lesson[]> => {
  const response = await api.get<Lesson[]>('/lessons', {
    params: { courseId },
  });

  return response.data;
};

// Get a single lesson by ID
export const getLessonById = async (
  lessonId: number,
): Promise<Lesson> => {
  const response = await api.get<Lesson>(`/lessons/${lessonId}`);

  return response.data;
};

// Create a new lesson
export const createLesson = async (
  data: CreateLessonPayload,
): Promise<Lesson> => {
  const response = await api.post<Lesson>('/lessons', data);

  return response.data;
};

// Update an existing lesson
export const updateLesson = async (
  lessonId: number,
  data: UpdateLessonPayload,
): Promise<Lesson> => {
  const response = await api.patch<Lesson>(`/lessons/${lessonId}`, data);

  return response.data;
};

// Delete a lesson
export const deleteLesson = async (lessonId: number): Promise<void> => {
  await api.delete(`/lessons/${lessonId}`);
};
