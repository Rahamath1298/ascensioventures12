/**
 * Intent parser utilizing Groq LLM with single retry and deterministic regex fallback.
 */

import { z } from 'zod';
import { sendChatCompletion, isAiConfigured } from './client.js';
import { PARSE_INTENT_SYSTEM_PROMPT } from './prompts.js';
import { parseIntentFallback } from '../engine/fallbackParser.js';
import { warn as logWarn } from '../utils/logger.js';

export const IntentSchema = z.object({
  category: z.enum(['vacation', 'school_trip', 'college_trip', 'industrial_visit']).nullable().optional(),
  destination: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  groupSize: z.coerce.number().nullable().optional(),
  students: z.coerce.number().nullable().optional(),
  chaperones: z.coerce.number().nullable().optional(),
  durationDays: z.coerce.number().nullable().optional(),
  budgetPerPerson: z.coerce.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  month: z.string().nullable().optional(),
  transport: z.enum(['bus', 'car', 'train', 'flight']).nullable().optional(),
  accommodation: z.enum(['hostel', '3star', '4star', '5star']).nullable().optional(),
  interests: z.array(z.string()).default([]),
  mustHave: z.array(z.string()).default([]),
  confidence: z.coerce.number().default(1.0)
});

/**
 * Strips markdown code block formatting if present in raw LLM output.
 * @param {string} text - Raw output string
 * @returns {string} Sanitized JSON string
 */
function cleanJsonOutput(text) {
  if (!text) return '';
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Parses user travel search query into structured intent.
 * @param {string} rawQuery - Plain English search query
 * @returns {Promise<{intent: Object, source: 'ai' | 'rules_only'}>}
 */
export async function parseIntent(rawQuery) {
  if (!isAiConfigured()) {
    return {
      intent: parseIntentFallback(rawQuery),
      source: 'rules_only'
    };
  }

  const messages = [
    { role: 'system', content: PARSE_INTENT_SYSTEM_PROMPT },
    { role: 'user', content: rawQuery }
  ];

  const requestOptions = {
    temperature: 0.2,
    max_tokens: 500
  };

  let rawAiOutput = await sendChatCompletion(messages, requestOptions);

  // Validate attempt 1
  if (rawAiOutput) {
    try {
      const parsedJson = JSON.parse(cleanJsonOutput(rawAiOutput));
      const validated = IntentSchema.parse(parsedJson);
      return { intent: validated, source: 'ai' };
    } catch (e) {
      logWarn('Initial AI intent JSON validation failed, retrying once with strict instructions', { error: e.message });
      messages.push({ role: 'assistant', content: rawAiOutput });
      messages.push({
        role: 'system',
        content: 'Your previous output was invalid JSON. Output ONLY a valid JSON object. No markdown, no backticks, no prose.'
      });
      rawAiOutput = await sendChatCompletion(messages, requestOptions);
    }
  }

  // Validate attempt 2 (retry)
  if (rawAiOutput) {
    try {
      const parsedJson = JSON.parse(cleanJsonOutput(rawAiOutput));
      const validated = IntentSchema.parse(parsedJson);
      return { intent: validated, source: 'ai' };
    } catch (e) {
      logWarn('Second AI intent attempt also failed. Falling back to rules.', { error: e.message });
    }
  }

  // Fallback to deterministic regex parser
  return {
    intent: parseIntentFallback(rawQuery),
    source: 'rules_only'
  };
}

export default parseIntent;
