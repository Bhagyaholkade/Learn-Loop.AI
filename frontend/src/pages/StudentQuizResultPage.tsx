
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

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
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import {
  CheckCircleRounded,
  CancelRounded,
  HistoryRounded,
  QuizRounded,
  SchoolRounded,
  EmojiEventsRounded,
  ArrowBackRounded,
  TaskAltRounded,
  HighlightOffRounded,
} from '@mui/icons-material';

import {
  getQuizAttemptResult,
  type QuizResult,
  type QuestionReview,
} from '../api/quizApi';

interface LocationState {
  result?: QuizResult;
}

export default function StudentQuizResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();

  const state = location.state as LocationState | null;

  // Existing result passed after quiz submission
  const immediateResult = state?.result;

  const [result, setResult] = useState<QuizResult | null>(
    immediateResult || null,
  );

  const [loading, setLoading] = useState(
    !immediateResult && !!attemptId,
  );

  const [error, setError] = useState('');

  // Fetch previous attempt result when opened from Quiz History
  useEffect(() => {
    if (immediateResult) {
      setResult(immediateResult);
      setLoading(false);
      return;
    }

    if (!attemptId) {
      setLoading(false);
      setResult(null);
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getQuizAttemptResult(
          Number(attemptId),
        );

        setResult(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Unable to load this quiz result. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, immediateResult]);

  if (loading) {
    return (
      <Box
        minHeight="70vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>

        <Button
          startIcon={<HistoryRounded />}
          onClick={() => navigate('/student/quizzes/attempts')}
        >
          Back to Quiz History
        </Button>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ p: 5, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                bgcolor: 'action.hover',
                color: 'text.secondary',
              }}
            >
              <QuizRounded fontSize="large" />
            </Avatar>

            <Typography variant="h5" fontWeight={700}>
              No Result Found
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Please complete a quiz or select an attempt from your history.
            </Typography>

            <Button
              variant="contained"
              onClick={() => navigate('/student/quizzes')}
            >
              Explore Quizzes
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const passed = result.isPassed;

  const percentage = Math.min(
    100,
    Math.max(0, Number(result.percentage) || 0),
  );

  const questionReview: QuestionReview[] =
    result.questionReview || [];

  const correctCount = questionReview.filter(
    (question) => question.isCorrect,
  ).length;

  const incorrectCount = questionReview.length - correctCount;

  const unansweredCount = questionReview.filter(
    (question) => question.selectedOptionIndex === null,
  ).length;

  const submittedDate = new Date(result.submittedAt);

  const formattedDate = Number.isNaN(submittedDate.getTime())
    ? result.submittedAt
    : submittedDate.toLocaleString('en-IN');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3}>
          {/* Result Header */}
          <Box textAlign="center" sx={{ py: 2 }}>
            <Avatar
              sx={{
                width: 76,
                height: 76,
                mx: 'auto',
                mb: 2,
                bgcolor: passed ? 'success.light' : 'error.light',
                color: passed ? 'success.dark' : 'error.dark',
              }}
            >
              {passed ? (
                <EmojiEventsRounded sx={{ fontSize: 45 }} />
              ) : (
                <HighlightOffRounded sx={{ fontSize: 45 }} />
              )}
            </Avatar>

            <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
              {passed ? 'Congratulations!' : 'Keep Practicing!'}
            </Typography>

            <Typography color="text.secondary">
              You have completed
            </Typography>

            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
              {result.quizTitle}
            </Typography>

            <Chip
              icon={
                passed ? (
                  <CheckCircleRounded />
                ) : (
                  <CancelRounded />
                )
              }
              label={passed ? 'PASSED' : 'NOT PASSED'}
              color={passed ? 'success' : 'error'}
              sx={{
                mt: 2,
                px: 1,
                fontWeight: 700,
                borderRadius: 2,
              }}
            />
          </Box>

          {/* Score Card */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    Your Performance
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    Here's how you performed in this assessment.
                  </Typography>
                </Box>

                <Avatar
                  sx={{
                    bgcolor: passed ? 'success.light' : 'error.light',
                    color: passed ? 'success.dark' : 'error.dark',
                  }}
                >
                  <SchoolRounded />
                </Avatar>
              </Stack>

              <Box textAlign="center" mb={3}>
                <Typography
                  variant="h2"
                  fontWeight={800}
                  color={passed ? 'success.main' : 'error.main'}
                >
                  {percentage}%
                </Typography>

                <Typography color="text.secondary">
                  {result.obtainedMarks} out of {result.totalMarks} marks
                </Typography>
              </Box>

              <Box mb={3}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Overall Score
                  </Typography>

                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={passed ? 'success.main' : 'error.main'}
                  >
                    {percentage}%
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  color={passed ? 'success' : 'error'}
                  sx={{
                    height: 12,
                    borderRadius: 10,
                    bgcolor: passed ? 'success.light' : 'error.light',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 10,
                    },
                  }}
                />
              </Box>

              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: '1fr',
                  sm: 'repeat(3, 1fr)',
                }}
                gap={2}
              >
                {[
                  {
                    label: 'Obtained Marks',
                    value: result.obtainedMarks,
                  },
                  {
                    label: 'Total Marks',
                    value: result.totalMarks,
                  },
                  {
                    label: 'Passing Marks',
                    value: result.passingMarks,
                  },
                ].map((item) => (
                  <Paper
                    key={item.label}
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      borderRadius: 3,
                      bgcolor: 'action.hover',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>

                    <Typography variant="h5" fontWeight={800}>
                      {item.value}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Answer Statistics */}
          {questionReview.length > 0 && (
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Answer Summary
                </Typography>

                <Box
                  display="grid"
                  gridTemplateColumns={{
                    xs: 'repeat(2, 1fr)',
                    sm: 'repeat(3, 1fr)',
                  }}
                  gap={2}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'success.light',
                      borderRadius: 3,
                    }}
                  >
                    <CheckCircleRounded color="success" />

                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color="success.dark"
                    >
                      {correctCount}
                    </Typography>

                    <Typography variant="body2" color="success.dark">
                      Correct Answers
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'error.light',
                      borderRadius: 3,
                    }}
                  >
                    <CancelRounded color="error" />

                    <Typography
                      variant="h4"
                      fontWeight={800}
                      color="error.dark"
                    >
                      {incorrectCount}
                    </Typography>

                    <Typography variant="body2" color="error.dark">
                      Incorrect Answers
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: 'action.hover',
                      borderRadius: 3,
                      gridColumn: { xs: 'span 2', sm: 'auto' },
                    }}
                  >
                    <TaskAltRounded color="action" />

                    <Typography variant="h4" fontWeight={800}>
                      {questionReview.length}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Total Questions
                    </Typography>
                  </Paper>
                </Box>

                {unansweredCount > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {unansweredCount} question(s) were unanswered.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quiz Details */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <QuizRounded color="primary" />

                <Typography variant="h6" fontWeight={700}>
                  Attempt Details
                </Typography>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Quiz Name
                  </Typography>

                  <Typography fontWeight={600}>
                    {result.quizTitle}
                  </Typography>
                </Box>

                {result.course && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Course
                    </Typography>

                    <Typography fontWeight={600}>
                      {result.course}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Attempt ID
                  </Typography>

                  <Typography fontWeight={600}>
                    #{result.attemptId}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Submitted On
                  </Typography>

                  <Typography fontWeight={600}>
                    {formattedDate}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Performance Message */}
          <Alert
            severity={passed ? 'success' : 'warning'}
            sx={{ borderRadius: 3 }}
          >
            {passed
              ? `Excellent work! You achieved the passing score of ${result.passingMarks} marks.`
              : `You need at least ${result.passingMarks} marks to pass. Review the incorrect answers below and keep practising!`}
          </Alert>

          {/* Question-wise Review */}
          {questionReview.length > 0 && (
            <Box>
              <Box mb={2}>
                <Typography variant="h5" fontWeight={800}>
                  Question-wise Review
                </Typography>

                <Typography color="text.secondary" variant="body2">
                  Review your answers and compare them with the correct answers.
                </Typography>
              </Box>

              <Stack spacing={2}>
                {questionReview.map((question, index) => {
                  const unanswered =
                    question.selectedOptionIndex === null;

                  return (
                    <Card
                      key={question.questionId}
                      elevation={0}
                      sx={{
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: unanswered
                          ? 'warning.main'
                          : question.isCorrect
                            ? 'success.main'
                            : 'error.main',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Question Header */}
                      <Box
                        sx={{
                          px: 3,
                          py: 2,
                          bgcolor: unanswered
                            ? 'warning.light'
                            : question.isCorrect
                              ? 'success.light'
                              : 'error.light',
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={1}
                        >
                          <Typography
                            fontWeight={700}
                            color={
                              unanswered
                                ? 'warning.dark'
                                : question.isCorrect
                                  ? 'success.dark'
                                  : 'error.dark'
                            }
                          >
                            Question {index + 1}
                          </Typography>

                          <Chip
                            size="small"
                            icon={
                              unanswered ? (
                                undefined
                              ) : question.isCorrect ? (
                                <CheckCircleRounded />
                              ) : (
                                <CancelRounded />
                              )
                            }
                            label={
                              unanswered
                                ? 'Not Answered'
                                : question.isCorrect
                                  ? 'Correct'
                                  : 'Incorrect'
                            }
                            color={
                              unanswered
                                ? 'warning'
                                : question.isCorrect
                                  ? 'success'
                                  : 'error'
                            }
                            sx={{ fontWeight: 700 }}
                          />
                        </Stack>
                      </Box>

                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ mb: 2 }}
                        >
                          {question.questionText}
                        </Typography>

                        {/* Options */}
                        <Stack spacing={1.2}>
                          {question.options.map((option, optionIndex) => {
                            const isSelected =
                              optionIndex === question.selectedOptionIndex;

                            const isCorrectOption =
                              optionIndex === question.correctOptionIndex;

                            return (
                              <Paper
                                key={optionIndex}
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: isCorrectOption
                                    ? 'success.main'
                                    : isSelected
                                      ? 'error.main'
                                      : 'divider',
                                  bgcolor: isCorrectOption
                                    ? 'success.light'
                                    : isSelected
                                      ? 'error.light'
                                      : 'background.paper',
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1.5}
                                >
                                  <Avatar
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      fontSize: 13,
                                      fontWeight: 700,
                                      bgcolor: isCorrectOption
                                        ? 'success.main'
                                        : isSelected
                                          ? 'error.main'
                                          : 'action.selected',
                                      color:
                                        isCorrectOption || isSelected
                                          ? 'common.white'
                                          : 'text.primary',
                                    }}
                                  >
                                    {String.fromCharCode(65 + optionIndex)}
                                  </Avatar>

                                  <Typography
                                    sx={{ flexGrow: 1, fontWeight: 500 }}
                                  >
                                    {option}
                                  </Typography>

                                  {isCorrectOption && (
                                    <Chip
                                      label="Correct Answer"
                                      color="success"
                                      size="small"
                                    />
                                  )}

                                  {isSelected && !isCorrectOption && (
                                    <Chip
                                      label="Your Answer"
                                      color="error"
                                      size="small"
                                    />
                                  )}

                                  {isSelected && isCorrectOption && (
                                    <CheckCircleRounded color="success" />
                                  )}
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>

                        {/* Answer Explanation */}
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'action.hover',
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            mb={0.5}
                          >
                            Your Answer
                          </Typography>

                          <Typography
                            fontWeight={700}
                            color={
                              unanswered
                                ? 'warning.main'
                                : question.isCorrect
                                  ? 'success.main'
                                  : 'error.main'
                            }
                          >
                            {question.selectedAnswer || 'Not answered'}
                          </Typography>

                          {!question.isCorrect && (
                            <Box mt={1}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                mb={0.5}
                              >
                                Correct Answer
                              </Typography>

                              <Typography
                                fontWeight={700}
                                color="success.main"
                              >
                                {question.correctAnswer}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Marks */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mt={2}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Marks obtained
                          </Typography>

                          <Chip
                            size="small"
                            label={`${question.obtainedMarks} / ${question.marks} marks`}
                            color={
                              question.isCorrect ? 'success' : 'error'
                            }
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* No Review Fallback */}
          {questionReview.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              Question-wise review is not available for this attempt.
            </Alert>
          )}

          {/* Bottom Navigation */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                textAlign="center"
                mb={2}
              >
                What's Next?
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="center"
              >
                <Button
                  variant="contained"
                  startIcon={<QuizRounded />}
                  onClick={() => navigate('/student/quizzes')}
                >
                  Explore Quizzes
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<HistoryRounded />}
                  onClick={() =>
                    navigate('/student/quizzes/attempts')
                  }
                >
                  Attempt History
                </Button>

                <Button
                  variant="text"
                  startIcon={<SchoolRounded />}
                  onClick={() => navigate('/student')}
                >
                  Dashboard
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Button
            color="inherit"
            startIcon={<ArrowBackRounded />}
            onClick={() => navigate('/student/quizzes')}
            sx={{ alignSelf: 'center' }}
          >
            Back to Quizzes
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
