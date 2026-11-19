
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ArrowBackRounded as ArrowBackRoundedIcon } from '@mui/icons-material';
import { RefreshRounded as RefreshRoundedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { getAllQuizAttempts } from '../api/adminQuizAttemptsApi';

interface QuizAttempt {
  id: number;
  student: {
    id: number;
    name: string;
    email: string;
  };
  quiz: {
    id: number;
    title: string;
    course?: string | {
      title: string;
    };
  };
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string;
}

export default function AdminQuizAttemptsPage() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAttempts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getAllQuizAttempts();
      setAttempts(response);
    } catch (err) {
      console.error('Failed to load quiz attempts:', err);
      setError('Unable to load quiz results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttempts();
  }, [loadAttempts]);

  const getCourseName = (course: QuizAttempt['quiz']['course']) => {
    if (!course) return '—';
    return typeof course === 'string' ? course : course.title;
  };

  const formatDate = (date: string) => {
    if (!date) return '—';

    return new Date(date).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(
    (attempt) => attempt.isPassed,
  ).length;
  const failedAttempts = totalAttempts - passedAttempts;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F7F6F4', p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Quiz Results
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            View student quiz attempts and performance.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate('/admin')}
          >
            Dashboard
          </Button>

          <Button
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void loadAttempts()}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 2,
          mb: 3,
        }}
      >
        <Card elevation={0} sx={{ border: '1px solid #ECE8E4', borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary">Total Attempts</Typography>
            <Typography variant="h4" fontWeight={800}>
              {loading ? '—' : totalAttempts}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #ECE8E4', borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary">Passed</Typography>
            <Typography variant="h4" fontWeight={800} color="success.main">
              {loading ? '—' : passedAttempts}
            </Typography>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: '1px solid #ECE8E4', borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary">Failed</Typography>
            <Typography variant="h4" fontWeight={800} color="error.main">
              {loading ? '—' : failedAttempts}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #ECE8E4', borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Student Attempts
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : attempts.length === 0 ? (
            <Alert severity="info">
              No quiz attempts are available yet.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Quiz</strong></TableCell>
                    <TableCell><strong>Course</strong></TableCell>
                    <TableCell><strong>Score</strong></TableCell>
                    <TableCell><strong>Percentage</strong></TableCell>
                    <TableCell><strong>Result</strong></TableCell>
                    <TableCell><strong>Submitted At</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {attempt.student?.name ?? 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attempt.student?.email ?? '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>{attempt.quiz?.title ?? '—'}</TableCell>

                      <TableCell>
                        {getCourseName(attempt.quiz?.course)}
                      </TableCell>

                      <TableCell>
                        {attempt.obtainedMarks} / {attempt.totalMarks}
                      </TableCell>

                      <TableCell>
                        {attempt.percentage}%
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={attempt.isPassed ? 'Passed' : 'Failed'}
                          color={attempt.isPassed ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(attempt.submittedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
