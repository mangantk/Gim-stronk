// =============================================================================
// Op Strength — Session Screen
// The main gym workout screen. Displays exercises and logs sets.
// =============================================================================

import { el, clear, scaleSelector } from '../components/dom';
import { startRestTimer } from '../components/timer';
import { renderSetLogger } from './set-logger';
import { getExerciseName, getExercise } from '../data/exercises';
import { currentSession, setCurrentSession } from '../state';
import type { SessionExercise, ExerciseSet } from '../types';

// Module-level state for tracking progress within the session
let currentExerciseIndex = 0;
let timerControl: { stop: () => void } | null = null;

/**
 * Render the session screen.
 * Reads the current session from state (set by the readiness screen).
 */
export function renderSession(container: HTMLElement): void {
  clear(container);
  currentExerciseIndex = 0;

  if (!currentSession) {
    const screen = el('div', { class: 'screen session-screen' });
    screen.appendChild(el('h2', { class: 'screen-title' }, 'No Active Session'));
    screen.appendChild(
      el('p', {}, 'Please start a session from the home screen.'),
    );
    const homeBtn = el('button', { class: 'btn btn-primary' }, 'Go Home');
    homeBtn.addEventListener('click', () => { location.hash = '#/'; });
    screen.appendChild(homeBtn);
    container.appendChild(screen);
    return;
  }

  renderSessionContent(container);
}

// ---------------------------------------------------------------------------
// Main Session Renderer
// ---------------------------------------------------------------------------

function renderSessionContent(container: HTMLElement): void {
  clear(container);

  const session = currentSession!;
  const screen = el('div', { class: 'screen session-screen' });

  // Header
  const header = el('div', { class: 'session-header' });
  header.appendChild(
    el('h2', { class: 'screen-title' }, `${session.dayLabel} Session`),
  );

  // Progress indicator
  const totalExercises = session.exercises.length;
  const completedExercises = session.exercises.filter(
    (ex) => ex.sets.length >= ex.targetSets,
  ).length;
  header.appendChild(
    el('div', { class: 'session-progress' },
      `Exercise ${Math.min(currentExerciseIndex + 1, totalExercises)} of ${totalExercises}`,
    ),
  );
  screen.appendChild(header);

  // Readiness badge
  const readiness = session.readiness;
  const statusClass = `status-${readiness.status.toLowerCase()}`;
  const readinessBar = el('div', { class: 'session-readiness-bar' });
  readinessBar.appendChild(
    el('span', { class: `status-badge ${statusClass}` }, readiness.status),
  );
  readinessBar.appendChild(
    el('span', { class: 'readiness-score-small' }, `Score: ${readiness.score}`),
  );
  screen.appendChild(readinessBar);

  // Exercise list
  const exerciseList = el('div', { class: 'session-exercise-list' });

  session.exercises.forEach((sessionEx, idx) => {
    const card = renderExerciseCard(container, sessionEx, idx);
    exerciseList.appendChild(card);
  });

  screen.appendChild(exerciseList);

  // Check if all exercises are complete
  const allDone = completedExercises === totalExercises;

  if (allDone) {
    const finishBtn = el('button', { class: 'btn btn-primary btn-large finish-btn' }, 'FINISH SESSION');
    finishBtn.addEventListener('click', () => {
      if (currentSession) {
        currentSession.endTime = new Date().toISOString();
        setCurrentSession(currentSession);
      }
      location.hash = '#/feedback';
    });
    screen.appendChild(finishBtn);
  }

  // Timer container
  const timerContainer = el('div', { class: 'timer-container' });
  screen.appendChild(timerContainer);

  container.appendChild(screen);
}

// ---------------------------------------------------------------------------
// Exercise Card
// ---------------------------------------------------------------------------

function renderExerciseCard(
  pageContainer: HTMLElement,
  sessionEx: SessionExercise,
  index: number,
): HTMLElement {
  const exercise = getExercise(sessionEx.exerciseId);
  const isActive = index === currentExerciseIndex;
  const isComplete = sessionEx.sets.length >= sessionEx.targetSets;
  const needsFeedback = isComplete && !sessionEx.exerciseFeedback;

  const card = el('div', {
    class: `card exercise-card ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`,
  });

  // Exercise header row
  const headerRow = el('div', { class: 'exercise-card-header' });
  headerRow.appendChild(
    el('span', { class: 'exercise-name' }, getExerciseName(sessionEx.exerciseId)),
  );

  // Recovery category badge
  if (exercise) {
    const recoveryCat = exercise.recoveryCategory;
    const catLabel = recoveryCat === 'stretcher' ? 'S' : recoveryCat === 'activator' ? 'A' : 'P';
    const catClass = `recovery-badge recovery-${recoveryCat}`;
    headerRow.appendChild(el('span', { class: catClass }, catLabel));
  }

  card.appendChild(headerRow);

  // Target info
  const targetInfo = el('div', { class: 'exercise-target' },
    `${sessionEx.targetSets} x ${sessionEx.targetReps} @ RPE ${sessionEx.targetRPE}`,
  );
  card.appendChild(targetInfo);

  // Set indicator dots
  const dotsRow = el('div', { class: 'set-dots' });
  for (let i = 0; i < sessionEx.targetSets; i++) {
    const dot = el('div', {
      class: `set-dot ${i < sessionEx.sets.length ? 'filled' : 'empty'}`,
    });
    dotsRow.appendChild(dot);
  }
  card.appendChild(dotsRow);

  // Logged sets summary
  if (sessionEx.sets.length > 0) {
    const setsLog = el('div', { class: 'sets-log' });
    for (const set of sessionEx.sets) {
      const setRow = el('div', { class: 'set-row' });
      setRow.appendChild(
        el('span', { class: 'set-detail' },
          `Set ${set.setNumber}: ${set.weight} lbs x ${set.reps} @ RPE ${set.rpe}`,
        ),
      );
      setRow.appendChild(
        el('span', { class: 'set-e1rm' }, `e1RM: ${set.e1rm}`),
      );
      setsLog.appendChild(setRow);
    }
    card.appendChild(setsLog);
  }

  // Joint pain feedback (after all sets done, before moving on)
  if (needsFeedback && isActive) {
    const feedbackSection = el('div', { class: 'joint-pain-prompt' });
    feedbackSection.appendChild(
      el('div', { class: 'joint-pain-label' }, 'Joint Pain for this exercise?'),
    );
    const painSelector = scaleSelector(
      '',
      1,
      5,
      (v) => {
        sessionEx.exerciseFeedback = {
          jointPain: v,
          pumpQuality: 0,
          formRating: 0,
          notes: '',
        };
        // Move to next exercise after selection
        currentExerciseIndex = Math.min(
          currentExerciseIndex + 1,
          currentSession!.exercises.length - 1,
        );
        renderSessionContent(pageContainer);
      },
      undefined,
      ['None', 'Mild', 'Moderate', 'Notable', 'Severe'],
    );
    feedbackSection.appendChild(painSelector);
    card.appendChild(feedbackSection);
  }

  // Log Set button (only for active, incomplete exercise)
  if (isActive && !isComplete) {
    const logArea = el('div', { class: 'set-logger-area' });

    const logBtn = el('button', { class: 'btn btn-primary log-set-btn' }, 'LOG SET');
    logBtn.addEventListener('click', () => {
      // Determine pre-fill weight: previous set's weight or prescribed
      const prevSet = sessionEx.sets.length > 0
        ? sessionEx.sets[sessionEx.sets.length - 1]
        : null;
      const prefillWeight = prevSet ? prevSet.weight : sessionEx.prescribedWeight;
      const nextSetNum = sessionEx.sets.length + 1;

      logBtn.style.display = 'none';

      renderSetLogger(
        logArea,
        sessionEx.exerciseId,
        nextSetNum,
        prefillWeight,
        sessionEx.targetReps,
        sessionEx.targetRPE,
        (set: ExerciseSet) => {
          onSetSaved(pageContainer, sessionEx, set);
        },
      );
    });

    logArea.appendChild(logBtn);
    card.appendChild(logArea);
  }

  // If complete and not active, show check mark
  if (isComplete && !isActive) {
    card.appendChild(el('div', { class: 'exercise-complete-mark' }, 'Done'));
  }

  return card;
}

// ---------------------------------------------------------------------------
// Set Saved Handler
// ---------------------------------------------------------------------------

function onSetSaved(
  pageContainer: HTMLElement,
  sessionEx: SessionExercise,
  set: ExerciseSet,
): void {
  // Add set to the exercise
  sessionEx.sets.push(set);

  // Update session state
  setCurrentSession(currentSession);

  const isExerciseComplete = sessionEx.sets.length >= sessionEx.targetSets;

  if (isExerciseComplete) {
    // Re-render to show joint pain prompt
    renderSessionContent(pageContainer);
  } else {
    // Start rest timer, then re-render
    const timerContainer = pageContainer.querySelector('.timer-container') as HTMLElement;
    if (timerContainer) {
      if (timerControl) {
        timerControl.stop();
      }
      timerControl = startRestTimer(timerContainer, sessionEx.restTargetSec, () => {
        timerControl = null;
        renderSessionContent(pageContainer);
      });
    } else {
      renderSessionContent(pageContainer);
    }
  }
}
