
import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material';

import { MenuBookRounded as MenuBookRoundedIcon } from '@mui/icons-material';
import { AddRounded as AddRoundedIcon } from '@mui/icons-material';
import { SearchRounded as SearchRoundedIcon } from '@mui/icons-material';
import { RefreshRounded as RefreshRoundedIcon } from '@mui/icons-material';
import { EditRounded as EditRoundedIcon } from '@mui/icons-material';
import { DeleteOutlineRounded as DeleteOutlineRoundedIcon } from '@mui/icons-material';
import { ArrowBackRounded as ArrowBackRoundedIcon } from '@mui/icons-material';
import { AutoAwesomeRounded as AutoAwesomeRoundedIcon } from '@mui/icons-material';
import { VisibilityRounded as VisibilityRoundedIcon } from '@mui/icons-material';
import { ExpandMoreRounded as ExpandMoreRoundedIcon } from '@mui/icons-material';
import { SaveRounded as SaveRoundedIcon } from '@mui/icons-material';
import { CloseRounded as CloseRoundedIcon } from '@mui/icons-material';

import api from '../api/axios';
import {
  generateAndSaveLessonContent,
  type LessonAiContent,
} from '../api/aiCourseApi';

import { Link as RouterLink } from 'react-router-dom';

import {
  createCourse,
  deleteCourse,
  getCourses,
  updateCourse,
  type Course,
  type CreateCourseData,
} from '../api/courseApi';

// Theme
const theme = createTheme({
  palette: {
    primary: { main: '#6256E8' },
    background: {
      default: '#F7F8FC',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
  },
});

// Empty course form
const emptyForm: CreateCourseData = {
  title: '',
  description: '',
  instructor: '',
  category: '',
  status: 'draft',
};

// Course categories
const categories = [
  'Frontend',
  'Backend',
  'Full Stack',
  'Database',
  'AI/ML',
  'Data Science',
  'DevOps',
  'Other',
];

// Error handler
function getErrorMessage(error: unknown): string {
  const apiError = error as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
    message?: string;
  };

  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return (
    message ||
    apiError.message ||
    'Something went wrong. Please try again.'
  );
}

// Status color
function getStatusColor(
  status: Course['status'],
): 'success' | 'warning' | 'default' {
  switch (status) {
    case 'published':
      return 'success';

    case 'draft':
      return 'warning';

    default:
      return 'default';
  }
}


interface CurriculumLesson {
  id: number;
  title: string;
  content?: string | null;
  aiContent?: LessonAiContent | null;
  order: number;
}

interface CurriculumChapter {
  id: number;
  title: string;
  description?: string | null;
  learningObjectives?: string[];
  order: number;
  lessons: CurriculumLesson[];
}

interface CourseWithCurriculum extends Course {
  chapters: CurriculumChapter[];
}

function unwrapApiData<T>(value: unknown): T {
  if (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    (value as { data?: unknown }).data !== undefined
  ) {
    return (value as { data: T }).data;
  }

  return value as T;
}

function renderContentText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return JSON.stringify(value, null, 2);
}

interface BulkGenerationState {
  running: boolean;
  total: number;
  processed: number;
  saved: number;
  skipped: number;
  failed: number;
  currentLesson: string;
}

const initialBulkGenerationState: BulkGenerationState = {
  running: false,
  total: 0,
  processed: 0,
  saved: 0,
  skipped: 0,
  failed: 0,
  currentLesson: '',
};

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CreateCourseData>(emptyForm);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Course curriculum and AI lesson-content editor
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [curriculumCourse, setCurriculumCourse] =
    useState<CourseWithCurriculum | null>(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState('');
  const [lessonContents, setLessonContents] =
    useState<Record<number, LessonAiContent>>({});
  const [generatingLessonIds, setGeneratingLessonIds] =
    useState<Record<number, boolean>>({});
  const [savingLessonIds, setSavingLessonIds] =
    useState<Record<number, boolean>>({});
  const [lessonActionMessage, setLessonActionMessage] = useState('');
  const [bulkGeneration, setBulkGeneration] = useState<BulkGenerationState>(
    initialBulkGenerationState,
  );
  const [failedBulkLessonIds, setFailedBulkLessonIds] = useState<number[]>([]);



  // Load courses
  const loadCourses = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const response = await getCourses({
        page: 1,
        limit: 100,
        search,
        category: categoryFilter === 'All' ? '' : categoryFilter,
        sortBy: 'createdAt',
        order: 'DESC',
      });

      setCourses(response.data);
      setTotal(response.total);
    } catch (error: unknown) {
      console.error('Failed to load courses:', error);
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  // Open create dialog
  const openCreateDialog = () => {
    setEditingCourse(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  // Open edit dialog
  const openEditDialog = (course: Course) => {
    setEditingCourse(course);

    setForm({
      title: course.title ?? '',
      description: course.description ?? '',
      instructor: course.instructor ?? '',
      category: course.category ?? '',
      status: course.status ?? 'draft',
    });

    setFormError('');
    setDialogOpen(true);
  };

  // Close dialog
  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingCourse(null);
    setForm(emptyForm);
    setFormError('');
  };

  // Create or update course
  const handleSaveCourse = async () => {
    setFormError('');
    setSuccessMessage('');

    const payload: CreateCourseData = {
      title: form.title.trim(),
      description: form.description.trim(),
      instructor: form.instructor.trim(),
      category: form.category.trim(),
      status: form.status,
    };

    if (
      !payload.title ||
      !payload.description ||
      !payload.instructor ||
      !payload.category
    ) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSaving(true);

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        setSuccessMessage('Course updated successfully.');
      } else {
        await createCourse(payload);
        setSuccessMessage('Course created successfully.');
      }

      setDialogOpen(false);
      setEditingCourse(null);
      setForm(emptyForm);

      await loadCourses();
    } catch (error: unknown) {
      console.error('Failed to save course:', error);
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  // Delete course
  const handleDeleteCourse = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setPageError('');
    setSuccessMessage('');

    try {
      await deleteCourse(deleteTarget.id);

      setDeleteTarget(null);
      setSuccessMessage('Course deleted successfully.');

      await loadCourses();
    } catch (error: unknown) {
      console.error('Failed to delete course:', error);
      setPageError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // Open the curriculum editor for a course.
  const openCurriculum = async (course: Course) => {
    setCurriculumOpen(true);
    setCurriculumLoading(true);
    setCurriculumError('');
    setLessonActionMessage('');
    setCurriculumCourse(null);
    setLessonContents({});
    setGeneratingLessonIds({});
    setSavingLessonIds({});

    try {
      const response = await api.get(`/courses/${course.id}`);
      const loadedCourse = unwrapApiData<CourseWithCurriculum>(response.data);

      setCurriculumCourse({
        ...loadedCourse,
        chapters: Array.isArray(loadedCourse.chapters)
          ? [...loadedCourse.chapters]
              .sort((a, b) => a.order - b.order)
              .map((chapter) => ({
                ...chapter,
                lessons: Array.isArray(chapter.lessons)
                  ? [...chapter.lessons].sort((a, b) => a.order - b.order)
                  : [],
              }))
          : [],
      });
    } catch (error: unknown) {
      console.error('Failed to load course curriculum:', error);
      setCurriculumError(getErrorMessage(error));
    } finally {
      setCurriculumLoading(false);
    }
  };

  const closeCurriculum = () => {
    if (bulkGeneration.running) return;
    setCurriculumOpen(false);
    setCurriculumCourse(null);
    setCurriculumError('');
    setLessonActionMessage('');
  };

  const handleGenerateLessonContent = async (lesson: CurriculumLesson) => {
    if (!curriculumCourse) return;

    setCurriculumError('');
    setLessonActionMessage('');
    setGeneratingLessonIds((previous) => ({
      ...previous,
      [lesson.id]: true,
    }));

    try {
      const response = await api.post(
        `/ai-course/generate-lesson-content/${lesson.id}`,
        {
          additionalInstructions:
            'Explain this topic for beginner students. Include detailed theory, practical real-world examples, code examples wherever relevant, and hands-on exercises. Explain concepts step by step.',
        },
      );

      const content = unwrapApiData<LessonAiContent>(response.data);

      if (!content || typeof content !== 'object') {
        throw new Error('The AI service returned an invalid lesson content response.');
      }

      setLessonContents((previous) => ({
        ...previous,
        [lesson.id]: content,
      }));
      setLessonActionMessage(
        `Content generated for "${lesson.title}". Review it and save it when ready.`,
      );
    } catch (error: unknown) {
      console.error('Failed to generate lesson content:', error);
      setCurriculumError(getErrorMessage(error));
    } finally {
      setGeneratingLessonIds((previous) => ({
        ...previous,
        [lesson.id]: false,
      }));
    }
  };

  const handleSaveLessonContent = async (lesson: CurriculumLesson) => {
    if (!curriculumCourse) return;

    const content = lessonContents[lesson.id] ?? lesson.aiContent;
    if (!content) {
      setCurriculumError('Generate lesson content before saving.');
      return;
    }

    setCurriculumError('');
    setLessonActionMessage('');
    setSavingLessonIds((previous) => ({
      ...previous,
      [lesson.id]: true,
    }));

    try {
      await api.post(
        `/ai-course/save-lesson-content/${lesson.id}`,
        content,
      );

      setCurriculumCourse((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          chapters: previous.chapters.map((chapter) => ({
            ...chapter,
            lessons: chapter.lessons.map((item) =>
              item.id === lesson.id
                ? { ...item, aiContent: content }
                : item,
            ),
          })),
        };
      });

      setLessonContents((previous) => ({
        ...previous,
        [lesson.id]: content,
      }));
      setLessonActionMessage(`AI content saved for "${lesson.title}".`);
    } catch (error: unknown) {
      console.error('Failed to save lesson content:', error);
      setCurriculumError(getErrorMessage(error));
    } finally {
      setSavingLessonIds((previous) => ({
        ...previous,
        [lesson.id]: false,
      }));
    }
  };

  // Generate and save all lesson content sequentially.
  // Existing saved lessons are skipped; failed lessons can be retried separately.
  const handleGenerateAllLessonContent = async (retryLessonIds?: number[]) => {
    if (!curriculumCourse || bulkGeneration.running) return;

    const allLessons = curriculumCourse.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        ...lesson,
        chapterTitle: chapter.title,
      })),
    );

    const retrySet = retryLessonIds ? new Set(retryLessonIds) : null;
    const lessonsToProcess = retrySet
      ? allLessons.filter((lesson) => retrySet.has(lesson.id))
      : allLessons;

    if (lessonsToProcess.length === 0) {
      setLessonActionMessage('There are no lessons to generate.');
      return;
    }

    const pendingLessons = retrySet
      ? lessonsToProcess
      : lessonsToProcess.filter((lesson) => !lesson.aiContent);

    const skippedInitially = lessonsToProcess.length - pendingLessons.length;

    if (pendingLessons.length === 0) {
      setLessonActionMessage('All lessons already have saved AI content.');
      setFailedBulkLessonIds([]);
      return;
    }

    let processed = skippedInitially;
    let saved = 0;
    let skipped = skippedInitially;
    let failed = 0;
    const failedIds: number[] = [];

    setCurriculumError('');
    setLessonActionMessage('');
    setBulkGeneration({
      running: true,
      total: lessonsToProcess.length,
      processed,
      saved,
      skipped,
      failed,
      currentLesson: '',
    });

    for (const lesson of pendingLessons) {
      setBulkGeneration((previous) => ({
        ...previous,
        currentLesson: lesson.title,
      }));

      try {
        const content = await generateAndSaveLessonContent(lesson.id, {
          additionalInstructions:
            'Explain this topic for beginner students. Include detailed theory, practical real-world examples, code examples wherever relevant, and hands-on exercises. Explain concepts step by step.',
        });

        setCurriculumCourse((previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            chapters: previous.chapters.map((chapter) => ({
              ...chapter,
              lessons: chapter.lessons.map((item) =>
                item.id === lesson.id ? { ...item, aiContent: content } : item,
              ),
            })),
          };
        });

        setLessonContents((previous) => ({
          ...previous,
          [lesson.id]: content,
        }));

        saved += 1;
      } catch (error: unknown) {
        console.error(`Bulk AI generation failed for lesson ${lesson.id}:`, error);
        failed += 1;
        failedIds.push(lesson.id);
      } finally {
        processed += 1;
        setBulkGeneration({
          running: true,
          total: lessonsToProcess.length,
          processed,
          saved,
          skipped,
          failed,
          currentLesson: lesson.title,
        });
      }
    }

    setFailedBulkLessonIds(failedIds);
    setBulkGeneration({
      running: false,
      total: lessonsToProcess.length,
      processed,
      saved,
      skipped,
      failed,
      currentLesson: '',
    });

    if (failedIds.length > 0) {
      setLessonActionMessage(
        `Bulk generation finished: ${saved} saved, ${skipped} skipped, ${failed} failed. You can retry the failed lessons.`,
      );
    } else {
      setLessonActionMessage(
        `Bulk generation completed: ${saved} lessons saved${skipped ? `, ${skipped} already saved and skipped` : ''}.`,
      );
    }
  };

  // Search
  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          p: { xs: 2, md: 4 },
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3,
          }}
        >
          <Box>
            <Button
              component={RouterLink}
              to="/admin"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{ mb: 1, textTransform: 'none' }}
            >
              Back to Admin Dashboard
            </Button>

            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Manage Courses
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Create, update, and manage courses in LearnLoop AI.
            </Typography>
          </Box>

          {/* Header Actions */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
          >
            <Tooltip title="Generate a course curriculum using AI">
              <Button
                component={RouterLink}
                to="/admin/ai-course-creator"
                variant="outlined"
                color="primary"
                startIcon={<AutoAwesomeRoundedIcon />}
                sx={{
                  minHeight: 48,
                  px: 3,
                  fontWeight: 700,
                }}
              >
                AI Course Creator
              </Button>
            </Tooltip>

            <Tooltip title="Refresh courses">
              <span>
                <IconButton
                  onClick={() => void loadCourses()}
                  disabled={loading}
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #ECECF3',
                    minHeight: 48,
                    minWidth: 48,
                  }}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={openCreateDialog}
              sx={{
                minHeight: 48,
                px: 3,
                fontWeight: 700,
              }}
            >
              Add Course
            </Button>
          </Stack>
        </Stack>

        {/* Notifications */}
        {pageError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setPageError('')}
          >
            {pageError}
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccessMessage('')}
          >
            {successMessage}
          </Alert>
        )}

        {/* Course Count */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid #ECECF3',
          }}
        >
          <CardContent>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: 'center' }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#EEECFF',
                  color: 'primary.main',
                }}
              >
                <MenuBookRoundedIcon />
              </Avatar>

              <Box>
                <Typography color="text.secondary">
                  Courses matching your filters
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {loading ? '—' : total}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid #ECECF3',
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Course Directory
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ mb: 2 }}
            >
              Search and browse courses in LearnLoop AI.
            </Typography>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
            >
              <TextField
                fullWidth
                label="Search courses"
                placeholder="Search by title or description"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl
                sx={{ minWidth: { xs: '100%', md: 190 } }}
              >
                <InputLabel id="category-filter-label">
                  Category
                </InputLabel>

                <Select
                  labelId="category-filter-label"
                  label="Category"
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value)
                  }
                >
                  <MenuItem value="All">All categories</MenuItem>

                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                onClick={handleSearch}
                startIcon={<SearchRoundedIcon />}
                sx={{ minWidth: 110 }}
              >
                Search
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Course List Heading */}
        <Stack
          direction="row"
          sx={{
            mb: 2,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            All Courses
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {courses.length} displayed
          </Typography>
        </Stack>

        {/* Course List */}
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : courses.length === 0 ? (
          <Card
            elevation={0}
            sx={{ border: '1px solid #ECECF3' }}
          >
            <CardContent sx={{ textAlign: 'center', py: 7 }}>
              <MenuBookRoundedIcon
                sx={{
                  fontSize: 52,
                  color: 'text.secondary',
                  mb: 1,
                }}
              />

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No courses found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 1, mb: 3 }}
              >
                Add a course or change your search filters.
              </Typography>

              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={openCreateDialog}
              >
                Add Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {courses.map((course) => (
              <Card
                key={course.id}
                elevation={0}
                sx={{
                  border: '1px solid #ECECF3',
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow:
                      '0 5px 20px rgba(30, 30, 70, 0.06)',
                  },
                }}
              >
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    sx={{
                      alignItems: {
                        xs: 'stretch',
                        sm: 'center',
                      },
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        width: 52,
                        height: 52,
                        bgcolor: '#EEECFF',
                        color: 'primary.main',
                      }}
                    >
                      <MenuBookRoundedIcon />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700 }}
                      >
                        {course.title}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{
                          mt: 0.5,
                          mb: 1,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {course.description}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{ flexWrap: 'wrap' }}
                      >
                        <Chip
                          label={course.category || 'Uncategorized'}
                          size="small"
                        />

                        <Chip
                          label={course.status}
                          color={getStatusColor(course.status)}
                          size="small"
                        />

                        <Chip
                          label={`Instructor: ${course.instructor || 'Not assigned'}`}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View chapters, lessons and AI content">
                        <IconButton
                          color="success"
                          onClick={() => void openCurriculum(course)}
                          aria-label={`View curriculum for ${course.title}`}
                        >
                          <VisibilityRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit course">
                        <IconButton
                          color="primary"
                          onClick={() => openEditDialog(course)}
                          aria-label={`Edit ${course.title}`}
                        >
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete course">
                        <IconButton
                          color="error"
                          onClick={() => setDeleteTarget(course)}
                          aria-label={`Delete ${course.title}`}
                        >
                          <DeleteOutlineRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Create/Edit Course Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingCourse ? 'Edit Course' : 'Create New Course'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}

            <TextField
              label="Course title"
              required
              fullWidth
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              inputProps={{ maxLength: 150 }}
            />

            <TextField
              label="Description"
              required
              fullWidth
              multiline
              minRows={3}
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
            />

            <TextField
              label="Instructor"
              required
              fullWidth
              value={form.instructor}
              onChange={(event) =>
                setForm({
                  ...form,
                  instructor: event.target.value,
                })
              }
            />

            <FormControl fullWidth required>
              <InputLabel id="course-category-label">
                Category
              </InputLabel>

              <Select
                labelId="course-category-label"
                label="Category"
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value,
                  })
                }
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="course-status-label">
                Status
              </InputLabel>

              <Select
                labelId="course-status-label"
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as CreateCourseData['status'],
                  })
                }
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
            color="inherit"
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => void handleSaveCourse()}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AddRoundedIcon />
              )
            }
          >
            {saving
              ? 'Saving...'
              : editingCourse
                ? 'Save Changes'
                : 'Create Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Curriculum and AI Lesson Content Dialog */}
      <Dialog
        open={curriculumOpen}
        onClose={closeCurriculum}
        fullWidth
        maxWidth="lg"
        scroll="paper"
      >
        <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
          {curriculumCourse?.title ?? 'Course Curriculum'}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View chapters, inspect lessons, and generate or save detailed AI lesson content.
          </Typography>
          <IconButton
            disabled={bulkGeneration.running}
            onClick={closeCurriculum}
            aria-label="Close curriculum"
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {curriculumLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : curriculumError ? (
            <Alert severity="error">{curriculumError}</Alert>
          ) : !curriculumCourse ? (
            <Alert severity="info">Course information is not available.</Alert>
          ) : curriculumCourse.chapters.length === 0 ? (
            <Alert severity="info">
              No chapters were returned for this course. Check that the backend
              GET /courses/:id endpoint loads the chapters and their lessons.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {lessonActionMessage && (
                <Alert severity="success" onClose={() => setLessonActionMessage('')}>
                  {lessonActionMessage}
                </Alert>
              )}

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={`${curriculumCourse.chapters.length} chapters`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`${curriculumCourse.chapters.reduce(
                    (totalCount, chapter) => totalCount + chapter.lessons.length,
                    0,
                  )} lessons`}
                  variant="outlined"
                />
              </Stack>

              {/* Bulk AI lesson generation */}
              <Card
                variant="outlined"
                sx={{
                  borderColor: '#DED9FF',
                  bgcolor: '#FBFAFF',
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box>
                        <Typography fontWeight={800}>
                          Generate all lesson content
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Generate and save content for every lesson in this course.
                          Existing saved lessons are skipped.
                        </Typography>
                      </Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        {failedBulkLessonIds.length > 0 && !bulkGeneration.running && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="warning"
                            onClick={() =>
                              void handleGenerateAllLessonContent(failedBulkLessonIds)
                            }
                          >
                            Retry failed ({failedBulkLessonIds.length})
                          </Button>
                        )}
                        <Button
                          variant="contained"
                          startIcon={
                            bulkGeneration.running ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <AutoAwesomeRoundedIcon />
                            )
                          }
                          disabled={bulkGeneration.running}
                          onClick={() => void handleGenerateAllLessonContent()}
                        >
                          {bulkGeneration.running
                            ? 'Generating lessons...'
                            : 'Generate All Lessons'}
                        </Button>
                      </Stack>
                    </Stack>

                    {(bulkGeneration.running || bulkGeneration.total > 0) && (
                      <Box>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.75 }}
                        >
                          <Typography variant="body2" fontWeight={700}>
                            {bulkGeneration.processed} / {bulkGeneration.total} processed
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bulkGeneration.total > 0
                              ? Math.round(
                                  (bulkGeneration.processed / bulkGeneration.total) * 100,
                                )
                              : 0}%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={
                            bulkGeneration.total > 0
                              ? (bulkGeneration.processed / bulkGeneration.total) * 100
                              : 0
                          }
                          sx={{ height: 8, borderRadius: 5 }}
                        />
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ mt: 1 }}
                        >
                          <Chip size="small" color="success" label={`${bulkGeneration.saved} saved`} />
                          <Chip size="small" label={`${bulkGeneration.skipped} skipped`} />
                          <Chip
                            size="small"
                            color={bulkGeneration.failed ? 'error' : 'default'}
                            label={`${bulkGeneration.failed} failed`}
                          />
                        </Stack>
                        {bulkGeneration.running && bulkGeneration.currentLesson && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 1 }}
                          >
                            Currently processing: {bulkGeneration.currentLesson}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {curriculumCourse.chapters.map((chapter, chapterIndex) => (
                <Accordion key={chapter.id} defaultExpanded={chapterIndex === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800}>
                        Chapter {chapter.order}: {chapter.title}
                      </Typography>
                      {chapter.description && (
                        <Typography variant="body2" color="text.secondary">
                          {chapter.description}
                        </Typography>
                      )}
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails>
                    {Array.isArray(chapter.learningObjectives) &&
                      chapter.learningObjectives.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography fontWeight={700} variant="body2" gutterBottom>
                            Learning objectives
                          </Typography>
                          {chapter.learningObjectives.map((objective, index) => (
                            <Typography
                              key={`${chapter.id}-objective-${index}`}
                              variant="body2"
                              color="text.secondary"
                            >
                              • {objective}
                            </Typography>
                          ))}
                        </Box>
                      )}

                    {chapter.lessons.length === 0 ? (
                      <Alert severity="info">
                        No lessons have been added to this chapter.
                      </Alert>
                    ) : (
                      <Stack spacing={2}>
                        {chapter.lessons.map((lesson) => {
                          const currentContent =
                            lessonContents[lesson.id] ?? lesson.aiContent ?? null;
                          const isGenerating =
                            Boolean(generatingLessonIds[lesson.id]);
                          const isSaving = Boolean(savingLessonIds[lesson.id]);
                          const isSaved = Boolean(lesson.aiContent);

                          return (
                            <Card key={lesson.id} variant="outlined">
                              <CardContent>
                                <Stack spacing={1.5}>
                                  <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    justifyContent="space-between"
                                    alignItems={{ xs: 'stretch', sm: 'center' }}
                                    spacing={1}
                                  >
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography fontWeight={700}>
                                        Lesson {lesson.order}: {lesson.title}
                                      </Typography>
                                      {lesson.content && (
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                                        >
                                          {lesson.content}
                                        </Typography>
                                      )}
                                    </Box>

                                    <Chip
                                      size="small"
                                      color={isSaved ? 'success' : currentContent ? 'info' : 'warning'}
                                      label={
                                        isSaved
                                          ? 'AI content saved'
                                          : currentContent
                                            ? 'Generated – not saved'
                                            : 'Content not generated'
                                      }
                                    />
                                  </Stack>

                                  <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={1}
                                  >
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={
                                        isGenerating ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <AutoAwesomeRoundedIcon />
                                        )
                                      }
                                      disabled={isGenerating || isSaving}
                                      onClick={() => void handleGenerateLessonContent(lesson)}
                                    >
                                      {currentContent ? 'Regenerate Content' : 'Generate Content'}
                                    </Button>

                                    <Button
                                      size="small"
                                      variant="contained"
                                      startIcon={
                                        isSaving ? (
                                          <CircularProgress size={16} color="inherit" />
                                        ) : (
                                          <SaveRoundedIcon />
                                        )
                                      }
                                      disabled={!currentContent || isSaving || isGenerating}
                                      onClick={() => void handleSaveLessonContent(lesson)}
                                    >
                                      {isSaving ? 'Saving...' : 'Save Content'}
                                    </Button>
                                  </Stack>

                                  {currentContent && (
                                    <Box
                                      sx={{
                                        mt: 1,
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: '#F8F9FD',
                                        border: '1px solid #ECECF3',
                                      }}
                                    >
                                      <Typography fontWeight={800} gutterBottom>
                                        AI-generated lesson content preview
                                      </Typography>

                                      {currentContent.learningObjectives &&
                                        currentContent.learningObjectives.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography fontWeight={700} variant="subtitle2">
                                              Learning objectives
                                            </Typography>
                                            {currentContent.learningObjectives.map((item, index) => (
                                              <Typography key={index} variant="body2">
                                                {index + 1}. {item}
                                              </Typography>
                                            ))}
                                          </Box>
                                        )}

                                      {currentContent.theory && (
                                        <Box sx={{ mb: 2 }}>
                                          <Typography fontWeight={700} variant="subtitle2">
                                            Theory
                                          </Typography>
                                          <Typography
                                            variant="body2"
                                            sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
                                          >
                                            {currentContent.theory}
                                          </Typography>
                                        </Box>
                                      )}

                                      {currentContent.practicalExamples &&
                                        currentContent.practicalExamples.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography fontWeight={700} variant="subtitle2">
                                              Practical examples
                                            </Typography>
                                            {currentContent.practicalExamples.map((example, index) => (
                                              <Box key={index} sx={{ mt: 1 }}>
                                                <Typography fontWeight={600} variant="body2">
                                                  {index + 1}. {example.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                  {example.explanation}
                                                </Typography>
                                                {example.code && (
                                                  <Box
                                                    component="pre"
                                                    sx={{
                                                      mt: 1,
                                                      p: 1.5,
                                                      overflowX: 'auto',
                                                      borderRadius: 1,
                                                      bgcolor: '#202238',
                                                      color: '#F7F8FC',
                                                      fontSize: 12,
                                                    }}
                                                  >
                                                    {example.code}
                                                  </Box>
                                                )}
                                              </Box>
                                            ))}
                                          </Box>
                                        )}

                                      {currentContent.exercises &&
                                        currentContent.exercises.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography fontWeight={700} variant="subtitle2">
                                              Hands-on exercises
                                            </Typography>
                                            {currentContent.exercises.map((exercise, index) => (
                                              <Box key={index} sx={{ mt: 1 }}>
                                                <Typography fontWeight={600} variant="body2">
                                                  {index + 1}. {exercise.title}
                                                  {exercise.difficulty ? ` (${exercise.difficulty})` : ''}
                                                </Typography>
                                                <Typography variant="body2">
                                                  {exercise.description}
                                                </Typography>
                                                {exercise.expectedOutcome && (
                                                  <Typography variant="body2" color="text.secondary">
                                                    Expected outcome: {exercise.expectedOutcome}
                                                  </Typography>
                                                )}
                                              </Box>
                                            ))}
                                          </Box>
                                        )}

                                      {currentContent.keyTakeaways &&
                                        currentContent.keyTakeaways.length > 0 && (
                                          <Box sx={{ mb: 2 }}>
                                            <Typography fontWeight={700} variant="subtitle2">
                                              Key takeaways
                                            </Typography>
                                            {currentContent.keyTakeaways.map((item, index) => (
                                              <Typography key={index} variant="body2">
                                                • {item}
                                              </Typography>
                                            ))}
                                          </Box>
                                        )}

                                      {currentContent.knowledgeCheck &&
                                        currentContent.knowledgeCheck.length > 0 && (
                                          <Box>
                                            <Typography fontWeight={700} variant="subtitle2">
                                              Knowledge check
                                            </Typography>
                                            {currentContent.knowledgeCheck.map((item, index) => (
                                              <Box key={index} sx={{ mt: 1 }}>
                                                <Typography fontWeight={600} variant="body2">
                                                  {index + 1}. {item.question}
                                                </Typography>
                                                {item.options?.map((option, optionIndex) => (
                                                  <Typography key={optionIndex} variant="body2" sx={{ pl: 2 }}>
                                                    {String.fromCharCode(65 + optionIndex)}. {option}
                                                  </Typography>
                                                ))}
                                                {item.correctAnswer && (
                                                  <Typography variant="body2" color="success.main">
                                                    Correct answer: {item.correctAnswer}
                                                  </Typography>
                                                )}
                                                {item.explanation && (
                                                  <Typography variant="body2" color="text.secondary">
                                                    {item.explanation}
                                                  </Typography>
                                                )}
                                              </Box>
                                            ))}
                                          </Box>
                                        )}

                                      {!currentContent.theory &&
                                        !currentContent.learningObjectives?.length &&
                                        !currentContent.practicalExamples?.length &&
                                        !currentContent.exercises?.length &&
                                        !currentContent.keyTakeaways?.length &&
                                        !currentContent.knowledgeCheck?.length && (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ whiteSpace: 'pre-wrap' }}
                                          >
                                            {renderContentText(currentContent)}
                                          </Typography>
                                        )}
                                    </Box>
                                  )}
                                </Stack>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCurriculum} color="inherit" disabled={bulkGeneration.running}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Delete Course?
        </DialogTitle>

        <DialogContent>
          Are you sure you want to delete{' '}
          <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            color="inherit"
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDeleteCourse()}
            disabled={deleting}
            startIcon={
              deleting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteOutlineRoundedIcon />
              )
            }
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
