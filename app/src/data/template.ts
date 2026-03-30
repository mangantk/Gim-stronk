// =============================================================================
// Op Strength — Week 1 Template Loader
// =============================================================================

import type { DayTemplate, WeekTemplate } from '../types';
import templateJson from '../../../data/template_week1.json';

/**
 * Full week template with all 5 training days.
 */
export const WEEK_TEMPLATE: WeekTemplate = templateJson as unknown as WeekTemplate;

/**
 * Get a day template by its dayId (A-E).
 */
export function getDayTemplate(dayId: string): DayTemplate | undefined {
  return WEEK_TEMPLATE.days.find((d) => d.dayId === dayId);
}
