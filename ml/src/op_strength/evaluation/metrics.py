# =============================================================================
# Op Strength — Evaluation Metrics
# Standard regression metrics for comparing ML models vs baselines.
# =============================================================================

from __future__ import annotations

import numpy as np


def mae(actual, predicted) -> float:
    """Mean Absolute Error."""
    actual = np.asarray(actual, dtype=np.float64)
    predicted = np.asarray(predicted, dtype=np.float64)
    return float(np.mean(np.abs(actual - predicted)))


def rmse(actual, predicted) -> float:
    """Root Mean Squared Error."""
    actual = np.asarray(actual, dtype=np.float64)
    predicted = np.asarray(predicted, dtype=np.float64)
    return float(np.sqrt(np.mean((actual - predicted) ** 2)))


def mape(actual, predicted) -> float:
    """Mean Absolute Percentage Error.

    Observations where actual == 0 are excluded to avoid division by zero.
    Returns 0.0 if no valid observations remain.
    """
    actual = np.asarray(actual, dtype=np.float64)
    predicted = np.asarray(predicted, dtype=np.float64)
    mask = actual != 0
    if not mask.any():
        return 0.0
    return float(np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])))


def r_squared(actual, predicted) -> float:
    """Coefficient of determination (R^2)."""
    actual = np.asarray(actual, dtype=np.float64)
    predicted = np.asarray(predicted, dtype=np.float64)
    ss_res = np.sum((actual - predicted) ** 2)
    ss_tot = np.sum((actual - np.mean(actual)) ** 2)
    if ss_tot == 0:
        return 0.0
    return float(1 - ss_res / ss_tot)


def within_tolerance(actual, predicted, tolerance: float = 1.0) -> float:
    """Fraction of predictions within *tolerance* of the actual value.

    Useful for rep predictions where being within 1 rep is "correct enough".
    """
    actual = np.asarray(actual, dtype=np.float64)
    predicted = np.asarray(predicted, dtype=np.float64)
    if len(actual) == 0:
        return 0.0
    return float(np.mean(np.abs(actual - predicted) <= tolerance))
