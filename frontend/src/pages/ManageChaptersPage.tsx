import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import {
  Add as AddIcon,
  ArrowBackRounded as ArrowBackRoundedIcon,
  Delete as DeleteIcon,
  EditOutlined as EditOutlinedIcon,
  LibraryBooksOutlined as LibraryBooksOutlinedIcon,
} from '@mui/icons-material';

import { getCourses, type Course } from '../api/courseApi';
import {
  createChapter,
  deleteChapter,
  getChaptersByCourse,
  updateChapter,
  type Chapter,
} from '../api/chapterApi';
import { getApiErrorMessage } from '../services/api';

interface ChapterForm {
  title: string;
  description: string;
  objectivesText: string;
  order: number;
}

const emptyForm: ChapterForm = {
  title: '',
  description: '',
  objectivesText: '',
  order: 1,
};

const ManageChaptersPage = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [form, setForm] = useState<ChapterForm>(emptyForm);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showNotification = (
    message: string,
    severity: 'success' | 'error' = 'success',
  ) => setNotification({ open: true, message, severity });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const { data } = await getCourses({ limit: 100 });
        setCourses(data);
        if (data.length > 0) setSelectedCourseId(data[0].id);
      } catch (error) {
        showNotification(getApiErrorMessage(error), 'error');
      }
    };

    void loadCourses();
  }, []);

  const loadChapters = useCallback(async (courseId: number) => {
    setLoading(true);

    try {
      const data = await getChaptersByCourse(courseId);
      setChapters([...data].sort((a, b) => a.order - b.order));
    } catch (error) {
      showNotification(getApiErrorMessage(error), 'error');
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId !== '') {
      void loadChapters(selectedCourseId);
    } else {
      setChapters([]);
    }
  }, [selectedCourseId, loadChapters]);

  const openAddDialog = () => {
    setEditingChapter(null);
    setForm({
      ...emptyForm,
      order:
        chapters.length > 0
          ? Math.max(...chapters.map((chapter) => chapter.order)) + 1
          : 1,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setForm({
      title: chapter.title,
      description: chapter.description ?? '',
      objectivesText: (chapter.learningObjectives ?? []).join('\n'),
      order: chapter.order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (selectedCourseId === '') return;

    if (!form.title.trim() || !Number.isInteger(form.order) || form.order < 1) {
      showNotification('Please enter a title and a valid order', 'error');
      return;
    }

    const learningObjectives = form.objectivesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      learningObjectives,
      order: form.order,
    };

    setSaving(true);

    try {
      if (editingChapter) {
        await updateChapter(editingChapter.id, payload);
        showNotification('Chapter updated successfully');
      } else {
        await createChapter({ ...payload, courseId: selectedCourseId });
        showNotification('Chapter created successfully');
      }

      setDialogOpen(false);
      await loadChapters(selectedCourseId);
    } catch (error) {
      showNotification(getApiErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapter: Chapter) => {
    const lessonCount = chapter.lessons?.length ?? 0;
    const confirmed = window.confirm(
      lessonCount > 0
        ? `Delete "${chapter.title}"? This will also permanently delete its ${lessonCount} lesson(s) and their progress.`
        : `Delete "${chapter.title}"?`,
    );

    if (!confirmed || selectedCourseId === '') return;

    try {
      await deleteChapter(chapter.id);
      showNotification('Chapter deleted successfully');
      await loadChapters(selectedCourseId);
    } catch (error) {
      showNotification(getApiErrorMessage(error), 'error');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate('/admin')}
        sx={{ mb: 2 }}
      >
        Back to dashboard
      </Button>

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
            Manage Chapters
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Organise each course into chapters. Assign lessons to chapters
            from Manage Lessons.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          disabled={selectedCourseId === ''}
        >
          Add Chapter
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            select
            fullWidth
            label="Select Course"
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(Number(event.target.value))}
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
          Course Chapters
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {chapters.length} chapters
        </Typography>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : chapters.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <LibraryBooksOutlinedIcon
              sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }}
            />
            <Typography variant="h6">No chapters yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Add the first chapter, or generate a full course with the AI
              Course Creator.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {chapters.map((chapter) => (
            <Card key={chapter.id}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ alignItems: { xs: 'stretch', sm: 'flex-start' } }}
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
                    <Typography sx={{ fontWeight: 700 }}>{chapter.order}</Typography>
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography sx={{ fontWeight: 700 }}>{chapter.title}</Typography>
                      <Chip
                        size="small"
                        label={`${chapter.lessons?.length ?? 0} lessons`}
                      />
                    </Stack>

                    {chapter.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {chapter.description}
                      </Typography>
                    )}

                    {(chapter.learningObjectives?.length ?? 0) > 0 && (
                      <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
                        {chapter.learningObjectives!.map((objective, index) => (
                          <Typography
                            key={`${chapter.id}-${index}`}
                            component="li"
                            variant="body2"
                            color="text.secondary"
                          >
                            {objective}
                          </Typography>
                        ))}
                      </Box>
                    )}

                    {(chapter.lessons?.length ?? 0) > 0 && (
                      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                        {chapter.lessons!.map((lesson) => (
                          <Chip
                            key={lesson.id}
                            size="small"
                            variant="outlined"
                            label={`${lesson.order}. ${lesson.title}`}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => openEditDialog(chapter)}
                      aria-label="Edit chapter"
                    >
                      <EditOutlinedIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => void handleDelete(chapter)}
                      aria-label="Delete chapter"
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
        <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              required
              label="Chapter Title"
              value={form.title}
              inputProps={{ maxLength: 200 }}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Learning Objectives"
              helperText="One objective per line"
              value={form.objectivesText}
              onChange={(event) => setForm({ ...form, objectivesText: event.target.value })}
            />

            <TextField
              fullWidth
              required
              type="number"
              label="Chapter Order"
              value={form.order}
              inputProps={{ min: 1, step: 1 }}
              onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving...' : editingChapter ? 'Update Chapter' : 'Create Chapter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification((previous) => ({ ...previous, open: false }))}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification((previous) => ({ ...previous, open: false }))}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageChaptersPage;
