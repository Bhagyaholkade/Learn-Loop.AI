
import { useEffect, useState } from 'react';
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
  Stack,
  Typography,
} from '@mui/material';

import {
  getMyQuizAttempts,
  type QuizAttempt,
} from '../api/quizApi';

export default function StudentQuizAttemptsPage() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getMyQuizAttempts();
        setAttempts(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Unable to load quiz attempt history.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            My Quiz History
          </Typography>
          <Typography color="text.secondary">
            Review your previous quiz attempts and performance.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={() => navigate('/student/quizzes')}
        >
          Back to Quizzes
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!error && attempts.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" fontWeight={600}>
              No quiz attempts yet
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Complete your first quiz to see your results here.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => navigate('/student/quizzes')}
            >
              Explore Quizzes
            </Button>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2}>
        {attempts.map((attempt) => (
          <Card key={attempt.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {attempt.quiz.title}
                  </Typography>

                  <Typography color="text.secondary" variant="body2">
                    Course: {attempt.quiz.course}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ mt: 1 }}
                  >
                    Submitted: {formatDate(attempt.submittedAt)}
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {attempt.obtainedMarks}/{attempt.totalMarks}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Marks obtained
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {attempt.percentage}%
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Percentage
                    </Typography>
                  </Box>

                  <Chip
                    label={attempt.isPassed ? 'Passed' : 'Failed'}
                    color={attempt.isPassed ? 'success' : 'error'}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
