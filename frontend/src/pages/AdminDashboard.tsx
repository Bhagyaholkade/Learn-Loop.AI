
import { appThemeOptions } from '../theme';
import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  CssBaseline,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';

import {
  ArrowForwardRounded as ArrowForwardRoundedIcon,
  AssessmentRounded as AssessmentRoundedIcon,
  AutoAwesomeRounded as AutoAwesomeRoundedIcon,
  AutoStoriesRounded as AutoStoriesRoundedIcon,
  DashboardRounded as DashboardRoundedIcon,
  FactCheckRounded as FactCheckRoundedIcon,
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

const ORANGE_GRADIENT =
  'linear-gradient(135deg, #FFB347 0%, #FF7A2F 50%, #FF4E50 100%)';

const theme = createTheme(appThemeOptions, {
  palette: {
    primary: { main: '#F26A21', contrastText: '#FFFFFF' },
    text: {
      primary: '#2B201B',
      secondary: '#7A6E68',
    },
    background: {
      default: '#F7F6F4',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
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
      tint: '#FFF1E8',
      color: '#F26A21',
    },
    {
      title: 'Total Courses',
      value: statistics.courses,
      icon: <MenuBookRoundedIcon />,
      tint: '#EEF2FF',
      color: '#4F5BD5',
    },
    {
      title: 'Enrollments',
      value: null,
      icon: <SchoolRoundedIcon />,
      tint: '#EAF7F0',
      color: '#1E9E63',
    },
  ];

  // ==========================================
  // ADMIN ACTIONS (same routes as before)
  // ==========================================

  const adminActions = [
    {
      label: 'Manage Courses',
      description: 'Create, edit and publish courses',
      icon: <MenuBookRoundedIcon />,
      to: '/admin/courses',
    },
    {
      label: 'Manage Students',
      description: 'View and manage student accounts',
      icon: <PeopleAltRoundedIcon />,
      to: '/admin/students',
    },
    {
      label: 'Manage Enrollments',
      description: 'Assign students to courses',
      icon: <SchoolRoundedIcon />,
      to: '/admin/enrollments',
    },
    {
      label: 'Manage Lessons',
      description: 'Organise course lessons and content',
      icon: <AutoStoriesRoundedIcon />,
      to: '/admin/lessons',
    },
    {
      label: 'Manage Quizzes',
      description: 'Build quizzes and questions',
      icon: <QuizRoundedIcon />,
      to: '/admin/quizzes',
    },
    {
      label: 'Quiz Results',
      description: 'Review student quiz attempts',
      icon: <FactCheckRoundedIcon />,
      to: '/admin/quiz-attempts',
    },
    {
      label: 'Student Progress',
      description: 'Track learning progress',
      icon: <TrendingUpRoundedIcon />,
      to: '/admin/progress',
    },
    {
      label: 'Analytics Dashboard',
      description: 'Insights across the platform',
      icon: <AssessmentRoundedIcon />,
      to: '/admin/analytics',
    },
  ];

  const cardSx = {
    bgcolor: 'background.paper',
    borderRadius: '16px',
    border: '1px solid #ECE8E4',
    boxShadow: '0 1px 2px rgba(30, 20, 10, 0.04), 0 8px 24px -16px rgba(30, 20, 10, 0.18)',
  } as const;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box
          sx={{
            maxWidth: 1280,
            mx: 'auto',
            px: { xs: 2, md: 5 },
            py: { xs: 3, md: 5 },
          }}
        >

          {/* HEADER */}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              mb: 4,
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  background: ORANGE_GRADIENT,
                  boxShadow: '0 8px 20px -8px rgba(242,106,33,0.6)',
                  flexShrink: 0,
                }}
              >
                <AutoStoriesRoundedIcon sx={{ fontSize: 28 }} />
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, fontSize: { xs: 24, md: 30 } }}
                >
                  LearnLoop AI Admin
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ mt: 0.25, alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}
                >
                  <Typography sx={{ color: 'text.secondary' }}>
                    Manage your learning platform
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{
                      alignItems: 'center',
                      px: 1.25,
                      py: 0.25,
                      borderRadius: '999px',
                      bgcolor: '#EAF7F0',
                      color: '#1E9E63',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#1E9E63' }} />
                    <span>Live dashboard</span>
                  </Stack>
                </Stack>
              </Box>
            </Stack>

            <Button
              component={RouterLink}
              to="/student"
              variant="outlined"
              startIcon={<DashboardRoundedIcon />}
              sx={{
                px: 2.25,
                py: 1,
                borderRadius: '10px',
                color: 'text.primary',
                borderColor: '#E2DCD6',
                bgcolor: '#fff',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: '#fff' },
              }}
            >
              Student Dashboard
            </Button>
          </Stack>

          {/* ERROR MESSAGE */}

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: '12px' }}
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 2.5,
              mb: 4,
            }}
          >
            {statCards.map((stat) => (
              <Box key={stat.title} sx={{ ...cardSx, p: 3 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '14px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: stat.tint,
                      color: stat.color,
                      flexShrink: 0,
                    }}
                  >
                    {stat.icon}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 14 }}
                    >
                      {stat.title}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{
                        mt: 0.5,
                        minHeight: 40,
                        alignItems: 'center',
                      }}
                    >
                      {loading && stat.value !== null ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Typography
                          sx={{ fontWeight: 800, fontSize: 32, lineHeight: 1 }}
                        >
                          {stat.value === null ? '—' : stat.value}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>

                {stat.title === 'Enrollments' && (
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}
                  >
                    Platform-wide total not available yet
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          {/* ADMINISTRATION */}

          <Box sx={{ ...cardSx, p: { xs: 2.5, md: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Administration
            </Typography>

            <Typography sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>
              Manage courses, students, enrollments, lessons and AI-generated learning content.
            </Typography>

            {/* AI COURSE CREATOR (featured) */}

            <ButtonBase
              onClick={() => navigate('/admin/ai-course-creator')}
              sx={{
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textAlign: 'left',
                gap: 2,
                p: { xs: 2.5, md: 3 },
                mb: 3,
                borderRadius: '16px',
                color: '#fff',
                background: 'linear-gradient(135deg, #2A211C 0%, #3A2A22 100%)',
                transition: 'transform .2s ease, box-shadow .2s ease',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 260,
                  height: 260,
                  right: -60,
                  top: -120,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,122,47,0.35), transparent 70%)',
                  pointerEvents: 'none',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 16px 32px -16px rgba(30,20,10,0.6)',
                },
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', zIndex: 1 }}>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    display: 'grid',
                    placeItems: 'center',
                    background: ORANGE_GRADIENT,
                    flexShrink: 0,
                  }}
                >
                  <AutoAwesomeRoundedIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                    AI Course Creator
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                    Generate courses and lessons with AI.
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  zIndex: 1,
                  flexShrink: 0,
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  borderRadius: '10px',
                  bgcolor: '#fff',
                  color: '#2A211C',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Open
                </Box>
                <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
              </Stack>
            </ButtonBase>

            {/* OTHER ADMIN ACTIONS */}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
              }}
            >
              {adminActions.map((action) => (
                <ButtonBase
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: 1.75,
                    textAlign: 'left',
                    p: 2,
                    borderRadius: '12px',
                    border: '1px solid #ECE8E4',
                    bgcolor: '#fff',
                    transition: 'border-color .2s ease, box-shadow .2s ease, background-color .2s ease',
                    '&:hover': {
                      borderColor: '#F7B48A',
                      bgcolor: '#FFFBF8',
                      boxShadow: '0 8px 20px -14px rgba(242,106,33,0.5)',
                    },
                    '&:hover .icon': {
                      bgcolor: 'primary.main',
                      color: '#fff',
                    },
                  }}
                >
                  <Box
                    className="icon"
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: '10px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: '#F5F2EF',
                      color: '#5C504A',
                      flexShrink: 0,
                      transition: 'all .2s ease',
                    }}
                  >
                    {action.icon}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15 }}>
                      {action.label}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {action.description}
                    </Typography>
                  </Box>
                </ButtonBase>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
