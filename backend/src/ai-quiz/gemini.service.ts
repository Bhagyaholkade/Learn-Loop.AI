
import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  GeneratedQuizResponse,
  GeneratedQuestion,
} from './interfaces/generated-question.interface';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenAI;
  private readonly model: string;
  private readonly fallbackModel: string;

  /** Optional non-Gemini fallback (Groq), used when every Gemini model fails */
  private readonly groqApiKey?: string;
  private readonly groqModel: string;
  private readonly groqReasoningEffort: string;

  /** Optional OpenRouter fallback: free models tried in order after Groq */
  private readonly openRouterApiKey?: string;
  private readonly openRouterModels: string[];
  /** Set when OpenRouter's account-wide free daily limit is hit */
  private openRouterBlockedUntil = 0;
  /** Set when Groq's daily token/request limit is hit */
  private groqBlockedUntil = 0;

  /** Per-model time limit on OpenRouter, so one slow free model can't use up the whole request */
  private readonly OPENROUTER_MODEL_TIMEOUT_MS = 60_000;

  /** Parses "try again in 1h2m3.5s" / "7.5s" / "12m30s" into ms. */
  private parseWaitMs(message: string): number | null {
    const match = /try again in ((?:\d+h)?(?:\d+m)?(?:\d+(?:\.\d+)?s)?)/i.exec(message);
    if (!match || !match[1]) {
      return null;
    }
    const part = (unit: string) =>
      parseFloat(new RegExp(`(\\d+(?:\\.\\d+)?)${unit}`).exec(match[1])?.[1] ?? '0');
    const ms = (part('h') * 3600 + part('m') * 60 + part('s')) * 1000;
    return ms > 0 ? Math.ceil(ms) : null;
  }

  /**
   * How long to skip a Gemini model after it reports overload (503).
   * Override with GEMINI_COOLDOWN_MS.
   */
  private readonly OVERLOAD_COOLDOWN_MS: number;

  /** model name -> when it may be tried again, plus the error that caused it */
  private readonly modelCooldowns = new Map<string, { until: number; error: any }>();

  /** Maximum number of retry attempts per model */
  private readonly MAX_RETRIES = 3;

  /**
   * Per-request timeout. Large JSON generations (e.g. a 6x5 course outline)
   * can legitimately take well over a minute, so default to 3 minutes.
   * Override with GEMINI_TIMEOUT_MS.
   */
  private readonly REQUEST_TIMEOUT_MS: number;

  /** Base delay in ms for exponential backoff (doubles each attempt) */
  private readonly BASE_DELAY_MS = 1000;

  /** Maximum delay cap in ms to avoid excessive waits */
  private readonly MAX_DELAY_MS = 30_000;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing in environment variables');
    }

    const configuredTimeout = Number(
      this.configService.get<string>('GEMINI_TIMEOUT_MS'),
    );
    this.REQUEST_TIMEOUT_MS =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : 180_000;

    const configuredCooldown = Number(
      this.configService.get<string>('GEMINI_COOLDOWN_MS'),
    );
    this.OVERLOAD_COOLDOWN_MS =
      Number.isFinite(configuredCooldown) && configuredCooldown > 0
        ? configuredCooldown
        : 120_000;

    this.genAI = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: this.REQUEST_TIMEOUT_MS },
    });

    this.model = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-3.6-flash',
    );

    this.fallbackModel = this.configService.get<string>(
      'GEMINI_FALLBACK_MODEL',
      'gemini-3.5-flash',
    );

    const groqKey = this.configService.get<string>('GROQ_API_KEY')?.trim();
    this.groqApiKey =
      groqKey && !groqKey.startsWith('paste_') ? groqKey : undefined;
    this.groqModel =
      this.configService.get<string>('GROQ_MODEL')?.trim() ||
      'openai/gpt-oss-120b';
    this.groqReasoningEffort =
      this.configService.get<string>('GROQ_REASONING_EFFORT')?.trim() || 'low';

    const openRouterKey = this.configService
      .get<string>('OPENROUTER_API_KEY')
      ?.trim();
    this.openRouterApiKey =
      openRouterKey && !openRouterKey.startsWith('paste_')
        ? openRouterKey
        : undefined;
    // Best quality first; `openrouter/free` lets OpenRouter pick any free model.
    this.openRouterModels = (
      this.configService.get<string>('OPENROUTER_MODELS') ||
      [
        // Fastest first: OpenRouter is the last fallback, so speed matters most.
        'baidu/ernie-5.5-flash-preview:free',
        'openrouter/free',
        'google/gemma-4-31b-it:free',
        'nvidia/nemotron-3-ultra-550b-a55b:free',
        'nvidia/nemotron-3.5-super-vl:free',
      ].join(',')
    )
      .split(',')
      .map((model) => model.trim())
      .filter(Boolean);
  }

  private classifyError(
    error: any,
  ): 'timeout' | 'rate_limit' | 'overloaded' | 'network' | 'other' {
    const status = error?.status;
    const code = error?.cause?.code ?? error?.code;

    if (
      error?.name === 'AbortError' ||
      error?.name === 'TimeoutError' ||
      status === 504 ||
      /abort|timed? ?out|deadline/i.test(String(error?.message))
    ) {
      return 'timeout';
    }
    if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(String(error?.message))) {
      return 'rate_limit';
    }
    if ([500, 502, 503].includes(status)) {
      return 'overloaded';
    }
    if (['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
      return 'network';
    }
    return 'other';
  }

  private isRetryableError(error: any): boolean {
    return this.classifyError(error) !== 'other';
  }

  /** Short description of the underlying error for logs. */
  private describeError(error: any): string {
    const status = error?.status ?? error?.cause?.code ?? error?.name ?? 'unknown';
    let message = String(error?.message ?? error);

    // Provider errors are JSON bodies; keep only the human-readable message.
    try {
      const parsed = JSON.parse(message);
      message = String(parsed?.error?.message ?? parsed?.message ?? message);
    } catch {
      // Not clean JSON (prefixed or truncated body): pull out "message" directly.
      const match = /"message"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(message);
      if (match) {
        message = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }

    // Gemini quota errors: keep the first sentence, drop the boilerplate links.
    message = message.split(/\n|\. For more information/)[0].trim();
    return `[${status}] ${message.slice(0, 200)}`;
  }

  /** 80193000 -> "22h 17m", 95000 -> "1m 35s" */
  private formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours) return `${hours}h ${minutes}m`;
    if (minutes) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /** Turns a Gemini failure into an HTTP error that tells the client what went wrong. */
  private toHttpException(
    error: any,
    provider: 'Gemini' | 'Groq' | 'OpenRouter' = 'Gemini',
  ): HttpException {
    const name = provider === 'Gemini' ? 'Gemini AI' : provider;
    switch (this.classifyError(error)) {
      case 'timeout':
        return new GatewayTimeoutException(
          `${name} took too long to respond (over ${Math.round(
            this.REQUEST_TIMEOUT_MS / 1000,
          )}s). Try fewer chapters/lessons or try again.`,
        );
      case 'rate_limit': {
        const message = String(error?.message ?? '');
        if (/PerDay/i.test(message)) {
          const delay = this.serverRetryDelayMs(error);
          const wait = delay
            ? ` Try again in about ${Math.ceil(delay / 60000)} minutes`
            : ' Try again later';
          return new HttpException(
            `${name} daily free-tier quota is used up.${wait}, or enable billing / use another API key.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        // Groq: "Please try again in 1m2.5s" / "in 7.5s"
        const groqWait = /try again in ((?:\d+h)?(?:\d+m)?\d+(?:\.\d+)?s)/i.exec(message);
        if (/tokens per day|TPD|requests per day|RPD|per-day/.test(message)) {
          return new HttpException(
            `${name} daily free-tier limit is used up.${
              groqWait ? ` Try again in ${groqWait[1]}.` : ' Try again later.'
            }`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        return new HttpException(
          groqWait
            ? `${name} rate limit exceeded. Try again in ${groqWait[1]}.`
            : `${name} rate limit exceeded. Wait a minute and try again.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      case 'overloaded':
        return new ServiceUnavailableException(
          `${name} is currently overloaded. Please try again in a few minutes.`,
        );
      case 'network':
        return new ServiceUnavailableException(
          `Could not reach ${name}. Check the server internet connection.`,
        );
      default:
        if ([401, 403].includes(error?.status)) {
          return new InternalServerErrorException(
            `${provider} API key is invalid or lacks permission. Check ${provider.toUpperCase()}_API_KEY.`,
          );
        }
        if (error?.status === 404) {
          return new InternalServerErrorException(
            `Configured ${provider} model was not found. Check the ${provider.toUpperCase()}_MODEL setting.`,
          );
        }
        return new InternalServerErrorException(
          `Failed to generate content using ${name}.`,
        );
    }
  }

  /**
   * Computes exponential backoff delay with full jitter.
   * Formula: random(0, min(MAX_DELAY, BASE * 2^attempt))
   * Jitter prevents thundering-herd when many requests retry simultaneously.
   */
  private backoffDelay(attempt: number): number {
    const exponential = this.BASE_DELAY_MS * Math.pow(2, attempt - 1);
    const capped = Math.min(exponential, this.MAX_DELAY_MS);
    return Math.floor(Math.random() * capped);
  }

  /**
   * Extracts the Retry-After value (in ms) from an API error response,
   * if the server provided one. Falls back to computed backoff otherwise.
   */
  private retryAfterDelay(error: any, attempt: number): number {
    const serverDelay = this.serverRetryDelayMs(error);
    if (serverDelay !== null) {
      return serverDelay;
    }

    const retryAfterSeconds = error?.headers?.['retry-after'];
    if (retryAfterSeconds) {
      const parsed = parseInt(retryAfterSeconds, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed * 1000;
      }
    }
    return this.backoffDelay(attempt);
  }

  /**
   * Gemini puts the wait time in the error body (e.g. "retryDelay":"34s"),
   * not in a Retry-After header. Returns it in ms, or null if absent.
   */
  private serverRetryDelayMs(error: any): number | null {
    const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(
      String(error?.message ?? ''),
    );
    return match ? Math.ceil(parseFloat(match[1]) * 1000) : null;
  }

  /**
   * A quota error is worth retrying only if it clears soon (per-minute limit).
   * Daily quota errors would just burn more requests and keep the user waiting.
   */
  private isLongQuotaWait(error: any): boolean {
    if (/PerDay/i.test(String(error?.message ?? ''))) {
      return true;
    }
    const delay = this.serverRetryDelayMs(error);
    return delay !== null && delay > this.MAX_DELAY_MS;
  }

  /**
   * Puts a model on cooldown after it fails with overload / quota errors, so
   * the next requests skip it instead of re-trying it 3 times each.
   */
  private startCooldown(model: string, error: any): void {
    const kind = this.classifyError(error);
    let durationMs: number | null = null;

    if (kind === 'overloaded') {
      durationMs = this.OVERLOAD_COOLDOWN_MS;
    } else if (kind === 'rate_limit') {
      // Use Gemini's own reset time (e.g. daily quota), else a short pause.
      durationMs = this.serverRetryDelayMs(error) ?? 60_000;
    }

    if (durationMs === null) {
      return;
    }

    this.modelCooldowns.set(model, { until: Date.now() + durationMs, error });
    console.warn(
      `Gemini (${model}) paused for ${this.formatDuration(durationMs)} [${kind}]` +
        (kind === 'rate_limit' && durationMs > 60 * 60_000
          ? ' (daily quota; Google resets it at midnight Pacific time)'
          : '') +
        '; requests will skip it until then.',
    );
  }

  /** If the model is cooling down, returns an error to throw instead of calling it. */
  private cooldownError(model: string): any | null {
    const cooldown = this.modelCooldowns.get(model);
    if (!cooldown) {
      return null;
    }

    const remainingMs = cooldown.until - Date.now();
    if (remainingMs <= 0) {
      this.modelCooldowns.delete(model);
      return null;
    }

    // Re-create the original error with an up-to-date retry time so the
    // message shown to the user ("try again in N minutes") stays accurate.
    const original = cooldown.error;
    const error: any = new Error(
      String(original?.message ?? '').replace(
        /"retryDelay"\s*:\s*"\d+(?:\.\d+)?s"/,
        `"retryDelay":"${Math.ceil(remainingMs / 1000)}s"`,
      ),
    );
    error.status = original?.status;
    error.name = original?.name;
    error.cause = original?.cause;
    return error;
  }

  private async generateWithRetry(
    model: string,
    prompt: string,
    responseMimeType?: string,
  ): Promise<string> {
    const skipError = this.cooldownError(model);
    if (skipError) {
      const remaining = this.modelCooldowns.get(model)!.until - Date.now();
      console.warn(
        `Skipping Gemini (${model}): paused for another ${this.formatDuration(remaining)}.`,
      );
      throw skipError;
    }

    try {
      const text = await this.callModelWithRetries(model, prompt, responseMimeType);
      this.modelCooldowns.delete(model);
      return text;
    } catch (error) {
      if (!(error instanceof HttpException)) {
        this.startCooldown(model, error);
      }
      throw error;
    }
  }

  private async callModelWithRetries(
    model: string,
    prompt: string,
    responseMimeType?: string,
  ): Promise<string> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.genAI.models.generateContent({
          model,
          contents: prompt,
          ...(responseMimeType && { config: { responseMimeType } }),
        });

        const generatedText = response.text;

        if (!generatedText?.trim()) {
          throw new BadGatewayException(
            'Gemini returned an empty response',
          );
        }

        return generatedText;
      } catch (error: any) {
        // Non-retryable NestJS exceptions bubble up immediately
        if (error instanceof BadGatewayException) {
          throw error;
        }

        lastError = error;

        if (!this.isRetryableError(error)) {
          throw error;
        }

        const kind = this.classifyError(error);
        console.warn(
          `Gemini (${model}) attempt ${attempt}/${this.MAX_RETRIES} failed [${kind}]: ${this.describeError(error)}`,
        );

        // A timed-out request already cost REQUEST_TIMEOUT_MS; retrying the
        // same model would multiply the wait. Let the caller try the fallback.
        // Overloaded (503): Google says spikes last minutes, so retrying within
        // a second just fails again. Move on to the next model/provider now.
        if (kind === 'timeout' || kind === 'overloaded') {
          break;
        }

        // Daily quota (or a long server-requested wait): retrying now can't succeed.
        if (kind === 'rate_limit' && this.isLongQuotaWait(error)) {
          break;
        }

        if (attempt < this.MAX_RETRIES) {
          const delay = this.retryAfterDelay(error, attempt);
          console.warn(`Waiting ${delay}ms before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  async generateText(
    prompt: string,
    responseMimeType?: string,
  ): Promise<string> {
    if (!prompt?.trim()) {
      throw new BadGatewayException('Prompt cannot be empty');
    }

    try {
      return await this.generateWithRetry(
        this.model,
        prompt,
        responseMimeType,
      );
    } catch (primaryError: any) {
      if (primaryError instanceof HttpException) {
        throw primaryError;
      }

      let geminiError = primaryError;

      if (
        this.fallbackModel &&
        this.fallbackModel !== this.model &&
        this.isRetryableError(primaryError)
      ) {
        console.warn(`Switching to fallback model: ${this.fallbackModel}`);
        try {
          return await this.generateWithRetry(
            this.fallbackModel,
            prompt,
            responseMimeType,
          );
        } catch (fallbackError: any) {
          if (fallbackError instanceof HttpException) {
            throw fallbackError;
          }

          // If the fallback failed for a non-transient reason (e.g. bad model
          // name), the primary error is the more meaningful one to report.
          if (this.isRetryableError(fallbackError)) {
            geminiError = fallbackError;
          }
        }
      }

      // Other providers, each with its own separate quota.
      const failures: string[] = [
        `Gemini: ${this.toHttpException(geminiError).message}`,
      ];

      if (this.groqApiKey && Date.now() < this.groqBlockedUntil) {
        const wait = this.formatDuration(this.groqBlockedUntil - Date.now());
        console.warn(`Skipping Groq: daily limit reached, paused for another ${wait}.`);
        failures.push(`Groq: daily free limit is used up. Try again in ${wait}.`);
      } else if (this.groqApiKey) {
        console.warn(`All Gemini models failed. Switching to Groq (${this.groqModel})`);
        try {
          return await this.generateWithGroq(prompt, responseMimeType);
        } catch (groqError: any) {
          console.error(`Groq fallback failed: ${this.describeError(groqError)}`);
          failures.push(`Groq: ${this.providerErrorMessage(groqError, 'Groq')}`);

          // Daily token/request cap (TPD/RPD): no point calling Groq until it resets.
          const message = String(groqError?.message ?? '');
          if (/per day|TPD|RPD/.test(message)) {
            const wait = this.parseWaitMs(message) ?? 60 * 60_000;
            this.groqBlockedUntil = Date.now() + wait;
            console.warn(
              `Groq daily limit reached; skipping Groq for ${this.formatDuration(wait)}.`,
            );
          }
        }
      }

      if (this.openRouterApiKey && this.openRouterModels.length) {
        console.warn('Switching to OpenRouter free models');
        try {
          return await this.generateWithOpenRouter(prompt, responseMimeType);
        } catch (openRouterError: any) {
          console.error(
            `OpenRouter fallback failed: ${this.describeError(openRouterError)}`,
          );
          failures.push(
            `OpenRouter: ${this.providerErrorMessage(openRouterError, 'OpenRouter')}`,
          );
        }
      }

      if (failures.length === 1) {
        throw this.toHttpException(geminiError);
      }

      throw new ServiceUnavailableException(
        `All AI providers are unavailable right now. ${failures.join(' ')}`,
      );
    }
  }

  private providerErrorMessage(
    error: any,
    provider: 'Groq' | 'OpenRouter',
  ): string {
    return error instanceof HttpException
      ? error.message
      : this.toHttpException(error, provider).message;
  }

  /** Groq: one model; waits out short per-minute limits. */
  private generateWithGroq(
    prompt: string,
    responseMimeType?: string,
  ): Promise<string> {
    // If OpenRouter is available, don't make the user wait long on Groq.
    const hasNextProvider = !!this.openRouterApiKey && this.openRouterModels.length > 0;

    return this.callChatCompletions({
      provider: 'Groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: this.groqApiKey!,
      model: this.groqModel,
      prompt,
      responseMimeType,
      extraBody: /gpt-oss|qwen/i.test(this.groqModel)
        ? // Reasoning tokens count against Groq's free 8K tokens/minute.
          { reasoning_effort: this.groqReasoningEffort }
        : {},
      maxAttempts: hasNextProvider ? 2 : 4,
      maxWaitMs: hasNextProvider ? 15_000 : 60_000,
    });
  }

  /**
   * OpenRouter: tries each configured free model in order. A model that is
   * rate-limited, overloaded or missing is put on cooldown and skipped.
   */
  private async generateWithOpenRouter(
    prompt: string,
    responseMimeType?: string,
  ): Promise<string> {
    if (Date.now() < this.openRouterBlockedUntil) {
      const error: any = new Error(
        'OpenRouter free-model daily limit reached (cached). Try again later. per-day',
      );
      error.status = 429;
      throw error;
    }

    let lastError: any;

    for (const model of this.openRouterModels) {
      const key = `openrouter:${model}`;
      const cooldown = this.modelCooldowns.get(key);
      if (cooldown && cooldown.until > Date.now()) {
        console.warn(`Skipping OpenRouter (${model}): on cooldown.`);
        lastError = cooldown.error;
        continue;
      }

      console.warn(
        `Trying OpenRouter (${model}), up to ${this.OPENROUTER_MODEL_TIMEOUT_MS / 1000}s...`,
      );
      try {
        const text = await this.callChatCompletions({
          provider: 'OpenRouter',
          url: 'https://openrouter.ai/api/v1/chat/completions',
          apiKey: this.openRouterApiKey!,
          model,
          prompt,
          responseMimeType,
          extraBody: {},
          maxAttempts: 1,
          maxWaitMs: 0,
          timeoutMs: this.OPENROUTER_MODEL_TIMEOUT_MS,
        });
        this.modelCooldowns.delete(key);
        return text;
      } catch (error: any) {
        lastError = error;

        // Account-wide free daily cap: every free model will fail, stop now.
        if (error?.status === 429 && /per-day|per day/i.test(String(error?.message))) {
          const resetMs = Number(error?.rateLimitReset);
          this.openRouterBlockedUntil =
            Number.isFinite(resetMs) && resetMs > Date.now()
              ? resetMs
              : Date.now() + 60 * 60_000;
          console.warn(
            `OpenRouter free daily limit reached; skipping OpenRouter until ${new Date(
              this.openRouterBlockedUntil,
            ).toLocaleTimeString()}.`,
          );
          break;
        }

        // Bad/invalid output from this model: try the next one.
        const kind = error instanceof HttpException ? 'bad_output' : this.classifyError(error);
        const cooldownMs =
          [400, 404].includes(error?.status) ? 60 * 60_000 // model removed / unsupported
          : kind === 'bad_output' ? 0
          : 60_000;
        if (cooldownMs > 0) {
          this.modelCooldowns.set(key, { until: Date.now() + cooldownMs, error });
        }
      }
    }

    throw lastError ?? new Error('No OpenRouter models configured');
  }

  /**
   * Calls an OpenAI-compatible chat completions API (Groq, OpenRouter).
   * Errors are shaped like Gemini SDK errors ({ status, message }) so the
   * same classifyError / toHttpException logic applies.
   */
  private async callChatCompletions(options: {
    provider: 'Groq' | 'OpenRouter';
    url: string;
    apiKey: string;
    model: string;
    prompt: string;
    responseMimeType?: string;
    extraBody: Record<string, unknown>;
    maxAttempts: number;
    maxWaitMs: number;
    timeoutMs?: number;
  }): Promise<string> {
    const { provider, model, maxAttempts } = options;
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const startedAt = Date.now();
      try {
        const response = await fetch(options.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: options.prompt }],
            ...options.extraBody,
            ...(options.responseMimeType === 'application/json' && {
              response_format: { type: 'json_object' },
            }),
          }),
          signal: AbortSignal.timeout(options.timeoutMs ?? this.REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
          const body = await response.text();
          const error: any = new Error(body.slice(0, 1000));
          error.status = response.status;
          error.rateLimitReset = response.headers.get('x-ratelimit-reset');
          throw error;
        }

        const data: any = await response.json();

        // OpenRouter can return 200 with an error object from the upstream model.
        if (data?.error) {
          const error: any = new Error(JSON.stringify(data.error).slice(0, 1000));
          error.status = Number(data.error.code) || 502;
          throw error;
        }

        const text: string | undefined = data?.choices?.[0]?.message?.content;

        const usage = data?.usage;
        const remaining = response.headers.get('x-ratelimit-remaining-tokens');
        console.log(
          `${provider} (${data?.model ?? model}) answered in ${Date.now() - startedAt}ms` +
            (usage
              ? `, ${usage.total_tokens} tokens (prompt ${usage.prompt_tokens}, completion ${usage.completion_tokens})`
              : '') +
            (remaining ? `; tokens left this minute: ${remaining}` : ''),
        );

        if (!text?.trim()) {
          throw new BadGatewayException(`${provider} returned an empty response`);
        }

        return this.stripJsonFences(text);
      } catch (error: any) {
        if (error instanceof HttpException) {
          throw error;
        }

        lastError = error;
        const kind = this.classifyError(error);
        console.warn(
          `${provider} (${model}) attempt ${attempt}/${maxAttempts} failed [${kind}]: ${this.describeError(error)}`,
        );

        if (kind === 'other' || kind === 'timeout' || attempt === maxAttempts) {
          break;
        }

        // Daily caps won't reset within this request; give up on this provider now.
        if (/per day|per-day|TPD|RPD/.test(String(error?.message))) {
          break;
        }

        // e.g. "Please try again in 7.5s" for per-minute limits.
        const delay =
          this.parseWaitMs(String(error?.message)) ?? this.backoffDelay(attempt);

        if (delay > options.maxWaitMs) {
          break;
        }
        console.warn(`Waiting ${Math.ceil(delay)}ms for ${provider} rate limit to reset...`);
        await new Promise((resolve) => setTimeout(resolve, Math.ceil(delay) + 500));
      }
    }

    throw lastError;
  }

  /** Removes ```json fences and any text around the outer JSON object. */
  private stripJsonFences(text: string): string {
    const trimmed = text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '');
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    return start > 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  }

async generateQuizQuestions(
  lessonTitle: string,
  lessonContent: string,
  objectives: string[] | null,
  numberOfQuestions: number,
  marksPerQuestion: number,
  additionalInstructions?: string,
): Promise<GeneratedQuizResponse> {
  const prompt = `
You are an expert educational assessment creator.

Generate exactly ${numberOfQuestions} multiple-choice questions
based ONLY on the learning material provided below.

LESSON TITLE:
${lessonTitle}

LESSON CONTENT:
${lessonContent}

LEARNING OBJECTIVES:
${JSON.stringify(objectives ?? [])}

ADDITIONAL INSTRUCTIONS:
${additionalInstructions || 'Create a balanced set of conceptual and practical questions.'}

REQUIREMENTS:
1. Generate exactly ${numberOfQuestions} questions.
2. Each question must have exactly four options.
3. Only one option must be correct.
4. correctOptionIndex must be zero-based (0, 1, 2, or 3).
5. Each question must have a clear explanation.
6. Each question must have ${marksPerQuestion} marks.
7. Avoid duplicate questions.
8. Do not invent information outside the provided learning material.

RETURN ONLY VALID JSON IN THIS FORMAT:

{
  "questions": [
    {
      "questionText": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctOptionIndex": 0,
      "marks": ${marksPerQuestion},
      "explanation": "Explanation of the correct answer"
    }
  ]
}
`;

  const generatedText = await this.generateText(
    prompt,
    'application/json',
  );

  let parsedResponse: GeneratedQuizResponse;

  try {
    parsedResponse = JSON.parse(generatedText);
  } catch {
    console.error('Gemini returned invalid JSON:', generatedText);
    throw new BadGatewayException('Gemini returned invalid JSON');
  }

  if (
    !parsedResponse ||
    !Array.isArray(parsedResponse.questions) ||
    parsedResponse.questions.length !== numberOfQuestions
  ) {
    throw new BadGatewayException(
      `Gemini returned ${parsedResponse?.questions?.length ?? 0} questions, expected ${numberOfQuestions}`,
    );
  }

  const validatedQuestions: GeneratedQuestion[] =
    parsedResponse.questions.map((question, index) => {
      if (
        typeof question.questionText !== 'string' ||
        !question.questionText.trim() ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        !question.options.every(
          (option) => typeof option === 'string' && option.trim(),
        ) ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex > 3 ||
        !Number.isInteger(question.marks) ||
        question.marks !== marksPerQuestion ||
        typeof question.explanation !== 'string' ||
        !question.explanation.trim()
      ) {
        throw new BadGatewayException(
          `Invalid AI-generated question at position ${index + 1}`,
        );
      }

      return {
        questionText: question.questionText.trim(),
        options: question.options.map((option) => option.trim()),
        correctOptionIndex: question.correctOptionIndex,
        marks: question.marks,
        explanation: question.explanation.trim(),
      };
    });

  return {
    questions: validatedQuestions,
  };
}

}
