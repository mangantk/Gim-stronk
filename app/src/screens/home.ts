// =============================================================================
// Op Strength — Home Screen
// Landing page showing today's training day and session preview.
// =============================================================================

import { el, clear, todayStr } from '../components/dom';
import { DAY_MAP, DAY_LABELS } from '../data/constants';
import { getDayTemplate } from '../data/template';
import { getExerciseName } from '../data/exercises';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Render the home screen into the given container.
 */
export function renderHome(container: HTMLElement): void {
  clear(container);

  const screen = el('div', { class: 'screen home-screen' });

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const dayName = WEEKDAY_NAMES[dayOfWeek];
  const dateStr = todayStr();

  // Header
  const header = el('div', { class: 'home-header' });
  const appTitle = el('h1', { class: 'app-title' }, 'Op Strength');
  const dateDisplay = el('div', { class: 'home-date' }, dateStr);
  header.appendChild(appTitle);
  header.appendChild(dateDisplay);
  screen.appendChild(header);

  // Check if it's a training day (Mon-Fri = 1-5)
  const templateDayId = DAY_MAP[dayOfWeek];
  const isRestDay = !templateDayId;

  if (isRestDay) {
    // Rest day display
    const restCard = el('div', { class: 'card rest-day-card' });
    restCard.appendChild(el('div', { class: 'rest-day-icon' }, '🛌'));
    restCard.appendChild(el('h2', { class: 'rest-day-title' }, `${dayName} - Rest Day`));
    restCard.appendChild(
      el('p', { class: 'rest-day-message' },
        'Recovery is when gains are made. Stay active, eat well, and come back stronger.',
      ),
    );
    screen.appendChild(restCard);
  } else {
    // Training day display
    const dayLabel = DAY_LABELS[templateDayId] || templateDayId;
    const dayTemplate = getDayTemplate(templateDayId);

    const dayCard = el('div', { class: 'card day-card' });
    dayCard.appendChild(
      el('h2', { class: 'day-title' }, `${dayName} \u2014 ${dayLabel}`),
    );

    if (dayTemplate) {
      const exerciseList = el('div', { class: 'exercise-preview-list' });

      for (const ex of dayTemplate.exercises) {
        const row = el('div', { class: 'exercise-preview-row' });
        const name = el('span', { class: 'exercise-preview-name' }, getExerciseName(ex.exerciseId));
        const detail = el(
          'span',
          { class: 'exercise-preview-detail' },
          `${ex.sets} x ${ex.repRange} @ RPE ${ex.targetRPE}`,
        );
        row.appendChild(name);
        row.appendChild(detail);
        exerciseList.appendChild(row);
      }

      dayCard.appendChild(exerciseList);
    }

    screen.appendChild(dayCard);

    // Start Session Button
    const startBtn = el('button', { class: 'btn btn-primary btn-large start-session-btn' }, 'START SESSION');
    startBtn.addEventListener('click', () => {
      location.hash = '#/readiness';
    });
    screen.appendChild(startBtn);
  }

  // Bottom navigation links
  const nav = el('div', { class: 'home-nav' });

  const nutritionLink = el('a', { class: 'nav-link', href: '#/nutrition' });
  nutritionLink.appendChild(el('span', { class: 'nav-icon' }, '\uD83C\uDF4E'));
  nutritionLink.appendChild(el('span', { class: 'nav-text' }, 'Nutrition'));
  nav.appendChild(nutritionLink);

  const exportLink = el('a', { class: 'nav-link', href: '#/export' });
  exportLink.appendChild(el('span', { class: 'nav-icon' }, '\uD83D\uDCBE'));
  exportLink.appendChild(el('span', { class: 'nav-text' }, 'Export / Import'));
  nav.appendChild(exportLink);

  screen.appendChild(nav);
  container.appendChild(screen);
}
