/**
 * Shared configuration constants for quiz certification and admin analytics.
 *
 * Centralizing these keeps the certificate, ranking, and analytics logic in
 * sync: changing a threshold here updates every dependent calculation instead
 * of leaving scattered hardcoded values.
 */

/** Minimum percentage score required to pass a certification quiz. */
export const CERTIFICATION_PASS_PERCENTAGE = 75;

/** Maximum number of submitted certification attempts a user may have. */
export const CERTIFICATION_MAX_ATTEMPTS = 3;

/** Number of recent days that defines an "active" user in admin analytics. */
export const ACTIVE_USER_WINDOW_DAYS = 30;

/** Window (ms) used to classify a user as active. */
export const ACTIVE_USER_WINDOW_MS =
  ACTIVE_USER_WINDOW_DAYS * 24 * 60 * 60 * 1000;