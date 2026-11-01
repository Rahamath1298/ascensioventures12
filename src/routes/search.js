/**
 * Search route handler with caching, rate limiting, and Zod response validation.
 * Orchestrates intent extraction, deterministic rule validation, pricing, and AI copy enrichment.
 */

import express from 'express';
import { z } from 'zod';
import { parseIntent } from '../ai/parseIntent.js';
import { composeCopy } from '../ai/composeCopy.js';
import { isAiConfigured } from '../ai/client.js';
import { validateIntent } from '../engine/validateIntent.js';
import { matchPackages } from '../engine/matchPackages.js';
import { buildPackage } from '../engine/buildPackage.js';
import { calculateTripCost, generateLevers } from '../engine/costModel.js';
import { RULES } from '../engine/rules.config.js';
import { searchCache, intentCache, LRUCache } from '../utils/cache.js';
import { info as logInfo, warn as logWarn } from '../utils/logger.js';
import { loadJsonData } from '../utils/loadData.js';

const destinations = loadJsonData('destinations.json');

const router = express.Router();

// Sliding window rate limiter: 20 req/min/IP
const ipRateLimits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 20;

  const userRecord = ipRateLimits.get(ip) || [];
  const validRequests = userRecord.filter(t => now - t < windowMs);

  if (validRequests.length >= maxReq) {
    return res.status(429).json({
      status: 'error',
      message: 'Too many search requests. Please wait a minute.'
    });
  }

  validRequests.push(now);
  ipRateLimits.set(ip, validRequests);
  next();
}

// Request validation schema
const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  overrides: z.record(z.any()).optional().default({})
});

// Response validation schema adhering strictly to master prompt contract
const SearchResponseSchema = z.object({
  status: z.enum(['matched', 'budget_gap', 'needs_clarification', 'error']),
  query: z.object({
    raw: z.string(),
    parsed: z.record(z.any()),
    assumptions: z.array(z.string())
  }),
  package: z.any().nullable().optional(),
  budgetGap: z.any().nullable().optional(),
  alternatives: z.array(z.any()).default([]),
  clarification: z.any().nullable().optional(),
  meta: z.object({
    source: z.string(),
    model: z.string().optional(),
    latencyMs: z.number(),
    cached: z.boolean()
  })
});

/**
 * Finds nearby destinations matching or close to requested budget.
 */
function findNearbyAtBudget(destMeta, intent, requestedBudget) {
  if (!destMeta || !requestedBudget) return [];
  const nearbyIds = destMeta.nearby || [];

  return nearbyIds
    .map(id => destinations.find(d => d.id === id))
    .filter(Boolean)
    .map(altDest => {
      const altCost = calculateTripCost({
        category: intent.category,
        destinationType: altDest.type,
        costIndex: altDest.costIndex,
        days: intent.durationDays || 3,
        groupSize: intent.groupSize || 20,
        transport: altDest.type === 'international' ? 'flight' : 'train',
        accommodation: '3star'
      }).perPerson;

      return {
        destinationId: altDest.id,
        name: altDest.name,
        perPerson: altCost,
        days: intent.durationDays || 3,
        why: altCost <= requestedBudget
          ? 'Lower transport cost, comparable hubs'
          : `Comparable ${intent.category.replace('_', ' ')} ecosystem`
      };
    })
    .slice(0, 3);
}

/**
 * POST /api/search
 * Primary search endpoint.
 */
router.post('/search', rateLimit, async (req, res) => {
  const startTime = Date.now();
  const currentModel = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

  try {
    const parseResult = SearchRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid search request parameters',
        errors: parseResult.error.flatten()
      });
    }

    const { query, overrides } = parseResult.data;
    const cacheKey = LRUCache.generateKey(query, overrides);

    // 1. Check response cache
    const cachedResponse = searchCache.get(cacheKey);
    if (cachedResponse) {
      const response = {
        ...cachedResponse,
        meta: {
          ...cachedResponse.meta,
          latencyMs: Date.now() - startTime,
          cached: true
        }
      };
      return res.json(response);
    }

    // 2. Extract or retrieve intent
    let parsedIntent;
    let aiSource = 'rules_only';

    const hasOverrides = Object.keys(overrides).length > 0;
    const cachedIntent = hasOverrides ? intentCache.get(query.trim().toLowerCase()) : null;

    if (cachedIntent) {
      parsedIntent = { ...cachedIntent, ...overrides };
      aiSource = isAiConfigured() ? 'ai' : 'rules_only';
    } else {
      const aiResult = await parseIntent(query);
      parsedIntent = { ...aiResult.intent, ...overrides };
      aiSource = aiResult.source;
      intentCache.set(query.trim().toLowerCase(), aiResult.intent);
    }

    // 3. Validation & rules check
    const validation = validateIntent(parsedIntent);

    if (validation.status === 'needs_clarification') {
      const response = {
        status: 'needs_clarification',
        query: {
          raw: query,
          parsed: parsedIntent,
          assumptions: []
        },
        package: null,
        budgetGap: null,
        alternatives: [],
        clarification: validation.clarification,
        meta: {
          source: aiSource,
          model: currentModel,
          latencyMs: Date.now() - startTime,
          cached: false
        }
      };
      SearchResponseSchema.parse(response);
      return res.json(response);
    }

    if (validation.status === 'violation') {
      const cat = validation.intent.category || 'vacation';
      const catRule = RULES.categories[cat] || RULES.categories.vacation;

      // Clamp intent strictly to feasible criteria rules
      const feasibleGroup = Math.max(catRule.minGroup, Math.min(validation.intent.groupSize || catRule.minGroup, catRule.maxGroup));
      const feasibleDuration = Math.max(catRule.minDays, Math.min(validation.intent.durationDays || 3, catRule.maxDays));
      const feasibleAccommodation = catRule.allowedAccommodation.includes(validation.intent.accommodation)
        ? validation.intent.accommodation
        : catRule.defaultAccommodation;
      const feasibleTransport = catRule.allowedTransport.includes(validation.intent.transport)
        ? validation.intent.transport
        : catRule.defaultTransport;

      const feasibleIntent = {
        ...validation.intent,
        groupSize: feasibleGroup,
        durationDays: feasibleDuration,
        accommodation: feasibleAccommodation,
        transport: feasibleTransport
      };

      // Match nearest package and top alternative packages within rules
      const { bestPackage, alternatives: rawCatAlts } = matchPackages(feasibleIntent, validation.destMeta);
      const nearestPkg = bestPackage ? buildPackage(bestPackage, feasibleIntent, validation.destMeta) : null;

      // Build rule-compliant alternative packages with appropriate destination metadata
      const altPackages = (rawCatAlts || []).slice(0, 3).map(alt => {
        const altDest = destinations.find(d => d.id === alt.destinationId) || validation.destMeta;
        return buildPackage(alt, feasibleIntent, altDest);
      });

      // Find supported hub destinations matching this category
      let categoryTags = ['industrial', 'manufacturing'];
      if (cat === 'school_trip') categoryTags = ['school_trip', 'educational', 'nature', 'tea', 'botanical'];
      else if (cat === 'college_trip') categoryTags = ['technology', 'beach', 'heritage', 'coastal'];
      else if (cat === 'vacation') categoryTags = ['vacation', 'beach', 'mountains', 'heritage'];

      const recommendedDestinations = destinations
        .filter(d => d.tags.some(t => categoryTags.includes(t)) || (cat === 'vacation' && d.type === 'domestic'))
        .slice(0, 4)
        .map(d => ({
          id: d.id,
          name: d.name,
          region: d.region,
          type: d.type,
          highlight: d.industrialSites?.[0] || d.tags.slice(0, 3).join(', ')
        }));

      // Generate 1-click rule-compliant search suggestions
      const dest1 = recommendedDestinations[0]?.name || 'Coimbatore';
      const dest2 = recommendedDestinations[1]?.name || 'Pune';
      const catLabel = cat.replace('_', ' ');
      const suggestedQueries = [
        `${feasibleDuration} day ${catLabel} for ${feasibleGroup} travelers to ${dest1}`,
        `${feasibleDuration} day ${catLabel} for ${feasibleGroup} travelers to ${dest2}`,
        `3 day ${catLabel} for ${feasibleGroup} people to ${dest1}`
      ];

      const response = {
        status: 'error',
        query: {
          raw: query,
          parsed: validation.intent,
          assumptions: validation.assumptions || []
        },
        package: nearestPkg,
        budgetGap: null,
        alternatives: altPackages,
        clarification: {
          violation: validation.violation,
          fix: validation.violation.fix,
          message: validation.violation.detail || validation.violation.message || 'No direct package matched the requested criteria.',
          recommendedDestinations,
          suggestedQueries
        },
        meta: {
          source: 'rules_only',
          model: currentModel,
          latencyMs: Date.now() - startTime,
          cached: false
        }
      };
      SearchResponseSchema.parse(response);
      return res.json(response);
    }

    const { intent, destMeta, assumptions } = validation;

    // 4. Match seed template and build full package
    const { bestPackage, alternatives: rawAlts } = matchPackages(intent, destMeta);
    let fullPackage = buildPackage(bestPackage, intent, destMeta);

    // 5. Check budget gap
    const requestedBudget = intent.budgetPerPerson;
    const minimumPerPerson = fullPackage.price.perPerson;
    const isBudgetGap = requestedBudget && requestedBudget > 0 && requestedBudget < minimumPerPerson;

    if (isBudgetGap) {
      const gapPerPerson = minimumPerPerson - requestedBudget;
      const gapTotal = gapPerPerson * fullPackage.group.size;

      const basePricingParams = {
        category: intent.category,
        destinationType: destMeta?.type || 'domestic',
        costIndex: destMeta?.costIndex || 1.0,
        peakMonths: destMeta?.peakMonths || [],
        month: intent.month,
        days: intent.durationDays,
        nights: Math.max(0, intent.durationDays - 1),
        groupSize: intent.groupSize,
        transport: intent.transport,
        accommodation: intent.accommodation
      };

      const levers = generateLevers(basePricingParams, requestedBudget);
      const nearbyAtYourBudget = findNearbyAtBudget(destMeta, intent, requestedBudget);

      // Build 3 distinct alternative packages for budget gap with calibrated overrides
      const candidateLevers = levers.filter(l => l.feasibleWithBudget && l.override);
      const altConfigs = [];

      for (const l of candidateLevers) {
        altConfigs.push({
          pkg: bestPackage,
          intent: { ...intent, ...l.override },
          dest: destMeta
        });
      }

      // Add nearby destinations at budget if slots remain
      if (altConfigs.length < 3 && nearbyAtYourBudget.length > 0) {
        for (const near of nearbyAtYourBudget) {
          if (altConfigs.length >= 3) break;
          const nearDest = destinations.find(d => d.id === near.destinationId);
          if (nearDest) {
            altConfigs.push({
              pkg: bestPackage,
              intent: { ...intent, destination: nearDest.name, transport: nearDest.type === 'international' ? 'flight' : 'train' },
              dest: nearDest
            });
          }
        }
      }

      // Fallback transport levers (train, car, bus) to guarantee 3 distinct pricing options
      const catAllowedTrans = RULES.categories[intent.category]?.allowedTransport || ['bus', 'car', 'train', 'flight'];
      const remainingTransports = catAllowedTrans.filter(t => t !== intent.transport);
      while (altConfigs.length < 3 && remainingTransports.length > 0) {
        const trans = remainingTransports.shift();
        altConfigs.push({
          pkg: bestPackage,
          intent: { ...intent, transport: trans },
          dest: destMeta
        });
      }

      let altPackages = altConfigs.slice(0, 3).map(cfg => buildPackage(cfg.pkg, cfg.intent, cfg.dest));

      // AI copy composition on all 4 options
      if (aiSource === 'ai') {
        try {
          const enriched = await Promise.all([
            composeCopy(fullPackage),
            ...altPackages.map(alt => composeCopy(alt))
          ]);
          fullPackage = enriched[0];
          altPackages = altPackages.map((alt, i) => enriched[i + 1] || alt);
        } catch (err) {
          logWarn('AI copy enrichment in budget gap failed; using rule copy', { error: err.message });
        }
      }

      const currency = intent.currency || 'INR';
      const currSymbol = currency === 'USD' ? '$' : '₹';

      const budgetGap = {
        requested: requestedBudget,
        minimum: minimumPerPerson,
        gapPerPerson,
        gapTotal,
        currency,
        explanation: `A ${intent.durationDays}-day ${intent.category.replace('_', ' ')} for ${intent.groupSize} participants to ${destMeta?.name || 'this destination'} needs about ${currSymbol}${minimumPerPerson.toLocaleString()} per person. Your budget of ${currSymbol}${requestedBudget.toLocaleString()} is ${currSymbol}${gapPerPerson.toLocaleString()} short per person.`,
        levers,
        nearbyAtYourBudget,
        suggestedBudgets: [
          requestedBudget,
          Math.round((requestedBudget + minimumPerPerson) / 2),
          minimumPerPerson,
          Math.round(minimumPerPerson * 1.15)
        ],
        recommendedBudget: minimumPerPerson
      };

      const response = {
        status: 'budget_gap',
        query: {
          raw: query,
          parsed: intent,
          assumptions
        },
        package: fullPackage,
        budgetGap,
        alternatives: altPackages,
        clarification: null,
        meta: {
          source: aiSource === 'ai' ? 'ai+rules' : 'rules_only',
          model: currentModel,
          latencyMs: Date.now() - startTime,
          cached: false
        }
      };

      SearchResponseSchema.parse(response);
      searchCache.set(cacheKey, response);
      logInfo('Search completed', {
        query,
        status: 'budget_gap',
        source: response.meta.source,
        model: currentModel,
        latencyMs: response.meta.latencyMs
      });
      return res.json(response);
    }

    // 6. Matched State: Build 3 customized alternative packages across transportation modes
    const catAllowedTransports = RULES.categories[intent.category]?.allowedTransport || ['bus', 'car', 'train', 'flight'];
    const primaryTransport = fullPackage.transport || intent.transport || 'bus';

    // Select alternative transport modes (e.g. if primary is bus: train, car, flight)
    const altTransports = catAllowedTransports.filter(t => t !== primaryTransport);
    if (altTransports.length === 0) altTransports.push('train', 'car', 'flight');

    // Build 3 intelligent alternative packages prioritizing same destination and alternative transport modes
    const altConfigs = [];

    // 1. Check for other packages in the same destination first
    const sameDestOtherPkgs = (rawAlts || []).filter(p => destMeta && p.destinationId === destMeta.id && p.id !== bestPackage.id);
    for (const otherPkg of sameDestOtherPkgs) {
      if (altConfigs.length < 3) {
        altConfigs.push({
          pkg: otherPkg,
          transport: otherPkg.transport || altTransports[altConfigs.length % altTransports.length],
          dest: destMeta,
          accommodation: otherPkg.accommodation || intent.accommodation
        });
      }
    }

    // 2. Fill remaining slots across transportation modes
    let transportIdx = 0;
    while (altConfigs.length < 3) {
      const altTransport = altTransports[transportIdx % altTransports.length];
      transportIdx++;

      // When destination was explicitly requested, keep packages in the same destination or nearby
      let templatePkg = bestPackage;
      let targetDest = destMeta;

      // For the third alternative, if a nearby destination package exists, consider it
      if (altConfigs.length === 2 && destMeta?.nearby?.length > 0) {
        const nearbyPkg = (rawAlts || []).find(p => destMeta.nearby.includes(p.destinationId));
        if (nearbyPkg) {
          templatePkg = nearbyPkg;
          targetDest = destinations.find(d => d.id === nearbyPkg.destinationId) || destMeta;
        }
      } else if (!destMeta && rawAlts[altConfigs.length]) {
        templatePkg = rawAlts[altConfigs.length];
        targetDest = destinations.find(d => d.id === templatePkg.destinationId) || null;
      }

      const altAccommodation = (altConfigs.length === 1 && RULES.categories[intent.category]?.allowedAccommodation.includes('3star'))
        ? '3star'
        : (templatePkg.accommodation || intent.accommodation || '4star');

      altConfigs.push({
        pkg: templatePkg,
        transport: altTransport,
        dest: targetDest,
        accommodation: altAccommodation
      });
    }

    let alternatives = altConfigs.slice(0, 3).map(cfg => {
      const altIntent = {
        ...intent,
        transport: cfg.transport,
        accommodation: cfg.accommodation,
        destination: cfg.dest?.name || intent.destination
      };
      return buildPackage(cfg.pkg, altIntent, cfg.dest);
    });

    // Enrich all 4 packages with grounded, differentiated AI copy
    if (aiSource === 'ai') {
      try {
        const enriched = await Promise.all([
          composeCopy(fullPackage),
          ...alternatives.map(alt => composeCopy(alt))
        ]);
        fullPackage = enriched[0];
        alternatives = alternatives.map((alt, i) => enriched[i + 1] || alt);
      } catch (err) {
        logWarn('AI copy composition encountered an issue, retaining rule copy', { error: err.message });
      }
    }

    const response = {
      status: 'matched',
      query: {
        raw: query,
        parsed: intent,
        assumptions
      },
      package: fullPackage,
      budgetGap: null,
      alternatives,
      clarification: null,
      meta: {
        source: aiSource === 'ai' ? 'ai+rules' : 'rules_only',
        model: currentModel,
        latencyMs: Date.now() - startTime,
        cached: false
      }
    };

    SearchResponseSchema.parse(response);
    searchCache.set(cacheKey, response);
    logInfo('Search completed', {
      query,
      status: 'matched',
      source: response.meta.source,
      model: currentModel,
      latencyMs: response.meta.latencyMs
    });
    return res.json(response);
  } catch (err) {
    logWarn('Search endpoint caught unhandled exception', { error: err.message });
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while processing your travel query.',
      meta: {
        source: 'rules_only',
        model: currentModel,
        latencyMs: Date.now() - startTime,
        cached: false
      }
    });
  }
});

export default router;
