// =============================================================================
// Op Strength — Constants
// Source of truth: consolidated_spec_v3-1.md, Sections 2, 5, 9
// =============================================================================

// --- RIR Multipliers (Section 5.1) ---
// How proximity to failure amplifies fatigue cost per set

export const RIR_MULTIPLIERS: Record<number | string, number> = {
  4: 0.70,
  3: 0.85,
  2: 1.00,
  1: 1.15,
  0: 1.40,
  lstf: 1.60,
};

// --- Proximity Factor (Section 2.2) ---
// RIR → stimulus proximity factor (per-set modifier)

export const PROXIMITY_FACTOR: Record<number, number> = {
  0: 10,
  1: 9,
  2: 8,
  3: 7,
  4: 5,
};

// --- Stimulus Score Weights (Section 2.2) ---

export const STIMULUS_WEIGHTS = {
  muscleTension: 0.35,
  stretchPosition: 0.30,
  isolationPurity: 0.20,
  proximity: 0.15,
} as const;

// --- Fatigue Cost Weights (Section 2.3) ---

export const FATIGUE_WEIGHTS = {
  systemicLoad: 0.30,
  jointStress: 0.25,
  recoveryDemand: 0.25,
  eccentricDamage: 0.20,
} as const;

// --- Readiness Formula Weights (Section 9.2) ---

export const READINESS_WEIGHTS = {
  sleepHours: 0.30,
  sleepQuality: 0.15,
  fatigue: 0.20,
  stress: 0.15,
  motivation: 0.10,
  nutritionCompliance: 0.10,
} as const;

// --- Readiness Thresholds (Section 9.2) ---

export const READINESS_THRESHOLDS = {
  GREEN: 7.0,
  YELLOW: 5.0,
  ORANGE: 3.5,
} as const;

// --- Session Modification by Readiness (Section 9.2) ---

export const READINESS_MODIFIERS = {
  GREEN:  { load: 1.00, volume: 1.00, rpeCap: null,  swapTier4: false },
  YELLOW: { load: 0.90, volume: 1.00, rpeCap: 8,     swapTier4: false },
  ORANGE: { load: 0.85, volume: 0.75, rpeCap: 7,     swapTier4: true  },
  RED:    { load: 0.00, volume: 0.00, rpeCap: 5,     swapTier4: true  },
} as const;

// --- Fatigue Budget (Section 5.2) ---

export const FATIGUE_BUDGET = {
  weeklyBudget: 400,
  systemic: 160,
  local: 240,
  perSessionTarget: {
    heavy: 100,
    moderate: 80,
    light: 55,
  },
  deloadBudget: 150,
} as const;

// --- Per-Muscle Fatigue Budgets (Section 4.2) ---

export const MUSCLE_FATIGUE_BUDGETS: Record<string, number> = {
  chest: 45,
  back: 50,
  quads: 50,
  hamstrings: 40,
  glutes: 0,
  shoulders: 25,
  side_delts: 20,
  rear_delts: 15,
  triceps: 20,
  biceps: 25,
  calves: 30,
  abs: 15,
};

// --- Rest Period Defaults (Section 9.3) ---

export const REST_PERIODS = {
  compound_strength: 180,
  compound_hypertrophy: 120,
  isolation_hypertrophy: 90,
  isolation_light: 75,
} as const;

// --- RPE Calibration (Section 9.3) ---
// ~2.5% weight adjustment per RPE point (Zourdos scale)

export const RPE_ADJUSTMENT_PCT = 0.025;

// --- Rep Decay Defaults (Section 9.3) ---

export const REP_DECAY = {
  compound: 0.07,
  isolation: 0.04,
} as const;

// --- Mesocycle Defaults ---

export const MESOCYCLE_DEFAULTS = {
  rirRamp: [3, 2, 1, 0, 'deload'] as (number | 'deload')[],
  rpeRamp: [7, 8, 9, 10, 5],
  trainingWeeks: 4,
  deloadWeek: 5,
  totalWeeks: 5,
} as const;

// --- Nutrition Targets (Section 14.3) ---

export const NUTRITION_TARGETS = {
  trainingDay: { calories: 2800, protein: 165, fat: 70, carbs: 378 },
  restDay:     { calories: 2500, protein: 165, fat: 70, carbs: 303 },
} as const;

// --- Tym's Current e1RM Estimates (Section 13.5) ---

export const CURRENT_E1RM: Record<string, number> = {
  heel_elevated_squat: 216,
  barbell_bench_press: 177,
  conventional_deadlift: 247,
  romanian_deadlift: 230,   // estimated from session data
  machine_shoulder_press: 76,
};

// --- Day of Week → Template Day Mapping ---

export const DAY_MAP: Record<number, string> = {
  1: 'A', // Monday → Squat Focus
  2: 'B', // Tuesday → Bench Focus
  3: 'C', // Wednesday → Hypertrophy
  4: 'D', // Thursday → Upper Focus
  5: 'E', // Friday → Full Body Moderate
};

export const DAY_LABELS: Record<string, string> = {
  A: 'Squat Focus',
  B: 'Bench Focus',
  C: 'Hypertrophy',
  D: 'Upper Focus',
  E: 'Full Body Moderate',
};
