
import api from '../api/axios';

// ==================== TYPES ====================

export type AiChatMode = 'LESSON' | 'GENERAL';

/**
 * LESSON mode requires a lessonId; GENERAL mode must NOT send one
 * (the API rejects a lessonId in GENERAL mode).
 */
export type AiChatRequest =
  | {
      mode: 'LESSON';
      lessonId: number;
      message: string;
      conversationId?: number;
    }
  | {
      mode: 'GENERAL';
      message: string;
      conversationId?: number;
    };

export interface AiChatResponse {
  success: boolean;
  data: {
    conversationId: number;
    mode?: AiChatMode;
    lessonId: number | null;
    lessonTitle: string | null;
    question: string;
    answer: string;
  };
}

export interface AiConversation {
  id: number;
  title: string | null;
  mode: AiChatMode;
  lessonId: number | null;
  lessonTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AiConversationDetails
  extends AiConversation {
  messages: AiMessage[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ==================== CHAT API ====================

export async function sendAiMessage(
  payload: AiChatRequest,
): Promise<AiChatResponse> {
  const response = await api.post<AiChatResponse>(
    '/ai-assistant/chat',
    payload,
    { timeout: 120000 },
  );

  return response.data;
}

// ==================== CONVERSATION LIST API ====================

export async function getAiConversations(
  mode?: AiChatMode,
): Promise<AiConversation[]> {
  const response = await api.get<
    ApiResponse<AiConversation[]>
  >('/ai-assistant/conversations', {
    params: mode ? { mode } : undefined,
  });

  return response.data.data;
}

// ==================== CONVERSATION DETAILS API ====================

export async function getAiConversation(
  conversationId: number,
): Promise<AiConversationDetails> {
  const response = await api.get<
    ApiResponse<AiConversationDetails>
  >(`/ai-assistant/conversations/${conversationId}`);

  return response.data.data;
}

// ==================== DELETE CONVERSATION API ====================

export async function deleteAiConversation(
  conversationId: number,
): Promise<void> {
  await api.delete(
    `/ai-assistant/conversations/${conversationId}`,
  );
}


// ==================== STREAMING TYPES ====================

export type AiStreamEvent =
  | {
      type: 'start';
      conversationId: number;
      mode: AiChatMode;
      lessonId: number | null;
      lessonTitle: string | null;
    }
  | {
      type: 'chunk';
      text: string;
    }
  | {
      type: 'done';
      conversationId: number;
    }
  | {
      type: 'error';
      statusCode?: number;
      message: string;
    };

// ==================== STREAMING CHAT API ====================

export async function streamAiMessage(
  payload: AiChatRequest,
  onEvent: (event: AiStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const baseURL =
    api.defaults.baseURL ||
    'http://localhost:3002/api/v1';

  const endpoint = `${baseURL.replace(/\/+$/, '')}/ai-assistant/chat/stream`;

  const token =
    localStorage.getItem('accessToken') ??
    sessionStorage.getItem('accessToken');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();

    let errorMessage = 'Unable to stream AI response.';

    try {
      const parsed = JSON.parse(errorText);
      errorMessage =
        parsed.message || parsed.error || errorMessage;
    } catch {
      if (errorText) errorMessage = errorText;
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error('Streaming is not supported by this response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';

  const processEvent = (rawEvent: string) => {
    const lines = rawEvent.split(/\r?\n/);

    let eventName = '';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) return;

    const dataText = dataLines.join('\n');

    try {
      const data = JSON.parse(dataText);
      const type = eventName || data.type;

      if (type === 'start') {
        onEvent({
          type: 'start',
          conversationId: data.conversationId,
          mode: data.mode,
          lessonId: data.lessonId ?? null,
          lessonTitle: data.lessonTitle ?? null,
        });
      } else if (type === 'chunk') {
        onEvent({
          type: 'chunk',
          text: data.text ?? '',
        });
      } else if (type === 'done') {
        onEvent({
          type: 'done',
          conversationId: data.conversationId,
        });
      } else if (type === 'error') {
        onEvent({
          type: 'error',
          statusCode: data.statusCode,
          message: data.message || 'AI response failed.',
        });
      }
    } catch {
      console.error('Unable to parse SSE event:', dataText);
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() ?? '';

      for (const rawEvent of events) {
        processEvent(rawEvent);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processEvent(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}

