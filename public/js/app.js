/**
 * Main application coordinator.
 * Manages UI state machine, AJAX requests, search debouncing, event bindings, and modal dialogs.
 * Ensures 100% asynchronous AJAX operation with ZERO full-page reloads.
 */

import { searchTrip, fetchExamples, fetchHealth } from './api.js';
import { animatePlaceholderRotation } from './animations.js';
import { initSearchGuidance } from './guidance.js';
import {
  renderLoadingSkeleton,
  renderAssumptions,
  renderMatchedPackage,
  renderBudgetGap,
  renderClarification,
  renderError,
  renderPackageDetailsModal,
  getDestinationImage
} from './render.js?v=modern1';

// Application State
let currentQuery = '';
let currentOverrides = {};
let currentPackage = null;
let sliderDebounceTimer = null;
let hasSearchResults = false;

// DOM Elements
const heroSection = document.getElementById('hero-section');
const searchBarOuter = document.getElementById('search-bar-outer-wrapper');
const searchBarPlaceholder = document.getElementById('search-bar-placeholder');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const animatedPlaceholder = document.getElementById('animated-placeholder');

/**
 * Updates clear (cross) button visibility based on input content.
 */
function updateSearchClearBtn() {
  if (!searchClearBtn || !searchInput) return;
  const hasText = searchInput.value.length > 0;
  searchClearBtn.style.display = hasText ? 'flex' : 'none';
}
const quickChips = document.getElementById('quick-chips');
const assumptionsWrapper = document.getElementById('assumptions-wrapper');
const resultsSection = document.getElementById('results-section');
const systemStatusText = document.getElementById('system-status-text');
const ajaxStatusPill = document.getElementById('ajax-status-pill');
const ajaxStatusText = document.getElementById('ajax-status-text');

/**
 * Smoothly manages sticky search bar docking when results are present and user scrolls.
 * Uses native position: sticky with fluid CSS transitions; never snaps or jumps abruptly.
 */
function updateStickySearchState() {
  if (!searchBarOuter) return;

  if (!hasSearchResults) {
    searchBarOuter.classList.remove('is-sticky-mode', 'is-stuck');
    return;
  }

  // Enable native sticky docking
  searchBarOuter.classList.add('is-sticky-mode');

  // Check if search bar has docked at top of viewport (rect.top <= 2)
  const rect = searchBarOuter.getBoundingClientRect();
  const isStuck = rect.top <= 2;

  if (isStuck) {
    searchBarOuter.classList.add('is-stuck');
  } else {
    searchBarOuter.classList.remove('is-stuck');
  }
}

window.addEventListener('scroll', updateStickySearchState, { passive: true });

const stickyBrandLogo = document.getElementById('sticky-brand-logo');
if (stickyBrandLogo) {
  stickyBrandLogo.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Customization Modal Elements
const customizeModal = document.getElementById('customize-modal');
const customizeForm = document.getElementById('customize-form');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const customDuration = document.getElementById('custom-duration');
const customGroup = document.getElementById('custom-group');
const customTransport = document.getElementById('custom-transport');
const customAccommodation = document.getElementById('custom-accommodation');
const customBudget = document.getElementById('custom-budget');

// Full Package Details Modal Elements
const packageDetailsModal = document.getElementById('package-details-modal');
const detailsModalCloseBtn = document.getElementById('details-modal-close-btn');
const detailsModalDismissBtn = document.getElementById('details-modal-dismiss-btn');
const detailsPrintBtn = document.getElementById('details-print-btn');

// Contact Us Modal Elements
const contactUsBtn = document.getElementById('contact-us-btn');
const contactModal = document.getElementById('contact-modal');
const contactModalCloseBtn = document.getElementById('contact-modal-close-btn');
const contactModalCancelBtn = document.getElementById('contact-modal-cancel-btn');
const contactForm = document.getElementById('contact-form');
const contactSuccessState = document.getElementById('contact-success-state');
const contactSuccessCloseBtn = document.getElementById('contact-success-close-btn');
const contactSubmitBtn = document.getElementById('contact-submit-btn');

/**
 * Updates visual AJAX indicator state.
 * @param {boolean} isLoading - Whether an asynchronous request is in flight
 * @param {string} [message='AJAX Live'] - Status label
 */
function setAjaxLoading(isLoading, message = 'AJAX Live') {
  if (!ajaxStatusPill) return;
  if (isLoading) {
    ajaxStatusPill.classList.add('loading');
    if (ajaxStatusText) ajaxStatusText.textContent = message;
  } else {
    ajaxStatusPill.classList.remove('loading');
    if (ajaxStatusText) ajaxStatusText.textContent = 'AJAX Live';
  }
}

/**
 * Ensures the browser URL remains clean and secured without leaking or showing user search or travel data in the address bar.
 * @param {string} query - Query text
 */
function updateUrlQuery(query) {
  try {
    // Keep URL completely secured: never expose query parameters in browser address bar
    const cleanUrl = window.location.pathname;
    if (window.location.search) {
      window.history.replaceState({ query }, document.title, cleanUrl);
    } else {
      window.history.pushState({ query }, document.title, cleanUrl);
    }
  } catch (e) {
    // Graceful fallback for restricted origins
  }
}

/**
 * Initializes application on page load.
 */
async function init() {
  // 1. Fetch system health via AJAX
  try {
    const health = await fetchHealth();
    if (systemStatusText) {
      systemStatusText.textContent = health.aiConfigured
        ? 'AI + Rules Engine'
        : 'Rules-Only Mode';
    }
  } catch (e) {
    // Graceful fallback
  }

  // 2. Fetch and initialize placeholder rotation via AJAX
  const examples = await fetchExamples();
  if (examples.length > 0 && animatedPlaceholder && searchInput) {
    animatePlaceholderRotation(animatedPlaceholder, searchInput, examples, 3500);
  }



  // Hide placeholder & update clear icon when input receives text or focus
  searchInput.addEventListener('input', () => {
    if (animatedPlaceholder) {
      animatedPlaceholder.style.display = searchInput.value.length > 0 ? 'none' : 'block';
    }
    updateSearchClearBtn();
  });

  // Handle Enter key to submit search from multiline textarea (Shift+Enter inserts newline)
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      searchForm.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      searchInput.value = '';
      updateSearchClearBtn();
      if (animatedPlaceholder) {
        animatedPlaceholder.style.display = 'block';
        animatedPlaceholder.style.opacity = '1';
      }
      searchInput.focus();
    });
  }

  searchInput.addEventListener('focus', () => {
    if (animatedPlaceholder && searchInput.value.length === 0) {
      animatedPlaceholder.style.opacity = '0.4';
    }
  });

  searchInput.addEventListener('blur', () => {
    if (animatedPlaceholder && searchInput.value.length === 0) {
      animatedPlaceholder.style.opacity = '1';
    }
  });

  // 3. Quick Chips bindings: Executes instant AJAX search with pre-built category criteria
  quickChips.addEventListener('click', async (e) => {
    e.preventDefault();
    const chip = e.target.closest('.chip-btn');
    if (!chip) return;
    const cat = chip.dataset.category;
    if (!cat) return;

    let targetQuery = '';
    if (cat === 'Industrial Visit') {
      targetQuery = '3 day industrial visit for 30 mechanical students to Coimbatore';
    } else if (cat === 'School Trip') {
      targetQuery = '2 day science & agricultural discovery school trip for 35 students to Coimbatore';
    } else if (cat === 'College Trip') {
      targetQuery = '3 day fort trekking & youth adventure college trip for 25 students to Pune';
    } else if (cat === 'Vacation') {
      targetQuery = '4 day coastal escape & luxury resort vacation to Goa';
    } else {
      targetQuery = `${cat} package`;
    }

    searchInput.value = targetQuery;
    if (animatedPlaceholder) animatedPlaceholder.style.display = 'none';
    updateSearchClearBtn();
    currentQuery = targetQuery;
    currentOverrides = {};
    await executeSearch(targetQuery);
  });

  // 4. Recommendation & Syntax Guidance Engine (1-click template selection via AJAX)
  initSearchGuidance(searchInput, searchForm, async (chosenQuery) => {
    updateSearchClearBtn();
    currentQuery = chosenQuery;
    currentOverrides = {};
    await executeSearch(chosenQuery);
  });


  // 5. Search Form submission: Protected AJAX handler preventing whole-page reload
  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const query = searchInput.value.trim();
    if (!query) return false;

    currentQuery = query;
    currentOverrides = {};
    await executeSearch(query);
    return false;
  });

  // 6. Customization Modal bindings: In-place AJAX repricing
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);
  customizeModal.addEventListener('click', (e) => {
    if (e.target === customizeModal) closeModal();
  });

  customizeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();

    const overrides = {
      durationDays: parseInt(customDuration.value, 10),
      groupSize: parseInt(customGroup.value, 10),
      transport: customTransport.value,
      accommodation: customAccommodation.value
    };

    if (customBudget.value) {
      overrides.budgetPerPerson = parseInt(customBudget.value, 10);
    }

    currentOverrides = { ...currentOverrides, ...overrides };
    // Reprice in-place via AJAX without destroying the whole view
    await executeSearch(currentQuery, currentOverrides, { inPlace: true });
    return false;
  });

  // 7. Full Package Details Modal bindings
  if (detailsModalCloseBtn) {
    detailsModalCloseBtn.addEventListener('click', closePackageDetailsModal);
  }
  if (detailsModalDismissBtn) {
    detailsModalDismissBtn.addEventListener('click', closePackageDetailsModal);
  }
  if (detailsPrintBtn) {
    detailsPrintBtn.addEventListener('click', () => {
      window.print();
    });
  }
  if (packageDetailsModal) {
    packageDetailsModal.addEventListener('click', (e) => {
      if (e.target === packageDetailsModal) {
        closePackageDetailsModal();
      }
    });
  }

  // 7b. Contact Us Modal bindings & Form submission
  if (contactUsBtn) {
    contactUsBtn.addEventListener('click', openContactModal);
  }
  if (contactModalCloseBtn) {
    contactModalCloseBtn.addEventListener('click', closeContactModal);
  }
  if (contactModalCancelBtn) {
    contactModalCancelBtn.addEventListener('click', closeContactModal);
  }
  if (contactSuccessCloseBtn) {
    contactSuccessCloseBtn.addEventListener('click', closeContactModal);
  }
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        closeContactModal();
      }
    });
  }

  // Global ESC key to close any active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (contactModal && contactModal.style.display === 'flex') closeContactModal();
      if (customizeModal && customizeModal.style.display === 'flex') closeModal();
      if (packageDetailsModal && packageDetailsModal.style.display === 'flex') closePackageDetailsModal();
    }
  });

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value.trim();
      const phone = document.getElementById('contact-phone')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      const tripType = document.getElementById('contact-trip-type')?.value;
      const message = document.getElementById('contact-message')?.value.trim();

      if (!name || !email || !message) return false;

      const submitBtn = document.getElementById('contact-submit-btn');
      const origHtml = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span>';
      }

      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, tripType, message })
        });
      } catch (err) {
        // Fallback gracefully
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origHtml;
        }
        if (contactForm) contactForm.style.display = 'none';
        if (contactSuccessState) contactSuccessState.style.display = 'block';
      }
      return false;
    });
  }

  // 8. Handle browser back/forward buttons seamlessly via AJAX with in-memory state
  window.addEventListener('popstate', (e) => {
    const q = e.state?.query;
    if (q && q !== currentQuery) {
      searchInput.value = q;
      if (animatedPlaceholder) animatedPlaceholder.style.display = 'none';
      currentQuery = q;
      currentOverrides = {};
      executeSearch(q, {}, { skipUrlUpdate: true });
    }
  });

  // 9. Initial load check: if legacy query params exist, extract once and IMMEDIATELY strip from the address bar for security
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || urlParams.get('query');
  if (window.location.search) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {}
  }

  if (initialQuery && initialQuery.trim()) {
    searchInput.value = initialQuery.trim();
    if (animatedPlaceholder) animatedPlaceholder.style.display = 'none';
    updateSearchClearBtn();
    currentQuery = initialQuery.trim();
    executeSearch(initialQuery.trim(), {}, { skipUrlUpdate: true });
  } else {
    updateSearchClearBtn();
  }
}

/**
 * Executes travel search via AJAX and dynamically renders result states.
 * Guarantees zero whole-page reloads and provides smooth in-place updating.
 * @param {string} query - Plain English search query
 * @param {Object} [overrides={}] - Optional parameter overrides
 * @param {Object} [options={}] - Execution options
 */
async function executeSearch(query, overrides = {}, options = {}) {
  const { inPlace = false, skipUrlUpdate = false } = options;

  if (!skipUrlUpdate) {
    updateUrlQuery(query);
  }

  // Shrink hero into compact mode without layout jumping
  heroSection.classList.add('compact');

  setAjaxLoading(true, inPlace ? 'AJAX Repricing...' : 'AJAX Searching...');

  // If in-place reprice, keep existing card visible with smooth progress indicator
  const existingCard = resultsSection.querySelector('.package-card');
  if (inPlace && existingCard) {
    existingCard.classList.add('ajax-updating');
    const existingProg = existingCard.querySelector('.ajax-progress-bar');
    if (!existingProg) {
      const prog = document.createElement('div');
      prog.className = 'ajax-progress-bar';
      existingCard.prepend(prog);
    }
  } else {
    // Render loading skeleton for full query transitions
    renderLoadingSkeleton(resultsSection);
  }

  const startTime = Date.now();

  try {
    const data = await searchTrip(query, overrides);

    // Keep brief shimmer if starting fresh so animation is smooth
    const elapsed = Date.now() - startTime;
    if (!inPlace && elapsed < 320) {
      await new Promise(resolve => setTimeout(resolve, 320 - elapsed));
    }

    setAjaxLoading(false);

    // 1. Matched State
    if (data.status === 'matched') {
      hasSearchResults = true;
      currentPackage = data.package;
      renderMatchedPackage(resultsSection, data, openModal, openPackageDetailsModal);
      updateStickySearchState();

      // If details modal is open during in-place reprice, update it simultaneously
      if (packageDetailsModal && packageDetailsModal.style.display === 'flex') {
        renderPackageDetailsModal(data.package, openModal);
      }
      return;
    }

    // 2. Budget Gap State
    if (data.status === 'budget_gap') {
      hasSearchResults = true;
      currentPackage = data.package;
      renderBudgetGap(
        resultsSection,
        data,
        handleSliderChange,
        handleApplyLever,
        handleRefinedQuery,
        openPackageDetailsModal
      );
      updateStickySearchState();

      if (packageDetailsModal && packageDetailsModal.style.display === 'flex') {
        renderPackageDetailsModal(data.package, openModal);
      }
      return;
    }

    // 3. Needs Clarification State
    if (data.status === 'needs_clarification') {
      hasSearchResults = false;
      updateStickySearchState();
      renderClarification(resultsSection, data.clarification, handleClarificationChip);
      return;
    }

    // 4. Error / Validation State
    if (data.status === 'error') {
      hasSearchResults = !!(data.alternatives && data.alternatives.length > 0);
      updateStickySearchState();
      renderError(
        resultsSection,
        data.message,
        data.clarification?.violation,
        data.package,
        openModal,
        openPackageDetailsModal,
        handleRefinedQuery,
        data.alternatives,
        data.clarification?.recommendedDestinations,
        data.clarification?.suggestedQueries
      );
      return;
    }
  } catch (err) {
    setAjaxLoading(false);
    renderError(
      resultsSection,
      'Could not connect to the search service. Please verify server status.',
      null,
      null,
      openModal,
      openPackageDetailsModal,
      handleRefinedQuery
    );
  }
}

/**
 * Opens full package details blueprint modal.
 * @param {Object} pkg - Package data object
 */
function openPackageDetailsModal(pkg) {
  const targetPkg = pkg || currentPackage;
  if (!targetPkg || !packageDetailsModal) return;
  renderPackageDetailsModal(targetPkg, openModal);
  packageDetailsModal.style.display = 'flex';
}

/**
 * Closes full package details blueprint modal.
 */
function closePackageDetailsModal() {
  if (packageDetailsModal) {
    packageDetailsModal.style.display = 'none';
  }
}

/**
 * Handles live budget slider input with 350ms debounce via AJAX in-place update.
 * @param {number} newBudget - Target budget per person
 */
function handleSliderChange(newBudget) {
  clearTimeout(sliderDebounceTimer);
  sliderDebounceTimer = setTimeout(async () => {
    currentOverrides.budgetPerPerson = newBudget;
    await executeSearch(currentQuery, currentOverrides, { inPlace: true });
  }, 350);
}

/**
 * Handles apply lever button click via AJAX in-place update.
 * @param {Object} lever - Selected lever object
 */
async function handleApplyLever(lever) {
  if (lever.override) {
    currentOverrides = { ...currentOverrides, ...lever.override };
    await executeSearch(currentQuery, currentOverrides, { inPlace: true });
  }
}

/**
 * Handles one-click search on refined destination suggestions via AJAX.
 * @param {string} refinedQuery - Pre-filled refined search text
 */
async function handleRefinedQuery(refinedQuery) {
  searchInput.value = refinedQuery;
  updateSearchClearBtn();
  currentQuery = refinedQuery;
  currentOverrides = {};
  if (animatedPlaceholder) animatedPlaceholder.style.display = 'none';
  await executeSearch(refinedQuery);
}

/**
 * Handles quick-reply chip selections in clarification state via AJAX.
 * @param {string} chipText - Text of selected chip
 * @param {string} field - Field being clarified
 */
async function handleClarificationChip(chipText, field) {
  let addition = '';
  if (field === 'durationDays') {
    addition = `for ${chipText}`;
  } else if (field === 'groupSize') {
    addition = `for ${chipText}`;
  } else if (field === 'budgetPerPerson') {
    addition = `budget ${chipText}`;
  } else {
    addition = `to ${chipText}`;
  }

  searchInput.value = `${searchInput.value.trim()} ${addition}`.trim();
  updateSearchClearBtn();
  currentQuery = searchInput.value;
  currentOverrides = {};
  await executeSearch(currentQuery);
}

/**
 * Handles clicking on assumption chips to modify values.
 * @param {string} assumptionText - Text of clicked assumption
 */
function handleAssumptionClick(assumptionText) {
  if (currentPackage) {
    openModal(currentPackage);
  }
}

/**
 * Opens package customization modal dialog.
 * @param {Object} pkg - Package data to pre-fill
 */
function openModal(pkg) {
  if (!pkg) return;
  customDuration.value = pkg.duration?.days || 3;
  customGroup.value = pkg.group?.size || 20;
  customTransport.value = pkg.transport || 'bus';
  customAccommodation.value = pkg.accommodation || '3star';
  customBudget.value = pkg.price?.perPerson || '';

  customizeModal.style.display = 'flex';
}

/**
 * Closes package customization modal dialog.
 */
function closeModal() {
  customizeModal.style.display = 'none';
}

/**
 * Opens contact concierge modal dialog.
 */
function openContactModal() {
  if (!contactModal) return;
  if (contactForm) {
    contactForm.reset();
    contactForm.style.display = 'block';
  }
  if (contactSuccessState) {
    contactSuccessState.style.display = 'none';
  }
  contactModal.style.display = 'flex';
  setTimeout(() => {
    document.getElementById('contact-name')?.focus();
  }, 100);
}

/**
 * Closes contact concierge modal dialog.
 */
function closeContactModal() {
  if (contactModal) {
    contactModal.style.display = 'none';
  }
}

// Start application
document.addEventListener('DOMContentLoaded', init);
