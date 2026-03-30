// =============================================================================
// Op Strength — Main Entry Point
// Hash-based router, IndexedDB initialization, screen rendering.
// =============================================================================

import { initDB } from './storage/db';
import { renderHome } from './screens/home';
import { renderReadiness } from './screens/readiness';
import { renderSession } from './screens/session';
import { renderFeedback } from './screens/feedback';
import { renderNutrition } from './screens/nutrition';
import { renderExport } from './screens/export';

// ---------------------------------------------------------------------------
// Route Table
// ---------------------------------------------------------------------------

const routes: Record<string, (container: HTMLElement) => void> = {
  '': renderHome,
  'readiness': renderReadiness,
  'session': renderSession,
  'feedback': renderFeedback,
  'nutrition': renderNutrition,
  'export': renderExport,
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function navigate(): void {
  const hash = location.hash.slice(2) || ''; // strip "#/"
  const route = routes[hash];
  const app = document.getElementById('app');

  if (!app) {
    console.error('App container #app not found');
    return;
  }

  if (route) {
    route(app);
  } else {
    // Unknown route — redirect to home
    location.hash = '#/';
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  try {
    // Initialize IndexedDB
    await initDB();
    console.log('Op Strength: IndexedDB initialized');
  } catch (err) {
    console.error('Op Strength: Failed to initialize IndexedDB', err);
  }

  // Set up hash-based routing
  window.addEventListener('hashchange', navigate);

  // Initial navigation
  navigate();
}

// Start the app
init();
