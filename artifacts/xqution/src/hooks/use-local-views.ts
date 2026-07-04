import { useState, useCallback, useEffect } from "react";

const KEY = "xqution-formula-views";

function load(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<number>();
  } catch {
    return new Set<number>();
  }
}

function save(set: Set<number>) {
  try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch {}
}

export function useLocalFormulaViews() {
  const [views, setViews] = useState<Set<number>>(load);

  const add = useCallback((id: number) => {
    setViews(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      save(next);
      return next;
    });
  }, []);

  const count = views.size;

  return { count, add, views };
}

export function useSyncLocalViewsToServer() {
  // Future: when user logs in, batch-upload local views to server
  // For now, local views stay local and server views stay separate.
}
