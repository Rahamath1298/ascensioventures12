/**
 * Rule-based fallback parser using regular expressions and keyword matching.
 * Extracts structured intent from plain English travel queries without LLM.
 */

import { loadJsonData } from '../utils/loadData.js';

const destinations = loadJsonData('destinations.json');

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

/**
 * Extracts category from query text based on domain keywords.
 * @param {string} text - Lowercase query text
 * @returns {string | null} Category or null
 */
function extractCategory(text) {
  if (/\b(industrial\s*visit|factory\s*visit|plant\s*visit|iv)\b/i.test(text)) {
    return 'industrial_visit';
  }
  if (/\b(school\s*trip|class\s*trip|students\s*of\s*class|school)\b/i.test(text)) {
    return 'school_trip';
  }
  if (/\b(college\s*trip|engineering\s*students|department\s*trip|university|polytechnic)\b/i.test(text)) {
    return 'college_trip';
  }
  if (/\b(vacation|holiday|family|getaway|honeymoon|leisure)\b/i.test(text)) {
    return 'vacation';
  }
  return null;
}

/**
 * Extracts destination from query text matching known destinations.
 * @param {string} text - Lowercase query text
 * @returns {Object | null} Destination object or null
 */
function extractDestination(text) {
  for (const d of destinations) {
    const destName = d.name.toLowerCase();
    const destId = d.id.toLowerCase();
    // Check whole word match
    const regex = new RegExp(`\\b${destName}\\b|\\b${destId}\\b`, 'i');
    if (regex.test(text)) {
      return d;
    }
  }
  return null;
}

/**
 * Extracts duration in days from text.
 * @param {string} text - Lowercase query text
 * @returns {number | null} Duration in days or null
 */
function extractDuration(text) {
  const match = text.match(/\b(\d+)\s*(?:days?|d)\b/i);
  if (match) return parseInt(match[1], 10);
  const nightsMatch = text.match(/\b(\d+)\s*(?:nights?|n)\b/i);
  if (nightsMatch) return parseInt(nightsMatch[1], 10) + 1;
  return null;
}

/**
 * Extracts group size and student/chaperone numbers.
 * @param {string} text - Lowercase query text
 * @returns {Object} Extracted group counts
 */
function extractGroup(text) {
  let groupSize = null;
  let students = null;

  const studentMatch = text.match(/\b(\d+)\s*(?:mechanical\s+|civil\s+|cs\s+|class\s+\d+\s+)?(?:students|pupils|kids|scholars)\b/i);
  if (studentMatch) {
    students = parseInt(studentMatch[1], 10);
    groupSize = students;
  }

  const peopleMatch = text.match(/\b(?:for\s+)?(\d+)\s*(?:people|persons?|members?|pax|heads?|adults?|travelers?|travellers?|tourists?|guests?|passengers?)\b/i);
  if (peopleMatch && !groupSize) {
    groupSize = parseInt(peopleMatch[1], 10);
  }

  return { groupSize, students };
}

/**
 * Extracts per-person budget and currency.
 * @param {string} text - Lowercase query text
 * @returns {Object} Extracted budget and currency
 */
function extractBudget(text) {
  let budgetPerPerson = null;
  let currency = 'INR';

  if (/\$|usd\b/i.test(text)) {
    currency = 'USD';
  }

  // Matches "budget 4500", "4500 per head", "rs 5000", "₹4500"
  const budgetMatch = text.match(/(?:budget|cost|price|max|under)?\s*(?:(?:₹|rs\.?|inr|\$)\s*)?(\d{3,7})\s*(?:per\s*(?:head|person|student|pax)|\/head|\/person|\/pax)?/i);
  if (budgetMatch) {
    // Distinguish group size vs budget: budgets are usually >= 1000 or explicitly tagged
    const explicitBudget = text.match(/(?:budget|under|max|capped at)\s*(?:(?:₹|rs\.?|inr|\$)\s*)?(\d{3,7})/i) ||
      text.match(/(\d{3,7})\s*(?:per\s*(?:head|person|student|pax)|\/head|\/person)/i) ||
      text.match(/(?:₹|rs\.?)\s*(\d{3,7})/i);

    if (explicitBudget) {
      budgetPerPerson = parseInt(explicitBudget[1], 10);
    }
  }

  return { budgetPerPerson, currency };
}

/**
 * Extracts travel month.
 * @param {string} text - Lowercase query text
 * @returns {string | null} Month name capitalized (e.g. 'Aug') or null
 */
function extractMonth(text) {
  for (const m of MONTHS) {
    const regex = new RegExp(`\\b${m}\\b`, 'i');
    if (regex.test(text)) {
      // Return 3-letter capitalized abbreviation e.g. 'Aug'
      const cap = m.charAt(0).toUpperCase() + m.slice(1, 3).toLowerCase();
      return cap;
    }
  }
  return null;
}

/**
 * Extracts transport preferences.
 * @param {string} text - Lowercase query text
 * @returns {string | null} 'bus' | 'train' | 'flight' | null
 */
function extractTransport(text) {
  if (/\b(flight|air|fly|plane)\b/i.test(text)) return 'flight';
  if (/\b(train|rail|railway)\b/i.test(text)) return 'train';
  if (/\b(car|cab|taxi|suv|tempo|private car)\b/i.test(text)) return 'car';
  if (/\b(bus|coach|van)\b/i.test(text)) return 'bus';
  return null;
}

/**
 * Extracts accommodation preference.
 * @param {string} text - Lowercase query text
 * @returns {string | null} 'hostel' | '3star' | '4star' | '5star' | null
 */
function extractAccommodation(text) {
  if (/\b(hostel|dorm|dormitory)\b/i.test(text)) return 'hostel';
  if (/\b(5\s*star|5-star|luxury\s*hotel)\b/i.test(text)) return '5star';
  if (/\b(4\s*star|4-star|deluxe\s*hotel)\b/i.test(text)) return '4star';
  if (/\b(3\s*star|3-star|standard\s*hotel)\b/i.test(text)) return '3star';
  return null;
}

/**
 * Fallback parser entry point. Converts query text to structured intent.
 * @param {string} rawQuery - The user's search text
 * @returns {Object} Structured intent matching schema
 */
export function parseIntentFallback(rawQuery) {
  const query = (rawQuery || '').trim();
  const text = query.toLowerCase();

  const category = extractCategory(text);
  const destObj = extractDestination(text);
  const durationDays = extractDuration(text);
  const { groupSize, students } = extractGroup(text);
  const { budgetPerPerson, currency } = extractBudget(text);
  const month = extractMonth(text);
  const transport = extractTransport(text);
  const accommodation = extractAccommodation(text);

  const interests = [];
  if (/mechanical|machining|cnc|automotive|automobile/i.test(text)) interests.push('mechanical', 'manufacturing');
  if (/electrical|electronics|iot/i.test(text)) interests.push('electronics');
  if (/nature|wildlife|trekking/i.test(text)) interests.push('nature');

  const mustHave = [];
  if (/plant\s*visit/i.test(text)) mustHave.push('plant visit');
  if (/certificate/i.test(text)) mustHave.push('certificate');

  return {
    category,
    destination: destObj ? destObj.name : null,
    destinationId: destObj ? destObj.id : null,
    origin: null,
    groupSize,
    students,
    chaperones: null,
    durationDays,
    budgetPerPerson,
    currency,
    month,
    transport,
    accommodation,
    interests,
    mustHave,
    confidence: 0.85
  };
}

export default parseIntentFallback;
