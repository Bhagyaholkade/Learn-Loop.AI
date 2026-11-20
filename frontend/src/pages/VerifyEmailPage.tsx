
import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail, getApiErrorMessage } from '../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerifyEmail = async () => {
    if (!token) {
      setError('Verification token is missing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await verifyEmail(token);
      setSuccess(response.message);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Paper
        elevation={3}
        sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}
      >
        {!token ? (
          <>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Invalid verification link
            </Typography>
            <Alert severity="error">
              Verification token is missing.
            </Alert>
          </>
        ) : success ? (
          <>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Email verified!
            </Typography>

            <Alert severity="success">{success}</Alert>

            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{ mt: 3 }}
            >
              Go to Login
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Verify your email
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Click below to verify your LearnLoop AI account.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              onClick={handleVerifyEmail}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Verify Email'
              )}
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}
