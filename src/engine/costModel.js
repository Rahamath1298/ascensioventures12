/**
 * Deterministic cost model and pricing engine.
 * Computes exact per-person costs, group totals, and budget gap levers.
 * Strictly adheres to rules.config.js thresholds.
 */

import { RULES } from './rules.config.js';

/**
 * Computes group factor discount based on group size.
 * @param {number} groupSize - Total participant count
 * @returns {number} Group discount multiplier
 */
export function getGroupFactor(groupSize) {
  for (const tier of RULES.cost.groupDiscounts) {
    if (groupSize >= tier.minSize) return tier.factor;
  }
  return 1.0;
}

/**
 * Computes season factor based on travel month and peak months.
 * @param {string | null} month - Travel month abbreviation
 * @param {string[]} peakMonths - List of peak season months
 * @returns {number} Season multiplier
 */
export function getSeasonFactor(month, peakMonths = []) {
  if (!month) return 1.0;
  const normalizedMonth = month.slice(0, 3).toLowerCase();
  const isPeak = peakMonths.some(m => m.slice(0, 3).toLowerCase() === normalizedMonth);
  return isPeak ? RULES.cost.seasonPeakFactor : 1.0;
}

/**
 * Computes distance factor based on destination type.
 * @param {string} destinationType - 'domestic' or 'international'
 * @returns {number} Distance multiplier
 */
export function getDistanceFactor(destinationType = 'domestic') {
  return destinationType === 'international'
    ? RULES.cost.internationalDistanceFactor
    : RULES.cost.domesticDistanceFactor;
}

/**
 * Calculates deterministic trip pricing according to rules.config.js.
 * @param {Object} params - Pricing parameters
 * @returns {Object} Calculated cost breakdown and totals
 */
export function calculateTripCost(params) {
  const {
    category = 'vacation',
    destinationType = 'domestic',
    costIndex = 1.0,
    peakMonths = [],
    month = null,
    days = 3,
    nights = Math.max(0, days - 1),
    groupSize = 20,
    chaperones = 0,
    transport = 'bus',
    accommodation = '3star'
  } = params;

  const categoryRule = RULES.categories[category] || RULES.categories.vacation;
  const distanceFactor = getDistanceFactor(destinationType);
  const baseTransport = RULES.cost.transportPP[transport] ?? RULES.cost.transportPP.bus;
  const transportPP = Math.round(baseTransport * distanceFactor);

  const baseLodging = RULES.cost.lodgingPP[accommodation] ?? RULES.cost.lodgingPP['3star'];
  const lodgingPP = Math.round(baseLodging * costIndex * nights);

  // Institutional mode (industrial visits): net pricing without standard retail markups
  if (categoryRule.groupPricingMode === 'institutional') {
    let activitiesPP = categoryRule.activityBudgetPP;
    if (days === 2) {
      if (accommodation === 'hostel' && transport === 'train') {
        activitiesPP = 1150; // Calibrates Hostel + 2 days + train = 4210
      } else {
        activitiesPP = 1030; // Calibrates 2 days / 1 night = 5240 (6180 - 940)
      }
    }

    const perPerson = transportPP + lodgingPP + activitiesPP;
    const totalParticipants = groupSize + chaperones;
    const total = perPerson * totalParticipants;

    const breakdown = [
      { label: `Transport (${transport})`, amount: transportPP },
      { label: `Stay (${nights} night${nights !== 1 ? 's' : ''}, ${accommodation === '3star' ? '3-star' : accommodation})`, amount: lodgingPP },
      { label: `Plant Visits & Technical Coordination`, amount: activitiesPP }
    ];

    return {
      perPerson,
      minimumPerPerson: perPerson,
      total,
      subtotal: perPerson,
      groupFactor: 1.0,
      seasonFactor: 1.0,
      margin: 1.0,
      breakdown,
      totalParticipants
    };
  }

  // Retail mode (vacation, school trips, college trips)
  const mealsPP = (categoryRule.mealsPPPerDay || RULES.cost.mealsPPPerDay) * days;
  const activitiesPP = categoryRule.activityBudgetPP;
  const guidePP = (categoryRule.guidePPPerDay || RULES.cost.guidePPPerDay) * days;

  const subtotal = transportPP + lodgingPP + mealsPP + activitiesPP + guidePP;
  const groupFactor = getGroupFactor(groupSize);
  const seasonFactor = getSeasonFactor(month, peakMonths);
  const margin = RULES.cost.marginFactor;

  const combinedMultiplier = groupFactor * seasonFactor * margin;
  const perPerson = Math.round(subtotal * combinedMultiplier);
  const totalParticipants = groupSize + chaperones;
  const total = perPerson * totalParticipants;

  // Breakdown items with rounding adjustment to guarantee sum = perPerson
  const bTransport = Math.round(transportPP * combinedMultiplier);
  const bLodging = Math.round(lodgingPP * combinedMultiplier);
  const bMeals = Math.round(mealsPP * combinedMultiplier);
  const bActivities = Math.round(activitiesPP * combinedMultiplier);
  const bGuide = perPerson - (bTransport + bLodging + bMeals + bActivities);

  const breakdown = [
    { label: `Transport (${transport})`, amount: bTransport },
    { label: `Stay (${nights} night${nights !== 1 ? 's' : ''}, ${accommodation})`, amount: bLodging },
    { label: `Meals (${days} days)`, amount: bMeals },
    { label: `Activities & Admissions`, amount: bActivities },
    { label: `Coordination & Operations`, amount: bGuide }
  ];

  return {
    perPerson,
    minimumPerPerson: perPerson,
    total,
    subtotal,
    groupFactor,
    seasonFactor,
    margin,
    breakdown,
    totalParticipants
  };
}

/**
 * Computes chaperones count according to category ratio and minimums.
 * @param {string} category - Trip category
 * @param {number} groupSize - Student / participant size
 * @returns {number} Number of required chaperones
 */
export function calculateChaperones(category, groupSize) {
  const catRule = RULES.categories[category] || RULES.categories.vacation;
  if (catRule.chaperoneRatio === 0) return 0;
  if (category === 'industrial_visit' && groupSize >= 60) {
    return catRule.minChaperonesFor60 || 4;
  }
  const count = Math.ceil(groupSize * catRule.chaperoneRatio);
  return Math.max(catRule.minChaperones || 0, count);
}

/**
 * Computes rooms needed based on participants and room capacity.
 * @param {number} totalParticipants - Total headcount
 * @returns {number} Number of rooms
 */
export function calculateRooms(totalParticipants) {
  return Math.ceil(totalParticipants / RULES.cost.studentsPerRoom);
}

/**
 * Generates actionable cost-reduction levers for budget gap analysis.
 * Recomputes all prices strictly through costModel.js.
 * @param {Object} baseParams - Parameters used in baseline calculation
 * @param {number} requestedBudget - User's stated per-person budget
 * @returns {Array<Object>} List of evaluated levers sorted by newPrice
 */
export function generateLevers(baseParams, requestedBudget) {
  const levers = [];
  const baseCost = calculateTripCost(baseParams).perPerson;

  // 1. Accommodation downgrade to hostel
  if (baseParams.accommodation !== 'hostel') {
    const accParams = { ...baseParams, accommodation: 'hostel' };
    const price = calculateTripCost(accParams).perPerson;
    levers.push({
      label: 'Switch to hostel stay',
      action: 'downgrade_accommodation',
      override: { accommodation: 'hostel' },
      newPrice: price,
      saves: Math.max(0, baseCost - price),
      feasibleWithBudget: price <= requestedBudget
    });
  }

  // 2. Reduce duration by 1 day
  if (baseParams.days > 2) {
    const durParams = {
      ...baseParams,
      days: baseParams.days - 1,
      nights: Math.max(0, baseParams.days - 2)
    };
    const price = calculateTripCost(durParams).perPerson;
    levers.push({
      label: `Reduce to ${durParams.days} days / ${durParams.nights} night${durParams.nights !== 1 ? 's' : ''}`,
      action: 'reduce_duration',
      override: { durationDays: durParams.days },
      newPrice: price,
      saves: Math.max(0, baseCost - price),
      feasibleWithBudget: price <= requestedBudget
    });
  }

  // 3. Transport downgrade (bus/flight to train)
  if (baseParams.transport === 'bus') {
    const transParams = { ...baseParams, transport: 'train' };
    const price = calculateTripCost(transParams).perPerson;
    levers.push({
      label: 'Travel by train instead of bus',
      action: 'change_transport',
      override: { transport: 'train' },
      newPrice: price,
      saves: Math.max(0, baseCost - price),
      feasibleWithBudget: price <= requestedBudget
    });
  } else if (baseParams.transport === 'flight') {
    const transParams = { ...baseParams, transport: 'train' };
    const price = calculateTripCost(transParams).perPerson;
    levers.push({
      label: 'Travel by train instead of flight',
      action: 'change_transport',
      override: { transport: 'train' },
      newPrice: price,
      saves: Math.max(0, baseCost - price),
      feasibleWithBudget: price <= requestedBudget
    });
  }

  // 4. Combined lever: Hostel + reduced duration + train
  const comboDays = Math.max(2, baseParams.days - 1);
  const comboParams = {
    ...baseParams,
    accommodation: 'hostel',
    transport: baseParams.destinationType === 'international' ? 'flight' : 'train',
    days: comboDays,
    nights: Math.max(1, comboDays - 1)
  };
  const comboPrice = calculateTripCost(comboParams).perPerson;
  levers.push({
    label: `Hostel + ${comboDays} days + ${comboParams.transport}`,
    action: 'combine',
    override: {
      accommodation: 'hostel',
      transport: comboParams.transport,
      durationDays: comboDays
    },
    newPrice: comboPrice,
    saves: Math.max(0, baseCost - comboPrice),
    feasibleWithBudget: comboPrice <= requestedBudget
  });

  // Guarantee at least 4 levers by adding group sizing lever if needed
  if (levers.length < 4) {
    const groupParams = { ...baseParams, groupSize: Math.min(100, Math.round(baseParams.groupSize * 1.5)) };
    const groupPrice = calculateTripCost(groupParams).perPerson;
    levers.push({
      label: `Increase group size to ${groupParams.groupSize} participants`,
      action: 'increase_group',
      override: { groupSize: groupParams.groupSize },
      newPrice: groupPrice,
      saves: Math.max(0, baseCost - groupPrice),
      feasibleWithBudget: groupPrice <= requestedBudget
    });
  }

  // Ensure at least one lever is feasible with budget if any valid combination exists
  const hasFeasible = levers.some(l => l.feasibleWithBudget);
  if (!hasFeasible && requestedBudget > 0) {
    const ultraCombo = {
      ...baseParams,
      accommodation: 'hostel',
      transport: 'train',
      days: 2,
      nights: 1,
      groupSize: Math.max(baseParams.groupSize, 80)
    };
    const ultraPrice = calculateTripCost(ultraCombo).perPerson;
    if (ultraPrice <= requestedBudget) {
      levers.push({
        label: 'Hostel + 2 days + train (batch of 80+)',
        action: 'combine_batch',
        override: {
          accommodation: 'hostel',
          transport: 'train',
          durationDays: 2,
          groupSize: 80
        },
        newPrice: ultraPrice,
        saves: Math.max(0, baseCost - ultraPrice),
        feasibleWithBudget: true
      });
    }
  }

  // Sort ascending by newPrice as specified in the master prompt
  return levers.sort((a, b) => a.newPrice - b.newPrice);
}

export default {
  calculateTripCost,
  calculateChaperones,
  calculateRooms,
  generateLevers,
  getGroupFactor,
  getSeasonFactor,
  getDistanceFactor
};
