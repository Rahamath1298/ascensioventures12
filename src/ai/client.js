/**
 * OpenAI-compatible HTTP client configured for Groq with strict timeout,
 * intelligent model cascade, and graceful degradation to rules-only mode.
 */

import { warn as logWarn } from '../utils/logger.js';

const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '8000', 10);

// Rate limit logging state (max once per minute)
let lastRateLimitLogTime = 0;
const RATE_LIMIT_LOG_WINDOW_MS = 60 * 1000;

/**
 * Resolves API key from standard environment variables across Netlify and local setups.
 * Supports AI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, API_KEY, and GROQ_KEY.
 * @returns {string} Clean API key or empty string
 */
export function getApiKey() {
  const standardKeys = [
    'AI_API_KEY',
    'GROQ_API_KEY',
    'OPENAI_API_KEY',
    'API_KEY',
    'GROQ_KEY',
    'GROQ_TOKEN',
    'AI_KEY'
  ];

  for (const k of standardKeys) {
    const val = process.env[k];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }

  // Dynamic discovery for custom key names containing GROQ or API_KEY
  for (const [k, v] of Object.entries(process.env)) {
    const upper = k.toUpperCase();
    if (upper.includes('GROQ') || upper.includes('API_KEY')) {
      if (v && typeof v === 'string' && v.trim().length > 0) {
        return v.trim();
      }
    }
  }

  return '';
}

/**
 * Checks whether AI service is configured with an API key.
 * @returns {boolean} True if API key is present
 */
export function isAiConfigured() {
  const key = getApiKey();
  return Boolean(key && key.length > 0);
}

/**
 * Logs rate limit notification throttled to once per 60 seconds.
 */
function logRateLimitedThrottled() {
  const now = Date.now();
  if (now - lastRateLimitLogTime > RATE_LIMIT_LOG_WINDOW_MS) {
    lastRateLimitLogTime = now;
    logWarn('AI provider rate limit reached: falling back to rules engine', {
      source: 'rules_only',
      reason: 'rate_limited'
    });
  }
}

/**
 * Performs a single chat completion HTTP request.
 * @param {Array<{role: string, content: string}>} messages - Prompt messages
 * @param {string} model - Target model identifier
 * @param {Object} [options={}] - Extra request options
 * @returns {Promise<string | null>} Completion string or null
 */
async function performRequest(messages, model, options = {}) {
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const url = `${AI_BASE_URL.replace(/\/+$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.max_tokens ?? 800,
        response_format: { type: 'json_object' },
        messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429 || response.status === 503) {
      logRateLimitedThrottled();
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logWarn('AI provider returned non-200 error status', {
        source: 'rules_only',
        reason: response.status === 401 ? 'unauthorized_api_key' : 'ai_error',
        model,
        status: response.status,
        details: response.status === 401 ? 'Invalid or rejected API key by provider' : errorText.slice(0, 160)
      });
      return null;
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      logWarn('AI call timed out: falling back to rules engine', {
        source: 'rules_only',
        reason: 'timeout',
        timeoutMs: AI_TIMEOUT_MS
      });
    } else {
      logWarn('AI network exception: falling back to rules engine', {
        source: 'rules_only',
        reason: 'ai_error',
        error: err.message
      });
    }
    return null;
  }
}

/**
 * Sends a chat completion request to Groq with automatic fallback model cascading.
 * @param {Array<{role: string, content: string}>} messages - Prompt messages
 * @param {Object} [options={}] - Extra request options
 * @returns {Promise<string | null>} Completion text content or null
 */
export async function sendChatCompletion(messages, options = {}) {
  if (!isAiConfigured()) {
    return null;
  }

  const primaryModel = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
  const fallbackModel = process.env.AI_FALLBACK_MODEL || 'llama-3.1-8b-instant';

  // Cascade through preferred model, fallback model, and active Groq chat models
  const modelsToTry = [primaryModel, fallbackModel, 'qwen/qwen3.8-27b', 'openai/gpt-oss-120b'].filter(Boolean);
  const tried = new Set();

  for (const model of modelsToTry) {
    if (tried.has(model)) continue;
    tried.add(model);

    const result = await performRequest(messages, model, options);
    if (result !== null) {
      return result;
    }
  }

  return null;
}

export default {
  isAiConfigured,
  sendChatCompletion
};
