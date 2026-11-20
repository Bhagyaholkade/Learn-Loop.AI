
import { useCallback, useEffect, useState } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

import api from '../api/axios';

import {
  approveQuiz,
  createQuiz,
  generateAiQuiz,
  getAllAdminQuizzes,
  publishQuiz,
  unpublishQuiz,
} from '../api/adminQuizzesApi';

import type {
  AdminQuiz,
  CreateQuizData,
  GenerateAiQuizData,
} from '../api/adminQuizzesApi';

import { getCourses } from '../api/courseApi';
import type { Course } from '../api/courseApi';
import { getLessonsByCourse } from '../api/lessonApi';
import type { Lesson } from '../api/lessonApi';

const initialForm: CreateQuizData = {
  title: '',
  description: '',
  courseId: 0,
  durationMinutes: 30,
  totalMarks: 10,
  passingMarks: 4,
};

interface GenerateAllChapterQuizzesData {
  courseId: number;
  numberOfQuestions: number;
  marksPerQuestion: number;
  durationMinutes?: number;
  passingMarks?: number;
  additionalInstructions?: string;
}

interface ChapterQuizGenerationDetail {
  chapterId: number;
  chapterTitle: string;
  status: 'GENERATED' | 'SKIPPED' | 'FAILED';
  quizId?: number;
  message: string;
}

interface ChapterQuizGenerationResponse {
  success: boolean;
  message: string;
  data: {
    totalChapters: number;
    generated: number;
    skipped: number;
    failed: number;
    details: ChapterQuizGenerationDetail[];
  };
}

const initialBulkAiForm: GenerateAllChapterQuizzesData = {
  courseId: 0,
  numberOfQuestions: 10,
  marksPerQuestion: 2,
  durationMinutes: 30,
  passingMarks: 12,
  additionalInstructions: '',
};

const initialAiForm: GenerateAiQuizData = {
  courseId: 0,
  lessonId: 0,
  title: '',
  numberOfQuestions: 5,
  marksPerQuestion: 2,
  durationMinutes: 15,
  passingMarks: 6,
  additionalInstructions: '',
};

const getErrorMessage = (error: unknown): string => {
  const apiError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) return message.join(', ');

  return message || 'Something went wrong. Please try again.';
};

export default function AdminQuizzesPage() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<AdminQuiz | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [bulkAiDialogOpen, setBulkAiDialogOpen] = useState(false);
  const [bulkAiForm, setBulkAiForm] =
    useState<GenerateAllChapterQuizzesData>(initialBulkAiForm);
  const [bulkAiSaving, setBulkAiSaving] = useState(false);
  const [bulkResults, setBulkResults] =
    useState<ChapterQuizGenerationResponse['data'] | null>(null);

  const [form, setForm] = useState<CreateQuizData>(initialForm);
  const [aiForm, setAiForm] = useState<GenerateAiQuizData>(initialAiForm);

  const fetchQuizzes = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError('');

      const data = await getAllAdminQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const response = await getCourses({ page: 1, limit: 100 });
      setCourses(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuizzes(true);
    void fetchCourses();
  }, [fetchQuizzes, fetchCourses]);

  const fetchLessons = async (courseId: number) => {
    try {
      setLessonsLoading(true);
      setLessons([]);
      const data = await getLessonsByCourse(courseId);
      setLessons(data);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setLessonsLoading(false);
    }
  };

  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter((quiz) => quiz.isPublished).length;
  const pendingQuizzes = quizzes.filter(
    (quiz) => quiz.isAiGenerated && quiz.reviewStatus === 'PENDING',
  ).length;
  const draftQuizzes = quizzes.filter((quiz) => !quiz.isPublished).length;



  const handleCreateQuiz = async () => {
    if (!form.title.trim() || !form.courseId) {
      setFormError('Please enter a title and select a course.');
      return;
    }

    if (
      form.durationMinutes < 1 ||
      form.totalMarks < 1 ||
      form.passingMarks < 0 ||
      form.passingMarks > form.totalMarks
    ) {
      setFormError('Please enter valid duration and marks.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      await createQuiz({
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
      });

      setDialogOpen(false);
      setForm(initialForm);
      setSuccess('Manual quiz created successfully.');
      await fetchQuizzes();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAiCourseChange = async (event: SelectChangeEvent<number>) => {
    const courseId = Number(event.target.value);

    setAiForm((previous) => ({
      ...previous,
      courseId,
      lessonId: 0,
    }));

    setFormError('');

    if (courseId) {
      await fetchLessons(courseId);
    } else {
      setLessons([]);
    }
  };

  const handleGenerateAiQuiz = async () => {
    if (!aiForm.courseId || !aiForm.lessonId || !aiForm.title.trim()) {
      setFormError('Please select a course, lesson and enter a quiz title.');
      return;
    }

    const totalMarks =
      aiForm.numberOfQuestions * aiForm.marksPerQuestion;

    if (
      !Number.isInteger(aiForm.numberOfQuestions) ||
      aiForm.numberOfQuestions < 1 ||
      aiForm.numberOfQuestions > 50 ||
      !Number.isInteger(aiForm.marksPerQuestion) ||
      aiForm.marksPerQuestion < 1 ||
      aiForm.marksPerQuestion > 10
    ) {
      setFormError('Question count must be 1–50 and marks per question 1–10.');
      return;
    }

    if (
      !aiForm.durationMinutes ||
      aiForm.durationMinutes < 1 ||
      aiForm.durationMinutes > 300
    ) {
      setFormError('Duration must be between 1 and 300 minutes.');
      return;
    }

    if (
      aiForm.passingMarks === undefined ||
      aiForm.passingMarks < 0 ||
      aiForm.passingMarks > totalMarks
    ) {
      setFormError(`Passing marks must be between 0 and ${totalMarks}.`);
      return;
    }

    try {
      setAiSaving(true);
      setFormError('');
      setError('');

      await generateAiQuiz({
        ...aiForm,
        title: aiForm.title.trim(),
        additionalInstructions:
          aiForm.additionalInstructions?.trim() || undefined,
      });

      setAiDialogOpen(false);
      setAiForm(initialAiForm);
      setLessons([]);
      setSuccess('AI chapter quiz generated successfully. Review it before publishing.');
      await fetchQuizzes();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setAiSaving(false);
    }
  };

  const handleGenerateAllChapterQuizzes = async () => {
    const totalMarks =
      bulkAiForm.numberOfQuestions * bulkAiForm.marksPerQuestion;

    if (!bulkAiForm.courseId) {
      setFormError('Please select a course.');
      return;
    }

    if (
      !Number.isInteger(bulkAiForm.numberOfQuestions) ||
      bulkAiForm.numberOfQuestions < 1 ||
      bulkAiForm.numberOfQuestions > 50
    ) {
      setFormError('Question count must be between 1 and 50.');
      return;
    }

    if (
      !Number.isInteger(bulkAiForm.marksPerQuestion) ||
      bulkAiForm.marksPerQuestion < 1 ||
      bulkAiForm.marksPerQuestion > 10
    ) {
      setFormError('Marks per question must be between 1 and 10.');
      return;
    }

    if (
      !bulkAiForm.durationMinutes ||
      bulkAiForm.durationMinutes < 1 ||
      bulkAiForm.durationMinutes > 300
    ) {
      setFormError('Duration must be between 1 and 300 minutes.');
      return;
    }

    if (
      bulkAiForm.passingMarks === undefined ||
      bulkAiForm.passingMarks < 0 ||
      bulkAiForm.passingMarks > totalMarks
    ) {
      setFormError(`Passing marks must be between 0 and ${totalMarks}.`);
      return;
    }

    try {
      setBulkAiSaving(true);
      setFormError('');
      setError('');
      setBulkResults(null);

      const response = await api.post<ChapterQuizGenerationResponse>(
        '/ai-quiz/generate-all-chapters',
        {
          ...bulkAiForm,
          additionalInstructions:
            bulkAiForm.additionalInstructions?.trim() || undefined,
        },
      );

      setBulkResults(response.data.data);
      await fetchQuizzes();

      const result = response.data.data;
      setSuccess(
        `Bulk generation completed: ${result.generated} generated, ${result.skipped} skipped, ${result.failed} failed.`,
      );
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBulkAiSaving(false);
    }
  };

  const handleApprove = async (quizId: number) => {
    try {
      setActionLoading(quizId);
      setError('');
      await approveQuiz(quizId);
      setSuccess('AI quiz approved successfully.');
      await fetchQuizzes();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishToggle = async (quiz: AdminQuiz) => {
    try {
      setActionLoading(quiz.id);
      setError('');

      if (quiz.isPublished) {
        await unpublishQuiz(quiz.id);
        setSuccess('Quiz unpublished successfully.');
      } else {
        await publishQuiz(quiz.id);
        setSuccess('Quiz published successfully.');
      }

      await fetchQuizzes();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const openDeleteDialog = (quiz: AdminQuiz) => {
    setQuizToDelete(quiz);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deletingQuiz) return;
    setDeleteDialogOpen(false);
    setQuizToDelete(null);
  };

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      setDeletingQuiz(true);
      setError('');

      await api.delete(`/quizzes/${quizToDelete.id}`);

      setDeleteDialogOpen(false);
      setSuccess(`"${quizToDelete.title}" was deleted successfully.`);
      setQuizToDelete(null);

      await fetchQuizzes();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingQuiz(false);
    }
  };

  const handleManageQuestions = (quizId: number) => {
    navigate(`/admin/quizzes/${quizId}/questions`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Quiz Management
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Create, generate, review and publish course assessments.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => {
              setBulkAiForm(initialBulkAiForm);
              setBulkResults(null);
              setFormError('');
              setBulkAiDialogOpen(true);
            }}
            disabled={coursesLoading || courses.length === 0}
          >
            Generate All Chapter Quizzes
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setAiForm(initialAiForm);
              setLessons([]);
              setFormError('');
              setAiDialogOpen(true);
            }}
            disabled={coursesLoading || courses.length === 0}
          >
            Generate AI Quiz
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setForm(initialForm);
              setFormError('');
              setDialogOpen(true);
            }}
            disabled={coursesLoading || courses.length === 0}
          >
            Create Manual Quiz
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={2} mb={4}>
        {[
          { label: 'Total Quizzes', value: totalQuizzes, color: 'text.primary' },
          { label: 'Published', value: publishedQuizzes, color: 'success.main' },
          { label: 'Pending AI Review', value: pendingQuizzes, color: 'warning.main' },
          { label: 'Drafts', value: draftQuizzes, color: 'text.primary' },
        ].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">{item.label}</Typography>
                <Typography variant="h4" fontWeight={700} color={item.color}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" fontWeight={600} mb={2}>
        All Quizzes
      </Typography>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={4}>
              No quizzes created yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} md={6} key={quiz.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Typography variant="h6" fontWeight={700}>{quiz.title}</Typography>
                    <Chip
                      label={quiz.isPublished ? 'Published' : 'Draft'}
                      color={quiz.isPublished ? 'success' : 'warning'}
                      size="small"
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                    <Chip
                      label={quiz.quizType === 'CHAPTER' ? 'Chapter Quiz' : 'Final Assessment'}
                      size="small"
                      variant="outlined"
                    />
                    {quiz.isAiGenerated && <Chip label="AI Generated" color="info" size="small" />}
                    {quiz.isAiGenerated && (
                      <Chip
                        label={quiz.reviewStatus}
                        color={quiz.reviewStatus === 'APPROVED' ? 'success' : 'warning'}
                        size="small"
                      />
                    )}
                  </Stack>

                  <Typography color="text.secondary" mt={1}>
                    {quiz.description || 'No description provided.'}
                  </Typography>

                  <Stack spacing={1} mt={2}>
                    <Typography><strong>Course:</strong> {quiz.course?.title || 'N/A'}</Typography>
                    {quiz.lesson && (
                      <Typography><strong>Lesson:</strong> {quiz.lesson.title}</Typography>
                    )}
                    <Typography><strong>Duration:</strong> {quiz.durationMinutes} minutes</Typography>
                    <Typography><strong>Total Marks:</strong> {quiz.totalMarks}</Typography>
                    <Typography><strong>Passing Marks:</strong> {quiz.passingMarks}</Typography>
                  </Stack>

                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ mt: 3 }}
                    onClick={() => handleManageQuestions(quiz.id)}
                  >
                    Review / Manage Questions
                  </Button>

                  {quiz.isAiGenerated &&
                    quiz.reviewStatus === 'PENDING' &&
                    !quiz.isPublished && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        sx={{ mt: 1.5 }}
                        disabled={actionLoading === quiz.id}
                        onClick={() => handleApprove(quiz.id)}
                      >
                        {actionLoading === quiz.id ? 'Approving...' : 'Approve AI Quiz'}
                      </Button>
                    )}

                  {(!quiz.isAiGenerated || quiz.reviewStatus === 'APPROVED') && (
                    <Button
                      fullWidth
                      variant={quiz.isPublished ? 'outlined' : 'contained'}
                      color={quiz.isPublished ? 'warning' : 'success'}
                      sx={{ mt: 1.5 }}
                      disabled={actionLoading === quiz.id}
                      onClick={() => handlePublishToggle(quiz)}
                    >
                      {actionLoading === quiz.id
                        ? 'Updating...'
                        : quiz.isPublished
                          ? 'Unpublish Quiz'
                          : 'Publish Quiz'}
                    </Button>
                  )}

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    sx={{ mt: 1.5 }}
                    disabled={deletingQuiz || actionLoading === quiz.id}
                    onClick={() => openDeleteDialog(quiz)}
                  >
                    Delete Quiz
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Bulk AI Chapter Quiz Generation Dialog */}
      <Dialog
        open={bulkAiDialogOpen}
        onClose={() => !bulkAiSaving && setBulkAiDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Generate All Chapter Quizzes</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            <Alert severity="info">
              This generates one unpublished AI quiz for each chapter in the selected course.
              Existing chapter quizzes are skipped. If a chapter fails, you can run generation
              again; previously generated chapters will be skipped.
            </Alert>

            {formError && <Alert severity="error">{formError}</Alert>}

            <FormControl fullWidth required>
              <InputLabel id="bulk-ai-course-label">Select Course</InputLabel>
              <Select<number>
                labelId="bulk-ai-course-label"
                label="Select Course"
                value={bulkAiForm.courseId}
                onChange={(event) => {
                  setBulkAiForm((previous) => ({
                    ...previous,
                    courseId: Number(event.target.value),
                  }));
                  setBulkResults(null);
                }}
              >
                <MenuItem value={0} disabled>Select a course</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Questions Per Chapter"
                  type="number"
                  value={bulkAiForm.numberOfQuestions}
                  onChange={(event) =>
                    setBulkAiForm((previous) => ({
                      ...previous,
                      numberOfQuestions: Number(event.target.value),
                      passingMarks: Math.ceil(
                        Number(event.target.value) *
                          previous.marksPerQuestion *
                          0.6,
                      ),
                    }))
                  }
                  inputProps={{ min: 1, max: 50, step: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Marks Per Question"
                  type="number"
                  value={bulkAiForm.marksPerQuestion}
                  onChange={(event) =>
                    setBulkAiForm((previous) => ({
                      ...previous,
                      marksPerQuestion: Number(event.target.value),
                      passingMarks: Math.ceil(
                        previous.numberOfQuestions *
                          Number(event.target.value) *
                          0.6,
                      ),
                    }))
                  }
                  inputProps={{ min: 1, max: 10, step: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duration Per Quiz (minutes)"
                  type="number"
                  value={bulkAiForm.durationMinutes ?? ''}
                  onChange={(event) =>
                    setBulkAiForm((previous) => ({
                      ...previous,
                      durationMinutes: Number(event.target.value),
                    }))
                  }
                  inputProps={{ min: 1, max: 300, step: 1 }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Passing Marks"
                  type="number"
                  value={bulkAiForm.passingMarks ?? ''}
                  onChange={(event) =>
                    setBulkAiForm((previous) => ({
                      ...previous,
                      passingMarks: Number(event.target.value),
                    }))
                  }
                  inputProps={{
                    min: 0,
                    max:
                      bulkAiForm.numberOfQuestions *
                      bulkAiForm.marksPerQuestion,
                    step: 1,
                  }}
                  helperText={`Total marks per quiz: ${
                    bulkAiForm.numberOfQuestions *
                    bulkAiForm.marksPerQuestion
                  }`}
                  fullWidth
                />
              </Grid>
            </Grid>

            <TextField
              label="Additional AI Instructions (Optional)"
              value={bulkAiForm.additionalInstructions ?? ''}
              onChange={(event) =>
                setBulkAiForm((previous) => ({
                  ...previous,
                  additionalInstructions: event.target.value,
                }))
              }
              multiline
              rows={3}
              inputProps={{ maxLength: 1000 }}
              placeholder="Example: Generate scenario-based questions with four options and clear explanations."
              fullWidth
            />

            {bulkAiSaving && (
              <Stack direction="row" spacing={2} alignItems="center">
                <CircularProgress size={22} />
                <Typography color="text.secondary">
                  Generating chapter quizzes sequentially. Please keep this page open.
                </Typography>
              </Stack>
            )}

            {bulkResults && (
              <Box>
                <Typography variant="h6" fontWeight={700} mb={1}>
                  Generation Results
                </Typography>
                <Grid container spacing={1} mb={2}>
                  {[
                    { label: 'Total Chapters', value: bulkResults.totalChapters },
                    { label: 'Generated', value: bulkResults.generated },
                    { label: 'Skipped', value: bulkResults.skipped },
                    { label: 'Failed', value: bulkResults.failed },
                  ].map((item) => (
                    <Grid item xs={6} sm={3} key={item.label}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="body2" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {item.value}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Stack spacing={1}>
                  {bulkResults.details.map((detail) => (
                    <Alert
                      key={detail.chapterId}
                      severity={
                        detail.status === 'GENERATED'
                          ? 'success'
                          : detail.status === 'SKIPPED'
                            ? 'info'
                            : 'error'
                      }
                      variant="outlined"
                    >
                      <Typography fontWeight={600}>
                        {detail.chapterTitle} ({detail.status})
                      </Typography>
                      <Typography variant="body2">
                        {detail.message}
                        {detail.quizId ? ` · Quiz ID: ${detail.quizId}` : ''}
                      </Typography>
                    </Alert>
                  ))}
                </Stack>

                {bulkResults.failed > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Select the same course and run generation again to retry failed chapters.
                    Existing quizzes will be skipped by the backend.
                  </Alert>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setBulkAiDialogOpen(false)}
            disabled={bulkAiSaving}
            color="inherit"
          >
            Close
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGenerateAllChapterQuizzes}
            disabled={bulkAiSaving || coursesLoading || !bulkAiForm.courseId}
          >
            {bulkAiSaving
              ? 'Generating...'
              : bulkResults?.failed
                ? 'Retry Failed Chapters'
                : 'Generate All Chapter Quizzes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Quiz Generation Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={() => !aiSaving && setAiDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Generate AI Chapter Quiz</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Quiz Title"
              value={aiForm.title}
              onChange={(event) =>
                setAiForm((previous) => ({ ...previous, title: event.target.value }))
              }
              fullWidth
              required
              inputProps={{ maxLength: 200 }}
            />

            <FormControl fullWidth required>
              <InputLabel id="ai-course-label">Select Course</InputLabel>
              <Select<number>
                labelId="ai-course-label"
                label="Select Course"
                value={aiForm.courseId}
                onChange={handleAiCourseChange}
              >
                <MenuItem value={0} disabled>Select a course</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required disabled={!aiForm.courseId || lessonsLoading}>
              <InputLabel id="ai-lesson-label">Select Chapter / Lesson</InputLabel>
              <Select<number>
                labelId="ai-lesson-label"
                label="Select Chapter / Lesson"
                value={aiForm.lessonId}
                onChange={(event) =>
                  setAiForm((previous) => ({
                    ...previous,
                    lessonId: Number(event.target.value),
                  }))
                }
              >
                <MenuItem value={0} disabled>
                  {lessonsLoading ? 'Loading lessons...' : 'Select a lesson'}
                </MenuItem>
                {lessons.map((lesson) => (
                  <MenuItem key={lesson.id} value={lesson.id}>
                    {lesson.order}. {lesson.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {lessonsLoading && <CircularProgress size={22} />}

            {aiForm.courseId > 0 && !lessonsLoading && lessons.length === 0 && (
              <Alert severity="warning">
                No lessons found for this course. Add lessons before generating a chapter quiz.
              </Alert>
            )}

            <TextField
              label="Number of Questions"
              type="number"
              value={aiForm.numberOfQuestions}
              onChange={(event) =>
                setAiForm((previous) => ({
                  ...previous,
                  numberOfQuestions: Number(event.target.value),
                }))
              }
              inputProps={{ min: 1, max: 50, step: 1 }}
              fullWidth
            />

            <TextField
              label="Marks Per Question"
              type="number"
              value={aiForm.marksPerQuestion}
              onChange={(event) =>
                setAiForm((previous) => ({
                  ...previous,
                  marksPerQuestion: Number(event.target.value),
                }))
              }
              inputProps={{ min: 1, max: 10, step: 1 }}
              fullWidth
            />

            <TextField
              label="Duration (minutes)"
              type="number"
              value={aiForm.durationMinutes ?? ''}
              onChange={(event) =>
                setAiForm((previous) => ({
                  ...previous,
                  durationMinutes: Number(event.target.value),
                }))
              }
              inputProps={{ min: 1, max: 300, step: 1 }}
              fullWidth
            />

            <TextField
              label="Passing Marks"
              type="number"
              value={aiForm.passingMarks ?? ''}
              onChange={(event) =>
                setAiForm((previous) => ({
                  ...previous,
                  passingMarks: Number(event.target.value),
                }))
              }
              inputProps={{ min: 0, step: 1 }}
              helperText={`Total marks: ${aiForm.numberOfQuestions * aiForm.marksPerQuestion}`}
              fullWidth
            />

            <TextField
              label="Additional AI Instructions (Optional)"
              value={aiForm.additionalInstructions ?? ''}
              onChange={(event) =>
                setAiForm((previous) => ({
                  ...previous,
                  additionalInstructions: event.target.value,
                }))
              }
              multiline
              rows={3}
              inputProps={{ maxLength: 1000 }}
              placeholder="Example: Include scenario-based and practical questions."
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAiDialogOpen(false)} disabled={aiSaving} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateAiQuiz}
            disabled={aiSaving || lessonsLoading || !lessons.length}
          >
            {aiSaving ? 'Generating with Gemini...' : 'Generate AI Quiz'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Quiz Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete Quiz?</DialogTitle>
        <DialogContent>
          <Stack spacing={1} mt={1}>
            <Alert severity="warning">
              This action cannot be undone. The quiz and its associated questions will be deleted.
            </Alert>
            <Typography>
              Are you sure you want to delete
              {' '}
              <strong>{quizToDelete?.title || 'this quiz'}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If this quiz has student attempts, the backend may prevent deletion depending on its
              relationship constraints.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} disabled={deletingQuiz} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteQuiz}
            disabled={deletingQuiz || !quizToDelete}
          >
            {deletingQuiz ? 'Deleting...' : 'Delete Quiz'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Quiz Creation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create New Manual Quiz</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Quiz Title"
              value={form.title}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, title: event.target.value }))
              }
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={form.description || ''}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, description: event.target.value }))
              }
              fullWidth
              multiline
              rows={3}
            />

            <FormControl fullWidth required>
              <InputLabel id="manual-course-label">Select Course</InputLabel>
              <Select<number>
                labelId="manual-course-label"
                label="Select Course"
                value={form.courseId}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    courseId: Number(event.target.value),
                  }))
                }
              >
                <MenuItem value={0} disabled>Select a course</MenuItem>
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Duration (minutes)"
              type="number"
              value={form.durationMinutes}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, durationMinutes: Number(event.target.value) }))
              }
              fullWidth
            />

            <TextField
              label="Total Marks"
              type="number"
              value={form.totalMarks}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, totalMarks: Number(event.target.value) }))
              }
              fullWidth
            />

            <TextField
              label="Passing Marks"
              type="number"
              value={form.passingMarks}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, passingMarks: Number(event.target.value) }))
              }
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateQuiz} disabled={saving}>
            {saving ? 'Creating...' : 'Create Quiz'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
