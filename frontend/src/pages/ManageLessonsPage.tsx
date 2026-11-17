
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { Add as AddIcon } from '@mui/icons-material';
import { EditOutlined as EditOutlinedIcon } from '@mui/icons-material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { MenuBookOutlined as MenuBookOutlinedIcon } from '@mui/icons-material';

import { getCourses, type Course } from '../api/courseApi';
import {
  getLessonsByCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  type Lesson,
  type CreateLessonPayload,
} from '../api/lessonApi';

const ManageLessonsPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [form, setForm] = useState<CreateLessonPayload>({
    title: '',
    content: '',
    courseId: 0,
    order: 1,
  });

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showNotification = (
    message: string,
    severity: 'success' | 'error' = 'success',
  ) => {
    setNotification({ open: true, message, severity });
  };

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data } = await getCourses({ limit: 100 });
        setCourses(data);

        if (data.length > 0) {
          setSelectedCourseId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
        showNotification('Failed to load courses', 'error');
      }
    };

    void loadCourses();
  }, []);

  const loadLessons = async (courseId: number) => {
    setLoading(true);

    try {
      const data = await getLessonsByCourse(courseId);

      setLessons(
        [...data].sort((a, b) => a.order - b.order),
      );
    } catch (error) {
      console.error('Failed to load lessons:', error);
      showNotification('Failed to load lessons', 'error');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId !== '') {
      void loadLessons(selectedCourseId);
    } else {
      setLessons([]);
    }
  }, [selectedCourseId]);

  const openAddDialog = () => {
    if (selectedCourseId === '') return;

    setEditingLesson(null);

    setForm({
      title: '',
      content: '',
      courseId: selectedCourseId,
      order: lessons.length + 1,
    });

    setDialogOpen(true);
  };

  const openEditDialog = (lesson: Lesson) => {
    setEditingLesson(lesson);

    setForm({
      title: lesson.title,
      content: lesson.content ?? '',
      courseId: lesson.course.id,
      order: lesson.order,
    });

    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !form.title.trim() ||
      !form.content?.trim() ||
      !Number.isInteger(form.order) ||
      form.order < 1
    ) {
      showNotification(
        'Please enter a valid title, content, and order',
        'error',
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        content: form.content?.trim() ?? '',
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, payload);
        showNotification('Lesson updated successfully');
      } else {
        await createLesson(payload);
        showNotification('Lesson created successfully');
      }

      setDialogOpen(false);
      await loadLessons(Number(selectedCourseId));
    } catch (error) {
      console.error('Failed to save lesson:', error);
      showNotification('Failed to save lesson', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this lesson?',
    );

    if (!confirmed) return;

    try {
      await deleteLesson(lessonId);
      showNotification('Lesson deleted successfully');
      await loadLessons(Number(selectedCourseId));
    } catch (error) {
      console.error('Failed to delete lesson:', error);
      showNotification('Failed to delete lesson', 'error');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
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
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Manage Lessons
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Create and manage lessons for your courses.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          disabled={selectedCourseId === ''}
        >
          Add Lesson
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            select
            fullWidth
            label="Select Course"
            value={selectedCourseId}
            onChange={(event) =>
              setSelectedCourseId(Number(event.target.value))
            }
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.title}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Stack
        direction="row"
        sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Course Lessons
        </Typography>

        <Typography color="text.secondary" variant="body2">
          {lessons.length} lessons
        </Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <MenuBookOutlinedIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant="h6">
              No lessons found
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Add the first lesson for this course.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>
                      {lesson.order}
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      {lesson.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt: 0.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {lesson.content || 'No content available'}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => openEditDialog(lesson)}
                      aria-label="Edit lesson"
                    >
                      <EditOutlinedIcon />
                    </IconButton>

                    <IconButton
                      color="error"
                      onClick={() => void handleDelete(lesson.id)}
                      aria-label="Delete lesson"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Lesson Title"
              value={form.title}
              inputProps={{ maxLength: 150 }}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
            />

            <TextField
              fullWidth
              multiline
              minRows={5}
              label="Lesson Content"
              value={form.content}
              onChange={(event) =>
                setForm({ ...form, content: event.target.value })
              }
              required
            />

            <TextField
              fullWidth
              type="number"
              label="Lesson Order"
              value={form.order}
              onChange={(event) =>
                setForm({
                  ...form,
                  order: Number(event.target.value),
                })
              }
              inputProps={{ min: 1, step: 1 }}
              required
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : editingLesson
                ? 'Update Lesson'
                : 'Create Lesson'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() =>
          setNotification((previous) => ({
            ...previous,
            open: false,
          }))
        }
      >
        <Alert
          severity={notification.severity}
          onClose={() =>
            setNotification((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageLessonsPage;
