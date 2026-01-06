/**
 * Timezone-safe date utility functions
 *
 * These utilities ensure that dates are handled consistently in local timezone
 * without unexpected shifts caused by UTC conversion.
 */

/**
 * Get today's date as a YYYY-MM-DD string in local timezone
 */
export const getTodayString = (): string => {
  const today = new Date();
  return dateToString(today);
};

/**
 * Convert a Date object to YYYY-MM-DD string in local timezone
 */
export const dateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse a YYYY-MM-DD string to a Date object in local timezone
 * Avoids timezone shifts by explicitly using local date constructor
 */
export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a YYYY-MM-DD string for display
 * @param dateStr Date string in YYYY-MM-DD format
 * @param options Intl.DateTimeFormat options
 */
export const formatDateString = (
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }
): string => {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-US', options);
};

/**
 * Add days to a date and return new date string
 */
export const addDays = (dateStr: string, days: number): string => {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return dateToString(date);
};

/**
 * Get the next Monday from a given date (or return the date if it's already Monday)
 */
export const getNextMonday = (fromDate?: Date): string => {
  const date = fromDate || new Date();
  const dayOfWeek = date.getDay();

  // Calculate days until next Monday (0 = Sunday, 1 = Monday, etc.)
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7;

  const monday = new Date(date);
  monday.setDate(date.getDate() + daysUntilMonday);

  return dateToString(monday);
};

/**
 * Get the Monday of the week that contains the given date
 * If the date is Monday, returns that date. Otherwise returns the previous Monday.
 */
export const getMondayOfWeek = (fromDate?: Date): string => {
  const date = fromDate || new Date();
  const dayOfWeek = date.getDay();

  // Calculate days to go back to Monday (0 = Sunday, 1 = Monday, etc.)
  // Sunday (0) -> go back 6 days, Monday (1) -> 0 days, Tuesday (2) -> 1 day, etc.
  const daysToGoBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(date);
  monday.setDate(date.getDate() - daysToGoBack);

  return dateToString(monday);
};
