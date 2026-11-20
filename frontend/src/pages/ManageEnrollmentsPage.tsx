
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { Search as SearchIcon } from '@mui/icons-material';
import { SchoolOutlined as SchoolOutlinedIcon } from '@mui/icons-material';
import { PeopleAltOutlined as PeopleAltOutlinedIcon } from '@mui/icons-material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

import { getAllEnrollments } from '../api/enrollmentApi';
import type { Enrollment } from '../api/enrollmentApi';

export default function ManageEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch live enrollment data from the backend.
  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAllEnrollments();
      setEnrollments(data);
      setPage(0);
    } catch (err: unknown) {
      console.error('Failed to fetch enrollments:', err);
      setError(
        'Unable to load enrollments. Please check your login and try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEnrollments();
  }, [fetchEnrollments]);

  // Get distinct categories from actual enrollment data.
  const categories = useMemo(() => {
    return [
      ...new Set(
        enrollments
          .map((enrollment) => enrollment.course?.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [enrollments]);

  // Apply search and category filters together.
  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrollments.filter((enrollment) => {
      const searchableValues = [
        enrollment.student?.name,
        enrollment.student?.email,
        enrollment.course?.title,
        enrollment.course?.category,
        enrollment.course?.instructor,
        String(enrollment.id),
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value ?? '').toLowerCase().includes(query),
        );

      const matchesCategory =
        categoryFilter === 'all' ||
        enrollment.course?.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [enrollments, search, categoryFilter]);

  // Keep the current page valid when the result count changes.
  useEffect(() => {
    const lastPage = Math.max(
      0,
      Math.ceil(filteredEnrollments.length / rowsPerPage) - 1,
    );

    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [filteredEnrollments.length, page, rowsPerPage]);

  const paginatedEnrollments = useMemo(() => {
    const startIndex = page * rowsPerPage;

    return filteredEnrollments.slice(
      startIndex,
      startIndex + rowsPerPage,
    );
  }, [filteredEnrollments, page, rowsPerPage]);

  // Count distinct courses represented in the enrollments.
  const uniqueCourseCount = useMemo(() => {
    return new Set(
      enrollments
        .map((enrollment) => enrollment.course?.id)
        .filter((id) => id != null),
    ).size;
  }, [enrollments]);

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const hasActiveFilters =
    search.trim().length > 0 || categoryFilter !== 'all';

  const emptyMessage = hasActiveFilters
    ? 'No matching enrollments'
    : 'No enrollments yet';

  const emptyDescription = hasActiveFilters
    ? 'Try changing your search or selecting a different category.'
    : 'Enrollments will appear here when students register for courses.';

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: 'auto' }}>
      {/* Page heading */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Manage Enrollments
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            View student course registrations in LearnLoop AI.
          </Typography>
        </Box>

        <Chip
          icon={<SchoolOutlinedIcon />}
          label={`${enrollments.length} Total Enrollments`}
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 600, py: 2.2 }}
        />
      </Box>

      {/* Statistics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleAltOutlinedIcon color="primary" sx={{ fontSize: 36 }} />

            <Box>
              <Typography color="text.secondary" variant="body2">
                Total Enrollments
              </Typography>

              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {enrollments.length}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolOutlinedIcon color="primary" sx={{ fontSize: 36 }} />

            <Box>
              <Typography color="text.secondary" variant="body2">
                Courses Enrolled
              </Typography>

              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {uniqueCourseCount}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Enrollment table */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {/* Toolbar */}
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              All Enrollments
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {loading
                ? 'Loading records...'
                : `${filteredEnrollments.length} records found`}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <TextField
              size="small"
              placeholder="Search student or course..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: '100%', sm: 250 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl
              size="small"
              sx={{ minWidth: 145, flex: { xs: 1, sm: 'initial' } }}
            >
              <InputLabel id="enrollment-category-label">
                Category
              </InputLabel>

              <Select
                labelId="enrollment-category-label"
                value={categoryFilter}
                label="Category"
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="all">All categories</MenuItem>

                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title="Fetch the latest enrollment data">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => void fetchEnrollments()}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Error state */}
        {error && (
          <Alert
            severity="error"
            sx={{ mx: 2.5, mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void fetchEnrollments()}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Loading state */}
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 8,
              gap: 2,
            }}
          >
            <CircularProgress size={28} />

            <Typography color="text.secondary">
              Loading enrollments...
            </Typography>
          </Box>
        ) : error ? null : filteredEnrollments.length === 0 ? (
          /* Empty state */
          <Box sx={{ py: 8, textAlign: 'center', px: 2 }}>
            <SchoolOutlinedIcon
              sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
            />

            <Typography variant="h6">{emptyMessage}</Typography>

            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {emptyDescription}
            </Typography>

            {hasActiveFilters && (
              <Button
                sx={{ mt: 2 }}
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                  setPage(0);
                }}
              >
                Clear filters
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Course Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Enrolled On
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} hover>
                      <TableCell>#{enrollment.id}</TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {enrollment.student?.name || 'Unknown student'}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {enrollment.student?.email || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {enrollment.course?.title || 'Unknown course'}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {enrollment.course?.instructor || ''}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {enrollment.course?.category || '—'}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={enrollment.course?.status || 'Unknown'}
                          color={
                            enrollment.course?.status?.toLowerCase() ===
                            'published'
                              ? 'success'
                              : 'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        {formatDate(enrollment.enrolledAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              component="div"
              count={filteredEnrollments.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Rows per page:"
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
