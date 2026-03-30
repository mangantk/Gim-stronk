# =============================================================================
# Op Strength — Shadow Mode Framework
# Runs ML model alongside rule-based system, logs both, compares.
# =============================================================================

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np


@dataclass
class ShadowPrediction:
    """One logged prediction from both the ML model and rule-based baseline."""
    model_prediction: Any
    rule_based_prediction: Any
    actual: Any = None
    timestamp: str = ''
    context: dict = field(default_factory=dict)


class ShadowModeRunner:
    """Runs an ML model alongside a rule-based system, logs both, and compares.

    In shadow mode, the rule-based prediction is ALWAYS returned to the
    user.  The ML prediction is logged silently for offline evaluation.
    The ML model is promoted only when ``evaluate()`` shows it beats the
    rule-based system by at least 5% on MAE.

    Usage:
        shadow = ShadowModeRunner(ml_model, rule_model, "rep_predictor")
        result = shadow.predict_and_log(features, context)
        # ... user does the set ...
        shadow.record_actual(actual_reps)
        # Periodically:
        report = shadow.evaluate()
    """

    def __init__(self, ml_model: Any, rule_based_model: Any, model_name: str):
        self.ml_model = ml_model
        self.rule_based = rule_based_model
        self.model_name = model_name
        self.log: list[ShadowPrediction] = []

    def predict_and_log(self, features: Any, context: dict | None = None) -> Any:
        """Run both models, log predictions, return rule-based result.

        Parameters
        ----------
        features : Any
            Input features — passed directly to both model's predict() methods.
        context : dict, optional
            Additional context (timestamp, exercise ID, etc.) for logging.

        Returns
        -------
        The rule-based prediction (always used in shadow mode).
        """
        # Rule-based prediction
        rule_pred = None
        if hasattr(self.rule_based, 'predict'):
            try:
                rule_pred = self.rule_based.predict(features)
            except Exception:
                rule_pred = None

        # ML prediction (may not be fitted yet)
        ml_pred = None
        try:
            if hasattr(self.ml_model, 'is_fitted') and self.ml_model.is_fitted:
                ml_pred = self.ml_model.predict(features)
        except Exception:
            ml_pred = None

        self.log.append(ShadowPrediction(
            model_prediction=ml_pred,
            rule_based_prediction=rule_pred,
            timestamp=(context or {}).get('timestamp', ''),
            context=context or {},
        ))

        return rule_pred  # Always return rule-based in shadow mode

    def record_actual(self, actual: Any) -> None:
        """Record what actually happened for the most recent prediction."""
        if self.log:
            self.log[-1].actual = actual

    def evaluate(self) -> dict:
        """Compare ML vs rule-based accuracy on predictions with actuals.

        Returns
        -------
        dict with keys:
            - n: number of completed comparisons
            - ml_mae: mean absolute error of ML model
            - rule_mae: mean absolute error of rule-based model
            - ml_wins: number of predictions where ML was closer
            - rule_wins: number of predictions where rule-based was closer
            - improvement_pct: (rule_mae - ml_mae) / rule_mae * 100
            - ready_for_promotion: True if ML MAE < 95% of rule MAE
            - status: 'insufficient_data' | 'ml_losing' | 'ml_competitive' | 'ready'
        """
        completed = [
            p for p in self.log
            if p.actual is not None and p.model_prediction is not None
        ]

        if not completed:
            return {
                'status': 'insufficient_data',
                'n': 0,
                'model_name': self.model_name,
            }

        ml_errors = []
        rule_errors = []
        for p in completed:
            ml_err = abs(float(p.model_prediction) - float(p.actual))
            rule_err = abs(float(p.rule_based_prediction) - float(p.actual))
            ml_errors.append(ml_err)
            rule_errors.append(rule_err)

        ml_mae = float(np.mean(ml_errors))
        rule_mae = float(np.mean(rule_errors))
        ml_wins = sum(1 for m, r in zip(ml_errors, rule_errors) if m < r)
        rule_wins = sum(1 for m, r in zip(ml_errors, rule_errors) if r < m)

        improvement_pct = (
            (rule_mae - ml_mae) / rule_mae * 100 if rule_mae > 0 else 0
        )
        ready = ml_mae < rule_mae * 0.95  # ML must be >= 5% better

        if ready:
            status = 'ready'
        elif ml_mae <= rule_mae:
            status = 'ml_competitive'
        else:
            status = 'ml_losing'

        return {
            'model_name': self.model_name,
            'n': len(completed),
            'ml_mae': round(ml_mae, 4),
            'rule_mae': round(rule_mae, 4),
            'ml_wins': ml_wins,
            'rule_wins': rule_wins,
            'improvement_pct': round(improvement_pct, 2),
            'ready_for_promotion': ready,
            'status': status,
        }

    def get_log_summary(self) -> dict:
        """Return a high-level summary of the shadow log."""
        total = len(self.log)
        with_actual = sum(1 for p in self.log if p.actual is not None)
        with_ml = sum(1 for p in self.log if p.model_prediction is not None)

        return {
            'model_name': self.model_name,
            'total_predictions': total,
            'with_actual': with_actual,
            'with_ml_prediction': with_ml,
            'evaluable': sum(
                1 for p in self.log
                if p.actual is not None and p.model_prediction is not None
            ),
        }
