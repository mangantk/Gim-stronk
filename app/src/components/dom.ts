// =============================================================================
// Op Strength — DOM Utility Helpers
// =============================================================================

/**
 * Create an HTML element with optional attributes and children.
 */
export function el(
  tag: string,
  attrs?: Record<string, string>,
  ...children: (Node | string)[]
): HTMLElement {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('data-')) {
        element.setAttribute(key, value);
      } else if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

/**
 * Create a text node.
 */
export function text(content: string): Text {
  return document.createTextNode(content);
}

/**
 * Remove all children from a container.
 */
export function clear(container: HTMLElement): void {
  container.innerHTML = '';
}

/**
 * Query selector shorthand.
 */
export function qs(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

/**
 * Format a Date as YYYY-MM-DD.
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return today's date as YYYY-MM-DD.
 */
export function todayStr(): string {
  return formatDate(new Date());
}

/**
 * Generate a UUID using the browser crypto API.
 */
export function uuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Reusable UI Components
// ---------------------------------------------------------------------------

/**
 * Create a row of 1-5 scale buttons. Tapping one highlights it and calls onChange.
 * Returns the container element.
 */
export function scaleSelector(
  label: string,
  min: number,
  max: number,
  onChange: (value: number) => void,
  initialValue?: number,
  labels?: string[],
): HTMLElement {
  const wrapper = el('div', { class: 'scale-selector' });
  const labelEl = el('div', { class: 'scale-label' }, label);
  wrapper.appendChild(labelEl);

  const btnRow = el('div', { class: 'scale-buttons' });
  const buttons: HTMLButtonElement[] = [];

  for (let i = min; i <= max; i++) {
    const btn = el('button', {
      class: 'scale-btn',
      type: 'button',
      'data-value': String(i),
    }, labels ? labels[i - min] : String(i)) as HTMLButtonElement;

    if (initialValue === i) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      for (const b of buttons) b.classList.remove('active');
      btn.classList.add('active');
      onChange(i);
    });

    buttons.push(btn);
    btnRow.appendChild(btn);
  }

  wrapper.appendChild(btnRow);
  return wrapper;
}

/**
 * Create a number input with +/- adjustment buttons.
 */
export function numberStepper(
  label: string,
  initialValue: number,
  step: number,
  min: number,
  max: number,
  onChange: (value: number) => void,
  unit?: string,
): HTMLElement {
  let value = initialValue;

  const wrapper = el('div', { class: 'number-stepper' });
  const labelEl = el('div', { class: 'stepper-label' }, label);
  wrapper.appendChild(labelEl);

  const controls = el('div', { class: 'stepper-controls' });

  const minusBtn = el('button', { class: 'stepper-btn minus', type: 'button' }, `-${step}`);
  const display = el('span', { class: 'stepper-value' }, String(value) + (unit ? ` ${unit}` : ''));
  const plusBtn = el('button', { class: 'stepper-btn plus', type: 'button' }, `+${step}`);

  function update() {
    display.textContent = String(value) + (unit ? ` ${unit}` : '');
    onChange(value);
  }

  minusBtn.addEventListener('click', () => {
    value = Math.max(min, Math.round((value - step) * 100) / 100);
    update();
  });

  plusBtn.addEventListener('click', () => {
    value = Math.min(max, Math.round((value + step) * 100) / 100);
    update();
  });

  controls.appendChild(minusBtn);
  controls.appendChild(display);
  controls.appendChild(plusBtn);
  wrapper.appendChild(controls);

  return wrapper;
}
