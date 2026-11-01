/**
 * Matches validated travel intent against seed package templates.
 * Ranks candidate packages by destination, duration, and group capacity.
 */

import { loadJsonData } from '../utils/loadData.js';

const packages = loadJsonData('packages.json');

/**
 * Computes suitability score between intent and candidate package.
 * @param {Object} intent - Validated user intent
 * @param {Object} pkg - Template package
 * @param {Object | null} destMeta - Matched destination
 * @returns {number} Score
 */
function scorePackage(intent, pkg, destMeta) {
  let score = 0;

  // Category match is paramount
  if (pkg.category === intent.category) {
    score += 50;
  } else {
    return 0; // Incompatible category
  }

  // Destination match
  if (destMeta && pkg.destinationId === destMeta.id) {
    score += 100;
  } else if (intent.destination && pkg.title.toLowerCase().includes(intent.destination.toLowerCase())) {
    score += 80;
  } else if (destMeta) {
    // Penalty for other destinations when user explicitly requested a specific destination
    score -= 40;
  }

  // Duration match
  const daysDiff = Math.abs(pkg.days - intent.durationDays);
  if (daysDiff === 0) {
    score += 20;
  } else if (daysDiff === 1) {
    score += 10;
  }

  // Group capacity
  if (intent.groupSize >= pkg.minGroup && intent.groupSize <= pkg.maxGroup) {
    score += 15;
  }

  // Accommodation & transport
  if (pkg.accommodation === intent.accommodation) score += 5;
  if (pkg.transport === intent.transport) score += 5;

  return score;
}

/**
 * Finds best package match and top alternatives for an intent.
 * @param {Object} intent - Validated user intent
 * @param {Object | null} destMeta - Matched destination
 * @returns {Object} { bestPackage, alternatives }
 */
export function matchPackages(intent, destMeta) {
  // If destination is specified, packages matching the destination must be strictly prioritized
  if (destMeta) {
    const destCatMatches = packages.filter(
      p => p.destinationId === destMeta.id && p.category === intent.category
    );
    if (destCatMatches.length > 0) {
      const scored = destCatMatches
        .map(pkg => ({ pkg, score: scorePackage(intent, pkg, destMeta) }))
        .sort((a, b) => b.score - a.score);
      const bestPackage = scored[0].pkg;
      const alternatives = scored.slice(1, 4).map(s => s.pkg);
      return { bestPackage, alternatives };
    }
  }

  const scored = packages
    .map(pkg => ({ pkg, score: scorePackage(intent, pkg, destMeta) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const bestPackage = scored[0].pkg;
    const alternatives = scored.slice(1, 4).map(s => s.pkg);
    return { bestPackage, alternatives };
  }

  // Fallback: match by category alone
  const catMatches = packages.filter(p => p.category === intent.category);
  const bestPackage = catMatches[0] || packages[0];
  const alternatives = catMatches.slice(1, 4);

  return { bestPackage, alternatives };
}

/**
 * Returns all seed packages.
 * @returns {Array<Object>} All packages
 */
export function getAllPackages() {
  return packages;
}

export default matchPackages;
