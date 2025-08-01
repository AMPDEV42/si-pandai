/**
 * Accessibility utilities for better user experience
 */

// Focus management
export const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Screen reader announcements
export const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Skip to main content
export const createSkipLink = () => {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white p-2 rounded z-50';
  
  document.body.insertBefore(skipLink, document.body.firstChild);
};

// High contrast mode detection
export const isHighContrastMode = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Reduced motion detection  
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Color scheme detection
export const getPreferredColorScheme = () => {
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// Focus visible polyfill
export const initializeFocusVisible = () => {
  let hadKeyboardEvent = true;
  
  const keyboardEventHandler = () => {
    hadKeyboardEvent = true;
  };
  
  const pointerEventHandler = () => {
    hadKeyboardEvent = false;
  };
  
  const focusHandler = (e) => {
    if (hadKeyboardEvent) {
      e.target.classList.add('focus-visible');
    }
  };
  
  const blurHandler = (e) => {
    e.target.classList.remove('focus-visible');
  };
  
  document.addEventListener('keydown', keyboardEventHandler, true);
  document.addEventListener('mousedown', pointerEventHandler, true);
  document.addEventListener('focus', focusHandler, true);
  document.addEventListener('blur', blurHandler, true);
};

export default {
  trapFocus,
  announceToScreenReader,
  createSkipLink,
  isHighContrastMode,
  prefersReducedMotion,
  getPreferredColorScheme,
  initializeFocusVisible
};
