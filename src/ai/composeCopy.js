/**
 * Grounded AI copy composer for finalizing titles, subtitles, highlights, and summaries.
 * Strictly preserves all numeric, date, and structural fields created by the rules engine.
 */

import { z } from 'zod';
import { sendChatCompletion, isAiConfigured } from './client.js';
import { COMPOSE_COPY_SYSTEM_PROMPT } from './prompts.js';
import { warn as logWarn } from '../utils/logger.js';

export const CopySchema = z.object({
  title: z.string().max(120),
  subtitle: z.string().max(150),
  highlights: z.array(z.string()).min(1).max(6),
  summary: z.string().max(500)
});

/**
 * Strips markdown code block formatting if present.
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
 * Enriches a priced package with grounded marketing copy.
 * @param {Object} enginePackage - Package built by rules engine
 * @returns {Promise<Object>} Package with copy applied
 */
export async function composeCopy(enginePackage) {
  if (!isAiConfigured()) {
    return enginePackage;
  }

  // Grounded context strictly taken from the engine's finalized package
  const promptContext = {
    title: enginePackage.title,
    category: enginePackage.category,
    destination: enginePackage.destination,
    duration: enginePackage.duration,
    highlights: enginePackage.highlights,
    inclusions: enginePackage.inclusions,
    itinerarySummary: (enginePackage.itinerary || []).map(i => ({
      day: i.day,
      title: i.title,
      activities: i.activities
    }))
  };

  const messages = [
    { role: 'system', content: COMPOSE_COPY_SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify(promptContext) }
  ];

  const requestOptions = {
    temperature: 0.3,
    max_tokens: 400
  };

  try {
    const rawOutput = await sendChatCompletion(messages, requestOptions);
    if (!rawOutput) return enginePackage;

    const parsed = JSON.parse(cleanJsonOutput(rawOutput));
    const validated = CopySchema.parse(parsed);

    // Merge copy while strictly preserving all numeric, itinerary, and price fields
    return {
      ...enginePackage,
      title: validated.title ? validated.title.slice(0, 80) : enginePackage.title,
      subtitle: validated.subtitle ? validated.subtitle.slice(0, 110) : enginePackage.subtitle,
      summary: validated.summary || enginePackage.summary,
      highlights: (validated.highlights && validated.highlights.length > 0)
        ? validated.highlights.slice(0, 4)
        : enginePackage.highlights
    };
  } catch (e) {

    logWarn('AI copy composition failed or failed validation, retaining template copy', { error: e.message });
    return enginePackage;
  }
}

export default composeCopy;
