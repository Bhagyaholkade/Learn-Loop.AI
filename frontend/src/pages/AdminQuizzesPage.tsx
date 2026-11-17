
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
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

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

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

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === 'title' || name === 'description'
          ? value
          : value === ''
            ? 0
            : Number(value),
    }));
  };

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
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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
