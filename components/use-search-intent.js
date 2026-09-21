"use client";
import { useSyncExternalStore } from 'react';
import { getSearchIntent, intentFor, subscribeSearchIntent } from '../lib/search-intent.mjs';

// The search result waiting for this view, if any. Apply it, then clearSearchIntent(intent).
export function useSearchIntent(view) {
  const intent = useSyncExternalStore(subscribeSearchIntent, getSearchIntent, () => null);
  return intentFor(view, intent);
}
