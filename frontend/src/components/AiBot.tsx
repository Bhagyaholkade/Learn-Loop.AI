import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, ButtonBase, IconButton, Tooltip } from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { CloseRounded } from '@mui/icons-material';

const INK = '#18181B';
const LINE = '#E4E4E7';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const wave = keyframes`
  0%, 60%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-28deg); }
  20%, 40% { transform: rotate(8deg); }
`;

const blink = keyframes`
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
`;

const bubblePop = keyframes`
  0% { opacity: 0; transform: scale(0.4) translateY(10px); }
  70% { opacity: 1; transform: scale(1.08) translateY(0); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
`;

const antennaGlow = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const shadowPulse = keyframes`
  0%, 100% { transform: scaleX(1); opacity: 0.25; }
  50% { transform: scaleX(0.8); opacity: 0.15; }
`;

/** The animated robot drawing (floats, blinks and waves). */
export function RobotFigure({ width = 150 }: { width?: number }) {
  const uid = useId().replace(/:/g, '');
  const bodyId = `botBody-${uid}`;
  const faceId = `botFace-${uid}`;

  return (
    <Box
      sx={{
        width,
        animation: `${float} 3s ease-in-out infinite`,
        '& .bot-arm-wave': {
          transformBox: 'fill-box',
          transformOrigin: '10% 90%',
          animation: `${wave} 2.4s ease-in-out infinite`,
        },
        '& .bot-eye': {
          transformBox: 'fill-box',
          transformOrigin: 'center',
          animation: `${blink} 4s infinite`,
        },
        '& .bot-antenna': {
          animation: `${antennaGlow} 1.6s ease-in-out infinite`,
        },
      }}
    >
      <svg viewBox="0 0 150 160" width="100%" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A1A1AA" />
            <stop offset="55%" stopColor="#71717A" />
            <stop offset="100%" stopColor="#52525B" />
          </linearGradient>
          <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#27272A" />
            <stop offset="100%" stopColor="#18181B" />
          </linearGradient>
        </defs>

        {/* Antenna */}
        <line x1="75" y1="12" x2="75" y2="28" stroke="#52525B" strokeWidth="3" strokeLinecap="round" />
        <circle className="bot-antenna" cx="75" cy="10" r="6" fill="#F26A21" />

        {/* Ears */}
        <rect x="24" y="48" width="10" height="22" rx="4" fill="#52525B" />
        <rect x="116" y="48" width="10" height="22" rx="4" fill="#52525B" />

        {/* Head */}
        <rect x="32" y="28" width="86" height="62" rx="22" fill={`url(#${bodyId})`} />
        <rect x="42" y="38" width="66" height="42" rx="15" fill={`url(#${faceId})`} />

        {/* Eyes */}
        <ellipse className="bot-eye" cx="62" cy="56" rx="6" ry="7" fill="#FB923C" />
        <ellipse className="bot-eye" cx="88" cy="56" rx="6" ry="7" fill="#FB923C" />

        {/* Smile + cheeks */}
        <path d="M65 69 Q75 77 85 69" stroke="#FB923C" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="51" cy="68" r="3.5" fill="#F26A21" opacity="0.6" />
        <circle cx="99" cy="68" r="3.5" fill="#F26A21" opacity="0.6" />

        {/* Neck + body */}
        <rect x="66" y="88" width="18" height="8" rx="3" fill="#52525B" />
        <rect x="44" y="94" width="62" height="46" rx="18" fill={`url(#${bodyId})`} />
        <circle cx="75" cy="115" r="9" fill="#18181B" />
        <circle cx="75" cy="115" r="4.5" fill="#FB923C" className="bot-antenna" />

        {/* Left arm (resting) */}
        <rect x="28" y="100" width="14" height="32" rx="7" fill="#71717A" />

        {/* Right arm (waving) */}
        <g className="bot-arm-wave">
          <rect x="108" y="74" width="14" height="34" rx="7" fill="#71717A" />
          <circle cx="115" cy="72" r="8" fill="#F26A21" />
        </g>
      </svg>
    </Box>
  );
}

function SpeechBubble({
  children,
  sx,
}: {
  children: ReactNode;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        position: 'absolute',
        px: 1.75,
        py: 0.75,
        borderRadius: 3,
        borderBottomLeftRadius: 4,
        bgcolor: '#FFFFFF',
        border: `1px solid ${LINE}`,
        boxShadow: '0 8px 24px rgba(242, 106, 33, 0.18)',
        fontWeight: 800,
        color: INK,
        whiteSpace: 'nowrap',
        transformOrigin: 'bottom left',
        animation: `${bubblePop} 0.6s ease-out 0.3s both`,
        zIndex: 1,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** Large greeting robot used on the AI Assistant empty state. */
export function HelloBot() {
  return (
    <Box
      aria-label="AI assistant robot saying Hii"
      role="img"
      sx={{ position: 'relative', width: 150, height: 168, mb: 2 }}
    >
      <SpeechBubble sx={{ top: 0, right: -64, fontSize: 18 }}>
        Hii 👋
      </SpeechBubble>

      <Box sx={{ position: 'absolute', inset: 0 }}>
        <RobotFigure />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          ml: '-40px',
          width: 80,
          height: 10,
          borderRadius: '50%',
          bgcolor: '#3F3F46',
          animation: `${shadowPulse} 3s ease-in-out infinite`,
        }}
      />
    </Box>
  );
}

const BUBBLE_DISMISS_KEY = 'learnloop.aiBot.bubbleDismissed';

/**
 * Floating robot launcher pinned to the bottom-right corner.
 * Clicking the robot (or its bubble) opens the AI assistant.
 */
export function AiBotLauncher({ onOpen }: { onOpen: () => void }) {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(BUBBLE_DISMISS_KEY) === '1';
    } catch {
      // storage unavailable — just show the bubble
    }
    if (dismissed) return;

    const timer = window.setTimeout(() => setShowBubble(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  const dismissBubble = () => {
    setShowBubble(false);
    try {
      sessionStorage.setItem(BUBBLE_DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 12, md: 24 },
        bottom: { xs: 12, md: 20 },
        zIndex: 1300,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {showBubble && (
        <Box
          sx={{
            position: 'relative',
            mb: 9,
            maxWidth: 230,
            p: 1.5,
            pr: 3.5,
            borderRadius: 3,
            borderBottomRightRadius: 4,
            bgcolor: '#FFFFFF',
            border: `1px solid ${LINE}`,
            boxShadow: '0 12px 32px rgba(24, 24, 27, 0.14)',
            transformOrigin: 'bottom right',
            animation: `${bubblePop} 0.5s ease-out both`,
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <IconButton
            size="small"
            aria-label="Dismiss"
            onClick={dismissBubble}
            sx={{ position: 'absolute', top: 4, right: 4, p: 0.25, color: '#A1A1AA' }}
          >
            <CloseRounded sx={{ fontSize: 16 }} />
          </IconButton>

          <ButtonBase
            onClick={onOpen}
            sx={{ display: 'block', textAlign: 'left', borderRadius: 1 }}
          >
            <Box sx={{ fontSize: 15, fontWeight: 800, color: INK }}>Hii 👋</Box>
            <Box sx={{ mt: 0.25, fontSize: 13, color: '#71717A', lineHeight: 1.5 }}>
              Stuck on a concept? I'm your AI Learning Assistant — ask me
              anything.
            </Box>
            <Box sx={{ mt: 0.75, fontSize: 13, fontWeight: 700, color: '#F26A21' }}>
              Chat with me →
            </Box>
          </ButtonBase>
        </Box>
      )}

      <Tooltip title="Open AI Learning Assistant" placement="left">
        <ButtonBase
          onClick={onOpen}
          aria-label="Open AI Learning Assistant"
          sx={{
            position: 'relative',
            width: 92,
            height: 104,
            borderRadius: 4,
            transition: 'transform .2s',
            '&:hover': { transform: 'scale(1.06)' },
            '&:hover .bot-glow': { opacity: 1 },
          }}
        >
          <Box
            className="bot-glow"
            sx={{
              position: 'absolute',
              inset: 6,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(242,106,33,0.28) 0%, transparent 70%)',
              opacity: 0.6,
              transition: 'opacity .2s',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <RobotFigure width={88} />
          </Box>
        </ButtonBase>
      </Tooltip>
    </Box>
  );
}
