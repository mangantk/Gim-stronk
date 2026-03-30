// =============================================================================
// Op Strength — Nutrition Screen
// Daily nutrition entry and compliance tracking.
// =============================================================================

import { el, clear, todayStr } from '../components/dom';
import { NUTRITION_TARGETS } from '../data/constants';
import { saveNutrition, getNutrition } from '../storage/db';
import type { DailyNutrition, NutritionTargets } from '../types';

/**
 * Render the nutrition entry screen.
 */
export function renderNutrition(container: HTMLElement): void {
  clear(container);

  const screen = el('div', { class: 'screen nutrition-screen' });

  // Header
  screen.appendChild(el('h2', { class: 'screen-title' }, 'Nutrition'));

  // Back link
  const backBtn = el('button', { class: 'btn btn-secondary btn-small' }, '\u2190 Home');
  backBtn.addEventListener('click', () => { location.hash = '#/'; });
  screen.appendChild(backBtn);

  // Date input
  const dateCard = el('div', { class: 'card nutrition-card' });
  dateCard.appendChild(el('label', { class: 'input-label' }, 'Date'));
  const dateInput = el('input', {
    type: 'date',
    class: 'input-field',
    value: todayStr(),
  }) as HTMLInputElement;
  dateCard.appendChild(dateInput);

  // Load existing data when date changes
  dateInput.addEventListener('change', async () => {
    await loadExistingData(dateInput.value);
  });

  screen.appendChild(dateCard);

  // Determine targets based on day of week
  function getTargets(dateStr: string): NutritionTargets {
    const d = new Date(dateStr + 'T12:00:00'); // noon to avoid TZ edge cases
    const dow = d.getDay(); // 0=Sun, 6=Sat
    const isTrainingDay = dow >= 1 && dow <= 5;
    return isTrainingDay ? NUTRITION_TARGETS.trainingDay : NUTRITION_TARGETS.restDay;
  }

  let currentTargets = getTargets(dateInput.value);

  // Input fields state
  let bodyweight: number | null = null;
  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;

  // Compliance display
  const complianceDisplay = el('div', { class: 'compliance-display' });

  function updateCompliance() {
    clear(complianceDisplay);
    const targets = getTargets(dateInput.value);
    currentTargets = targets;

    const calPct = targets.calories > 0 ? Math.round((calories / targets.calories) * 100) : 0;
    const proPct = targets.protein > 0 ? Math.round((protein / targets.protein) * 100) : 0;
    const fatPct = targets.fat > 0 ? Math.round((fat / targets.fat) * 100) : 0;
    const carbPct = targets.carbs > 0 ? Math.round((carbs / targets.carbs) * 100) : 0;

    complianceDisplay.appendChild(
      complianceRow('Calories', calories, targets.calories, calPct, 'kcal'),
    );
    complianceDisplay.appendChild(
      complianceRow('Protein', protein, targets.protein, proPct, 'g'),
    );
    complianceDisplay.appendChild(
      complianceRow('Fat', fat, targets.fat, fatPct, 'g'),
    );
    complianceDisplay.appendChild(
      complianceRow('Carbs', carbs, targets.carbs, carbPct, 'g'),
    );
  }

  // Input fields
  const fieldsCard = el('div', { class: 'card nutrition-card' });

  // Bodyweight
  fieldsCard.appendChild(el('label', { class: 'input-label' }, 'Morning Bodyweight (lbs)'));
  const bwInput = el('input', {
    type: 'number',
    class: 'input-field',
    placeholder: 'e.g. 185',
    step: '0.1',
  }) as HTMLInputElement;
  bwInput.addEventListener('input', () => {
    const v = parseFloat(bwInput.value);
    bodyweight = isNaN(v) ? null : v;
  });
  fieldsCard.appendChild(bwInput);

  // Calories
  fieldsCard.appendChild(el('label', { class: 'input-label' }, 'Calories'));
  const calInput = el('input', {
    type: 'number',
    class: 'input-field',
    placeholder: `Target: ${currentTargets.calories} kcal`,
    step: '1',
  }) as HTMLInputElement;
  calInput.addEventListener('input', () => {
    calories = parseInt(calInput.value, 10) || 0;
    updateCompliance();
  });
  fieldsCard.appendChild(calInput);

  // Protein
  fieldsCard.appendChild(el('label', { class: 'input-label' }, 'Protein (g)'));
  const proInput = el('input', {
    type: 'number',
    class: 'input-field',
    placeholder: `Target: ${currentTargets.protein}g`,
    step: '1',
  }) as HTMLInputElement;
  proInput.addEventListener('input', () => {
    protein = parseInt(proInput.value, 10) || 0;
    updateCompliance();
  });
  fieldsCard.appendChild(proInput);

  // Fat
  fieldsCard.appendChild(el('label', { class: 'input-label' }, 'Fat (g)'));
  const fatInput = el('input', {
    type: 'number',
    class: 'input-field',
    placeholder: `Target: ${currentTargets.fat}g`,
    step: '1',
  }) as HTMLInputElement;
  fatInput.addEventListener('input', () => {
    fat = parseInt(fatInput.value, 10) || 0;
    updateCompliance();
  });
  fieldsCard.appendChild(fatInput);

  // Carbs
  fieldsCard.appendChild(el('label', { class: 'input-label' }, 'Carbs (g)'));
  const carbInput = el('input', {
    type: 'number',
    class: 'input-field',
    placeholder: `Target: ${currentTargets.carbs}g`,
    step: '1',
  }) as HTMLInputElement;
  carbInput.addEventListener('input', () => {
    carbs = parseInt(carbInput.value, 10) || 0;
    updateCompliance();
  });
  fieldsCard.appendChild(carbInput);

  screen.appendChild(fieldsCard);

  // Compliance section
  const complianceCard = el('div', { class: 'card nutrition-card' });
  complianceCard.appendChild(el('h3', {}, 'Compliance'));
  complianceCard.appendChild(complianceDisplay);
  screen.appendChild(complianceCard);

  // Initialize compliance display
  updateCompliance();

  // Status message area
  const statusArea = el('div', { class: 'nutrition-status' });
  screen.appendChild(statusArea);

  // Save button
  const saveBtn = el('button', { class: 'btn btn-primary btn-large' }, 'SAVE NUTRITION');
  saveBtn.addEventListener('click', async () => {
    const dateStr = dateInput.value;
    const targets = getTargets(dateStr);
    const d = new Date(dateStr + 'T12:00:00');
    const dow = d.getDay();
    const isTrainingDay = dow >= 1 && dow <= 5;

    const calCompliance = targets.calories > 0 ? Math.round((calories / targets.calories) * 100) / 100 : 0;
    const proCompliance = targets.protein > 0 ? Math.round((protein / targets.protein) * 100) / 100 : 0;
    const overallScore = Math.round(((calCompliance + proCompliance) / 2) * 100) / 100;

    const entry: DailyNutrition = {
      date: dateStr,
      isTrainingDay,
      dayType: isTrainingDay ? 'training' : 'rest',
      targets,
      actual: { calories, protein, fat, carbs },
      compliance: {
        calorieCompliance: calCompliance,
        proteinCompliance: proCompliance,
        overallScore,
        notes: '',
      },
      bodyweight: { morning: bodyweight },
      hydration: { estimatedOz: null },
    };

    try {
      await saveNutrition(entry);
      showStatus(statusArea, 'Nutrition saved successfully!', 'success');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      showStatus(statusArea, `Save failed: ${errMsg}`, 'error');
    }
  });
  screen.appendChild(saveBtn);

  container.appendChild(screen);

  // Load existing data for today's date on initial render
  async function loadExistingData(dateStr: string) {
    try {
      const existing = await getNutrition(dateStr);
      if (existing) {
        // Populate fields with existing data
        bwInput.value = existing.bodyweight.morning != null ? String(existing.bodyweight.morning) : '';
        bodyweight = existing.bodyweight.morning;

        calInput.value = String(existing.actual.calories);
        calories = existing.actual.calories;

        proInput.value = String(existing.actual.protein);
        protein = existing.actual.protein;

        fatInput.value = String(existing.actual.fat);
        fat = existing.actual.fat;

        carbInput.value = String(existing.actual.carbs);
        carbs = existing.actual.carbs;

        updateCompliance();
      } else {
        // Clear fields for a new date
        bwInput.value = '';
        bodyweight = null;
        calInput.value = '';
        calories = 0;
        proInput.value = '';
        protein = 0;
        fatInput.value = '';
        fat = 0;
        carbInput.value = '';
        carbs = 0;

        // Update placeholders with correct targets
        const targets = getTargets(dateStr);
        calInput.placeholder = `Target: ${targets.calories} kcal`;
        proInput.placeholder = `Target: ${targets.protein}g`;
        fatInput.placeholder = `Target: ${targets.fat}g`;
        carbInput.placeholder = `Target: ${targets.carbs}g`;

        updateCompliance();
      }
    } catch {
      // Silently fail — user can still enter data
    }
  }

  loadExistingData(dateInput.value);
}

// ---------------------------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------------------------

function complianceRow(
  label: string,
  actual: number,
  target: number,
  pct: number,
  unit: string,
): HTMLElement {
  const row = el('div', { class: 'compliance-row' });

  const nameEl = el('span', { class: 'compliance-label' }, label);
  const valuesEl = el(
    'span',
    { class: 'compliance-values' },
    `${actual} / ${target} ${unit}`,
  );

  const pctClass = pct >= 90 && pct <= 110 ? 'compliance-good'
    : pct >= 80 ? 'compliance-ok'
    : 'compliance-low';
  const pctEl = el('span', { class: `compliance-pct ${pctClass}` }, `${pct}%`);

  row.appendChild(nameEl);
  row.appendChild(valuesEl);
  row.appendChild(pctEl);

  return row;
}

function showStatus(container: HTMLElement, message: string, type: 'success' | 'error'): void {
  clear(container);
  const msg = el('div', { class: `status-message status-${type}` }, message);
  container.appendChild(msg);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (msg.parentNode) {
      msg.parentNode.removeChild(msg);
    }
  }, 3000);
}
