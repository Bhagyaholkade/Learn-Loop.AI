
import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  AutoStoriesRounded,
  EmailOutlined,
  LockOutlined,
  Person,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

import { Link, useNavigate } from 'react-router-dom';

import {
  signup,
  getApiErrorMessage,
} from '../services/api';

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError(
        'Password must contain at least 8 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeToTerms) {
      setError(
        'Please agree to the terms before creating an account.',
      );
      return;
    }

    try {
      setLoading(true);

      const result = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccess(
        result.message ||
          'Account created successfully! Redirecting to login...',
      );

      // Signup creates the account; login obtains the JWT.
      window.setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputSx = {
    mb: 2,
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F6F7FB',
        p: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Paper
          elevation={0}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr',
            },
            overflow: 'hidden',
            borderRadius: 5,
            border: '1px solid #E9EAF2',
          }}
        >
          {/* Branding panel */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 6,
              color: 'white',
              background:
                'linear-gradient(145deg, #5946E8 0%, #7665F4 55%, #A18BFF 100%)',
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center' }}
            >
              <AutoStoriesRounded sx={{ fontSize: 38 }} />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                LearnLoop AI
              </Typography>
            </Stack>

            <Box sx={{ py: 6 }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, lineHeight: 1.2 }}
              >
                Start your
                <br />
                learning journey.
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  maxWidth: 400,
                  lineHeight: 1.8,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                Create your account to discover courses,
                build new skills, and track your progress
                with LearnLoop AI.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.13)',
                border:
                  '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                One account. Endless possibilities.
              </Typography>

              <Typography
                variant="body2"
                sx={{ mt: 1, opacity: 0.85 }}
              >
                Learn something new, every day.
              </Typography>
            </Box>
          </Box>

          {/* Signup form */}
          <Box
            sx={{
              p: { xs: 3, sm: 5, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                display: { xs: 'flex', md: 'none' },
                mb: 3,
              }}
            >
              <AutoStoriesRounded
                sx={{ color: '#6554ED', fontSize: 32 }}
              />
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: '#202044' }}
              >
                LearnLoop AI
              </Typography>
            </Stack>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#202044',
                fontSize: { xs: 28, md: 32 },
              }}
            >
              Create your account
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1, mb: 3 }}
            >
              Join LearnLoop AI and start learning today.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              noValidate
            >
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 700 }}
              >
                Full name
              </Typography>

              <TextField
                fullWidth
                placeholder="Enter your full name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                autoComplete="name"
                required
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person
                        sx={{ color: '#8888A3' }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 700 }}
              >
                Email address
              </Typography>

              <TextField
                fullWidth
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined
                        sx={{ color: '#8888A3' }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 700 }}
              >
                Password
              </Typography>

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                required
                sx={inputSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined
                        sx={{ color: '#8888A3' }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() =>
                          setShowPassword((value) => !value)
                        }
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 700 }}
              >
                Confirm password
              </Typography>

              <TextField
                fullWidth
                type={
                  showConfirmPassword ? 'text' : 'password'
                }
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                required
                sx={{ ...inputSx, mb: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined
                        sx={{ color: '#8888A3' }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        aria-label="Toggle confirm password visibility"
                        onClick={() =>
                          setShowConfirmPassword(
                            (value) => !value,
                          )
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                sx={{ my: 2, alignItems: 'flex-start' }}
                control={
                  <Checkbox
                    checked={agreeToTerms}
                    onChange={(event) =>
                      setAgreeToTerms(event.target.checked)
                    }
                    sx={{
                      color: '#6554ED',
                      '&.Mui-checked': {
                        color: '#6554ED',
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    I agree to the terms of service and
                    privacy policy.
                  </Typography>
                }
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                  bgcolor: '#6554ED',
                  '&:hover': {
                    bgcolor: '#5140D4',
                  },
                }}
              >
                {loading
                  ? 'Creating account...'
                  : 'Create account'}
              </Button>
            </Box>

            <Typography
              color="text.secondary"
              sx={{ mt: 3, textAlign: 'center' }}
            >
              Already have an account?{' '}
              <Typography
                component={Link}
                to="/login"
                sx={{
                  color: '#6554ED',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Typography>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
