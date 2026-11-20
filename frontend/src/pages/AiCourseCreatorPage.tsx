
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  AutoAwesomeRounded,
  ArrowBackRounded,
  AddRounded,
  DeleteOutlineRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  RefreshRounded,
  SaveRounded,
  CloudUploadRounded,
  ReplayRounded,
} from '@mui/icons-material';

import {
  generateCourseOutline,
  saveCourseOutline,
  generateLessonContent,
  saveLessonContent,
  getMyAiCourseDrafts,
  getAiCourseDraftById,
  updateAiCourseDraft,
  deleteAiCourseDraft,
  approveAiCourseDraft,
  type GeneratedCourseOutline,
  type GenerateCourseOutlinePayload,
  type SavedCourse,
  type LessonAiContent,
  type AiCourseDraft,
} from '../api/aiCourseApi';

// ==========================================
// ERROR HANDLING
// ==========================================

function getErrorMessage(error: unknown): string {
  const apiError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
    message?: string;
  };

  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || apiError.message || 'Something went wrong. Please try again.';
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AiCourseCreatorPage() {
  const navigate = useNavigate();

  // ==========================================
  // COURSE FORM STATE
  // ==========================================

  const [form, setForm] = useState<GenerateCourseOutlinePayload>({
    topic: '',
    instructions: '',
    targetAudience: 'College students and beginners',
    difficulty: 'Beginner to Advanced',
    numberOfChapters: 6,
    lessonsPerChapter: 5,
  });

  const [outline, setOutline] =
    useState<GeneratedCourseOutline | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [instructor, setInstructor] = useState('Admin');
  const [category, setCategory] = useState('Programming');

  const [expandedChapters, setExpandedChapters] = useState<number[]>([0]);

  // ==========================================
  // SAVED COURSE STATE
  // ==========================================

  const [savedCourseId, setSavedCourseId] =
    useState<number | null>(null);

  const [savedCourse, setSavedCourse] =
    useState<SavedCourse | null>(null);

  // ==========================================
// AI COURSE DRAFT STATE
// ==========================================

const [drafts, setDrafts] = useState<AiCourseDraft[]>([]);
const [draftId, setDraftId] = useState<number | null>(null);

const [draftsLoading, setDraftsLoading] = useState(false);
const [draftLoading, setDraftLoading] = useState(false);

const [draftSaveStatus, setDraftSaveStatus] = useState<
  'idle' | 'saving' | 'saved' | 'error'
>('idle');

const skipNextAutosave = useRef(false);

  // ==========================================
  // AI LESSON CONTENT STATE
  // ==========================================

  const [lessonContents, setLessonContents] = useState<
    Record<number, LessonAiContent>
  >({});

  const [generatingLessons, setGeneratingLessons] = useState<
    Record<number, boolean>
  >({});

  const [savingLessons, setSavingLessons] = useState<
    Record<number, boolean>
  >({});

  // Bulk generation and saving state
  type BulkLessonStatus =
    | 'generating'
    | 'generated'
    | 'failed'
    | 'saving'
    | 'saved'
    | 'save-failed';

  const [bulkStatuses, setBulkStatuses] = useState<
    Record<number, BulkLessonStatus>
  >({});
  const [bulkAction, setBulkAction] = useState<
    'idle' | 'generating' | 'saving'
  >('idle');
  const [bulkProgress, setBulkProgress] = useState({
    completed: 0,
    total: 0,
    currentLessonTitle: '',
  });

  // ==========================================
  // UPDATE COURSE FORM
  // ==========================================

  const updateForm = (
    field: keyof GenerateCourseOutlinePayload,
    value: string | number,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // LOAD MY AI COURSE DRAFTS
  // ==========================================

  const loadMyDrafts = useCallback(async () => {
    setDraftsLoading(true);

    try {
      const result = await getMyAiCourseDrafts();
      setDrafts(result);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMyDrafts();
  }, [loadMyDrafts]);

  // ==========================================
  // RESUME AN EXISTING AI COURSE DRAFT
  // ==========================================

  const handleResumeDraft = async (id: number) => {
    setError('');
    setSuccess('');
    setDraftLoading(true);

    try {
      const draft = await getAiCourseDraftById(id);

      // Prevent the initial state hydration from triggering autosave.
      skipNextAutosave.current = true;

      setDraftId(draft.id);
      setOutline({
        ...draft.outline,
        draftId: draft.id,
      } as GeneratedCourseOutline);

      setForm({
        topic: draft.topic,
        instructions: draft.instructions,
        targetAudience: draft.targetAudience ?? '',
        difficulty: draft.difficulty ?? '',
        numberOfChapters:
          draft.numberOfChapters ?? form.numberOfChapters,
        lessonsPerChapter:
          draft.lessonsPerChapter ?? form.lessonsPerChapter,
      });

      setSavedCourse(null);
      setSavedCourseId(null);
      setLessonContents({});
      setGeneratingLessons({});
      setSavingLessons({});
      setBulkStatuses({});
      setBulkAction('idle');
      setExpandedChapters([0]);
      setDraftSaveStatus('saved');

      setSuccess(`Resumed draft: ${draft.outline.title}`);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setDraftLoading(false);
    }
  };

  // ==========================================
  // DELETE AN AI COURSE DRAFT
  // ==========================================

  const handleDeleteDraft = async (id: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this AI course draft?',
    );

    if (!confirmed) return;

    try {
      await deleteAiCourseDraft(id);

      setDrafts((previous) =>
        previous.filter((draft) => draft.id !== id),
      );

      if (draftId === id) {
        setDraftId(null);
        setOutline(null);
        setDraftSaveStatus('idle');
      }

      setSuccess('AI course draft deleted successfully.');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  // ==========================================
  // AUTO SAVE AI COURSE DRAFT
  // ==========================================

  useEffect(() => {
    if (!outline || draftId === null || savedCourseId !== null) {
      return;
    }

    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      return;
    }

    setDraftSaveStatus('saving');

    const timeoutId = window.setTimeout(async () => {
      try {
        await updateAiCourseDraft(draftId, {
          outline: {
            title: outline.title,
            description: outline.description,
            chapters: outline.chapters,
          },
        });

        setDraftSaveStatus('saved');
        void loadMyDrafts();
      } catch (err: unknown) {
        setDraftSaveStatus('error');
        setError(getErrorMessage(err));
      }
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [outline, draftId, savedCourseId, loadMyDrafts]);

  // ==========================================
  // GENERATE COURSE OUTLINE
  // ==========================================

  const handleGenerate = async () => {
    setError('');
    setSuccess('');
    setOutline(null);
    setDraftId(null);
    setDraftSaveStatus('idle');
    setSavedCourse(null);
    setSavedCourseId(null);
    setLessonContents({});

    if (!form.topic.trim() || !form.instructions.trim()) {
      setError('Please enter the course topic and admin instructions.');
      return;
    }

    if (
      !form.numberOfChapters ||
      form.numberOfChapters < 1 ||
      !form.lessonsPerChapter ||
      form.lessonsPerChapter < 1
    ) {
      setError('Please enter valid chapter and lesson counts.');
      return;
    }

    setLoading(true);

    try {
      const result = await generateCourseOutline({
        ...form,
        topic: form.topic.trim(),
        instructions: form.instructions.trim(),
      });

      setOutline(result);
      setDraftId(
        (result as GeneratedCourseOutline & { draftId?: number }).draftId ?? null,
      );
      setDraftSaveStatus('saved');
      setExpandedChapters([0]);
      await loadMyDrafts();

      setSuccess(
        'Course outline generated successfully. Review and edit it below.',
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UPDATE CHAPTER
  // ==========================================

  const updateChapter = (
    chapterIndex: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    if (!outline) return;

    const chapters = [...outline.chapters];

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      [field]: value,
    };

    setOutline({
      ...outline,
      chapters,
    });
  };

  // ==========================================
  // UPDATE LEARNING OBJECTIVE
  // ==========================================

  const updateObjective = (
    chapterIndex: number,
    objectiveIndex: number,
    value: string,
  ) => {
    if (!outline) return;

    const chapters = [...outline.chapters];

    const objectives = [
      ...chapters[chapterIndex].learningObjectives,
    ];

    objectives[objectiveIndex] = value;

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      learningObjectives: objectives,
    };

    setOutline({
      ...outline,
      chapters,
    });
  };

  // ==========================================
  // ADD LEARNING OBJECTIVE
  // ==========================================

  const addObjective = (chapterIndex: number) => {
    if (!outline) return;

    const chapters = [...outline.chapters];

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      learningObjectives: [
        ...chapters[chapterIndex].learningObjectives,
        'New learning objective',
      ],
    };

    setOutline({
      ...outline,
      chapters,
    });
  };

  // ==========================================
  // REMOVE LEARNING OBJECTIVE
  // ==========================================

  const removeObjective = (
    chapterIndex: number,
    objectiveIndex: number,
  ) => {
    if (!outline) return;

    const chapters = [...outline.chapters];

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      learningObjectives:
        chapters[chapterIndex].learningObjectives.filter(
          (_, index) => index !== objectiveIndex,
        ),
    };

    setOutline({
      ...outline,
      chapters,
    });
  };

  // ==========================================
  // UPDATE LESSON
  // ==========================================

  const updateLesson = (
    chapterIndex: number,
    lessonIndex: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    if (!outline) return;

    const chapters = [...outline.chapters];

    const lessons = [
      ...chapters[chapterIndex].lessons,
    ];

    lessons[lessonIndex] = {
      ...lessons[lessonIndex],
      [field]: value,
    };

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      lessons,
    };

    setOutline({
      ...outline,
      chapters,
    });
  };

  // ==========================================
  // ADD LESSON
  // ==========================================

  const addLesson = (chapterIndex: number) => {
    if (!outline) return;

    const chapters = [...outline.chapters];

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      lessons: [
        ...chapters[chapterIndex].lessons,
        {
          title: 'New lesson',
          description: 'Add a lesson description.',
        },
      ],
    };

    setOutline({
      ...outline,
      chapters,
    });
  };

  // ==========================================
  // REMOVE LESSON
  // ==========================================

  const removeLesson = (
    chapterIndex: number,
    lessonIndex: number,
  ) => {
    if (!outline) return;

    const chapters = [...outline.chapters];

    chapters[chapterIndex] = {
      ...chapters[chapterIndex],
      lessons: chapters[chapterIndex].lessons.filter(
        (_, index) => index !== lessonIndex,
      ),
    };

    setOutline({
      ...outline,
      chapters,
    });
  };

  // ==========================================
  // ADD CHAPTER
  // ==========================================

  const addChapter = () => {
    if (!outline) return;

    const chapters = [
      ...outline.chapters,
      {
        title: 'New Chapter',
        description: 'Add a chapter description.',
        learningObjectives: [
          'Learning objective 1',
          'Learning objective 2',
          'Learning objective 3',
        ],
        lessons: [
          {
            title: 'New lesson',
            description: 'Add a lesson description.',
          },
        ],
      },
    ];

    setOutline({
      ...outline,
      chapters,
    });

    setExpandedChapters([chapters.length - 1]);
  };

  // ==========================================
  // REMOVE CHAPTER
  // ==========================================

  const removeChapter = (chapterIndex: number) => {
    if (!outline) return;

    const chapters = outline.chapters.filter(
      (_, index) => index !== chapterIndex,
    );

    setOutline({
      ...outline,
      chapters,
    });

    setExpandedChapters([]);
  };

  // ==========================================
  // MOVE CHAPTER
  // ==========================================

  const moveChapter = (
    index: number,
    direction: -1 | 1,
  ) => {
    if (!outline) return;

    const targetIndex = index + direction;

    if (
      targetIndex < 0 ||
      targetIndex >= outline.chapters.length
    ) {
      return;
    }

    const chapters = [...outline.chapters];

    [chapters[index], chapters[targetIndex]] = [
      chapters[targetIndex],
      chapters[index],
    ];

    setOutline({
      ...outline,
      chapters,
    });

    setExpandedChapters([targetIndex]);
  };

  // ==========================================
  // EXPAND / COLLAPSE CHAPTER
  // ==========================================

  const toggleChapter = (index: number) => {
    setExpandedChapters((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index],
    );
  };

  // ==========================================
  // TOTAL LESSON COUNT
  // ==========================================

  const totalLessons =
    outline?.chapters.reduce(
      (total, chapter) => total + chapter.lessons.length,
      0,
    ) ?? 0;

  // ==========================================
  // VALIDATE OUTLINE
  // ==========================================

  const validateOutline = (): string | null => {
    if (!outline?.title.trim() || !outline.description.trim()) {
      return 'Please provide a course title and description.';
    }

    if (!instructor.trim()) {
      return 'Please enter the course instructor.';
    }

    if (!category.trim()) {
      return 'Please enter the course category.';
    }

    if (outline.chapters.length === 0) {
      return 'Add at least one chapter.';
    }

    for (const [chapterIndex, chapter] of outline.chapters.entries()) {
      if (!chapter.title.trim() || !chapter.description.trim()) {
        return `Please complete the title and description for Chapter ${chapterIndex + 1}.`;
      }

      if (chapter.learningObjectives.length < 3) {
        return `Chapter ${chapterIndex + 1} must have at least 3 learning objectives.`;
      }

      if (
        chapter.learningObjectives.some(
          (objective) => !objective.trim(),
        )
      ) {
        return `Please complete all learning objectives in Chapter ${chapterIndex + 1}.`;
      }

      if (chapter.lessons.length === 0) {
        return `Chapter ${chapterIndex + 1} must contain at least one lesson.`;
      }

      if (
        chapter.lessons.some(
          (lesson) =>
            !lesson.title.trim() || !lesson.description.trim(),
        )
      ) {
        return `Please complete all lesson titles and descriptions in Chapter ${chapterIndex + 1}.`;
      }
    }

    return null;
  };

  // ==========================================
  // SAVE COURSE OUTLINE
  // ==========================================

  const handleSaveCourse = async () => {
    const validationError = validateOutline();

    if (validationError || !outline) {
      setError(validationError || 'Course outline is missing.');
      return;
    }

    if (savedCourseId !== null) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const course =
        draftId !== null
          ? await approveAiCourseDraft(draftId, {
              instructor: instructor.trim(),
              category: category.trim(),
            })
          : await saveCourseOutline({
              title: outline.title.trim(),
              description: outline.description.trim(),
              instructor: instructor.trim(),
              category: category.trim(),
              chapters: outline.chapters.map((chapter) => ({
                title: chapter.title.trim(),
                description: chapter.description.trim(),
                learningObjectives: chapter.learningObjectives.map(
                  (objective) => objective.trim(),
                ),
                lessons: chapter.lessons.map((lesson) => ({
                  title: lesson.title.trim(),
                  description: lesson.description.trim(),
                })),
              })),
            });

      const convertedDraftId = draftId;

      setSavedCourse(course);
      setSavedCourseId(course.id);

      if (convertedDraftId !== null) {
        setDraftId(null);
        setDrafts((previous) =>
          previous.filter((draft) => draft.id !== convertedDraftId),
        );
      }

      setSuccess(
        `Course "${course.title}" saved successfully. Course ID: ${course.id}`,
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // GENERATE AI LESSON CONTENT
  // ==========================================

  const handleGenerateLessonContent = async (
    lessonId: number,
  ) => {
    setError('');
    setSuccess('');

    setGeneratingLessons((previous) => ({
      ...previous,
      [lessonId]: true,
    }));

    try {
      const content = await generateLessonContent(lessonId, {
        additionalInstructions:
          'Explain this topic for beginner students. Include detailed theory, practical real-world examples, code examples wherever relevant, and hands-on exercises. Explain concepts step by step.',
      });

      setLessonContents((previous) => ({
        ...previous,
        [lessonId]: content,
      }));
      setBulkStatuses((previous) => ({
        ...previous,
        [lessonId]: 'generated',
      }));

      setSuccess(
        `AI content generated successfully for lesson ${lessonId}. Review it before saving.`,
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingLessons((previous) => ({
        ...previous,
        [lessonId]: false,
      }));
    }
  };

  // ==========================================
  // SAVE AI LESSON CONTENT
  // ==========================================

  const handleSaveLessonContent = async (
    lessonId: number,
  ) => {
    const content = lessonContents[lessonId];

    if (!content) {
      setError('Please generate lesson content first.');
      return;
    }

    setError('');
    setSuccess('');

    setSavingLessons((previous) => ({
      ...previous,
      [lessonId]: true,
    }));

    try {
      await saveLessonContent(lessonId, content);
      setBulkStatuses((previous) => ({
        ...previous,
        [lessonId]: 'saved',
      }));

      setSuccess(
        `AI lesson content saved successfully for lesson ${lessonId}.`,
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSavingLessons((previous) => ({
        ...previous,
        [lessonId]: false,
      }));
    }
  };

  // ==========================================
  // BULK GENERATE AI LESSON CONTENT
  // ==========================================

  const getCourseLessons = () =>
    savedCourse?.chapters.flatMap((chapter) => chapter.lessons) ?? [];

  const runBulkGeneration = async (lessonIds?: number[]) => {
    if (!savedCourse || bulkAction !== 'idle') return;

    const allLessons = getCourseLessons();
    const selectedLessons = lessonIds
      ? allLessons.filter((lesson) => lessonIds.includes(lesson.id))
      : allLessons.filter(
          (lesson) =>
            !lessonContents[lesson.id] &&
            bulkStatuses[lesson.id] !== 'saved',
        );

    if (selectedLessons.length === 0) {
      setSuccess('There are no lessons waiting for AI content generation.');
      return;
    }

    setError('');
    setSuccess('');
    setBulkAction('generating');
    setBulkProgress({ completed: 0, total: selectedLessons.length, currentLessonTitle: '' });

    let completed = 0;
    const failedTitles: string[] = [];

    for (const lesson of selectedLessons) {
      setBulkStatuses((previous) => ({ ...previous, [lesson.id]: 'generating' }));
      setBulkProgress({ completed, total: selectedLessons.length, currentLessonTitle: lesson.title });

      try {
        const content = await generateLessonContent(lesson.id, {
          additionalInstructions:
            'Explain this topic for beginner students. Include detailed theory, practical real-world examples, code examples wherever relevant, and hands-on exercises. Explain concepts step by step.',
        });
        setLessonContents((previous) => ({ ...previous, [lesson.id]: content }));
        setBulkStatuses((previous) => ({ ...previous, [lesson.id]: 'generated' }));
      } catch {
        failedTitles.push(lesson.title);
        setBulkStatuses((previous) => ({ ...previous, [lesson.id]: 'failed' }));
      } finally {
        completed += 1;
        setBulkProgress({ completed, total: selectedLessons.length, currentLessonTitle: lesson.title });
      }
    }

    setBulkAction('idle');
    if (failedTitles.length > 0) {
      setError(`${failedTitles.length} lesson(s) failed to generate: ${failedTitles.join(', ')}. Use Retry Failed to try them again.`);
      setSuccess(`${selectedLessons.length - failedTitles.length} of ${selectedLessons.length} lessons generated successfully.`);
    } else {
      setSuccess(`AI content generated successfully for all ${selectedLessons.length} selected lessons. Review the content, then use Save All Generated Content.`);
    }
  };

  // ==========================================
  // RETRY FAILED AI LESSON GENERATION
  // ==========================================

  const handleRetryFailedGeneration = async () => {
    const failedIds = Object.entries(bulkStatuses)
      .filter(([, status]) => status === 'failed')
      .map(([lessonId]) => Number(lessonId));
    if (failedIds.length === 0) {
      setSuccess('There are no failed lessons to retry.');
      return;
    }
    await runBulkGeneration(failedIds);
  };

  // ==========================================
  // BULK SAVE GENERATED LESSON CONTENT
  // ==========================================

  const handleSaveAllLessonContent = async () => {
    if (!savedCourse || bulkAction !== 'idle') return;
    const lessonsToSave = getCourseLessons().filter((lesson) =>
      Boolean(lessonContents[lesson.id]) && bulkStatuses[lesson.id] !== 'saved' && bulkStatuses[lesson.id] !== 'saving',
    );
    if (lessonsToSave.length === 0) {
      setError('Generate lesson content before using Save All.');
      return;
    }

    setError('');
    setSuccess('');
    setBulkAction('saving');
    setBulkProgress({ completed: 0, total: lessonsToSave.length, currentLessonTitle: '' });
    let completed = 0;
    const failedTitles: string[] = [];

    for (const lesson of lessonsToSave) {
      const content = lessonContents[lesson.id];
      if (!content) continue;
      setBulkStatuses((previous) => ({ ...previous, [lesson.id]: 'saving' }));
      setBulkProgress({ completed, total: lessonsToSave.length, currentLessonTitle: lesson.title });
      try {
        await saveLessonContent(lesson.id, content);
        setBulkStatuses((previous) => ({ ...previous, [lesson.id]: 'saved' }));
      } catch {
        failedTitles.push(lesson.title);
        setBulkStatuses((previous) => ({ ...previous, [lesson.id]: 'save-failed' }));
      } finally {
        completed += 1;
        setBulkProgress({ completed, total: lessonsToSave.length, currentLessonTitle: lesson.title });
      }
    }

    setBulkAction('idle');
    if (failedTitles.length > 0) {
      setError(`Could not save ${failedTitles.length} lesson(s): ${failedTitles.join(', ')}. Use Save All again to retry unsaved generated content.`);
      setSuccess(`${lessonsToSave.length - failedTitles.length} of ${lessonsToSave.length} lessons saved successfully.`);
    } else {
      setSuccess(`Successfully saved AI content for all ${lessonsToSave.length} lessons.`);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F7F6F4',
        py: 4,
      }}
    >
      <Container maxWidth="lg">

        {/* BACK BUTTON */}

        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/admin/courses')}
          sx={{ mb: 2 }}
        >
          Back to Manage Courses
        </Button>

        {/* PAGE HEADER */}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          mb={4}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeRounded color="primary" />

              <Typography variant="h4" fontWeight={800}>
                AI Course Creator
              </Typography>
            </Stack>

            <Typography color="text.secondary" mt={1}>
              Generate structured courses and learning content with Gemini AI.
            </Typography>
          </Box>

          <Chip
            label="Powered by Gemini AI"
            color="primary"
            variant="outlined"
          />
        </Stack>

        {/* ALERTS */}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess('')}
          >
            {success}
          </Alert>
        )}

        {/* ======================================
            MY AI COURSE DRAFTS
        ====================================== */}

        <Card
          elevation={0}
          sx={{
            border: '1px solid #ECE8E4',
            borderRadius: 3,
            mb: 4,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={2}
              mb={2}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  My AI Course Drafts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resume editing a course outline saved to your account.
                </Typography>
              </Box>

              <Button
                size="small"
                startIcon={<RefreshRounded />}
                onClick={() => void loadMyDrafts()}
                disabled={draftsLoading}
              >
                Refresh
              </Button>
            </Stack>

            {draftsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={28} />
              </Box>
            ) : drafts.length === 0 ? (
              <Alert severity="info">
                You don't have any saved AI course drafts yet.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {drafts.map((draft) => (
                  <Card key={draft.id} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        spacing={2}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700}>
                            {draft.outline.title}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mt={0.5}
                          >
                            {draft.topic}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={1}
                            mt={1}
                            flexWrap="wrap"
                          >
                            <Chip
                              size="small"
                              label={`${draft.outline.chapters.length} Chapters`}
                            />
                            <Chip
                              size="small"
                              color="warning"
                              label="Draft"
                            />
                            <Chip
                              size="small"
                              label={`Updated ${new Date(
                                draft.updatedAt,
                              ).toLocaleDateString()}`}
                            />
                          </Stack>
                        </Box>

                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={draftLoading}
                            onClick={() => void handleResumeDraft(draft.id)}
                          >
                            {draftLoading ? 'Loading...' : 'Resume'}
                          </Button>

                          <IconButton
                            color="error"
                            aria-label="Delete AI course draft"
                            onClick={() => void handleDeleteDraft(draft.id)}
                          >
                            <DeleteOutlineRounded />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* ======================================
            COURSE REQUIREMENTS FORM
        ====================================== */}

        <Card
          elevation={0}
          sx={{
            border: '1px solid #ECE8E4',
            borderRadius: 3,
            mb: 4,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              Course Requirements
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
              mb={3}
            >
              Describe the course you want AI to create.
            </Typography>

            <Stack spacing={3}>

              <TextField
                label="Course topic"
                placeholder="e.g. Python Programming"
                fullWidth
                required
                value={form.topic}
                onChange={(event) =>
                  updateForm('topic', event.target.value)
                }
              />

              <TextField
                label="Admin instructions"
                placeholder="Describe the topics, practical examples, projects and learning outcomes..."
                fullWidth
                required
                multiline
                minRows={5}
                value={form.instructions}
                onChange={(event) =>
                  updateForm('instructions', event.target.value)
                }
              />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Target audience"
                    fullWidth
                    value={form.targetAudience}
                    onChange={(event) =>
                      updateForm('targetAudience', event.target.value)
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Difficulty"
                    fullWidth
                    value={form.difficulty}
                    onChange={(event) =>
                      updateForm('difficulty', event.target.value)
                    }
                  >
                    <MenuItem value="Beginner">Beginner</MenuItem>
                    <MenuItem value="Intermediate">Intermediate</MenuItem>
                    <MenuItem value="Advanced">Advanced</MenuItem>
                    <MenuItem value="Beginner to Advanced">
                      Beginner to Advanced
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Number of chapters"
                    type="number"
                    fullWidth
                    value={form.numberOfChapters}
                    inputProps={{ min: 1, max: 20 }}
                    onChange={(event) =>
                      updateForm(
                        'numberOfChapters',
                        Number(event.target.value),
                      )
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Lessons per chapter"
                    type="number"
                    fullWidth
                    value={form.lessonsPerChapter}
                    inputProps={{ min: 1, max: 15 }}
                    onChange={(event) =>
                      updateForm(
                        'lessonsPerChapter',
                        Number(event.target.value),
                      )
                    }
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                size="large"
                startIcon={
                  loading ? (
                    <CircularProgress size={19} color="inherit" />
                  ) : (
                    <AutoAwesomeRounded />
                  )
                }
                onClick={() => void handleGenerate()}
                disabled={loading || saving}
                sx={{
                  alignSelf: {
                    xs: 'stretch',
                    sm: 'flex-start',
                  },
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                }}
              >
                {loading
                  ? 'Generating Course Outline...'
                  : 'Generate Course Outline'}
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* ======================================
            GENERATED COURSE OUTLINE
        ====================================== */}

        {outline && (
          <Box>

            {/* OUTLINE HEADER */}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              mb={3}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Review Generated Curriculum
                </Typography>

                <Typography
                  color="text.secondary"
                  variant="body2"
                  mt={0.5}
                >
                  Edit the generated course before saving it.
                </Typography>

                {draftId !== null && (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mt={1}
                  >
                    {draftSaveStatus === 'saving' && (
                      <>
                        <CircularProgress size={14} />
                        <Typography variant="caption" color="text.secondary">
                          Saving changes...
                        </Typography>
                      </>
                    )}

                    {draftSaveStatus === 'saved' && (
                      <Typography variant="caption" color="success.main">
                        ✓ All changes saved
                      </Typography>
                    )}

                    {draftSaveStatus === 'error' && (
                      <Typography variant="caption" color="error.main">
                        Autosave failed. Your latest changes may not be saved.
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>

              <Button
                variant="outlined"
                startIcon={<RefreshRounded />}
                disabled={loading || saving}
                onClick={() => {
                  setOutline(null);
                  setDraftId(null);
                  setDraftSaveStatus('idle');
                  setSavedCourse(null);
                  setSuccess('');
                  setError('');
                  setSavedCourseId(null);
                  setLessonContents({});
                }}
              >
                Generate Another
              </Button>
            </Stack>

            {/* COURSE DETAILS */}

            <Card
              elevation={0}
              sx={{
                border: '1px solid #ECE8E4',
                borderRadius: 3,
                mb: 3,
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Course Details
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Course title"
                    fullWidth
                    value={outline.title}
                    onChange={(event) =>
                      setOutline({
                        ...outline,
                        title: event.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Course description"
                    fullWidth
                    multiline
                    minRows={3}
                    value={outline.description}
                    onChange={(event) =>
                      setOutline({
                        ...outline,
                        description: event.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Instructor"
                    fullWidth
                    required
                    value={instructor}
                    onChange={(event) =>
                      setInstructor(event.target.value)
                    }
                    placeholder="Enter instructor name"
                  />

                  <TextField
                    label="Course Category"
                    fullWidth
                    required
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    placeholder="Programming, Frontend, Backend, AI"
                  />
                </Stack>

                <Stack
                  direction="row"
                  spacing={1}
                  mt={3}
                  flexWrap="wrap"
                >
                  <Chip
                    label={`${outline.chapters.length} Chapters`}
                    color="primary"
                  />

                  <Chip
                    label={`${totalLessons} Lessons`}
                    color="secondary"
                  />

                  <Chip
                    label="AI Generated"
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* CHAPTERS */}

            <Stack spacing={2}>
              {outline.chapters.map((chapter, chapterIndex) => (
                <Card
                  key={chapterIndex}
                  elevation={0}
                  sx={{
                    border: '1px solid #ECE8E4',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ minWidth: 0 }}
                      >
                        <Chip
                          label={`Chapter ${chapterIndex + 1}`}
                          color="primary"
                          size="small"
                        />

                        <Typography fontWeight={700} noWrap>
                          {chapter.title}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={0}>
                        <IconButton
                          size="small"
                          disabled={chapterIndex === 0}
                          onClick={() =>
                            moveChapter(chapterIndex, -1)
                          }
                          aria-label="Move chapter up"
                        >
                          <ExpandLessRounded />
                        </IconButton>

                        <IconButton
                          size="small"
                          disabled={
                            chapterIndex === outline.chapters.length - 1
                          }
                          onClick={() =>
                            moveChapter(chapterIndex, 1)
                          }
                          aria-label="Move chapter down"
                        >
                          <ExpandMoreRounded />
                        </IconButton>

                        <IconButton
                          size="small"
                          color="error"
                          disabled={savedCourseId !== null}
                          onClick={() =>
                            removeChapter(chapterIndex)
                          }
                          aria-label="Remove chapter"
                        >
                          <DeleteOutlineRounded />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={() =>
                            toggleChapter(chapterIndex)
                          }
                          aria-label="Expand or collapse chapter"
                        >
                          {expandedChapters.includes(chapterIndex) ? (
                            <ExpandLessRounded />
                          ) : (
                            <ExpandMoreRounded />
                          )}
                        </IconButton>
                      </Stack>
                    </Stack>

                    {expandedChapters.includes(chapterIndex) && (
                      <Stack spacing={2.5} mt={3}>

                        {/* CHAPTER DETAILS */}

                        <TextField
                          label="Chapter title"
                          fullWidth
                          value={chapter.title}
                          disabled={savedCourseId !== null}
                          onChange={(event) =>
                            updateChapter(
                              chapterIndex,
                              'title',
                              event.target.value,
                            )
                          }
                        />

                        <TextField
                          label="Chapter description"
                          fullWidth
                          multiline
                          minRows={2}
                          value={chapter.description}
                          disabled={savedCourseId !== null}
                          onChange={(event) =>
                            updateChapter(
                              chapterIndex,
                              'description',
                              event.target.value,
                            )
                          }
                        />

                        <Divider />

                        {/* LEARNING OBJECTIVES */}

                        <Box>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <Typography fontWeight={700}>
                              Learning Objectives
                            </Typography>

                            <Button
                              size="small"
                              startIcon={<AddRounded />}
                              disabled={savedCourseId !== null}
                              onClick={() =>
                                addObjective(chapterIndex)
                              }
                            >
                              Add Objective
                            </Button>
                          </Stack>

                          <Stack spacing={1}>
                            {chapter.learningObjectives.map(
                              (objective, objectiveIndex) => (
                                <Stack
                                  key={objectiveIndex}
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                >
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={objective}
                                    disabled={savedCourseId !== null}
                                    onChange={(event) =>
                                      updateObjective(
                                        chapterIndex,
                                        objectiveIndex,
                                        event.target.value,
                                      )
                                    }
                                  />

                                  <IconButton
                                    color="error"
                                    disabled={savedCourseId !== null}
                                    onClick={() =>
                                      removeObjective(
                                        chapterIndex,
                                        objectiveIndex,
                                      )
                                    }
                                    aria-label="Remove objective"
                                  >
                                    <DeleteOutlineRounded />
                                  </IconButton>
                                </Stack>
                              ),
                            )}
                          </Stack>
                        </Box>

                        <Divider />

                        {/* LESSONS */}

                        <Box>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                          >
                            <Typography fontWeight={700}>
                              Lessons ({chapter.lessons.length})
                            </Typography>

                            <Button
                              size="small"
                              startIcon={<AddRounded />}
                              disabled={savedCourseId !== null}
                              onClick={() =>
                                addLesson(chapterIndex)
                              }
                            >
                              Add Lesson
                            </Button>
                          </Stack>

                          <Stack spacing={2}>
                            {chapter.lessons.map(
                              (lesson, lessonIndex) => (
                                <Box
                                  key={lessonIndex}
                                  sx={{
                                    p: 2,
                                    border: '1px solid #ECE8E4',
                                    borderRadius: 2,
                                    bgcolor: '#FAF8F6',
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    mb={1}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight={700}
                                    >
                                      Lesson {lessonIndex + 1}
                                    </Typography>

                                    <IconButton
                                      size="small"
                                      color="error"
                                      disabled={savedCourseId !== null}
                                      onClick={() =>
                                        removeLesson(
                                          chapterIndex,
                                          lessonIndex,
                                        )
                                      }
                                      aria-label="Remove lesson"
                                    >
                                      <DeleteOutlineRounded />
                                    </IconButton>
                                  </Stack>

                                  <Stack spacing={1.5}>
                                    <TextField
                                      label="Lesson title"
                                      fullWidth
                                      size="small"
                                      value={lesson.title}
                                      disabled={savedCourseId !== null}
                                      onChange={(event) =>
                                        updateLesson(
                                          chapterIndex,
                                          lessonIndex,
                                          'title',
                                          event.target.value,
                                        )
                                      }
                                    />

                                    <TextField
                                      label="Lesson description"
                                      fullWidth
                                      multiline
                                      minRows={2}
                                      size="small"
                                      value={lesson.description}
                                      disabled={savedCourseId !== null}
                                      onChange={(event) =>
                                        updateLesson(
                                          chapterIndex,
                                          lessonIndex,
                                          'description',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </Stack>
                                </Box>
                              ),
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>

            {/* ADD CHAPTER */}

            <Button
              variant="outlined"
              startIcon={<AddRounded />}
              disabled={savedCourseId !== null}
              onClick={addChapter}
              sx={{ mt: 3 }}
            >
              Add Chapter
            </Button>

            {/* SAVE COURSE */}

            <Card
              elevation={0}
              sx={{
                mt: 3,
                border: '1px solid #ECE8E4',
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: {
                    xs: 'stretch',
                    sm: 'center',
                  },
                  flexDirection: {
                    xs: 'column',
                    sm: 'row',
                  },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography fontWeight={700}>
                    Approve Course
                  </Typography>

                  <Typography
                    color="text.secondary"
                    variant="body2"
                  >
                    Convert this AI draft into a course and continue generating lesson content.
                  </Typography>

                  {savedCourseId !== null && (
                    <Typography
                      color="success.main"
                      variant="body2"
                      fontWeight={600}
                    >
                      Saved Course ID: {savedCourseId}
                    </Typography>
                  )}
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  onClick={() => void handleSaveCourse()}
                  disabled={
                    saving ||
                    savedCourseId !== null ||
                    loading
                  }
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    ) : (
                      <SaveRounded />
                    )
                  }
                  sx={{
                    fontWeight: 700,
                    px: 3,
                  }}
                >
                  {saving
                    ? 'Saving Course...'
                    : savedCourseId !== null
                      ? 'Course Saved'
                      : 'Approve & Save Course'}
                </Button>
              </CardContent>
            </Card>

            {/* ======================================
                AI LESSON CONTENT GENERATOR
            ====================================== */}

            {savedCourse && (
              <Card
                elevation={0}
                sx={{
                  mt: 4,
                  border: '1px solid #ECE8E4',
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack spacing={3}>
                    <Box>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                      >
                        <AutoAwesomeRounded color="primary" />

                        <Typography
                          variant="h5"
                          fontWeight={800}
                        >
                          AI Lesson Content Generator
                        </Typography>
                      </Stack>

                      <Typography
                        color="text.secondary"
                        variant="body2"
                        mt={1}
                      >
                        Generate detailed learning material for each saved lesson.
                      </Typography>
                    </Box>

                    {/* BULK GENERATION / SAVE CONTROLS */}
                    {(() => {
                      const allLessons = getCourseLessons();
                      const generatedCount = allLessons.filter((lesson) => Boolean(lessonContents[lesson.id])).length;
                      const savedCount = allLessons.filter((lesson) => bulkStatuses[lesson.id] === 'saved').length;
                      const failedCount = allLessons.filter((lesson) => bulkStatuses[lesson.id] === 'failed' || bulkStatuses[lesson.id] === 'save-failed').length;
                      const progressPercent = bulkProgress.total > 0 ? (bulkProgress.completed / bulkProgress.total) * 100 : 0;

                      return (
                        <Card variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, bgcolor: '#FAF8F6' }}>
                          <Stack spacing={2}>
                            <Box>
                              <Typography fontWeight={800} variant="h6">Generate content for the entire course</Typography>
                              <Typography color="text.secondary" variant="body2" mt={0.5}>
                                Generate lesson content one at a time, review it, and then save all generated lessons to the database.
                              </Typography>
                            </Box>
                            <Grid container spacing={1}>
                              <Grid item xs={6} sm={3}><Chip label={`${allLessons.length} Total`} sx={{ width: '100%' }} /></Grid>
                              <Grid item xs={6} sm={3}><Chip color="success" label={`${generatedCount} Generated`} sx={{ width: '100%' }} /></Grid>
                              <Grid item xs={6} sm={3}><Chip color="primary" label={`${savedCount} Saved`} sx={{ width: '100%' }} /></Grid>
                              <Grid item xs={6} sm={3}><Chip color={failedCount ? 'error' : 'default'} label={`${failedCount} Failed`} sx={{ width: '100%' }} /></Grid>
                            </Grid>
                            {bulkAction !== 'idle' && (
                              <Box>
                                <Stack direction="row" justifyContent="space-between" spacing={2} mb={1}>
                                  <Typography variant="body2" fontWeight={600}>{bulkAction === 'generating' ? 'Generating lesson content...' : 'Saving lesson content...'}</Typography>
                                  <Typography variant="body2" color="text.secondary">{bulkProgress.completed} / {bulkProgress.total}</Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 5 }} />
                                {bulkProgress.currentLessonTitle && <Typography variant="caption" color="text.secondary" display="block" mt={1}>Current lesson: {bulkProgress.currentLessonTitle}</Typography>}
                              </Box>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
                              <Button variant="contained" startIcon={bulkAction === 'generating' ? <CircularProgress size={17} color="inherit" /> : <AutoAwesomeRounded />} disabled={bulkAction !== 'idle'} onClick={() => void runBulkGeneration()}>
                                {bulkAction === 'generating' ? 'Generating All...' : 'Generate All AI Content'}
                              </Button>
                              <Button variant="outlined" color="warning" startIcon={<ReplayRounded />} disabled={bulkAction !== 'idle' || failedCount === 0} onClick={() => void handleRetryFailedGeneration()}>
                                Retry Failed ({failedCount})
                              </Button>
                              <Button variant="contained" color="success" startIcon={bulkAction === 'saving' ? <CircularProgress size={17} color="inherit" /> : <CloudUploadRounded />} disabled={bulkAction !== 'idle' || generatedCount === 0 || savedCount === generatedCount} onClick={() => void handleSaveAllLessonContent()}>
                                {bulkAction === 'saving' ? 'Saving All...' : 'Save All Generated Content'}
                              </Button>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Generation is sequential to reduce provider rate-limit errors. Generated content is not saved until you click Save All Generated Content. Existing individual lesson Generate and Approve & Save buttons are still available.
                            </Typography>
                          </Stack>
                        </Card>
                      );
                    })()}

                    {savedCourse.chapters.map(
                      (chapter, chapterIndex) => (
                        <Box key={chapter.id}>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            mb={2}
                          >
                            Chapter {chapterIndex + 1}: {chapter.title}
                          </Typography>

                          <Stack spacing={2}>
                            {chapter.lessons.map(
                              (lesson, lessonIndex) => {
                                const lessonContent =
                                  lessonContents[lesson.id];

                                const isGenerating =
                                  Boolean(
                                    generatingLessons[lesson.id],
                                  );

                                const isSaving =
                                  Boolean(
                                    savingLessons[lesson.id],
                                  );

                                return (
                                  <Card
                                    key={lesson.id}
                                    variant="outlined"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    <CardContent>
                                      {/* LESSON HEADER */}

                                      <Stack
                                        direction={{
                                          xs: 'column',
                                          sm: 'row',
                                        }}
                                        justifyContent="space-between"
                                        alignItems={{
                                          xs: 'stretch',
                                          sm: 'center',
                                        }}
                                        spacing={2}
                                      >
                                        <Box>
                                          <Typography fontWeight={700}>
                                            Lesson {lessonIndex + 1}: {lesson.title}
                                          </Typography>

                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            mt={0.5}
                                          >
                                            Lesson ID: {lesson.id}
                                          </Typography>
                                          {bulkStatuses[lesson.id] && (
                                            <Chip
                                              size="small"
                                              sx={{ mt: 1 }}
                                              color={
                                                bulkStatuses[lesson.id] === 'saved' ? 'success' :
                                                bulkStatuses[lesson.id] === 'failed' || bulkStatuses[lesson.id] === 'save-failed' ? 'error' :
                                                bulkStatuses[lesson.id] === 'generating' || bulkStatuses[lesson.id] === 'saving' ? 'warning' : 'info'
                                              }
                                              label={bulkStatuses[lesson.id].replace('-', ' ')}
                                            />
                                          )}
                                        </Box>

                                        <Button
                                          variant="contained"
                                          startIcon={
                                            isGenerating ? (
                                              <CircularProgress
                                                size={17}
                                                color="inherit"
                                              />
                                            ) : (
                                              <AutoAwesomeRounded />
                                            )
                                          }
                                          disabled={isGenerating || isSaving}
                                          onClick={() =>
                                            void handleGenerateLessonContent(
                                              lesson.id,
                                            )
                                          }
                                        >
                                          {isGenerating
                                            ? 'Generating...'
                                            : lessonContent
                                              ? 'Regenerate Content'
                                              : 'Generate AI Content'}
                                        </Button>
                                      </Stack>

                                      {/* GENERATED CONTENT PREVIEW */}

                                      {lessonContent && (
                                        <Box mt={3}>
                                          <Divider sx={{ mb: 2 }} />

                                          <Chip
                                            label="AI Content Generated"
                                            color="success"
                                            size="small"
                                            sx={{ mb: 2 }}
                                          />

                                          {/* OBJECTIVES */}

                                          <Typography
                                            fontWeight={700}
                                            mb={1}
                                          >
                                            Learning Objectives
                                          </Typography>

                                          <Stack spacing={1}>
                                            {lessonContent.learningObjectives.map(
                                              (objective, index) => (
                                                <Typography
                                                  key={index}
                                                  variant="body2"
                                                >
                                                  {index + 1}. {objective}
                                                </Typography>
                                              ),
                                            )}
                                          </Stack>

                                          <Divider sx={{ my: 2 }} />

                                          {/* THEORY */}

                                          <Typography
                                            fontWeight={700}
                                            mb={1}
                                          >
                                            Theory
                                          </Typography>

                                          <Box
                                            sx={{
                                              maxHeight: 350,
                                              overflowY: 'auto',
                                              p: 2,
                                              bgcolor: '#F7F6F4',
                                              borderRadius: 2,
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 1.8,
                                              }}
                                            >
                                              {lessonContent.theory}
                                            </Typography>
                                          </Box>

                                          <Divider sx={{ my: 2 }} />

                                          {/* EXAMPLES */}

                                          <Typography
                                            fontWeight={700}
                                            mb={2}
                                          >
                                            Practical Examples
                                          </Typography>

                                          <Stack spacing={2}>
                                            {lessonContent.practicalExamples.map(
                                              (example, index) => (
                                                <Box
                                                  key={index}
                                                  sx={{
                                                    p: 2,
                                                    bgcolor: '#F7F6F4',
                                                    borderRadius: 2,
                                                  }}
                                                >
                                                  <Typography fontWeight={600}>
                                                    {index + 1}. {example.title}
                                                  </Typography>

                                                  <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    mt={1}
                                                  >
                                                    {example.explanation}
                                                  </Typography>

                                                  {example.code && (
                                                    <Box
                                                      component="pre"
                                                      sx={{
                                                        mt: 2,
                                                        p: 2,
                                                        borderRadius: 2,
                                                        bgcolor: '#1E293B',
                                                        color: '#FAF8F6',
                                                        overflowX: 'auto',
                                                        fontSize: 13,
                                                        whiteSpace: 'pre-wrap',
                                                      }}
                                                    >
                                                      {example.code}
                                                    </Box>
                                                  )}

                                                  {example.language && (
                                                    <Chip
                                                      size="small"
                                                      label={example.language}
                                                      sx={{ mt: 1 }}
                                                    />
                                                  )}
                                                </Box>
                                              ),
                                            )}
                                          </Stack>

                                          <Divider sx={{ my: 2 }} />

                                          {/* EXERCISES */}

                                          <Typography
                                            fontWeight={700}
                                            mb={2}
                                          >
                                            Practical Exercises
                                          </Typography>

                                          <Stack spacing={2}>
                                            {lessonContent.exercises.map(
                                              (exercise, index) => (
                                                <Box
                                                  key={index}
                                                  sx={{
                                                    p: 2,
                                                    border: '1px solid #ECE8E4',
                                                    borderRadius: 2,
                                                  }}
                                                >
                                                  <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="center"
                                                    spacing={1}
                                                  >
                                                    <Typography fontWeight={600}>
                                                      {index + 1}. {exercise.title}
                                                    </Typography>

                                                    <Chip
                                                      size="small"
                                                      label={exercise.difficulty}
                                                      color={
                                                        exercise.difficulty === 'easy'
                                                          ? 'success'
                                                          : exercise.difficulty === 'medium'
                                                            ? 'warning'
                                                            : 'error'
                                                      }
                                                    />
                                                  </Stack>

                                                  <Typography
                                                    variant="body2"
                                                    mt={1}
                                                  >
                                                    {exercise.description}
                                                  </Typography>

                                                  {exercise.expectedOutcome && (
                                                    <Typography
                                                      variant="body2"
                                                      color="text.secondary"
                                                      mt={1}
                                                    >
                                                      Expected outcome: {exercise.expectedOutcome}
                                                    </Typography>
                                                  )}
                                                </Box>
                                              ),
                                            )}
                                          </Stack>

                                          <Divider sx={{ my: 2 }} />

                                          {/* KEY TAKEAWAYS */}

                                          <Typography
                                            fontWeight={700}
                                            mb={1}
                                          >
                                            Key Takeaways
                                          </Typography>

                                          <Stack spacing={1}>
                                            {lessonContent.keyTakeaways.map(
                                              (takeaway, index) => (
                                                <Typography
                                                  key={index}
                                                  variant="body2"
                                                >
                                                  • {takeaway}
                                                </Typography>
                                              ),
                                            )}
                                          </Stack>

                                          <Divider sx={{ my: 2 }} />

                                          {/* KNOWLEDGE CHECK */}

                                          <Typography
                                            fontWeight={700}
                                            mb={2}
                                          >
                                            Knowledge Check
                                          </Typography>

                                          <Stack spacing={2}>
                                            {lessonContent.knowledgeCheck.map(
                                              (question, index) => (
                                                <Box
                                                  key={index}
                                                  sx={{
                                                    p: 2,
                                                    bgcolor: '#F7F6F4',
                                                    borderRadius: 2,
                                                  }}
                                                >
                                                  <Typography fontWeight={600}>
                                                    {index + 1}. {question.question}
                                                  </Typography>

                                                  <Stack spacing={0.5} mt={1}>
                                                    {question.options.map(
                                                      (option, optionIndex) => (
                                                        <Typography
                                                          key={optionIndex}
                                                          variant="body2"
                                                          color={
                                                            option === question.correctAnswer
                                                              ? 'success.main'
                                                              : 'text.secondary'
                                                          }
                                                          fontWeight={
                                                            option === question.correctAnswer
                                                              ? 700
                                                              : 400
                                                          }
                                                        >
                                                          {String.fromCharCode(65 + optionIndex)}. {option}
                                                          {option === question.correctAnswer
                                                            ? ' ✓'
                                                            : ''}
                                                        </Typography>
                                                      ),
                                                    )}
                                                  </Stack>

                                                  <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    display="block"
                                                    mt={1}
                                                  >
                                                    Explanation: {question.explanation}
                                                  </Typography>
                                                </Box>
                                              ),
                                            )}
                                          </Stack>

                                          {/* SAVE LESSON CONTENT */}

                                          <Divider sx={{ my: 3 }} />

                                          <Stack
                                            direction={{
                                              xs: 'column',
                                              sm: 'row',
                                            }}
                                            justifyContent="space-between"
                                            alignItems={{
                                              xs: 'stretch',
                                              sm: 'center',
                                            }}
                                            spacing={2}
                                          >
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                            >
                                              Review the generated content before saving.
                                            </Typography>

                                            <Button
                                              variant="contained"
                                              color="success"
                                              disabled={isSaving || isGenerating}
                                              startIcon={
                                                isSaving ? (
                                                  <CircularProgress
                                                    size={17}
                                                    color="inherit"
                                                  />
                                                ) : (
                                                  <SaveRounded />
                                                )
                                              }
                                              onClick={() =>
                                                void handleSaveLessonContent(
                                                  lesson.id,
                                                )
                                              }
                                            >
                                              {isSaving
                                                ? 'Saving...'
                                                : 'Approve & Save Content'}
                                            </Button>
                                          </Stack>
                                        </Box>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              },
                            )}
                          </Stack>
                        </Box>
                      ),
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
