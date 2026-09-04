export type AchievementEvent =
  | "limbo_passed"
  | "limbo_failed"
  | "formula_click"
  | "read_aloud";

export const ACHIEVEMENT_EVENT = "xqution:achievement-event";

export function emitAchievementEvent(event: AchievementEvent): void {
  window.dispatchEvent(new CustomEvent<AchievementEvent>(ACHIEVEMENT_EVENT, { detail: event }));
}