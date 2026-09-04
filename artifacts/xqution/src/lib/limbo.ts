export const LIMBO_DISCOVERED_KEY = "xqution_limbo_discovered";
export const LIMBO_TRIGGER_EVENT = "xqution:trigger-limbo";
export const LIMBO_SEARCH_HREF = "xqution://limbo";

export function hasDiscoveredLimbo(): boolean {
  try {
    return localStorage.getItem(LIMBO_DISCOVERED_KEY) === "true";
  } catch {
    return false;
  }
}

export function markLimboDiscovered(): void {
  try {
    localStorage.setItem(LIMBO_DISCOVERED_KEY, "true");
  } catch {
    // The trigger still works when storage is unavailable.
  }
}