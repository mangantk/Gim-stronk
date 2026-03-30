# =============================================================================
# Op Strength — Exercise Library Loader
# Loads the canonical exercise library from data/exercises.json
# =============================================================================

import json
from pathlib import Path

from .types import Exercise


def load_exercise_library(json_path: str | Path | None = None) -> dict[str, Exercise]:
    """Load the exercise library from JSON.

    If *json_path* is not provided, defaults to the canonical
    ``data/exercises.json`` relative to the repository root.
    """
    if json_path is None:
        # ml/src/op_strength/exercise_library.py -> ml/src/op_strength
        # Go up 4 levels to reach the repo root: op_strength -> src -> ml -> repo
        json_path = Path(__file__).parent.parent.parent.parent / 'data' / 'exercises.json'
    else:
        json_path = Path(json_path)

    with open(json_path) as f:
        data = json.load(f)

    return {k: Exercise.from_dict(v) for k, v in data.items()}


def load_week_template(json_path: str | Path | None = None):
    """Load the week-1 template from JSON."""
    from .types import WeekTemplate

    if json_path is None:
        json_path = Path(__file__).parent.parent.parent.parent / 'data' / 'template_week1.json'
    else:
        json_path = Path(json_path)

    with open(json_path) as f:
        data = json.load(f)

    return WeekTemplate.from_dict(data)
