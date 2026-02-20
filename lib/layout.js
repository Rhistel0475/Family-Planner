/**
 * Shared layout constants for consistent main padding and content width.
 * Use these so pages don't diverge on padding/maxWidth.
 */

/** Main content padding when the page has bottom nav: top, sides, bottom */
export const MAIN_PADDING_WITH_NAV = '5rem 1.5rem 2rem 1.5rem';

/** Main content padding for centered/setup-style pages (less top) */
export const MAIN_PADDING_CENTERED = '2rem 1.5rem';

/** Max width for form/card content (family, setup, ai, schedule, recipes, status) */
export const CONTENT_WIDTH_FORM = 780;

/** Max width for wide/board content (chores board, dashboard-style) */
export const CONTENT_WIDTH_WIDE = 1200;

/** Slightly narrower form width for compact forms (e.g. recipes) */
export const CONTENT_WIDTH_FORM_NARROW = 560;
