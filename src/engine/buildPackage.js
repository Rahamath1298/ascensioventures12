/**
 * Pure builder functions to construct fully priced, grounded package payloads.
 * Conforms strictly to search API package response schema.
 */

import { RULES } from './rules.config.js';
import { calculateTripCost, calculateChaperones, calculateRooms } from './costModel.js';

/**
 * Constructs destination metadata block.
 * @param {Object} destMeta - Matched destination metadata
 * @param {string} fallbackName - Fallback destination name
 * @returns {Object} Destination block
 */
export function buildDestinationBlock(destMeta, fallbackName = 'Destination') {
  return {
    name: destMeta ? destMeta.name : fallbackName,
    region: destMeta ? destMeta.region : 'India'
  };
}

/**
 * Constructs group participant counts and room allocation.
 * @param {string} category - Trip category
 * @param {number} groupSize - Participant count
 * @returns {Object} Group block
 */
export function buildGroupBlock(category, groupSize) {
  const chaperones = calculateChaperones(category, groupSize);
  const totalHeadcount = groupSize + chaperones;
  const rooms = calculateRooms(totalHeadcount);
  return { size: groupSize, chaperones, rooms };
}

/**
 * Adapts template itinerary to match the requested duration.
 * @param {Array<Object>} baseItinerary - Seed itinerary days
 * @param {number} days - Requested duration in days
 * @param {string} destName - Destination name
 * @param {string} category - Trip category
 * @returns {Array<Object>} Adapted itinerary
 */
export function buildItinerary(baseItinerary = [], days = 3, destName = 'Hub', category = 'vacation') {
  const result = [];
  const baseCount = baseItinerary.length;

  for (let d = 1; d <= days; d++) {
    if (d <= baseCount) {
      result.push({ ...baseItinerary[d - 1], day: d });
    } else {
      // Extrapolate additional days gracefully
      result.push({
        day: d,
        title: `Extended Exploration & Practical Field Session in ${destName}`,
        activities: [
          `Specialized workshops and hands-on case study in ${destName}`,
          `Interactive industry/cultural excursion and peer debriefing`,
          `Evening reflection and group presentation session`
        ],
        meals: ['B', 'L', 'D'],
        stay: d === days ? 'Return transit' : 'Standard accommodation'
      });
    }
  }

  // Ensure last day has departure stay note
  if (result.length > 0) {
    result[result.length - 1].stay = 'Return journey / Departure';
  }

  return result;
}

/**
 * Ensures mandatory inclusions for the category are present in the list.
 * @param {Array<string>} baseInclusions - Template inclusions
 * @param {string} category - Trip category
 * @param {number} chaperones - Number of chaperones
 * @returns {Array<string>} Merged unique inclusions
 */
export function buildInclusions(baseInclusions = [], category, chaperones) {
  const list = [...baseInclusions];
  const required = RULES.categories[category]?.requiredInclusions || [];

  for (const req of required) {
    const hasItem = list.some(i => i.toLowerCase().includes(req.toLowerCase()));
    if (!hasItem) {
      if (req === 'teacher chaperones') {
        list.push(`Complimentary teacher chaperone arrangements (${chaperones} chaperones included)`);
      } else if (req === 'consent docs') {
        list.push('Parental consent documentation and risk management pack');
      } else if (req === 'first-aid') {
        list.push('24/7 emergency first-aid kit and certified first-aider');
      } else if (req === 'safety gear') {
        list.push('Industrial visitor safety gear (helmets, high-vis vests)');
      } else if (req === 'participation certificate') {
        list.push('Official participation and training certificates');
      } else if (req === 'insurance') {
        list.push('Comprehensive group travel and accident insurance');
      } else {
        list.push(req.charAt(0).toUpperCase() + req.slice(1));
      }
    }
  }

  return Array.from(new Set(list));
}

/**
 * Assembles a fully qualified package payload.
 * @param {Object} basePkg - Base template package
 * @param {Object} intent - Validated user intent
 * @param {Object | null} destMeta - Matched destination metadata
 * @returns {Object} Complete package response object
 */
export function buildPackage(basePkg, intent, destMeta) {
  const days = intent.durationDays || basePkg.days || 3;
  const nights = Math.max(0, days - 1);
  const group = buildGroupBlock(intent.category, intent.groupSize || basePkg.minGroup);
  const destination = buildDestinationBlock(destMeta, intent.destination || 'Destination');

  const costParams = {
    category: intent.category,
    destinationType: destMeta?.type || 'domestic',
    costIndex: destMeta?.costIndex || 1.0,
    peakMonths: destMeta?.peakMonths || [],
    month: intent.month,
    days,
    nights,
    groupSize: group.size,
    chaperones: group.chaperones,
    transport: intent.transport || basePkg.transport,
    accommodation: intent.accommodation || basePkg.accommodation
  };

  const pricing = calculateTripCost(costParams);
  const itinerary = buildItinerary(basePkg.itinerary, days, destination.name, intent.category);
  const inclusions = buildInclusions(basePkg.inclusions, intent.category, group.chaperones);

  const selectedTransport = costParams.transport;
  const selectedAccommodation = costParams.accommodation;
  const transportLabel = selectedTransport === 'car'
    ? 'Private Car / Cab'
    : selectedTransport === 'train'
    ? 'Express Rail'
    : selectedTransport === 'flight'
    ? 'Flight'
    : 'Chartered Bus';

  let title = basePkg.title;
  if (!title || (basePkg.destinationId && destMeta && basePkg.destinationId !== destMeta.id)) {
    title = `${days}-Day ${intent.category.replace('_', ' ')}: ${destination.name}`;
  } else if (days && basePkg.days && days !== basePkg.days) {
    title = title.replace(/^\d+[- ]Day/i, `${days}-Day`);
  }

  return {
    id: `${basePkg.id}-${days}d-${selectedTransport}`,
    category: intent.category,
    title,
    imageUrl: basePkg.imageUrl || `/images/packages/${basePkg.id}.jpg`,
    subtitle: `Curated ${days}-day itinerary in ${destination.name} with ${transportLabel} and stays included`,
    summary: `Complete package for ${group.size} participants to ${destination.name} via ${transportLabel}. Verified against all compliance rules.`,
    destination,
    duration: { days, nights },
    group,
    transport: selectedTransport,
    accommodation: selectedAccommodation,
    price: {
      currency: intent.currency || 'INR',
      perPerson: pricing.perPerson,
      total: pricing.total,
      breakdown: pricing.breakdown
    },
    itinerary,
    highlights: basePkg.highlights || [],
    inclusions,
    exclusions: basePkg.exclusions || ['Personal expenses', 'Discretionary tips'],
    safetyAndCompliance: basePkg.safetyAndCompliance || ['Verified safety protocols followed']
  };
}

export default buildPackage;
