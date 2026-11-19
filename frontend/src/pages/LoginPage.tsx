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
} from '@mui/icons-material';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  login,
  getApiErrorMessage,
} from '../services/api';

import {
  alertSx,
  checkboxSx,
  dividerLeftSx,
  dividerRightSx,
  fieldSx,
  formPanelSx,
  glassCardSx,
  gradientTextSx,
  iconSx,
  labelSx,
  linkSx,
  logoBadgeSx,
  pageSx,
  primaryButtonSx,
} from '../components/auth/authStyles';
import AuthBrandSide from '../components/auth/AuthBrandSide';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signupState = location.state as
    | { email?: string; message?: string }
    | null;

  const [email, setEmail] = useState(signupState?.email ?? '');
  const [successMessage] = useState(signupState?.message ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

      // The login API saves the token and user in localStorage.
      // Use the actual role returned by the backend.
      const user = response.user;

      if (user?.role === 'admin') {
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

  return (
    <Box sx={pageSx}>
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
          gap: { md: 6, lg: 10 },
          alignItems: 'center',
        }}
      >
        <AuthBrandSide
          headline={
              <>
                Learn smarter.
                <br />
                <Box component="span" sx={{ color: '#FFF1C9' }}>
                  Grow faster.
                </Box>
              </>
          }
          subtitle="Your learning journey, organized in one place. Discover courses, track progress, and achieve your goals."
        />

        <Box sx={{ width: '100%', maxWidth: 460, mx: 'auto' }}>
        <Paper elevation={0} sx={glassCardSx}>
          <Box sx={formPanelSx}>
            <Box sx={{ ...logoBadgeSx, display: { xs: 'grid', md: 'none' } }}>
              <AutoStoriesRounded sx={{ fontSize: 30 }} />
            </Box>

            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: '#fff', textAlign: { xs: 'center', md: 'left' } }}
            >
              Welcome back to{' '}
              <Box component="span" sx={gradientTextSx}>
                LearnLoop AI
              </Box>
            </Typography>

            <Typography
              sx={{ mt: 1, mb: 3, color: 'rgba(255,255,255,0.9)', textAlign: { xs: 'center', md: 'left' } }}
            >
              Sign in to continue your learning journey.
            </Typography>

            {successMessage && !error && (
              <Alert severity="success" sx={alertSx}>
                {successMessage}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={alertSx}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Typography variant="body2" sx={labelSx}>
                Email address
              </Typography>

              <TextField
                fullWidth
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                sx={{ ...fieldSx, mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={iconSx} />
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
                <Typography variant="body2" sx={{ ...labelSx, mb: 0 }}>
                  Password
                </Typography>

                <Typography
                  component={Link}
                  to="/forgot-password"
                  variant="body2"
                  sx={linkSx}
                >
                  Forgot password?
                </Typography>
              </Stack>

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                sx={{ ...fieldSx, mb: 1.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={iconSx} />
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
                sx={{ mb: 2 }}
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) =>
                      setRememberMe(event.target.checked)
                    }
                    sx={checkboxSx}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Remember me
                  </Typography>
                }
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={primaryButtonSx}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

              <Stack
                direction="row"
                spacing={2}
                sx={{ my: 3, alignItems: 'center' }}
              >
                <Box sx={dividerLeftSx} />
                <Typography
                  variant="caption"
                  sx={{ whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}
                >
                  NEW TO LEARNLOOP AI?
                </Typography>
                <Box sx={dividerRightSx} />
              </Stack>

              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>
                Don't have an account?{' '}
                <Typography
                  component={Link}
                  to="/signup"
                  variant="body2"
                  sx={linkSx}
                >
                  Create account
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Paper>
        </Box>
      </Container>
    </Box>
  );
}
