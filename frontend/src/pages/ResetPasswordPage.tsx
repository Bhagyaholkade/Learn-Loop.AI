import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword, getApiErrorMessage } from '../services/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Password reset token is missing.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(newPassword)) {
      setError(
        'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number.',
      );
      return;
    }

    try {
      setLoading(true);

      const response = await resetPassword({
        token,
        newPassword,
      });

      setSuccess(response.message);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Reset password
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Create a new password for your LearnLoop AI account.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="password"
            label="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            disabled={Boolean(success)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={Boolean(success)}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading || Boolean(success) || !token}
          >
            {loading ? 'Updating...' : 'Reset password'}
          </Button>
        </Box>

        {success && (
          <Button component={Link} to="/login" fullWidth sx={{ mt: 2 }}>
            Go to Login
          </Button>
        )}

        {!success && (
          <Typography textAlign="center" sx={{ mt: 3 }}>
            <Link to="/login">Back to login</Link>
          </Typography>
        )}
      </Paper>
    </Container>
  );
}