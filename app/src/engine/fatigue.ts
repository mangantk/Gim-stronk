// =============================================================================
// Op Strength — Fatigue Engine
// Source of truth: consolidated_spec_v3-1.md, Section 5.1
// =============================================================================

import { Exercise, ExerciseSet } from '../types';
import { RIR_MULTIPLIERS } from '../data/constants';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the RIR multiplier for a given set.
 *
 * Priority:
 *   1. If set.isLSTF is true → use the "lstf" multiplier (1.60).
 *   2. Use set.rir directly if available (>= 0).
 *   3. Derive RIR from RPE: rir = 10 - rpe.
 *   4. Clamp to the range [0, 4] for lookup.
 *   5. For RIR > 4, use the multiplier for RIR 4 (0.70).
 */
function getRIRMultiplier(set: ExerciseSet): number {
  if (set.isLSTF) {
    return RIR_MULTIPLIERS['lstf'];
  }

  // Determine effective RIR
  let rir: number;
  if (set.rir != null && set.rir >= 0) {
    rir = set.rir;
  } else {
    rir = 10 - set.rpe;
  }

  // Clamp to lookup range — anything above 4 gets the lowest multiplier
  const clampedRIR = Math.min(4, Math.max(0, Math.round(rir)));
  return RIR_MULTIPLIERS[clampedRIR] ?? RIR_MULTIPLIERS[4];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the fatigue units (FU) for a single working set.
 *
 *   FU_per_set = exercise.sfr.fatigueCost × rirMultiplier
 *
 * Warmup sets contribute zero fatigue.
 */
export function computeSetFU(exercise: Exercise, set: ExerciseSet): number {
  if (set.isWarmup) return 0;

  const baseCost = exercise.sfr.fatigueCost;
  const multiplier = getRIRMultiplier(set);
  return Math.round(baseCost * multiplier * 100) / 100;
}

/**
 * Compute total fatigue units for an exercise across all its sets.
 */
export function computeExerciseFU(exercise: Exercise, sets: ExerciseSet[]): number {
  let total = 0;
  for (const set of sets) {
    total += computeSetFU(exercise, set);
  }
  return Math.round(total * 100) / 100;
}

/**
 * Compute per-muscle fatigue units using the exercise's fractional coefficients.
 *
 * For each muscle in exercise.fractionalCoeff:
 *   muscleFU[muscle] = totalExerciseFU × coefficient
 *
 * This distributes the fatigue across all targeted muscles proportionally,
 * matching how fractional volume accounting works.
 */
export function computeMuscleFU(
  exercise: Exercise,
  sets: ExerciseSet[],
): Record<string, number> {
  const totalFU = computeExerciseFU(exercise, sets);
  const result: Record<string, number> = {};

  for (const [muscle, coeff] of Object.entries(exercise.fractionalCoeff)) {
    if (coeff != null && coeff > 0) {
      result[muscle] = Math.round(totalFU * coeff * 100) / 100;
    }
  }

  return result;
}

/**
 * Compute session-level fatigue totals.
 *
 * Returns:
 *   - totalFU: sum of all exercise FU in the session
 *   - byMuscle: per-muscle FU aggregated across all exercises
 */
export function computeSessionFU(
  exercises: Array<{ exercise: Exercise; sets: ExerciseSet[] }>,
): {
  totalFU: number;
  byMuscle: Record<string, number>;
} {
  let totalFU = 0;
  const byMuscle: Record<string, number> = {};

  for (const { exercise, sets } of exercises) {
    const exerciseFU = computeExerciseFU(exercise, sets);
    totalFU += exerciseFU;

    const muscleFU = computeMuscleFU(exercise, sets);
    for (const [muscle, fu] of Object.entries(muscleFU)) {
      byMuscle[muscle] = (byMuscle[muscle] ?? 0) + fu;
    }
  }

  // Round aggregated values
  totalFU = Math.round(totalFU * 100) / 100;
  for (const muscle of Object.keys(byMuscle)) {
    byMuscle[muscle] = Math.round(byMuscle[muscle] * 100) / 100;
  }

  return { totalFU, byMuscle };
}
