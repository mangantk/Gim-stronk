// =============================================================================
// Op Strength — Exercise Library Loader
// Loads exercises from the bundled JSON and provides lookup utilities.
// =============================================================================

import type { Exercise } from '../types';
import exercisesJson from '../../../data/exercises.json';

/**
 * Full exercise library keyed by exercise ID.
 */
export const EXERCISES: Record<string, Exercise> = exercisesJson as unknown as Record<string, Exercise>;

/**
 * Look up an exercise by ID. Returns undefined if not found.
 */
export function getExercise(id: string): Exercise | undefined {
  return EXERCISES[id];
}

/**
 * Get the display name for an exercise. Falls back to the ID with
 * underscores replaced by spaces if the exercise is not in the library.
 */
export function getExerciseName(id: string): string {
  const ex = EXERCISES[id];
  if (ex) return ex.name;
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
