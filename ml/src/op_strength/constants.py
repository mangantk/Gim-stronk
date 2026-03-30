# =============================================================================
# Op Strength — Constants
# Mirrors TypeScript constants from app/src/data/constants.ts
# Source of truth: consolidated_spec_v3-1.md, Sections 2, 5, 9
# =============================================================================

# --- RIR Multipliers (Section 5.1) ---
# How proximity to failure amplifies fatigue cost per set

RIR_MULTIPLIERS: dict[int | str, float] = {
    4: 0.70,
    3: 0.85,
    2: 1.00,
    1: 1.15,
    0: 1.40,
    'lstf': 1.60,
}

# --- Proximity Factor (Section 2.2) ---
# RIR -> stimulus proximity factor (per-set modifier)

PROXIMITY_FACTOR: dict[int, int] = {
    0: 10,
    1: 9,
    2: 8,
    3: 7,
    4: 5,
}

# --- Stimulus Score Weights (Section 2.2) ---

STIMULUS_WEIGHTS: dict[str, float] = {
    'muscleTension': 0.35,
    'stretchPosition': 0.30,
    'isolationPurity': 0.20,
    'proximity': 0.15,
}

# --- Fatigue Cost Weights (Section 2.3) ---

FATIGUE_WEIGHTS: dict[str, float] = {
    'systemicLoad': 0.30,
    'jointStress': 0.25,
    'recoveryDemand': 0.25,
    'eccentricDamage': 0.20,
}

# --- Readiness Formula Weights (Section 9.2) ---

READINESS_WEIGHTS: dict[str, float] = {
    'sleepHours': 0.30,
    'sleepQuality': 0.15,
    'fatigue': 0.20,
    'stress': 0.15,
    'motivation': 0.10,
    'nutritionCompliance': 0.10,
}

# --- Readiness Thresholds (Section 9.2) ---

READINESS_THRESHOLDS: dict[str, float] = {
    'GREEN': 7.0,
    'YELLOW': 5.0,
    'ORANGE': 3.5,
}

# --- Session Modification by Readiness (Section 9.2) ---

READINESS_MODIFIERS: dict[str, dict] = {
    'GREEN':  {'load': 1.00, 'volume': 1.00, 'rpeCap': None,  'swapTier4': False},
    'YELLOW': {'load': 0.90, 'volume': 1.00, 'rpeCap': 8,     'swapTier4': False},
    'ORANGE': {'load': 0.85, 'volume': 0.75, 'rpeCap': 7,     'swapTier4': True},
    'RED':    {'load': 0.00, 'volume': 0.00, 'rpeCap': 5,     'swapTier4': True},
}

# --- Fatigue Budget (Section 5.2) ---

FATIGUE_BUDGET: dict[str, object] = {
    'weeklyBudget': 400,
    'systemic': 160,
    'local': 240,
    'perSessionTarget': {
        'heavy': 100,
        'moderate': 80,
        'light': 55,
    },
    'deloadBudget': 150,
}

# --- Per-Muscle Fatigue Budgets (Section 4.2) ---

MUSCLE_FATIGUE_BUDGETS: dict[str, int] = {
    'chest': 45,
    'back': 50,
    'quads': 50,
    'hamstrings': 40,
    'glutes': 0,
    'shoulders': 25,
    'side_delts': 20,
    'rear_delts': 15,
    'triceps': 20,
    'biceps': 25,
    'calves': 30,
    'abs': 15,
}

# --- Rest Period Defaults (Section 9.3) ---

REST_PERIODS: dict[str, int] = {
    'compound_strength': 180,
    'compound_hypertrophy': 120,
    'isolation_hypertrophy': 90,
    'isolation_light': 75,
}

# --- RPE Calibration (Section 9.3) ---
# ~2.5% weight adjustment per RPE point (Zourdos scale)

RPE_ADJUSTMENT_PCT: float = 0.025

# --- Rep Decay Defaults (Section 9.3) ---

REP_DECAY: dict[str, float] = {
    'compound': 0.07,
    'isolation': 0.04,
}

# --- Mesocycle Defaults ---

MESOCYCLE_DEFAULTS: dict[str, object] = {
    'rirRamp': [3, 2, 1, 0, 'deload'],
    'rpeRamp': [7, 8, 9, 10, 5],
    'trainingWeeks': 4,
    'deloadWeek': 5,
    'totalWeeks': 5,
}

# --- Nutrition Targets (Section 14.3) ---

NUTRITION_TARGETS: dict[str, dict[str, float]] = {
    'trainingDay': {'calories': 2800, 'protein': 165, 'fat': 70, 'carbs': 378},
    'restDay':     {'calories': 2500, 'protein': 165, 'fat': 70, 'carbs': 303},
}

# --- Tym's Current e1RM Estimates (Section 13.5) ---

CURRENT_E1RM: dict[str, float] = {
    'heel_elevated_squat': 216,
    'barbell_bench_press': 177,
    'conventional_deadlift': 247,
    'romanian_deadlift': 230,
    'machine_shoulder_press': 76,
}

# --- Day of Week -> Template Day Mapping ---

DAY_MAP: dict[int, str] = {
    1: 'A',  # Monday -> Squat Focus
    2: 'B',  # Tuesday -> Bench Focus
    3: 'C',  # Wednesday -> Hypertrophy
    4: 'D',  # Thursday -> Upper Focus
    5: 'E',  # Friday -> Full Body Moderate
}

DAY_LABELS: dict[str, str] = {
    'A': 'Squat Focus',
    'B': 'Bench Focus',
    'C': 'Hypertrophy',
    'D': 'Upper Focus',
    'E': 'Full Body Moderate',
}
