/**
 * Parse working hours string into from/to 24h format.
 * Supports presets: "7:00 AM - 3:00 PM", "9:00 AM - 5:00 PM", etc.
 * Returns null for "Off", empty, or unparseable strings.
 * @param {string} workingHours - e.g. "9:00 AM - 5:00 PM"
 * @returns {{ from: string, to: string } | null} - 24h format "HH:mm" or null
 */
export function parseWorkingHours(workingHours) {
  if (!workingHours || typeof workingHours !== 'string') return null;
  const s = workingHours.trim();
  if (!s || s.toLowerCase() === 'off') return null;

  const match = s.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  );
  if (!match) return null;

  const [, h1, m1, ap1, h2, m2, ap2] = match;
  const from = to24h(parseInt(h1, 10), parseInt(m1 || '0', 10), ap1.toLowerCase());
  const to = to24h(parseInt(h2, 10), parseInt(m2 || '0', 10), ap2.toLowerCase());
  if (from == null || to == null) return null;
  const fromMin = from.h * 60 + from.m;
  const toMin = to.h * 60 + to.m;
  if (fromMin >= toMin) return null;

  return {
    from: pad2(from.h) + ':' + pad2(from.m),
    to: pad2(to.h) + ':' + pad2(to.m)
  };
}

function to24h(hour, minute, ampm) {
  if (hour < 1 || hour > 12) return null;
  let h = hour;
  if (ampm === 'am') {
    if (hour === 12) h = 0;
  } else {
    if (hour !== 12) h = hour + 12;
  }
  return { h, m: minute };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Format 24h "HH:mm" to 12h "h:mm AM/PM".
 * @param {string} hhmm - e.g. "07:30", "15:30"
 * @returns {string} - e.g. "7:30 AM", "3:30 PM"
 */
export function format24hTo12h(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return '';
  const [hStr, mStr] = hhmm.trim().split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return hhmm;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour12}:${pad2(m)} ${ampm}`;
}
