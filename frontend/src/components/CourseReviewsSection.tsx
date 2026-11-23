import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { StarRounded as StarRoundedIcon } from '@mui/icons-material';

import {
  createReview,
  getCourseRating,
  getCourseReviews,
  type CourseRating,
  type CourseReview,
} from '../api/reviewApi';
import { getApiErrorMessage, getCurrentUser } from '../services/api';

interface CourseReviewsSectionProps {
  courseId: number;
  /** Students can only review after completing at least part of the course. */
  canReview?: boolean;
}

const MAX_COMMENT_LENGTH = 1000;

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function CourseReviewsSection({
  courseId,
  canReview = true,
}: CourseReviewsSectionProps) {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [rating, setRating] = useState<CourseRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [newRating, setNewRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const currentUserId = Number(getCurrentUser()?.id ?? 0);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const [reviewList, ratingSummary] = await Promise.all([
        getCourseReviews(courseId),
        getCourseRating(courseId),
      ]);

      setReviews(reviewList);
      setRating(ratingSummary);
    } catch (err: unknown) {
      setLoadError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const myReview = useMemo(
    () =>
      currentUserId
        ? reviews.find((review) => Number(review.student?.id) === currentUserId)
        : undefined,
    [reviews, currentUserId],
  );

  const handleSubmit = async () => {
    if (!newRating) {
      setSubmitError('Please select a star rating.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      await createReview({
        courseId,
        rating: newRating,
        comment: comment.trim() || undefined,
      });

      setNewRating(null);
      setComment('');
      setSubmitSuccess('Thank you! Your review has been posted.');
      await loadReviews();
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 2,
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Ratings &amp; Reviews
        </Typography>

        {rating && rating.totalReviews > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800}>
              {rating.averageRating.toFixed(1)}
            </Typography>
            <Rating value={rating.averageRating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              ({rating.totalReviews} review{rating.totalReviews === 1 ? '' : 's'})
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Review form */}
      {canReview && !myReview && !loading && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Rate this course
          </Typography>

          <Rating
            value={newRating}
            onChange={(_, value) => setNewRating(value)}
            size="large"
            emptyIcon={<StarRoundedIcon fontSize="inherit" />}
            icon={<StarRoundedIcon fontSize="inherit" />}
          />

          <TextField
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 1.5 }}
            placeholder="Share what you liked or what could be better (optional)"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))
            }
            helperText={`${comment.length}/${MAX_COMMENT_LENGTH}`}
          />

          {submitError && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {submitError}
            </Alert>
          )}

          <Button
            variant="contained"
            sx={{ mt: 1.5 }}
            disabled={submitting || !newRating}
            onClick={() => void handleSubmit()}
          >
            {submitting ? 'Posting…' : 'Post review'}
          </Button>
        </Paper>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSubmitSuccess('')}>
          {submitSuccess}
        </Alert>
      )}

      {/* Review list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={28} />
        </Box>
      ) : loadError ? (
        <Alert severity="warning">{loadError}</Alert>
      ) : reviews.length === 0 ? (
        <Typography color="text.secondary">
          No reviews yet. Be the first to review this course.
        </Typography>
      ) : (
        <Stack divider={<Divider flexItem />} spacing={2}>
          {reviews.map((review) => (
            <Stack key={review.id} direction="row" spacing={1.5}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                {getInitials(review.student?.name)}
              </Avatar>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography fontWeight={700}>
                    {review.student?.name ?? 'Student'}
                    {Number(review.student?.id) === currentUserId && ' (you)'}
                  </Typography>
                  <Rating value={review.rating} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>

                {review.comment && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
                  >
                    {review.comment}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
