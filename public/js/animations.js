/**
 * UI animation engine adhering strictly to master prompt specifications.
 * Supports prefers-reduced-motion fallback.
 */

/**
 * Checks whether user has enabled reduced motion preferences.
 * @returns {boolean} True if reduced motion is requested
 */
export function isReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Cubic ease-out calculation helper.
 * @param {number} t - Time normalized between 0 and 1
 * @returns {number} Eased progress
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a numeric price count-up using requestAnimationFrame.
 * @param {HTMLElement} element - Target DOM node
 * @param {number} start - Initial value
 * @param {number} target - Final value
 * @param {string} [currency='INR'] - Currency code
 * @param {number} [duration=700] - Duration in ms
 */
export function animatePriceCount(element, start = 0, target = 0, currency = 'INR', duration = 700) {
  if (!element) return;

  const symbol = currency === 'USD' ? '$' : '₹';
  const formatter = new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN');

  if (isReducedMotion() || duration === 0) {
    element.textContent = `${symbol}${formatter.format(target)}`;
    return;
  }

  const startTime = performance.now();
  const diff = target - start;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = Math.round(start + diff * eased);

    element.textContent = `${symbol}${formatter.format(current)}`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = `${symbol}${formatter.format(target)}`;
    }
  }

  requestAnimationFrame(update);
}

/**
 * Starts rotating placeholders with blur-fade transitions every 3.5s.
 * @param {HTMLElement} placeholderEl - Node displaying placeholder
 * @param {HTMLInputElement} inputEl - Target search input
 * @param {string[]} examples - Array of example query strings
 * @param {number} [interval=3500] - Switch interval in ms
 * @returns {Function} Teardown stop function
 */
export function animatePlaceholderRotation(placeholderEl, inputEl, examples = [], interval = 3500) {
  if (!placeholderEl || !inputEl || examples.length === 0) return () => {};

  let currentIndex = 0;
  placeholderEl.textContent = examples[0];

  const timer = setInterval(() => {
    // Only rotate if input is empty and not focused
    if (inputEl.value.trim().length > 0 || document.activeElement === inputEl) {
      return;
    }

    if (isReducedMotion()) {
      currentIndex = (currentIndex + 1) % examples.length;
      placeholderEl.textContent = examples[currentIndex];
      return;
    }

    // Step 1: Blur and fade out (240ms)
    placeholderEl.classList.remove('fade-in');
    placeholderEl.classList.add('fade-out');

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % examples.length;
      placeholderEl.textContent = examples[currentIndex];

      // Step 2: Fade in (240ms)
      placeholderEl.classList.remove('fade-out');
      placeholderEl.classList.add('fade-in');
    }, 240);
  }, interval);

  return () => clearInterval(timer);
}

/**
 * Applies stagger delay and fade-in animation to a list of card elements.
 * @param {NodeList | Array<HTMLElement>} elements - Target elements
 * @param {number} [stepMs=60] - Stagger step in ms
 */
export function applyStaggerAnimation(elements, stepMs = 60) {
  if (isReducedMotion()) return;

  Array.from(elements).forEach((el, index) => {
    el.classList.add('animate-slide-up');
    el.style.animationDelay = `${index * stepMs}ms`;
  });
}

export default {
  isReducedMotion,
  animatePriceCount,
  animatePlaceholderRotation,
  applyStaggerAnimation
};
