import { useEffect, useRef, useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  getGetLimboStateQueryKey,
  useGetLimboState,
  useRecordLimboAttempt,
  type LimboState,
} from "@workspace/api-client-react";
import { LIMBO_TRIGGER_EVENT, markLimboDiscovered } from "@/lib/limbo";
import { emitAchievementEvent } from "@/lib/achievement-events";

const LOCKOUT_KEY = "xqution_limbo_lockout";
const LOCAL_STATE_KEY = "xqution_limbo_progress";
const LOCKOUT_MS = 5 * 60 * 1000;
const DANCE_MS = 30_000;
const GLOW_MS = 1_800;
const COUNT = 6;

const GRID = [
  { x: 35, y: 23 }, { x: 65, y: 23 },
  { x: 29, y: 50 }, { x: 71, y: 50 },
  { x: 35, y: 77 }, { x: 65, y: 77 },
];

const COLORS = [
  { label: "orange", hex: "#FF8C00" },
  { label: "lime", hex: "#39FF14" },
  { label: "green", hex: "#00BB44" },
  { label: "red", hex: "#FF2020" },
  { label: "dark blue", hex: "#2255FF" },
  { label: "light blue", hex: "#00CFFF" },
  { label: "pink", hex: "#FF69B4" },
  { label: "purple", hex: "#CC44FF" },
];

type Phase = "hidden" | "dance" | "pick" | "won" | "lost" | "finale";
type XPos = { x: number; y: number };

const EMPTY_STATE: LimboState = {
  wrongColors: [],
  centerActivated: false,
  completed: false,
  completedAt: null,
};

function getLockout(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const until = JSON.parse(raw) as number;
    return until > Date.now() ? until : (localStorage.removeItem(key), null);
  } catch {
    return null;
  }
}

function getLocalState(): LimboState {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_STATE_KEY) ?? "null") as Partial<LimboState> | null;
    if (!parsed || !Array.isArray(parsed.wrongColors)) return EMPTY_STATE;
    return {
      wrongColors: parsed.wrongColors.filter((color): color is string => typeof color === "string").slice(0, COUNT),
      centerActivated: parsed.centerActivated === true,
      completed: parsed.completed === true,
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

function saveLocalState(state: LimboState) {
  try {
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
  } catch {
    // The server remains authoritative for authenticated users.
  }
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function colorFor(label: string) {
  return COLORS.find((color) => color.label === label) ?? { label, hex: "#00D9FF" };
}

function startLimboAudio(ctx: AudioContext): () => void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.22, ctx.currentTime);
  master.connect(ctx.destination);
  const kick = (t: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
    gain.gain.setValueAtTime(1.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain); gain.connect(master); osc.start(t); osc.stop(t + 0.4);
  };
  const synth = (freq: number, t: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square"; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.13, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain); gain.connect(master); osc.start(t); osc.stop(t + duration);
  };
  const beat = 60 / 138;
  const notes = [261, 293, 311, 349, 392, 349, 311, 293];
  const now = ctx.currentTime + 0.05;
  const beats = Math.ceil(DANCE_MS / 1000 / (beat * 4)) + 1;
  for (let index = 0; index < beats * 8; index += 1) {
    const time = now + index * beat;
    kick(time);
    synth(notes[index % notes.length], time, beat * 0.85);
  }
  return () => {
    master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    setTimeout(() => { try { void ctx.close(); } catch { /* already closed */ } }, 700);
  };
}

function startFinaleAudio(ctx: AudioContext): () => void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.12, ctx.currentTime);
  master.connect(ctx.destination);
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const playLoop = () => {
    if (stopped) return;
    const now = ctx.currentTime + 0.05;
    const notes = [110, 116.5, 146.8, 138.6, 103.8, 92.5, 110];
    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(frequency, now + index * 1.05);
      gain.gain.setValueAtTime(0.001, now + index * 1.05);
      gain.gain.linearRampToValueAtTime(0.11, now + index * 1.05 + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 1.05 + 1.8);
      osc.connect(gain); gain.connect(master);
      osc.start(now + index * 1.05);
      osc.stop(now + index * 1.05 + 1.9);
    });
    timer = setTimeout(playLoop, 7_400);
  };
  playLoop();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    setTimeout(() => { try { void ctx.close(); } catch { /* already closed */ } }, 900);
  };
}

export function LimboEasterEgg() {
  const { user, isAuthenticated } = useAuth();
  const isOwner = user?.role === "owner";
  const lockoutKey = user?.id ? `${LOCKOUT_KEY}:${user.id}` : LOCKOUT_KEY;
  const initialLockout = getLockout(lockoutKey);
  const [phase, setPhase] = useState<Phase>(() => initialLockout ? "lost" : "hidden");
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(initialLockout);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);
  const [pickReady, setPickReady] = useState(false);
  const [progress, setProgress] = useState<LimboState>(getLocalState);
  const [dialogIndex, setDialogIndex] = useState(0);
  const positionsRef = useRef<XPos[]>(GRID.map((point) => ({ ...point })));
  const [positions, setPositions] = useState<XPos[]>(GRID.map((point) => ({ ...point })));
  const progressRef = useRef(progress);
  const colorOrder = useRef<typeof COLORS>([]);
  const correctIdx = useRef(0);
  const buffer = useRef("");
  const stopAudio = useRef<(() => void) | null>(null);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const danceStart = useRef(0);
  const orbitRaf = useRef(0);
  const orbitAngle = useRef(0);
  const pickLocked = useRef(false);

  const { data: remoteState } = useGetLimboState({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetLimboStateQueryKey(),
    },
  });
  const recordAttempt = useRecordLimboAttempt();

  useEffect(() => {
    if (!remoteState) return;
    setProgress(remoteState);
    progressRef.current = remoteState;
  }, [remoteState]);

  const clearSwap = () => {
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = null;
  };

  const triggerLimbo = () => {
    if (phase !== "hidden") return;
    markLimboDiscovered();
    if (progressRef.current.completed) {
      setDialogIndex(0);
      setPhase("finale");
      return;
    }

    const remembered = progressRef.current.wrongColors;
    const rememberedSet = new Set(remembered);
    const available = shuffled(COLORS.filter((color) => !rememberedSet.has(color.label)));
    colorOrder.current = Array.from({ length: COUNT }, (_, index) => {
      const rememberedColor = remembered[index];
      return rememberedColor ? colorFor(rememberedColor) : (available.shift() ?? COLORS[index]);
    });
    const openSlots = Array.from({ length: COUNT }, (_, index) => index)
      .filter((index) => !remembered[index]);
    correctIdx.current = openSlots[Math.floor(Math.random() * Math.max(openSlots.length, 1))] ?? 0;
    setPositions(GRID.map((point) => ({ ...point })));
    positionsRef.current = GRID.map((point) => ({ ...point }));
    setIsGlowing(false);
    pickLocked.current = false;
    setPhase("dance");
    window.dispatchEvent(new Event("xqution:limbo-discovered"));
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.length === 1) buffer.current += event.key;
      if (buffer.current.length > 10) buffer.current = buffer.current.slice(-10);
      if (buffer.current.endsWith("/limbo")) {
        buffer.current = "";
        triggerLimbo();
      }
    };
    const onCommand = () => triggerLimbo();
    window.addEventListener("keydown", onKey);
    window.addEventListener(LIMBO_TRIGGER_EVENT, onCommand);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(LIMBO_TRIGGER_EVENT, onCommand);
    };
  });

  useEffect(() => {
    if (phase !== "dance") return;
    try {
      const ctx = new AudioContext();
      stopAudio.current = startLimboAudio(ctx);
    } catch {
      stopAudio.current = null;
    }
    setIsGlowing(true);
    danceStart.current = Date.now();
    const glowTimer = setTimeout(() => {
      setIsGlowing(false);
      scheduleNextSwap();
    }, GLOW_MS);
    const endTimer = setTimeout(() => {
      clearSwap();
      stopAudio.current?.();
      stopAudio.current = null;
      setPhase("pick");
    }, DANCE_MS);
    return () => {
      clearTimeout(glowTimer);
      clearTimeout(endTimer);
      clearSwap();
      stopAudio.current?.();
      stopAudio.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const scheduleNextSwap = () => {
    const elapsed = Date.now() - danceStart.current;
    const remaining = DANCE_MS - elapsed;
    if (remaining <= 0) return;
    const delay = Math.round(550 - Math.min(elapsed / DANCE_MS, 1) * 420);
    swapTimer.current = setTimeout(() => {
      let first = Math.floor(Math.random() * COUNT);
      let second = Math.floor(Math.random() * (COUNT - 1));
      if (second >= first) second += 1;
      const next = [...positionsRef.current];
      [next[first], next[second]] = [next[second], next[first]];
      positionsRef.current = next;
      setPositions(next);
      scheduleNextSwap();
    }, delay);
  };

  useEffect(() => {
    if (phase !== "pick" && phase !== "won" && phase !== "lost") return;
    setPickReady(false);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const radius = Math.min(width, height) * 0.3;
    const circlePosition = (angle: number, index: number): XPos => ({
      x: ((width / 2 + radius * Math.cos(angle + (index / COUNT) * Math.PI * 2)) / width) * 100,
      y: ((height / 2 + radius * Math.sin(angle + (index / COUNT) * Math.PI * 2)) / height) * 100,
    });
    orbitAngle.current = -Math.PI / 2;
    const circle = Array.from({ length: COUNT }, (_, index) => circlePosition(orbitAngle.current, index));
    positionsRef.current = circle;
    setPositions(circle);
    const readyTimer = setTimeout(() => {
      setPickReady(true);
      const updateOrbit = () => {
        if (phase !== "pick") return;
        orbitAngle.current += 0.005;
        const next = Array.from({ length: COUNT }, (_, index) => circlePosition(orbitAngle.current, index));
        positionsRef.current = next;
        setPositions(next);
        orbitRaf.current = requestAnimationFrame(updateOrbit);
      };
      orbitRaf.current = requestAnimationFrame(updateOrbit);
    }, 850);
    return () => {
      clearTimeout(readyTimer);
      cancelAnimationFrame(orbitRaf.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "finale") return;
    try {
      const ctx = new AudioContext();
      stopAudio.current = startFinaleAudio(ctx);
    } catch {
      stopAudio.current = null;
    }
    return () => {
      stopAudio.current?.();
      stopAudio.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "lost" || !lockoutEnd) return;
    const tick = () => {
      const remaining = lockoutEnd - Date.now();
      if (remaining <= 0) {
        localStorage.removeItem(lockoutKey);
        setPhase("hidden");
        setLockoutEnd(null);
      } else {
        setTimeLeft(Math.ceil(remaining / 1000));
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [phase, lockoutEnd, lockoutKey]);

  const handlePick = (index: number) => {
    if (phase !== "pick" || pickLocked.current || progressRef.current.wrongColors[index]) return;
    pickLocked.current = true;
    cancelAnimationFrame(orbitRaf.current);
    const outcome = index === correctIdx.current ? "correct" : "wrong";
    const color = colorOrder.current[index]?.label ?? "light blue";
    emitAchievementEvent(outcome === "correct" ? "limbo_passed" : "limbo_failed");

    const saveResult = (next: LimboState) => {
      setProgress(next);
      progressRef.current = next;
      if (!isAuthenticated) saveLocalState(next);
      if (next.completed) {
        localStorage.removeItem(lockoutKey);
        setDialogIndex(0);
        setPhase("finale");
      } else if (outcome === "correct") {
        setPhase("won");
      } else {
        const until = Date.now() + LOCKOUT_MS;
        localStorage.setItem(lockoutKey, JSON.stringify(until));
        setLockoutEnd(until);
        setPhase("lost");
      }
    };

    if (isAuthenticated) {
      recordAttempt.mutate(
        { data: { outcome, color } },
        { onSuccess: saveResult, onError: () => setPhase(outcome === "correct" ? "won" : "lost") },
      );
      return;
    }

    const wrongColors = [...progressRef.current.wrongColors];
    if (outcome === "wrong" && !wrongColors.includes(color)) wrongColors.push(color);
    saveResult({
      wrongColors: wrongColors.slice(0, COUNT),
      centerActivated: progressRef.current.centerActivated || outcome === "correct",
      completed: wrongColors.length >= COUNT,
      completedAt: wrongColors.length >= COUNT ? new Date().toISOString() : progressRef.current.completedAt,
    });
  };

  const handleBypass = () => {
    localStorage.removeItem(lockoutKey);
    setPhase("hidden");
    setLockoutEnd(null);
  };

  if (phase === "hidden") return null;

  const boardVisible = phase === "dance" || phase === "pick" || phase === "won" || phase === "lost";
  const fmtTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const dialogLines = ["...", "You found the room.", "The colors remember.", "Come back when it is quiet."];

  return (
    <>
      <style>{`
        @keyframes limbo-glow { 0%,100% { text-shadow:0 0 10px currentColor,0 0 28px currentColor; transform:scale(1); } 50% { text-shadow:0 0 28px currentColor,0 0 80px currentColor; transform:scale(1.15); } }
        @keyframes center-pulse { 0%,100% { opacity:.72; text-shadow:0 0 12px #00D9FF,0 0 32px #00D9FF; } 50% { opacity:1; text-shadow:0 0 30px #00D9FF,0 0 100px #00D9FF; } }
        @keyframes won-pop { 0% { transform:scale(.8); opacity:0; } 100% { transform:scale(1); opacity:1; } }
        @keyframes room-in { from { opacity:0; filter:brightness(1.8); } to { opacity:1; filter:brightness(1); } }
        .lx-btn { position:absolute; transform:translate(-50%,-50%); background:transparent; border:0; padding:0; outline:0; }
        .lx-btn.pickable { cursor:pointer; }
        .lx-btn.pickable:hover .lx-char { filter:brightness(1.6) drop-shadow(0 0 12px currentColor); }
        .lx-btn:disabled { cursor:default; }
        .lx-char { display:block; font-size:72px; font-weight:900; font-style:italic; font-family:'Times New Roman',Georgia,serif; line-height:1; user-select:none; transition:color .4s,text-shadow .4s,filter .4s; }
        .limbo-center { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); color:#00D9FF; font-size:100px; font-weight:900; font-style:italic; font-family:'Times New Roman',Georgia,serif; line-height:1; pointer-events:none; }
        .limbo-center.active { animation:center-pulse 1.2s ease-in-out infinite; }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: phase === "finale" ? "#f7f8f5" : "rgba(2,11,36,.97)",
        backdropFilter: phase === "finale" ? undefined : "blur(8px)",
        overflow: "hidden",
        color: phase === "finale" ? "#08152d" : "#fff",
      }}>
        {boardVisible && (
          <>
            <p style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", margin: 0, zIndex: 2, color: "#00D9FF", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", opacity: .8, whiteSpace: "nowrap" }}>
              {phase === "dance" ? (isGlowing ? "Watch closely…" : "Keep your eyes on it!") : phase === "pick" ? "Pick the x" : progress.centerActivated ? "The center is awake" : "The pattern remembers"}
            </p>
            {Array.from({ length: COUNT }).map((_, index) => {
              const remembered = progress.wrongColors[index];
              const color = remembered ? colorFor(remembered) : (colorOrder.current[index] ?? COLORS[index]);
              const isGlow = phase === "dance" && isGlowing && index === correctIdx.current;
              const position = positions[index] ?? GRID[index];
              const transition = phase === "dance" ? "left .35s cubic-bezier(.4,0,.2,1),top .35s cubic-bezier(.4,0,.2,1)" : !pickReady && phase === "pick" ? "left .85s cubic-bezier(.4,0,.2,1),top .85s cubic-bezier(.4,0,.2,1)" : "none";
              return (
                <button
                  key={index}
                  className={`lx-btn${phase === "pick" && !remembered ? " pickable" : ""}`}
                  onClick={() => handlePick(index)}
                  disabled={phase !== "pick" || !!remembered}
                  aria-label={remembered ? `Remembered wrong color: ${remembered}` : `Choose ${color.label} x`}
                  style={{ left: `${position.x}%`, top: `${position.y}%`, transition, animation: isGlow ? "limbo-glow .55s ease-in-out infinite" : "none" }}
                >
                  <span className="lx-char" style={{ color: color.hex, textShadow: `0 0 20px ${color.hex}aa`, opacity: remembered ? 1 : .95 }}>𝑥</span>
                </button>
              );
            })}
            <div className={`limbo-center${progress.centerActivated || phase === "won" ? " active" : ""}`}>𝑥</div>
          </>
        )}

        {phase === "won" && (
          <div style={{ position: "absolute", left: "50%", bottom: "8%", transform: "translateX(-50%)", color: "#00D9FF", fontSize: 14, letterSpacing: 2, textTransform: "uppercase", animation: "won-pop .5s ease-out" }}>
            Correct. It is listening.
          </div>
        )}

        {phase === "lost" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: "rgba(2,11,36,.62)" }}>
            <p style={{ color: "#FF2020", fontSize: 24, fontWeight: 800, margin: 0 }}>Wrong x.</p>
            <p style={{ color: "#aaa", fontSize: 14, margin: "12px 0 24px", lineHeight: 1.6 }}>That color has been remembered.<br />Try again in:</p>
            <div style={{ fontSize: 52, fontWeight: 900, fontFamily: "monospace", color: "#FF2020", textShadow: "0 0 20px #FF202066", marginBottom: 28, letterSpacing: 4 }}>{fmtTime(timeLeft)}</div>
            {isOwner && <button onClick={handleBypass} style={{ padding: "10px 28px", background: "linear-gradient(135deg,#00D9FF22,#00D9FF11)", border: "2px solid #00D9FF", borderRadius: 8, color: "#00D9FF", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>⚡ Owner Override — Bypass Lockout</button>}
          </div>
        )}

        {phase === "finale" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "room-in 1.4s ease-out" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center,#ffffff 0%,#eef1ed 72%,#dfe4de 100%)", pointerEvents: "none" }} />
            <button onClick={() => setDialogIndex((index) => (index + 1) % dialogLines.length)} aria-label="Talk to the X" style={{ position: "relative", zIndex: 1, border: 0, background: "transparent", cursor: "pointer", color: "#00D9FF", fontSize: 190, lineHeight: 1, fontFamily: "'Times New Roman',Georgia,serif", fontStyle: "italic", fontWeight: 900, textShadow: "0 0 12px #00D9FF,0 0 48px #00D9FF,8px 8px 0 #ff38c7" }}>𝑥</button>
            <div style={{ position: "relative", zIndex: 1, marginTop: 24, minHeight: 44, padding: "10px 20px", border: "1px solid #08152d33", borderRadius: 12, background: "#ffffffaa", color: "#08152d", fontFamily: "monospace", fontSize: 13, letterSpacing: 1 }}>{dialogLines[dialogIndex]}</div>
            <p style={{ position: "relative", zIndex: 1, marginTop: 16, color: "#08152d88", fontSize: 11, letterSpacing: 3, textTransform: "uppercase" }}>Click him to talk</p>
            <button onClick={() => setPhase("hidden")} style={{ position: "absolute", right: 24, top: 20, zIndex: 2, border: "1px solid #08152d44", borderRadius: 999, background: "#ffffffaa", color: "#08152d", padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>Leave the room</button>
          </div>
        )}
      </div>
    </>
  );
}