import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { HelloBot } from '../components/AiBot';

import {
  AddRounded,
  ArrowBackRounded,
  AutoAwesomeRounded,
  CheckRounded,
  ContentCopyRounded,
  DeleteOutlineRounded,
  ExpandMoreRounded,
  HubRounded,
  KeyboardArrowDownRounded,
  LockRounded,
  MenuBookRounded,
  PersonRounded,
  PlayCircleOutlineRounded,
  PsychologyAltRounded,
  SearchRounded,
  SendRounded,
  SmartToyRounded,
} from '@mui/icons-material';

import {
  getMyEnrollments,
  type Enrollment,
} from '../services/api';

import {
  getCourseById,
  type CourseLesson,
} from '../api/courseApi';

import {
  streamAiMessage,
  getAiConversations,
  getAiConversation,
  deleteAiConversation,
  type AiChatMode,
  type AiConversation,
  type AiMessage,
} from '../services/aiAssistantService';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AvailableLesson extends CourseLesson {
  courseId: number;
  courseTitle: string;
  chapterId: number;
  chapterTitle: string;
  /** 1-based position of the chapter inside its course. */
  chapterNumber: number;
  /** 1-based position of the lesson inside its chapter. */
  lessonNumber: number;
}

interface ChapterGroup {
  key: string;
  chapterId: number;
  chapterTitle: string;
  chapterNumber: number;
  lessons: AvailableLesson[];
}

interface CourseGroup {
  courseId: number;
  courseTitle: string;
  chapters: ChapterGroup[];
}

const PRIMARY = '#F26A21';
const ACCENT = '#52525B';
const AI_GRADIENT = 'linear-gradient(135deg, #FB923C 0%, #F26A21 55%, #EA580C 100%)';

const INK = '#18181B';
const MUTED = '#71717A';
const LINE = '#E4E4E7';

const SIDEBAR_BG = '#FAFAFA';
const SIDEBAR_LINE = '#E4E4E7';
const SIDEBAR_TEXT = '#27272A';
const SIDEBAR_MUTED = '#71717A';

const pulse = keyframes`
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
  40% { transform: scale(1); opacity: 1; }
`;

const chapterKeyOf = (lesson: Pick<AvailableLesson, 'courseId' | 'chapterId'>) =>
  `${lesson.courseId}-${lesson.chapterId}`;

const SUGGESTED_PROMPTS: Record<AiChatMode, string[]> = {
  LESSON: [
    'Explain this lesson in simple words.',
    'Give me a practical example of this topic.',
    'What are the most important concepts I should remember?',
    'Ask me five questions to test my understanding.',
  ],
  GENERAL: [
    'Explain Docker with a practical Node.js example.',
    'How can I build a good study routine?',
    'Explain recursion with a simple example.',
    'What is the difference between SQL and NoSQL databases?',
    'Give me tips for preparing for a technical interview.',
  ],
};

const MODE_OPTIONS: {
  value: AiChatMode;
  label: string;
  description: string;
  icon: typeof MenuBookRounded;
}[] = [
  {
    value: 'LESSON',
    label: 'Lesson',
    description: 'Learn from your selected course and lesson.',
    icon: MenuBookRounded,
  },
  {
    value: 'GENERAL',
    label: 'General AI',
    description: 'Ask anything about programming, technology, AI and more.',
    icon: AutoAwesomeRounded,
  },
];

const MODE_COPY: Record<AiChatMode, { subtitle: string; intro: string }> = {
  LESSON: {
    subtitle: 'Your personal assistant for understanding lessons',
    intro:
      'Ask questions about your lessons, understand difficult concepts, get examples, and practise what you learn.',
  },
  GENERAL: {
    subtitle: 'Ask anything about programming, technology and AI',
    intro:
      'Explore any topic beyond your courses: programming, tools, AI, career tips and more.',
  },
};

function TypingDots() {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ py: 0.75 }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: AI_GRADIENT,
            animation: `${pulse} 1.2s ease-in-out ${index * 0.16}s infinite`,
          }}
        />
      ))}
      <Typography variant="caption" sx={{ color: MUTED, ml: 1 }}>
        Thinking…
      </Typography>
    </Stack>
  );
}

function AiAvatar({ size = 34 }: { size?: number }) {
  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        background: AI_GRADIENT,
        color: '#FFFFFF',
        boxShadow: '0 4px 14px rgba(242, 106, 33, 0.25)',
      }}
    >
      <SmartToyRounded sx={{ fontSize: size * 0.52 }} />
    </Avatar>
  );
}

interface LessonPickerProps {
  groups: CourseGroup[];
  selectedLesson?: AvailableLesson;
  disabled: boolean;
  lockedReason?: string;
  onSelect: (lessonId: number) => void;
}

function LessonPicker({
  groups,
  selectedLesson,
  disabled,
  lockedReason,
  onSelect,
}: LessonPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const showCourseLabels = groups.length > 1;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return groups;

    return groups
      .map((course) => ({
        ...course,
        chapters: course.chapters
          .map((chapter) => ({
            ...chapter,
            lessons: chapter.chapterTitle.toLowerCase().includes(normalizedQuery)
              ? chapter.lessons
              : chapter.lessons.filter((lesson) =>
                  lesson.title.toLowerCase().includes(normalizedQuery),
                ),
          }))
          .filter((chapter) => chapter.lessons.length > 0),
      }))
      .filter((course) => course.chapters.length > 0);
  }, [groups, normalizedQuery]);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setQuery('');

    const initialKey = selectedLesson
      ? chapterKeyOf(selectedLesson)
      : groups[0]?.chapters[0]?.key;

    setExpanded(new Set(initialKey ? [initialKey] : []));
  };

  const toggleChapter = (key: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isEmpty = groups.length === 0;

  const trigger = (
    <span style={{ display: 'flex', minWidth: 0 }}>
      <ButtonBase
        onClick={handleOpen}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label="Select a lesson"
        sx={{
          width: '100%',
          minWidth: 0,
          justifyContent: 'flex-start',
          gap: 1.25,
          px: 1.25,
          py: 0.75,
          borderRadius: 2.5,
          border: `1px solid ${LINE}`,
          bgcolor: '#FFFFFF',
          textAlign: 'left',
          transition: 'border-color .2s, box-shadow .2s',
          '&:hover': {
            borderColor: '#D4D4D8',
            boxShadow: '0 2px 10px rgba(24, 24, 27, 0.08)',
          },
          '&.Mui-disabled': {
            bgcolor: '#F4F4F5',
          },
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#F4F4F5',
            color: ACCENT,
          }}
        >
          {lockedReason ? (
            <LockRounded sx={{ fontSize: 16 }} />
          ) : (
            <MenuBookRounded sx={{ fontSize: 17 }} />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          {selectedLesson ? (
            <>
              <Typography
                noWrap
                sx={{ fontSize: 11, fontWeight: 700, color: MUTED, lineHeight: 1.3 }}
              >
                Chapter {selectedLesson.chapterNumber} · {selectedLesson.chapterTitle}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.35 }}
              >
                {selectedLesson.chapterNumber}.{selectedLesson.lessonNumber}{' '}
                {selectedLesson.title}
              </Typography>
            </>
          ) : (
            <Typography noWrap sx={{ fontSize: 13.5, color: MUTED }}>
              {isEmpty ? 'No lessons available' : 'Select a lesson'}
            </Typography>
          )}
        </Box>

        <KeyboardArrowDownRounded sx={{ color: MUTED, flexShrink: 0 }} />
      </ButtonBase>
    </span>
  );

  return (
    <>
      {lockedReason ? <Tooltip title={lockedReason}>{trigger}</Tooltip> : trigger}

      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: { xs: 'calc(100vw - 32px)', sm: 440 },
              maxHeight: 520,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              border: `1px solid ${LINE}`,
              boxShadow: '0 18px 50px rgba(28, 24, 48, 0.16)',
            },
          },
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${LINE}` }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Search chapters or lessons"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" sx={{ color: MUTED }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#F4F4F5',
              },
            }}
          />
        </Box>

        <Box sx={{ overflowY: 'auto', p: 1 }}>
          {filteredGroups.length === 0 && (
            <Typography variant="body2" sx={{ color: MUTED, p: 2, textAlign: 'center' }}>
              No lessons match “{query}”.
            </Typography>
          )}

          {filteredGroups.map((course) => (
            <Box key={course.courseId} sx={{ mb: 1 }}>
              {showCourseLabels && (
                <Typography
                  noWrap
                  sx={{
                    px: 1,
                    pt: 1,
                    pb: 0.75,
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    color: MUTED,
                  }}
                >
                  {course.courseTitle}
                </Typography>
              )}

              {course.chapters.map((chapter) => {
                const open = !!normalizedQuery || expanded.has(chapter.key);
                const containsSelected = chapter.lessons.some(
                  (lesson) => lesson.id === selectedLesson?.id,
                );

                return (
                  <Box key={chapter.key} sx={{ mb: 0.5 }}>
                    <ButtonBase
                      onClick={() => toggleChapter(chapter.key)}
                      aria-expanded={open}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        gap: 1.25,
                        px: 1,
                        py: 1,
                        borderRadius: 2,
                        textAlign: 'left',
                        '&:hover': { bgcolor: '#F4F4F5' },
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 28,
                          height: 28,
                          borderRadius: 1.5,
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          color: containsSelected ? '#FFFFFF' : ACCENT,
                          background: containsSelected ? AI_GRADIENT : '#F4F4F5',
                        }}
                      >
                        {chapter.chapterNumber}
                      </Box>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          noWrap
                          sx={{ fontSize: 13.5, fontWeight: 700, color: INK }}
                        >
                          {chapter.chapterTitle}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: MUTED }}>
                          {chapter.lessons.length}{' '}
                          {chapter.lessons.length === 1 ? 'lesson' : 'lessons'}
                        </Typography>
                      </Box>

                      <ExpandMoreRounded
                        sx={{
                          color: MUTED,
                          transition: 'transform .2s',
                          transform: open ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </ButtonBase>

                    <Collapse in={open} unmountOnExit>
                      <Box
                        sx={{
                          ml: 2.75,
                          pl: 1.5,
                          my: 0.5,
                          borderLeft: `2px solid ${LINE}`,
                        }}
                      >
                        {chapter.lessons.map((lesson) => {
                          const selected = lesson.id === selectedLesson?.id;

                          return (
                            <ButtonBase
                              key={lesson.id}
                              onClick={() => {
                                onSelect(lesson.id);
                                setAnchorEl(null);
                              }}
                              sx={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                gap: 1,
                                px: 1.25,
                                py: 0.9,
                                mb: 0.25,
                                borderRadius: 1.5,
                                textAlign: 'left',
                                bgcolor: selected ? '#FFF1E8' : 'transparent',
                                '&:hover': {
                                  bgcolor: selected ? '#FFE4D3' : '#F4F4F5',
                                },
                              }}
                            >
                              <PlayCircleOutlineRounded
                                sx={{
                                  fontSize: 17,
                                  color: selected ? PRIMARY : '#A1A1AA',
                                }}
                              />
                              <Typography
                                sx={{
                                  flex: 1,
                                  fontSize: 13,
                                  fontWeight: selected ? 700 : 500,
                                  color: selected ? '#C2410C' : INK,
                                }}
                              >
                                <Box component="span" sx={{ color: MUTED, mr: 0.75 }}>
                                  {lesson.chapterNumber}.{lesson.lessonNumber}
                                </Box>
                                {lesson.title}
                              </Typography>
                              {selected && (
                                <CheckRounded sx={{ fontSize: 17, color: PRIMARY }} />
                              )}
                            </ButtonBase>
                          );
                        })}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
}

/**
 * Decode HTML entities that may appear literally in stored messages
 * (e.g. "&#x20;") so they render as normal text.
 */
function decodeEntities(text: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };

  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(parseInt(dec, 10)),
    )
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, name: string) => named[name])
    .replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
}

interface MarkdownCodeProps {
  className?: string;
  children?: ReactNode;
}

function MarkdownCode({ className, children }: MarkdownCodeProps) {
  const [copied, setCopied] = useState(false);

  const language = /language-(\w+)/.exec(className || '')?.[1];

  const code = String(children).replace(/\n$/, '');

  if (!language) {
    return (
      <code
        style={{
          background: '#F3EFEC',
          padding: '3px 6px',
          borderRadius: 5,
          fontSize: '0.9em',
          fontFamily: 'monospace',
        }}
      >
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Unable to copy code:', error);
    }
  };

  return (
    <Box
      sx={{
        my: 2,
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: '#282C34',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#21252B',
          borderBottom: '1px solid #3A3F4B',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#ABB2BF',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {language}
        </Typography>

        <Button
          size="small"
          onClick={() => void handleCopy()}
          startIcon={
            copied ? <CheckRounded /> : <ContentCopyRounded />
          }
          sx={{
            color: copied ? '#98C379' : '#ABB2BF',
            textTransform: 'none',
            fontSize: 12,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          {copied ? 'Copied!' : 'Copy code'}
        </Button>
      </Stack>

      <SyntaxHighlighter
        language={language}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '18px',
          background: '#282C34',
          fontSize: '13px',
          lineHeight: 1.7,
          overflowX: 'auto',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </Box>
  );
}

function AiAssistantPage() {
  const navigate = useNavigate();
  const [, setEnrollments] = useState<Enrollment[]>([]);
  const [availableLessons, setAvailableLessons] = useState<AvailableLesson[]>([]);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [messages, setMessages] = useState<AiMessage[]>([]);

  const [mode, setMode] = useState<AiChatMode>('LESSON');
  const [selectedLessonId, setSelectedLessonId] = useState<number | ''>('');
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const conversationsRequestRef = useRef(0);
  const conversationDetailsRequestRef = useRef(0);
  const isLessonMode = mode === 'LESSON';
  const canChat = isLessonMode
    ? !!selectedLessonId && availableLessons.length > 0
    : true;

  const selectedLesson = useMemo(
    () => availableLessons.find(
      (lesson) => lesson.id === selectedLessonId,
    ),
    [availableLessons, selectedLessonId],
  );

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const enrollmentResult = await getMyEnrollments();

      setEnrollments(enrollmentResult);

      const courseResults = await Promise.allSettled(
        enrollmentResult.map((enrollment) =>
          getCourseById(enrollment.course.id),
        ),
      );

      const lessons: AvailableLesson[] = [];

      courseResults.forEach((result) => {
        if (result.status !== 'fulfilled') {
          console.error('Unable to load an enrolled course:', result.reason);
          return;
        }

        const course = result.value;

        const chapters = [...(course.chapters ?? [])].sort(
          (a, b) => a.order - b.order,
        );

        chapters.forEach((chapter, chapterIndex) => {
          const chapterLessons = [...(chapter.lessons ?? [])].sort(
            (a, b) => a.order - b.order,
          );

          chapterLessons.forEach((lesson, lessonIndex) => {
            lessons.push({
              ...lesson,
              courseId: course.id,
              courseTitle: course.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              chapterNumber: chapterIndex + 1,
              lessonNumber: lessonIndex + 1,
            });
          });
        });
      });

      lessons.sort((a, b) => {
        const courseComparison = a.courseTitle.localeCompare(b.courseTitle);

        if (courseComparison !== 0) return courseComparison;

        if (a.courseId !== b.courseId) return a.courseId - b.courseId;

        if (a.chapterNumber !== b.chapterNumber) {
          return a.chapterNumber - b.chapterNumber;
        }

        return a.lessonNumber - b.lessonNumber;
      });

      setAvailableLessons(lessons);

      setSelectedLessonId((previous) =>
        previous !== '' && lessons.some((lesson) => lesson.id === previous)
          ? previous
          : lessons[0]?.id ?? '',
      );
    } catch (err) {
      console.error('Failed to load AI Assistant:', err);
      setError('Unable to load your courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConversations = useCallback(async (chatMode: AiChatMode) => {
    const requestId = ++conversationsRequestRef.current;
    setLoadingConversations(true);

    try {
      const result = await getAiConversations(chatMode);

      // Ignore an older response if a newer mode request has started.
      if (requestId !== conversationsRequestRef.current) return;

      setConversations(result);
    } catch (err) {
      if (requestId !== conversationsRequestRef.current) return;

      console.error('Failed to load conversations:', err);
      setError('Unable to load your conversations. Please try again.');
    } finally {
      if (requestId === conversationsRequestRef.current) {
        setLoadingConversations(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    void loadConversations(mode);
  }, [mode, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, sending]);

  const resetChat = () => {
    conversationDetailsRequestRef.current += 1;
    setLoadingConversation(false);
    setConversationId(null);
    setMessages([]);
    setMessage('');
    setNotice('');
    setError('');
  };

  const handleNewChat = () => {
    resetChat();

    if (availableLessons.length > 0) {
      setSelectedLessonId(availableLessons[0].id);
    }
  };

  const handleModeChange = (nextMode: AiChatMode | null) => {
    if (!nextMode || nextMode === mode || sending) return;

    resetChat();
    conversationsRequestRef.current += 1;
    setLoadingConversations(false);
    setConversations([]);
    setMode(nextMode);
  };

  const handleSelectConversation = async (id: number) => {
    if (sending || loadingConversation) return;

    const requestedMode = mode;
    const requestId = ++conversationDetailsRequestRef.current;

    setLoadingConversation(true);
    setError('');
    setNotice('');

    try {
      const conversation = await getAiConversation(id);

      // Ignore results from an outdated request or a different mode.
      if (
        requestId !== conversationDetailsRequestRef.current ||
        requestedMode !== mode
      ) {
        return;
      }

      if (conversation.mode !== requestedMode) {
        setError('This conversation belongs to a different AI mode.');
        return;
      }

      setConversationId(conversation.id);
      setMessages(conversation.messages);

      const { lessonId } = conversation;

      if (
        lessonId !== null &&
        availableLessons.some((lesson) => lesson.id === lessonId)
      ) {
        setSelectedLessonId(lessonId);
      }
    } catch (err) {
      if (requestId !== conversationDetailsRequestRef.current) return;

      console.error('Failed to load conversation:', err);
      setError('Unable to load this conversation. Please try again.');
    } finally {
      if (requestId === conversationDetailsRequestRef.current) {
        setLoadingConversation(false);
      }
    }
  };

  const handleDeleteConversation = async (id: number) => {
    if (sending || deletingId !== null) return;

    setDeletingId(id);
    setError('');

    try {
      await deleteAiConversation(id);

      setConversations((previous) =>
        previous.filter((conversation) => conversation.id !== id),
      );

      if (conversationId === id) {
        handleNewChat();
      }

      setNotice('Conversation deleted successfully.');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Unable to delete this conversation.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || sending) return;

    if (isLessonMode && !selectedLessonId) {
      setError('Please select a lesson before starting a conversation.');
      return;
    }

    const sentMode = mode;
    const sentLessonId = selectedLessonId;
    const sentConversationId = conversationId;

    const userMessageId = Date.now();
    const assistantMessageId = userMessageId + 1;

    const currentMessage: AiMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    const assistantMessage: AiMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [
      ...previous,
      currentMessage,
      assistantMessage,
    ]);

    setMessage('');
    setSending(true);
    setError('');
    setNotice('');

    let streamFailed = false;

    try {
      const payload =
        sentMode === 'LESSON'
          ? {
              mode: 'LESSON' as const,
              lessonId: Number(sentLessonId),
              message: trimmedMessage,
              ...(sentConversationId
                ? { conversationId: sentConversationId }
                : {}),
            }
          : {
              mode: 'GENERAL' as const,
              message: trimmedMessage,
              ...(sentConversationId
                ? { conversationId: sentConversationId }
                : {}),
            };

      await streamAiMessage(payload, (event) => {
        if (event.type === 'start') {
          setConversationId(event.conversationId);
        }

        if (event.type === 'chunk') {
          setMessages((previous) =>
            previous.map((item) =>
              item.id === assistantMessageId
                ? {
                    ...item,
                    content: item.content + event.text,
                  }
                : item,
            ),
          );
        }

        if (event.type === 'done') {
          setConversationId(event.conversationId);
        }

        if (event.type === 'error') {
          streamFailed = true;
          setError(event.message);
        }
      });

      if (streamFailed) {
        setMessages((previous) =>
          previous.filter(
            (item) => item.id !== assistantMessageId,
          ),
        );
      }

      await loadConversations(sentMode);
    } catch (err) {
      console.error('Failed to stream AI message:', err);

      setMessages((previous) =>
        previous.filter(
          (item) => item.id !== assistantMessageId,
        ),
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to get an AI response. Your message may have been saved.',
      );

      await loadConversations(sentMode);
    } finally {
      setSending(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
  };

  const lessonGroups = useMemo<CourseGroup[]>(() => {
    const courses: CourseGroup[] = [];

    availableLessons.forEach((lesson) => {
      let course = courses.find((item) => item.courseId === lesson.courseId);

      if (!course) {
        course = {
          courseId: lesson.courseId,
          courseTitle: lesson.courseTitle,
          chapters: [],
        };
        courses.push(course);
      }

      const key = chapterKeyOf(lesson);
      let chapter = course.chapters.find((item) => item.key === key);

      if (!chapter) {
        chapter = {
          key,
          chapterId: lesson.chapterId,
          chapterTitle: lesson.chapterTitle,
          chapterNumber: lesson.chapterNumber,
          lessons: [],
        };
        course.chapters.push(chapter);
      }

      chapter.lessons.push(lesson);
    });

    return courses;
  }, [availableLessons]);

  if (loading) {
    return (
      <Box
        minHeight="70vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <CircularProgress sx={{ color: PRIMARY }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: {
          xs: 'calc(100vh - 80px)',
          md: 'calc(100vh - 32px)',
        },
        minHeight: 600,
        bgcolor: '#F4F4F5',
        overflow: 'hidden',
      }}
    >
      {/* Conversation Sidebar */}
      <Box
        sx={{
          width: { xs: 156, sm: 230, md: 272 },
          flexShrink: 0,
          bgcolor: SIDEBAR_BG,
          backgroundImage:
            'linear-gradient(180deg, #FFFFFF 0%, #F4F4F5 100%)',
          borderRight: `1px solid ${SIDEBAR_LINE}`,
          display: 'flex',
          flexDirection: 'column',
          color: SIDEBAR_TEXT,
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddRounded />}
            onClick={handleNewChat}
            sx={{
              background: AI_GRADIENT,
              borderRadius: 2.5,
              py: 1.1,
              textTransform: 'none',
              fontWeight: 700,
              boxShadow: '0 6px 20px rgba(242, 106, 33, 0.28)',
              '&:hover': {
                background: AI_GRADIENT,
                filter: 'brightness(1.08)',
                boxShadow: '0 8px 24px rgba(242, 106, 33, 0.38)',
              },
            }}
          >
            New Chat
          </Button>
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, pt: 1, pb: 1 }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: isLessonMode ? PRIMARY : ACCENT,
            }}
          />
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.2,
              color: SIDEBAR_MUTED,
            }}
          >
            {isLessonMode ? 'LESSON CHATS' : 'GENERAL CHATS'}
          </Typography>
        </Stack>

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 1,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#D4D4D8',
              borderRadius: 3,
            },
          }}
        >
          {loadingConversations && conversations.length === 0 ? (
            <Box display="flex" justifyContent="center" sx={{ p: 2 }}>
              <CircularProgress size={20} sx={{ color: PRIMARY }} />
            </Box>
          ) : conversations.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ p: 2, color: SIDEBAR_MUTED }}
            >
              No conversations yet. Start a new chat!
            </Typography>
          ) : (
            conversations.map((conversation) => {
              const active = conversationId === conversation.id;

              return (
                <Box
                  key={conversation.id}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 2,
                    mb: 0.25,
                    bgcolor: active ? '#FFF1E8' : 'transparent',
                    '&::before': active
                      ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: 10,
                          bottom: 10,
                          width: 3,
                          borderRadius: 2,
                          background: AI_GRADIENT,
                        }
                      : undefined,
                    '&:hover': {
                      bgcolor: active ? '#FFE8DA' : 'rgba(24,24,27,0.05)',
                    },
                    '&:hover .delete-btn': { opacity: 1 },
                  }}
                >
                  <Button
                    onClick={() =>
                      void handleSelectConversation(conversation.id)
                    }
                    disabled={loadingConversation || sending}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      textTransform: 'none',
                      color: SIDEBAR_TEXT,
                      px: 1.5,
                      py: 1,
                      '&.Mui-disabled': { color: SIDEBAR_TEXT, opacity: 0.6 },
                    }}
                  >
                    <Box sx={{ minWidth: 0, width: '100%' }}>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 13.5,
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        {conversation.title ||
                          conversation.lessonTitle ||
                          'General chat'}
                      </Typography>

                      <Typography
                        noWrap
                        display="block"
                        sx={{ fontSize: 11.5, color: SIDEBAR_MUTED }}
                      >
                        {conversation.lessonTitle ?? 'General'}
                      </Typography>
                    </Box>
                  </Button>

                  <Tooltip title="Delete conversation">
                    <span>
                      <IconButton
                        className="delete-btn"
                        size="small"
                        disabled={deletingId === conversation.id || sending}
                        onClick={() =>
                          void handleDeleteConversation(conversation.id)
                        }
                        sx={{
                          mr: 0.5,
                          color: SIDEBAR_MUTED,
                          opacity: active ? 1 : { xs: 1, md: 0 },
                          transition: 'opacity .15s, color .15s',
                          '&:hover': { color: '#DC2626' },
                          '&.Mui-disabled': { color: SIDEBAR_MUTED },
                        }}
                      >
                        {deletingId === conversation.id ? (
                          <CircularProgress size={16} sx={{ color: SIDEBAR_MUTED }} />
                        ) : (
                          <DeleteOutlineRounded fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              );
            })
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: `1px solid ${SIDEBAR_LINE}` }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PsychologyAltRounded sx={{ color: ACCENT, fontSize: 20 }} />

            <Typography sx={{ fontSize: 12, color: SIDEBAR_MUTED }}>
              Ask questions. Learn better.
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* Main Chat Area */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Compact Header */}
        <Box
          sx={{
            position: 'relative',
            bgcolor: '#FFFFFF',
            borderBottom: `1px solid ${LINE}`,
            boxShadow: '0 1px 3px rgba(24, 24, 27, 0.04)',
            px: { xs: 1.5, md: 2.5 },
            py: 1.25,
            minHeight: 68,
            display: 'flex',
            alignItems: 'center',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            columnGap: 2,
            rowGap: 1.25,
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -1,
              height: 2,
              background: AI_GRADIENT,
              opacity: 0.85,
            },
          }}
        >
          {/* Brand */}
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ minWidth: 0, flex: { md: '1 1 auto' } }}
          >
            <Tooltip title="Back to dashboard">
              <IconButton
                size="small"
                aria-label="Back to dashboard"
                onClick={() => navigate('/student')}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  border: `1px solid ${LINE}`,
                  color: INK,
                  '&:hover': {
                    bgcolor: '#F4F4F5',
                    borderColor: '#D4D4D8',
                  },
                }}
              >
                <ArrowBackRounded fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                background: AI_GRADIENT,
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(242, 106, 33, 0.3)',
              }}
            >
              <HubRounded sx={{ fontSize: 19 }} />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ fontSize: 15, fontWeight: 800, color: INK, lineHeight: 1.25 }}
              >
                AI Learning Assistant
              </Typography>
              <Typography
                noWrap
                sx={{
                  fontSize: 11.5,
                  color: MUTED,
                  display: { xs: 'none', xl: 'block' },
                }}
              >
                {MODE_COPY[mode].subtitle}
              </Typography>
            </Box>
          </Stack>

          {/* Mode toggle */}
          <Box
            role="radiogroup"
            aria-label="Assistant mode"
            sx={{
              display: 'flex',
              p: 0.5,
              borderRadius: 999,
              bgcolor: '#F4F4F5',
              border: `1px solid ${LINE}`,
              flexShrink: 0,
            }}
          >
            {MODE_OPTIONS.map((option) => {
              const selected = mode === option.value;
              const Icon = option.icon;

              return (
                <Tooltip key={option.value} title={option.description}>
                  <ButtonBase
                    role="radio"
                    aria-checked={selected}
                    onClick={() => handleModeChange(option.value)}
                    sx={{
                      gap: 0.75,
                      px: 1.5,
                      py: 0.6,
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 700,
                      color: selected ? INK : MUTED,
                      bgcolor: selected ? '#FFFFFF' : 'transparent',
                      boxShadow: selected
                        ? '0 1px 4px rgba(28, 24, 48, 0.12)'
                        : 'none',
                      cursor: sending ? 'not-allowed' : 'pointer',
                      opacity: sending && !selected ? 0.6 : 1,
                      transition: 'all .2s',
                      '&.Mui-focusVisible': {
                        boxShadow: '0 0 0 3px rgba(242,106,33,0.3)',
                      },
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: 16,
                        color: selected
                          ? option.value === 'LESSON'
                            ? PRIMARY
                            : ACCENT
                          : 'inherit',
                      }}
                    />
                    {option.label}
                  </ButtonBase>
                </Tooltip>
              );
            })}
          </Box>

          {/* Lesson picker */}
          {isLessonMode && (
            <Box
              sx={{
                flex: { xs: '1 1 100%', md: '0 1 380px' },
                minWidth: 0,
                display: 'flex',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <LessonPicker
                  groups={lessonGroups}
                  selectedLesson={selectedLesson}
                  disabled={
                    availableLessons.length === 0 ||
                    !!conversationId ||
                    loadingConversation ||
                    sending
                  }
                  lockedReason={
                    conversationId
                      ? 'This conversation is linked to its original lesson. Start a new chat to select a different lesson.'
                      : undefined
                  }
                  onSelect={(lessonId) => setSelectedLessonId(lessonId)}
                />
              </Box>
            </Box>
          )}

        </Box>

        {isLessonMode && availableLessons.length === 0 && (
          <Alert
            severity="info"
            sx={{ borderRadius: 0, borderBottom: `1px solid ${LINE}` }}
            action={
              <Button
                size="small"
                onClick={() => handleModeChange('GENERAL')}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Use General AI
              </Button>
            }
          >
            Lesson Mode needs an enrolled course. Enroll in a course from
            your dashboard, or switch to General AI to ask anything.
          </Alert>
        )}

        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, md: 4 },
            py: 3,
            backgroundImage: 'radial-gradient(#D9D9DE 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        >
          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{ mb: 2, borderRadius: 2, maxWidth: 850, mx: 'auto' }}
            >
              {error}
            </Alert>
          )}

          {notice && (
            <Alert
              severity="success"
              onClose={() => setNotice('')}
              sx={{ mb: 2, borderRadius: 2, maxWidth: 850, mx: 'auto' }}
            >
              {notice}
            </Alert>
          )}

          {loadingConversation ? (
            <Box
              minHeight="40vh"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : messages.length === 0 ? (
            <Box
              sx={{
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: 680,
                mx: 'auto',
              }}
            >
              <HelloBot />

              <Typography
                sx={{
                  fontSize: { xs: 22, md: 26 },
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: -0.3,
                }}
              >
                Your AI Learning{' '}
                <Box
                  component="span"
                  sx={{
                    background: AI_GRADIENT,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Companion
                </Box>
              </Typography>

              <Typography
                sx={{ mt: 1, mb: 3, lineHeight: 1.7, color: MUTED, fontSize: 14.5 }}
              >
                {isLessonMode && selectedLesson ? (
                  <>
                    Now learning{' '}
                    <Box component="span" sx={{ color: INK, fontWeight: 700 }}>
                      {selectedLesson.title}
                    </Box>
                    . {MODE_COPY[mode].intro}
                  </>
                ) : (
                  MODE_COPY[mode].intro
                )}
              </Typography>

              {isLessonMode && availableLessons.length === 0 ? (
                <Alert severity="info" sx={{ textAlign: 'left' }}>
                  You don't have any lessons available from your enrolled
                  courses yet.
                </Alert>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1.25,
                  }}
                >
                  {SUGGESTED_PROMPTS[mode].map((prompt) => (
                    <Paper
                      key={prompt}
                      elevation={0}
                      onClick={() => handlePromptClick(prompt)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        textAlign: 'left',
                        border: `1px solid ${LINE}`,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        gap: 1,
                        alignItems: 'flex-start',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#D4D4D8',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 18px rgba(24, 24, 27, 0.12)',
                        },
                      }}
                    >
                      <AutoAwesomeRounded
                        sx={{ fontSize: 16, color: ACCENT, mt: 0.25 }}
                      />
                      <Typography sx={{ fontSize: 13.5, color: INK }}>
                        {prompt}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <Stack spacing={3} sx={{ maxWidth: 850, mx: 'auto' }}>
              {messages.map((item) => {
                const isUser = item.role === 'user';
                const isPending = !isUser && sending && item.content === '';

                return (
                  <Stack
                    key={item.id}
                    direction="row"
                    spacing={1.5}
                    justifyContent={isUser ? 'flex-end' : 'flex-start'}
                    alignItems="flex-start"
                  >
                    {!isUser && <AiAvatar />}

                    <Paper
                      elevation={0}
                      sx={{
                        maxWidth: { xs: '90%', sm: '82%' },
                        minWidth: 0,
                        px: 2,
                        py: 1.5,
                        borderRadius: 3,
                        borderTopLeftRadius: isUser ? 12 : 4,
                        borderTopRightRadius: isUser ? 4 : 12,
                        background: isUser
                          ? 'linear-gradient(135deg, #3F3F46 0%, #18181B 100%)'
                          : '#FFFFFF',
                        color: isUser ? '#FFFFFF' : INK,
                        border: isUser ? 'none' : `1px solid ${LINE}`,
                        boxShadow: isUser
                          ? '0 6px 18px rgba(24, 24, 27, 0.22)'
                          : '0 2px 10px rgba(28, 24, 48, 0.04)',
                      }}
                    >
                      {isPending ? (
                        <TypingDots />
                      ) : (
                        <>
                      <Box
  sx={{
    fontSize: 14,
    lineHeight: 1.85,
    overflowWrap: 'anywhere',

    '& p': {
      margin: '0 0 12px',
      '&:last-child': {
        marginBottom: 0,
      },
    },

    '& h1, & h2, & h3': {
      fontWeight: 800,
      lineHeight: 1.4,
      mt: 2,
      mb: 1,
    },

    '& h1': { fontSize: 22 },
    '& h2': { fontSize: 19 },
    '& h3': { fontSize: 16 },

    '& ul, & ol': {
      pl: 3,
      my: 1,
    },

    '& li': {
      mb: 0.5,
    },

    '& strong': {
      fontWeight: 800,
    },

    '& blockquote': {
      borderLeft: `3px solid ${ACCENT}`,
      pl: 2,
      ml: 0,
      color: 'text.secondary',
    },

    '& code': {
      bgcolor: isUser
        ? 'rgba(255,255,255,0.18)'
        : '#F4F4F5',
      color: 'inherit',
      px: 0.7,
      py: 0.3,
      borderRadius: 1,
      fontFamily: 'monospace',
      fontSize: '0.9em',
    },

    '& pre': {
      bgcolor: isUser ? '#09090B' : '#28231F',
      color: '#FFFFFF',
      p: 2,
      borderRadius: 2,
      overflowX: 'auto',
      my: 1.5,
      '& code': {
        bgcolor: 'transparent',
        color: 'inherit',
        p: 0,
      },
    },

    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      my: 1.5,
    },

    '& th, & td': {
      border: `1px solid ${LINE}`,
      p: 1,
      textAlign: 'left',
    },

    '& th': {
      bgcolor: isUser ? '#09090B' : '#F4F4F5',
      fontWeight: 800,
    },

    '& a': {
      color: isUser ? '#FFFFFF' : ACCENT,
      textDecoration: 'underline',
    },
  }}
>
 <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code: MarkdownCode,
  }}
>
  {decodeEntities(item.content)}
</ReactMarkdown>
</Box>

                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          textAlign: 'right',
                          color: isUser
                            ? 'rgba(255,255,255,0.75)'
                            : 'text.secondary',
                        }}
                      >
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                        </>
                      )}
                    </Paper>

                    {isUser && (
                      <Avatar
                        sx={{
                          bgcolor: '#E4E4E7',
                          color: '#3F3F46',
                          width: 34,
                          height: 34,
                        }}
                      >
                        <PersonRounded fontSize="small" />
                      </Avatar>
                    )}
                  </Stack>
                );
              })}

              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Message Input */}
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.92)',
            borderTop: `1px solid ${LINE}`,
            px: { xs: 2, md: 4 },
            pt: 1.5,
            pb: 1.25,
          }}
        >
          <Box sx={{ maxWidth: 850, mx: 'auto' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                p: 0.75,
                pl: 0.5,
                borderRadius: 3.5,
                border: `1px solid ${LINE}`,
                bgcolor: '#FFFFFF',
                boxShadow: '0 4px 20px rgba(28, 24, 48, 0.06)',
                transition: 'border-color .2s, box-shadow .2s',
                '&:focus-within': {
                  borderColor: '#D4D4D8',
                  boxShadow: '0 4px 24px rgba(24, 24, 27, 0.14)',
                },
              }}
            >
              <TextField
                fullWidth
                multiline
                maxRows={5}
                variant="standard"
                placeholder={
                  !isLessonMode
                    ? 'Ask me anything...'
                    : selectedLesson
                      ? `Ask anything about ${selectedLesson.title}...`
                      : 'Select a lesson to start asking questions...'
                }
                value={message}
                inputProps={{ maxLength: 3000 }}
                InputProps={{ disableUnderline: true }}
                disabled={!canChat || sending || loadingConversation}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendMessage();
                  }
                }}
                sx={{
                  px: 1.25,
                  py: 1,
                  '& .MuiInputBase-input': { fontSize: 14.5 },
                }}
              />

              <Tooltip title="Send message">
                <span>
                  <IconButton
                    onClick={() => void handleSendMessage()}
                    disabled={!message.trim() || !canChat || sending}
                    sx={{
                      width: 42,
                      height: 42,
                      background: AI_GRADIENT,
                      color: '#FFFFFF',
                      borderRadius: 2.5,
                      '&:hover': {
                        background: AI_GRADIENT,
                        filter: 'brightness(1.08)',
                      },
                      '&.Mui-disabled': {
                        background: '#E4E4E7',
                        color: '#A1A1AA',
                      },
                    }}
                  >
                    {sending ? (
                      <CircularProgress size={18} sx={{ color: '#A1A1AA' }} />
                    ) : (
                      <SendRounded fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            <Typography
              sx={{
                display: 'block',
                mt: 0.75,
                textAlign: 'center',
                fontSize: 11.5,
                color: MUTED,
              }}
            >
              AI responses can sometimes be inaccurate. Verify important
              information with your learning materials.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AiAssistantPage;
