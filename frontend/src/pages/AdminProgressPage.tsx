import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { PeopleAltRounded as PeopleAltRoundedIcon } from '@mui/icons-material';
import { SchoolRounded as SchoolRoundedIcon } from '@mui/icons-material';
import { CheckCircleRounded as CheckCircleRoundedIcon } from '@mui/icons-material';
import { PendingActionsRounded as PendingActionsRoundedIcon } from '@mui/icons-material';
import { SearchRounded as SearchRoundedIcon } from '@mui/icons-material';
import { RefreshRounded as RefreshRoundedIcon } from '@mui/icons-material';
import { ArrowBackRounded as ArrowBackRoundedIcon } from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';

import {
  getAllStudentsProgress,
  type StudentCourseProgress,
  type ProgressStatus,
} from '../api/adminProgressApi';

const STATUS_OPTIONS: ProgressStatus[] = [
  'Not Started',
  'In Progress',
  'Completed',
];

function getStatusColor(
  status: ProgressStatus,
): 'default' | 'warning' | 'success' {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'warning';
    default:
      return 'default';
  }
}

function formatDate(date: string): string {
  if (!date) return '—';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '—';

  return parsedDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminProgressPage() {
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState<StudentCourseProgress[]>([]);
  const [totalEnrollments, setTotalEnrollments] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllStudentsProgress();

      setProgressData(Array.isArray(response.data) ? response.data : []);
      setTotalEnrollments(response.totalEnrollments ?? 0);
    } catch (err: unknown) {
      console.error('Failed to load student progress:', err);

      setError(
        'Unable to load student progress. Check your login, admin permissions, and API connection.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const uniqueStudents = useMemo(
    () => new Set(progressData.map((item) => item.student.id)).size,
    [progressData],
  );

  const completedCount = useMemo(
    () => progressData.filter((item) => item.status === 'Completed').length,
    [progressData],
  );

  const inProgressCount = useMemo(
    () => progressData.filter((item) => item.status === 'In Progress').length,
    [progressData],
  );

  const notStartedCount = useMemo(
    () => progressData.filter((item) => item.status === 'Not Started').length,
    [progressData],
  );

  const courses = useMemo(() => {
    const uniqueCourses = new Map<number, string>();

    progressData.forEach((item) => {
      uniqueCourses.set(item.course.id, item.course.title);
    });

    return Array.from(uniqueCourses, ([id, title]) => ({ id, title }));
  }, [progressData]);

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return progressData.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.student.name.toLowerCase().includes(normalizedSearch) ||
        item.student.email.toLowerCase().includes(normalizedSearch) ||
        item.course.title.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'All' || item.status === statusFilter;

      const matchesCourse =
        courseFilter === 'All' ||
        String(item.course.id) === courseFilter;

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [progressData, search, statusFilter, courseFilter]);

  const statCards = [
    {
      title: 'Total Students',
      value: uniqueStudents,
      icon: <PeopleAltRoundedIcon />,
      color: '#F26A21',
      background: '#FFF1E8',
    },
    {
      title: 'Total Enrollments',
      value: totalEnrollments,
      icon: <SchoolRoundedIcon />,
      color: '#1976D2',
      background: '#E3F2FD',
    },
    {
      title: 'Completed',
      value: completedCount,
      icon: <CheckCircleRoundedIcon />,
      color: '#2E7D32',
      background: '#E8F5E9',
    },
    {
      title: 'In Progress',
      value: inProgressCount,
      icon: <PendingActionsRoundedIcon />,
      color: '#ED8B00',
      background: '#FFF3E0',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 }, bgcolor: '#F7F6F4' }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Student Progress
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Monitor student learning activity and course completion.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate('/admin')}
          >
            Dashboard
          </Button>

          <Button
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => void loadProgress()}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* Error */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadProgress()}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 2,
          mb: 4,
        }}
      >
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            elevation={0}
            sx={{
              border: '1px solid #ECE8E4',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Avatar
                sx={{
                  bgcolor: stat.background,
                  color: stat.color,
                  mb: 2,
                }}
              >
                {stat.icon}
              </Avatar>

              <Typography color="text.secondary">
                {stat.title}
              </Typography>

              <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                {loading ? '—' : stat.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Not Started summary */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid #ECE8E4',
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={1}
        >
          <Typography fontWeight={700}>Not Started</Typography>
          <Chip
            label={loading ? '—' : notStartedCount}
            color="default"
            size="small"
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Enrolled students who have not completed any lessons.
        </Typography>
      </Paper>

      {/* Search and filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid #ECE8E4',
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search student, email or course..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />

          <TextField
            select
            size="small"
            label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: { md: 180 } }}
          >
            <MenuItem value="All">All statuses</MenuItem>
            {STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Filter by course"
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            sx={{ minWidth: { md: 200 } }}
          >
            <MenuItem value="All">All courses</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course.id} value={String(course.id)}>
                {course.title}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Progress table */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #ECE8E4',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800}>
            Student Course Progress
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Showing {filteredData.length} of {progressData.length} enrollments
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 850 }}>
              <TableHead sx={{ bgcolor: '#FAF8F6' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lessons</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>
                    Progress
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Enrolled On</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={`${item.student.id}-${item.course.id}`} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#FFF1E8', color: '#F26A21' }}>
                          {item.student.name?.charAt(0)?.toUpperCase() || 'S'}
                        </Avatar>

                        <Box>
                          <Typography fontWeight={700}>
                            {item.student.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.student.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography fontWeight={600}>
                        {item.course.title}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {item.completedLessons} / {item.totalLessons}
                    </TableCell>

                    <TableCell>
                      <Stack spacing={0.7}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                        >
                          <Typography variant="body2" fontWeight={700}>
                            {item.completionPercentage}%
                          </Typography>
                        </Stack>

                        <LinearProgress
                          variant="determinate"
                          value={Math.min(
                            100,
                            Math.max(0, item.completionPercentage),
                          )}
                          sx={{
                            height: 8,
                            borderRadius: 5,
                            bgcolor: '#ECE8E4',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 5,
                            },
                          }}
                        />
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>{formatDate(item.enrolledAt)}</TableCell>
                  </TableRow>
                ))}

                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography fontWeight={600}>
                        No progress records found.
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Try changing your search or filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}