
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

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
  TextField,
  Typography,
} from '@mui/material';

import {
  AutoStoriesRounded,
  CheckCircleOutline,
  EmailOutlined,
  LockOutlined,
  Person,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

import { Link, useNavigate } from 'react-router-dom';

import {
  signup,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  getApiErrorMessage,
} from '../services/api';

import {
  alertSx,
  checkboxSx,
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

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [registrationToken, setRegistrationToken] =
    useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [resendSeconds, setResendSeconds] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ------------------------------------------
  // OTP RESEND COUNTDOWN
  // ------------------------------------------

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  // ------------------------------------------
  // SEND OTP
  // ------------------------------------------

  async function handleSendOtp() {
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setOtpLoading(true);

      const result = await sendRegistrationOtp({
        email: normalizedEmail,
      });

      setEmail(normalizedEmail);
      setOtpSent(true);
      setOtp('');
      setResendSeconds(result.resendAfter || 60);

      setSuccess(
        result.message ||
          'Verification OTP sent successfully. Please check your email.',
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setOtpLoading(false);
    }
  }

  // ------------------------------------------
  // VERIFY OTP
  // ------------------------------------------

  async function handleVerifyOtp() {
    setError('');
    setSuccess('');

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid six-digit OTP.');
      return;
    }

    try {
      setVerifyLoading(true);

      const result = await verifyRegistrationOtp({
        email: email.trim().toLowerCase(),
        otp,
      });

      if (!result.registrationToken) {
        throw new Error(
          'Verification response did not contain a registration token.',
        );
      }

      setRegistrationToken(result.registrationToken);
      setEmailVerified(true);
      setSuccess(
        'Email verified successfully! You can now create your account.',
      );
      setOtp('');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setVerifyLoading(false);
    }
  }

  // ------------------------------------------
  // CHANGE EMAIL
  // ------------------------------------------

  function handleChangeEmail() {
    setOtpSent(false);
    setEmailVerified(false);
    setOtp('');
    setRegistrationToken('');
    setResendSeconds(0);
    setError('');
    setSuccess('');
  }

  // ------------------------------------------
  // CREATE ACCOUNT
  // ------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!emailVerified || !registrationToken) {
      setError('Please verify your email before signing up.');
      return;
    }

    if (
      !name.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError(
        'Password must contain at least 8 characters.',
      );
      return;
    }

    if (password.length > 72) {
      setError(
        'Password must not exceed 72 characters.',
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
        email: email.trim().toLowerCase(),
        password,
        registrationToken,
      });

      navigate('/login', {
        replace: true,
        state: {
          email: email.trim().toLowerCase(),
          message:
            result.message ||
            'Account created successfully. You can now sign in.',
        },
      });
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const inputSx = {
    ...fieldSx,
    mb: 2,
  };

  // ------------------------------------------
  // UI
  // ------------------------------------------

  return (
    <Box sx={pageSx}>
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1.1fr 1fr',
          },
          gap: { md: 6, lg: 10 },
          alignItems: 'center',
        }}
      >
        <AuthBrandSide
          headline={
            <>
              Start your
              <br />
              <Box
                component="span"
                sx={{ color: '#FFF1C9' }}
              >
                learning journey.
              </Box>
            </>
          }
          subtitle="Create your account to discover courses, build new skills, and track your progress with LearnLoop AI."
        />

        <Box
          sx={{
            width: '100%',
            maxWidth: 480,
            mx: 'auto',
          }}
        >
          <Paper elevation={0} sx={glassCardSx}>
            <Box sx={formPanelSx}>
              <Box
                sx={{
                  ...logoBadgeSx,
                  display: { xs: 'grid', md: 'none' },
                }}
              >
                <AutoStoriesRounded sx={{ fontSize: 30 }} />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#fff',
                  textAlign: {
                    xs: 'center',
                    md: 'left',
                  },
                  fontSize: {
                    xs: 28,
                    md: 32,
                  },
                }}
              >
                Create your{' '}
                <Box
                  component="span"
                  sx={gradientTextSx}
                >
                  account
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  mb: 3,
                  color: 'rgba(255,255,255,0.9)',
                  textAlign: {
                    xs: 'center',
                    md: 'left',
                  },
                }}
              >
                Join LearnLoop AI and start learning today.
              </Typography>

              {error && (
                <Alert severity="error" sx={alertSx}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={alertSx}>
                  {success}
                </Alert>
              )}

              {/* EMAIL VERIFICATION SECTION */}

              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={labelSx}
                >
                  Email address
                </Typography>

                <TextField
                  fullWidth
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  autoComplete="email"
                  required
                  disabled={otpSent}
                  sx={inputSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined sx={iconSx} />
                      </InputAdornment>
                    ),
                  }}
                />

                {!emailVerified && (
                  <Button
                    type="button"
                    fullWidth
                    variant="contained"
                    onClick={handleSendOtp}
                    disabled={otpLoading || otpSent}
                    sx={{
                      ...primaryButtonSx,
                      mt: -1,
                      mb: 2,
                    }}
                  >
                    {otpLoading
                      ? 'Sending OTP...'
                      : otpSent
                        ? 'OTP sent'
                        : 'Send verification OTP'}
                  </Button>
                )}

                {otpSent && !emailVerified && (
                  <>
                    <Typography
                      variant="body2"
                      sx={labelSx}
                    >
                      Enter six-digit OTP
                    </Typography>

                    <TextField
                      fullWidth
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(event) => {
                        const value = event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 6);

                        setOtp(value);
                        setError('');
                      }}
                      inputProps={{
                        maxLength: 6,
                        inputMode: 'numeric',
                        autoComplete: 'one-time-code',
                      }}
                      sx={inputSx}
                    />

                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      onClick={handleVerifyOtp}
                      disabled={
                        verifyLoading || otp.length !== 6
                      }
                      sx={{
                        ...primaryButtonSx,
                        mb: 1,
                      }}
                    >
                      {verifyLoading
                        ? 'Verifying...'
                        : 'Verify Email'}
                    </Button>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                      }}
                    >
                      <Button
                        type="button"
                        size="small"
                        onClick={handleSendOtp}
                        disabled={
                          resendSeconds > 0 || otpLoading
                        }
                        sx={{
                          color: '#fff',
                          textTransform: 'none',
                        }}
                      >
                        {resendSeconds > 0
                          ? `Resend in ${resendSeconds}s`
                          : 'Resend OTP'}
                      </Button>

                      <Button
                        type="button"
                        size="small"
                        onClick={handleChangeEmail}
                        sx={{
                          color: '#fff',
                          textTransform: 'none',
                        }}
                      >
                        Change email
                      </Button>
                    </Box>
                  </>
                )}

                {emailVerified && (
                  <Alert
                    severity="success"
                    icon={<CheckCircleOutline />}
                    sx={{
                      ...alertSx,
                      mb: 2,
                    }}
                  >
                    Email verified successfully.
                    <Button
                      size="small"
                      onClick={handleChangeEmail}
                      sx={{
                        display: 'block',
                        color: 'inherit',
                        textTransform: 'none',
                      }}
                    >
                      Change email
                    </Button>
                  </Alert>
                )}
              </Box>

              {/* ACCOUNT DETAILS - ONLY AFTER EMAIL VERIFICATION */}

              {emailVerified && (
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <Typography
                    variant="body2"
                    sx={labelSx}
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
                          <Person sx={iconSx} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Typography
                    variant="body2"
                    sx={labelSx}
                  >
                    Password
                  </Typography>

                  <TextField
                    fullWidth
                    type={
                      showPassword ? 'text' : 'password'
                    }
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
                    sx={labelSx}
                  >
                    Confirm password
                  </Typography>

                  <TextField
                    fullWidth
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    autoComplete="new-password"
                    required
                    sx={{
                      ...inputSx,
                      mb: 1,
                    }}
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
                    sx={{
                      my: 1.5,
                      alignItems: 'flex-start',
                    }}
                    control={
                      <Checkbox
                        checked={agreeToTerms}
                        onChange={(event) =>
                          setAgreeToTerms(
                            event.target.checked,
                          )
                        }
                        sx={checkboxSx}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          color: 'rgba(255,255,255,0.9)',
                        }}
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
                    sx={primaryButtonSx}
                  >
                    {loading
                      ? 'Creating account...'
                      : 'Create account'}
                  </Button>
                </Box>
              )}

              <Typography
                variant="body2"
                sx={{
                  mt: 3,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                Already have an account?{' '}
                <Typography
                  component={Link}
                  to="/login"
                  variant="body2"
                  sx={linkSx}
                >
                  Sign in
                </Typography>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
