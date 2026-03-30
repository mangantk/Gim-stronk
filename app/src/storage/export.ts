// =============================================================================
// Op Strength — JSON Data Export / Import
// Reads from and writes to IndexedDB via the db.ts storage layer.
// =============================================================================

import type { DataExport, Session, DailyNutrition } from '../types';
import {
  initDB,
  getAllSessions,
  saveSession,
  saveNutrition,
} from './db';

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Read all sessions and nutrition entries from IndexedDB, wrap them in a
 * `DataExport` envelope, and return a formatted JSON string suitable for
 * saving to a file or transferring to another device.
 */
export async function exportAllData(): Promise<string> {
  const db = await initDB();
  const sessions = await getAllSessions();
  const nutrition = await db.getAll('nutrition');

  // Derive date range from sessions (sorted by date string)
  let dateRange: { start: string; end: string } | null = null;
  if (sessions.length > 0) {
    const sorted = sessions
      .map((s) => s.date)
      .sort();
    dateRange = {
      start: sorted[0],
      end: sorted[sorted.length - 1],
    };
  }

  const exportData: DataExport = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    sessions,
    nutrition,
    metadata: {
      totalSessions: sessions.length,
      dateRange,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

/**
 * Parse a JSON string produced by `exportAllData`, validate its basic
 * structure, and write its sessions and nutrition entries into IndexedDB.
 *
 * Existing records with the same keys will be overwritten (put semantics).
 *
 * @returns Counts of successfully imported items.
 * @throws  If the JSON is malformed or the payload is structurally invalid.
 */
export async function importData(
  jsonString: string,
): Promise<{ sessions: number; nutrition: number }> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Import failed: invalid JSON');
  }

  // -- Structural validation ------------------------------------------------
  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    throw new Error('Import failed: expected a JSON object at the root');
  }

  const data = parsed as Record<string, unknown>;

  if (!data.version || typeof data.version !== 'string') {
    throw new Error('Import failed: missing or invalid "version" field');
  }

  if (!Array.isArray(data.sessions)) {
    throw new Error('Import failed: "sessions" must be an array');
  }

  if (!Array.isArray(data.nutrition)) {
    throw new Error('Import failed: "nutrition" must be an array');
  }

  const sessions = data.sessions as Session[];
  const nutrition = data.nutrition as DailyNutrition[];

  // -- Validate individual records have required keys -----------------------
  for (const session of sessions) {
    if (!session.id || typeof session.id !== 'string') {
      throw new Error(
        'Import failed: each session must have a string "id" field',
      );
    }
    if (!session.date || typeof session.date !== 'string') {
      throw new Error(
        'Import failed: each session must have a string "date" field',
      );
    }
  }

  for (const entry of nutrition) {
    if (!entry.date || typeof entry.date !== 'string') {
      throw new Error(
        'Import failed: each nutrition entry must have a string "date" field',
      );
    }
  }

  // -- Write to IndexedDB ---------------------------------------------------
  let sessionCount = 0;
  let nutritionCount = 0;

  for (const session of sessions) {
    await saveSession(session);
    sessionCount++;
  }

  for (const entry of nutrition) {
    await saveNutrition(entry);
    nutritionCount++;
  }

  return { sessions: sessionCount, nutrition: nutritionCount };
}
