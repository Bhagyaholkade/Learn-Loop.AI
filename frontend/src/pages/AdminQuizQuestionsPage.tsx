import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  addQuizQuestion,
  deleteQuizQuestion,
  getAdminQuizQuestions,
  updateQuizQuestion,
} from '../api/adminQuizQuestionsApi';

import type {
  AdminQuizQuestion,
  CreateQuestionData,
} from '../api/adminQuizQuestionsApi';

import { getAllAdminQuizzes } from '../api/adminQuizzesApi';

import type { AdminQuiz } from '../api/adminQuizzesApi';

const emptyForm: CreateQuestionData = {
  questionText: '',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  marks: 2,
  order: 1,
};

export default function AdminQuizQuestionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const id = Number(quizId);

  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<AdminQuizQuestion | null>(null);

  const [form, setForm] = useState<CreateQuestionData>(emptyForm);
  const [formError, setFormError] = useState('');

  const fetchData = useCallback(async () => {
    if (!Number.isInteger(id) || id < 1) {
      setError('Invalid quiz ID.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [quizList, questionList] = await Promise.all([
        getAllAdminQuizzes(),
        getAdminQuizQuestions(id),
      ]);

      const selectedQuiz = quizList.find((item) => item.id === id);

      if (!selectedQuiz) {
        setError('Quiz not found.');
        setQuiz(null);
        return;
      }

      setQuiz(selectedQuiz);
      setQuestions(questionList);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Unable to load quiz questions.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAssignedMarks = questions.reduce(
    (total, question) => total + question.marks,
    0,
  );

  const remainingMarks = (quiz?.totalMarks ?? 0) - totalAssignedMarks;

  const openAddDialog = () => {
    setEditingQuestion(null);

    setForm({
      ...emptyForm,
      order: questions.length + 1,
    });

    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (question: AdminQuizQuestion) => {
    setEditingQuestion(question);

    setForm({
      questionText: question.questionText,
      options: [...question.options],
      correctOptionIndex: question.correctOptionIndex,
      marks: question.marks,
      order: question.order,
    });

    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingQuestion(null);
    setFormError('');
  };

  const handleOptionChange = (index: number, value: string) => {
    setForm((previous) => ({
      ...previous,
      options: previous.options.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    }));
  };

  const validateForm = (): string => {
    if (!form.questionText.trim()) {
      return 'Please enter the question.';
    }

    if (form.options.length !== 4) {
      return 'A question must have exactly four options.';
    }

    if (form.options.some((option) => !option.trim())) {
      return 'Please fill in all four options.';
    }

    if (
      !Number.isInteger(form.correctOptionIndex) ||
      form.correctOptionIndex < 0 ||
      form.correctOptionIndex > 3
    ) {
      return 'Please select the correct answer.';
    }

    if (!Number.isInteger(form.marks) || form.marks < 1) {
      return 'Marks must be at least 1.';
    }

    if (!Number.isInteger(form.order) || form.order < 1) {
      return 'Question order must be at least 1.';
    }

    const duplicateOrder = questions.some(
      (question) =>
        question.order === form.order &&
        question.id !== editingQuestion?.id,
    );

    if (duplicateOrder) {
      return 'This question order is already used.';
    }

    return '';
  };

  const handleSaveQuestion = async () => {
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError('');
      setError('');
      setSuccess('');

      const payload: CreateQuestionData = {
        questionText: form.questionText.trim(),
        options: form.options.map((option) => option.trim()),
        correctOptionIndex: form.correctOptionIndex,
        marks: form.marks,
        order: form.order,
      };

      if (editingQuestion) {
        await updateQuizQuestion(
          id,
          editingQuestion.id,
          payload,
        );

        setSuccess('Question updated successfully.');
      } else {
        await addQuizQuestion(id, payload);

        setSuccess('Question added successfully.');
      }

      setDialogOpen(false);
      setEditingQuestion(null);

      await fetchData();
    } catch (err: any) {
      const message = err.response?.data?.message;

      setFormError(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Unable to save question.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this question?',
    );

    if (!confirmed) return;

    try {
      setDeletingId(questionId);
      setError('');
      setSuccess('');

      await deleteQuizQuestion(id, questionId);

      setSuccess('Question deleted successfully.');

      await fetchData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Unable to delete question.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!quiz) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          {error || 'Quiz not found.'}
        </Alert>

        <Button
          sx={{ mt: 2 }}
          onClick={() => navigate('/admin/quizzes')}
        >
          Back to Quizzes
        </Button>
      </Container>
    );
  }

  const isPublished = quiz.isPublished;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        onClick={() => navigate('/admin/quizzes')}
        sx={{ mb: 2 }}
      >
        ← Back to Quizzes
      </Button>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Manage Questions
          </Typography>

          <Typography color="text.secondary" mt={1}>
            {quiz.title}
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={openAddDialog}
          disabled={isPublished}
        >
          Add Question
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {isPublished && (
        <Alert severity="info" sx={{ mb: 3 }}>
          This quiz is published. Unpublish it before editing its questions.
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography color="text.secondary">
                Total Questions
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {questions.length}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography color="text.secondary">
                Assigned Marks
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {totalAssignedMarks} / {quiz.totalMarks}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography color="text.secondary">
                Remaining Marks
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                color={
                  remainingMarks === 0
                    ? 'success.main'
                    : remainingMarks < 0
                      ? 'error.main'
                      : 'warning.main'
                }
              >
                {remainingMarks}
              </Typography>
            </Grid>
          </Grid>

          {remainingMarks === 0 && questions.length > 0 ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Question marks match the quiz total. The quiz is ready for
              publishing validation.
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Assigned question marks must equal {quiz.totalMarks} before
              this quiz can be published.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Typography variant="h5" fontWeight={600} mb={2}>
        Questions
      </Typography>

      {questions.length === 0 ? (
        <Card>
          <CardContent>
            <Typography textAlign="center" color="text.secondary" py={4}>
              No questions added yet. Click Add Question to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box flex={1}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Question {question.order} · {question.marks} marks
                    </Typography>

                    <Typography variant="h6" fontWeight={600} mt={1}>
                      {question.questionText}
                    </Typography>

                    <Stack spacing={1} mt={2}>
                      {question.options.map((option, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1.5,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor:
                              index === question.correctOptionIndex
                                ? 'success.main'
                                : 'divider',
                            backgroundColor:
                              index === question.correctOptionIndex
                                ? 'success.light'
                                : 'transparent',
                          }}
                        >
                          <Typography>
                            {String.fromCharCode(65 + index)}. {option}
                            {index === question.correctOptionIndex &&
                              ' ✓ Correct answer'}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Stack
                    direction={{ xs: 'row', sm: 'column' }}
                    spacing={1}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => openEditDialog(question)}
                      disabled={isPublished || deletingId === question.id}
                    >
                      Edit
                    </Button>

                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={isPublished || deletingId === question.id}
                    >
                      {deletingId === question.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} mt={1}>
            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}

            <TextField
              label="Question"
              value={form.questionText}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  questionText: event.target.value,
                }))
              }
              fullWidth
              multiline
              rows={2}
              required
            />

            <Typography fontWeight={600}>
              Answer Options
            </Typography>

            {form.options.map((option, index) => (
              <TextField
                key={index}
                label={`Option ${String.fromCharCode(65 + index)}`}
                value={option}
                onChange={(event) =>
                  handleOptionChange(index, event.target.value)
                }
                fullWidth
                required
              />
            ))}

            <FormControl>
              <Typography fontWeight={600} mb={1}>
                Select Correct Answer
              </Typography>

              <RadioGroup
                value={String(form.correctOptionIndex)}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    correctOptionIndex: Number(event.target.value),
                  }))
                }
              >
                {form.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={String(index)}
                    control={<Radio />}
                    label={
                      option.trim() ||
                      `Option ${String.fromCharCode(65 + index)}`
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Marks"
                  type="number"
                  value={form.marks}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      marks: Number(event.target.value),
                    }))
                  }
                  fullWidth
                  required
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Question Order"
                  type="number"
                  value={form.order}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      order: Number(event.target.value),
                    }))
                  }
                  fullWidth
                  required
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
            color="inherit"
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveQuestion}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingQuestion
                ? 'Update Question'
                : 'Add Question'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}