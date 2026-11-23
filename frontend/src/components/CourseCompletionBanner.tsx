import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, Button } from '@mui/material';
import {
  EmojiEventsRounded as EmojiEventsRoundedIcon,
  QuizRounded as QuizRoundedIcon,
} from '@mui/icons-material';

import {
  checkCertificateEligibility,
  type CertificateEligibility,
} from '../api/certificateApi';

interface CourseCompletionBannerProps {
  courseId: number;
  /** Change this value (e.g. after completing a lesson) to re-check. */
  refreshKey?: unknown;
}

/**
 * Guides the student once all lessons are done:
 * lessons done → take the final quiz → certificate earned.
 * Shows nothing while lessons are still in progress.
 */
export default function CourseCompletionBanner({
  courseId,
  refreshKey,
}: CourseCompletionBannerProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<CertificateEligibility | null>(null);

  useEffect(() => {
    let cancelled = false;

    checkCertificateEligibility(courseId)
      .then((result) => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        // Not enrolled or request failed: show nothing.
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, refreshKey]);

  if (!status || !status.lessonsCompleted) {
    return null;
  }

  if (status.nextStep === 'CERTIFIED') {
    return (
      <Alert
        severity="success"
        icon={<EmojiEventsRoundedIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() =>
              navigate('/student', { state: { page: 'My Certificates' } })
            }
          >
            View certificate
          </Button>
        }
      >
        <AlertTitle>Course completed 🎉</AlertTitle>
        You earned the certificate for this course.
      </Alert>
    );
  }

  if (status.nextStep === 'TAKE_FINAL_QUIZ' && status.finalQuiz) {
    const quizId = status.finalQuiz.id;

    return (
      <Alert
        severity="info"
        icon={<QuizRoundedIcon />}
        sx={{ mb: 3, borderRadius: 2 }}
        action={
          <Button
            variant="contained"
            size="small"
            onClick={() =>
              navigate(`/student/quizzes/${quizId}/instructions`)
            }
          >
            Take final quiz
          </Button>
        }
      >
        <AlertTitle>You finished all lessons! 🎉</AlertTitle>
        Pass the final quiz &quot;{status.finalQuiz.title}&quot; to earn your
        certificate.
      </Alert>
    );
  }

  // All lessons done, but the course has no published final quiz.
  return (
    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
      <AlertTitle>You finished all lessons! 🎉</AlertTitle>
      This course does not have a final quiz yet, so a certificate is not
      available.
    </Alert>
  );
}
