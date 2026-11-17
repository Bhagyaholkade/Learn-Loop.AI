
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';
import { getPublishedQuizzes, type Quiz } from '../api/quizApi';

interface QuizAttempt {
  id: number;
  quizId?: number;
  quiz?: {
    id: number;
    title?: string;
  };
  obtainedMarks: number;
  totalMarks: number;
  isPassed: boolean;
  createdAt?: string;
  submittedAt?: string;
}

export default function StudentQuizzesPage() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [quizData, attemptsResponse] = await Promise.all([
          getPublishedQuizzes(),
          api.get<QuizAttempt[]>('/student/quizzes/attempts'),
        ]);

        setQuizzes(quizData);
        setAttempts(attemptsResponse.data);
      } catch (err: unknown) {
        const message =
          (err as {
            response?: { data?: { message?: string } };
          }).response?.data?.message;

        setError(message || 'Unable to load quizzes.');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const getLatestAttempt = (quizId: number) => {
    const quizAttempts = attempts.filter(
      (attempt) =>
        Number(attempt.quizId ?? attempt.quiz?.id) === quizId,
    );

    return quizAttempts.sort((a, b) => {
      const aDate = a.submittedAt || a.createdAt;
      const bDate = b.submittedAt || b.createdAt;

      if (aDate && bDate) {
        return (
          new Date(bDate).getTime() -
          new Date(aDate).getTime()
        );
      }

      return b.id - a.id;
    })[0];
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

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Quizzes & Assessments
          </Typography>

          <Typography color="text.secondary" mt={1}>
            Test your knowledge and track your learning progress.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => navigate('/student/quizzes/attempts')}
        >
          My Quiz Attempts
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && quizzes.length === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              No quizzes available
            </Typography>

            <Typography color="text.secondary" mt={1}>
              No published quizzes are available for your
              enrolled courses yet.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {quizzes.map((quiz) => {
          const latestAttempt = getLatestAttempt(quiz.id);
          const hasAttempted = Boolean(latestAttempt);
          const hasPassed = latestAttempt?.isPassed === true;

          return (
            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  transition: '0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 5,
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 3,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Chip
                      label={
                        hasPassed
                          ? 'Passed'
                          : hasAttempted
                            ? 'Attempted'
                            : 'Not Attempted'
                      }
                      color={
                        hasPassed
                          ? 'success'
                          : hasAttempted
                            ? 'warning'
                            : 'primary'
                      }
                      size="small"
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Quiz #{quiz.id}
                    </Typography>
                  </Stack>

                  <Typography variant="h6" fontWeight={700} mb={1}>
                    {quiz.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={2}
                    sx={{ minHeight: 40 }}
                  >
                    {quiz.description ||
                      'Test your course knowledge.'}
                  </Typography>

                  <Typography variant="body2" fontWeight={600} mb={2}>
                    Course: {quiz.course?.title || 'Course'}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    useFlexGap
                    mb={2}
                  >
                    <Chip
                      label={`${quiz.durationMinutes} minutes`}
                      variant="outlined"
                      size="small"
                    />

                    <Chip
                      label={`${quiz.totalMarks} marks`}
                      variant="outlined"
                      size="small"
                    />
                  </Stack>

                  {latestAttempt && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={
                          hasPassed
                            ? 'success.main'
                            : 'error.main'
                        }
                      >
                        Latest Score:{' '}
                        {latestAttempt.obtainedMarks}/
                        {latestAttempt.totalMarks}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        {hasPassed
                          ? 'Assessment passed'
                          : 'Assessment not passed'}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ mt: 'auto' }}>
                    {!hasAttempted ? (
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() =>
                          navigate(
                            `/student/quizzes/${quiz.id}/instructions`,
                          )
                        }
                      >
                        Start Quiz
                      </Button>
                    ) : (
                      <Stack spacing={1}>
                        <Button
                          fullWidth
                          variant="contained"
                          color={hasPassed ? 'success' : 'primary'}
                          onClick={() =>
                            navigate(
                              `/student/quizzes/attempts/${latestAttempt.id}`,
                            )
                          }
                        >
                          View Result
                        </Button>

                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() =>
                            navigate(
                              `/student/quizzes/${quiz.id}/instructions`,
                            )
                          }
                        >
                          Retake Quiz
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
