import { useEffect, useState } from 'react';
import { Button, Snackbar } from '@mui/material';
import {
  BookmarkBorderRounded as BookmarkBorderRoundedIcon,
  BookmarkRounded as BookmarkRoundedIcon,
} from '@mui/icons-material';

import {
  addBookmark,
  getMyBookmarks,
  removeBookmark,
} from '../api/bookmarkApi';
import { getApiErrorMessage } from '../services/api';

interface BookmarkButtonProps {
  courseId: number;
}

/**
 * Toggles a bookmark for a course. Bookmarks are stored per course,
 * so this can be placed on the course page or any of its lessons.
 */
export default function BookmarkButton({ courseId }: BookmarkButtonProps) {
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    getMyBookmarks()
      .then((bookmarks) => {
        if (cancelled) return;
        const match = bookmarks.find(
          (bookmark) => Number(bookmark.course?.id) === Number(courseId),
        );
        setBookmarkId(match ? match.id : null);
      })
      .catch(() => {
        // Leave the button usable even if the lookup fails.
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleToggle = async () => {
    setBusy(true);

    try {
      if (bookmarkId !== null) {
        await removeBookmark(bookmarkId);
        setBookmarkId(null);
        setMessage('Removed from bookmarks');
      } else {
        const created = await addBookmark(courseId);
        setBookmarkId(created.id);
        setMessage('Course bookmarked. Find it under Bookmarks in your dashboard.');
      }
    } catch (err: unknown) {
      setMessage(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const isBookmarked = bookmarkId !== null;

  return (
    <>
      <Button
        variant={isBookmarked ? 'contained' : 'outlined'}
        startIcon={
          isBookmarked ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />
        }
        disabled={!ready || busy}
        onClick={() => void handleToggle()}
      >
        {isBookmarked ? 'Bookmarked' : 'Bookmark course'}
      </Button>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3500}
        onClose={() => setMessage('')}
        message={message}
      />
    </>
  );
}
