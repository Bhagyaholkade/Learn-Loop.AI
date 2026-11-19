import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import {
  AutoStoriesRounded,
  SchoolRounded,
} from '@mui/icons-material';

interface AuthBrandSideProps {
  headline: ReactNode;
  subtitle: string;
}

export default function AuthBrandSide({
  headline,
  subtitle,
}: AuthBrandSideProps) {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        gap: 5,
        color: '#fff',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
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

      <Box>
        <Typography
          variant="h3"
          sx={{ fontWeight: 800, lineHeight: 1.2 }}
        >
          {headline}
        </Typography>
        <Typography
          sx={{
            mt: 2,
            maxWidth: 440,
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 2.5,
          maxWidth: 440,
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
  );
}
