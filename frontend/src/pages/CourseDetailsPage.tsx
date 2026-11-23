import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  CheckCircleRounded as CheckCircleRoundedIcon,
  MenuBookRounded as MenuBookRoundedIcon,
  RadioButtonUncheckedRounded as RadioButtonUncheckedRoundedIcon,
} from '@mui/icons-material';

import { getCourses, type Course } from '../api/courseApi';
import CourseReviewsSection from '../components/CourseReviewsSection';
import BookmarkButton from '../components/BookmarkButton';
import CourseCompletionBanner from '../components/CourseCompletionBanner';
import { getLessonsByCourse, type Lesson } from '../api/lessonApi';

import {
  getCourseProgressSummary,
  getMyProgress,
  type CourseProgressSummary,
} from '../api/progressApi';

function CourseDetailsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] =
    useState<CourseProgressSummary | null>(null);
  const [completedLessonIds, setCompletedLessonIds] =
    useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressError, setProgressError] = useState('');
  const [lessonProgressError, setLessonProgressError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadCourseDetails() {
      const id = Number(courseId);

      if (!courseId || !Number.isInteger(id) || id <= 0) {
        setError('Invalid course ID.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setProgressError('');
      setLessonProgressError('');
      setCourse(null);
      setLessons([]);
      setProgress(null);
      setCompletedLessonIds(new Set());

      try {
        // Load the course and its lessons first.
        const [coursesResponse, lessonsResponse] = await Promise.all([
          getCourses({ page: 1, limit: 100 }),
          getLessonsByCourse(id),
        ]);

        if (!isActive) return;

        const selectedCourse =
          coursesResponse.data.find(
            (item) => Number(item.id) === id,
          ) ?? null;

        if (!selectedCourse) {
          setError('Course not found.');
          return;
        }

        const sortedLessons = [...lessonsResponse].sort(
          (a, b) => a.order - b.order,
        );

        setCourse(selectedCourse);
        setLessons(sortedLessons);

        // Load the summary and individual completion records independently.
        // This allows lesson indicators to work even if the summary endpoint
        // does not return a record for a course with no completed lessons.
        const [summaryResult, recordsResult] = await Promise.allSettled([
          getCourseProgressSummary(),
          getMyProgress(),
        ]);

        if (!isActive) return;

        let summary: CourseProgressSummary | null = null;

        if (summaryResult.status === 'fulfilled') {
          summary =
            summaryResult.value.find(
              (item) => Number(item.courseId) === id,
            ) ?? null;
        } else {
          console.error(
            'Failed to load course progress summary:',
            summaryResult.reason,
          );
        }

        if (recordsResult.status === 'fulfilled') {
          // Match progress records to the lessons already loaded for this
          // course. This does not depend on lesson.course being populated.
          const courseLessonIds = new Set(
            sortedLessons.map((lesson) => Number(lesson.id)),
          );

          const completedIds = new Set(
            recordsResult.value
              .filter(
                (record) =>
                  record.isCompleted &&
                  courseLessonIds.has(Number(record.lesson?.id)),
              )
              .map((record) => Number(record.lesson.id)),
          );

          setCompletedLessonIds(completedIds);

          const totalLessons = sortedLessons.length;
          const completedCount = completedIds.size;

          // Prefer the summary endpoint when it returns this course.
          // Otherwise calculate from the individual lesson records.
          setProgress(
            summary ?? {
              courseId: id,
              courseTitle: selectedCourse.title,
              totalLessons,
              completedLessons: completedCount,
              completionPercentage:
                totalLessons > 0
                  ? Math.round((completedCount / totalLessons) * 100)
                  : 0,
            },
          );
        } else {
          console.error(
            'Failed to load individual lesson progress:',
            recordsResult.reason,
          );

          setLessonProgressError(
            'Individual lesson completion status is unavailable.',
          );

          if (summary) {
            setProgress(summary);
          } else {
            setProgressError(
              'Unable to load course progress. Please try again later.',
            );
          }
        }

        if (
          summaryResult.status === 'rejected' &&
          recordsResult.status === 'fulfilled'
        ) {
          // The individual records are enough to calculate course progress.
          setProgressError('');
        }
      } catch (err) {
        if (!isActive) return;

        console.error('Failed to load course details:', err);
        setError('Unable to load course details. Please try again.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadCourseDetails();

    return () => {
      isActive = false;
    };
  }, [courseId]);

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

  if (error || !course) {
    return (
      <Box maxWidth={900} mx="auto" p={3}>
        <Alert severity="error">
          {error || 'Course not found.'}
        </Alert>

        <Button
          sx={{ mt: 2 }}
          onClick={() => navigate('/student')}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const totalLessons = lessons.length;

  // Use the lesson-level records when available so the overall count and
  // individual lesson indicators always agree.
  const hasLessonProgress = !lessonProgressError;
  const completedLessons = hasLessonProgress
    ? completedLessonIds.size
    : Math.min(progress?.completedLessons ?? 0, totalLessons);

  const completionPercentage =
    totalLessons > 0
      ? Math.min(
          100,
          Math.max(
            0,
            hasLessonProgress
              ? Math.round((completedLessons / totalLessons) * 100)
              : (progress?.completionPercentage ??
                  Math.round((completedLessons / totalLessons) * 100)),
          ),
        )
      : 0;

  const courseStatus =
    completedLessons === 0
      ? 'Not Started'
      : completedLessons >= totalLessons && totalLessons > 0
        ? 'Completed'
        : 'In Progress';

  const statusColor =
    courseStatus === 'Completed'
      ? 'success'
      : courseStatus === 'In Progress'
        ? 'primary'
        : 'default';

  return (
    <Box maxWidth={1000} mx="auto" p={{ xs: 2, md: 4 }}>
      <Stack
        direction="row"
        sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Button onClick={() => navigate('/student')}>
          ← Back to Dashboard
        </Button>

        <BookmarkButton courseId={course.id} />
      </Stack>

      {/* After the last lesson: take the final quiz → certificate. */}
      <CourseCompletionBanner courseId={course.id} />

      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 3,
        }}
      >
        {/* Course information */}
        <Typography variant="overline" color="primary">
          {course.category}
        </Typography>

        <Typography variant="h4" fontWeight={700} gutterBottom>
          {course.title}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Instructor: {course.instructor}
        </Typography>

        <Typography sx={{ mb: 2 }}>
          {course.description || 'No course description available.'}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <MenuBookRoundedIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {totalLessons} lesson{totalLessons === 1 ? '' : 's'}
          </Typography>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Overall course progress */}
        <Box sx={{ mb: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Your Learning Progress
            </Typography>

            <Chip label={courseStatus} color={statusColor} size="small" />
          </Stack>

          {progressError ? (
            <Alert severity="warning">{progressError}</Alert>
          ) : (
            <>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {completedLessons} of {totalLessons} lessons completed
                </Typography>

                <Typography variant="h5" fontWeight={700} color="primary">
                  {completionPercentage}%
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                  },
                }}
              />

              {courseStatus === 'Completed' && (
                <Alert
                  severity="success"
                  icon={<CheckCircleRoundedIcon />}
                  sx={{ mt: 2 }}
                >
                  Congratulations! You have completed this course.
                </Alert>
              )}

              {courseStatus === 'Not Started' && totalLessons > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Start your first lesson to begin tracking your progress.
                </Typography>
              )}
            </>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Course curriculum with individual lesson completion status */}
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Course Curriculum
        </Typography>

        {lessonProgressError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {lessonProgressError} You can still open and study the lessons.
          </Alert>
        )}

        {lessons.length === 0 ? (
          <Alert severity="info">
            No lessons have been added to this course yet.
          </Alert>
        ) : (
          <List disablePadding>
            {lessons.map((lesson, index) => {
              const isCompleted = completedLessonIds.has(
                Number(lesson.id),
              );

              return (
                <ListItem
                  key={lesson.id}
                  disablePadding
                  divider={index !== lessons.length - 1}
                >
                  <ListItemButton
                    onClick={() =>
                      navigate(
                        `/student/courses/${course.id}/lessons/${lesson.id}`,
                      )
                    }
                    sx={{
                      py: 2,
                      px: 2,
                      borderRadius: 1,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleRoundedIcon
                        color="success"
                        sx={{ mr: 1.5 }}
                      />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon
                        color="disabled"
                        sx={{ mr: 1.5 }}
                      />
                    )}

                    <ListItemText
                      primary={`${index + 1}. ${lesson.title}`}
                      secondary={`Lesson ${lesson.order}`}
                    />

                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Chip
                        label={isCompleted ? 'Completed' : 'Not Started'}
                        color={isCompleted ? 'success' : 'default'}
                        size="small"
                        variant={isCompleted ? 'filled' : 'outlined'}
                      />

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(event) => {
                          // Prevent the parent ListItemButton from navigating
                          // a second time.
                          event.stopPropagation();
                          navigate(
                            `/student/courses/${course.id}/lessons/${lesson.id}`,
                          );
                        }}
                      >
                        Open lesson
                      </Button>
                    </Stack>
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}

        <Divider sx={{ my: 4 }} />

        <CourseReviewsSection courseId={course.id} />
      </Paper>
    </Box>
  );
}

export default CourseDetailsPage;
