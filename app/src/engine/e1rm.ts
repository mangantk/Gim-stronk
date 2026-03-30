// =============================================================================
// Op Strength — e1RM Engine
// Source of truth: consolidated_spec_v3-1.md
// Epley formula (default): e1RM = weight × (1 + reps / 30)
// Brzycki formula:          e1RM = weight × 36 / (37 - reps)
// =============================================================================

/**
 * Round a value to the nearest 0.5.
 */
function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * Compute estimated one-rep max using the Epley formula.
 *
 * Edge cases:
 * - reps <= 0: returns the weight itself (single/no rep)
 * - reps === 1: e1RM equals weight (by definition)
 * - weight <= 0: returns 0
 *
 * Result is rounded to the nearest 0.5.
 */
export function computeE1RM(weight: number, reps: number): number {
  if (weight <= 0) return 0;
  if (reps <= 1) return roundToHalf(weight);

  const e1rm = weight * (1 + reps / 30);
  return roundToHalf(e1rm);
}

/**
 * Estimate the weight that can be lifted for a target number of reps,
 * given a known e1RM.
 *
 * Inverse Epley: weight = e1RM / (1 + targetReps / 30)
 *
 * Edge cases:
 * - targetReps <= 1: weight equals the e1RM
 * - e1rm <= 0: returns 0
 *
 * Result is rounded to the nearest 0.5.
 */
export function estimateWeightForReps(e1rm: number, targetReps: number): number {
  if (e1rm <= 0) return 0;
  if (targetReps <= 1) return roundToHalf(e1rm);

  const weight = e1rm / (1 + targetReps / 30);
  return roundToHalf(weight);
}

/**
 * Estimate how many reps can be performed at a given weight,
 * given a known e1RM.
 *
 * Rearranged Epley: reps = 30 × (e1RM / weight - 1)
 *
 * Edge cases:
 * - weight >= e1rm: returns 1 (can do at least one rep at or above e1RM)
 * - weight <= 0 or e1rm <= 0: returns 0
 *
 * Result is floored to a whole number (can't do partial reps).
 */
export function estimateRepsAtWeight(e1rm: number, weight: number): number {
  if (e1rm <= 0 || weight <= 0) return 0;
  if (weight >= e1rm) return 1;

  const reps = 30 * (e1rm / weight - 1);
  return Math.max(1, Math.floor(reps));
}
