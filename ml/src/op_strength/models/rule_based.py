# =============================================================================
# Op Strength — Rule-Based Baselines
# These are the deterministic baselines that ML models will be compared against.
# =============================================================================

from __future__ import annotations

from ..types import Exercise, ExerciseSet, SessionPre
from ..constants import REP_DECAY
from ..features.extraction import compute_readiness_score


class RuleBasedRepPredictor:
    """Predicts next set reps using 7%/4% decay rate (Section 9.3).

    This is the simplest possible rep predictor: apply a fixed decay
    rate per set based on exercise category.
    """

    def predict(self, exercise: Exercise, previous_set: ExerciseSet) -> tuple[float, float]:
        """Returns (predicted_reps, predicted_rpe).

        predicted_reps: expected reps for the next set at the same weight.
        predicted_rpe: rough heuristic RPE increase of +0.5 per set.
        """
        decay = REP_DECAY.get(
            exercise.category,
            REP_DECAY['compound'],
        )
        predicted_reps = previous_set.reps * (1 - decay)
        predicted_rpe = previous_set.rpe + 0.5  # rough heuristic
        return round(predicted_reps, 1), min(10.0, predicted_rpe)


class RuleBasedReadinessPredictor:
    """Predicts session performance from readiness using Section 9.2 formula.

    Simple linear mapping: readiness 0-10 -> performance 1-5.
    """

    def predict(self, pre: SessionPre) -> float:
        """Returns predicted average performance score (1-5)."""
        readiness = compute_readiness_score(pre)
        # Linear mapping: readiness 0 -> 1, readiness 10 -> 5
        return max(1.0, min(5.0, 1 + (readiness / 10) * 4))


class StaticFatigueCostLookup:
    """Returns static fatigue cost from the exercise library.

    This is the "no learning" baseline: always return the library value.
    ML Model 3 (Bayesian fatigue estimator) should eventually beat this
    by personalising fatigue costs based on observed recovery data.
    """

    def __init__(self, exercise_library: dict[str, Exercise]):
        self.exercises = exercise_library

    def predict(self, exercise_id: str) -> float:
        """Return the static fatigue cost for the given exercise."""
        ex = self.exercises.get(exercise_id)
        if ex is None:
            raise KeyError(f"Unknown exercise: {exercise_id}")
        return ex.sfr.fatigueCost
