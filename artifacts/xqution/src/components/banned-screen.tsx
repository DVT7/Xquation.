import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import type { BanInfo } from "@workspace/replit-auth-web";
import { useAuth } from "@workspace/replit-auth-web";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${hours}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

export function BannedScreen({ ban }: { ban: BanInfo }) {
  const { logout } = useAuth();
  const expiresAt = ban.expiresAt ? new Date(ban.expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const remainingMs = expiresAt ? expiresAt - now : null;
  const hasExpired = remainingMs !== null && remainingMs <= 0;

  useEffect(() => {
    if (hasExpired) {
      window.location.reload();
    }
  }, [hasExpired]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <Ban className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">You've been banned</h1>
        <p className="text-sm text-gray-400 mb-6">
          Your account has been suspended from XQuation.
        </p>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 mb-6 text-left">
          <p className="text-xs uppercase tracking-wide text-red-400/70 mb-1">Reason</p>
          <p className="text-sm text-gray-200">{ban.reason}</p>
        </div>

        {ban.isPermanent || !expiresAt ? (
          <p className="text-sm text-gray-500">This ban is permanent.</p>
        ) : (
          <div className="rounded-lg border border-border/20 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Time remaining
            </p>
            <p className="text-2xl font-mono font-semibold text-white tabular-nums">
              {formatRemaining(Math.max(0, remainingMs ?? 0))}
            </p>
          </div>
        )}

        <button
          onClick={logout}
          className="mt-8 text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
