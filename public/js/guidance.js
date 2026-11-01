/**
 * Rotating Recommendation Guidance Engine for Customized Package Trips.
 * Educates customers on query syntax, formats, and provides 1-click actionable templates.
 */

export const CUSTOM_RECOMMENDATIONS = [
  {
    category: 'Industrial Visit',
    badge: 'Custom IV Trip',
    prefix: 'Try an Engineering Industrial Tour:',
    query: '3 day industrial visit for 45 mechanical students to Coimbatore, budget 4500 per head',
    tip: '💡 Includes plant permissions, PPE safety gear, coordinator & verified college criteria.'
  },
  {
    category: 'Vacation',
    badge: 'Custom Vacation',
    prefix: 'Try a Luxury Beach Resort Holiday:',
    query: '4-day family vacation to Goa with 4-star resort for 4 adults, budget 25000 each',
    tip: '💡 Includes 4-star beachside stay, private cab transfers & coastal sightseeing itinerary.'
  },
  {
    category: 'School Trip',
    badge: 'Educational Outing',
    prefix: 'Try a Safe School Study Tour:',
    query: '2 day school trip to Ooty for 50 class 9 students with bus transport & all meals',
    tip: '💡 Includes 1:15 mandatory teacher supervision, tea factory tour & student safety insurance.'
  },
  {
    category: 'College Trip',
    badge: 'College Adventure',
    prefix: 'Try a Student Himalayan Expedition:',
    query: '5 day college trip to Manali for 25 students with trekking and camp stay',
    tip: '💡 Includes Solang valley adventures, group bonfire, AC bus transit & hostel dorms.'
  },
  {
    category: 'Automotive Tour',
    badge: 'Automobile Tech',
    prefix: 'Try an Automotive Manufacturing Tour:',
    query: '3-day automobile engineering tour to Pune for 30 students with factory visits, budget 5000',
    tip: '💡 Includes robotic assembly plant visits, industrial certification & institutional pricing.'
  },
  {
    category: 'International Exposure',
    badge: 'Global Tech Tour',
    prefix: 'Try an International Industrial Tour:',
    query: '4 day industrial visit to Dubai for 20 students covering logistics and Jebel Ali port',
    tip: '💡 Includes flight transits, international insurance, automated port visit & tech tour.'
  }
];

/**
 * Initializes changing recommendation sentence below the search bar.
 * @param {HTMLInputElement} searchInput - Search text input
 * @param {HTMLFormElement} searchForm - Search form element
 * @param {Function} onSelectQuery - Callback to execute search
 */
export function initSearchGuidance(searchInput, searchForm, onSelectQuery) {
  const container = document.getElementById('search-guidance-container');
  const toggleBtn = document.getElementById('guidance-toggle-btn');
  const toggleText = document.getElementById('guidance-toggle-text');
  const card = document.getElementById('guidance-rotating-card');
  const prefixEl = document.getElementById('guidance-prefix');
  const sentenceEl = document.getElementById('guidance-sentence');
  const tipEl = document.getElementById('guidance-tip');
  const prevBtn = document.getElementById('guidance-prev-btn');
  const nextBtn = document.getElementById('guidance-next-btn');
  const applyBtn = document.getElementById('guidance-apply-btn');
  const dotsContainer = document.getElementById('guidance-dots');

  if (!container || !sentenceEl) return;

  let isVisible = false;
  let currentIndex = 0;
  let rotateTimer = null;
  const total = CUSTOM_RECOMMENDATIONS.length;

  // Build dots navigation
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = i === 0 ? 'guidance-dot active' : 'guidance-dot';
      dot.setAttribute('aria-label', `Go to recommendation ${i + 1}`);
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToIndex(i);
      });
      dotsContainer.appendChild(dot);
    }
  }

  function updateDisplay(index) {
    const item = CUSTOM_RECOMMENDATIONS[index];
    if (!item) return;

    if (prefixEl) prefixEl.textContent = item.prefix;
    if (sentenceEl) sentenceEl.textContent = `"${item.query}"`;
    if (tipEl) tipEl.textContent = item.tip;

    // Update dots
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.guidance-dot');
      dots.forEach((d, idx) => {
        d.classList.toggle('active', idx === index);
      });
    }
  }

  function goToIndex(newIndex) {
    currentIndex = (newIndex + total) % total;
    if (card) {
      card.classList.remove('fade-in');
      card.classList.add('fade-out');
      setTimeout(() => {
        updateDisplay(currentIndex);
        card.classList.remove('fade-out');
        card.classList.add('fade-in');
      }, 180);
    } else {
      updateDisplay(currentIndex);
    }
  }

  function startRotation() {
    stopRotation();
    if (!isVisible) return;
    rotateTimer = setInterval(() => {
      // Don't rotate if user has entered custom text or is actively typing
      if (searchInput && searchInput.value.trim().length > 0) return;
      if (document.activeElement === searchInput) return;
      goToIndex(currentIndex + 1);
    }, 3800);
  }

  function stopRotation() {
    if (rotateTimer) {
      clearInterval(rotateTimer);
      rotateTimer = null;
    }
  }

  function toggleGuidance(forceState) {
    isVisible = typeof forceState === 'boolean' ? forceState : !isVisible;
    if (isVisible) {
      container.style.display = 'flex';
      if (toggleBtn) {
        toggleBtn.classList.add('active');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
      if (toggleText) toggleText.textContent = 'Hide Example Prompts & Formula';
      updateDisplay(currentIndex);
      startRotation();
    } else {
      container.style.display = 'none';
      if (toggleBtn) {
        toggleBtn.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
      if (toggleText) toggleText.textContent = 'Show Example Prompts & Formula';
      stopRotation();
    }
  }

  function applyCurrentQuery() {
    const item = CUSTOM_RECOMMENDATIONS[currentIndex];
    if (!item || !searchInput) return;

    searchInput.value = item.query;
    const placeholder = document.getElementById('animated-placeholder');
    if (placeholder) placeholder.style.display = 'none';
    searchInput.focus();

    // Auto collapse the example prompt to keep UI clean once user chooses it
    toggleGuidance(false);

    if (onSelectQuery) {
      onSelectQuery(item.query);
    }
  }

  // Toggle button click
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleGuidance();
    });
  }

  // Navigation Buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToIndex(currentIndex - 1);
      startRotation();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToIndex(currentIndex + 1);
      startRotation();
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyCurrentQuery();
    });
  }

  // Clicking sentence or card directly fills input and executes search
  if (sentenceEl) {
    sentenceEl.addEventListener('click', (e) => {
      e.stopPropagation();
      applyCurrentQuery();
    });
  }

  if (card) {
    // Stop rotating when mouse is kept (hovered)
    card.addEventListener('mouseenter', () => {
      stopRotation();
    });
    // Resume rotating when mouse leaves
    card.addEventListener('mouseleave', () => {
      if (isVisible) {
        startRotation();
      }
    });

    // Clicking anywhere on card triggers search (unless navigating dots or prev/next)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.guidance-nav-btn') || e.target.closest('.guidance-dot')) {
        return;
      }
      applyCurrentQuery();
    });
  }

  // Initial render (display prepared, but stays hidden until clicked)
  updateDisplay(0);
}
