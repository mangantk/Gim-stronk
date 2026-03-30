// =============================================================================
// Op Strength — Feedback Screen
// Post-session muscle feedback and session rating.
// =============================================================================

import { el, clear, scaleSelector } from '../components/dom';
import { getExercise } from '../data/exercises';
import { currentSession, setCurrentSession } from '../state';
import { saveSession } from '../storage/db';
import type { MuscleGroup, MuscleFeedback, SessionPost } from '../types';

/**
 * Human-readable labels for muscle groups.
 */
const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  side_delts: 'Side Delts',
  rear_delts: 'Rear Delts',
  front_delts: 'Front Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  calves: 'Calves',
  abs: 'Abs',
};

/**
 * Render the post-session feedback screen.
 */
export function renderFeedback(container: HTMLElement): void {
  clear(container);

  const screen = el('div', { class: 'screen feedback-screen' });

  if (!currentSession) {
    screen.appendChild(el('h2', { class: 'screen-title' }, 'No Active Session'));
    screen.appendChild(el('p', {}, 'No session data found. Please complete a session first.'));
    const homeBtn = el('button', { class: 'btn btn-primary' }, 'Go Home');
    homeBtn.addEventListener('click', () => { location.hash = '#/'; });
    screen.appendChild(homeBtn);
    container.appendChild(screen);
    return;
  }

  // Header
  screen.appendChild(el('h2', { class: 'screen-title' }, 'Session Feedback'));
  screen.appendChild(
    el('p', { class: 'screen-subtitle' }, 'Rate how each muscle responded to the session.'),
  );

  // Determine which muscles were trained
  const trainedMuscles = getTrainedMuscles();

  // Muscle feedback state
  const muscleFeedbackData: Record<string, MuscleFeedback> = {};

  // Initialize all muscle groups with defaults
  const allMuscles: MuscleGroup[] = [
    'quads', 'hamstrings', 'glutes', 'chest', 'back',
    'shoulders', 'side_delts', 'rear_delts', 'front_delts',
    'biceps', 'triceps', 'calves', 'abs',
  ];
  for (const m of allMuscles) {
    muscleFeedbackData[m] = {
      pump: 0,
      soreness: 0,
      jointPain: 0,
      performance: 0,
    };
  }

  // Muscle feedback grid
  const grid = el('div', { class: 'muscle-feedback-grid' });

  for (const muscle of trainedMuscles) {
    const card = el('div', { class: 'card muscle-feedback-card' });
    card.appendChild(
      el('h3', { class: 'muscle-name' }, MUSCLE_LABELS[muscle] || muscle),
    );

    card.appendChild(
      scaleSelector('Pump', 1, 5, (v) => {
        muscleFeedbackData[muscle].pump = v;
      }),
    );

    card.appendChild(
      scaleSelector('Soreness', 1, 5, (v) => {
        muscleFeedbackData[muscle].soreness = v;
      }),
    );

    card.appendChild(
      scaleSelector('Performance', 1, 5, (v) => {
        muscleFeedbackData[muscle].performance = v;
      }),
    );

    grid.appendChild(card);
  }

  screen.appendChild(grid);

  // Session-level feedback
  const sessionCard = el('div', { class: 'card session-feedback-card' });
  sessionCard.appendChild(el('h3', {}, 'Overall Session'));

  let overallFatigue = 3;
  let sessionRating = 3;

  sessionCard.appendChild(
    scaleSelector('Overall Fatigue', 1, 5, (v) => { overallFatigue = v; }, 3),
  );

  sessionCard.appendChild(
    scaleSelector('Session Rating', 1, 5, (v) => { sessionRating = v; }, 3),
  );

  // Notes textarea
  const notesLabel = el('label', { class: 'input-label' }, 'Session Notes');
  sessionCard.appendChild(notesLabel);
  const notesInput = el('textarea', {
    class: 'input-field textarea-field',
    placeholder: 'Any observations, form cues, issues...',
    rows: '3',
  }) as HTMLTextAreaElement;
  sessionCard.appendChild(notesInput);

  screen.appendChild(sessionCard);

  // Submit button
  const submitBtn = el('button', { class: 'btn btn-primary btn-large' }, 'SAVE SESSION');
  submitBtn.addEventListener('click', async () => {
    const post: SessionPost = {
      muscleFeedback: muscleFeedbackData as Record<MuscleGroup, MuscleFeedback>,
      overallFatigue,
      sessionRating,
      notes: notesInput.value.trim(),
    };

    currentSession!.post = post;
    currentSession!.endTime = currentSession!.endTime || new Date().toISOString();

    // Save to IndexedDB
    try {
      await saveSession(currentSession!);
      showConfirmation(screen);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      screen.appendChild(
        el('div', { class: 'error-message' }, `Save failed: ${errMsg}`),
      );
    }
  });
  screen.appendChild(submitBtn);

  container.appendChild(screen);
}

// ---------------------------------------------------------------------------
// Confirmation
// ---------------------------------------------------------------------------

function showConfirmation(screen: HTMLElement): void {
  clear(screen);

  const confirmation = el('div', { class: 'session-complete' });
  confirmation.appendChild(
    el('div', { class: 'complete-icon' }, '\u2714'),
  );
  confirmation.appendChild(
    el('h2', { class: 'complete-title' }, 'Session Saved!'),
  );

  // Session summary
  if (currentSession) {
    const summary = el('div', { class: 'session-summary' });
    const totalSets = currentSession.exercises.reduce(
      (sum, ex) => sum + ex.sets.length,
      0,
    );
    const totalVolLoad = currentSession.exercises.reduce((sum, ex) => {
      return sum + ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
    }, 0);

    summary.appendChild(
      el('div', { class: 'summary-row' },
        el('span', {}, 'Total Sets:'),
        el('span', { class: 'summary-value' }, String(totalSets)),
      ),
    );
    summary.appendChild(
      el('div', { class: 'summary-row' },
        el('span', {}, 'Total Volume Load:'),
        el('span', { class: 'summary-value' }, `${Math.round(totalVolLoad).toLocaleString()} lbs`),
      ),
    );
    summary.appendChild(
      el('div', { class: 'summary-row' },
        el('span', {}, 'Exercises:'),
        el('span', { class: 'summary-value' }, String(currentSession.exercises.length)),
      ),
    );

    confirmation.appendChild(summary);
  }

  // Clear session state
  setCurrentSession(null);

  const homeBtn = el('button', { class: 'btn btn-primary btn-large' }, 'Back to Home');
  homeBtn.addEventListener('click', () => {
    location.hash = '#/';
  });
  confirmation.appendChild(homeBtn);

  screen.appendChild(confirmation);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine which muscles were trained in the current session
 * by looking at each exercise's primaryMuscle + secondaryMuscles
 * (only including muscles with fractionalCoeff > 0).
 */
function getTrainedMuscles(): MuscleGroup[] {
  if (!currentSession) return [];

  const muscleSet = new Set<MuscleGroup>();

  for (const sessionEx of currentSession.exercises) {
    const exercise = getExercise(sessionEx.exerciseId);
    if (!exercise) continue;

    // Add primary muscle
    muscleSet.add(exercise.primaryMuscle);

    // Add secondary muscles with positive fractional coefficients
    for (const muscle of exercise.secondaryMuscles) {
      const coeff = exercise.fractionalCoeff[muscle];
      if (coeff !== undefined && coeff > 0) {
        muscleSet.add(muscle);
      }
    }

    // Also check fractionalCoeff keys directly (may include muscles
    // not listed in secondaryMuscles but with positive coefficients)
    for (const [muscle, coeff] of Object.entries(exercise.fractionalCoeff)) {
      if (coeff !== undefined && coeff > 0) {
        muscleSet.add(muscle as MuscleGroup);
      }
    }
  }

  return Array.from(muscleSet);
}
