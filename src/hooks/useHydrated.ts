'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Hook to safely use values that differ between server and client
 * Prevents hydration mismatch errors
 * Uses useSyncExternalStore which is the React 18+ recommended pattern
 */
export function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
