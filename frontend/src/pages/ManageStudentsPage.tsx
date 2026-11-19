
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
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

import { ArrowBackRounded as ArrowBackRoundedIcon } from '@mui/icons-material';
import { AddRounded as AddRoundedIcon } from '@mui/icons-material';
import { SearchRounded as SearchRoundedIcon } from '@mui/icons-material';
import { EditRounded as EditRoundedIcon } from '@mui/icons-material';
import { DeleteOutlineRounded as DeleteOutlineRoundedIcon } from '@mui/icons-material';
import { PeopleAltRounded as PeopleAltRoundedIcon } from '@mui/icons-material';
import { RefreshRounded as RefreshRoundedIcon } from '@mui/icons-material';

import { Link as RouterLink } from 'react-router-dom';
import api from '../api/axios';

interface Student {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

interface StudentForm {
  name: string;
  email: string;
  password: string;
}

interface StudentsPageResponse {
  data: Student[];
  total: number;
  page?: number;
  limit?: number;
}

const emptyForm: StudentForm = {
  name: '',
  email: '',
  password: '',
};

const pageSizeOptions = [5, 10, 25, 50];

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { message?: string | string[] };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }

  if (error instanceof Error) return error.message;

  return 'Something went wrong. Please try again.';
}

function normalizeStudents(
  result: unknown,
  requestedPage: number,
  requestedLimit: number,
): StudentsPageResponse {
  if (Array.isArray(result)) {
    return {
      data: result as Student[],
      total: result.length,
      page: requestedPage,
      limit: requestedLimit,
    };
  }

  if (typeof result === 'object' && result !== null) {
    const payload = result as Record<string, unknown>;

    const rows = Array.isArray(payload.data)
      ? payload.data
      : Array.isArray(payload.students)
        ? payload.students
        : Array.isArray(payload.items)
          ? payload.items
          : null;

    if (rows) {
      return {
        data: rows as Student[],
        total:
          typeof payload.total === 'number'
            ? payload.total
            : rows.length,
        page:
          typeof payload.page === 'number'
            ? payload.page
            : requestedPage,
        limit:
          typeof payload.limit === 'number'
            ? payload.limit
            : requestedLimit,
      };
    }
  }

  throw new Error('Unexpected response from the students API.');
}

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] =
    useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [notice, setNotice] = useState<{
    message: string;
    severity: 'success' | 'error';
  } | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const response = await api.get<unknown>('/students', {
        params: {
          page: page + 1,
          limit,
          search: search || undefined,
          sortBy: 'createdAt',
          order: 'DESC',
        },
      });

      const result = normalizeStudents(
        response.data,
        page + 1,
        limit,
      );

      setStudents(result.data);
      setTotal(result.total);
    } catch (error) {
      setStudents([]);
      setTotal(0);
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const openCreateDialog = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setFormError('');
    setDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setForm({
      name: student.name ?? '',
      email: student.email ?? '',
      password: '',
    });
    setFormError('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    setEditingStudent(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleSave = async () => {
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setFormError('Please enter the student name and email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!editingStudent && !form.password.trim()) {
      setFormError('Please enter a password for the new student.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingStudent) {
        await api.patch(`/students/${editingStudent.id}`, {
          name,
          email,
        });

        setNotice({
          message: 'Student updated successfully.',
          severity: 'success',
        });
      } else {
        await api.post('/students', {
          name,
          email,
          password: form.password,
        });

        setNotice({
          message: 'Student created successfully.',
          severity: 'success',
        });
      }

      setDialogOpen(false);
      setEditingStudent(null);
      setForm(emptyForm);

      if (!editingStudent && page !== 0) {
        setPage(0);
      } else {
        await loadStudents();
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(`/students/${deleteTarget.id}`);

      setNotice({
        message: 'Student deleted successfully.',
        severity: 'success',
      });

      setDeleteTarget(null);

      if (students.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        await loadStudents();
      }
    } catch (error) {
      setNotice({
        message: getErrorMessage(error),
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F7F6F4',
        p: { xs: 2, md: 4 },
      }}
    >
      {/* Header */}
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
          <Button
            component={RouterLink}
            to="/admin"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ mb: 1, textTransform: 'none' }}
          >
            Back to Admin Dashboard
          </Button>

          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Manage Students
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 1 }}>
            View and manage student accounts in LearnLoop AI.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh students">
            <span>
              <IconButton
                onClick={() => void loadStudents()}
                disabled={loading}
                aria-label="Refresh students"
                sx={{
                  bgcolor: '#FFFFFF',
                  border: '1px solid #ECE8E4',
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
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Add Student
          </Button>
        </Stack>
      </Stack>

      {/* Summary */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid #ECE8E4',
          borderRadius: 3,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: '#FFF1E8',
              color: '#F26A21',
            }}
          >
            <PeopleAltRoundedIcon />
          </Avatar>

          <Box>
            <Typography color="text.secondary" variant="body2">
              Students matching your search
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {loading ? '—' : total}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Student table */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid #ECE8E4',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Student Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search and manage registered students.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="Search name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSearch();
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: { sm: 260 } }}
            />

            <Button
              variant="outlined"
              onClick={handleSearch}
              sx={{ textTransform: 'none' }}
            >
              Search
            </Button>
          </Stack>
        </Box>

        {pageError && (
          <Alert
            severity="error"
            sx={{ mx: 2, mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void loadStudents()}
              >
                Retry
              </Button>
            }
          >
            {pageError}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F6' }}>
                <TableCell>Student</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box sx={{ py: 6 }}>
                      <CircularProgress size={30} />
                      <Typography
                        color="text.secondary"
                        sx={{ mt: 2 }}
                      >
                        Loading students...
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : pageError ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      Unable to load student records.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box sx={{ py: 6 }}>
                      <PeopleAltRoundedIcon
                        sx={{ fontSize: 42, color: '#AAA' }}
                      />
                      <Typography sx={{ mt: 1, fontWeight: 700 }}>
                        No students found
                      </Typography>
                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Try another search or add a student.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow
                    key={student.id}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: 'center' }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: '#FFF1E8',
                            color: '#F26A21',
                            width: 38,
                            height: 38,
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {(student.name || student.email || 'S')
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>

                        <Typography sx={{ fontWeight: 700 }}>
                          {student.name || 'Unnamed student'}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>{student.email}</TableCell>

                    <TableCell>
                      <Chip
                        label={`#${student.id}`}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      {student.createdAt
                        ? new Date(student.createdAt).toLocaleDateString()
                        : '—'}
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Edit student">
                        <IconButton
                          aria-label={`Edit ${student.name}`}
                          onClick={() => openEditDialog(student)}
                          color="primary"
                        >
                          <EditRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete student">
                        <IconButton
                          aria-label={`Delete ${student.name}`}
                          onClick={() => setDeleteTarget(student)}
                          color="error"
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={limit}
          onRowsPerPageChange={(event) => {
            setLimit(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={pageSizeOptions}
          disabled={loading}
        />
      </Paper>

      {/* Add / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Full name"
              required
              fullWidth
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />

            <TextField
              label="Email address"
              type="email"
              required
              fullWidth
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />

            {!editingStudent && (
              <TextField
                label="Temporary password"
                type="password"
                required
                fullWidth
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                helperText="Use the password rules required by your backend."
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={closeDialog}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => void handleSave()}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : editingStudent ? (
              'Save Changes'
            ) : (
              'Create Student'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Student?</DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={deleting}
            sx={{ textTransform: 'none' }}
          >
            {deleting ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              'Delete Student'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notice ? (
          <Alert
            severity={notice.severity}
            onClose={() => setNotice(null)}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
