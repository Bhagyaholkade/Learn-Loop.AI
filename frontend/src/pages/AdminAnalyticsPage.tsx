
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import { PeopleAltRounded as PeopleAltRoundedIcon } from '@mui/icons-material';
import { SchoolRounded as SchoolRoundedIcon } from '@mui/icons-material';
import { CheckCircleRounded as CheckCircleRoundedIcon } from '@mui/icons-material';
import { TrendingUpRounded as TrendingUpRoundedIcon } from '@mui/icons-material';
import { RefreshRounded as RefreshRoundedIcon } from '@mui/icons-material';
import { ArrowBackRounded as ArrowBackRoundedIcon } from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';

import {
  getAllStudentsProgress,
  type StudentCourseProgress,
} from '../api/adminProgressApi';

export default function AdminAnalyticsPage() {
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState<
    StudentCourseProgress[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllStudentsProgress();

      setProgressData(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (err: unknown) {
      console.error('Failed to load analytics:', err);

      setError(
        'Unable to load analytics. Please check your admin login and API connection.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  // Calculate overall statistics
  const analytics = useMemo(() => {
    const totalEnrollments = progressData.length;

    const totalStudents = new Set(
      progressData.map((item) => item.student.id),
    ).size;

    const completed = progressData.filter(
      (item) => item.status === 'Completed',
    ).length;

    const inProgress = progressData.filter(
      (item) => item.status === 'In Progress',
    ).length;

    const notStarted = progressData.filter(
      (item) => item.status === 'Not Started',
    ).length;

    const averageCompletion =
      totalEnrollments > 0
        ? Math.round(
            progressData.reduce(
              (sum, item) =>
                sum + Math.min(
                  100,
                  Math.max(0, item.completionPercentage),
                ),
              0,
            ) / totalEnrollments,
          )
        : 0;

    // Course-wise analytics
    const courseMap = new Map<
      number,
      {
        id: number;
        title: string;
        enrollments: number;
        completed: number;
        completionTotal: number;
      }
    >();

    progressData.forEach((item) => {
      const courseId = item.course.id;

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          id: courseId,
          title: item.course.title,
          enrollments: 0,
          completed: 0,
          completionTotal: 0,
        });
      }

      const course = courseMap.get(courseId)!;

      course.enrollments += 1;
      course.completionTotal += Math.min(
        100,
        Math.max(0, item.completionPercentage),
      );

      if (item.status === 'Completed') {
        course.completed += 1;
      }
    });

    const courses = Array.from(courseMap.values())
      .map((course) => ({
        ...course,
        averageCompletion:
          course.enrollments > 0
            ? Math.round(
                course.completionTotal / course.enrollments,
              )
            : 0,
      }))
      .sort((a, b) => b.enrollments - a.enrollments);

    return {
      totalEnrollments,
      totalStudents,
      completed,
      inProgress,
      notStarted,
      averageCompletion,
      courses,
    };
  }, [progressData]);

  const statCards = [
    {
      title: 'Total Students',
      value: analytics.totalStudents,
      icon: <PeopleAltRoundedIcon />,
      color: '#F26A21',
      background: '#FFF1E8',
    },
    {
      title: 'Total Enrollments',
      value: analytics.totalEnrollments,
      icon: <SchoolRoundedIcon />,
      color: '#1976D2',
      background: '#E3F2FD',
    },
    {
      title: 'Completed Enrollments',
      value: analytics.completed,
      icon: <CheckCircleRoundedIcon />,
      color: '#2E7D32',
      background: '#E8F5E9',
    },
    {
      title: 'Average Completion',
      value: `${analytics.averageCompletion}%`,
      icon: <TrendingUpRoundedIcon />,
      color: '#ED8B00',
      background: '#FFF3E0',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, md: 4 },
        bgcolor: '#F7F6F4',
      }}
    >
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
            Analytics Dashboard
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Understand student engagement and course performance.
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
            onClick={() => void loadAnalytics()}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button
            color="inherit"
            size="small"
            onClick={() => void loadAnalytics()}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {/* Statistics */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 2,
              mb: 4,
            }}
          >
            {statCards.map((stat) => (
              <Card
                key={stat.title}
                elevation={0}
                sx={{
                  border: '1px solid #ECE8E4',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Avatar
                    sx={{
                      bgcolor: stat.background,
                      color: stat.color,
                      mb: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>

                  <Typography color="text.secondary">
                    {stat.title}
                  </Typography>

                  <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Enrollment Status */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              border: '1px solid #ECE8E4',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" fontWeight={800} gutterBottom>
              Enrollment Status Overview
            </Typography>

            {[
              {
                label: 'Completed',
                value: analytics.completed,
                color: '#2E7D32',
              },
              {
                label: 'In Progress',
                value: analytics.inProgress,
                color: '#ED8B00',
              },
              {
                label: 'Not Started',
                value: analytics.notStarted,
                color: '#757575',
              },
            ].map((item) => {
              const percentage =
                analytics.totalEnrollments > 0
                  ? (item.value / analytics.totalEnrollments) * 100
                  : 0;

              return (
                <Box key={item.label} sx={{ mt: 3 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Typography fontWeight={600}>
                      {item.label}
                    </Typography>

                    <Typography fontWeight={700}>
                      {item.value} ({Math.round(percentage)}%)
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: '#ECE8E4',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: item.color,
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Paper>

          {/* Course Analytics */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #ECE8E4',
              borderRadius: 3,
            }}
          >
            <Typography variant="h6" fontWeight={800}>
              Course Performance
            </Typography>

            <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
              Average student completion and enrollment by course.
            </Typography>

            {analytics.courses.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4 }}>
                No course enrollment data available yet.
              </Typography>
            ) : (
              <Stack spacing={3}>
                {analytics.courses.map((course) => (
                  <Box key={course.id}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Box>
                        <Typography fontWeight={700}>
                          {course.title}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {course.enrollments} enrollments ·{' '}
                          {course.completed} completed
                        </Typography>
                      </Box>

                      <Typography fontWeight={800}>
                        {course.averageCompletion}%
                      </Typography>
                    </Stack>

                    <LinearProgress
                      variant="determinate"
                      value={course.averageCompletion}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: '#ECE8E4',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#F26A21',
                          borderRadius: 5,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
