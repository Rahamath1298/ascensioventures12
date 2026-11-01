/**
 * Central configuration of all business criteria, thresholds, and pricing constants.
 * All thresholds and category parameters are configured here.
 */

export const RULES = {
  categories: {
    vacation: {
      minGroup: 1,
      maxGroup: 12,
      chaperoneRatio: 0,
      minChaperones: 0,
      minDays: 2,
      maxDays: 14,
      allowedAccommodation: ['3star', '4star', '5star'],
      allowedTransport: ['bus', 'car', 'train', 'flight'],
      requiredInclusions: ['hotel', 'transfers', 'sightseeing'],
      activityBudgetPP: 2500,
      mealsPPPerDay: 650,
      guidePPPerDay: 250,
      defaultAccommodation: '4star',
      defaultTransport: 'flight',
      groupPricingMode: 'retail'
    },
    school_trip: {
      minGroup: 20,
      maxGroup: 120,
      chaperoneRatio: 1 / 15,
      minChaperones: 2,
      minDays: 1,
      maxDays: 5,
      allowedAccommodation: ['hostel', '3star'],
      allowedTransport: ['bus', 'car', 'train'],
      requiredInclusions: [
        'insurance',
        'first-aid',
        'meals',
        'teacher chaperones',
        'consent docs'
      ],
      activityBudgetPP: 700,
      mealsPPPerDay: 450,
      guidePPPerDay: 150,
      defaultAccommodation: '3star',
      defaultTransport: 'bus',
      groupPricingMode: 'retail'
    },
    college_trip: {
      minGroup: 15,
      maxGroup: 200,
      chaperoneRatio: 1 / 20,
      minChaperones: 1,
      minDays: 2,
      maxDays: 7,
      allowedAccommodation: ['hostel', '3star', '4star'],
      allowedTransport: ['bus', 'car', 'train', 'flight'],
      requiredInclusions: ['insurance', 'meals', 'coordinator'],
      activityBudgetPP: 1200,
      mealsPPPerDay: 500,
      guidePPPerDay: 150,
      defaultAccommodation: '3star',
      defaultTransport: 'bus',
      groupPricingMode: 'retail'
    },
    industrial_visit: {
      minGroup: 10,
      maxGroup: 100,
      chaperoneRatio: 1 / 25,
      minChaperones: 2,
      minChaperonesFor60: 4,
      minDays: 1,
      maxDays: 5,
      allowedAccommodation: ['hostel', '3star', '4star'],
      allowedTransport: ['bus', 'car', 'train', 'flight'],
      requiredInclusions: [
        'plant visits',
        'technical coordinator',
        'safety gear',
        'participation certificate'
      ],
      activityBudgetPP: 260,
      mealsPPPerDay: 0, // Industrial factory canteens provide lunch; stay includes breakfast
      guidePPPerDay: 0, // Technical coordination included in activity fee
      defaultAccommodation: '3star',
      defaultTransport: 'bus',
      groupPricingMode: 'institutional'
    }
  },

  cost: {
    transportPP: {
      train: 1800,
      bus: 2500,
      car: 3200,
      flight: 8500
    },
    lodgingPP: {
      hostel: 1400,
      '3star': 1900,
      '4star': 3400,
      '5star': 6200
    },
    mealsPPPerDay: 650,
    guidePPPerDay: 250,
    groupDiscounts: [
      { minSize: 80, factor: 0.88 },
      { minSize: 40, factor: 0.92 },
      { minSize: 0, factor: 1.0 }
    ],
    seasonPeakFactor: 1.15,
    marginFactor: 1.12,
    domesticDistanceFactor: 1.0,
    internationalDistanceFactor: 2.2,
    studentsPerRoom: 2
  },

  defaults: {
    category: 'vacation',
    durationDays: 3,
    currency: 'INR'
  },

  violations: {
    GROUP_TOO_SMALL: {
      code: 'GROUP_TOO_SMALL',
      message: 'Group size is below the minimum required for this category.',
      fix: 'Increase group size or consider a vacation package for smaller groups.'
    },
    GROUP_TOO_LARGE: {
      code: 'GROUP_TOO_LARGE',
      message: 'Group size exceeds maximum operational capacity for this category.',
      fix: 'Split the group across batches or reduce group size.'
    },
    DURATION_TOO_SHORT: {
      code: 'DURATION_TOO_SHORT',
      message: 'Trip duration is shorter than the minimum required.',
      fix: 'Increase trip duration.'
    },
    DURATION_TOO_LONG: {
      code: 'DURATION_TOO_LONG',
      message: 'Trip duration exceeds the recommended maximum for this category.',
      fix: 'Reduce trip duration or split into multiple excursions.'
    },
    DESTINATION_UNSUPPORTED: {
      code: 'DESTINATION_UNSUPPORTED',
      message: 'We do not currently operate packages in this destination.',
      fix: 'Choose one of our supported hub destinations.'
    },
    DESTINATION_TYPE_MISMATCH: {
      code: 'DESTINATION_TYPE_MISMATCH',
      message: 'Requested transport mode is not feasible for this destination.',
      fix: 'Select a compatible transport mode (e.g. flight for international destinations).'
    },
    SEASON_CLOSED: {
      code: 'SEASON_CLOSED',
      message: 'The requested month is outside the recommended travel season for this destination.',
      fix: 'Choose a date within the prime season months.'
    },
    ACCOMMODATION_NOT_ALLOWED_FOR_CATEGORY: {
      code: 'ACCOMMODATION_NOT_ALLOWED_FOR_CATEGORY',
      message: 'Selected accommodation type is not permitted for this trip category.',
      fix: 'Choose an allowed accommodation type.'
    },
    BUDGET_BELOW_MINIMUM: {
      code: 'BUDGET_BELOW_MINIMUM',
      message: 'Requested budget is below the baseline operational minimum.',
      fix: 'Review cost reduction levers or increase budget.'
    },
    MISSING_CRITICAL_INPUT: {
      code: 'MISSING_CRITICAL_INPUT',
      message: 'Please provide destination, category, or budget to proceed.',
      fix: 'Clarify your destination or trip type.'
    }
  }
};

export default RULES;
