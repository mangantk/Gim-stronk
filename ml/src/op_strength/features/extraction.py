# =============================================================================
# Op Strength — Feature Extraction
# Feature engineering from Section 17 of the spec.
# =============================================================================

from __future__ import annotations

from ..types import (
    DailyNutrition,
    Exercise,
    ExerciseSet,
    Session,
    SessionPre,
)
from ..constants import READINESS_WEIGHTS


def compute_readiness_score(pre: SessionPre) -> float:
    """Compute readiness score (0-10) from pre-session data.

    Uses the weighted formula from Section 9.2 of the spec.
    Sleep hours is normalised to a 0-10 scale (capped at 9h = 10).
    Fatigue and stress are inverted (5 = bad -> low readiness contribution).
    """
    # Normalise sleep hours to 0-10 scale (0h=0, 9h=10)
    sleep_norm = min(10, (pre.sleepHours / 9.0) * 10)

    # Quality/motivation/nutrition are 1-5 -> scale to 0-10
    quality_norm = (pre.sleepQuality - 1) * 2.5
    motivation_norm = (pre.motivation - 1) * 2.5
    nutrition_norm = (pre.nutritionCompliance - 1) * 2.5

    # Fatigue and stress are inverted (1 = fresh = 10, 5 = wrecked = 0)
    fatigue_norm = (5 - pre.fatigue) * 2.5
    stress_norm = (5 - pre.stress) * 2.5

    score = (
        READINESS_WEIGHTS['sleepHours'] * sleep_norm
        + READINESS_WEIGHTS['sleepQuality'] * quality_norm
        + READINESS_WEIGHTS['fatigue'] * fatigue_norm
        + READINESS_WEIGHTS['stress'] * stress_norm
        + READINESS_WEIGHTS['motivation'] * motivation_norm
        + READINESS_WEIGHTS['nutritionCompliance'] * nutrition_norm
    )

    return round(max(0, min(10, score)), 2)


class FeatureExtractor:
    """Extract ML features from session and exercise data.

    Feature tiers follow Section 17 of the spec:
      A - Static exercise properties (from library)
      B - Personal rolling averages (requires history)
      C - Current systemic state (readiness, week-in-meso)
      D - Reserved for future use
      E - Per-event computed features
    """

    def __init__(self, exercise_library: dict[str, Exercise]):
        self.exercises = exercise_library

    # ------------------------------------------------------------------
    # Model 1: Performance Predictor features
    # ------------------------------------------------------------------

    def extract_set_features(
        self,
        set_data: ExerciseSet,
        exercise: Exercise,
        session: Session,
        history: list[Session],
        nutrition_history: list[DailyNutrition] | None = None,
    ) -> dict:
        """Extract features for Model 1 (performance predictor).

        Returns a flat dict of feature_name -> numeric value.
        Features that require insufficient history are set to None.
        """
        features: dict = {}

        # --- Tier A: Static exercise properties ---
        features['stretch_position'] = exercise.sfr.stimulusComponents.stretchPosition
        features['isolation_purity'] = exercise.sfr.stimulusComponents.isolationPurity
        features['muscle_tension'] = exercise.sfr.stimulusComponents.muscleTension
        features['is_compound'] = 1 if exercise.category == 'compound' else 0
        features['fatigue_cost'] = exercise.sfr.fatigueCost
        features['stimulus_score'] = exercise.sfr.stimulusScore
        features['systemic_load'] = exercise.sfr.fatigueComponents.systemicLoad
        features['joint_stress'] = exercise.sfr.fatigueComponents.jointStress
        features['recovery_demand'] = exercise.sfr.fatigueComponents.recoveryDemand
        features['sfr_tier'] = exercise.sfr.tier

        # --- Tier B: Personal rolling averages ---
        # Requires accumulated history; None when insufficient
        personal_rep_decay = self._compute_personal_rep_decay(exercise.id, history)
        features['personal_rep_decay'] = personal_rep_decay

        avg_rpe_deviation = self._compute_avg_rpe_deviation(exercise.id, history)
        features['avg_rpe_deviation'] = avg_rpe_deviation

        # --- Tier C: Current systemic state ---
        features['week_in_meso'] = session.week
        features['readiness'] = compute_readiness_score(session.pre)
        features['sleep_hours'] = session.pre.sleepHours
        features['fatigue_level'] = session.pre.fatigue
        features['stress_level'] = session.pre.stress
        features['motivation'] = session.pre.motivation

        # --- Tier E: Per-event computed ---
        features['set_number'] = set_data.setNumber
        features['weight_pct_e1rm'] = (
            set_data.weight / set_data.e1rm if set_data.e1rm > 0 else 0
        )
        features['cumulative_fu_today'] = self._compute_cumulative_fu(
            session, exercise.id, set_data.setNumber
        )
        features['hours_since_last_training'] = self._hours_since_last(session, history)
        features['sleep_3day_avg'] = self._sleep_n_day_avg(session, history, n=3)
        features['protein_compliance_3day'] = self._protein_compliance_avg(
            session, nutrition_history, n=3
        )

        return features

    # ------------------------------------------------------------------
    # Model 2: Readiness Predictor features
    # ------------------------------------------------------------------

    def extract_readiness_features(
        self,
        session: Session,
        history: list[Session],
    ) -> dict:
        """Extract features for Model 2 (readiness predictor)."""
        features: dict = {}

        features['sleep_hours'] = session.pre.sleepHours
        features['sleep_quality'] = session.pre.sleepQuality
        features['fatigue'] = session.pre.fatigue
        features['stress'] = session.pre.stress
        features['motivation'] = session.pre.motivation
        features['nutrition_compliance'] = session.pre.nutritionCompliance
        features['bodyweight'] = session.pre.bodyweight or 0

        # Rolling session metrics from recent history
        recent = history[-5:] if len(history) >= 5 else history
        if recent:
            features['avg_session_rating_5'] = sum(
                s.post.sessionRating for s in recent if s.post
            ) / max(1, sum(1 for s in recent if s.post))
            features['avg_overall_fatigue_5'] = sum(
                s.post.overallFatigue for s in recent if s.post
            ) / max(1, sum(1 for s in recent if s.post))
        else:
            features['avg_session_rating_5'] = None
            features['avg_overall_fatigue_5'] = None

        features['week_in_meso'] = session.week
        features['sessions_this_week'] = self._sessions_in_same_week(session, history)

        return features

    # ------------------------------------------------------------------
    # Model 3: Fatigue Cost Estimator features
    # ------------------------------------------------------------------

    def extract_fatigue_features(
        self,
        exercise: Exercise,
        session: Session,
        history: list[Session],
    ) -> dict:
        """Extract features for Model 3 (fatigue cost estimator)."""
        features: dict = {}

        # Exercise properties
        features['static_fatigue_cost'] = exercise.sfr.fatigueCost
        features['systemic_load'] = exercise.sfr.fatigueComponents.systemicLoad
        features['joint_stress'] = exercise.sfr.fatigueComponents.jointStress
        features['recovery_demand'] = exercise.sfr.fatigueComponents.recoveryDemand
        features['eccentric_damage'] = exercise.sfr.fatigueComponents.eccentricDamage
        features['is_compound'] = 1 if exercise.category == 'compound' else 0
        features['recovery_hours'] = exercise.recoveryHours

        # Session context
        features['readiness'] = compute_readiness_score(session.pre)
        features['week_in_meso'] = session.week

        # Post-session feedback (proxy for observed fatigue)
        if session.post:
            mf = session.post.muscleFeedback.get(exercise.primaryMuscle)
            features['soreness_feedback'] = mf.soreness if mf else None
            features['pump_feedback'] = mf.pump if mf else None
            features['joint_pain_feedback'] = mf.jointPain if mf else None
            features['overall_fatigue_post'] = session.post.overallFatigue
        else:
            features['soreness_feedback'] = None
            features['pump_feedback'] = None
            features['joint_pain_feedback'] = None
            features['overall_fatigue_post'] = None

        return features

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _compute_personal_rep_decay(
        self, exercise_id: str, history: list[Session]
    ) -> float | None:
        """Compute personal rep-decay rate from historical multi-set data.

        Returns None if fewer than 5 exercise instances in history.
        """
        decay_rates: list[float] = []

        for session in history:
            for se in session.exercises:
                if se.exerciseId != exercise_id:
                    continue
                working_sets = [s for s in se.sets if not s.isWarmup and s.reps > 0]
                if len(working_sets) < 2:
                    continue
                for i in range(1, len(working_sets)):
                    prev_reps = working_sets[i - 1].reps
                    curr_reps = working_sets[i].reps
                    if prev_reps > 0:
                        decay_rates.append(1 - curr_reps / prev_reps)

        if len(decay_rates) < 5:
            return None

        return round(sum(decay_rates) / len(decay_rates), 4)

    def _compute_avg_rpe_deviation(
        self, exercise_id: str, history: list[Session]
    ) -> float | None:
        """Average deviation of actual RPE from target RPE for this exercise."""
        deviations: list[float] = []

        for session in history:
            for se in session.exercises:
                if se.exerciseId != exercise_id:
                    continue
                for s in se.sets:
                    if not s.isWarmup:
                        deviations.append(s.rpe - se.targetRPE)

        if len(deviations) < 5:
            return None

        return round(sum(deviations) / len(deviations), 2)

    def _compute_cumulative_fu(
        self, session: Session, current_exercise_id: str, current_set_num: int
    ) -> float:
        """Sum of fatigue units for all sets completed before the current set."""
        total_fu = 0.0
        for se in session.exercises:
            ex = self.exercises.get(se.exerciseId)
            if ex is None:
                continue
            for s in se.sets:
                if s.isWarmup:
                    continue
                # Stop at the current set of the current exercise
                if se.exerciseId == current_exercise_id and s.setNumber >= current_set_num:
                    break
                # FU = fatigue_cost * RIR_multiplier
                from ..constants import RIR_MULTIPLIERS
                rir_mult = RIR_MULTIPLIERS.get(s.rir, 1.0)
                total_fu += ex.sfr.fatigueCost * rir_mult
            else:
                continue  # only executed if inner loop didn't break
            # If inner loop broke, we've reached the current exercise/set
            if se.exerciseId == current_exercise_id:
                break

        return round(total_fu, 2)

    def _hours_since_last(self, session: Session, history: list[Session]) -> float | None:
        """Hours between previous session and the current one."""
        if not history:
            return None

        # Find the most recent session before current date
        current_date = session.date
        prev_sessions = [s for s in history if s.date < current_date]
        if not prev_sessions:
            return None

        prev = max(prev_sessions, key=lambda s: s.date)
        try:
            from datetime import datetime
            d1 = datetime.fromisoformat(prev.date)
            d2 = datetime.fromisoformat(current_date)
            return round((d2 - d1).total_seconds() / 3600, 1)
        except (ValueError, TypeError):
            return None

    def _sleep_n_day_avg(
        self, session: Session, history: list[Session], n: int
    ) -> float | None:
        """Average sleep hours over the last n sessions."""
        recent = [s for s in history if s.date < session.date]
        recent.sort(key=lambda s: s.date, reverse=True)
        recent = recent[:n]

        if len(recent) < n:
            return None

        return round(sum(s.pre.sleepHours for s in recent) / len(recent), 2)

    def _protein_compliance_avg(
        self,
        session: Session,
        nutrition: list[DailyNutrition] | None,
        n: int,
    ) -> float | None:
        """Average protein compliance over the last n days."""
        if not nutrition:
            return None

        recent = [d for d in nutrition if d.date < session.date]
        recent.sort(key=lambda d: d.date, reverse=True)
        recent = recent[:n]

        if len(recent) < n:
            return None

        compliances = []
        for d in recent:
            if d.compliance and d.compliance.proteinCompliance > 0:
                compliances.append(d.compliance.proteinCompliance)
            elif d.targets.protein > 0:
                compliances.append(d.actual.protein / d.targets.protein)

        if not compliances:
            return None

        return round(sum(compliances) / len(compliances), 3)

    def _sessions_in_same_week(self, session: Session, history: list[Session]) -> int:
        """Count sessions in the same mesocycle week."""
        return sum(
            1 for s in history
            if s.mesocycleId == session.mesocycleId and s.week == session.week
        )
