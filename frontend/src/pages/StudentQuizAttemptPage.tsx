
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
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';

import {
  getQuizQuestions,
  submitQuiz,
  type QuizDetails,
  type StudentAnswer,
} from '../api/quizApi';

export default function StudentQuizAttemptPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const id = Number(quizId);

  // Fetch quiz questions
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError('');

        if (!Number.isInteger(id) || id <= 0) {
          throw new Error('Invalid quiz ID.');
        }

        const data = await getQuizQuestions(id);

        setQuiz(data);
        setTimeLeft(data.durationMinutes * 60);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Unable to load quiz.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  // Submit quiz
  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return;

    const payloadAnswers: StudentAnswer[] = quiz.questions.map(
      (question) => ({
        questionId: question.id,
        selectedOptionIndex: answers[question.id],
      }),
    );

    // Validate all answers
    if (
      payloadAnswers.some(
        (answer) => answer.selectedOptionIndex === undefined,
      )
    ) {
      setError('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await submitQuiz(id, {
        answers: payloadAnswers,
      });

      // Navigate to dedicated quiz result page
      navigate('/student/quizzes/result', {
        state: {
          result: response,
        },
        replace: true,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Unable to submit quiz. Please try again.',
      );
      setSubmitting(false);
    }
  }, [quiz, submitting, answers, id, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!quiz || submitting) return;

    if (timeLeft <= 0) {
      void handleSubmit();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [quiz, submitting, timeLeft, handleSubmit]);

  // Handle answer selection
  const handleAnswerChange = (
    questionId: number,
    value: string,
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: Number(value),
    }));
  };

  // Format countdown timer
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`;
  };

  // Loading screen
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  // Error screen
  if (error && !quiz) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>

        <Button
          sx={{ mt: 2 }}
          onClick={() => navigate('/student/quizzes')}
        >
          Back to Quizzes
        </Button>
      </Container>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Quiz Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {quiz.title}
          </Typography>

          <Typography color="text.secondary">
            {quiz.questions.length} questions · {quiz.totalMarks} marks
          </Typography>
        </Box>

        <Alert severity={timeLeft <= 60 ? 'error' : 'info'}>
          Time left: <strong>{formatTime(timeLeft)}</strong>
        </Alert>
      </Stack>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Question Card */}
      <Card>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            mb={3}
          >
            <Typography fontWeight={600}>
              Question {currentQuestion + 1} of {quiz.questions.length}
            </Typography>

            <Typography color="text.secondary">
              Answered: {answeredCount}/{quiz.questions.length}
            </Typography>
          </Stack>

          <Typography variant="h6" fontWeight={600} mb={3}>
            {question.questionText}
          </Typography>

          {/* Answer Options */}
          <FormControl fullWidth>
            <RadioGroup
              value={answers[question.id] ?? ''}
              onChange={(event) =>
                handleAnswerChange(
                  question.id,
                  event.target.value,
                )
              }
            >
              {question.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={String(index)}
                  control={<Radio />}
                  label={option}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 1,
                    mb: 1,
                    mx: 0,
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {/* Previous / Next / Submit */}
          <Stack
            direction="row"
            justifyContent="space-between"
            mt={4}
            gap={2}
          >
            <Button
              variant="outlined"
              disabled={currentQuestion === 0 || submitting}
              onClick={() =>
                setCurrentQuestion((previous) => previous - 1)
              }
            >
              Previous
            </Button>

            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                variant="contained"
                disabled={submitting}
                onClick={() =>
                  setCurrentQuestion((previous) => previous + 1)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                disabled={
                  submitting ||
                  answeredCount !== quiz.questions.length
                }
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <Box mt={3}>
        <Typography fontWeight={600} mb={1}>
          Question navigation
        </Typography>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {quiz.questions.map((item, index) => (
            <Button
              key={item.id}
              size="small"
              variant={
                currentQuestion === index ? 'contained' : 'outlined'
              }
              color={
                answers[item.id] !== undefined ? 'success' : 'inherit'
              }
              disabled={submitting}
              onClick={() => setCurrentQuestion(index)}
            >
              {index + 1}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Final Submit Button */}
      <Button
        fullWidth
        color="success"
        variant="contained"
        sx={{ mt: 3 }}
        disabled={
          submitting ||
          answeredCount !== quiz.questions.length
        }
        onClick={handleSubmit}
      >
        {submitting ? 'Submitting Quiz...' : 'Submit Quiz'}
      </Button>
    </Container>
  );
}
