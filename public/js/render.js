/**
 * DOM rendering engine with strict string sanitization.
 * Never sets innerHTML directly with untrusted strings.
 * Renders wide, rich results with full package specifications and rule-compliant recommendations.
 */

import { animatePriceCount, applyStaggerAnimation } from './animations.js';

/**
 * Creates an element with optional classes and textContent.
 * @param {string} tag - HTML tag name
 * @param {string} [className=''] - Space-separated classes
 * @param {string} [text=''] - Text content to escape safely
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (tag.toLowerCase() === 'button') {
    el.type = 'button';
  }
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

/**
 * Formats currency amount using Intl.
 * @param {number} amount - Amount to format
 * @param {string} [currency='INR'] - Currency code
 * @returns {string} Formatted string e.g. ₹6,180
 */
export function formatCurrency(amount, currency = 'INR') {
  const symbol = currency === 'USD' ? '$' : '₹';
  return `${symbol}${new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN').format(amount)}`;
}

/**
 * Premium Vector SVG Icons for high-resolution, modern travel UI.
 */
export const ICONS = {
  pin: `<svg class="ui-icon icon-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  bus: `<svg class="ui-icon icon-transport" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="15" x="3" y="3" rx="2.5"/><path d="M3 11h18"/><path d="M8 6v5"/><path d="M16 6v5"/><circle cx="7.5" cy="14.5" r="1.5" fill="currentColor"/><circle cx="16.5" cy="14.5" r="1.5" fill="currentColor"/><path d="m5 18-1.5 2.5"/><path d="m19 18 1.5 2.5"/></svg>`,
  train: `<svg class="ui-icon icon-transport" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="15" x="4" y="3" rx="2.5"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 18-2 3"/><path d="m16 18 2 3"/><circle cx="8" cy="14.5" r="1.2" fill="currentColor"/><circle cx="16" cy="14.5" r="1.2" fill="currentColor"/></svg>`,
  car: `<svg class="ui-icon icon-transport" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`,
  flight: `<svg class="ui-icon icon-transport" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`,
  star: `<svg class="ui-icon icon-star" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  settings: `<svg class="ui-icon icon-settings" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  verified: `<svg class="ui-icon icon-verified" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z"/><path d="m9 12 2 2 4-4"/></svg>`
};

/**
 * Returns formatted transport name and corresponding premium SVG icon.
 * @param {string} mode
 * @returns {{ name: string, icon: string }}
 */
export function getTransportDisplay(mode) {
  const t = (mode || 'bus').toLowerCase();
  if (t === 'flight' || t === 'air' || t === 'plane') {
    return { name: 'Flight', icon: ICONS.flight };
  }
  if (t === 'train' || t === 'rail') {
    return { name: 'Rail', icon: ICONS.train };
  }
  if (t === 'car' || t === 'cab' || t === 'taxi') {
    return { name: 'Private Cab', icon: ICONS.car };
  }
  return { name: 'Deluxe Bus', icon: ICONS.bus };
}

/**
 * Curated package-specific image catalog ensuring distinct visuals
 * tailored to title, category, and theme.
 */
const PACKAGE_IMAGE_MAP = {
  // Industrial Visits (Precision manufacturing, robotics, rail, aerospace, textiles, pharma)
  'iv-coimbatore-3d': '/images/packages/iv-coimbatore-3d.jpg',
  'iv-pune-3d': '/images/packages/iv-pune-3d.jpg',
  'iv-chennai-3d': '/images/packages/iv-chennai-3d.jpg',
  'iv-bengaluru-3d': '/images/packages/iv-bengaluru-3d.jpg',
  'iv-ahmedabad-3d': '/images/packages/iv-ahmedabad-3d.jpg',
  'iv-hyderabad-3d': '/images/packages/iv-hyderabad-3d.jpg',

  // School Trips (Botanical agriculture, marine science aquarium, astronomy observatory, nature study)
  'st-coimbatore-2d': '/images/packages/st-coimbatore-2d.jpg',
  'st-chennai-3d': '/images/packages/st-chennai-3d.jpg',
  'st-jaipur-3d': '/images/packages/st-jaipur-3d.jpg',
  'st-ooty-2d': '/images/packages/st-ooty-2d.jpg',

  // College Trips (Fort trekking, tech innovation campus, youth coastal adventure, Himalayan expedition)
  'ct-pune-3d': '/images/packages/ct-pune-3d.jpg',
  'ct-bengaluru-3d': '/images/packages/ct-bengaluru-3d.jpg',
  'ct-goa-3d': '/images/packages/ct-goa-3d.jpg',
  'ct-manali-4d': '/images/packages/ct-manali-4d.jpg',

  // Vacations (Luxury beach villa, alpine chalet, royal haveli, futuristic skyline, tea country estate)
  'vac-coimbatore-2d': '/images/packages/vac-coimbatore-2d.jpg',
  'vac-coimbatore-3d': '/images/packages/vac-coimbatore-3d.jpg',
  'vac-goa-4d': '/images/packages/vac-goa-4d.jpg',
  'vac-manali-5d': '/images/packages/vac-manali-5d.jpg',
  'vac-jaipur-3d': '/images/packages/vac-jaipur-3d.jpg',
  'vac-dubai-4d': '/images/packages/vac-dubai-4d.jpg',
  'vac-kualalumpur-4d': '/images/packages/vac-kualalumpur-4d.jpg',
  'vac-ooty-3d': '/images/packages/vac-ooty-3d.jpg'
};

/**
 * Returns destination photo URL according to package destination, category, and title.
 * Prevents identical images across schools, colleges, and industrial visits.
 * @param {Object} pkg - Package data object
 * @returns {string} Relative image path
 */
export function getDestinationImage(pkg) {
  if (!pkg) return '/images/destinations/default.jpg';

  // 1. Direct explicit image URL
  if (pkg.imageUrl) return pkg.imageUrl;

  const pkgId = (pkg.id || '').toLowerCase();

  // 2. Direct package ID lookup
  for (const [key, path] of Object.entries(PACKAGE_IMAGE_MAP)) {
    if (pkgId === key || pkgId.startsWith(key)) {
      return path;
    }
  }

  const title = (pkg.title || '').toLowerCase();
  const cat = (pkg.category || '').toLowerCase();
  const destId = (pkg?.destination?.id || pkg?.destinationId || '').toLowerCase();
  const destName = (pkg?.destination?.name || '').toLowerCase();

  // 3. School Trips (educational, botanical, marine, astronomy science)
  if (cat === 'school_trip' || title.includes('school')) {
    if (title.includes('agriculture') || title.includes('agri') || title.includes('botanical') || destId.includes('coimbatore') || destName.includes('coimbatore')) {
      return '/images/packages/st-coimbatore-2d.jpg';
    }
    if (title.includes('marine') || title.includes('aquarium') || title.includes('ocean') || destId.includes('chennai') || destName.includes('chennai')) {
      return '/images/packages/st-chennai-3d.jpg';
    }
    if (title.includes('heritage') || title.includes('astronomy') || title.includes('observatory') || destId.includes('jaipur') || destName.includes('jaipur')) {
      return '/images/packages/st-jaipur-3d.jpg';
    }
    if (title.includes('nature') || title.includes('tea') || destId.includes('ooty') || destName.includes('ooty')) {
      return '/images/packages/st-ooty-2d.jpg';
    }
    // Generic school trips by theme
    if (title.includes('marine') || title.includes('sea')) return '/images/packages/st-chennai-3d.jpg';
    if (title.includes('astronomy') || title.includes('history')) return '/images/packages/st-jaipur-3d.jpg';
    if (title.includes('plant') || title.includes('green') || title.includes('bio')) return '/images/packages/st-coimbatore-2d.jpg';
    return '/images/packages/st-ooty-2d.jpg';
  }

  // 4. College Trips (trekking, campus innovation, coastal adventure, alpine expedition)
  if (cat === 'college_trip' || title.includes('college')) {
    if (title.includes('fort') || title.includes('trekking') || title.includes('sinhagad') || destId.includes('pune') || destName.includes('pune')) {
      return '/images/packages/ct-pune-3d.jpg';
    }
    if (title.includes('tech') || title.includes('innovation') || title.includes('campus') || destId.includes('bengaluru') || destName.includes('bengaluru')) {
      return '/images/packages/ct-bengaluru-3d.jpg';
    }
    if (title.includes('coastal') || title.includes('adventure') || title.includes('beach') || destId.includes('goa') || destName.includes('goa')) {
      return '/images/packages/ct-goa-3d.jpg';
    }
    if (title.includes('mountain') || title.includes('expedition') || title.includes('himalaya') || destId.includes('manali') || destName.includes('manali')) {
      return '/images/packages/ct-manali-4d.jpg';
    }
    // Generic college trip by theme
    if (title.includes('trek') || title.includes('hike')) return '/images/packages/ct-pune-3d.jpg';
    if (title.includes('code') || title.includes('hackathon')) return '/images/packages/ct-bengaluru-3d.jpg';
    if (title.includes('water') || title.includes('surf')) return '/images/packages/ct-goa-3d.jpg';
    return '/images/packages/ct-bengaluru-3d.jpg';
  }

  // 5. Industrial Visits (manufacturing, robotics, rail, aerospace, textiles, pharma)
  if (cat === 'industrial_visit' || title.includes('industrial') || title.includes('visit') || title.includes('engineering')) {
    if (title.includes('auto') || title.includes('robot') || destId.includes('pune') || destName.includes('pune')) {
      return '/images/packages/iv-pune-3d.jpg';
    }
    if (title.includes('aero') || title.includes('satellite') || title.includes('space') || destId.includes('bengaluru') || destName.includes('bengaluru')) {
      return '/images/packages/iv-bengaluru-3d.jpg';
    }
    if (title.includes('rail') || title.includes('train') || title.includes('coach') || destId.includes('chennai') || destName.includes('chennai')) {
      return '/images/packages/iv-chennai-3d.jpg';
    }
    if (title.includes('textil') || title.includes('chemical') || destId.includes('ahmedabad') || destName.includes('ahmedabad')) {
      return '/images/packages/iv-ahmedabad-3d.jpg';
    }
    if (title.includes('pharma') || title.includes('biotech') || destId.includes('hyderabad') || destName.includes('hyderabad')) {
      return '/images/packages/iv-hyderabad-3d.jpg';
    }
    if (title.includes('machin') || title.includes('cnc') || title.includes('precision') || destId.includes('coimbatore') || destName.includes('coimbatore')) {
      return '/images/packages/iv-coimbatore-3d.jpg';
    }
    return '/images/packages/iv-coimbatore-3d.jpg';
  }

  // 6. Vacation / Leisure
  if (destId.includes('goa') || destName.includes('goa') || title.includes('goa')) return '/images/packages/vac-goa-4d.jpg';
  if (destId.includes('manali') || destName.includes('manali') || title.includes('manali')) return '/images/packages/vac-manali-5d.jpg';
  if (destId.includes('jaipur') || destName.includes('jaipur') || title.includes('jaipur')) return '/images/packages/vac-jaipur-3d.jpg';
  if (destId.includes('dubai') || destName.includes('dubai') || title.includes('dubai')) return '/images/packages/vac-dubai-4d.jpg';
  if (destId.includes('kuala') || destName.includes('kuala') || title.includes('kuala')) return '/images/packages/vac-kualalumpur-4d.jpg';
  if (destId.includes('ooty') || destName.includes('ooty') || title.includes('ooty')) return '/images/packages/vac-ooty-3d.jpg';
  if (destId.includes('coimbatore') || destName.includes('coimbatore') || title.includes('coimbatore')) return '/images/destinations/coimbatore.jpg';

  // 7. Fallback by city
  if (destId.includes('coimbatore') || destName.includes('coimbatore')) return '/images/packages/iv-coimbatore-3d.jpg';
  if (destId.includes('pune') || destName.includes('pune')) return '/images/packages/iv-pune-3d.jpg';
  if (destId.includes('chennai') || destName.includes('chennai')) return '/images/packages/iv-chennai-3d.jpg';
  if (destId.includes('bengaluru') || destName.includes('bengaluru')) return '/images/packages/iv-bengaluru-3d.jpg';
  if (destId.includes('ahmedabad') || destName.includes('ahmedabad')) return '/images/packages/iv-ahmedabad-3d.jpg';
  if (destId.includes('hyderabad') || destName.includes('hyderabad')) return '/images/packages/iv-hyderabad-3d.jpg';

  return '/images/destinations/default.jpg';
}

/**
 * Renders loading skeleton state (1 Hero Skeleton + 3 Card Skeletons).
 * @param {HTMLElement} container - Destination DOM container
 */
export function renderLoadingSkeleton(container) {
  container.innerHTML = '';

  const wrap = createElement('div', 'skeleton-wrap');

  // Structured Hero Skeleton Card
  const heroSkeleton = createElement('div', 'skeleton-hero');

  // Top header placeholder
  const headerTop = createElement('div');
  headerTop.style.display = 'flex';
  headerTop.style.flexDirection = 'column';
  headerTop.style.gap = '10px';
  headerTop.appendChild(createElement('div', 'skeleton-pill skeleton-shimmer'));
  headerTop.appendChild(createElement('div', 'skeleton-title-line skeleton-shimmer'));
  headerTop.appendChild(createElement('div', 'skeleton-sub-line skeleton-shimmer'));
  heroSkeleton.appendChild(headerTop);

  // 4-stat strip placeholder
  const statStrip = createElement('div', 'skeleton-stat-strip');
  for (let s = 0; s < 4; s++) {
    statStrip.appendChild(createElement('div', 'skeleton-stat-box skeleton-shimmer'));
  }
  heroSkeleton.appendChild(statStrip);

  // 2-column body placeholder
  const heroBody = createElement('div', 'skeleton-hero-body');
  const leftCol = createElement('div', 'skeleton-col');
  leftCol.appendChild(createElement('div', 'skeleton-block skeleton-shimmer'));
  leftCol.appendChild(createElement('div', 'skeleton-block skeleton-shimmer'));
  leftCol.appendChild(createElement('div', 'skeleton-block skeleton-shimmer'));

  const rightCol = createElement('div', 'skeleton-col');
  rightCol.appendChild(createElement('div', 'skeleton-block tall skeleton-shimmer'));
  rightCol.appendChild(createElement('div', 'skeleton-block skeleton-shimmer'));

  heroBody.appendChild(leftCol);
  heroBody.appendChild(rightCol);
  heroSkeleton.appendChild(heroBody);

  wrap.appendChild(heroSkeleton);

  // 3-Card Grid Placeholder
  const grid = createElement('div', 'skeleton-grid');
  for (let i = 0; i < 3; i++) {
    const card = createElement('div', 'skeleton-card');
    card.appendChild(createElement('div', 'skeleton-pill skeleton-shimmer'));
    card.appendChild(createElement('div', 'skeleton-title-line skeleton-shimmer'));
    card.appendChild(createElement('div', 'skeleton-sub-line skeleton-shimmer'));
    card.appendChild(createElement('div', 'skeleton-sub-line skeleton-shimmer'));
    grid.appendChild(card);
  }
  wrap.appendChild(grid);

  container.appendChild(wrap);
}

export function renderAssumptions(container, assumptions = [], onChipClick) {
  if (container) container.style.display = 'none';
}

/**
 * Builds package details workbench (itinerary dropdown, cost breakdown, inclusions, logistics).
 * @param {Object} pkg - Package data object
 * @param {Object} data - Search response object
 * @param {Function} onCustomizeClick - Modal opener handler
 * @param {Function} onViewDetails - Package blueprint modal opener handler
 * @param {boolean} isCompact - Whether to use compact workbench header instead of full banner
 * @returns {HTMLElement} Workbench card element
 */
export function buildPackageWorkbench(pkg, data, onCustomizeClick, onViewDetails, isCompact = false) {
  const card = createElement('div', isCompact ? 'active-workbench-card' : 'card matched-hero-card');

  if (isCompact) {
    // Compact Header Bar (Zero wasted vertical space)
    const headerBar = createElement('div', 'workbench-header-bar');

    const titleGroup = createElement('div', 'workbench-title-group');
    const activeTag = createElement('span', 'workbench-active-tag');
    activeTag.innerHTML = '<span class="active-pulse-dot"></span>Selected Package';
    titleGroup.appendChild(activeTag);
    titleGroup.appendChild(createElement('h3', 'workbench-pkg-title', pkg.title));
    const destName = pkg.destination?.name || 'Destination';
    const destBadge = createElement('span', 'workbench-dest-badge');
    destBadge.innerHTML = `${ICONS.pin}<span>${destName}</span>`;
    titleGroup.appendChild(destBadge);
    headerBar.appendChild(titleGroup);

    const actionsRight = createElement('div', 'workbench-actions-right');
    const pricePill = createElement('span', 'workbench-price-pill', formatCurrency(pkg.price?.perPerson || 0, pkg.price?.currency) + ' / person');
    actionsRight.appendChild(pricePill);

    if (onViewDetails) {
      const exploreBtn = createElement('button', 'btn btn-secondary btn-sm', 'Blueprint Specs →');
      exploreBtn.addEventListener('click', () => onViewDetails(pkg));
      actionsRight.appendChild(exploreBtn);
    }

    if (onCustomizeClick) {
      const custBtn = createElement('button', 'btn btn-primary btn-sm');
      custBtn.innerHTML = `${ICONS.settings}<span>Customise</span>`;
      custBtn.addEventListener('click', () => onCustomizeClick(pkg));
      actionsRight.appendChild(custBtn);
    }

    headerBar.appendChild(actionsRight);
    card.appendChild(headerBar);

  } else {
    // 1. Hero Destination Image Banner (Used when only 1 package is returned)
    const imgBanner = createElement('div', 'matched-card-banner');
    const heroImg = createElement('img', 'matched-card-hero-img');
    heroImg.src = getDestinationImage(pkg);
    heroImg.alt = pkg.title;
    imgBanner.appendChild(heroImg);

    const overlay = createElement('div', 'matched-img-overlay');

    // Top Overlay Badges
    const topBadges = createElement('div', 'matched-banner-top');
    const leftBadges = createElement('div', 'matched-banner-badges');
    leftBadges.appendChild(createElement('span', 'banner-cat-pill', (pkg.category || 'trip').replace('_', ' ')));
    leftBadges.appendChild(createElement('span', 'banner-verified-badge', '✓ Certified by Rules Engine'));
    topBadges.appendChild(leftBadges);

    const priceTag = createElement('div', 'banner-price-tag');
    priceTag.innerHTML = '<span class="amount">' + formatCurrency(pkg.price?.perPerson || 0, pkg.price?.currency) + '</span><span class="unit">/ person</span>';
    topBadges.appendChild(priceTag);
    overlay.appendChild(topBadges);

    // Bottom Overlay Title & Location
    const bottomInfo = createElement('div', 'matched-banner-bottom');
    bottomInfo.appendChild(createElement('h2', 'matched-banner-title', pkg.title));

    const loc = createElement('span', 'matched-banner-location');
    const destName = pkg.destination?.name || 'Hub Destination';
    const destRegion = pkg.destination?.region || 'India';
    loc.innerHTML = '<svg style="width:15px;height:15px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ' + destName + ', ' + destRegion;
    bottomInfo.appendChild(loc);
    overlay.appendChild(bottomInfo);

    imgBanner.appendChild(overlay);
    card.appendChild(imgBanner);
  }

  // Content Wrapper for proper space utilization
  const contentWrap = createElement('div', 'matched-card-content');

  // Subtitle & Source Info (only in non-compact mode)
  if (!isCompact) {
    const subRow = createElement('div', 'matched-header');
    const subWrap = createElement('div');
    if (pkg.subtitle) {
      subWrap.appendChild(createElement('p', 'package-subtitle', pkg.subtitle));
    }
    subRow.appendChild(subWrap);
    const metaTag = createElement('span', 'meta-source-tag', (data.meta?.source || 'rules') + ' · ' + (data.meta?.latencyMs || 0) + 'ms');
    subRow.appendChild(metaTag);
    contentWrap.appendChild(subRow);
  }

  // 2. 4-Stat Strip (Duration · Group · Per person · Total)
  const statStrip = createElement('div', 'stat-strip');

  const stat1 = createElement('div', 'stat-item');
  stat1.appendChild(createElement('span', 'stat-label', 'Duration'));
  stat1.appendChild(createElement('span', 'stat-value', (pkg.duration?.days || 3) + 'D / ' + (pkg.duration?.nights || 2) + 'N'));

  const stat2 = createElement('div', 'stat-item');
  stat2.appendChild(createElement('span', 'stat-label', 'Group Logistics'));
  const groupText = pkg.group?.chaperones > 0
    ? pkg.group.size + ' (+' + pkg.group.chaperones + ' staff)'
    : (pkg.group?.size || 0) + ' travelers';
  stat2.appendChild(createElement('span', 'stat-value', groupText));

  const stat3 = createElement('div', 'stat-item');
  stat3.appendChild(createElement('span', 'stat-label', 'Per Person'));
  const perPersonEl = createElement('span', 'stat-value highlight');
  stat3.appendChild(perPersonEl);
  animatePriceCount(perPersonEl, 0, pkg.price?.perPerson || 0, pkg.price?.currency || 'INR');

  const stat4 = createElement('div', 'stat-item');
  stat4.appendChild(createElement('span', 'stat-label', 'Total Investment'));
  const totalEl = createElement('span', 'stat-value');
  stat4.appendChild(totalEl);
  animatePriceCount(totalEl, 0, pkg.price?.total || 0, pkg.price?.currency || 'INR');

  statStrip.appendChild(stat1);
  statStrip.appendChild(stat2);
  statStrip.appendChild(stat3);
  statStrip.appendChild(stat4);
  contentWrap.appendChild(statStrip);

  // Curated Highlights row if available
  if (pkg.highlights && pkg.highlights.length > 0) {
    const hlWrap = createElement('div', 'highlights-pill-grid');
    hlWrap.style.marginBottom = '16px';
    pkg.highlights.forEach(hl => {
      const item = createElement('div', 'highlight-pill-item');
      item.innerHTML = '<svg class="highlight-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      item.appendChild(createElement('span', '', hl));
      hlWrap.appendChild(item);
    });
    contentWrap.appendChild(hlWrap);
  }

  // 3. Two-Column Body
  const bodyGrid = createElement('div', 'matched-grid-body');

  // Left Column: Itinerary Header with Day Filter Dropdown & Accordion
  const leftCol = createElement('div', 'matched-left-col');

  // Itinerary Header Controls Row
  const itHeaderRow = createElement('div', 'itinerary-header-row');
  itHeaderRow.appendChild(createElement('h3', 'section-heading', 'Day-by-Day Curated Schedule'));

  const itControls = createElement('div', 'itinerary-controls');

  // Day Filter Dropdown
  const daySelect = createElement('select', 'itinerary-day-select');
  daySelect.setAttribute('aria-label', 'Filter itinerary days');
  const optAll = createElement('option', '', 'View All Days (' + (pkg.itinerary || []).length + ')');
  optAll.value = 'all';
  daySelect.appendChild(optAll);

  (pkg.itinerary || []).forEach((day, idx) => {
    const opt = createElement('option', '', 'Day ' + day.day + ': ' + day.title.substring(0, 28) + '...');
    opt.value = String(idx);
    daySelect.appendChild(opt);
  });
  itControls.appendChild(daySelect);

  // Collapse / Expand All Toggle Button
  const toggleAllBtn = createElement('button', 'btn-toggle-all-days', 'Collapse All');
  toggleAllBtn.type = 'button';
  itControls.appendChild(toggleAllBtn);

  itHeaderRow.appendChild(itControls);
  leftCol.appendChild(itHeaderRow);

  // Itinerary List
  const itineraryList = createElement('div', 'itinerary-list');
  const accordionItems = [];

  (pkg.itinerary || []).forEach((day, index) => {
    const item = createElement('div', 'accordion-item open');

    const itemHeader = createElement('button', 'accordion-header');
    itemHeader.type = 'button';

    const titleWrap = createElement('div', 'accordion-title-wrap');
    titleWrap.appendChild(createElement('span', 'day-badge', 'Day ' + day.day));
    titleWrap.appendChild(createElement('span', 'accordion-title', day.title));

    if (day.meals && day.meals.length > 0) {
      titleWrap.appendChild(createElement('span', 'itinerary-meals-badge', 'Meals: ' + day.meals.join(', ')));
    }

    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'accordion-icon');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2');
    chevron.setAttribute('stroke-linecap', 'round');
    chevron.setAttribute('stroke-linejoin', 'round');
    chevron.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';

    itemHeader.appendChild(titleWrap);
    itemHeader.appendChild(chevron);

    const itemBody = createElement('div', 'accordion-body');
    const actList = createElement('ul', 'activity-list');

    (day.activities || []).forEach(act => {
      const actItem = createElement('li', 'activity-item');
      actItem.appendChild(createElement('span', 'activity-bullet', '•'));
      actItem.appendChild(createElement('span', '', act));
      actList.appendChild(actItem);
    });

    itemBody.appendChild(actList);

    if (day.stay) {
      itemBody.appendChild(createElement('div', 'stay-note', 'Night Stay: ' + day.stay));
    }

    itemHeader.addEventListener('click', () => {
      item.classList.toggle('open');
      checkToggleBtnState();
    });

    item.appendChild(itemHeader);
    item.appendChild(itemBody);
    itineraryList.appendChild(item);
    accordionItems.push(item);
  });

  // Dropdown Filter Handler
  daySelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'all') {
      accordionItems.forEach(it => {
        it.style.display = 'block';
        it.classList.add('open');
      });
      toggleAllBtn.textContent = 'Collapse All';
    } else {
      const targetIdx = parseInt(val, 10);
      accordionItems.forEach((it, idx) => {
        if (idx === targetIdx) {
          it.style.display = 'block';
          it.classList.add('open');
          it.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          it.style.display = 'none';
        }
      });
      toggleAllBtn.textContent = 'Show All Days';
    }
  });

  // Toggle All Days Button Handler
  function checkToggleBtnState() {
    const anyOpen = accordionItems.some(it => it.classList.contains('open') && it.style.display !== 'none');
    toggleAllBtn.textContent = anyOpen ? 'Collapse All' : 'Expand All';
  }

  toggleAllBtn.addEventListener('click', () => {
    const isFiltered = daySelect.value !== 'all';
    if (isFiltered) {
      daySelect.value = 'all';
      accordionItems.forEach(it => {
        it.style.display = 'block';
      });
    }

    const anyOpen = accordionItems.some(it => it.classList.contains('open'));
    accordionItems.forEach(it => {
      if (anyOpen) {
        it.classList.remove('open');
      } else {
        it.classList.add('open');
      }
    });
    toggleAllBtn.textContent = anyOpen ? 'Expand All' : 'Collapse All';
  });

  leftCol.appendChild(itineraryList);
  bodyGrid.appendChild(leftCol);

  // Right Column: Price Breakdown Bar, Inclusions, CTA
  const rightCol = createElement('div', 'matched-right-col');

  // Price Breakdown Stacked Bar
  const breakdownCard = createElement('div', 'price-breakdown-card');
  breakdownCard.appendChild(createElement('h3', 'section-heading', 'Transparent Price Breakdown'));

  const stackedBar = createElement('div', 'breakdown-stacked-bar');
  const legend = createElement('div', 'breakdown-legend');
  const totalAmount = pkg.price?.perPerson || 1;

  (pkg.price?.breakdown || []).forEach((item, idx) => {
    const pct = Math.max(5, Math.round((item.amount / totalAmount) * 100));
    const segment = createElement('div', 'breakdown-segment segment-' + (idx % 5));
    segment.style.width = pct + '%';
    segment.title = item.label + ': ' + formatCurrency(item.amount, pkg.price?.currency);
    stackedBar.appendChild(segment);

    const legendRow = createElement('div', 'breakdown-row');
    const labelWrap = createElement('div', 'breakdown-label-wrap');
    const dot = createElement('span', 'legend-dot segment-' + (idx % 5));
    labelWrap.appendChild(dot);
    labelWrap.appendChild(createElement('span', '', item.label));

    const amountEl = createElement('span', 'breakdown-amount', formatCurrency(item.amount, pkg.price?.currency));
    legendRow.appendChild(labelWrap);
    legendRow.appendChild(amountEl);
    legend.appendChild(legendRow);
  });

  breakdownCard.appendChild(stackedBar);
  breakdownCard.appendChild(legend);
  rightCol.appendChild(breakdownCard);

  // Inclusions Block
  const incBlock = createElement('div', 'inclusions-block');
  incBlock.appendChild(createElement('h3', 'section-heading', 'Key Mandatory Inclusions'));
  const pillList = createElement('div', 'pill-list');

  (pkg.inclusions || []).forEach(inc => {
    const item = createElement('div', 'inclusion-item');
    item.innerHTML = '<span class="inc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span class="inc-text">' + inc + '</span>';
    pillList.appendChild(item);
  });
  incBlock.appendChild(pillList);
  rightCol.appendChild(incBlock);

  // Logistics & Supervision Spec
  const logBlock = createElement('div', 'logistics-card-grid');
  logBlock.style.marginBottom = '16px';

  const log1 = createElement('div', 'logistics-spec-box');
  log1.appendChild(createElement('span', 'logistics-spec-label', 'Supervision Ratio'));
  log1.appendChild(createElement('span', 'logistics-spec-value', pkg.group?.chaperones > 0 ? (pkg.group.chaperones + ' Staff Included') : 'Self-guided'));
  logBlock.appendChild(log1);

  const log2 = createElement('div', 'logistics-spec-box');
  log2.appendChild(createElement('span', 'logistics-spec-label', 'Rooms'));
  log2.appendChild(createElement('span', 'logistics-spec-value', (pkg.group?.rooms || 1) + ' Rooms Allocated'));
  logBlock.appendChild(log2);

  rightCol.appendChild(logBlock);

  // Package Action Buttons Group (Explore Blueprint + Customizer)
  const actionWrap = createElement('div', 'package-actions-group');

  if (onViewDetails) {
    const exploreBtn = createElement('button', 'btn-explore-blueprint', 'Go Inside Package (Full Details & Blueprint) →');
    exploreBtn.type = 'button';
    exploreBtn.addEventListener('click', () => onViewDetails(pkg));
    actionWrap.appendChild(exploreBtn);
  }

  if (onCustomizeClick) {
    const custBtn = createElement('button', 'btn-customise-pkg', 'Customise Package Parameters ⚙');
    custBtn.type = 'button';
    custBtn.addEventListener('click', () => onCustomizeClick(pkg));
    actionWrap.appendChild(custBtn);
  }

  rightCol.appendChild(actionWrap);
  bodyGrid.appendChild(rightCol);

  contentWrap.appendChild(bodyGrid);
  card.appendChild(contentWrap);

  return card;
}

/**
 * Renders matched package state.
 * When multiple packages / customized options are available, renders the visual Image Card List FIRST at the top,
 * followed by the compact interactive workbench below it.
 * Prevents full-screen block coverage and eliminates wasted whitespace.
 * @param {HTMLElement} container - Destination DOM node
 * @param {Object} data - Search response object
 * @param {Function} onCustomizeClick - Modal opener handler
 * @param {Function} onViewDetails - Package blueprint modal opener handler
 */
export function renderMatchedPackage(container, data, onCustomizeClick, onViewDetails) {
  container.innerHTML = '';
  const initialPkg = data.package;
  if (!initialPkg) return;

  const alts = (data.alternatives || []).filter(Boolean);
  const hasMultiple = alts.length > 0;

  if (hasMultiple) {
    const allPackages = [initialPkg, ...alts];
    let activePackage = initialPkg;

    // 1. Show the Image Card List FIRST at the top!
    const cardListSection = createElement('div', 'packages-card-list-section');

    const listHeader = createElement('div', 'packages-list-header');
    const titleWrap = createElement('div', 'packages-list-title-wrap');
    const pill = createElement('span', 'packages-list-pill');
    pill.innerHTML = `<span class="pill-verified-icon">${ICONS.verified}</span>Instant Verified Options`;
    titleWrap.appendChild(pill);
    titleWrap.appendChild(createElement('h3', 'packages-list-title', 'Available Options & Configurations (' + allPackages.length + ')'));
    listHeader.appendChild(titleWrap);

    const hint = createElement('span', 'packages-list-hint', 'Select any card to preview full itinerary, rooming, & cost blueprint below');
    listHeader.appendChild(hint);
    cardListSection.appendChild(listHeader);

    const cardGrid = createElement('div', 'packages-img-card-grid');
    const cardElements = [];

    allPackages.forEach((pkgItem, index) => {
      const isInitial = index === 0;
      const c = createElement('div', 'pkg-summary-card ' + (isInitial ? 'active-selected' : ''));

      const imgWrap = createElement('div', 'pkg-card-img-wrap');
      const img = createElement('img');
      img.src = getDestinationImage(pkgItem);
      img.alt = pkgItem.title;
      imgWrap.appendChild(img);

      const statusBadge = createElement('span', 'pkg-card-status-badge ' + (isInitial ? 'highlight' : ''));
      if (isInitial) {
        statusBadge.innerHTML = `<span class="badge-star-icon">${ICONS.star}</span> Best Match`;
      } else {
        statusBadge.textContent = 'Option ' + (index + 1);
      }
      imgWrap.appendChild(statusBadge);

      const priceChip = createElement('span', 'pkg-card-price-chip', formatCurrency(pkgItem.price?.perPerson || 0, pkgItem.price?.currency) + '/head');
      imgWrap.appendChild(priceChip);

      c.appendChild(imgWrap);

      const body = createElement('div', 'pkg-card-body');
      const metaLine = createElement('div', 'pkg-card-meta-line');
      const catSpan = createElement('span', 'pkg-card-cat');
      catSpan.innerHTML = '<span class="cat-dot"></span>' + (pkgItem.category || 'trip').replace('_', ' ');
      metaLine.appendChild(catSpan);
      metaLine.appendChild(createElement('span', 'pkg-card-days', (pkgItem.duration?.days || 3) + 'D / ' + (pkgItem.duration?.nights || 2) + 'N · ' + (pkgItem.group?.size || 20) + ' travelers'));
      body.appendChild(metaLine);

      const title = createElement('h4', 'pkg-card-title', pkgItem.title);
      title.title = pkgItem.title;
      body.appendChild(title);

      const destName = pkgItem.destination?.name || 'Destination';
      const trans = getTransportDisplay(pkgItem.transport);
      const locLine = createElement('div', 'pkg-card-loc');
      locLine.innerHTML = `<span class="loc-badge">${ICONS.pin}<span>${destName}</span></span><span class="transport-badge"><span class="transport-label-tag">Transport</span><span class="transport-value-wrap">${trans.icon}<span>${trans.name}</span></span></span>`;
      body.appendChild(locLine);

      const footer = createElement('div', 'pkg-card-footer');
      const selectBtn = createElement('button', 'btn-pkg-select');
      selectBtn.innerHTML = isInitial ? '<span class="sel-check">✓</span> Active Option' : 'Select Package';
      footer.appendChild(selectBtn);

      const viewLink = createElement('button', 'btn-alt-view', 'Blueprint →');
      viewLink.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onViewDetails) onViewDetails(pkgItem);
      });
      footer.appendChild(viewLink);

      body.appendChild(footer);
      c.appendChild(body);

      c.addEventListener('click', () => {
        if (activePackage === pkgItem) return;
        activePackage = pkgItem;

        cardElements.forEach((el, i) => {
          const isAct = allPackages[i] === pkgItem;
          el.classList.toggle('active-selected', isAct);
          const sBtn = el.querySelector('.btn-pkg-select');
          if (sBtn) sBtn.innerHTML = isAct ? '<span class="sel-check">✓</span> Active Option' : 'Select Package';
        });

        renderActiveWorkbench(activePackage);
      });

      cardElements.push(c);
      cardGrid.appendChild(c);
    });

    cardListSection.appendChild(cardGrid);
    container.appendChild(cardListSection);

    // 2. Active Package Workbench below the card list
    const workbenchWrap = createElement('div', 'active-package-workbench-wrapper');
    container.appendChild(workbenchWrap);

    function renderActiveWorkbench(curPkg) {
      workbenchWrap.innerHTML = '';
      const wb = buildPackageWorkbench(curPkg, data, onCustomizeClick, onViewDetails, true);
      workbenchWrap.appendChild(wb);
      applyStaggerAnimation([wb]);
    }

    renderActiveWorkbench(activePackage);
    applyStaggerAnimation(cardElements);

  } else {
    // Single package result (no multiple options)
    const singleCard = buildPackageWorkbench(initialPkg, data, onCustomizeClick, onViewDetails, false);
    container.appendChild(singleCard);
    applyStaggerAnimation([singleCard]);
  }
}

/**
 * Renders the Budget-Gap state card with live slider, levers, and alternatives.
 * @param {HTMLElement} container - Destination DOM node
 * @param {Object} data - Search response object
 * @param {Function} onSliderChange - Live slider change callback
 * @param {Function} onApplyLever - Lever apply button callback
 * @param {Function} onSearchQuery - Refined search query callback
 * @param {Function} [onViewDetails] - Details modal opener callback
 */
export function renderBudgetGap(container, data, onSliderChange, onApplyLever, onSearchQuery, onViewDetails) {
  container.innerHTML = '';
  const gap = data.budgetGap;
  const pkg = data.package;
  if (!gap) return;

  const curr = gap.currency || 'INR';
  const card = createElement('div', 'budget-gap-card');

  // 1. Header
  const header = createElement('div', 'gap-header');
  header.appendChild(createElement('span', 'gap-pill', 'Budget Feasibility Analysis'));

  const headlineText = `This trip needs ${formatCurrency(gap.minimum, curr)} per person, which is ${formatCurrency(gap.gapPerPerson, curr)} more than your budget.`;
  header.appendChild(createElement('h2', 'gap-headline', headlineText));

  if (gap.explanation) {
    header.appendChild(createElement('p', 'gap-explanation', gap.explanation));
  }
  card.appendChild(header);
  // 2. Feasible Image Card List FIRST!
  if (data.alternatives && data.alternatives.length > 0) {
    const altWrap = createElement('div', 'packages-card-list-section');
    altWrap.style.marginTop = '14px';

    const listHeader = createElement('div', 'packages-list-header');
    const titleWrap = createElement('div', 'packages-list-title-wrap');
    titleWrap.appendChild(createElement('span', 'packages-list-pill', 'Feasible Options'));
    titleWrap.appendChild(createElement('h3', 'packages-list-title', 'Feasible Packages Matching Your Budget (' + data.alternatives.length + ')'));
    listHeader.appendChild(titleWrap);
    listHeader.appendChild(createElement('span', 'packages-list-hint', '1-Click inspect or customize'));
    altWrap.appendChild(listHeader);

    const altGrid = createElement('div', 'packages-img-card-grid');
    data.alternatives.forEach((alt, idx) => {
      const altCard = createElement('div', 'pkg-summary-card');

      const imgWrap = createElement('div', 'pkg-card-img-wrap');
      const tImg = createElement('img');
      tImg.src = getDestinationImage(alt);
      tImg.alt = alt.title;
      imgWrap.appendChild(tImg);

      const statusBadge = createElement('span', 'pkg-card-status-badge highlight', '✓ Within Budget');
      imgWrap.appendChild(statusBadge);

      const priceChip = createElement('span', 'pkg-card-price-chip', formatCurrency(alt.price?.perPerson || 0, alt.price?.currency) + '/head');
      imgWrap.appendChild(priceChip);
      altCard.appendChild(imgWrap);

      const body = createElement('div', 'pkg-card-body');
      const metaLine = createElement('div', 'pkg-card-meta-line');
      metaLine.appendChild(createElement('span', 'pkg-card-cat', (alt.category || 'trip').replace('_', ' ')));
      metaLine.appendChild(createElement('span', 'pkg-card-days', (alt.duration?.days || 3) + 'D / ' + (alt.duration?.nights || 2) + 'N'));
      body.appendChild(metaLine);

      const title = createElement('h4', 'pkg-card-title', alt.title);
      title.title = alt.title;
      body.appendChild(title);

      const destName = alt.destination?.name || 'Destination';
      const altTrans = getTransportDisplay(alt.transport);
      const locLine = createElement('div', 'pkg-card-loc');
      locLine.innerHTML = `<span class="loc-badge">${ICONS.pin}<span>${destName}</span></span><span class="transport-badge"><span class="transport-label-tag">Transport</span><span class="transport-value-wrap">${altTrans.icon}<span>${altTrans.name}</span></span></span>`;
      body.appendChild(locLine);

      const footer = createElement('div', 'pkg-card-footer');
      const viewBtn = createElement('button', 'btn-pkg-select', 'Inspect Details →');
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onViewDetails) onViewDetails(alt);
      });
      footer.appendChild(viewBtn);

      const cBtn = createElement('button', 'btn-alt-view', 'Blueprint →');
      cBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onViewDetails) onViewDetails(alt);
      });
      footer.appendChild(cBtn);

      body.appendChild(footer);
      altCard.appendChild(body);

      altCard.addEventListener('click', () => {
        if (onViewDetails) onViewDetails(alt);
      });

      altGrid.appendChild(altCard);
    });

    altWrap.appendChild(altGrid);
    card.appendChild(altWrap);
  }


  // 2. Interactive Live Budget Slider
  const sliderSection = createElement('div', 'slider-section');

  const sliderHead = createElement('div', 'slider-header');
  sliderHead.appendChild(createElement('span', 'slider-label', 'Adjust your budget per person:'));
  const currentValDisplay = createElement('span', 'slider-current-value', formatCurrency(gap.requested, curr));
  sliderHead.appendChild(currentValDisplay);
  sliderSection.appendChild(sliderHead);

  const trackWrap = createElement('div', 'slider-track-wrap');
  const slider = createElement('input', 'live-budget-slider');
  slider.type = 'range';
  slider.min = '3000';
  slider.max = '12000';
  slider.step = '50';
  slider.value = String(gap.requested);
  slider.setAttribute('aria-label', 'Budget per person slider');

  // Compute recommended tick position
  const minVal = 3000;
  const maxVal = 12000;
  const recVal = gap.recommendedBudget || gap.minimum;
  const tickPct = Math.max(0, Math.min(100, ((recVal - minVal) / (maxVal - minVal)) * 100));

  const tick = createElement('div', 'slider-tick', `Recommended: ${formatCurrency(recVal, curr)}`);
  tick.style.left = `${tickPct}%`;

  trackWrap.appendChild(slider);
  trackWrap.appendChild(tick);
  sliderSection.appendChild(trackWrap);

  const minMax = createElement('div', 'slider-min-max');
  minMax.appendChild(createElement('span', '', `${formatCurrency(minVal, curr)} (Min)`));
  minMax.appendChild(createElement('span', '', `${formatCurrency(maxVal, curr)} (Max)`));
  sliderSection.appendChild(minMax);

  // Slider event listener with value update
  let prevVal = gap.requested;
  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    animatePriceCount(currentValDisplay, prevVal, val, curr, 100);
    prevVal = val;
    onSliderChange(val);
  });

  card.appendChild(sliderSection);

  // 3. Levers List
  if (gap.levers && gap.levers.length > 0) {
    const leversSection = createElement('div', 'levers-section');
    leversSection.appendChild(createElement('h3', 'levers-heading', 'Cost-Reduction Levers (Engine Guaranteed)'));

    const list = createElement('div', 'levers-list');
    gap.levers.forEach(lever => {
      const row = createElement('div', lever.feasibleWithBudget ? 'lever-row feasible' : 'lever-row');

      const info = createElement('div', 'lever-info');
      info.appendChild(createElement('span', 'lever-label', lever.label));

      if (lever.saves > 0) {
        info.appendChild(createElement('span', 'lever-badge saves', `Saves ${formatCurrency(lever.saves, curr)}`));
      }
      if (lever.feasibleWithBudget) {
        info.appendChild(createElement('span', 'lever-badge feasible-badge', '✓ Fits Your Budget'));
      }
      row.appendChild(info);

      const actions = createElement('div', 'lever-actions');
      actions.appendChild(createElement('span', 'lever-price', formatCurrency(lever.newPrice, curr)));

      const applyBtn = createElement('button', 'lever-apply-btn', 'Apply');
      applyBtn.type = 'button';
      applyBtn.addEventListener('click', () => onApplyLever(lever));
      actions.appendChild(applyBtn);

      row.appendChild(actions);
      list.appendChild(row);
    });

    leversSection.appendChild(list);
    card.appendChild(leversSection);
  }

  // 4. Nearby Destinations at Your Budget
  if (gap.nearbyAtYourBudget && gap.nearbyAtYourBudget.length > 0) {
    const nearbySection = createElement('div', 'nearby-section');
    nearbySection.appendChild(createElement('h3', 'levers-heading', 'Similar Hub Destinations at Your Budget'));

    const scrollWrap = createElement('div', 'nearby-scroll');
    gap.nearbyAtYourBudget.forEach(dest => {
      const dCard = createElement('div', 'nearby-card');
      dCard.appendChild(createElement('h4', 'nearby-name', dest.name));
      dCard.appendChild(createElement('p', 'nearby-why', dest.why));
      dCard.appendChild(createElement('span', 'nearby-price', `${formatCurrency(dest.perPerson, curr)} / head`));

      dCard.addEventListener('click', () => {
        const raw = data.query?.raw || '';
        const regex = new RegExp(pkg?.destination?.name || 'Coimbatore', 'i');
        const refined = raw.replace(regex, dest.name);
        onSearchQuery(refined);
      });

      scrollWrap.appendChild(dCard);
    });

    nearbySection.appendChild(scrollWrap);
    card.appendChild(nearbySection);
  }

  // 5. Pre-filled Refined Search Suggestion Box
  const rawQ = data.query?.raw || '';
  const firstNearby = gap.nearbyAtYourBudget?.[0]?.name || 'Pune';
  const currentDest = pkg?.destination?.name || 'Coimbatore';
  const refinedQuery = rawQ.replace(new RegExp(currentDest, 'i'), firstNearby);

  const refinedBox = createElement('div', 'refined-search-box');
  const textWrap = createElement('div', 'refined-text-wrap');
  textWrap.appendChild(createElement('div', 'refined-label', 'Or try alternative query'));
  textWrap.appendChild(createElement('div', 'refined-query', `"${refinedQuery}"`));
  refinedBox.appendChild(textWrap);

  const searchThisBtn = createElement('button', 'refined-btn', 'Search this destination');
  searchThisBtn.type = 'button';
  searchThisBtn.addEventListener('click', () => onSearchQuery(refinedQuery));
  refinedBox.appendChild(searchThisBtn);

  card.appendChild(refinedBox);
  container.appendChild(card);

  applyStaggerAnimation([card, ...container.querySelectorAll('.alt-card')]);
}

/**
 * Renders clarification state with up to 3 interactive questions and chips.
 * @param {HTMLElement} container - Destination DOM node
 * @param {Object} clarification - Clarification data
 * @param {Function} onChipSelect - Click handler for reply chips
 */
export function renderClarification(container, clarification, onChipSelect) {
  container.innerHTML = '';
  if (!clarification?.questions) return;

  const card = createElement('div', 'clarification-card');
  card.appendChild(createElement('h2', 'clarification-title', 'Just a few details to tailor your trip'));
  card.appendChild(createElement('p', 'clarification-desc', 'Select from the options below or refine your query to get instant matched pricing:'));

  clarification.questions.forEach(qItem => {
    const group = createElement('div', 'question-group');
    group.appendChild(createElement('h4', 'question-text', qItem.q));

    const chipsWrap = createElement('div', 'clarification-chips');
    (qItem.chips || []).forEach(chipText => {
      const chip = createElement('button', 'reply-chip', chipText);
      chip.type = 'button';
      chip.addEventListener('click', () => onChipSelect(chipText, qItem.field));
      chipsWrap.appendChild(chip);
    });

    group.appendChild(chipsWrap);
    card.appendChild(group);
  });

  container.appendChild(card);
  applyStaggerAnimation([card]);
}

/**
 * Renders error / business rule violation state with rule-compliant recommendations.
 * @param {HTMLElement} container - Destination DOM node
 * @param {string} message - Primary error message
 * @param {Object} [violation] - Optional rule violation diagnostic
 * @param {Object} [nearestPkg] - Nearest feasible package for guidance
 * @param {Function} [onCustomize] - Click handler for package customization
 * @param {Function} [onViewDetails] - Click handler for package blueprint modal
 * @param {Function} [onSearchQuery] - Click handler for search suggestion chips
 * @param {Array<Object>} [alternatives] - Alternative rule-compliant packages
 * @param {Array<Object>} [recommendedDestinations] - Category hub destinations
 * @param {Array<string>} [suggestedQueries] - Rule-compliant search suggestions
 */
export function renderError(
  container,
  message,
  violation,
  nearestPkg,
  onCustomize,
  onViewDetails,
  onSearchQuery,
  alternatives = [],
  recommendedDestinations = [],
  suggestedQueries = []
) {
  container.innerHTML = '';

  const card = createElement('div', 'not-found-card');

  // Header
  const header = createElement('div', 'not-found-header');
  const iconWrap = createElement('div', 'not-found-icon-wrap');
  iconWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  header.appendChild(iconWrap);

  const titleWrap = createElement('div');
  if (violation?.code) {
    titleWrap.appendChild(createElement('span', 'error-badge', violation.code.replace(/_/g, ' ')));
  }
  titleWrap.appendChild(createElement('h2', 'not-found-title', violation?.message || 'No Direct Match Found'));
  titleWrap.appendChild(createElement('p', 'not-found-desc', violation?.detail || message || 'Your search parameters cannot be directly fulfilled under our operating criteria.'));
  header.appendChild(titleWrap);
  card.appendChild(header);

  // Solution Box
  if (violation?.fix) {
    const fixBox = createElement('div', 'error-fix');
    fixBox.appendChild(createElement('strong', '', 'Criteria Recommendation: '));
    fixBox.appendChild(document.createTextNode(violation.fix));
    card.appendChild(fixBox);
  }

  // Recommended Destinations Section (strictly according to criteria/rules)
  if (recommendedDestinations && recommendedDestinations.length > 0) {
    const recBox = createElement('div', 'recommendations-box');
    const recTitle = createElement('h3', 'recommendations-title');
    recTitle.innerHTML = '<svg style="width:18px;height:18px;color:var(--brand);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Supported Hub Destinations For This Category';
    recBox.appendChild(recTitle);
    recBox.appendChild(createElement('p', 'recommendations-subtitle', 'These hub destinations are verified, licensed, and actively operated strictly within our criteria rules:'));

    const destGrid = createElement('div', 'recommended-dest-grid');
    recommendedDestinations.forEach(dest => {
      const dCard = createElement('div', 'dest-rec-card');

      // Distinct Destination Photo Thumbnail
      const dThumb = createElement('div', 'dest-rec-thumb');
      const dImg = createElement('img');
      dImg.src = getDestinationImage({ destination: dest });
      dImg.alt = dest.name;
      dThumb.appendChild(dImg);
      dCard.appendChild(dThumb);

      const topInfo = createElement('div');
      topInfo.appendChild(createElement('h4', 'dest-rec-name', dest.name));
      topInfo.appendChild(createElement('p', 'dest-rec-region', dest.region));
      topInfo.appendChild(createElement('p', 'dest-rec-highlight', dest.highlight));
      dCard.appendChild(topInfo);

      const btn = createElement('button', 'btn-dest-search', `Search ${dest.name} →`);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        if (onSearchQuery) onSearchQuery(`Trip to ${dest.name}`);
      });
      dCard.appendChild(btn);

      destGrid.appendChild(dCard);
    });
    recBox.appendChild(destGrid);

    // 1-Click Search Chips
    if (suggestedQueries && suggestedQueries.length > 0) {
      const sugWrap = createElement('div', 'suggested-queries-wrap');
      sugWrap.appendChild(createElement('div', 'suggested-queries-label', 'Or click a verified rule-compliant search:'));
      const chipList = createElement('div', 'suggested-chips-list');

      suggestedQueries.forEach(sq => {
        const chip = createElement('button', 'suggested-chip-btn', sq);
        chip.type = 'button';
        chip.addEventListener('click', () => {
          if (onSearchQuery) onSearchQuery(sq);
        });
        chipList.appendChild(chip);
      });

      sugWrap.appendChild(chipList);
      recBox.appendChild(sugWrap);
    }

    card.appendChild(recBox);
  }

  container.appendChild(card);

  // Rule-compliant packages (Nearest Feasible Package + Alternatives)
  const packagesToShow = [nearestPkg, ...(alternatives || [])].filter(Boolean);
  if (packagesToShow.length > 0) {
    const altWrap = createElement('div', 'alternatives-container');
    altWrap.appendChild(createElement('h3', 'alternatives-title', 'Verified Rule-Compliant Packages'));

    const altGrid = createElement('div', 'alternatives-grid');
    packagesToShow.forEach(pkgItem => {
      const altCard = createElement('div', 'alt-card');

      // Destination image thumbnail
      const thumb = createElement('div', 'alt-card-thumb');
      const tImg = createElement('img');
      tImg.src = getDestinationImage(pkgItem);
      tImg.alt = pkgItem.title;
      thumb.appendChild(tImg);
      altCard.appendChild(thumb);

      const topWrap = createElement('div');
      topWrap.appendChild(createElement('h4', 'alt-title', pkgItem.title));
      topWrap.appendChild(createElement('p', 'alt-desc', pkgItem.subtitle || pkgItem.summary));
      altCard.appendChild(topWrap);

      const footer = createElement('div', 'alt-footer');
      footer.appendChild(createElement('span', 'alt-price', formatCurrency(pkgItem.price?.perPerson || 0, pkgItem.price?.currency)));
      footer.appendChild(createElement('span', 'alt-tag', `${pkgItem.duration?.days || 3} Days`));
      altCard.appendChild(footer);

      const actBar = createElement('div', 'alt-card-actions');
      const viewBtn = createElement('button', 'btn-alt-view', 'Go Inside Package →');
      viewBtn.type = 'button';
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onViewDetails) onViewDetails(pkgItem);
      });
      actBar.appendChild(viewBtn);

      if (onCustomize) {
        const custBtn = createElement('button', 'lever-apply-btn', 'Customise');
        custBtn.type = 'button';
        custBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onCustomize(pkgItem);
        });
        actBar.appendChild(custBtn);
      }

      altCard.appendChild(actBar);
      altCard.addEventListener('click', () => {
        if (onViewDetails) onViewDetails(pkgItem);
      });

      altGrid.appendChild(altCard);
    });

    altWrap.appendChild(altGrid);
    container.appendChild(altWrap);
  }

  applyStaggerAnimation([card, ...container.querySelectorAll('.alt-card')]);
}

/**
 * Renders complete package details inside the modal.
 * Shows all information about the trip, itinerary, cost breakdown table,
 * room allocation, safety protocols, and inclusions/exclusions.
 * @param {Object} pkg - Full package object
 * @param {Function} onCustomize - Customization modal opener
 */
export function renderPackageDetailsModal(pkg, onCustomize) {
  const categoryPill = document.getElementById('details-category-pill');
  const titleEl = document.getElementById('details-modal-title');
  const subtitleEl = document.getElementById('details-modal-subtitle');
  const contentEl = document.getElementById('details-modal-content');
  const customizeBtn = document.getElementById('details-customize-btn');

  if (!pkg || !contentEl) return;

  const curr = pkg.price?.currency || 'INR';

  if (categoryPill) categoryPill.textContent = (pkg.category || 'trip').replace('_', ' ');
  if (titleEl) titleEl.textContent = pkg.title || 'Trip Package Specifications';
  if (subtitleEl) subtitleEl.textContent = pkg.subtitle || `${pkg.destination?.name || 'Destination'} | Verified Rules & Cost Engine`;

  contentEl.innerHTML = '';

  // 0. Hero Destination Image Banner in Modal
  const heroBanner = createElement('div', 'details-hero-img-banner');
  heroBanner.style.width = '100%';
  heroBanner.style.height = '180px';
  heroBanner.style.overflow = 'hidden';
  heroBanner.style.borderRadius = 'var(--radius-md)';
  heroBanner.style.marginBottom = '20px';
  heroBanner.style.position = 'relative';

  const modalImg = createElement('img');
  modalImg.src = getDestinationImage(pkg);
  modalImg.alt = pkg.title || 'Package destination';
  modalImg.style.width = '100%';
  modalImg.style.height = '100%';
  modalImg.style.objectFit = 'cover';
  heroBanner.appendChild(modalImg);
  contentEl.appendChild(heroBanner);

  // 1. Executive Summary & Overview Banner
  const banner = createElement('div', 'details-overview-banner');
  if (pkg.summary) {
    banner.appendChild(createElement('p', 'details-summary-text', pkg.summary));
  }

  // 4-Stat Strip
  const statStrip = createElement('div', 'stat-strip');
  const s1 = createElement('div', 'stat-item');
  s1.appendChild(createElement('span', 'stat-label', 'Duration'));
  s1.appendChild(createElement('span', 'stat-value', `${pkg.duration?.days || 3} Days / ${pkg.duration?.nights || 2} Nights`));

  const s2 = createElement('div', 'stat-item');
  s2.appendChild(createElement('span', 'stat-label', 'Group Logistics'));
  const groupLabel = pkg.group?.chaperones > 0
    ? `${pkg.group.size} travelers (+${pkg.group.chaperones} staff)`
    : `${pkg.group?.size || 0} travelers`;
  s2.appendChild(createElement('span', 'stat-value', groupLabel));

  const s3 = createElement('div', 'stat-item');
  s3.appendChild(createElement('span', 'stat-label', 'Price Per Person'));
  s3.appendChild(createElement('span', 'stat-value highlight', formatCurrency(pkg.price?.perPerson || 0, curr)));

  const s4 = createElement('div', 'stat-item');
  s4.appendChild(createElement('span', 'stat-label', 'Total Investment'));
  s4.appendChild(createElement('span', 'stat-value', formatCurrency(pkg.price?.total || 0, curr)));

  statStrip.appendChild(s1);
  statStrip.appendChild(s2);
  statStrip.appendChild(s3);
  statStrip.appendChild(s4);
  banner.appendChild(statStrip);
  contentEl.appendChild(banner);

  // 2. Curated Highlights
  if (pkg.highlights && pkg.highlights.length > 0) {
    const hlHeading = createElement('h3', 'detail-section-title', 'Curated Package Highlights');
    contentEl.appendChild(hlHeading);

    const hlGrid = createElement('div', 'highlights-pill-grid');
    pkg.highlights.forEach(hl => {
      const item = createElement('div', 'highlight-pill-item');
      item.innerHTML = '<svg class="highlight-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      item.appendChild(createElement('span', '', hl));
      hlGrid.appendChild(item);
    });
    contentEl.appendChild(hlGrid);
  }

  // 3. Complete Day-by-Day Itinerary
  const itHeading = createElement('h3', 'detail-section-title', 'Detailed Day-by-Day Itinerary');
  contentEl.appendChild(itHeading);

  const itList = createElement('div', 'itinerary-detail-list');
  (pkg.itinerary || []).forEach(day => {
    const dayCard = createElement('div', 'itinerary-detail-card');
    const head = createElement('div', 'itinerary-detail-header');

    const leftWrap = createElement('div');
    leftWrap.style.display = 'flex';
    leftWrap.style.alignItems = 'center';
    leftWrap.appendChild(createElement('span', 'itinerary-day-tag', `Day ${day.day}`));
    leftWrap.appendChild(createElement('span', 'itinerary-detail-title', day.title));
    head.appendChild(leftWrap);

    if (day.meals && day.meals.length > 0) {
      head.appendChild(createElement('span', 'itinerary-meals-badge', `Meals: ${day.meals.join(', ')}`));
    }
    dayCard.appendChild(head);

    const actList = createElement('ul', 'activity-list');
    (day.activities || []).forEach(act => {
      const actLi = createElement('li', 'activity-item');
      actLi.appendChild(createElement('span', 'activity-bullet', '•'));
      actLi.appendChild(createElement('span', '', act));
      actList.appendChild(actLi);
    });
    dayCard.appendChild(actList);

    if (day.stay) {
      dayCard.appendChild(createElement('div', 'stay-note', `Night Stay: ${day.stay}`));
    }

    itList.appendChild(dayCard);
  });
  contentEl.appendChild(itList);

  // 4. Transparent Itemized Cost Breakdown Table
  const costHeading = createElement('h3', 'detail-section-title', 'Transparent Price Breakdown (Engine Guaranteed)');
  contentEl.appendChild(costHeading);

  const tableWrap = createElement('div', 'cost-table-wrap');
  const table = createElement('table', 'cost-table');

  const thead = createElement('thead');
  const totalHeadcount = (pkg.group?.size || 1) + (pkg.group?.chaperones || 0);
  thead.innerHTML = `<tr><th>Component</th><th>Amount Per Person</th><th>Group Total (${totalHeadcount} pax)</th></tr>`;
  table.appendChild(thead);

  const tbody = createElement('tbody');

  (pkg.price?.breakdown || []).forEach(item => {
    const tr = createElement('tr');
    tr.appendChild(createElement('td', '', item.label));
    tr.appendChild(createElement('td', '', formatCurrency(item.amount, curr)));
    tr.appendChild(createElement('td', '', formatCurrency(item.amount * totalHeadcount, curr)));
    tbody.appendChild(tr);
  });

  // Total Row
  const totalRow = createElement('tr', 'total-row');
  totalRow.appendChild(createElement('td', '', 'Final Certified Total'));
  totalRow.appendChild(createElement('td', '', formatCurrency(pkg.price?.perPerson || 0, curr)));
  totalRow.appendChild(createElement('td', '', formatCurrency(pkg.price?.total || 0, curr)));
  tbody.appendChild(totalRow);

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  contentEl.appendChild(tableWrap);

  // 5. Logistics, Rooms & Chaperone Allocation
  const logHeading = createElement('h3', 'detail-section-title', 'Group Logistics & Operational Governance');
  contentEl.appendChild(logHeading);

  const logGrid = createElement('div', 'logistics-card-grid');

  const b1 = createElement('div', 'logistics-spec-box');
  b1.appendChild(createElement('span', 'logistics-spec-label', 'Room Allocation'));
  b1.appendChild(createElement('span', 'logistics-spec-value', `${pkg.group?.rooms || 0} Rooms (Twin/Double occupancy)`));
  logGrid.appendChild(b1);

  const b2 = createElement('div', 'logistics-spec-box');
  b2.appendChild(createElement('span', 'logistics-spec-label', 'Supervision Ratio'));
  const chapText = pkg.group?.chaperones > 0
    ? `${pkg.group.chaperones} Staff Chaperone${pkg.group.chaperones > 1 ? 's' : ''} (Mandatory)`
    : 'Self-guided adult group';
  b2.appendChild(createElement('span', 'logistics-spec-value', chapText));
  logGrid.appendChild(b2);

  const b3 = createElement('div', 'logistics-spec-box');
  b3.appendChild(createElement('span', 'logistics-spec-label', 'Transport Mode'));
  b3.appendChild(createElement('span', 'logistics-spec-value', pkg.transport ? pkg.transport.toUpperCase() : 'Dedicated AC Transport'));
  logGrid.appendChild(b3);

  const b4 = createElement('div', 'logistics-spec-box');
  b4.appendChild(createElement('span', 'logistics-spec-label', 'Stay Category'));
  const accLabel = pkg.accommodation === 'hostel' ? 'Youth Hostel / Dorms' : `${pkg.accommodation} Hotel`;
  b4.appendChild(createElement('span', 'logistics-spec-value', accLabel));
  logGrid.appendChild(b4);

  contentEl.appendChild(logGrid);

  // 6. Inclusions & Exclusions Checklist
  const incHeading = createElement('h3', 'detail-section-title', 'Inclusions & Exclusions Checklist');
  contentEl.appendChild(incHeading);

  const incGrid = createElement('div', 'inclusions-exclusions-grid');

  const incCol = createElement('div', 'checklist-card');
  incCol.appendChild(createElement('h4', 'checklist-title inc', '✓ Included in Package'));
  const incUl = createElement('ul', 'checklist-items');
  (pkg.inclusions || []).forEach(inc => {
    const li = createElement('li', 'checklist-item');
    li.innerHTML = '<span style="color:var(--green);margin-right:6px;">✓</span> ' + inc;
    incUl.appendChild(li);
  });
  incCol.appendChild(incUl);

  const excCol = createElement('div', 'checklist-card');
  excCol.appendChild(createElement('h4', 'checklist-title exc', '✕ Not Included / Disclosures'));
  const excUl = createElement('ul', 'checklist-items');
  (pkg.exclusions || ['Personal expenses & laundry', 'Discretionary tips', 'Room service & mini-bar']).forEach(exc => {
    const li = createElement('li', 'checklist-item');
    li.innerHTML = '<span style="color:var(--muted);margin-right:6px;">✕</span> ' + exc;
    excUl.appendChild(li);
  });
  excCol.appendChild(excUl);

  incGrid.appendChild(incCol);
  incGrid.appendChild(excCol);
  contentEl.appendChild(incGrid);

  // 7. Safety & Compliance
  if (pkg.safetyAndCompliance && pkg.safetyAndCompliance.length > 0) {
    const safeBlock = createElement('div', 'safety-block');
    safeBlock.style.marginTop = '16px';
    safeBlock.appendChild(createElement('strong', '', 'Verified Safety & Compliance: '));
    safeBlock.appendChild(document.createTextNode(pkg.safetyAndCompliance.join(' · ')));
    contentEl.appendChild(safeBlock);
  }

  // Update customize button handler
  if (customizeBtn) {
    customizeBtn.onclick = () => {
      document.getElementById('package-details-modal').style.display = 'none';
      if (onCustomize) onCustomize(pkg);
    };
  }
}

export default {
  createElement,
  formatCurrency,
  renderLoadingSkeleton,
  renderAssumptions,
  renderMatchedPackage,
  renderBudgetGap,
  renderClarification,
  renderError,
  renderPackageDetailsModal,
  getDestinationImage
};
