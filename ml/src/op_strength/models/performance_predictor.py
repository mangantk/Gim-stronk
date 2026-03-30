# =============================================================================
# Op Strength — Model 1: Performance Predictor
# XGBoost model predicting reps and RPE per set (Section 17.2)
# =============================================================================

from __future__ import annotations

import xgboost as xgb
import numpy as np


# Canonical feature list — must match the keys produced by
# FeatureExtractor.extract_set_features().
FEATURE_NAMES: list[str] = [
    # Tier A: Static exercise properties
    'stretch_position',
    'isolation_purity',
    'muscle_tension',
    'is_compound',
    'fatigue_cost',
    'stimulus_score',
    'systemic_load',
    'joint_stress',
    'recovery_demand',
    'sfr_tier',
    # Tier B: Personal rolling averages
    'personal_rep_decay',
    'avg_rpe_deviation',
    # Tier C: Current systemic state
    'week_in_meso',
    'readiness',
    'sleep_hours',
    'fatigue_level',
    'stress_level',
    'motivation',
    # Tier E: Per-event computed
    'set_number',
    'weight_pct_e1rm',
    'cumulative_fu_today',
    'hours_since_last_training',
    'sleep_3day_avg',
    'protein_compliance_3day',
]


class PerformancePredictor:
    """XGBoost model predicting reps and RPE per set (Section 17.2).

    Two separate regressors:
      - model_reps: predicts number of reps achieved
      - model_rpe: predicts RPE of the set

    Shadow mode runs this alongside RuleBasedRepPredictor. The ML model
    takes over when shadow evaluation shows >= 5% MAE improvement.
    """

    def __init__(self):
        self.model_reps: xgb.XGBRegressor | None = None
        self.model_rpe: xgb.XGBRegressor | None = None
        self.feature_names: list[str] = list(FEATURE_NAMES)
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, y_reps: np.ndarray, y_rpe: np.ndarray) -> None:
        """Train on accumulated session data.

        Parameters
        ----------
        X : ndarray of shape (n_samples, n_features)
            Feature matrix. Columns must align with ``FEATURE_NAMES``.
            ``None`` / ``NaN`` values for Tier B features are acceptable —
            XGBoost handles missing values natively.
        y_reps : ndarray of shape (n_samples,)
            Target reps per set.
        y_rpe : ndarray of shape (n_samples,)
            Target RPE per set.
        """
        self.model_reps = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            objective='reg:squarederror',
            tree_method='hist',
        )
        self.model_reps.fit(X, y_reps)

        self.model_rpe = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.1,
            objective='reg:squarederror',
            tree_method='hist',
        )
        self.model_rpe.fit(X, y_rpe)

        self.is_fitted = True

    def predict(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Returns (predicted_reps, predicted_rpe).

        Parameters
        ----------
        X : ndarray of shape (n_samples, n_features)

        Returns
        -------
        tuple of (predicted_reps, predicted_rpe), each shape (n_samples,)
        """
        if not self.is_fitted:
            raise ValueError("Model not fitted. Call fit() first or wait for sufficient data.")
        return self.model_reps.predict(X), self.model_rpe.predict(X)

    def predict_single(self, features: dict) -> tuple[float, float]:
        """Convenience: predict from a single feature dict.

        Converts the dict into the expected array format, replacing
        None values with NaN for XGBoost.
        """
        row = []
        for name in self.feature_names:
            val = features.get(name)
            row.append(float(val) if val is not None else float('nan'))

        X = np.array([row], dtype=np.float32)
        reps, rpe = self.predict(X)
        return float(reps[0]), float(rpe[0])

    def get_feature_importance(self) -> dict[str, float]:
        """Return feature importance scores from the reps model.

        Uses the 'gain' importance type (average gain across all splits
        that use the feature).
        """
        if not self.is_fitted or self.model_reps is None:
            return {}

        importance = self.model_reps.get_booster().get_score(importance_type='gain')
        # Map from xgb internal feature names (f0, f1, ...) to our names
        result: dict[str, float] = {}
        for key, value in importance.items():
            idx = int(key.replace('f', ''))
            if idx < len(self.feature_names):
                result[self.feature_names[idx]] = value
        return result
