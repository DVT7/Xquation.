export type AchievementEventName =
  | "limbo_passed"
  | "limbo_failed"
  | "formula_click"
  | "read_aloud";

export interface AchievementEvent {
  event: AchievementEventName;
  amount?: number;
}

export const ACHIEVEMENT_EVENT = "xqution:achievement-event";

export function emitAchievementEvent(event: AchievementEventName, amount?: number): void {
  window.dispatchEvent(new CustomEvent<AchievementEvent>(ACHIEVEMENT_EVENT, {
    detail: { event, ...(amount === undefined ? {} : { amount }) },
  }));
}