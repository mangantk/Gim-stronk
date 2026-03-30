// =============================================================================
// Op Strength — Readiness Screen
// Pre-session readiness questionnaire and result display.
// =============================================================================

import { el, clear, scaleSelector, uuid, todayStr } from '../components/dom';
import { computeReadiness } from '../engine/readiness';
import { DAY_MAP, DAY_LABELS } from '../data/constants';
import { getDayTemplate } from '../data/template';
import { getExerciseName } from '../data/exercises';
import { setCurrentSession, setCurrentReadiness } from '../state';
import type { SessionPre, ReadinessResult, Session, SessionExercise } from '../types';

/**
 * Render the readiness check screen.
 */
export function renderReadiness(container: HTMLElement): void {
  clear(container);

  const screen = el('div', { class: 'screen readiness-screen' });

  // Header
  screen.appendChild(el('h2', { class: 'screen-title' }, 'Readiness Check'));
  screen.appendChild(
    el('p', { class: 'screen-subtitle' }, 'How are you feeling before this session?'),
  );

  // Form state
  const formData: SessionPre = {
    bodyweight: null,
    sleepHours: 7,
    sleepQuality: 3,
    fatigue: 3,
    stress: 3,
    motivation: 3,
    nutritionCompliance: 3,
    lastMealHoursAgo: null,
    notes: '',
  };

  const form = el('div', { class: 'readiness-form' });

  // Sleep hours input
  const sleepCard = el('div', { class: 'card readiness-card' });
  sleepCard.appendChild(el('label', { class: 'input-label' }, 'Sleep Hours'));
  const sleepInput = el('input', {
    type: 'number',
    class: 'input-field',
    min: '0',
    max: '12',
    step: '0.5',
    value: '7',
    placeholder: 'Hours slept',
  }) as HTMLInputElement;
  sleepInput.addEventListener('input', () => {
    formData.sleepHours = parseFloat(sleepInput.value) || 0;
  });
  sleepCard.appendChild(sleepInput);
  form.appendChild(sleepCard);

  // Sleep quality (1-5)
  form.appendChild(
    wrapCard(
      scaleSelector('Sleep Quality', 1, 5, (v) => { formData.sleepQuality = v; }, 3),
    ),
  );

  // Fatigue (1-5, inverted: 5 = very fatigued)
  form.appendChild(
    wrapCard(
      scaleSelector('How Tired? (5 = exhausted)', 1, 5, (v) => { formData.fatigue = v; }, 3),
    ),
  );

  // Stress (1-5)
  form.appendChild(
    wrapCard(
      scaleSelector('Stress Level (5 = very stressed)', 1, 5, (v) => { formData.stress = v; }, 3),
    ),
  );

  // Motivation (1-5)
  form.appendChild(
    wrapCard(
      scaleSelector('Motivation', 1, 5, (v) => { formData.motivation = v; }, 3),
    ),
  );

  // Nutrition compliance (1-5)
  form.appendChild(
    wrapCard(
      scaleSelector('Nutrition Compliance', 1, 5, (v) => { formData.nutritionCompliance = v; }, 3),
    ),
  );

  // Bodyweight (optional)
  const bwCard = el('div', { class: 'card readiness-card' });
  bwCard.appendChild(el('label', { class: 'input-label' }, 'Bodyweight (optional, lbs)'));
  const bwInput = el('input', {
    type: 'number',
    class: 'input-field',
    min: '0',
    max: '500',
    step: '0.1',
    placeholder: 'e.g. 185',
  }) as HTMLInputElement;
  bwInput.addEventListener('input', () => {
    const val = parseFloat(bwInput.value);
    formData.bodyweight = isNaN(val) ? null : val;
  });
  bwCard.appendChild(bwInput);
  form.appendChild(bwCard);

  screen.appendChild(form);

  // Result display area (hidden initially)
  const resultArea = el('div', { class: 'readiness-result', style: 'display:none' });
  screen.appendChild(resultArea);

  // Submit button
  const submitBtn = el('button', { class: 'btn btn-primary btn-large' }, 'CHECK READINESS');
  submitBtn.addEventListener('click', () => {
    const result = computeReadiness(formData);
    showResult(resultArea, result, formData);
    submitBtn.style.display = 'none';
  });
  screen.appendChild(submitBtn);

  container.appendChild(screen);
}

// ---------------------------------------------------------------------------
// Result Display
// ---------------------------------------------------------------------------

function showResult(
  container: HTMLElement,
  result: ReadinessResult,
  pre: SessionPre,
): void {
  clear(container);
  container.style.display = '';

  // Score display
  const scoreCard = el('div', { class: 'card readiness-result-card' });

  const scoreDisplay = el('div', { class: 'readiness-score' });
  scoreDisplay.appendChild(
    el('span', { class: 'score-number' }, String(result.score)),
  );
  scoreDisplay.appendChild(
    el('span', { class: 'score-label' }, '/ 10'),
  );
  scoreCard.appendChild(scoreDisplay);

  // Status badge
  const statusClass = `status-${result.status.toLowerCase()}`;
  const badge = el('div', { class: `status-badge ${statusClass}` }, result.status);
  scoreCard.appendChild(badge);

  // Modifiers
  const modifiers = el('div', { class: 'readiness-modifiers' });
  modifiers.appendChild(
    el('div', { class: 'modifier-row' },
      el('span', { class: 'modifier-label' }, 'Load Modifier:'),
      el('span', { class: 'modifier-value' }, `${Math.round(result.loadModifier * 100)}%`),
    ),
  );
  modifiers.appendChild(
    el('div', { class: 'modifier-row' },
      el('span', { class: 'modifier-label' }, 'Volume Modifier:'),
      el('span', { class: 'modifier-value' }, `${Math.round(result.volumeModifier * 100)}%`),
    ),
  );
  if (result.rpeCapOverride !== null) {
    modifiers.appendChild(
      el('div', { class: 'modifier-row' },
        el('span', { class: 'modifier-label' }, 'RPE Cap:'),
        el('span', { class: 'modifier-value' }, String(result.rpeCapOverride)),
      ),
    );
  }
  scoreCard.appendChild(modifiers);

  // Message
  if (result.message) {
    scoreCard.appendChild(
      el('div', { class: `readiness-message ${statusClass}` }, result.message),
    );
  }

  // Exercise swaps
  if (result.exerciseSwaps.length > 0) {
    const swapsSection = el('div', { class: 'exercise-swaps' });
    swapsSection.appendChild(el('h3', {}, 'Exercise Swaps'));
    for (const swap of result.exerciseSwaps) {
      const swapRow = el('div', { class: 'swap-row' });
      swapRow.appendChild(
        el('span', { class: 'swap-from' }, getExerciseName(swap.from)),
      );
      swapRow.appendChild(el('span', { class: 'swap-arrow' }, '\u2192'));
      swapRow.appendChild(
        el('span', { class: 'swap-to' }, getExerciseName(swap.to)),
      );
      swapsSection.appendChild(swapRow);
      swapsSection.appendChild(
        el('div', { class: 'swap-reason' }, swap.reason),
      );
    }
    scoreCard.appendChild(swapsSection);
  }

  container.appendChild(scoreCard);

  // RED status: pumpers-only message
  if (result.status === 'RED') {
    container.appendChild(
      el('div', { class: 'card warning-card' },
        el('p', {}, 'Consider a pumpers-only session or taking a rest day. Your recovery is significantly compromised.'),
      ),
    );
  }

  // Continue button
  const continueBtn = el('button', { class: 'btn btn-primary btn-large' }, 'CONTINUE TO SESSION');
  continueBtn.addEventListener('click', () => {
    buildAndStartSession(result, pre);
  });
  container.appendChild(continueBtn);

  // Back button
  const backBtn = el('button', { class: 'btn btn-secondary' }, 'Back to Home');
  backBtn.addEventListener('click', () => {
    location.hash = '#/';
  });
  container.appendChild(backBtn);
}

// ---------------------------------------------------------------------------
// Build Session
// ---------------------------------------------------------------------------

function buildAndStartSession(result: ReadinessResult, pre: SessionPre): void {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const templateDayId = DAY_MAP[dayOfWeek];

  if (!templateDayId) {
    // Rest day — shouldn't normally get here, but handle gracefully
    location.hash = '#/';
    return;
  }

  const dayTemplate = getDayTemplate(templateDayId);
  if (!dayTemplate) {
    location.hash = '#/';
    return;
  }

  const dayLabel = DAY_LABELS[templateDayId] || templateDayId;

  // Build exercise swap map
  const swapMap = new Map<string, string>();
  for (const swap of result.exerciseSwaps) {
    swapMap.set(swap.from, swap.to);
  }

  // Build session exercises from template, applying swaps
  const exercises: SessionExercise[] = dayTemplate.exercises.map((ex, idx) => {
    const effectiveId = swapMap.get(ex.exerciseId) || ex.exerciseId;
    const targetSets = Math.max(
      1,
      Math.round(ex.sets * result.volumeModifier),
    );
    const effectiveRPE = result.rpeCapOverride
      ? Math.min(ex.targetRPE, result.rpeCapOverride)
      : ex.targetRPE;

    return {
      exerciseId: effectiveId,
      order: idx + 1,
      supersetGroup: null,
      targetSets,
      targetReps: ex.repRange,
      targetRIR: ex.targetRIR,
      targetRPE: effectiveRPE,
      prescribedWeight: null,
      prescribedWeightSource: null,
      tempo: null,
      restTargetSec: ex.restSec,
      sets: [],
      exerciseFeedback: null,
    };
  });

  const session: Session = {
    id: uuid(),
    programId: 'op-strength-v1',
    mesocycleId: 'meso-1',
    week: 1,
    dayId: templateDayId,
    dayLabel,
    date: todayStr(),
    dayOfWeek: WEEKDAY_NAMES[dayOfWeek],
    startTime: now.toISOString(),
    endTime: null,
    pre,
    readiness: result,
    exercises,
    post: null,
    computed: null,
  };

  setCurrentSession(session);
  setCurrentReadiness(result);

  location.hash = '#/session';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function wrapCard(content: HTMLElement): HTMLElement {
  const card = el('div', { class: 'card readiness-card' });
  card.appendChild(content);
  return card;
}
