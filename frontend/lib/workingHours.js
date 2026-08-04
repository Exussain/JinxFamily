/**
 * Utility to check if a given timestamp/date (or current time) is outside Iran working hours.
 * Working hours: 10:00 AM to 12:00 Midnight IRST/IRDT (10:00 - 24:00 / 00:00).
 * Outside working hours (Midnight / Night shift): 12:00 AM Midnight to 10:00 AM IRST/IRDT (00:00 - 10:00).
 *
 * @param {string|Date} [dateInput] - ISO date string or Date instance.
 * @returns {boolean} True if the time is outside working hours (between 00:00 and 10:00 AM Iran Time).
 */
export function isOutsideWorkingHours(dateInput) {
  try {
    const date = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(date.getTime())) return false;

    // Use Intl.DateTimeFormat with Asia/Tehran timezone and 0-23 hour cycle
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tehran",
      hour: "numeric",
      hourCycle: "h23"
    }).format(date);

    const hour = parseInt(hourStr, 10);
    // Hours 0..9 (12 AM midnight up to 9:59 AM Iran time) are outside working hours
    return hour >= 0 && hour < 10;
  } catch (e) {
    return false;
  }
}
