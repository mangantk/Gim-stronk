// =============================================================================
// Op Strength — Readiness Engine
// Source of truth: consolidated_spec_v3-1.md, Section 9.2
// =============================================================================

import { SessionPre, ReadinessResult, ExerciseSwap } from '../types';
import {
  READINESS_WEIGHTS,
  READINESS_THRESHOLDS,
  READINESS_MODIFIERS,
} from '../data/constants';
import type { ReadinessStatus } from '../types';

// ---------------------------------------------------------------------------
// Hard-coded exercise swaps for ORANGE readiness (Tier 4 → highest-SFR sub)
// ---------------------------------------------------------------------------

const ORANGE_SWAPS: Array<{ from: string; to: string; reason: string }> = [
  {
    from: 'heel_elevated_squat',
    to: 'leg_press',
    reason: 'Reduced systemic fatigue: swapping Tier 4 stretcher to higher-SFR substitute',
  },
  {
    from: 'barbell_bench_press',
    to: 'machine_chest_press',
    reason: 'Reduced joint stress: swapping Tier 4 compound to machine alternative',
  },
  {
    from: 'romanian_deadlift',
    to: 'seated_leg_curl',
    reason: 'Reduced systemic fatigue: swapping Tier 4 hip hinge to isolation alternative',
  },
];

// ---------------------------------------------------------------------------
// Normalize helper
// ---------------------------------------------------------------------------

/**
 * Normalize a value into the range [0, 1].
 *
 *   normalize(value, worst, best) = clamp((value - worst) / (best - worst), 0, 1)
 *
 * For inverted scales (fatigue, stress) the caller passes worst > best,
 * which naturally produces the inversion since (best - worst) is negative.
 */
function normalize(value: number, worst: number, best: number): number {
  if (best === worst) return 0;
  const raw = (value - worst) / (best - worst);
  return Math.max(0, Math.min(1, raw));
}

// ---------------------------------------------------------------------------
// Status resolver
// ---------------------------------------------------------------------------

function resolveStatus(score: number): ReadinessStatus {
  if (score >= READINESS_THRESHOLDS.GREEN) return 'GREEN';
  if (score >= READINESS_THRESHOLDS.YELLOW) return 'YELLOW';
  if (score >= READINESS_THRESHOLDS.ORANGE) return 'ORANGE';
  return 'RED';
}

// ---------------------------------------------------------------------------
// Status message
// ---------------------------------------------------------------------------

function statusMessage(status: ReadinessStatus): string | null {
  switch (status) {
    case 'GREEN':
      return null;
    case 'YELLOW':
      return 'Slightly reduced readiness — loads capped at 90%, RPE capped at 8.';
    case 'ORANGE':
      return 'Low readiness — loads at 85%, volume at 75%, RPE capped at 7. Tier 4 exercises swapped.';
    case 'RED':
      return 'Very low readiness — pumpers-only session recommended.';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute a readiness score (0-10) and derive session modifications
 * from the pre-session questionnaire.
 *
 * Formula (Section 9.2):
 *   readiness = (
 *     0.30 * normalize(sleepHours,          worst=4,   best=8.5) +
 *     0.15 * normalize(sleepQuality,        worst=1,   best=5)   +
 *     0.20 * normalize(fatigue,             worst=5,   best=1)   +   // INVERTED
 *     0.15 * normalize(stress,              worst=5,   best=1)   +   // INVERTED
 *     0.10 * normalize(motivation,          worst=1,   best=5)   +
 *     0.10 * normalize(nutritionCompliance, worst=1,   best=5)
 *   ) * 10
 */
export function computeReadiness(pre: SessionPre): ReadinessResult {
  const weighted =
    READINESS_WEIGHTS.sleepHours          * normalize(pre.sleepHours, 4, 8.5) +
    READINESS_WEIGHTS.sleepQuality        * normalize(pre.sleepQuality, 1, 5) +
    READINESS_WEIGHTS.fatigue             * normalize(pre.fatigue, 5, 1) +
    READINESS_WEIGHTS.stress              * normalize(pre.stress, 5, 1) +
    READINESS_WEIGHTS.motivation          * normalize(pre.motivation, 1, 5) +
    READINESS_WEIGHTS.nutritionCompliance * normalize(pre.nutritionCompliance, 1, 5);

  // Scale to 0-10 and round to one decimal place for readability
  const score = Math.round(weighted * 10 * 10) / 10;

  const status = resolveStatus(score);
  const modifiers = READINESS_MODIFIERS[status];

  const exerciseSwaps: ExerciseSwap[] =
    modifiers.swapTier4 ? ORANGE_SWAPS.map((s) => ({ ...s })) : [];

  return {
    score,
    status,
    loadModifier: modifiers.load,
    volumeModifier: modifiers.volume,
    rpeCapOverride: modifiers.rpeCap,
    exerciseSwaps,
    message: statusMessage(status),
  };
}
