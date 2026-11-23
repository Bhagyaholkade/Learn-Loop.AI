import { useState, type ReactNode } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BadgeRounded as BadgeRoundedIcon,
  ChevronRightRounded as ChevronRightRoundedIcon,
  ContentCopyRounded as ContentCopyRoundedIcon,
  EmailRounded as EmailRoundedIcon,
  EventRepeatRounded as EventRepeatRoundedIcon,
  FlagRounded as FlagRoundedIcon,
  LogoutRounded as LogoutRoundedIcon,
  MenuBookRounded as MenuBookRoundedIcon,
  NotificationsActiveRounded as NotificationsActiveRoundedIcon,
  PersonRounded as PersonRoundedIcon,
  QuizRounded as QuizRoundedIcon,
  SchoolRounded as SchoolRoundedIcon,
  SecurityRounded as SecurityRoundedIcon,
  TuneRounded as TuneRoundedIcon,
  WorkspacePremiumRounded as WorkspacePremiumRoundedIcon,
} from '@mui/icons-material';

import { BRAND } from '../theme';

// ==========================================
// Local (device-only) preferences
// ==========================================

type Preferences = {
  courseReminders: boolean;
  quizReminders: boolean;
  weeklySummary: boolean;
  weeklyGoal: number;
};

const PREFS_KEY = 'learnloop:studentPreferences';

const DEFAULT_PREFS: Preferences = {
  courseReminders: true,
  quizReminders: true,
  weeklySummary: false,
  weeklyGoal: 3,
};

function readPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Preferences>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: Preferences) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Storage unavailable — keep preferences in memory only.
  }
}

// ==========================================
// Props
// ==========================================

type QuickLinkTarget = 'My Courses' | 'Quizzes & Assessments' | 'My Certificates';

type StudentSettingsPanelProps = {
  name: string;
  email?: string;
  role?: string;
  enrolledCount: number;
  availableCount: number;
  onLogout: () => void;
  onNavigate: (page: QuickLinkTarget) => void;
};

const cardSx = {
  bgcolor: '#fff',
  border: `1px solid ${BRAND.border}`,
  borderRadius: '16px',
  boxShadow: '0 1px 2px rgba(30,20,10,0.04), 0 8px 24px -16px rgba(30,20,10,0.18)',
} as const;

function SettingRow({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: 'center',
        p: 2,
        borderRadius: '12px',
        transition: 'background-color .2s',
        '&:hover': { bgcolor: BRAND.surfaceAlt },
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: BRAND.orangeLight,
          color: BRAND.orange,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      {action}
    </Stack>
  );
}

export default function StudentSettingsPanel({
  name,
  email,
  role,
  enrolledCount,
  availableCount,
  onLogout,
  onNavigate,
}: StudentSettingsPanelProps) {
  const [tab, setTab] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(() => readPrefs());
  const [toast, setToast] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'S';

  const updatePrefs = (patch: Partial<Preferences>, message: string) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      writePrefs(next);
      return next;
    });
    setToast(message);
  };

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      setToast('Email copied to clipboard');
    } catch {
      setToast('Could not copy email');
    }
  };

  const quickLinks: { label: QuickLinkTarget; description: string; icon: ReactNode }[] = [
    { label: 'My Courses', description: 'Continue where you left off', icon: <SchoolRoundedIcon /> },
    { label: 'Quizzes & Assessments', description: 'Test your knowledge', icon: <QuizRoundedIcon /> },
    { label: 'My Certificates', description: 'View your achievements', icon: <WorkspacePremiumRoundedIcon /> },
  ];

  return (
    <Box>
      {/* PROFILE HEADER */}
      <Box sx={{ ...cardSx, overflow: 'hidden', mb: 3 }}>
        <Box
          sx={{
            position: 'relative',
            height: { xs: 100, md: 120 },
            background: BRAND.gradient,
            overflow: 'hidden',
            '&::before, &::after': {
              content: '""',
              position: 'absolute',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.14)',
            },
            '&::before': { width: 240, height: 240, right: -60, top: -130 },
            '&::after': { width: 140, height: 140, right: 180, bottom: -90 },
          }}
        >
          <Button
            startIcon={<LogoutRoundedIcon />}
            onClick={() => setConfirmLogout(true)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              color: '#fff',
              bgcolor: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.4)',
              backdropFilter: 'blur(6px)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            Logout
          </Button>
        </Box>

        <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.5, sm: 2.5 }}
            sx={{ alignItems: { xs: 'flex-start', sm: 'flex-start' } }}
          >
            <Avatar
              sx={{
                width: 96,
                height: 96,
                mt: '-48px',
                fontSize: 34,
                fontWeight: 800,
                color: '#fff',
                background: BRAND.gradient,
                border: '4px solid #fff',
                boxShadow: '0 10px 24px -10px rgba(242,106,33,0.6)',
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0, pt: { sm: 1.5 } }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {name}
                </Typography>
                <Chip
                  size="small"
                  icon={<SchoolRoundedIcon sx={{ fontSize: '16px !important' }} />}
                  label={(role || 'student').replace(/^\w/, (c) => c.toUpperCase())}
                  sx={{
                    bgcolor: BRAND.orangeLight,
                    color: BRAND.orange,
                    '& .MuiChip-icon': { color: BRAND.orange },
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, alignItems: 'center' }}>
                <EmailRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography color="text.secondary" noWrap>
                  {email || 'No email available'}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* QUICK STATS */}
          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            {[
              {
                label: 'Enrolled courses',
                value: enrolledCount,
                icon: <SchoolRoundedIcon />,
                tint: BRAND.orangeLight,
                color: BRAND.orange,
                target: 'My Courses' as QuickLinkTarget,
              },
              {
                label: 'Courses to explore',
                value: availableCount,
                icon: <MenuBookRoundedIcon />,
                tint: '#EEF2FF',
                color: '#4F5BD5',
                target: null,
              },
            ].map((stat) => (
              <Stack
                key={stat.label}
                direction="row"
                spacing={2}
                onClick={stat.target ? () => onNavigate(stat.target) : undefined}
                sx={{
                  alignItems: 'center',
                  p: 2,
                  borderRadius: '14px',
                  bgcolor: BRAND.surfaceAlt,
                  border: `1px solid ${BRAND.border}`,
                  cursor: stat.target ? 'pointer' : 'default',
                  transition: 'all .2s',
                  '&:hover': stat.target
                    ? { borderColor: '#F7B48A', bgcolor: '#FFFBF8' }
                    : {},
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: stat.tint,
                    color: stat.color,
                    flexShrink: 0,
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1.1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Box>
      </Box>

      {/* TABS */}
      <Box sx={{ ...cardSx, p: { xs: 1.5, md: 2 } }}>
        <Tabs
          value={tab}
          onChange={(_, value: number) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            px: 1,
            mb: 1,
            minHeight: 44,
            '& .MuiTabs-indicator': { height: 3, borderRadius: 3 },
            '& .MuiTab-root': { minHeight: 44 },
          }}
        >
          <Tab icon={<PersonRoundedIcon />} iconPosition="start" label="Profile" />
          <Tab icon={<TuneRoundedIcon />} iconPosition="start" label="Preferences" />
          <Tab icon={<SecurityRoundedIcon />} iconPosition="start" label="Account" />
        </Tabs>

        {tab === 0 && (
          <Box>
            <SettingRow
              icon={<BadgeRoundedIcon />}
              title="Full name"
              description={name}
              action={null}
            />
            <SettingRow
              icon={<EmailRoundedIcon />}
              title="Email address"
              description={email || 'No email available'}
              action={
                email ? (
                  <Tooltip title="Copy email">
                    <IconButton onClick={() => void copyEmail()}>
                      <ContentCopyRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : null
              }
            />

            <Typography
              variant="overline"
              sx={{ display: 'block', px: 2, mt: 2, color: 'text.secondary', fontWeight: 700 }}
            >
              Quick links
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 1.5,
                p: 1,
              }}
            >
              {quickLinks.map((link) => (
                <Box
                  key={link.label}
                  component="button"
                  type="button"
                  onClick={() => onNavigate(link.label)}
                  sx={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    borderRadius: '12px',
                    border: `1px solid ${BRAND.border}`,
                    transition: 'all .2s',
                    '&:hover, &:focus-visible': {
                      borderColor: '#F7B48A',
                      bgcolor: '#FFFBF8',
                    },
                    '&:hover .chev': { transform: 'translateX(3px)', color: BRAND.orange },
                  }}
                >
                  <Box sx={{ color: BRAND.orange, display: 'flex' }}>{link.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{link.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {link.description}
                    </Typography>
                  </Box>
                  <ChevronRightRoundedIcon
                    className="chev"
                    sx={{ color: 'text.secondary', transition: 'all .2s' }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {/* Reminders and summaries are not sent by the backend yet, so
                they are shown as "Coming soon" instead of working toggles. */}
            <Alert severity="info" sx={{ m: 2, mb: 1 }}>
              Reminders and weekly summaries are coming soon. They are not
              sent yet.
            </Alert>
            <SettingRow
              icon={<NotificationsActiveRoundedIcon />}
              title="Course reminders"
              description="Remind me to continue my enrolled courses"
              action={<Chip label="Coming soon" size="small" />}
            />
            <SettingRow
              icon={<QuizRoundedIcon />}
              title="Quiz reminders"
              description="Remind me about quizzes I haven't attempted"
              action={<Chip label="Coming soon" size="small" />}
            />
            <SettingRow
              icon={<EventRepeatRoundedIcon />}
              title="Weekly summary"
              description="Show a weekly recap of my learning progress"
              action={<Chip label="Coming soon" size="small" />}
            />

            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1.5 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '10px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: BRAND.orangeLight,
                    color: BRAND.orange,
                    flexShrink: 0,
                  }}
                >
                  <FlagRoundedIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>Weekly learning goal</Typography>
                  <Typography variant="body2" color="text.secondary">
                    How many lessons do you want to complete each week?
                    Saved on this device only.
                  </Typography>
                </Box>
              </Stack>

              <ToggleButtonGroup
                exclusive
                value={prefs.weeklyGoal}
                onChange={(_, value: number | null) => {
                  if (value !== null) {
                    updatePrefs({ weeklyGoal: value }, `Weekly goal set to ${value} lessons`);
                  }
                }}
                sx={{
                  ml: { sm: 7.25 },
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButton-root': {
                    border: `1px solid ${BRAND.border} !important`,
                    borderRadius: '10px !important',
                    px: 2.5,
                    textTransform: 'none',
                    fontWeight: 700,
                  },
                  '& .Mui-selected': {
                    bgcolor: `${BRAND.orange} !important`,
                    color: '#fff !important',
                    borderColor: `${BRAND.orange} !important`,
                  },
                }}
              >
                {[1, 3, 5, 7].map((goal) => (
                  <ToggleButton key={goal} value={goal}>
                    {goal} lessons
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 1 }}>
              Preferences are saved on this device.
            </Typography>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <SettingRow
              icon={<SecurityRoundedIcon />}
              title="Signed in"
              description={`You are signed in as ${email || name}`}
              action={<Chip size="small" label="Active" color="success" variant="outlined" />}
            />

            <Box
              sx={{
                m: 1,
                mt: 2,
                p: 2.5,
                borderRadius: '12px',
                border: '1px solid #F3C9C4',
                bgcolor: '#FFF7F6',
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#B42318' }}>Log out</Typography>
                  <Typography variant="body2" color="text.secondary">
                    End your session on this device. You can sign back in anytime.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<LogoutRoundedIcon />}
                  onClick={() => setConfirmLogout(true)}
                  sx={{ flexShrink: 0 }}
                >
                  Logout
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </Box>

      {/* LOGOUT CONFIRMATION */}
      <Dialog open={confirmLogout} onClose={() => setConfirmLogout(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Log out of LearnLoop AI?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            You'll need to sign in again to continue learning.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmLogout(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={onLogout}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2200}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast('')}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
