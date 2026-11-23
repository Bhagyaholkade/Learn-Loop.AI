
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import { getPublishedQuizzes, type Quiz } from '../api/quizApi';

export default function QuizInstructionsPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizzes = await getPublishedQuizzes();

        const selectedQuiz = quizzes.find(
          (item) => item.id === Number(quizId),
        );

        if (!selectedQuiz) {
          throw new Error('Quiz not found or unavailable.');
        }

        setQuiz(selectedQuiz);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Unable to load quiz details.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !quiz) {
    return (
      <Container maxWidth="sm" sx={{ mt: 5 }}>
        <Alert severity="error">
          {error || 'Quiz not found.'}
        </Alert>

        <Button
          sx={{ mt: 2 }}
          onClick={() => navigate('/student/quizzes')}
        >
          Back to Quizzes
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Typography
            variant="overline"
            color="primary"
            fontWeight={700}
          >
            QUIZ INSTRUCTIONS
          </Typography>

          <Typography variant="h4" fontWeight={700} mt={1}>
            {quiz.title}
          </Typography>

          <Typography color="text.secondary" mt={1}>
            {quiz.description || 'Test your knowledge of this course.'}
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight={700} mb={2}>
            Quiz Overview
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Typography color="text.secondary" variant="body2">
                Course
              </Typography>
              <Typography fontWeight={600}>
                {quiz.course?.title || 'Course'}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" variant="body2">
                Duration
              </Typography>
              <Typography fontWeight={600}>
                {quiz.durationMinutes} minutes
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" variant="body2">
                Total Marks
              </Typography>
              <Typography fontWeight={600}>
                {quiz.totalMarks}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" variant="body2">
                Passing Marks
              </Typography>
              <Typography fontWeight={600}>
                {quiz.passingMarks ?? 'Not specified'}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight={700} mb={2}>
            Important Instructions
          </Typography>

          <Stack spacing={1.5}>
            {[
              'Read each question carefully before selecting an answer.',
              'Select one option for each question.',
              'Answer all questions before submitting.',
              'You can navigate between questions before submission.',
              'Keep track of the remaining time.',
              'Once submitted, your answers cannot be changed.',
              'Your score will be calculated automatically.',
            ].map((instruction, index) => (
              <Stack
                key={index}
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
              >
                <Typography color="primary" fontWeight={700}>
                  {index + 1}.
                </Typography>

                <Typography color="text.secondary">
                  {instruction}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {quiz.quizType === 'FINAL' && !quiz.isLocked && (
            <Alert severity="success" sx={{ mt: 3 }}>
              This is the final quiz. Pass it to earn your course
              certificate automatically.
            </Alert>
          )}

          {quiz.isLocked ? (
            <Alert severity="warning" sx={{ mt: 3 }}>
              {quiz.lockedReason ||
                'Complete all lessons in this course to unlock the final quiz.'}
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mt: 3 }}>
              The quiz timer starts when you enter the quiz attempt page.
            </Alert>
          )}

          <Stack
            direction={{ xs: 'column-reverse', sm: 'row' }}
            spacing={2}
            mt={4}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/student/quizzes')}
            >
              Go Back
            </Button>

            <Button
              fullWidth
              variant="contained"
              disabled={Boolean(quiz.isLocked)}
              onClick={() =>
                navigate(`/student/quizzes/${quiz.id}`)
              }
            >
              {quiz.isLocked ? 'Locked' : 'Start Quiz Now'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
