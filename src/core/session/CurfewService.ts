export interface CurfewSchedule {
  startHour: number; // default 19 (7 PM)
  startMinute: number; // default 30
  endHour: number; // default 8 (8 AM)
  endMinute: number; // default 0
}

export const DEFAULT_CURFEW: CurfewSchedule = {
  startHour: 19,
  startMinute: 30,
  endHour: 8,
  endMinute: 0,
};

/**
 * Checks whether the current wall clock time falls within the bedtime curfew window,
 * correctly handling midnight wraparounds.
 */
export function isCurfewActive(
  date: Date = new Date(),
  schedule: CurfewSchedule = DEFAULT_CURFEW
): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;

  if (startMinutes > endMinutes) {
    // Spans across midnight (e.g. 19:30 to 08:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Normal window within single day (e.g. 13:00 to 15:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}
