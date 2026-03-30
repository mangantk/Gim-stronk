# =============================================================================
# Op Strength — Model 3: Bayesian Fatigue Cost Estimator
# Personalises exercise fatigue costs via conjugate Bayesian updates.
# Section 17.4 of the spec.
# =============================================================================

from __future__ import annotations

from copy import deepcopy

from ..types import Exercise


class BayesianFatigueEstimator:
    """Bayesian estimation of personal fatigue cost per exercise (Section 17.4).

    Starts with the static SFR fatigue costs as Normal priors.  Each
    observation (proxy for actual fatigue experienced) updates the
    posterior via a Normal-Normal conjugate update.

    The observed_fatigue_proxy could be derived from:
      - Next-day soreness rating
      - Recovery time (hours until readiness returns to baseline)
      - Performance drop in the next session for the same muscle
      - Post-session overall fatigue score
    """

    def __init__(self, exercise_library: dict[str, Exercise]):
        self.priors: dict[str, dict] = {}
        for ex_id, ex in exercise_library.items():
            static_cost = ex.sfr.fatigueCost
            self.priors[ex_id] = {
                'mean': static_cost,
                'std': static_cost * 0.30,  # 30% CV as prior uncertainty
                'n_observations': 0,
            }
        # Posteriors start as copies of priors
        self.posteriors: dict[str, dict] = deepcopy(self.priors)

    def update(self, exercise_id: str, observed_fatigue_proxy: float) -> None:
        """Update posterior with a new observation.

        Parameters
        ----------
        exercise_id : str
            The exercise ID to update.
        observed_fatigue_proxy : float
            A numeric proxy for the actual fatigue cost experienced.
            Should be on the same scale as the SFR fatigue cost (0-10).
        """
        if exercise_id not in self.posteriors:
            raise KeyError(f"Unknown exercise: {exercise_id}")

        prior = self.posteriors[exercise_id]
        n = prior['n_observations']

        # Bayesian update for Normal-Normal conjugate
        # Prior: N(mu_0, sigma_0^2)
        # Observation: N(x, sigma_obs^2)  where sigma_obs = sigma_0 * 0.5
        prior_precision = 1 / (prior['std'] ** 2) if prior['std'] > 0 else 1e6
        obs_std = max(prior['std'] * 0.5, 0.01)
        obs_precision = 1 / (obs_std ** 2)

        posterior_precision = prior_precision + obs_precision
        posterior_mean = (
            prior_precision * prior['mean'] + obs_precision * observed_fatigue_proxy
        ) / posterior_precision
        posterior_std = (1 / posterior_precision) ** 0.5

        self.posteriors[exercise_id] = {
            'mean': posterior_mean,
            'std': posterior_std,
            'n_observations': n + 1,
        }

    def predict(self, exercise_id: str) -> tuple[float, float]:
        """Returns (estimated_fatigue_cost, uncertainty).

        Parameters
        ----------
        exercise_id : str

        Returns
        -------
        tuple of (mean, std) — the posterior estimate and its uncertainty.
        """
        if exercise_id not in self.posteriors:
            raise KeyError(f"Unknown exercise: {exercise_id}")

        p = self.posteriors[exercise_id]
        return p['mean'], p['std']

    def get_confidence(self, exercise_id: str) -> float:
        """Confidence = 1 - (posterior_std / prior_std).  Range 0 to 1.

        A confidence of 0 means no observations have been made (posterior
        matches prior).  Confidence asymptotically approaches 1 as
        observations accumulate and posterior uncertainty shrinks.
        """
        if exercise_id not in self.priors:
            raise KeyError(f"Unknown exercise: {exercise_id}")

        prior_std = self.priors[exercise_id]['std']
        post_std = self.posteriors[exercise_id]['std']

        if prior_std <= 0:
            return 1.0

        return max(0.0, 1 - post_std / prior_std)

    def get_all_estimates(self) -> dict[str, dict]:
        """Return a summary of all posteriors for inspection.

        Returns
        -------
        dict mapping exercise_id -> {mean, std, n_observations, confidence}
        """
        result = {}
        for ex_id, p in self.posteriors.items():
            result[ex_id] = {
                'mean': round(p['mean'], 3),
                'std': round(p['std'], 3),
                'n_observations': p['n_observations'],
                'confidence': round(self.get_confidence(ex_id), 3),
            }
        return result
