
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { RefreshRounded as RefreshRoundedIcon } from '@mui/icons-material';
import { ArrowBackRounded as ArrowBackRoundedIcon } from '@mui/icons-material';
import { AssessmentRounded as AssessmentRoundedIcon } from '@mui/icons-material';
import { PeopleAltRounded as PeopleAltRoundedIcon } from '@mui/icons-material';
import { CheckCircleRounded as CheckCircleRoundedIcon } from '@mui/icons-material';
import { TrendingUpRounded as TrendingUpRoundedIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import {
  getAllQuizAttempts,
  type AdminQuizAttempt,
} from '../api/adminQuizAttemptsApi';

export default function AdminQuizResultsPage() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<AdminQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [quizFilter, setQuizFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  const loadAttempts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllQuizAttempts();
      setAttempts(data);
    } catch (err) {
      console.error('Failed to load quiz attempts:', err);
      setError(
        'Unable to load quiz results. Please check your connection and permissions.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAttempts();
  }, []);

  const quizzes = useMemo(() => {
    const unique = new Map<number, string>();

    attempts.forEach((attempt) => {
      unique.set(attempt.quiz.id, attempt.quiz.title);
    });

    return Array.from(unique.entries()).map(([id, title]) => ({
      id,
      title,
    }));
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((attempt) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        attempt.student.name.toLowerCase().includes(searchValue) ||
        attempt.student.email.toLowerCase().includes(searchValue) ||
        attempt.quiz.title.toLowerCase().includes(searchValue) ||
        attempt.quiz.course.toLowerCase().includes(searchValue);

      const matchesQuiz =
        quizFilter === 'all' ||
        String(attempt.quiz.id) === quizFilter;

      const matchesResult =
        resultFilter === 'all' ||
        (resultFilter === 'passed' && attempt.isPassed) ||
        (resultFilter === 'failed' && !attempt.isPassed);

      return matchesSearch && matchesQuiz && matchesResult;
    });
  }, [attempts, search, quizFilter, resultFilter]);

  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(
    (attempt) => attempt.isPassed,
  ).length;
  const failedAttempts = totalAttempts - passedAttempts;

  const passRate =
    totalAttempts > 0
      ? Math.round((passedAttempts / totalAttempts) * 100)
      : 0;

  const averagePercentage =
    totalAttempts > 0
      ? (
          attempts.reduce(
            (sum, attempt) => sum + attempt.percentage,
            0,
          ) / totalAttempts
        ).toFixed(1)
      : '0.0';

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleString();
  };

  const statCards = [
    {
      title: 'Total Attempts',
      value: totalAttempts,
      icon: <AssessmentRoundedIcon />,
      color: '#6256E8',
    },
    {
      title: 'Passed Attempts',
      value: passedAttempts,
      icon: <CheckCircleRoundedIcon />,
      color: '#16A34A',
    },
    {
      title: 'Failed Attempts',
      value: failedAttempts,
      icon: <PeopleAltRoundedIcon />,
      color: '#DC6B35',
    },
    {
      title: 'Pass Rate',
      value: `${passRate}%`,
      icon: <TrendingUpRoundedIcon />,
      color: '#2563EB',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 }, bgcolor: '#F7F8FC' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Quiz Results & Attempts
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Monitor student assessment performance
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
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadAttempts()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #ECECF3',
                borderRadius: 3,
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${stat.color}18`,
                    color: stat.color,
                    mb: 2,
                  }}
                >
                  {stat.icon}
                </Box>

                <Typography color="text.secondary">
                  {stat.title}
                </Typography>

                <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                  {loading ? '—' : stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Average score */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid #ECECF3',
          borderRadius: 3,
          mb: 3,
        }}
      >
        <CardContent>
          <Typography color="text.secondary">
            Average Student Score
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
            {loading ? '—' : `${averagePercentage}%`}
          </Typography>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid #ECECF3',
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
            Student Quiz Attempts
          </Typography>

          {/* Filters */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <TextField
              fullWidth
              size="small"
              label="Search student, email, quiz or course"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Quiz</InputLabel>
              <Select
                value={quizFilter}
                label="Quiz"
                onChange={(event) => setQuizFilter(event.target.value)}
              >
                <MenuItem value="all">All Quizzes</MenuItem>

                {quizzes.map((quiz) => (
                  <MenuItem key={quiz.id} value={String(quiz.id)}>
                    {quiz.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Result</InputLabel>
              <Select
                value={resultFilter}
                label="Result"
                onChange={(event) => setResultFilter(event.target.value)}
              >
                <MenuItem value="all">All Results</MenuItem>
                <MenuItem value="passed">Passed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {loading ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress />
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Loading quiz attempts...
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F7F8FC' }}>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Quiz</strong></TableCell>
                    <TableCell><strong>Course</strong></TableCell>
                    <TableCell align="center"><strong>Score</strong></TableCell>
                    <TableCell align="center"><strong>Percentage</strong></TableCell>
                    <TableCell align="center"><strong>Result</strong></TableCell>
                    <TableCell><strong>Submitted At</strong></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredAttempts.length > 0 ? (
                    filteredAttempts.map((attempt) => (
                      <TableRow hover key={attempt.id}>
                        <TableCell>
                          <Typography fontWeight={700}>
                            {attempt.student.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {attempt.student.email}
                          </Typography>
                        </TableCell>

                        <TableCell>{attempt.quiz.title}</TableCell>

                        <TableCell>{attempt.quiz.course}</TableCell>

                        <TableCell align="center">
                          {attempt.obtainedMarks}/{attempt.totalMarks}
                        </TableCell>

                        <TableCell align="center">
                          {attempt.percentage}%
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={attempt.isPassed ? 'Passed' : 'Failed'}
                            color={attempt.isPassed ? 'success' : 'error'}
                          />
                        </TableCell>

                        <TableCell>
                          {formatDate(attempt.submittedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">
                          {attempts.length === 0
                            ? 'No quiz attempts found yet.'
                            : 'No matching quiz attempts found.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2 }}
            >
              Showing {filteredAttempts.length} of {totalAttempts} attempts
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
