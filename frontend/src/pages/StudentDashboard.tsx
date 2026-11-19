import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  getCourseProgressSummary,
  type CourseProgressSummary,
} from '../api/progressApi';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { alpha, createTheme, ThemeProvider } from '@mui/material/styles';
import {
  ArrowForwardRounded as ArrowForwardRoundedIcon,
  AutoStoriesRounded as AutoStoriesRoundedIcon,
  BookmarkBorderRounded as BookmarkBorderRoundedIcon,
  DashboardRounded as DashboardRoundedIcon,
  LaptopMacRounded as LaptopMacRoundedIcon,
  LogoutRounded as LogoutRoundedIcon,
  MenuBookRounded as MenuBookRoundedIcon,
  NotificationsNoneRounded as NotificationsNoneRoundedIcon,
  PlayCircleOutlineRounded as PlayCircleOutlineRoundedIcon,
  QuizRounded as QuizRoundedIcon,
  RefreshRounded as RefreshRoundedIcon,
  SchoolRounded as SchoolRoundedIcon,
  SearchRounded as SearchRoundedIcon,
  SettingsRounded as SettingsRoundedIcon,
  TrendingUpRounded as TrendingUpRoundedIcon,
  WorkspacePremiumRounded as WorkspacePremiumRoundedIcon,
} from '@mui/icons-material';
import StudentCertificatesPage from './StudentCertificatesPage';
import { getCourses, type Course } from '../api/courseApi';

import {
  getMyEnrollments,
  enrollInCourse,
  getCurrentUser,
  getApiErrorMessage,
  type Enrollment,
} from '../services/api';
import { getAccessToken } from '../api/axios';

const DRAWER_WIDTH = 192;

const theme = createTheme({
  palette: {
    primary: {
      main: '#6554F0',
      dark: '#5140D9',
      light: '#F0EDFF',
    },
    background: {
      default: '#F7F8FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#18213B',
      secondary: '#68718A',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h5: {
      fontWeight: 800,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 750,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #EAECF4',
          boxShadow: 'none',
        },
      },
    },
  },
});

type PageName =
  | 'Dashboard'
  | 'My Courses'
  | 'Explore Courses'
  | 'Quizzes & Assessments'
  | 'My Certificates'
  | 'Bookmarks'
  | 'Settings';

type CurrentUser = {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
};

function readStoredUser(): CurrentUser | null {
  try {
    const storedUser =
      localStorage.getItem('user') ?? sessionStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser) as CurrentUser;
  } catch {
    return null;
  }
}

function getCourseFromEnrollment(
  enrollment: Enrollment,
): Course | null {
  const course = enrollment.course;

  if (!course || typeof course.id !== 'number') {
    return null;
  }

  return course as Course;
}

function getCourseColor(category?: string) {
  const normalizedCategory = category?.toLowerCase() ?? '';

  if (
    normalizedCategory.includes('frontend') ||
    normalizedCategory.includes('react')
  ) {
    return {
      background: '#EDE9FF',
      iconColor: '#6554F0',
      icon: 'book',
    };
  }

  if (
    normalizedCategory.includes('backend') ||
    normalizedCategory.includes('server')
  ) {
    return {
      background: '#FFE9D8',
      iconColor: '#C76C2D',
      icon: 'laptop',
    };
  }

  if (
    normalizedCategory.includes('design') ||
    normalizedCategory.includes('ui')
  ) {
    return {
      background: '#DDF6EF',
      iconColor: '#218B72',
      icon: 'design',
    };
  }

  return {
    background: '#DFEEFF',
    iconColor: '#3977C5',
    icon: 'book',
  };
}

function StudentDashboardContent() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(
    () => readStoredUser(),
  );

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(
    null,
  );

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activePage, setActivePage] = useState<PageName>('Dashboard');

  const [profileMenuAnchor, setProfileMenuAnchor] =
    useState<HTMLElement | null>(null);

  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();

    if (user) {
      setCurrentUser(user);
    }
  }, []);
  const [courseProgress, setCourseProgress] = useState<
  CourseProgressSummary[]
>([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [coursesResult, enrollmentsResult] = await Promise.all([
        getCourses({
          page: 1,
          limit: 100,
          order: 'DESC',
        }),
        getMyEnrollments(),
      ]);

      if (!Array.isArray(coursesResult.data)) {
        throw new Error('The courses API returned an unexpected response.');
      }

      if (!Array.isArray(enrollmentsResult)) {
        throw new Error(
          'The enrollments API returned an unexpected response.',
        );
      }

      setCourses(coursesResult.data);
      setEnrollments(enrollmentsResult);

      // Progress is optional: a progress API failure should not
      // prevent the courses and enrollments from being displayed.
      try {
        const progressResult = await getCourseProgressSummary();
        setCourseProgress(
          Array.isArray(progressResult) ? progressResult : [],
        );
      } catch (progressError) {
        console.error('Failed to load course progress:', progressError);
        setCourseProgress([]);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);


  const enrolledCourses = useMemo(() => {
    return enrollments
      .map(getCourseFromEnrollment)
      .filter((course): course is Course => course !== null);
  }, [enrollments]);

  const enrolledCourseIds = useMemo(() => {
    return new Set(enrolledCourses.map((course) => course.id));
  }, [enrolledCourses]);

  const publishedCourses = useMemo(() => {
    return courses.filter(
      (course) =>
        course.status?.toLowerCase() === 'published' &&
        !enrolledCourseIds.has(course.id),
    );
  }, [courses, enrolledCourseIds]);

  const coursesToDisplay = useMemo(() => {
    switch (activePage) {
      case 'My Courses':
        return enrolledCourses;

      case 'Explore Courses':
        return publishedCourses;

      case 'Dashboard':
        return enrolledCourses.length > 0
          ? enrolledCourses
          : publishedCourses;

      default:
        return [];
    }
  }, [activePage, enrolledCourses, publishedCourses]);

  const studentName =
    currentUser?.name ||
    currentUser?.email?.split('@')[0] ||
    'Student';

  const firstName = studentName.trim().split(/\s+/)[0] || 'Student';

  const handleLogout = () => {
    setProfileMenuAnchor(null);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');

    navigate('/login', { replace: true });
  };

  const handleEnroll = async (courseId: number) => {
    if (!getAccessToken()) {
      navigate('/login', { replace: true });
      return;
    }

    setEnrollingCourseId(courseId);
    setError('');

    try {
      await enrollInCourse(courseId);

      setNotice('You have successfully enrolled in the course.');
      setNoticeOpen(true);

      await loadDashboard();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const navigationItems: {
    label: PageName;
    icon: ReactNode;
  }[] = [
    {
      label: 'Dashboard',
      icon: <DashboardRoundedIcon />,
    },
    {
      label: 'My Courses',
      icon: <SchoolRoundedIcon />,
    },
    {
      label: 'Explore Courses',
      icon: <MenuBookRoundedIcon />,
    },
    {
      label: 'Quizzes & Assessments',
      icon: <QuizRoundedIcon />,
    },
    {
      label: 'Bookmarks',
      icon: <BookmarkBorderRoundedIcon />,
    },
    {
      label: 'Settings',
      icon: <SettingsRoundedIcon />,
    },
    {
      label: 'My Certificates',
      icon: <WorkspacePremiumRoundedIcon />,
    },
  ];

  const getCourseProgress = (courseId: number) =>
  courseProgress.find(
    (progress) => Number(progress.courseId) === Number(courseId),
  );

  const renderCourseCard = (course: Course, enrolled: boolean) => {
    const colors = getCourseColor(course.category);

    return (
      <Card
        key={course.id}
        sx={{
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 3,
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 10px 28px rgba(28, 35, 80, 0.08)',
          },
        }}
      >
        <Box
          sx={{
            height: 104,
            backgroundColor: colors.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          
          {colors.icon === 'laptop' ? (
            <LaptopMacRoundedIcon
              sx={{ fontSize: 43, color: colors.iconColor }}
            />
          ) : (
            <AutoStoriesRoundedIcon
              sx={{ fontSize: 43, color: colors.iconColor }}
            />
          )}
        </Box>

        <CardContent
          sx={{
            p: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {course.category && (
            <Chip
              label={course.category}
              size="small"
              sx={{
                mb: 1.2,
                maxWidth: '100%',
                backgroundColor: alpha(colors.iconColor, 0.1),
                color: colors.iconColor,
                fontWeight: 650,
              }}
            />
            
          )}

          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.45,
              overflowWrap: 'anywhere',
            }}
          >
            {course.title}
          </Typography>

          {course.instructor && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.8 }}
            >
              By {course.instructor}
            </Typography>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              mb: 2,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 60,
            }}
          >
            {course.description || ''}
          </Typography>

          <Box sx={{ mt: 'auto', width: '100%' }}>
            {enrolled && (() => {
              const progress = getCourseProgress(course.id);
              const percentage = Math.min(
                100,
                Math.max(0, progress?.completionPercentage ?? 0),
              );

              const status =
                percentage >= 100
                  ? 'Completed'
                  : percentage > 0
                    ? 'In Progress'
                    : 'Not Started';

              const statusColor =
                status === 'Completed'
                  ? 'success'
                  : status === 'In Progress'
                    ? 'primary'
                    : 'default';

              return (
                <Box sx={{ mt: 1, mb: 2, width: '100%' }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Course progress
                    </Typography>
                    <Chip label={status} size="small" color={statusColor} />
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {progress
                        ? `${progress.completedLessons} of ${progress.totalLessons} lessons completed`
                        : 'Complete your first lesson to track progress'}
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {percentage}%
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 8,
                      borderRadius: 10,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 10,
                      },
                    }}
                  />
                </Box>
              );
            })()}
  {enrolled ? (
    <Button
      fullWidth
      variant="contained"
      startIcon={<PlayCircleOutlineRoundedIcon />}
      onClick={() => {
        navigate(`/student/courses/${course.id}`);
      }}
    >
      Continue learning
    </Button>
  ) : (
    <Button
      fullWidth
      variant="contained"
      disabled={enrollingCourseId === course.id}
      onClick={() => void handleEnroll(course.id)}
    >
      {enrollingCourseId === course.id
        ? 'Enrolling...'
        : 'Enroll now'}
    </Button>
  )}
</Box>
        </CardContent>
      </Card>
    );
  };

  const renderCourseSection = () => {
    if (loading) {
      return (
        <Box
          sx={{
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (coursesToDisplay.length === 0) {
      const emptyMessage =
        activePage === 'My Courses'
          ? 'You have not enrolled in any courses yet.'
          : activePage === 'Explore Courses'
            ? 'There are no published courses available right now.'
            : 'No courses are available to display yet.';

      return (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            borderColor: '#EAECF4',
          }}
        >
          <MenuBookRoundedIcon
            sx={{ fontSize: 42, color: 'text.secondary', mb: 1 }}
          />

          <Typography variant="h6">
            {activePage === 'My Courses'
              ? 'Start your learning journey'
              : 'No courses found'}
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {emptyMessage}
          </Typography>

          {activePage !== 'Explore Courses' && (
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              onClick={() => setActivePage('Explore Courses')}
            >
              Explore courses
            </Button>
          )}
        </Paper>
      );
    }

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {coursesToDisplay.map((course) =>
          renderCourseCard(course, enrolledCourseIds.has(course.id)),
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 0,
            borderRight: '1px solid #EAECF4',
            bgcolor: 'background.paper',
            px: 1.5,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ px: 1.5, mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: 'primary.main',
              width: 38,
              height: 38,
              borderRadius: 2.5,
            }}
          >
            <AutoStoriesRoundedIcon />
          </Avatar>

          <Typography variant="h6" sx={{ fontSize: 17 }}>
            LearnLoop
            <Box component="span" sx={{ color: 'primary.main', ml: 0.5 }}>
              AI
            </Box>
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1.5,
            color: 'text.secondary',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          LEARNING MENU
        </Typography>

        <List disablePadding>
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.label}
              selected={activePage === item.label}
              onClick={() => {
                if (item.label === 'Quizzes & Assessments') {
                  navigate('/student/quizzes');
                  return;
                }
                setActivePage(item.label);
              }}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                minHeight: 42,
                '&.Mui-selected': {
                  bgcolor: '#F0EDFF',
                  color: 'primary.main',
                },
                '&.Mui-selected:hover': {
                  bgcolor: '#E9E5FF',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  color:
                    activePage === item.label
                      ? 'primary.main'
                      : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  sx: {
                    fontSize: 12,
                    fontWeight: activePage === item.label ? 750 : 600,
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Paper
          sx={{
            p: 1.5,
            mb: 0.5,
            borderRadius: 3,
            bgcolor: '#F0EDFF',
            border: 0,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Keep learning!
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', my: 1, lineHeight: 1.5 }}
          >
            Small steps lead to big achievements.
          </Typography>

          <Button
            fullWidth
            size="small"
            variant="contained"
            onClick={() => setActivePage('Explore Courses')}
          >
            Explore courses
          </Button>
        </Paper>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Paper
          square
          elevation={0}
          sx={{
            height: 58,
            px: { xs: 2, md: 3 },
            borderBottom: '1px solid #EAECF4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {activePage === 'Dashboard' ? 'My Dashboard' : activePage}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {activePage === 'Dashboard'
                ? 'Continue your learning journey'
                : `Your ${activePage.toLowerCase()} workspace`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Tooltip title="Explore courses">
              <IconButton
                onClick={() => setActivePage('Explore Courses')}
                aria-label="Explore courses"
              >
                <SearchRoundedIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton
                onClick={() => {
                  setNotice('You are all caught up.');
                  setNoticeOpen(true);
                }}
                aria-label="Notifications"
              >
                <NotificationsNoneRoundedIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Account options">
              <IconButton
                onClick={(event) => setProfileMenuAnchor(event.currentTarget)}
                aria-label="Account options"
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: '#DCD8FF',
                    color: '#493BC7',
                    fontWeight: 750,
                    fontSize: 14,
                  }}
                >
                  {studentName.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={() => setProfileMenuAnchor(null)}
            >
              <MenuItem disabled>
                {currentUser?.email || studentName}
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={() => {
                  setProfileMenuAnchor(null);
                  setActivePage('Settings');
                }}
              >
                <SettingsRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                Settings
              </MenuItem>

              <MenuItem onClick={handleLogout}>
                <LogoutRoundedIcon fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Stack>
        </Paper>

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 3 } }}>
          {activePage === 'Dashboard' && (
            <>
              <Paper
                sx={{
                  p: { xs: 3, md: 4 },
                  border: 0,
                  borderRadius: 4,
                  color: '#FFFFFF',
                  background:
                    'linear-gradient(115deg, #6554F0 0%, #8D78F7 100%)',
                  mb: 3,
                }}
              >
                <Typography
                  variant="overline"
                  sx={{ fontSize: 10, fontWeight: 700 }}
                >
                  YOUR LEARNING SPACE
                </Typography>

                <Typography
                  variant="h5"
                  sx={{
                    mt: 0.5,
                    fontSize: { xs: 24, md: 30 },
                    color: '#FFFFFF',
                  }}
                >
                  Welcome back, {firstName}! 👋
                </Typography>

                <Typography sx={{ mt: 1, fontSize: 14, opacity: 0.95 }}>
                  Learn something new today. Your next achievement is waiting.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() => setActivePage('Explore Courses')}
                  sx={{
                    mt: 2.5,
                    bgcolor: '#FFFFFF',
                    color: 'primary.dark',
                    '&:hover': { bgcolor: '#F4F1FF' },
                  }}
                >
                  Explore courses
                </Button>
              </Paper>
            </>
          )}

          {error && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => void loadDashboard()}
                  disabled={loading}
                >
                  Retry
                </Button>
              }
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {activePage === 'Dashboard' && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 1.5,
                mb: 4,
              }}
            >
              {[
                {
                  label: 'Enrolled Courses',
                  value: loading ? '—' : enrolledCourses.length,
                  icon:<SchoolRoundedIcon />,
                },
                {
                  label: 'Available Courses',
                  value: loading ? '—' : publishedCourses.length,
                  icon: <SchoolRoundedIcon />,
                },
                {
                  label: 'Learning Hours',
                  value: '—',
                  icon: <TrendingUpRoundedIcon />,
                },
              ].map((stat) => (
                <Card key={stat.label} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: '#F0EDFF',
                        color: 'primary.main',
                        mb: 1.5,
                      }}
                    >
                      {stat.icon}
                    </Avatar>

                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>

                    <Typography variant="h5" sx={{ mt: 0.3 }}>
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {activePage === 'My Certificates' ? (
              <StudentCertificatesPage />
            ) : activePage === 'Bookmarks' ? (
            <Paper
              variant="outlined"
              sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}
            >
              <BookmarkBorderRoundedIcon
                sx={{ fontSize: 42, color: 'text.secondary' }}
              />

              <Typography variant="h6" sx={{ mt: 1 }}>
                Bookmarks
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Bookmark functionality will appear here when the bookmarks API
                is connected.
              </Typography>

              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={() => setActivePage('Explore Courses')}
              >
                Explore courses
              </Button>
            </Paper>
          ) : activePage === 'Settings' ? (
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Typography variant="h6">Account settings</Typography>

              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {currentUser?.name || studentName}
              </Typography>

              <Typography color="text.secondary">
                {currentUser?.email || 'No email available'}
              </Typography>

              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutRoundedIcon />}
                sx={{ mt: 3 }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Paper>
          ) : (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6">
                    {activePage === 'Dashboard'
                      ? 'Continue Learning'
                      : activePage}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {activePage === 'My Courses'
                      ? 'Continue with courses you are enrolled in.'
                      : activePage === 'Explore Courses'
                        ? 'Discover published courses available to you.'
                        : 'Your courses from LearnLoop AI'}
                  </Typography>
                </Box>

                {activePage === 'Dashboard' && (
                  <Button
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={() => setActivePage('Explore Courses')}
                  >
                    Explore all
                  </Button>
                )}
              </Box>

              {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

              {renderCourseSection()}
            </>
          )}

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 4 }}
          >
            LearnLoop AI
          </Typography>
        </Container>
      </Box>

      <Snackbar
        open={noticeOpen}
        autoHideDuration={3500}
        onClose={() => setNoticeOpen(false)}
        message={notice}
      />
    </Box>
  );
}

export default function StudentDashboard() {
  return (
    <ThemeProvider theme={theme}>
      <StudentDashboardContent />
    </ThemeProvider>
  );
}