// =============================================================================
// Op Strength — IndexedDB Storage Layer
// Uses the `idb` library for a Promise-based IndexedDB wrapper.
// Database: 'op-strength', version 1
// =============================================================================

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Session, ExerciseSet, DailyNutrition } from '../types';

// ---------------------------------------------------------------------------
// Schema definition — gives idb full type-safety on stores & indexes
// ---------------------------------------------------------------------------

interface OpStrengthDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: {
      date: string;
      dayId: string;
      mesocycleId: string;
      'mesocycleId+week': [string, number];
    };
  };
  nutrition: {
    key: string;
    value: DailyNutrition;
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

// ---------------------------------------------------------------------------
// Singleton DB instance
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<OpStrengthDB>> | null = null;

/**
 * Initialise (or return the existing) IndexedDB database.
 * Safe to call multiple times — only the first call triggers the open.
 */
export function initDB(): Promise<IDBPDatabase<OpStrengthDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OpStrengthDB>('op-strength', 1, {
      upgrade(db) {
        // --- sessions store ---
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('date', 'date', { unique: false });
        sessionStore.createIndex('dayId', 'dayId', { unique: false });
        sessionStore.createIndex('mesocycleId', 'mesocycleId', { unique: false });
        sessionStore.createIndex('mesocycleId+week', ['mesocycleId', 'week'], {
          unique: false,
        });

        // --- nutrition store (keyed by YYYY-MM-DD date string) ---
        db.createObjectStore('nutrition', { keyPath: 'date' });

        // --- settings store (key-value pairs) ---
        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/** Persist a session (insert or update). */
export async function saveSession(session: Session): Promise<void> {
  const db = await initDB();
  await db.put('sessions', session);
}

/** Retrieve a single session by its UUID. */
export async function getSession(id: string): Promise<Session | undefined> {
  const db = await initDB();
  return db.get('sessions', id);
}

/** Get all sessions that occurred on a given date (YYYY-MM-DD). */
export async function getSessionsByDate(date: string): Promise<Session[]> {
  const db = await initDB();
  return db.getAllFromIndex('sessions', 'date', date);
}

/**
 * Get every session for a specific week within a mesocycle.
 * Uses the compound index [mesocycleId, week].
 */
export async function getSessionsForWeek(
  mesocycleId: string,
  week: number,
): Promise<Session[]> {
  const db = await initDB();
  return db.getAllFromIndex('sessions', 'mesocycleId+week', [mesocycleId, week]);
}

/** Return every session in the database. */
export async function getAllSessions(): Promise<Session[]> {
  const db = await initDB();
  return db.getAll('sessions');
}

/**
 * Find the most recent session that contains the given exercise and return
 * its working sets.  Searches sessions in reverse-chronological order by
 * date so we can bail out early once found.
 *
 * Returns `null` if no prior session includes this exercise.
 */
export async function getLastSessionForExercise(
  exerciseId: string,
): Promise<ExerciseSet[] | null> {
  const db = await initDB();

  // Open a cursor on the date index in reverse (newest first)
  const tx = db.transaction('sessions', 'readonly');
  const index = tx.store.index('date');
  let cursor = await index.openCursor(null, 'prev');

  while (cursor) {
    const session = cursor.value;
    for (const exercise of session.exercises) {
      if (exercise.exerciseId === exerciseId) {
        // Return only working sets (exclude warm-ups)
        return exercise.sets;
      }
    }
    cursor = await cursor.continue();
  }

  return null;
}

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------

/** Persist a daily nutrition entry (insert or update, keyed by date). */
export async function saveNutrition(entry: DailyNutrition): Promise<void> {
  const db = await initDB();
  await db.put('nutrition', entry);
}

/** Retrieve nutrition data for a single date. */
export async function getNutrition(
  date: string,
): Promise<DailyNutrition | undefined> {
  const db = await initDB();
  return db.get('nutrition', date);
}

/**
 * Retrieve all nutrition entries whose date falls within [startDate, endDate]
 * (inclusive).  Uses an IDBKeyRange on the date keypath.
 */
export async function getNutritionRange(
  startDate: string,
  endDate: string,
): Promise<DailyNutrition[]> {
  const db = await initDB();
  const range = IDBKeyRange.bound(startDate, endDate);
  return db.getAll('nutrition', range);
}

// ---------------------------------------------------------------------------
// Settings (generic key-value store)
// ---------------------------------------------------------------------------

/** Save an arbitrary value under a string key. */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await initDB();
  await db.put('settings', { key, value });
}

/** Retrieve a setting value by key, typed via the generic parameter. */
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const db = await initDB();
  const entry = await db.get('settings', key);
  return entry?.value as T | undefined;
}
