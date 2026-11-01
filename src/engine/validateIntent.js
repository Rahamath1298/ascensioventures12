/**
 * Intent validation, default coercion, and rule compliance checking.
 * Generates assumption chips, violation diagnostics, and clarification questions.
 */

import { RULES } from './rules.config.js';
import { loadJsonData } from '../utils/loadData.js';

const destinations = loadJsonData('destinations.json');

/**
 * Finds destination metadata by name or id.
 * @param {string | null} nameOrId - Destination string
 * @returns {Object | null} Destination metadata or null
 */
export function findDestination(nameOrId) {
  if (!nameOrId) return null;
  const needle = nameOrId.toLowerCase().trim();
  return destinations.find(
    d => d.id.toLowerCase() === needle ||
         d.name.toLowerCase() === needle ||
         needle.includes(d.name.toLowerCase())
  ) || null;
}

/**
 * Coerces missing fields with sane category defaults and logs assumptions.
 * @param {Object} rawIntent - Raw intent from AI or fallback parser
 * @returns {Object} { intent, assumptions }
 */
export function coerceDefaults(rawIntent) {
  const intent = { ...rawIntent };
  const assumptions = [];

  // 1. Category default
  if (!intent.category) {
    intent.category = RULES.defaults.category;
    assumptions.push(`Assumed category: ${intent.category.replace('_', ' ')}`);
  }
  const categoryRule = RULES.categories[intent.category] || RULES.categories.vacation;

  // 2. Duration default
  if (!intent.durationDays || intent.durationDays < 1) {
    intent.durationDays = RULES.defaults.durationDays;
    assumptions.push(`Assumed ${intent.durationDays} days`);
  }

  // 3. Group size default
  if (!intent.groupSize || intent.groupSize < 1) {
    intent.groupSize = categoryRule.minGroup;
    assumptions.push(`Assumed group of ${intent.groupSize}`);
  }

  // 4. Transport default
  if (!intent.transport) {
    intent.transport = categoryRule.defaultTransport;
    assumptions.push(`Assumed ${intent.transport} travel`);
  }

  // 5. Accommodation default
  if (!intent.accommodation) {
    intent.accommodation = categoryRule.defaultAccommodation;
    const stayLabel = intent.accommodation === 'hostel' ? 'hostel stay' : `${intent.accommodation.replace('star', '-star')} stay`;
    assumptions.push(`Assumed ${stayLabel}`);
  }

  // 6. Currency default
  if (!intent.currency) {
    intent.currency = RULES.defaults.currency;
  }

  return { intent, assumptions };
}

/**
 * Validates coerced intent against business rules.
 * @param {Object} intent - Coerced intent
 * @param {Object | null} destMeta - Matched destination metadata
 * @returns {Object | null} Violation object or null if valid
 */
export function checkViolations(intent, destMeta) {
  const categoryRule = RULES.categories[intent.category];
  if (!categoryRule) {
    return {
      code: 'MISSING_CRITICAL_INPUT',
      ...RULES.violations.MISSING_CRITICAL_INPUT
    };
  }

  // Destination checks
  if (intent.destination && !destMeta) {
    return {
      code: 'DESTINATION_UNSUPPORTED',
      ...RULES.violations.DESTINATION_UNSUPPORTED,
      detail: `Destination "${intent.destination}" is not supported.`
    };
  }

  // Destination type mismatch (e.g. international with bus/train)
  if (destMeta && destMeta.type === 'international' && intent.transport !== 'flight') {
    return {
      code: 'DESTINATION_TYPE_MISMATCH',
      ...RULES.violations.DESTINATION_TYPE_MISMATCH,
      detail: `${destMeta.name} is an overseas destination and requires flight transport.`
    };
  }

  // Season closed check
  if (destMeta && intent.month) {
    const normMonth = intent.month.slice(0, 3).toLowerCase();
    const isAllowed = destMeta.bestMonths.some(m => m.slice(0, 3).toLowerCase() === normMonth);
    if (!isAllowed) {
      return {
        code: 'SEASON_CLOSED',
        ...RULES.violations.SEASON_CLOSED,
        detail: `${destMeta.name} is best visited in ${destMeta.bestMonths.join(', ')}.`
      };
    }
  }

  // Group size checks
  if (intent.groupSize < categoryRule.minGroup) {
    return {
      code: 'GROUP_TOO_SMALL',
      ...RULES.violations.GROUP_TOO_SMALL,
      detail: `${intent.category.replace('_', ' ')} requires at least ${categoryRule.minGroup} participants.`
    };
  }
  if (intent.groupSize > categoryRule.maxGroup) {
    return {
      code: 'GROUP_TOO_LARGE',
      ...RULES.violations.GROUP_TOO_LARGE,
      detail: `${intent.category.replace('_', ' ')} packages support at most ${categoryRule.maxGroup} participants.`
    };
  }

  // Duration checks
  if (intent.durationDays < categoryRule.minDays) {
    return {
      code: 'DURATION_TOO_SHORT',
      ...RULES.violations.DURATION_TOO_SHORT,
      detail: `Minimum duration for this category is ${categoryRule.minDays} days.`
    };
  }
  if (intent.durationDays > categoryRule.maxDays) {
    return {
      code: 'DURATION_TOO_LONG',
      ...RULES.violations.DURATION_TOO_LONG,
      detail: `Maximum duration for this category is ${categoryRule.maxDays} days.`
    };
  }

  // Accommodation allowed check
  if (intent.accommodation && !categoryRule.allowedAccommodation.includes(intent.accommodation)) {
    return {
      code: 'ACCOMMODATION_NOT_ALLOWED_FOR_CATEGORY',
      ...RULES.violations.ACCOMMODATION_NOT_ALLOWED_FOR_CATEGORY,
      detail: `${intent.accommodation} is not allowed for ${intent.category.replace('_', ' ')}. Allowed: ${categoryRule.allowedAccommodation.join(', ')}.`
    };
  }

  return null;
}

/**
 * Builds clarification questions when critical input is missing.
 * @param {Object} rawIntent - Raw intent before coercion
 * @returns {Object} Clarification questions payload
 */
export function buildClarifications(rawIntent) {
  const questions = [];

  if (!rawIntent.destination) {
    questions.push({
      field: 'destination',
      q: 'Which destination are you planning to visit?',
      chips: ['Coimbatore', 'Pune', 'Goa', 'Manali', 'Ooty', 'Bengaluru']
    });
  }

  if (!rawIntent.groupSize && !rawIntent.students) {
    questions.push({
      field: 'groupSize',
      q: 'How many travelers will be in your group?',
      chips: ['2 travelers', '4 travelers', '25 students', '60 students']
    });
  }

  if (!rawIntent.durationDays) {
    questions.push({
      field: 'durationDays',
      q: 'How many days do you want the trip to be?',
      chips: ['2 Days', '3 Days', '4 Days', '5 Days']
    });
  }

  if (!rawIntent.budgetPerPerson) {
    questions.push({
      field: 'budgetPerPerson',
      q: 'What is your approximate budget per person?',
      chips: ['₹3,500/head', '₹5,000/head', '₹7,500/head', '₹10,000/head']
    });
  }

  // Limit to at most 3 questions
  return {
    questions: questions.slice(0, 3)
  };
}

/**
 * Validates and processes intent from end-to-end.
 * @param {Object} rawIntent - Extracted intent
 * @returns {Object} Validation result with coerced intent or error status
 */
export function validateIntent(rawIntent) {
  // Check if critical inputs are completely absent
  const hasDestination = Boolean(rawIntent.destination);
  const hasCategory = Boolean(rawIntent.category);
  const hasBudget = Boolean(rawIntent.budgetPerPerson);
  const hasGroup = Boolean(rawIntent.groupSize || rawIntent.students);

  // If query is too vague (e.g. only "vacation to Manali" lacks duration & group & budget)
  // Acceptance Test 5: "vacation to Manali" -> needs_clarification with <=3 questions and chips
  if (hasDestination && !hasGroup && !hasBudget && !rawIntent.durationDays) {
    return {
      status: 'needs_clarification',
      clarification: buildClarifications(rawIntent),
      rawIntent
    };
  }

  if (!hasDestination && !hasCategory && !hasBudget) {
    return {
      status: 'needs_clarification',
      clarification: buildClarifications(rawIntent),
      rawIntent
    };
  }

  const { intent, assumptions } = coerceDefaults(rawIntent);
  const destMeta = findDestination(intent.destination);
  const violation = checkViolations(intent, destMeta);

  if (violation) {
    return {
      status: 'violation',
      violation,
      intent,
      destMeta,
      assumptions
    };
  }

  return {
    status: 'valid',
    intent,
    destMeta,
    assumptions
  };
}

export default validateIntent;
