/**
 * Professional Accessibility (a11y) Utilities
 * Provides tools for better accessibility support
 */

import { logger } from './logger';

/**
 * Focus management utilities
 */
export class FocusManager {
  constructor() {
    this.focusStack = [];
    this.trapEnabled = false;
  }

  // Save current focus and focus on element
  setFocus(element, options = {}) {
    if (!element) return;

    // Save current focus
    this.focusStack.push(document.activeElement);

    // Focus with options
    if (typeof element.focus === 'function') {
      element.focus(options);
    }
  }

  // Restore previous focus
  restoreFocus() {
    const previousElement = this.focusStack.pop();
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }

  // Trap focus within container
  trapFocus(container) {
    if (!container) return;

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    this.trapEnabled = true;

    // Focus first element
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      this.trapEnabled = false;
    };
  }

  // Get all focusable elements within container
  getFocusableElements(container) {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return Array.from(
      container.querySelectorAll(focusableSelectors.join(','))
    ).filter(element => {
      return element.offsetWidth > 0 && element.offsetHeight > 0;
    });
  }
}

/**
 * Screen reader utilities
 */
export class ScreenReaderUtils {
  static announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  static announcePageChange(title) {
    this.announce(`Halaman ${title} dimuat`, 'assertive');
  }

  static announceFormError(errors) {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      const message = `${errorCount} error ditemukan dalam form`;
      this.announce(message, 'assertive');
    }
  }

  static announceSuccess(message) {
    this.announce(`Berhasil: ${message}`, 'polite');
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  static KEYS = {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End'
  };

  static handleMenuNavigation(event, items, currentIndex, onSelect) {
    const { key } = event;

    switch (key) {
      case this.KEYS.ARROW_DOWN:
        event.preventDefault();
        return Math.min(currentIndex + 1, items.length - 1);

      case this.KEYS.ARROW_UP:
        event.preventDefault();
        return Math.max(currentIndex - 1, 0);

      case this.KEYS.HOME:
        event.preventDefault();
        return 0;

      case this.KEYS.END:
        event.preventDefault();
        return items.length - 1;

      case this.KEYS.ENTER:
      case this.KEYS.SPACE:
        event.preventDefault();
        if (onSelect) onSelect(items[currentIndex]);
        break;

      case this.KEYS.ESCAPE:
        event.preventDefault();
        return -1; // Close menu

      default:
        break;
    }

    return currentIndex;
  }

  static makeClickableByKeyboard(element, onClick) {
    if (!element || typeof onClick !== 'function') return;

    element.addEventListener('keydown', (event) => {
      if (event.key === this.KEYS.ENTER || event.key === this.KEYS.SPACE) {
        event.preventDefault();
        onClick(event);
      }
    });
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrastUtils {
  // Check if color combination meets WCAG contrast requirements
  static meetsContrastRequirement(foreground, background, level = 'AA') {
    const contrast = this.getContrastRatio(foreground, background);
    const minContrast = level === 'AAA' ? 7 : 4.5;
    return contrast >= minContrast;
  }

  // Calculate contrast ratio between two colors
  static getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Calculate relative luminance of a color
  static getLuminance(color) {
    const rgb = this.hexToRgb(color);
    const [r, g, b] = rgb.map(channel => {
      channel = channel / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Convert hex color to RGB
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : null;
  }
}

/**
 * ARIA utilities
 */
export class AriaUtils {
  // Generate unique ID for accessibility
  static generateId(prefix = 'a11y') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set ARIA attributes for form fields
  static setFormFieldAria(field, options = {}) {
    const {
      labelId,
      descriptionId,
      errorId,
      required = false,
      invalid = false
    } = options;

    if (labelId) field.setAttribute('aria-labelledby', labelId);
    if (descriptionId) field.setAttribute('aria-describedby', descriptionId);
    if (errorId && invalid) {
      const existingDescribedBy = field.getAttribute('aria-describedby');
      const describedBy = existingDescribedBy
        ? `${existingDescribedBy} ${errorId}`
        : errorId;
      field.setAttribute('aria-describedby', describedBy);
    }
    
    field.setAttribute('aria-required', required.toString());
    field.setAttribute('aria-invalid', invalid.toString());
  }

  // Set ARIA attributes for dialog/modal
  static setDialogAria(dialog, options = {}) {
    const { labelId, descriptionId, modal = true } = options;

    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', modal.toString());
    
    if (labelId) dialog.setAttribute('aria-labelledby', labelId);
    if (descriptionId) dialog.setAttribute('aria-describedby', descriptionId);
  }

  // Set ARIA attributes for expandable content
  static setExpandableAria(trigger, content, expanded = false) {
    const contentId = content.id || this.generateId('content');
    content.id = contentId;

    trigger.setAttribute('aria-expanded', expanded.toString());
    trigger.setAttribute('aria-controls', contentId);
    
    if (!expanded) {
      content.setAttribute('aria-hidden', 'true');
    } else {
      content.removeAttribute('aria-hidden');
    }
  }
}

/**
 * Accessibility checker (development mode)
 */
export class A11yChecker {
  static checkPage() {
    if (process.env.NODE_ENV !== 'development') return;

    const issues = [];

    // Check for missing alt text on images
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for missing labels on form fields
    const unlabeledInputs = document.querySelectorAll(
      'input:not([aria-label]):not([aria-labelledby]):not([id])'
    );
    if (unlabeledInputs.length > 0) {
      issues.push(`${unlabeledInputs.length} form fields missing labels`);
    }

    // Check for missing headings hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let expectedLevel = 1;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > expectedLevel + 1) {
        issues.push(`Heading level skipped: ${heading.textContent}`);
      }
      expectedLevel = Math.max(expectedLevel, level);
    });

    if (issues.length > 0) {
      logger.warn('Accessibility issues found:', issues);
    }
  }
}

// Global focus manager instance
export const focusManager = new FocusManager();

// Initialize accessibility checker in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Check accessibility on page load
  window.addEventListener('load', () => {
    setTimeout(() => A11yChecker.checkPage(), 1000);
  });
}

export default {
  FocusManager,
  ScreenReaderUtils,
  KeyboardNavigation,
  ColorContrastUtils,
  AriaUtils,
  A11yChecker,
  focusManager
};
