
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
  Visibility,
  VisibilityOff,
  SchoolRounded,
} from '@mui/icons-material';

import { Link, useNavigate } from 'react-router-dom';

import {
  login,
  getApiErrorMessage,
} from '../services/api';

const REMEMBERED_EMAIL_KEY = 'learnloop.rememberedEmail';

function readRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveRememberMe(remember: boolean, email: string) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  } catch {
    // Storage unavailable (private mode etc.) - ignore.
  }
}

/**
 * Ask the browser's password manager to save the credentials.
 * The password is never stored by the app itself - only by the browser.
 * Supported in Chromium browsers; silently skipped elsewhere.
 */
async function storeBrowserCredential(email: string, password: string) {
  const PasswordCredentialCtor = (
    window as unknown as {
      PasswordCredential?: new (data: {
        id: string;
        password: string;
        name?: string;
      }) => Credential;
    }
  ).PasswordCredential;

  if (!PasswordCredentialCtor || !navigator.credentials?.store) return;

  try {
    await navigator.credentials.store(
      new PasswordCredentialCtor({ id: email, password, name: email }),
    );
  } catch {
    // User dismissed the prompt or the browser refused - ignore.
  }
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(readRememberedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => readRememberedEmail() !== '',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    try {
      setLoading(true);

      const response = await login(
        {
          email: email.trim(),
          password,
        },
        rememberMe,
      );

      saveRememberMe(rememberMe, email.trim());

      if (rememberMe) {
        await storeBrowserCredential(email.trim(), password);
      }

      // The login API saves the token and user in localStorage.
      // Use the actual role returned by the backend.
      const user = response.user;

      if (user?.role?.toLowerCase() === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      bgcolor: '#fff',
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F5F6FB',
        p: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Paper
          elevation={0}
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr 1fr',
            },
            maxWidth: 1250,
            mx: 'auto',
            overflow: 'hidden',
            border: '1px solid #E8EAF2',
            borderRadius: 4,
          }}
        >
          {/* Left branding panel */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 550,
              p: { md: 4, lg: 5 },
              color: '#fff',
              background:
                'linear-gradient(145deg, #5B49ED 0%, #7965F3 60%, #927AF7 100%)',
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center' }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <AutoStoriesRounded sx={{ fontSize: 29 }} />
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                LearnLoop AI
              </Typography>
            </Stack>

            <Box sx={{ my: 6 }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, lineHeight: 1.2 }}
              >
                Learn smarter.
                <br />
                Grow faster.
              </Typography>

              <Typography
                sx={{
                  mt: 2,
                  maxWidth: 420,
                  lineHeight: 1.8,
                  color: 'rgba(255,255,255,0.88)',
                }}
              >
                Your learning journey, organized in one place.
                Discover courses, track progress, and achieve
                your goals.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.13)',
                border: '1px solid rgba(255,255,255,0.22)',
              }}
            >
              <SchoolRounded sx={{ fontSize: 30, mb: 1 }} />

              <Typography sx={{ fontWeight: 700 }}>
                Every day is a chance to learn.
              </Typography>

              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Build skills. Explore ideas. Reach your potential.
              </Typography>
            </Box>
          </Box>

          {/* Right login panel */}
          <Box
            sx={{
              p: { xs: 3, sm: 5, lg: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', display: { xs: 'flex', md: 'none' }, mb: 4 }}
            >
              <AutoStoriesRounded
                sx={{ fontSize: 32, color: '#6554ED' }}
              />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                LearnLoop AI
              </Typography>
            </Stack>

            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#202044' }}
            >
              Welcome back!
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Sign in to continue your learning journey.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 700 }}>
                Email address
              </Typography>

              <TextField
                fullWidth
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                sx={{ ...fieldSx, mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ color: '#8585A1' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Stack
                direction="row"
                sx={{
                  mb: 1,
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Password
                </Typography>

                <Typography
                  component={Link}
                  to="/forgot-password"
                  variant="body2"
                  sx={{
                    color: '#6554ED',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Forgot password?
                </Typography>
              </Stack>

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                sx={{ ...fieldSx, mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: '#8585A1' }} />
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
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                sx={{ mb: 2, mt: 0.5 }}
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    sx={{
                      color: '#6554ED',
                      '&.Mui-checked': { color: '#6554ED' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    Remember me
                  </Typography>
                }
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2.5,
                  bgcolor: '#6554ED',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 16,
                  '&:hover': { bgcolor: '#5140D4' },
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

              <Stack
                direction="row"
                spacing={2}
                sx={{ my: 3, alignItems: 'center' }}
              >
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#E6E6EF' }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  NEW TO LEARNLOOP AI?
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: '#E6E6EF' }} />
              </Stack>

              <Typography variant="body2">
                Don't have an account?{' '}
                <Typography
                  component={Link}
                  to="/signup"
                  sx={{
                    color: '#6554ED',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  Create account
                </Typography>
              </Typography>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 4 }}
            >
              LearnLoop AI · Your learning journey starts here
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
