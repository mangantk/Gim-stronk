// =============================================================================
// Op Strength — Rest Timer Component
// Countdown timer with vibration alert on completion.
// =============================================================================

import { el, clear } from './dom';

/**
 * Start a rest timer countdown inside the given container.
 * Returns a control object with a stop() method.
 */
export function startRestTimer(
  container: HTMLElement,
  durationSec: number,
  onComplete: () => void,
): { stop: () => void } {
  clear(container);

  let remaining = durationSec;
  let stopped = false;

  const overlay = el('div', { class: 'timer-overlay' });

  const label = el('div', { class: 'timer-label' }, 'REST');
  const display = el('div', { class: 'timer-display' }, formatTime(remaining));
  const hint = el('div', { class: 'timer-hint' }, 'Tap to dismiss');

  overlay.appendChild(label);
  overlay.appendChild(display);
  overlay.appendChild(hint);
  container.appendChild(overlay);

  // Tap to dismiss
  overlay.addEventListener('click', () => {
    stop();
    onComplete();
  });

  // Countdown interval
  const intervalId = setInterval(() => {
    if (stopped) return;

    remaining--;
    display.textContent = formatTime(remaining);

    if (remaining <= 0) {
      clearInterval(intervalId);
      // Vibrate on completion
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      display.textContent = '00:00';
      display.classList.add('timer-done');
      label.textContent = 'DONE';

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        if (!stopped) {
          stop();
          onComplete();
        }
      }, 3000);
    }
  }, 1000);

  function stop() {
    if (stopped) return;
    stopped = true;
    clearInterval(intervalId);
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  return { stop };
}

/**
 * Format seconds as mm:ss.
 */
function formatTime(totalSec: number): string {
  const sec = Math.max(0, totalSec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
