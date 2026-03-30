# =============================================================================
# Op Strength — Python Type Definitions
# Mirrors TypeScript types from app/src/types.ts
# =============================================================================

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class MuscleGroup(str, Enum):
    QUADS = 'quads'
    HAMSTRINGS = 'hamstrings'
    GLUTES = 'glutes'
    CHEST = 'chest'
    BACK = 'back'
    SHOULDERS = 'shoulders'
    SIDE_DELTS = 'side_delts'
    REAR_DELTS = 'rear_delts'
    FRONT_DELTS = 'front_delts'
    BICEPS = 'biceps'
    TRICEPS = 'triceps'
    CALVES = 'calves'
    ABS = 'abs'


class ExerciseCategory(str, Enum):
    COMPOUND = 'compound'
    ISOLATION = 'isolation'


class RecoveryCategory(str, Enum):
    STRETCHER = 'stretcher'
    ACTIVATOR = 'activator'
    PUMPER = 'pumper'


class ProgressionType(str, Enum):
    PERCENTAGE = 'percentage'
    DOUBLE_PROGRESSION = 'double_progression'


class ReadinessStatus(str, Enum):
    GREEN = 'GREEN'
    YELLOW = 'YELLOW'
    ORANGE = 'ORANGE'
    RED = 'RED'


class MesocyclePhase(str, Enum):
    ACCUMULATION = 'accumulation'
    INTENSIFICATION = 'intensification'
    DELOAD = 'deload'


class MovementPattern(str, Enum):
    SQUAT = 'squat'
    HIP_HINGE = 'hip_hinge'
    KNEE_FLEXION = 'knee_flexion'
    KNEE_EXTENSION = 'knee_extension'
    HORIZONTAL_PRESS = 'horizontal_press'
    INCLINE_PRESS = 'incline_press'
    VERTICAL_PRESS = 'vertical_press'
    CHEST_ISOLATION = 'chest_isolation'
    VERTICAL_PULL = 'vertical_pull'
    HORIZONTAL_PULL = 'horizontal_pull'
    HORIZONTAL_PULL_ISOLATION = 'horizontal_pull_isolation'
    SHOULDER_ABDUCTION = 'shoulder_abduction'
    EXTERNAL_ROTATION_PULL = 'external_rotation_pull'
    ELBOW_FLEXION = 'elbow_flexion'
    ELBOW_EXTENSION = 'elbow_extension'
    ANKLE_PLANTARFLEXION = 'ankle_plantarflexion'
    SPINAL_FLEXION = 'spinal_flexion'
    HIP_FLEXION = 'hip_flexion'


# ---------------------------------------------------------------------------
# SFR Model (Section 2)
# ---------------------------------------------------------------------------

@dataclass
class StimulusComponents:
    muscleTension: int
    stretchPosition: int
    isolationPurity: int
    proximityDefault: int

    @classmethod
    def from_dict(cls, d: dict) -> StimulusComponents:
        return cls(
            muscleTension=d['muscleTension'],
            stretchPosition=d['stretchPosition'],
            isolationPurity=d['isolationPurity'],
            proximityDefault=d['proximityDefault'],
        )


@dataclass
class FatigueComponents:
    systemicLoad: int
    jointStress: int
    recoveryDemand: int
    eccentricDamage: int

    @classmethod
    def from_dict(cls, d: dict) -> FatigueComponents:
        return cls(
            systemicLoad=d['systemicLoad'],
            jointStress=d['jointStress'],
            recoveryDemand=d['recoveryDemand'],
            eccentricDamage=d['eccentricDamage'],
        )


@dataclass
class PersonalAdjustments:
    jointStressOverride: Optional[int]
    notes: Optional[str]

    @classmethod
    def from_dict(cls, d: dict) -> PersonalAdjustments:
        return cls(
            jointStressOverride=d.get('jointStressOverride'),
            notes=d.get('notes'),
        )


@dataclass
class SFRScore:
    stimulusComponents: StimulusComponents
    fatigueComponents: FatigueComponents
    stimulusScore: float
    fatigueCost: float
    ratio: float
    tier: int
    personalAdjustments: PersonalAdjustments = field(
        default_factory=lambda: PersonalAdjustments(None, None)
    )

    @classmethod
    def from_dict(cls, d: dict) -> SFRScore:
        return cls(
            stimulusComponents=StimulusComponents.from_dict(d['stimulusComponents']),
            fatigueComponents=FatigueComponents.from_dict(d['fatigueComponents']),
            stimulusScore=d['stimulusScore'],
            fatigueCost=d['fatigueCost'],
            ratio=d['ratio'],
            tier=d['tier'],
            personalAdjustments=PersonalAdjustments.from_dict(d.get('personalAdjustments', {})),
        )


# ---------------------------------------------------------------------------
# Exercise Library (Section 3)
# ---------------------------------------------------------------------------

@dataclass
class Exercise:
    id: str
    name: str
    category: str
    movementPattern: str
    primaryMuscle: str
    secondaryMuscles: list[str]
    fractionalCoeff: dict[str, float]
    progressionType: str
    repRanges: dict[str, list[int]]
    fatigueRating: str
    stretchPosition: str
    recoveryCategory: str
    recoveryHours: int
    safeToFailure: bool
    supportsLSTF: bool
    supportsLengthenedPartials: bool
    substitutes: list[str]
    sfr: SFRScore
    personalNotes: str

    @classmethod
    def from_dict(cls, d: dict) -> Exercise:
        return cls(
            id=d['id'],
            name=d['name'],
            category=d['category'],
            movementPattern=d['movementPattern'],
            primaryMuscle=d['primaryMuscle'],
            secondaryMuscles=d.get('secondaryMuscles', []),
            fractionalCoeff=d.get('fractionalCoeff', {}),
            progressionType=d['progressionType'],
            repRanges=d.get('repRanges', {}),
            fatigueRating=d.get('fatigueRating', 'moderate'),
            stretchPosition=d.get('stretchPosition', 'moderate'),
            recoveryCategory=d['recoveryCategory'],
            recoveryHours=d['recoveryHours'],
            safeToFailure=d.get('safeToFailure', False),
            supportsLSTF=d.get('supportsLSTF', False),
            supportsLengthenedPartials=d.get('supportsLengthenedPartials', False),
            substitutes=d.get('substitutes', []),
            sfr=SFRScore.from_dict(d['sfr']),
            personalNotes=d.get('personalNotes', ''),
        )


# ---------------------------------------------------------------------------
# Volume Landmarks (Section 4)
# ---------------------------------------------------------------------------

@dataclass
class MuscleLandmarks:
    MV: int
    MEV: int
    MAV_low: int
    MAV_high: int
    MRV: int
    startingTarget: int
    weeklyFrequency: int
    setsPerSession: str
    fatigueBudget: int
    notes: str

    @classmethod
    def from_dict(cls, d: dict) -> MuscleLandmarks:
        return cls(
            MV=d['MV'],
            MEV=d['MEV'],
            MAV_low=d['MAV_low'],
            MAV_high=d['MAV_high'],
            MRV=d['MRV'],
            startingTarget=d['startingTarget'],
            weeklyFrequency=d['weeklyFrequency'],
            setsPerSession=d['setsPerSession'],
            fatigueBudget=d['fatigueBudget'],
            notes=d.get('notes', ''),
        )


# ---------------------------------------------------------------------------
# Session Types (Section 6)
# ---------------------------------------------------------------------------

@dataclass
class SessionPre:
    sleepHours: float
    sleepQuality: int
    fatigue: int
    stress: int
    motivation: int
    nutritionCompliance: int
    bodyweight: Optional[float] = None
    lastMealHoursAgo: Optional[float] = None
    notes: str = ''

    @classmethod
    def from_dict(cls, d: dict) -> SessionPre:
        return cls(
            sleepHours=d['sleepHours'],
            sleepQuality=d['sleepQuality'],
            fatigue=d['fatigue'],
            stress=d['stress'],
            motivation=d['motivation'],
            nutritionCompliance=d['nutritionCompliance'],
            bodyweight=d.get('bodyweight'),
            lastMealHoursAgo=d.get('lastMealHoursAgo'),
            notes=d.get('notes', ''),
        )


@dataclass
class ExerciseSwap:
    fromId: str
    toId: str
    reason: str

    @classmethod
    def from_dict(cls, d: dict) -> ExerciseSwap:
        return cls(
            fromId=d['from'],
            toId=d['to'],
            reason=d.get('reason', ''),
        )


@dataclass
class ReadinessResult:
    score: float
    status: str
    loadModifier: float
    volumeModifier: float
    rpeCapOverride: Optional[float]
    exerciseSwaps: list[ExerciseSwap]
    message: Optional[str]

    @classmethod
    def from_dict(cls, d: dict) -> ReadinessResult:
        return cls(
            score=d['score'],
            status=d['status'],
            loadModifier=d['loadModifier'],
            volumeModifier=d['volumeModifier'],
            rpeCapOverride=d.get('rpeCapOverride'),
            exerciseSwaps=[ExerciseSwap.from_dict(s) for s in d.get('exerciseSwaps', [])],
            message=d.get('message'),
        )


@dataclass
class LiveAdaptation:
    trigger: str
    recommendation: str
    message: str
    userAccepted: bool

    @classmethod
    def from_dict(cls, d: dict) -> LiveAdaptation:
        return cls(
            trigger=d['trigger'],
            recommendation=d['recommendation'],
            message=d['message'],
            userAccepted=d.get('userAccepted', False),
        )


@dataclass
class ExerciseSet:
    setNumber: int
    weight: float
    reps: int
    rpe: float
    rir: int
    e1rm: float
    timestamp: str
    tempo: Optional[str] = None
    restAfterSec: Optional[int] = None
    isWarmup: bool = False
    isLSTF: bool = False
    isMyoRep: bool = False
    isDropSet: bool = False
    isLengthenedPartial: bool = False
    formNotes: str = ''
    liveAdaptation: Optional[LiveAdaptation] = None

    @classmethod
    def from_dict(cls, d: dict) -> ExerciseSet:
        live = d.get('liveAdaptation')
        return cls(
            setNumber=d['setNumber'],
            weight=d['weight'],
            reps=d['reps'],
            rpe=d['rpe'],
            rir=d['rir'],
            e1rm=d['e1rm'],
            timestamp=d.get('timestamp', ''),
            tempo=d.get('tempo'),
            restAfterSec=d.get('restAfterSec'),
            isWarmup=d.get('isWarmup', False),
            isLSTF=d.get('isLSTF', False),
            isMyoRep=d.get('isMyoRep', False),
            isDropSet=d.get('isDropSet', False),
            isLengthenedPartial=d.get('isLengthenedPartial', False),
            formNotes=d.get('formNotes', ''),
            liveAdaptation=LiveAdaptation.from_dict(live) if live else None,
        )


@dataclass
class ExerciseFeedback:
    jointPain: int
    pumpQuality: int
    formRating: int
    notes: str = ''

    @classmethod
    def from_dict(cls, d: dict) -> ExerciseFeedback:
        return cls(
            jointPain=d['jointPain'],
            pumpQuality=d['pumpQuality'],
            formRating=d['formRating'],
            notes=d.get('notes', ''),
        )


@dataclass
class SessionExercise:
    exerciseId: str
    order: int
    targetSets: int
    targetReps: str
    targetRIR: int
    targetRPE: float
    sets: list[ExerciseSet] = field(default_factory=list)
    supersetGroup: Optional[str] = None
    prescribedWeight: Optional[float] = None
    prescribedWeightSource: Optional[str] = None
    tempo: Optional[str] = None
    restTargetSec: int = 120
    exerciseFeedback: Optional[ExerciseFeedback] = None

    @classmethod
    def from_dict(cls, d: dict) -> SessionExercise:
        fb = d.get('exerciseFeedback')
        return cls(
            exerciseId=d['exerciseId'],
            order=d['order'],
            targetSets=d['targetSets'],
            targetReps=d['targetReps'],
            targetRIR=d['targetRIR'],
            targetRPE=d['targetRPE'],
            sets=[ExerciseSet.from_dict(s) for s in d.get('sets', [])],
            supersetGroup=d.get('supersetGroup'),
            prescribedWeight=d.get('prescribedWeight'),
            prescribedWeightSource=d.get('prescribedWeightSource'),
            tempo=d.get('tempo'),
            restTargetSec=d.get('restTargetSec', 120),
            exerciseFeedback=ExerciseFeedback.from_dict(fb) if fb else None,
        )


@dataclass
class MuscleFeedback:
    pump: int
    soreness: int
    jointPain: int
    performance: int

    @classmethod
    def from_dict(cls, d: dict) -> MuscleFeedback:
        return cls(
            pump=d['pump'],
            soreness=d['soreness'],
            jointPain=d['jointPain'],
            performance=d['performance'],
        )


@dataclass
class SessionPost:
    muscleFeedback: dict[str, MuscleFeedback]
    overallFatigue: int
    sessionRating: int
    notes: str = ''

    @classmethod
    def from_dict(cls, d: dict) -> SessionPost:
        mf = {k: MuscleFeedback.from_dict(v) for k, v in d.get('muscleFeedback', {}).items()}
        return cls(
            muscleFeedback=mf,
            overallFatigue=d['overallFatigue'],
            sessionRating=d['sessionRating'],
            notes=d.get('notes', ''),
        )


@dataclass
class VolumeByMuscle:
    direct: float
    fractional: float
    total: float

    @classmethod
    def from_dict(cls, d: dict) -> VolumeByMuscle:
        return cls(
            direct=d['direct'],
            fractional=d['fractional'],
            total=d['total'],
        )


@dataclass
class SessionComputed:
    durationMinutes: float
    totalWorkingSets: int
    totalVolLoad: float
    volumeByMuscle: dict[str, VolumeByMuscle]
    avgRPE: float
    avgRestSec: float
    exerciseCount: int

    @classmethod
    def from_dict(cls, d: dict) -> SessionComputed:
        vbm = {k: VolumeByMuscle.from_dict(v) for k, v in d.get('volumeByMuscle', {}).items()}
        return cls(
            durationMinutes=d.get('durationMinutes', 0),
            totalWorkingSets=d.get('totalWorkingSets', 0),
            totalVolLoad=d.get('totalVolLoad', 0),
            volumeByMuscle=vbm,
            avgRPE=d.get('avgRPE', 0),
            avgRestSec=d.get('avgRestSec', 0),
            exerciseCount=d.get('exerciseCount', 0),
        )


@dataclass
class Session:
    id: str
    mesocycleId: str
    week: int
    dayId: str
    date: str
    pre: SessionPre
    exercises: list[SessionExercise]
    programId: str = ''
    dayLabel: str = ''
    dayOfWeek: str = ''
    startTime: str = ''
    endTime: Optional[str] = None
    readiness: Optional[ReadinessResult] = None
    post: Optional[SessionPost] = None
    computed: Optional[SessionComputed] = None

    @classmethod
    def from_dict(cls, d: dict) -> Session:
        readiness = d.get('readiness')
        post = d.get('post')
        computed = d.get('computed')
        return cls(
            id=d['id'],
            mesocycleId=d.get('mesocycleId', ''),
            week=d['week'],
            dayId=d['dayId'],
            date=d['date'],
            pre=SessionPre.from_dict(d['pre']),
            exercises=[SessionExercise.from_dict(e) for e in d.get('exercises', [])],
            programId=d.get('programId', ''),
            dayLabel=d.get('dayLabel', ''),
            dayOfWeek=d.get('dayOfWeek', ''),
            startTime=d.get('startTime', ''),
            endTime=d.get('endTime'),
            readiness=ReadinessResult.from_dict(readiness) if readiness else None,
            post=SessionPost.from_dict(post) if post else None,
            computed=SessionComputed.from_dict(computed) if computed else None,
        )


# ---------------------------------------------------------------------------
# Nutrition (Section 14)
# ---------------------------------------------------------------------------

@dataclass
class NutritionTargets:
    calories: float
    protein: float
    fat: float
    carbs: float

    @classmethod
    def from_dict(cls, d: dict) -> NutritionTargets:
        return cls(
            calories=d['calories'],
            protein=d['protein'],
            fat=d['fat'],
            carbs=d['carbs'],
        )


@dataclass
class NutritionActual:
    calories: float
    protein: float
    fat: float
    carbs: float

    @classmethod
    def from_dict(cls, d: dict) -> NutritionActual:
        return cls(
            calories=d['calories'],
            protein=d['protein'],
            fat=d['fat'],
            carbs=d['carbs'],
        )


@dataclass
class NutritionCompliance:
    calorieCompliance: float
    proteinCompliance: float
    overallScore: float
    notes: str = ''

    @classmethod
    def from_dict(cls, d: dict) -> NutritionCompliance:
        return cls(
            calorieCompliance=d.get('calorieCompliance', 0),
            proteinCompliance=d.get('proteinCompliance', 0),
            overallScore=d.get('overallScore', 0),
            notes=d.get('notes', ''),
        )


@dataclass
class DailyNutrition:
    date: str
    isTrainingDay: bool
    targets: NutritionTargets
    actual: NutritionActual
    dayType: str = ''
    compliance: Optional[NutritionCompliance] = None
    bodyweight: Optional[float] = None
    hydrationOz: Optional[float] = None

    @classmethod
    def from_dict(cls, d: dict) -> DailyNutrition:
        comp = d.get('compliance')
        bw = d.get('bodyweight')
        bodyweight = None
        if isinstance(bw, dict):
            bodyweight = bw.get('morning')
        elif isinstance(bw, (int, float)):
            bodyweight = bw

        hydration = d.get('hydration')
        hydrationOz = None
        if isinstance(hydration, dict):
            hydrationOz = hydration.get('estimatedOz')

        return cls(
            date=d['date'],
            isTrainingDay=d['isTrainingDay'],
            targets=NutritionTargets.from_dict(d['targets']),
            actual=NutritionActual.from_dict(d['actual']),
            dayType=d.get('dayType', ''),
            compliance=NutritionCompliance.from_dict(comp) if comp else None,
            bodyweight=bodyweight,
            hydrationOz=hydrationOz,
        )


# ---------------------------------------------------------------------------
# Program / Mesocycle / Template
# ---------------------------------------------------------------------------

@dataclass
class DayExercisePrescription:
    exerciseId: str
    sets: int
    repRange: str
    targetRPE: float
    targetRIR: int
    restSec: int
    notes: str = ''

    @classmethod
    def from_dict(cls, d: dict) -> DayExercisePrescription:
        return cls(
            exerciseId=d['exerciseId'],
            sets=d['sets'],
            repRange=d['repRange'],
            targetRPE=d['targetRPE'],
            targetRIR=d['targetRIR'],
            restSec=d['restSec'],
            notes=d.get('notes', ''),
        )


@dataclass
class DayTemplate:
    dayId: str
    dayNumber: int
    label: str
    exercises: list[DayExercisePrescription]
    sessionType: str = 'moderate'

    @classmethod
    def from_dict(cls, d: dict) -> DayTemplate:
        return cls(
            dayId=d['dayId'],
            dayNumber=d['dayNumber'],
            label=d['label'],
            exercises=[DayExercisePrescription.from_dict(e) for e in d.get('exercises', [])],
            sessionType=d.get('sessionType', 'moderate'),
        )


@dataclass
class WeekTemplate:
    days: list[DayTemplate]

    @classmethod
    def from_dict(cls, d: dict) -> WeekTemplate:
        return cls(days=[DayTemplate.from_dict(day) for day in d.get('days', [])])


@dataclass
class Mesocycle:
    id: str
    number: int
    startDate: str
    plannedWeeks: int
    currentWeek: int
    phase: str
    deloadWeek: int
    rirRamp: list
    volumeStrategy: str = ''

    @classmethod
    def from_dict(cls, d: dict) -> Mesocycle:
        return cls(
            id=d['id'],
            number=d['number'],
            startDate=d['startDate'],
            plannedWeeks=d['plannedWeeks'],
            currentWeek=d['currentWeek'],
            phase=d['phase'],
            deloadWeek=d['deloadWeek'],
            rirRamp=d.get('rirRamp', [3, 2, 1, 0, 'deload']),
            volumeStrategy=d.get('volumeStrategy', ''),
        )


# ---------------------------------------------------------------------------
# Fatigue Budget (Section 5)
# ---------------------------------------------------------------------------

@dataclass
class FatigueBudget:
    weeklyBudget: float
    perSessionTarget: dict[str, float]
    deloadBudget: float
    muscleBudgets: dict[str, float]

    @classmethod
    def from_dict(cls, d: dict) -> FatigueBudget:
        return cls(
            weeklyBudget=d['weeklyBudget'],
            perSessionTarget=d['perSessionTarget'],
            deloadBudget=d['deloadBudget'],
            muscleBudgets=d.get('muscleBudgets', {}),
        )


# ---------------------------------------------------------------------------
# Data Export
# ---------------------------------------------------------------------------

@dataclass
class DataExport:
    version: str
    exportDate: str
    sessions: list[Session]
    nutrition: list[DailyNutrition]

    @classmethod
    def from_dict(cls, d: dict) -> DataExport:
        return cls(
            version=d.get('version', ''),
            exportDate=d.get('exportDate', ''),
            sessions=[Session.from_dict(s) for s in d.get('sessions', [])],
            nutrition=[DailyNutrition.from_dict(n) for n in d.get('nutrition', [])],
        )
