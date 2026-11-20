
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { Search as SearchIcon } from '@mui/icons-material';
import { SchoolOutlined as SchoolOutlinedIcon } from '@mui/icons-material';
import { MenuBookOutlined as MenuBookOutlinedIcon } from '@mui/icons-material';
import { Refresh as RefreshOutlinedIcon } from '@mui/icons-material';
import { ExploreOutlined as ExploreOutlinedIcon } from '@mui/icons-material';

import {
  getMyEnrollments,
  type Enrollment,
  type EnrolledCourse,
  getApiErrorMessage,
} from '../services/api';

interface MyCoursesPageProps {
  onExploreCourses?: () => void;
}

export default function MyCoursesPage({
  onExploreCourses,
}: MyCoursesPageProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getMyEnrollments();

      if (!Array.isArray(result)) {
        throw new Error('The enrollment API returned an invalid response.');
      }

      setEnrollments(result);
    } catch (err: unknown) {
      setEnrollments([]);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEnrollments();
  }, [loadEnrollments]);

  // Only use courses returned by the backend.
  const courses = useMemo(() => {
    return enrollments
      .map((enrollment) => enrollment?.course)
      .filter(
        (course): course is EnrolledCourse =>
          course != null &&
          typeof course.id === 'number' &&
          typeof course.title === 'string',
      );
  }, [enrollments]);

  const categories = useMemo(() => {
    const values = courses
      .map((course) => course.category?.trim())
      .filter((category): category is string => Boolean(category));

    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !normalizedSearch ||
        course.title.toLowerCase().includes(normalizedSearch) ||
        (course.description ?? '').toLowerCase().includes(normalizedSearch) ||
        (course.instructor ?? '').toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        selectedCategory === 'all' ||
        course.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, selectedCategory]);

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
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
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            My Courses
          </Typography>
          <Typography color="text.secondary">
            Continue learning with the courses you have enrolled in.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => void loadEnrollments()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <TextField
          fullWidth
          placeholder="Search your courses..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          label="Category"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 210 } }}
        >
          <MenuItem value="all">All categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {!loading && !error && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {filteredCourses.length} course
          {filteredCourses.length === 1 ? '' : 's'} found
        </Typography>
      )}

      {loading && (
        <Stack spacing={2} sx={{ py: 10, alignItems: 'center' }}>
          <CircularProgress />
          <Typography color="text.secondary">
            Loading your courses...
          </Typography>
        </Stack>
      )}

      {!loading && error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void loadEnrollments()}>
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          Unable to load your courses: {error}
        </Alert>
      )}

      {!loading && !error && courses.length === 0 && (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 8, px: 3 }}>
            <SchoolOutlinedIcon
              sx={{ fontSize: 56, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              You haven't enrolled in any courses yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Explore the course catalog and enroll in a course to see it here.
            </Typography>
            <Button
              variant="contained"
              startIcon={<ExploreOutlinedIcon />}
              onClick={onExploreCourses}
              disabled={!onExploreCourses}
            >
              Explore courses
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading &&
        !error &&
        courses.length > 0 &&
        filteredCourses.length === 0 && (
          <Alert severity="info">
            No enrolled courses match your search or selected category.
          </Alert>
        )}

      {!loading && !error && filteredCourses.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 3,
          }}
        >
          {filteredCourses.map((course) => {
            const enrollment = enrollments.find(
              (item) => item?.course?.id === course.id,
            );

            return (
              <Card
                key={course.id}
                variant="outlined"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: 3,
                  },
                }}
              >
                <Box
                  sx={{
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                  }}
                >
                  <MenuBookOutlinedIcon
                    sx={{ fontSize: 48, color: 'primary.main' }}
                  />
                </Box>

                <CardContent
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    gap: 1.5,
                  }}
                >
                  {course.category && (
                    <Box>
                      <Chip
                        label={course.category}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  )}

                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {course.title}
                  </Typography>

                  {course.instructor && (
                    <Typography variant="body2" color="text.secondary">
                      By {course.instructor}
                    </Typography>
                  )}

                  {course.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {course.description}
                    </Typography>
                  )}

                  {enrollment?.enrolledAt && (
                    <Typography variant="caption" color="text.secondary">
                      Enrolled on{' '}
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </Typography>
                  )}

                  <Box sx={{ flexGrow: 1 }} />

                  <Button variant="contained" fullWidth disabled>
                    Enrolled
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
