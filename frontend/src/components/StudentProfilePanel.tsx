
import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  EditRounded,
  SaveRounded,
  CancelRounded,
  VerifiedRounded,
  PersonRounded,
} from '@mui/icons-material';

import {
  getMyProfile,
  updateMyProfile,
  getApiErrorMessage,
  type UserProfile,
} from '../services/api';

interface StudentProfilePanelProps {
  onProfileUpdated?: (profile: UserProfile) => void;
}

export default function StudentProfilePanel({
  onProfileUpdated,
}: StudentProfilePanelProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');

        const result = await getMyProfile();

        setProfile(result);
        setName(result.name ?? '');
      } catch (err: unknown) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function handleSave() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Name cannot be empty.');
      return;
    }

    if (trimmedName.length > 100) {
      setError('Name cannot exceed 100 characters.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updatedProfile = await updateMyProfile({
        name: trimmedName,
      });

      setProfile(updatedProfile);
      setName(updatedProfile.name ?? '');
      setEditing(false);
      setSuccess('Profile updated successfully.');

      onProfileUpdated?.(updatedProfile);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(profile?.name ?? '');
    setEditing(false);
    setError('');
    setSuccess('');
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 250,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Alert severity="error">
        {error || 'Unable to load your profile.'}
      </Alert>
    );
  }

  const initials = (profile.name ?? '')
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          My Profile
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          View and manage your personal account information.
        </Typography>
      </Box>

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

      <Card sx={{ borderRadius: 4, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2.5}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Avatar
              sx={{
                width: 84,
                height: 84,
                bgcolor: '#FFF1E8',
                color: '#F26A21',
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {initials || <PersonRounded />}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={800}>
                {profile.name}
              </Typography>

              <Typography color="text.secondary">
                {profile.email}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}
              >
                <Chip
                  label={profile.role}
                  color="primary"
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />

                <Chip
                  icon={
                    <VerifiedRounded
                      sx={{ fontSize: '16px !important' }}
                    />
                  }
                  label={
                    profile.isEmailVerified
                      ? 'Email verified'
                      : 'Email not verified'
                  }
                  color={
                    profile.isEmailVerified ? 'success' : 'warning'
                  }
                  size="small"
                />
              </Stack>
            </Box>

            {!editing && (
              <Button
                variant="outlined"
                startIcon={<EditRounded />}
                onClick={() => {
                  setSuccess('');
                  setEditing(true);
                }}
              >
                Edit Profile
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
          <Typography variant="h6" fontWeight={800}>
            Personal Information
          </Typography>

          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ mt: 0.5, mb: 3 }}
          >
            Your registered account details.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            <Box>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                Full Name
              </Typography>

              <TextField
                fullWidth
                value={name}
                disabled={!editing || saving}
                onChange={(event) => setName(event.target.value)}
                inputProps={{ maxLength: 100 }}
                placeholder="Enter your full name"
              />
            </Box>

            <Box>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                Email Address
              </Typography>

              <TextField
                fullWidth
                value={profile.email}
                disabled
                helperText="Email address cannot be changed here."
              />
            </Box>

            <Box>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                Account Role
              </Typography>

              <TextField
                fullWidth
                value={profile.role}
                disabled
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>

            <Box>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                Account Created
              </Typography>

              <TextField
                fullWidth
                value={
                  profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(
                        undefined,
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        },
                      )
                    : 'Not available'
                }
                disabled
              />
            </Box>
          </Stack>

          {editing && (
            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 4 }}
            >
              <Button
                variant="contained"
                startIcon={<SaveRounded />}
                onClick={() => void handleSave()}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>

              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CancelRounded />}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
