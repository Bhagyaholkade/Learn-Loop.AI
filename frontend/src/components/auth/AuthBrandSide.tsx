import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  AutoAwesomeRounded,
  AutoStoriesRounded,
  FormatQuoteRounded,
  InsightsRounded,
  WorkspacePremiumRounded,
} from '@mui/icons-material';
import { logoBadgeSx } from './authStyles';

const features = [
  {
    icon: AutoAwesomeRounded,
    title: 'AI-powered courses',
    text: 'Personalised lessons built to match how you learn.',
  },
  {
    icon: InsightsRounded,
    title: 'Track your progress',
    text: 'See your growth with lessons, quizzes and results.',
  },
  {
    icon: WorkspacePremiumRounded,
    title: 'Earn certificates',
    text: 'Complete courses and showcase your achievements.',
  },
];

type AuthBrandSideProps = {
  headline: ReactNode;
  subtitle: string;
};

/** Left-hand brand content shown beside the auth form on wider screens. */
export default function AuthBrandSide({ headline, subtitle }: AuthBrandSideProps) {
  return (
    <Box sx={{ display: { xs: 'none', md: 'block' }, color: '#fff' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 6 }}>
        <Box sx={{ ...logoBadgeSx, mx: 0, mb: 0 }}>
          <AutoStoriesRounded sx={{ fontSize: 30 }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: 24, letterSpacing: 0.3 }}>
          LearnLoop AI
        </Typography>
      </Stack>

      <Typography
        component="h2"
        sx={{ fontWeight: 800, fontSize: { md: 42, lg: 50 }, lineHeight: 1.12 }}
      >
        {headline}
      </Typography>

      <Typography
        sx={{
          mt: 2,
          maxWidth: 460,
          fontSize: 17,
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        {subtitle}
      </Typography>

      <Stack spacing={2.5} sx={{ mt: 5 }}>
        {features.map(({ icon: Icon, title, text }) => (
          <Stack key={title} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
            >
              <Icon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{title}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Box
        sx={{
          mt: 5,
          p: 2.5,
          maxWidth: 440,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          gap: 1.5,
        }}
      >
        <FormatQuoteRounded sx={{ fontSize: 30, color: '#FFF1C9', flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontWeight: 600, fontStyle: 'italic' }}>
            Every day is a chance to learn something new.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'rgba(255,255,255,0.8)' }}>
            Build skills. Explore ideas. Reach your potential.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
