import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  ArrowBackRounded as ArrowBackRoundedIcon,
  ArrowForwardRounded as ArrowForwardRoundedIcon,
  CheckCircleRounded as CheckCircleRoundedIcon,
  MenuBookRounded as MenuBookRoundedIcon,
  OpenInNewRounded as OpenInNewRoundedIcon,
  PictureAsPdfRounded as PictureAsPdfRoundedIcon,
  PlayCircleOutlineRounded as PlayCircleOutlineRoundedIcon,
} from '@mui/icons-material';

import {
  getLessonById,
  getLessonsByCourse,
  type Lesson,
} from '../api/lessonApi';

import {
  getMyProgress,
  markLessonCompleted,
} from '../api/progressApi';
import BookmarkButton from '../components/BookmarkButton';
import CourseCompletionBanner from '../components/CourseCompletionBanner';

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    let videoId = '';

    if (
      parsedUrl.hostname === 'www.youtube.com' ||
      parsedUrl.hostname === 'youtube.com' ||
      parsedUrl.hostname === 'm.youtube.com'
    ) {
      videoId = parsedUrl.searchParams.get('v') ?? '';
    } else if (parsedUrl.hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.slice(1);
    } else if (
      parsedUrl.hostname === 'www.youtube-nocookie.com' ||
      parsedUrl.hostname === 'youtube-nocookie.com'
    ) {
      videoId = parsedUrl.pathname.split('/').filter(Boolean).pop() ?? '';
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return null;
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

function LessonPage() {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();

  const navigate = useNavigate();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCompleted, setIsCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [notice, setNotice] = useState('');

  // Load lesson, course lessons and saved progress.
  useEffect(() => {
    let active = true;

    async function loadLesson() {
      const id = Number(lessonId);

      if (!lessonId || !Number.isInteger(id) || id <= 0) {
        setError('Invalid lesson ID.');
        setLesson(null);
        setCourseLessons([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setLesson(null);
      setCourseLessons([]);
      setIsCompleted(false);
      setNotice('');

      try {
        // 1. Fetch current lesson.
        const result = await getLessonById(id);

        if (!active) return;

        // 2. Validate course ID.
        if (courseId && Number(result.course.id) !== Number(courseId)) {
          setError('This lesson does not belong to the selected course.');
          return;
        }

        setLesson(result);

        // 3. Fetch all lessons in the current course.
        try {
          const lessons = await getLessonsByCourse(result.course.id);

          if (!active) return;

          const sortedLessons = [...lessons].sort(
            (a, b) => a.order - b.order,
          );

          setCourseLessons(sortedLessons);
        } catch (lessonsError) {
          console.error('Failed to load course lessons:', lessonsError);

          if (active) {
            setCourseLessons([]);
            setNotice(
              'Unable to load lesson navigation. You can still view this lesson.',
            );
          }
        }

        if (!active) return;

        // 4. Fetch saved student progress.
        try {
          const progress = await getMyProgress();

          if (!active) return;

          setIsCompleted(
            progress.some(
              (item) =>
                Number(item.lesson?.id) === id && item.isCompleted,
            ),
          );
        } catch (progressError) {
          console.error('Failed to load lesson progress:', progressError);

          if (active) {
            setNotice(
              'Unable to load saved progress. You can still mark this lesson complete.',
            );
          }
        }
      } catch (err) {
        if (!active) return;

        console.error('Failed to load lesson:', err);
        setError('Unable to load this lesson. Please try again.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLesson();

    return () => {
      active = false;
    };
  }, [lessonId, courseId]);

  // Mark current lesson as completed.
  const handleMarkCompleted = async () => {
    if (!lesson || isCompleted || completing) return;

    setCompleting(true);
    setNotice('');

    try {
      await markLessonCompleted(lesson.id);
      setIsCompleted(true);
      setNotice('Lesson completed successfully!');
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response
        ?.status;

      if (status === 409) {
        setIsCompleted(true);
        setNotice('This lesson was already completed.');
      } else {
        console.error('Failed to complete lesson:', err);
        setNotice('Unable to save completion. Please try again.');
      }
    } finally {
      setCompleting(false);
    }
  };

  // Loading state.
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

  // Error state.
  if (error || !lesson) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Lesson not found.'}</Alert>

        <Button
          sx={{ mt: 2 }}
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(`/student/courses/${courseId}`)}
        >
          Back to course
        </Button>
      </Container>
    );
  }

  const videoEmbedUrl = lesson.videoUrl
    ? getYouTubeEmbedUrl(lesson.videoUrl)
    : null;

  const aiContent = lesson.aiContent;

  const hasAiContent =
    !!aiContent &&
    (!!aiContent.theory?.trim() ||
      (aiContent.learningObjectives?.length ?? 0) > 0 ||
      (aiContent.practicalExamples?.length ?? 0) > 0 ||
      (aiContent.exercises?.length ?? 0) > 0 ||
      (aiContent.keyTakeaways?.length ?? 0) > 0 ||
      (aiContent.knowledgeCheck?.length ?? 0) > 0);

  // Find current lesson position.
  const currentLessonIndex = courseLessons.findIndex(
    (item) => Number(item.id) === Number(lesson.id),
  );

  const previousLesson =
    currentLessonIndex > 0
      ? courseLessons[currentLessonIndex - 1]
      : null;

  const nextLesson =
    currentLessonIndex >= 0 &&
    currentLessonIndex < courseLessons.length - 1
      ? courseLessons[currentLessonIndex + 1]
      : null;

  const handleLessonNavigation = (targetLesson: Lesson) => {
    navigate(
      `/student/courses/${lesson.course.id}/lessons/${targetLesson.id}`,
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack
        direction="row"
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(`/student/courses/${lesson.course.id}`)}
        >
          Back to course
        </Button>

        <BookmarkButton courseId={lesson.course.id} />
      </Stack>

      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          {/* Course information */}
          <Box>
            <Typography
              variant="overline"
              color="primary"
              fontWeight={700}
            >
              {lesson.course.title}
            </Typography>

            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              {lesson.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Lesson {lesson.order}
            </Typography>
          </Box>

          <Divider />

          {/* Lesson overview / manually entered lesson content */}
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Lesson Overview
            </Typography>

            {lesson.content?.trim() ? (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}
              >
                {lesson.content}
              </Typography>
            ) : (
              <Alert severity="info">
                Lesson overview has not been added yet.
              </Alert>
            )}
          </Box>

          {/* Detailed AI-generated lesson content */}
          {hasAiContent && aiContent && (
            <Stack spacing={3}>
              <Divider />

              <Typography variant="h5" fontWeight={700}>
                Detailed Learning Content
              </Typography>

              {/* AI learning objectives */}
              {!!aiContent.learningObjectives?.length && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Learning Objectives
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <List disablePadding>
                      {aiContent.learningObjectives.map((objective, index) => (
                        <ListItem key={`${index}-${objective}`} disableGutters>
                          <ListItemText primary={objective} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* AI theory */}
              {!!aiContent.theory?.trim() && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Lesson Explanation
                  </Typography>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.9 }}
                  >
                    {aiContent.theory}
                  </Typography>
                </Box>
              )}

              {/* Practical examples */}
              {!!aiContent.practicalExamples?.length && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Practical Examples
                  </Typography>

                  <Stack spacing={2}>
                    {aiContent.practicalExamples.map((example, index) => (
                      <Card key={`${index}-${example.title}`} variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {index + 1}. {example.title}
                          </Typography>

                          <Typography
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              whiteSpace: 'pre-wrap',
                              lineHeight: 1.8,
                            }}
                          >
                            {example.explanation}
                          </Typography>

                          {example.code && (
                            <Box
                              component="pre"
                              sx={{
                                mt: 2,
                                mb: 0,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'grey.900',
                                color: 'common.white',
                                overflowX: 'auto',
                                fontSize: 13,
                                lineHeight: 1.7,
                              }}
                            >
                              <code>{example.code}</code>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Exercises */}
              {!!aiContent.exercises?.length && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Practice Exercises
                  </Typography>

                  <Stack spacing={2}>
                    {aiContent.exercises.map((exercise, index) => (
                      <Card key={`${index}-${exercise.title}`} variant="outlined">
                        <CardContent>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            gap={2}
                            flexWrap="wrap"
                          >
                            <Typography fontWeight={700}>
                              {index + 1}. {exercise.title}
                            </Typography>

                            <Chip
                              label={exercise.difficulty}
                              size="small"
                              color={
                                exercise.difficulty === 'easy'
                                  ? 'success'
                                  : exercise.difficulty === 'medium'
                                    ? 'warning'
                                    : 'error'
                              }
                            />
                          </Stack>

                          <Typography
                            sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                            color="text.secondary"
                          >
                            {exercise.description}
                          </Typography>

                          {exercise.expectedOutcome && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              <strong>Expected outcome:</strong>{' '}
                              {exercise.expectedOutcome}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Key takeaways */}
              {!!aiContent.keyTakeaways?.length && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Key Takeaways
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <List disablePadding>
                      {aiContent.keyTakeaways.map((takeaway, index) => (
                        <ListItem key={`${index}-${takeaway}`} disableGutters>
                          <ListItemText
                            primary={`${index + 1}. ${takeaway}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Knowledge check */}
              {!!aiContent.knowledgeCheck?.length && (
                <Box>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Knowledge Check
                  </Typography>

                  <Stack spacing={2}>
                    {aiContent.knowledgeCheck.map((item, index) => (
                      <Card
                        key={`${index}-${item.question}`}
                        variant="outlined"
                      >
                        <CardContent>
                          <Typography fontWeight={700}>
                            {index + 1}. {item.question}
                          </Typography>

                          <List disablePadding sx={{ mt: 1 }}>
                            {item.options?.map((option, optionIndex) => (
                              <ListItem
                                key={`${optionIndex}-${option}`}
                                disableGutters
                              >
                                <ListItemText
                                  primary={`${String.fromCharCode(
                                    65 + optionIndex,
                                  )}. ${option}`}
                                />
                              </ListItem>
                            ))}
                          </List>

                          <Divider sx={{ my: 1.5 }} />

                          <Typography color="success.main" fontWeight={700}>
                            Correct Answer: {item.correctAnswer}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                          >
                            Explanation: {item.explanation}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}

          {/* Video section */}
          {lesson.videoUrl && (
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <PlayCircleOutlineRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Lesson Video
                </Typography>
              </Stack>

              {videoEmbedUrl ? (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16 / 9',
                    overflow: 'hidden',
                    borderRadius: 2,
                    bgcolor: 'black',
                  }}
                >
                  <Box
                    component="iframe"
                    src={videoEmbedUrl}
                    title={`${lesson.title} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                    }}
                  />
                </Box>
              ) : (
                <Alert severity="info">
                  This video cannot be embedded.{' '}
                  <Link
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Watch video
                  </Link>
                </Alert>
              )}
            </Box>
          )}

          {/* Lesson objectives */}
          {lesson.objectives && lesson.objectives.length > 0 && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                What You Will Learn
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <List disablePadding>
                  {lesson.objectives.map((objective, index) => (
                    <ListItem
                      key={`${index}-${objective}`}
                      disableGutters
                    >
                      <ListItemText
                        primary={objective}
                        primaryTypographyProps={{ variant: 'body1' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* PDF section */}
          {lesson.pdfUrl && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Lesson Materials
              </Typography>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PictureAsPdfRoundedIcon color="error" fontSize="large" />

                  <Box>
                    <Typography fontWeight={600}>Lesson PDF</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Download or view lesson material
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  component="a"
                  href={lesson.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  endIcon={<OpenInNewRoundedIcon />}
                >
                  Open PDF
                </Button>
              </Paper>
            </Box>
          )}

          {/* Additional resources */}
          {lesson.resources && lesson.resources.length > 0 && (
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Additional Resources
              </Typography>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <List disablePadding>
                  {lesson.resources.map((resource, index) => {
                    let isUrl = false;

                    try {
                      const parsed = new URL(resource);
                      isUrl =
                        parsed.protocol === 'https:' ||
                        parsed.protocol === 'http:';
                    } catch {
                      isUrl = false;
                    }

                    return (
                      <ListItem
                        key={`${index}-${resource}`}
                        disableGutters
                      >
                        <ListItemText
                          primary={
                            isUrl ? (
                              <Link
                                href={resource}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="hover"
                              >
                                {resource}
                              </Link>
                            ) : (
                              resource
                            )
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            </Box>
          )}

          {/* Empty resources information: do not show when AI content exists. */}
          {!lesson.videoUrl &&
            !lesson.pdfUrl &&
            (!lesson.objectives || lesson.objectives.length === 0) &&
            (!lesson.resources || lesson.resources.length === 0) &&
            !hasAiContent && (
              <Alert severity="info" icon={<MenuBookRoundedIcon />}>
                No additional learning materials are available for this lesson
                yet.
              </Alert>
            )}

          <Divider />

          {/* Progress notification */}
          {notice && (
            <Alert
              severity={
                isCompleted
                  ? 'success'
                  : notice.includes('Unable')
                    ? 'warning'
                    : 'info'
              }
            >
              {notice}
            </Alert>
          )}

          {/* Previous and next lesson navigation */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Button
              variant="outlined"
              disabled={!previousLesson}
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => {
                if (previousLesson) {
                  handleLessonNavigation(previousLesson);
                }
              }}
              sx={{
                flex: 1,
                py: 1.3,
                borderRadius: 2,
              }}
            >
              Previous Lesson
            </Button>

            <Button
              variant="contained"
              disabled={!nextLesson}
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => {
                if (nextLesson) {
                  handleLessonNavigation(nextLesson);
                }
              }}
              sx={{
                flex: 1,
                py: 1.3,
                borderRadius: 2,
              }}
            >
              Next Lesson
            </Button>
          </Stack>

          {/* Complete lesson button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            disabled={isCompleted || completing}
            startIcon={
              isCompleted ? <CheckCircleRoundedIcon /> : undefined
            }
            onClick={() => void handleMarkCompleted()}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 700,
            }}
          >
            {completing
              ? 'Saving progress...'
              : isCompleted
                ? 'Lesson completed'
                : 'Mark as Complete'}
          </Button>
        </Stack>
      </Paper>

      {/* After the last lesson: take the final quiz → certificate. */}
      <Box sx={{ mt: 3 }}>
        <CourseCompletionBanner
          courseId={lesson.course.id}
          refreshKey={isCompleted}
        />
      </Box>
    </Container>
  );
}

export default LessonPage;
