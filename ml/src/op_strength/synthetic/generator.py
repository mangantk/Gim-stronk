# =============================================================================
# Op Strength — Synthetic Training Data Generator
# Generates realistic multi-mesocycle training data for pipeline testing.
# =============================================================================

from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta
from typing import Optional

from ..types import (
    DailyNutrition,
    DayTemplate,
    Exercise,
    ExerciseSet,
    MuscleFeedback,
    NutritionActual,
    NutritionCompliance,
    NutritionTargets,
    Session,
    SessionExercise,
    SessionPost,
    SessionPre,
    WeekTemplate,
)
from ..constants import (
    CURRENT_E1RM,
    MESOCYCLE_DEFAULTS,
    NUTRITION_TARGETS,
    REP_DECAY,
    RIR_MULTIPLIERS,
)


class SyntheticDataGenerator:
    """Generate realistic synthetic training data for pipeline testing.

    Produces *num_mesocycles* x 5 weeks of sessions and daily nutrition,
    starting from Tym's current e1RM estimates and applying progressive
    overload across mesocycles.
    """

    def __init__(
        self,
        exercises: dict[str, Exercise],
        template: WeekTemplate,
        num_mesocycles: int = 4,
        seed: int | None = 42,
    ):
        self.exercises = exercises
        self.template = template
        self.num_mesocycles = num_mesocycles
        self.rng = random.Random(seed)

        # Mutable e1RM tracker — starts from current estimates, grows over mesos
        self.e1rm: dict[str, float] = dict(CURRENT_E1RM)

        # Bodyweight random walk (starts 185 lb)
        self.bodyweight: float = 185.0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(self) -> tuple[list[Session], list[DailyNutrition]]:
        """Generate *num_mesocycles* x 5 weeks of training data."""
        all_sessions: list[Session] = []
        all_nutrition: list[DailyNutrition] = []

        rir_ramp: list = MESOCYCLE_DEFAULTS['rirRamp']  # [3, 2, 1, 0, 'deload']
        start_date = datetime(2025, 1, 6)  # a Monday

        for meso_idx in range(self.num_mesocycles):
            meso_id = f'meso_{meso_idx + 1}'

            for week_idx in range(5):
                week_num = week_idx + 1
                rir_target = rir_ramp[week_idx]
                is_deload = rir_target == 'deload'

                # Monday of this week
                week_start = start_date + timedelta(weeks=meso_idx * 5 + week_idx)

                for day_template in self.template.days:
                    day_offset = day_template.dayNumber - 1  # 0-indexed from Monday
                    session_date = week_start + timedelta(days=day_offset)

                    session = self._generate_session(
                        meso_id=meso_id,
                        week=week_num,
                        day_template=day_template,
                        session_date=session_date,
                        rir_target=2 if is_deload else rir_target,
                        is_deload=is_deload,
                    )
                    all_sessions.append(session)

                    # Training-day nutrition
                    all_nutrition.append(
                        self._generate_nutrition(session_date.strftime('%Y-%m-%d'), is_training_day=True)
                    )

                # Rest days (Saturday + Sunday)
                for rest_offset in [5, 6]:
                    rest_date = week_start + timedelta(days=rest_offset)
                    all_nutrition.append(
                        self._generate_nutrition(rest_date.strftime('%Y-%m-%d'), is_training_day=False)
                    )

            # End of mesocycle: apply progressive overload for next meso
            self._apply_progressive_overload()

        return all_sessions, all_nutrition

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _generate_session(
        self,
        meso_id: str,
        week: int,
        day_template: DayTemplate,
        session_date: datetime,
        rir_target: int,
        is_deload: bool,
    ) -> Session:
        """Generate one realistic session from a day template."""
        is_bad_day = self.rng.random() < 0.10

        pre = self._generate_pre(is_bad_day)

        session_exercises: list[SessionExercise] = []
        for order, rx in enumerate(day_template.exercises, start=1):
            ex = self.exercises.get(rx.exerciseId)
            if ex is None:
                continue

            target_sets = rx.sets
            if is_deload:
                target_sets = max(1, target_sets - 1)

            target_rpe = rx.targetRPE
            if is_bad_day:
                target_rpe = min(10, target_rpe + 1.5)

            e1rm_est = self._get_e1rm_estimate(rx.exerciseId, ex)
            sets = self._generate_sets(
                exercise=ex,
                target_sets=target_sets,
                target_reps=rx.repRange,
                target_rpe=target_rpe,
                e1rm_estimate=e1rm_est,
                rir_target=rir_target,
                is_bad_day=is_bad_day,
            )

            session_exercises.append(SessionExercise(
                exerciseId=rx.exerciseId,
                order=order,
                targetSets=rx.sets,
                targetReps=rx.repRange,
                targetRIR=rx.targetRIR,
                targetRPE=rx.targetRPE,
                sets=sets,
                restTargetSec=rx.restSec,
            ))

        post = self._generate_post(session_exercises, is_bad_day)

        date_str = session_date.strftime('%Y-%m-%d')
        start_time = session_date.replace(
            hour=self.rng.choice([6, 7, 17, 18]),
            minute=self.rng.choice([0, 15, 30]),
        )
        duration = self.rng.randint(55, 80)

        return Session(
            id=str(uuid.uuid4()),
            mesocycleId=meso_id,
            week=week,
            dayId=day_template.dayId,
            date=date_str,
            pre=pre,
            exercises=session_exercises,
            dayLabel=day_template.label,
            dayOfWeek=session_date.strftime('%A'),
            startTime=start_time.isoformat(),
            endTime=(start_time + timedelta(minutes=duration)).isoformat(),
            post=post,
        )

    def _generate_pre(self, is_bad_day: bool) -> SessionPre:
        """Generate pre-session data.  Bad days get worse readiness."""
        if is_bad_day:
            sleep_hours = round(self.rng.uniform(4.5, 6.0), 1)
            sleep_quality = self.rng.randint(1, 2)
            fatigue = self.rng.randint(4, 5)
            stress = self.rng.randint(4, 5)
            motivation = self.rng.randint(1, 2)
            nutrition_compliance = self.rng.randint(1, 3)
        else:
            sleep_hours = round(self.rng.uniform(6.5, 9.0), 1)
            sleep_quality = self.rng.randint(3, 5)
            fatigue = self.rng.randint(1, 3)
            stress = self.rng.randint(1, 3)
            motivation = self.rng.randint(3, 5)
            nutrition_compliance = self.rng.randint(3, 5)

        # Bodyweight random walk
        self.bodyweight += self.rng.gauss(0, 0.3)
        self.bodyweight = round(max(175, min(195, self.bodyweight)), 1)

        return SessionPre(
            sleepHours=sleep_hours,
            sleepQuality=sleep_quality,
            fatigue=fatigue,
            stress=stress,
            motivation=motivation,
            nutritionCompliance=nutrition_compliance,
            bodyweight=self.bodyweight,
            lastMealHoursAgo=round(self.rng.uniform(1.0, 4.0), 1),
        )

    def _generate_sets(
        self,
        exercise: Exercise,
        target_sets: int,
        target_reps: str,
        target_rpe: float,
        e1rm_estimate: float,
        rir_target: int,
        is_bad_day: bool,
    ) -> list[ExerciseSet]:
        """Generate realistic set data with rep decay."""
        # Parse rep range "8-10" -> (8, 10)
        parts = target_reps.split('-')
        rep_low = int(parts[0])
        rep_high = int(parts[1]) if len(parts) > 1 else rep_low
        base_reps = self.rng.randint(rep_low, rep_high)

        # Determine decay rate
        is_compound = exercise.category == 'compound'
        decay_rate = REP_DECAY['compound'] if is_compound else REP_DECAY['isolation']

        # Estimate working weight from e1RM (Epley formula inverted)
        # e1rm = weight * (1 + reps/30)  =>  weight = e1rm / (1 + reps/30)
        if e1rm_estimate > 0:
            working_weight = e1rm_estimate / (1 + base_reps / 30)
            # Round to nearest 2.5 lb
            working_weight = round(working_weight / 2.5) * 2.5
        else:
            working_weight = 100.0  # fallback

        sets: list[ExerciseSet] = []
        for set_num in range(1, target_sets + 1):
            # Apply rep decay from set 1
            decay_factor = (1 - decay_rate) ** (set_num - 1)
            set_reps = max(1, round(base_reps * decay_factor))

            # RPE noise
            rpe_noise = self.rng.gauss(0, 0.5)
            if is_bad_day:
                rpe_noise += 1.0
            set_rpe = round(min(10, max(5, target_rpe + rpe_noise)), 1)

            # RIR derived from RPE (RPE 10 = RIR 0, RPE 9 = RIR 1, etc.)
            set_rir = max(0, round(10 - set_rpe))

            # Compute e1RM for this set (Epley)
            if set_reps > 0:
                set_e1rm = round(working_weight * (1 + set_reps / 30), 1)
            else:
                set_e1rm = working_weight

            timestamp = datetime.now().isoformat()

            rest_after = None
            if set_num < target_sets:
                if is_compound:
                    rest_after = self.rng.randint(100, 200)
                else:
                    rest_after = self.rng.randint(60, 120)

            sets.append(ExerciseSet(
                setNumber=set_num,
                weight=working_weight,
                reps=set_reps,
                rpe=set_rpe,
                rir=set_rir,
                e1rm=set_e1rm,
                timestamp=timestamp,
                restAfterSec=rest_after,
                isWarmup=False,
                isLSTF=False,
            ))

        return sets

    def _generate_post(
        self,
        exercises: list[SessionExercise],
        is_bad_day: bool,
    ) -> SessionPost:
        """Generate post-session feedback."""
        muscle_feedback: dict[str, MuscleFeedback] = {}

        for se in exercises:
            ex = self.exercises.get(se.exerciseId)
            if ex is None:
                continue
            # Primary muscle
            pump = self.rng.randint(2, 5) if not is_bad_day else self.rng.randint(1, 3)
            soreness = self.rng.randint(0, 2)
            joint_pain = 0 if self.rng.random() > 0.05 else self.rng.randint(1, 2)
            perf = self.rng.randint(3, 5) if not is_bad_day else self.rng.randint(1, 3)
            muscle_feedback[ex.primaryMuscle] = MuscleFeedback(
                pump=pump,
                soreness=soreness,
                jointPain=joint_pain,
                performance=perf,
            )

        overall_fatigue = self.rng.randint(3, 5) if is_bad_day else self.rng.randint(2, 4)
        session_rating = self.rng.randint(1, 3) if is_bad_day else self.rng.randint(3, 5)

        return SessionPost(
            muscleFeedback=muscle_feedback,
            overallFatigue=overall_fatigue,
            sessionRating=session_rating,
        )

    def _generate_nutrition(self, date: str, is_training_day: bool) -> DailyNutrition:
        """Generate realistic nutrition data around targets with variance."""
        day_key = 'trainingDay' if is_training_day else 'restDay'
        targets = NUTRITION_TARGETS[day_key]

        cal_variance = self.rng.gauss(0, 150)
        protein_variance = self.rng.gauss(0, 15)
        fat_variance = self.rng.gauss(0, 10)
        carb_variance = self.rng.gauss(0, 30)

        actual_cals = max(1500, round(targets['calories'] + cal_variance))
        actual_protein = max(80, round(targets['protein'] + protein_variance))
        actual_fat = max(30, round(targets['fat'] + fat_variance))
        actual_carbs = max(100, round(targets['carbs'] + carb_variance))

        # Compliance
        cal_compliance = round(actual_cals / targets['calories'], 2)
        protein_compliance = round(actual_protein / targets['protein'], 2)
        overall = round((cal_compliance * 0.5 + protein_compliance * 0.5), 2)

        return DailyNutrition(
            date=date,
            isTrainingDay=is_training_day,
            dayType=day_key,
            targets=NutritionTargets(
                calories=targets['calories'],
                protein=targets['protein'],
                fat=targets['fat'],
                carbs=targets['carbs'],
            ),
            actual=NutritionActual(
                calories=actual_cals,
                protein=actual_protein,
                fat=actual_fat,
                carbs=actual_carbs,
            ),
            compliance=NutritionCompliance(
                calorieCompliance=cal_compliance,
                proteinCompliance=protein_compliance,
                overallScore=overall,
            ),
            bodyweight=self.bodyweight,
        )

    def _get_e1rm_estimate(self, exercise_id: str, exercise: Exercise) -> float:
        """Get current e1RM for an exercise, estimating if not in lookup."""
        if exercise_id in self.e1rm:
            return self.e1rm[exercise_id]

        # Heuristic: estimate from category and fatigue rating
        if exercise.category == 'compound':
            return 150.0  # generic compound estimate
        else:
            return 60.0   # generic isolation estimate

    def _apply_progressive_overload(self) -> None:
        """Apply inter-mesocycle progressive overload.

        - Compounds: +2.5 lb per mesocycle on e1RM
        - Isolations: reps advance (handled implicitly by set generation)
        """
        for ex_id in list(self.e1rm.keys()):
            ex = self.exercises.get(ex_id)
            if ex is not None and ex.category == 'compound':
                self.e1rm[ex_id] += 2.5
