// =============================================================================
// Op Strength — Shared State Management
// Simple module-level state for passing data between screens.
// =============================================================================

import type { Session, ReadinessResult } from './types';

export let currentSession: Session | null = null;
export let currentReadiness: ReadinessResult | null = null;

export function setCurrentSession(s: Session | null): void {
  currentSession = s;
}

export function setCurrentReadiness(r: ReadinessResult | null): void {
  currentReadiness = r;
}
