export type AttemptPhase =
  | 'idle'
  | 'selecting'
  | 'connecting'
  | 'timeout-warning'
  | 'frame-loaded'
  | 'failed'
  | 'switching'
  | 'exhausted'
  | 'offline'

export interface PlayerAttemptState {
  phase: AttemptPhase
  attemptId: number
  providerId?: string
  attemptedProviderIds: string[]
}

export const initialAttemptState: PlayerAttemptState = {
  phase: 'idle',
  attemptId: 0,
  attemptedProviderIds: [],
}

export function isCurrentAttempt(
  state: PlayerAttemptState,
  attemptId: number,
  providerId: string,
): boolean {
  return state.attemptId === attemptId && state.providerId === providerId && state.phase !== 'offline' && state.phase !== 'exhausted'
}

export function beginAttempt(state: PlayerAttemptState, providerId: string): PlayerAttemptState {
  return {
    phase: 'connecting',
    attemptId: state.attemptId + 1,
    providerId,
    attemptedProviderIds: state.attemptedProviderIds.includes(providerId)
      ? state.attemptedProviderIds
      : [...state.attemptedProviderIds, providerId],
  }
}

export function transitionAttempt(
  state: PlayerAttemptState,
  attemptId: number,
  phase: Extract<AttemptPhase, 'timeout-warning' | 'frame-loaded' | 'failed'>,
): PlayerAttemptState {
  return state.attemptId === attemptId ? { ...state, phase } : state
}

export function switchAttempt(state: PlayerAttemptState, providerId: string): PlayerAttemptState {
  return { ...beginAttempt(state, providerId), phase: 'switching' }
}

export function exhaustAttempts(state: PlayerAttemptState): PlayerAttemptState {
  return { ...state, phase: 'exhausted' }
}

export function setOffline(state: PlayerAttemptState): PlayerAttemptState {
  return { ...state, phase: 'offline', attemptId: state.attemptId + 1 }
}

export function resumeOnline(state: PlayerAttemptState): PlayerAttemptState {
  return { ...initialAttemptState, attemptId: state.attemptId + 1 }
}

export function reloadAttempt(state: PlayerAttemptState): PlayerAttemptState {
  return {
    ...initialAttemptState,
    attemptId: state.attemptId + 1,
  }
}
