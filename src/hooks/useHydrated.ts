'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to safely use values that differ between server and client
 * Prevents hydration mismatch errors
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
