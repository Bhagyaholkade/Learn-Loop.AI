
import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';

import {
  AssessmentRounded as AssessmentRoundedIcon,
  AutoAwesomeRounded as AutoAwesomeRoundedIcon,
  AutoStoriesRounded as AutoStoriesRoundedIcon,
  DashboardRounded as DashboardRoundedIcon,
  MenuBookRounded as MenuBookRoundedIcon,
  PeopleAltRounded as PeopleAltRoundedIcon,
  QuizRounded as QuizRoundedIcon,
  RefreshRounded as RefreshRoundedIcon,
  SchoolRounded as SchoolRoundedIcon,
  TrendingUpRounded as TrendingUpRoundedIcon,
} from '@mui/icons-material';

import { Link as RouterLink, useNavigate } from 'react-router-dom';

import api from '../api/axios';

// ==========================================
// THEME
// ==========================================

const theme = createTheme({
  palette: {
    primary: { main: '#6256E8' },
    background: {
      default: '#F7F8FC',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
  },
});

// ==========================================
// INTERFACES
// ==========================================

interface Statistics {
  students: number | null;
  courses: number | null;
}

interface ApiListResponse {
  total?: number;
  data?: unknown[];
  items?: unknown[];
  meta?: {
    totalItems?: number;
    total?: number;
  };
}

// ==========================================
// GET API TOTAL
// ==========================================

function getTotal(response: unknown): number {
  if (Array.isArray(response)) {
    return response.length;
  }

  if (typeof response !== 'object' || response === null) {
    throw new Error('Unexpected API response format.');
  }

  const result = response as ApiListResponse;

  const total =
    result.total ??
    result.meta?.totalItems ??
    result.meta?.total;

  if (typeof total === 'number' && Number.isFinite(total)) {
    return total;
  }

  if (Array.isArray(result.data)) {
    return result.data.length;
  }

  if (Array.isArray(result.items)) {
    return result.items.length;
  }

  throw new Error('The API response does not contain a total count.');
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [statistics, setStatistics] = useState<Statistics>({
    students: null,
    courses: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // LOAD DASHBOARD STATISTICS
  // ==========================================

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [studentsResponse, coursesResponse] = await Promise.all([
        api.get<unknown>('/students', {
          params: {
            page: 1,
            limit: 1,
          },
        }),

        api.get<unknown>('/courses', {
          params: {
            page: 1,
            limit: 1,
          },
        }),
      ]);

      setStatistics({
        students: getTotal(studentsResponse.data),
        courses: getTotal(coursesResponse.data),
      });
    } catch (err: unknown) {
      console.error('Failed to load admin statistics:', err);

      setError(
        'Unable to load dashboard statistics. Check your login, permissions, and API connection.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  // ==========================================
  // STATISTICS CARDS
  // ==========================================

  const statCards = [
    {
      title: 'Total Students',
      value: statistics.students,
      icon: <PeopleAltRoundedIcon />,
    },
    {
      title: 'Total Courses',
      value: statistics.courses,
      icon: <MenuBookRoundedIcon />,
    },
    {
      title: 'Enrollments',
      value: null,
      icon: <SchoolRoundedIcon />,
    },
  ];

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>

        {/* HEADER */}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            mb: 4,
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              LearnLoop AI Admin
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Manage your learning platform
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to="/student"
            variant="outlined"
            startIcon={<DashboardRoundedIcon />}
          >
            Student Dashboard
          </Button>
        </Stack>

        {/* ERROR MESSAGE */}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshRoundedIcon />}
                onClick={() => void loadStatistics()}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* STATISTICS CARDS */}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 2,
            mb: 4,
          }}
        >
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              elevation={0}
              sx={{
                border: '1px solid #ECECF3',
                borderRadius: 3,
              }}
            >
              <CardContent>
                <Avatar
                  sx={{
                    bgcolor: '#EEECFF',
                    color: 'primary.main',
                    mb: 2,
                  }}
                >
                  {stat.icon}
                </Avatar>

                <Typography color="text.secondary">
                  {stat.title}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    mt: 1,
                    minHeight: 40,
                    alignItems: 'center',
                  }}
                >
                  {loading && stat.value !== null ? (
                    <CircularProgress size={24} />
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {stat.value === null ? '—' : stat.value}
                    </Typography>
                  )}
                </Stack>

                {stat.title === 'Enrollments' && (
                  <Typography variant="caption" color="text.secondary">
                    Platform-wide total not available yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* ADMINISTRATION */}

        <Card
          elevation={0}
          sx={{
            border: '1px solid #ECECF3',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
              Administration
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Manage courses, students, enrollments, lessons and AI-generated learning content.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              flexWrap="wrap"
              useFlexGap
            >

              {/* AI COURSE CREATOR */}

              <Button
                variant="contained"
                color="primary"
                startIcon={<AutoAwesomeRoundedIcon />}
                onClick={() => navigate('/admin/ai-course-creator')}
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6256E8, #8B5CF6)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5145D0, #7C3AED)',
                  },
                }}
              >
                AI Course Creator
              </Button>

              {/* MANAGE COURSES */}

              <Button
                variant="outlined"
                startIcon={<MenuBookRoundedIcon />}
                onClick={() => navigate('/admin/courses')}
              >
                Manage Courses
              </Button>

              {/* MANAGE STUDENTS */}

              <Button
                variant="outlined"
                startIcon={<PeopleAltRoundedIcon />}
                onClick={() => navigate('/admin/students')}
              >
                Manage Students
              </Button>

              {/* MANAGE ENROLLMENTS */}

              <Button
                variant="outlined"
                startIcon={<SchoolRoundedIcon />}
                onClick={() => navigate('/admin/enrollments')}
              >
                Manage Enrollments
              </Button>

              {/* MANAGE LESSONS */}

              <Button
                variant="outlined"
                color="primary"
                startIcon={<AutoStoriesRoundedIcon />}
                onClick={() => navigate('/admin/lessons')}
              >
                Manage Lessons
              </Button>

              {/* MANAGE QUIZZES */}

              <Button
                variant="outlined"
                color="primary"
                startIcon={<QuizRoundedIcon />}
                onClick={() => navigate('/admin/quizzes')}
              >
                Manage Quizzes
              </Button>

              {/* QUIZ RESULTS */}

              <Button
                variant="outlined"
                startIcon={<QuizRoundedIcon />}
                onClick={() => navigate('/admin/quiz-attempts')}
              >
                Quiz Results
              </Button>

              {/* STUDENT PROGRESS */}

              <Button
                variant="outlined"
                color="primary"
                startIcon={<TrendingUpRoundedIcon />}
                onClick={() => navigate('/admin/progress')}
              >
                Student Progress
              </Button>

              {/* ANALYTICS */}

              <Button
                variant="outlined"
                startIcon={<AssessmentRoundedIcon />}
                onClick={() => navigate('/admin/analytics')}
              >
                Analytics Dashboard
              </Button>

            </Stack>

            <Chip
              label="Live dashboard"
              sx={{ mt: 3 }}
            />
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
