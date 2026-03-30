// =============================================================================
// Op Strength — Core Type Definitions
// Source of truth: consolidated_spec_v3-1.md, Sections 2-6
// =============================================================================

export type MuscleGroup =
  | 'quads' | 'hamstrings' | 'glutes' | 'chest' | 'back'
  | 'shoulders' | 'side_delts' | 'rear_delts' | 'front_delts'
  | 'biceps' | 'triceps' | 'calves' | 'abs';

export type ExerciseCategory = 'compound' | 'isolation';
export type RecoveryCategory = 'stretcher' | 'activator' | 'pumper';
export type ProgressionType = 'percentage' | 'double_progression';
export type ReadinessStatus = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type MesocyclePhase = 'accumulation' | 'intensification' | 'deload';

export type MovementPattern =
  | 'squat' | 'hip_hinge' | 'knee_flexion' | 'knee_extension'
  | 'horizontal_press' | 'incline_press' | 'vertical_press' | 'chest_isolation'
  | 'vertical_pull' | 'horizontal_pull' | 'horizontal_pull_isolation'
  | 'shoulder_abduction' | 'external_rotation_pull'
  | 'elbow_flexion' | 'elbow_extension'
  | 'ankle_plantarflexion' | 'spinal_flexion' | 'hip_flexion';

// --- SFR Model (Section 2) ---

export interface StimulusComponents {
  muscleTension: number;
  stretchPosition: number;
  isolationPurity: number;
  proximityDefault: number;
}

export interface FatigueComponents {
  systemicLoad: number;
  jointStress: number;
  recoveryDemand: number;
  eccentricDamage: number;
}

export interface SFRScore {
  stimulusComponents: StimulusComponents;
  fatigueComponents: FatigueComponents;
  stimulusScore: number;
  fatigueCost: number;
  ratio: number;
  tier: 1 | 2 | 3 | 4;
  personalAdjustments: {
    jointStressOverride: number | null;
    notes: string | null;
  };
}

// --- Exercise Library (Section 3) ---

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  movementPattern: MovementPattern;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  fractionalCoeff: Partial<Record<MuscleGroup, number>>;
  progressionType: ProgressionType;
  repRanges: {
    strength?: [number, number];
    hypertrophy: [number, number];
  };
  fatigueRating: 'low' | 'moderate' | 'high' | 'very_high';
  stretchPosition: 'low' | 'moderate' | 'high';
  recoveryCategory: RecoveryCategory;
  recoveryHours: number;
  safeToFailure: boolean;
  supportsLSTF: boolean;
  supportsLengthenedPartials: boolean;
  substitutes: string[];
  sfr: SFRScore;
  personalNotes: string;
}

// --- Volume Landmarks (Section 4) ---

export interface MuscleLandmarks {
  MV: number;
  MEV: number;
  MAV_low: number;
  MAV_high: number;
  MRV: number;
  startingTarget: number;
  weeklyFrequency: number;
  setsPerSession: string;
  fatigueBudget: number;
  notes: string;
}

// --- Session Types (Section 6) ---

export interface SessionPre {
  bodyweight: number | null;
  sleepHours: number;
  sleepQuality: number;       // 1-5
  fatigue: number;            // 1-5 (5 = very fatigued)
  stress: number;             // 1-5 (5 = very stressed)
  motivation: number;         // 1-5
  nutritionCompliance: number; // 1-5
  lastMealHoursAgo: number | null;
  notes: string;
}

export interface ReadinessResult {
  score: number;              // 0-10
  status: ReadinessStatus;
  loadModifier: number;       // 0-1
  volumeModifier: number;     // 0-1
  rpeCapOverride: number | null;
  exerciseSwaps: ExerciseSwap[];
  message: string | null;
}

export interface ExerciseSwap {
  from: string;  // exercise ID
  to: string;    // exercise ID
  reason: string;
}

export interface LiveAdaptation {
  trigger: string;
  recommendation: string;
  message: string;
  userAccepted: boolean;
}

export interface ExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe: number;
  rir: number;
  e1rm: number;
  tempo: string | null;
  isWarmup: boolean;
  isLSTF: boolean;
  isMyoRep: boolean;
  isDropSet: boolean;
  isLengthenedPartial: boolean;
  timestamp: string;
  restAfterSec: number | null;
  formNotes: string;
  liveAdaptation: LiveAdaptation | null;
}

export interface ExerciseFeedback {
  jointPain: number;   // 1-5
  pumpQuality: number; // 1-5
  formRating: number;  // 1-5
  notes: string;
}

export interface SessionExercise {
  exerciseId: string;
  order: number;
  supersetGroup: string | null;
  targetSets: number;
  targetReps: string;         // e.g., "4-6"
  targetRIR: number;
  targetRPE: number;
  prescribedWeight: number | null;
  prescribedWeightSource: string | null;
  tempo: string | null;
  restTargetSec: number;
  sets: ExerciseSet[];
  exerciseFeedback: ExerciseFeedback | null;
}

export interface MuscleFeedback {
  pump: number;        // 0-5 (0 = not trained)
  soreness: number;    // 0-5
  jointPain: number;   // 0-5
  performance: number; // 0-5
}

export interface SessionPost {
  muscleFeedback: Record<MuscleGroup, MuscleFeedback>;
  overallFatigue: number; // 1-5
  sessionRating: number;  // 1-5
  notes: string;
}

export interface VolumeByMuscle {
  direct: number;
  fractional: number;
  total: number;
}

export interface FatigueComputed {
  sessionFU: number;
  sessionBudget: number;
  utilization: number;
  byMuscle: Record<string, { fu: number; budget: number; utilization: number }>;
  weekRunningTotal: {
    totalFU: number;
    weeklyBudget: number;
    utilization: number;
    daysRemaining: number;
  };
}

export interface SessionComputed {
  durationMinutes: number;
  totalWorkingSets: number;
  totalVolLoad: number;
  volumeByMuscle: Partial<Record<MuscleGroup, VolumeByMuscle>>;
  fatigue: FatigueComputed;
  avgRPE: number;
  avgRestSec: number;
  exerciseCount: number;
  e1rmChanges: Record<string, { current: number; previous: number | null; delta: number | null }>;
}

export interface Session {
  id: string;
  programId: string;
  mesocycleId: string;
  week: number;
  dayId: string;
  dayLabel: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string | null;
  pre: SessionPre;
  readiness: ReadinessResult;
  exercises: SessionExercise[];
  post: SessionPost | null;
  computed: SessionComputed | null;
}

// --- Nutrition (Section 14) ---

export interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface NutritionActual {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface NutritionCompliance {
  calorieCompliance: number;
  proteinCompliance: number;
  overallScore: number;
  notes: string;
}

export interface DailyNutrition {
  date: string;
  isTrainingDay: boolean;
  dayType: string;
  targets: NutritionTargets;
  actual: NutritionActual;
  compliance: NutritionCompliance;
  bodyweight: { morning: number | null };
  hydration: { estimatedOz: number | null };
}

// --- Program / Mesocycle ---

export interface DayTemplate {
  dayId: string;
  dayNumber: number;
  label: string;
  exercises: DayExercisePrescription[];
}

export interface DayExercisePrescription {
  exerciseId: string;
  sets: number;
  repRange: string;        // e.g., "4-6"
  targetRPE: number;
  targetRIR: number;
  restSec: number;
  notes: string;
}

export interface WeekTemplate {
  days: DayTemplate[];
}

export interface Mesocycle {
  id: string;
  number: number;
  startDate: string;
  plannedWeeks: number;
  currentWeek: number;
  phase: MesocyclePhase;
  deloadWeek: number;
  rirRamp: (number | 'deload')[];
  volumeStrategy: string;
}

// --- Fatigue Budget (Section 5) ---

export interface FatigueBudget {
  weeklyBudget: number;
  perSessionTarget: {
    heavy: number;
    moderate: number;
    light: number;
  };
  deloadBudget: number;
  muscleBudgets: Partial<Record<MuscleGroup, number>>;
}

// --- Data Export ---

export interface DataExport {
  version: string;
  exportDate: string;
  sessions: Session[];
  nutrition: DailyNutrition[];
  metadata: {
    totalSessions: number;
    dateRange: { start: string; end: string } | null;
  };
}
