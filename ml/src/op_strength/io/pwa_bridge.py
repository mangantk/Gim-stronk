# =============================================================================
# Op Strength — PWA Bridge (I/O)
# Import/export data between the PWA and the ML pipeline.
# =============================================================================

from __future__ import annotations

import json
from pathlib import Path

from ..types import DailyNutrition, DataExport, Session


def import_pwa_export(
    json_path: str | Path,
) -> tuple[list[Session], list[DailyNutrition]]:
    """Parse the JSON export from the PWA.

    Expects the ``DataExport`` schema defined in app/src/types.ts:
    ```json
    {
      "version": "...",
      "exportDate": "...",
      "sessions": [...],
      "nutrition": [...],
      "metadata": {...}
    }
    ```

    Returns
    -------
    tuple of (sessions, nutrition)
    """
    with open(json_path) as f:
        data = json.load(f)

    sessions = [Session.from_dict(s) for s in data.get('sessions', [])]
    nutrition = [DailyNutrition.from_dict(n) for n in data.get('nutrition', [])]
    return sessions, nutrition


def import_data_export(json_path: str | Path) -> DataExport:
    """Parse a full DataExport object from the PWA."""
    with open(json_path) as f:
        data = json.load(f)
    return DataExport.from_dict(data)


def export_parameters(output_path: str | Path, parameters: dict) -> None:
    """Export updated ML parameters for the PWA to consume.

    The PWA reads this file to update its local constants with
    personalised values discovered by the ML pipeline (e.g., updated
    rep-decay rates, fatigue costs, readiness weights).

    Parameters
    ----------
    output_path : str | Path
        Where to write the JSON file.
    parameters : dict
        The parameter dict to serialise.  Expected keys include:
          - personal_rep_decay: dict[exercise_id, float]
          - personal_fatigue_costs: dict[exercise_id, float]
          - readiness_weight_overrides: dict[str, float] | None
          - model_metadata: {version, trained_on_sessions, timestamp}
    """
    with open(output_path, 'w') as f:
        json.dump(parameters, f, indent=2)


def export_shadow_report(output_path: str | Path, report: dict) -> None:
    """Export a shadow-mode evaluation report as JSON."""
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)
