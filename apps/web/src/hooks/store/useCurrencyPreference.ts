'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'twomc.displayCurrency';

export type DisplayCurrencyCode = string;

export function useCurrencyPreference(defaultCode = 'RUB') {
  const [currency, setCurrencyState] = useState<DisplayCurrencyCode>(defaultCode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCurrencyState(stored);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setCurrency = useCallback((code: DisplayCurrencyCode) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  return { currency, setCurrency, ready };
}
