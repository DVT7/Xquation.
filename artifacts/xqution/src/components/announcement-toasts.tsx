import { useEffect, useState, useCallback } from "react";
import { X, Megaphone } from "lucide-react";
import { useListPublicAnnouncements } from "@workspace/api-client-react";

const STORAGE_KEY = "xqution-dismissed-announcements";

function loadDismissed(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveDismissed(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function AnnouncementToasts() {
  const { data } = useListPublicAnnouncements();
  const [dismissed, setDismissed] = useState<number[]>(() => loadDismissed());

  const dismiss = useCallback((id: number) => {
    setDismissed((prev) => {
      const next = [...prev, id];
      saveDismissed(next);
      return next;
    });
  }, []);

  const announcements =
    data?.announcements?.filter((a) => !dismissed.includes(a.id)) ?? [];

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {announcements.map((a) => (
        <ToastCard
          key={a.id}
          id={a.id}
          title={a.title}
          message={a.message}
          priority={a.priority}
          onDismiss={dismiss}
        />
      ))}
    </div>
  );
}

function ToastCard({
  id,
  title,
  message,
  priority,
  onDismiss,
}: {
  id: number;
  title: string;
  message: string;
  priority?: string | null;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(id), 300);
    }, 30000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(id), 300);
  };

  const borderColor =
    priority === "urgent"
      ? "border-red-500/40"
      : priority === "high"
        ? "border-yellow-400/40"
        : "border-primary/30";

  const iconColor =
    priority === "urgent"
      ? "text-red-400"
      : priority === "high"
        ? "text-yellow-400"
        : "text-primary";

  return (
    <div
      className={[
        "pointer-events-auto rounded-lg border bg-card/90 backdrop-blur-sm p-4 shadow-lg transition-all duration-300",
        borderColor,
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <Megaphone className={["w-5 h-5 mt-0.5 shrink-0", iconColor].join(" ")} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
