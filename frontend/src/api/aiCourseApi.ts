import api from './axios';

// ==========================================
// GENERATE COURSE OUTLINE
// ==========================================

export interface GenerateCourseOutlinePayload {
  topic: string;
  instructions: string;
  targetAudience?: string;
  difficulty?: string;
  numberOfChapters?: number;
  lessonsPerChapter?: number;
}

export interface GeneratedCourseLesson {
  title: string;
  description: string;
}

export interface GeneratedCourseChapter {
  title: string;
  description: string;
  learningObjectives: string[];
  lessons: GeneratedCourseLesson[];
}

export interface GeneratedCourseOutline {
  title: string;
  description: string;
  chapters: GeneratedCourseChapter[];
  draftId?: number;
}

export interface GenerateCourseOutlineResponse {
  success: boolean;
  message: string;
  data: GeneratedCourseOutline;
}

// ==========================================
// AI COURSE DRAFT TYPES
// ==========================================

export type AiCourseDraftStatus = 'draft' | 'converted';

export interface AiCourseDraft {
  id: number;
  adminId: number;
  topic: string;
  instructions: string;
  targetAudience: string | null;
  difficulty: string | null;
  numberOfChapters: number | null;
  lessonsPerChapter: number | null;
  outline: GeneratedCourseOutline;
  status: AiCourseDraftStatus;
  courseId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiCourseDraftResponse {
  success: boolean;
  message: string;
  data: AiCourseDraft;
}

export interface AiCourseDraftListResponse {
  success: boolean;
  message: string;
  data: AiCourseDraft[];
}

export interface UpdateAiCourseDraftPayload {
  outline: GeneratedCourseOutline;
}

export interface ApproveAiCourseDraftPayload {
  instructor: string;
  category: string;
}

// ==========================================
// SAVE APPROVED COURSE OUTLINE
// ==========================================

export interface SaveCourseOutlinePayload {
  title: string;
  description: string;
  instructor: string;
  category: string;
  chapters: GeneratedCourseChapter[];
}

export interface SavedCourseLesson {
  id: number;
  title: string;
  content: string | null;
  order: number;
}

export interface SavedCourseChapter {
  id: number;
  title: string;
  description: string | null;
  learningObjectives: string[] | null;
  order: number;
  lessons: SavedCourseLesson[];
}

export interface SavedCourse {
  id: number;
  title: string;
  description: string;
  instructor: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  chapters: SavedCourseChapter[];
}

export interface SaveCourseOutlineResponse {
  success: boolean;
  message: string;
  data: SavedCourse;
}

// ==========================================
// API: GENERATE COURSE OUTLINE
// Backend automatically creates an AI draft
// ==========================================

export const generateCourseOutline = async (
  payload: GenerateCourseOutlinePayload,
): Promise<GeneratedCourseOutline> => {
  const response = await api.post<GenerateCourseOutlineResponse>(
    '/ai-course/generate-outline',
    payload,
    { timeout: 120000 },
  );

  return response.data.data;
};

// ==========================================
// API: GET ALL MY AI COURSE DRAFTS
// ==========================================

export const getMyAiCourseDrafts = async (): Promise<AiCourseDraft[]> => {
  const response = await api.get<AiCourseDraftListResponse>(
    '/ai-course/drafts',
  );

  return response.data.data;
};

// ==========================================
// API: GET ONE AI COURSE DRAFT
// ==========================================

export const getAiCourseDraftById = async (
  draftId: number,
): Promise<AiCourseDraft> => {
  const response = await api.get<AiCourseDraftResponse>(
    `/ai-course/drafts/${draftId}`,
  );

  return response.data.data;
};

// ==========================================
// API: UPDATE / AUTOSAVE AI COURSE DRAFT
// ==========================================

export const updateAiCourseDraft = async (
  draftId: number,
  payload: UpdateAiCourseDraftPayload,
): Promise<AiCourseDraft> => {
  const response = await api.patch<AiCourseDraftResponse>(
    `/ai-course/drafts/${draftId}`,
    payload,
  );

  return response.data.data;
};

// ==========================================
// API: DELETE AI COURSE DRAFT
// ==========================================

export const deleteAiCourseDraft = async (
  draftId: number,
): Promise<void> => {
  await api.delete(`/ai-course/drafts/${draftId}`);
};

// ==========================================
// API: APPROVE AI COURSE DRAFT
// Converts draft into a real course
// ==========================================

export const approveAiCourseDraft = async (
  draftId: number,
  payload: ApproveAiCourseDraftPayload,
): Promise<SavedCourse> => {
  const response = await api.post<SaveCourseOutlineResponse>(
    `/ai-course/drafts/${draftId}/approve`,
    payload,
    { timeout: 120000 },
  );

  return response.data.data;
};

// ==========================================
// API: LEGACY SAVE APPROVED COURSE OUTLINE
// Preserved for existing functionality
// ==========================================

export const saveCourseOutline = async (
  payload: SaveCourseOutlinePayload,
): Promise<SavedCourse> => {
  const response = await api.post<SaveCourseOutlineResponse>(
    '/ai-course/save-outline',
    payload,
    { timeout: 120000 },
  );

  return response.data.data;
};

// ==========================================
// AI LESSON CONTENT TYPES
// ==========================================

export interface LessonExample {
  title: string;
  explanation: string;
  code?: string;
  language?: string;
}

export interface LessonExercise {
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
  practicalExamples: LessonExample[];
  exercises: LessonExercise[];
  keyTakeaways: string[];
  knowledgeCheck: LessonKnowledgeCheck[];
}

export interface GenerateLessonContentPayload {
  additionalInstructions?: string;
}

export interface GenerateLessonContentResponse {
  success: boolean;
  message: string;
  data: LessonAiContent;
}

export interface SaveLessonContentResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    title: string;
    content: string | null;
    aiContent: LessonAiContent;
  };
}

// ==========================================
// API: GENERATE AI LESSON CONTENT
// ==========================================

export const generateLessonContent = async (
  lessonId: number,
  payload: GenerateLessonContentPayload = {},
): Promise<LessonAiContent> => {
  const response = await api.post<GenerateLessonContentResponse>(
    `/ai-course/generate-lesson-content/${lessonId}`,
    payload,
    { timeout: 120000 },
  );

  return response.data.data;
};

// ==========================================
// API: SAVE AI LESSON CONTENT
// ==========================================

export const saveLessonContent = async (
  lessonId: number,
  payload: LessonAiContent,
): Promise<SaveLessonContentResponse['data']> => {
  const response = await api.post<SaveLessonContentResponse>(
    `/ai-course/save-lesson-content/${lessonId}`,
    payload,
    { timeout: 120000 },
  );

  return response.data.data;
};

// ==========================================
// API: GENERATE AND SAVE ONE LESSON
// Used by bulk generation in Manage Courses.
// Generation and saving happen before moving to
// the next lesson, so each completed lesson is persisted.
// ==========================================

export const generateAndSaveLessonContent = async (
  lessonId: number,
  payload: GenerateLessonContentPayload = {},
): Promise<LessonAiContent> => {
  const generatedContent = await generateLessonContent(lessonId, payload);
  await saveLessonContent(lessonId, generatedContent);
  return generatedContent;
};
