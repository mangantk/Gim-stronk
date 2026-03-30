// =============================================================================
// Op Strength — Set Logger Component
// Inline set logging UI rendered within the session screen.
// =============================================================================

import { el, clear } from '../components/dom';
import { computeE1RM } from '../engine/e1rm';
import type { ExerciseSet } from '../types';

// RPE values available for selection
const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

/**
 * Render the set logger inline into a container.
 * Pre-fills weight and reps based on prescription or previous set.
 * Calls onSave with the completed ExerciseSet when the user saves.
 */
export function renderSetLogger(
  container: HTMLElement,
  exerciseId: string,
  setNumber: number,
  prescribedWeight: number | null,
  targetReps: string,
  targetRPE: number,
  onSave: (set: ExerciseSet) => void,
): void {
  clear(container);

  // Parse target rep range to get middle value for pre-fill
  const repRange = parseRepRange(targetReps);
  const defaultReps = Math.round((repRange[0] + repRange[1]) / 2);

  let weight = prescribedWeight ?? 0;
  let reps = defaultReps;
  let rpe = targetRPE;

  const logger = el('div', { class: 'set-logger' });

  // Set number header
  logger.appendChild(
    el('div', { class: 'set-logger-header' }, `Set ${setNumber}`),
  );

  // --- Weight Input ---
  const weightSection = el('div', { class: 'set-logger-section' });
  weightSection.appendChild(el('div', { class: 'set-logger-label' }, 'Weight (lbs)'));

  const weightControls = el('div', { class: 'set-logger-controls weight-controls' });

  const minus5Btn = el('button', { class: 'stepper-btn', type: 'button' }, '-5');
  const minus2Btn = el('button', { class: 'stepper-btn', type: 'button' }, '-2.5');
  const weightInput = el('input', {
    type: 'number',
    class: 'input-field weight-input',
    value: String(weight),
    min: '0',
    step: '2.5',
  }) as HTMLInputElement;
  const plus2Btn = el('button', { class: 'stepper-btn', type: 'button' }, '+2.5');
  const plus5Btn = el('button', { class: 'stepper-btn', type: 'button' }, '+5');

  function updateWeight(newWeight: number) {
    weight = Math.max(0, Math.round(newWeight * 10) / 10);
    weightInput.value = String(weight);
  }

  minus5Btn.addEventListener('click', () => updateWeight(weight - 5));
  minus2Btn.addEventListener('click', () => updateWeight(weight - 2.5));
  plus2Btn.addEventListener('click', () => updateWeight(weight + 2.5));
  plus5Btn.addEventListener('click', () => updateWeight(weight + 5));
  weightInput.addEventListener('input', () => {
    weight = parseFloat(weightInput.value) || 0;
  });

  weightControls.appendChild(minus5Btn);
  weightControls.appendChild(minus2Btn);
  weightControls.appendChild(weightInput);
  weightControls.appendChild(plus2Btn);
  weightControls.appendChild(plus5Btn);
  weightSection.appendChild(weightControls);
  logger.appendChild(weightSection);

  // --- Reps Input ---
  const repsSection = el('div', { class: 'set-logger-section' });
  repsSection.appendChild(
    el('div', { class: 'set-logger-label' }, `Reps (target: ${targetReps})`),
  );

  const repsControls = el('div', { class: 'set-logger-controls reps-controls' });

  const minusRepBtn = el('button', { class: 'stepper-btn', type: 'button' }, '-1');
  const repsInput = el('input', {
    type: 'number',
    class: 'input-field reps-input',
    value: String(reps),
    min: '0',
    step: '1',
  }) as HTMLInputElement;
  const plusRepBtn = el('button', { class: 'stepper-btn', type: 'button' }, '+1');

  function updateReps(newReps: number) {
    reps = Math.max(0, Math.round(newReps));
    repsInput.value = String(reps);
  }

  minusRepBtn.addEventListener('click', () => updateReps(reps - 1));
  plusRepBtn.addEventListener('click', () => updateReps(reps + 1));
  repsInput.addEventListener('input', () => {
    reps = parseInt(repsInput.value, 10) || 0;
  });

  repsControls.appendChild(minusRepBtn);
  repsControls.appendChild(repsInput);
  repsControls.appendChild(plusRepBtn);
  repsSection.appendChild(repsControls);
  logger.appendChild(repsSection);

  // --- RPE Selector ---
  const rpeSection = el('div', { class: 'set-logger-section' });
  rpeSection.appendChild(
    el('div', { class: 'set-logger-label' }, `RPE (target: ${targetRPE})`),
  );

  const rpeBtnRow = el('div', { class: 'rpe-buttons' });
  const rpeButtons: HTMLButtonElement[] = [];

  for (const rpeVal of RPE_VALUES) {
    const btn = el('button', {
      class: 'rpe-btn',
      type: 'button',
      'data-rpe': String(rpeVal),
    }, String(rpeVal)) as HTMLButtonElement;

    // Pre-select closest RPE to target
    if (rpeVal === findClosestRPE(targetRPE)) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      for (const b of rpeButtons) b.classList.remove('active');
      btn.classList.add('active');
      rpe = rpeVal;
    });

    rpeButtons.push(btn);
    rpeBtnRow.appendChild(btn);
  }

  // Initialize rpe to the closest available value
  rpe = findClosestRPE(targetRPE);

  rpeSection.appendChild(rpeBtnRow);
  logger.appendChild(rpeSection);

  // --- Save Button ---
  const saveBtn = el('button', { class: 'btn btn-primary btn-large save-set-btn' }, 'SAVE SET');
  saveBtn.addEventListener('click', () => {
    // Read latest values from inputs in case user typed directly
    const finalWeight = parseFloat(weightInput.value) || weight;
    const finalReps = parseInt(repsInput.value, 10) || reps;
    const rir = 10 - rpe;
    const e1rm = computeE1RM(finalWeight, finalReps);

    const set: ExerciseSet = {
      setNumber,
      weight: finalWeight,
      reps: finalReps,
      rpe,
      rir,
      e1rm,
      tempo: null,
      isWarmup: false,
      isLSTF: false,
      isMyoRep: false,
      isDropSet: false,
      isLengthenedPartial: false,
      timestamp: new Date().toISOString(),
      restAfterSec: null,
      formNotes: '',
      liveAdaptation: null,
    };

    onSave(set);
  });
  logger.appendChild(saveBtn);

  container.appendChild(logger);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseRepRange(range: string): [number, number] {
  const parts = range.split('-').map((s) => parseInt(s.trim(), 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[0], parts[1]];
  }
  const single = parseInt(range, 10);
  if (!isNaN(single)) return [single, single];
  return [8, 12]; // fallback default
}

function findClosestRPE(target: number): number {
  let closest = RPE_VALUES[0];
  let minDiff = Math.abs(target - closest);

  for (const val of RPE_VALUES) {
    const diff = Math.abs(target - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = val;
    }
  }

  return closest;
}
