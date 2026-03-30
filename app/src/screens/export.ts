// =============================================================================
// Op Strength — Export / Import Screen
// JSON data export and import functionality.
// =============================================================================

import { el, clear } from '../components/dom';
import { exportAllData, importData } from '../storage/export';
import { getAllSessions, initDB } from '../storage/db';
import type { DailyNutrition } from '../types';

/**
 * Helper to get all nutrition entries (db.ts doesn't export this directly).
 */
async function getAllNutrition(): Promise<DailyNutrition[]> {
  const db = await initDB();
  return db.getAll('nutrition');
}

/**
 * Render the export/import screen.
 */
export function renderExport(container: HTMLElement): void {
  clear(container);

  const screen = el('div', { class: 'screen export-screen' });

  // Header
  screen.appendChild(el('h2', { class: 'screen-title' }, 'Export / Import'));

  // Back link
  const backBtn = el('button', { class: 'btn btn-secondary btn-small' }, '\u2190 Home');
  backBtn.addEventListener('click', () => { location.hash = '#/'; });
  screen.appendChild(backBtn);

  // Stats card
  const statsCard = el('div', { class: 'card export-stats-card' });
  statsCard.appendChild(el('h3', {}, 'Database Stats'));
  const statsContent = el('div', { class: 'stats-content' }, 'Loading...');
  statsCard.appendChild(statsContent);
  screen.appendChild(statsCard);

  // Load stats
  loadStats(statsContent);

  // Export section
  const exportCard = el('div', { class: 'card export-card' });
  exportCard.appendChild(el('h3', {}, 'Export Data'));
  exportCard.appendChild(
    el('p', { class: 'card-description' },
      'Download all your sessions and nutrition data as a JSON file.',
    ),
  );

  const exportBtn = el('button', { class: 'btn btn-primary' }, 'Export All Data');
  const exportStatus = el('div', { class: 'export-status' });

  exportBtn.addEventListener('click', async () => {
    try {
      exportBtn.setAttribute('disabled', 'true');
      exportBtn.textContent = 'Exporting...';

      const jsonStr = await exportAllData();

      // Trigger download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `op-strength-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showExportStatus(exportStatus, 'Export complete! File downloaded.', 'success');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      showExportStatus(exportStatus, `Export failed: ${errMsg}`, 'error');
    } finally {
      exportBtn.removeAttribute('disabled');
      exportBtn.textContent = 'Export All Data';
    }
  });

  exportCard.appendChild(exportBtn);
  exportCard.appendChild(exportStatus);
  screen.appendChild(exportCard);

  // Import section
  const importCard = el('div', { class: 'card import-card' });
  importCard.appendChild(el('h3', {}, 'Import Data'));
  importCard.appendChild(
    el('p', { class: 'card-description' },
      'Import data from a previously exported JSON file. Existing records with the same keys will be overwritten.',
    ),
  );

  const fileInput = el('input', {
    type: 'file',
    accept: '.json,application/json',
    class: 'file-input',
    id: 'import-file',
  }) as HTMLInputElement;

  const fileLabel = el('label', {
    class: 'btn btn-primary file-label',
    for: 'import-file',
  }, 'Choose File to Import');

  const importStatus = el('div', { class: 'import-status' });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importData(text);

      showExportStatus(
        importStatus,
        `Import complete! ${result.sessions} sessions, ${result.nutrition} nutrition entries imported.`,
        'success',
      );

      // Refresh stats
      loadStats(statsContent);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      showExportStatus(importStatus, `Import failed: ${errMsg}`, 'error');
    }

    // Reset file input
    fileInput.value = '';
  });

  importCard.appendChild(fileInput);
  importCard.appendChild(fileLabel);
  importCard.appendChild(importStatus);
  screen.appendChild(importCard);

  container.appendChild(screen);
}

// ---------------------------------------------------------------------------
// Stats Loader
// ---------------------------------------------------------------------------

async function loadStats(container: HTMLElement): Promise<void> {
  try {
    const sessions = await getAllSessions();
    const nutrition = await getAllNutrition();

    clear(container);

    const rows: Array<[string, string]> = [
      ['Total Sessions', String(sessions.length)],
      ['Total Nutrition Entries', String(nutrition.length)],
    ];

    if (sessions.length > 0) {
      const dates = sessions.map((s) => s.date).sort();
      rows.push(['Earliest Session', dates[0]]);
      rows.push(['Latest Session', dates[dates.length - 1]]);
    }

    if (nutrition.length > 0) {
      const dates = nutrition.map((n) => n.date).sort();
      rows.push(['Earliest Nutrition', dates[0]]);
      rows.push(['Latest Nutrition', dates[dates.length - 1]]);
    }

    for (const [label, value] of rows) {
      const row = el('div', { class: 'stat-row' });
      row.appendChild(el('span', { class: 'stat-label' }, label));
      row.appendChild(el('span', { class: 'stat-value' }, value));
      container.appendChild(row);
    }

    if (sessions.length === 0 && nutrition.length === 0) {
      container.appendChild(
        el('p', { class: 'empty-message' }, 'No data yet. Complete a session or log nutrition to get started.'),
      );
    }
  } catch {
    clear(container);
    container.appendChild(
      el('p', { class: 'error-message' }, 'Failed to load stats.'),
    );
  }
}

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------

function showExportStatus(container: HTMLElement, message: string, type: 'success' | 'error'): void {
  clear(container);
  container.appendChild(
    el('div', { class: `status-message status-${type}` }, message),
  );
}
