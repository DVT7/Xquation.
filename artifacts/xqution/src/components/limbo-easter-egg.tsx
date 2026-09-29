import { useEffect, useRef, useState } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { LIMBO_TRIGGER_EVENT, markLimboDiscovered } from "@/lib/limbo";
import { emitAchievementEvent } from "@/lib/achievement-events";

const LOCKOUT_KEY = "xqution_limbo_lockout";
const LOCKOUT_MS = 5 * 60 * 1000;
const DANCE_MS = 30_000;
const GLOW_MS = 1_800;
const COUNT = 8;

const GRID: Array<{ x: number; y: number }> = [
  { x: 38, y: 20 }, { x: 62, y: 20 },
  { x: 38, y: 36 }, { x: 62, y: 36 },
  { x: 38, y: 52 }, { x: 62, y: 52 },
  { x: 38, y: 68 }, { x: 62, y: 68 },
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

type Phase = "hidden" | "dance" | "pick" | "won" | "lost";
type XPos = { x: number; y: number };

function getLockout(): number | null {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return null;
    const until = JSON.parse(raw) as number;
    return until > Date.now() ? until : (localStorage.removeItem(LOCKOUT_KEY), null);
  } catch {
    return null;
  }
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const j = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[j]] = [copy[j], copy[index]];
  }
  return copy;
}

function startLimboAudio(ctx: AudioContext): () => void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.25, ctx.currentTime);
  master.connect(ctx.destination);

  const kick = (time: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.35);
    gain.gain.setValueAtTime(1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.connect(gain); gain.connect(master); osc.start(time); osc.stop(time + 0.4);
  };
  const synth = (frequency: number, time: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain); gain.connect(master); osc.start(time); osc.stop(time + duration);
  };
  const bass = (frequency: number, time: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain); gain.connect(master); osc.start(time); osc.stop(time + duration);
  };

  const beat = 60 / 138;
  const melody = [261, 293, 311, 349, 392, 349, 311, 293];
  const now = ctx.currentTime + 0.05;
  const bars = Math.ceil(DANCE_MS / 1000 / (beat * 4)) + 1;
  for (let index = 0; index < bars * 8; index += 1) {
    const time = now + index * beat;
    kick(time);
    synth(melody[index % melody.length], time, beat * 0.85);
    if (index % 4 === 0) bass(melody[index % melody.length] / 2, time, beat * 3.8);
  }

  return () => {
    master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    setTimeout(() => { try { void ctx.close(); } catch { /* already closed */ } }, 700);
  };
}

export function LimboEasterEgg() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const initialLockout = getLockout();
  const [phase, setPhase] = useState<Phase>(() => initialLockout ? "lost" : "hidden");
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(initialLockout);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);
  const [pickReady, setPickReady] = useState(false);
  const [wrongFlash, setWrongFlash] = useState<{ color: string; x: number; y: number } | null>(null);
  const [positions, setPositions] = useState<XPos[]>(() => GRID.map((point) => ({ ...point })));
  const xSlot = useRef<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);
  const correctIdx = useRef(0);
  const colorOrder = useRef<typeof COLORS>([]);
  const buffer = useRef("");
  const stopAudio = useRef<(() => void) | null>(null);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const danceStart = useRef(0);
  const orbitRaf = useRef(0);
  const orbitAngle = useRef(0);

  const clearSwap = () => {
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = null;
  };

  const triggerLimbo = () => {
    if (phase !== "hidden") return;
    markLimboDiscovered();
    colorOrder.current = shuffled(COLORS);
    correctIdx.current = Math.floor(Math.random() * COUNT);
    xSlot.current = [0, 1, 2, 3, 4, 5, 6, 7];
    setPositions(GRID.map((point) => ({ ...point })));
    setIsGlowing(false);
    setWrongFlash(null);
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
    if (DANCE_MS - elapsed <= 0) return;
    const delay = Math.round(550 - Math.min(elapsed / DANCE_MS, 1) * 420);
    swapTimer.current = setTimeout(() => {
      let first = Math.floor(Math.random() * COUNT);
      let second = Math.floor(Math.random() * (COUNT - 1));
      if (second >= first) second += 1;
      const next = [...positions];
      const firstSlot = xSlot.current[first];
      const secondSlot = xSlot.current[second];
      xSlot.current[first] = secondSlot;
      xSlot.current[second] = firstSlot;
      next[first] = { ...GRID[secondSlot] };
      next[second] = { ...GRID[firstSlot] };
      setPositions(next);
      scheduleNextSwap();
    }, delay);
  };

  useEffect(() => {
    if (phase !== "pick") return;
    setPickReady(false);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const radius = Math.min(width, height) * 0.3;
    const circlePosition = (angle: number, index: number): XPos => ({
      x: ((width / 2 + radius * Math.cos(angle + (index / COUNT) * Math.PI * 2)) / width) * 100,
      y: ((height / 2 + radius * Math.sin(angle + (index / COUNT) * Math.PI * 2)) / height) * 100,
    });
    orbitAngle.current = -Math.PI / 2;
    setPositions(Array.from({ length: COUNT }, (_, index) => circlePosition(orbitAngle.current, index)));
    const readyTimer = setTimeout(() => {
      setPickReady(true);
      const updateOrbit = () => {
        orbitAngle.current += 0.005;
        setPositions(Array.from({ length: COUNT }, (_, index) => circlePosition(orbitAngle.current, index)));
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
    if (phase !== "won") return;
    const timer = setTimeout(() => setPhase("hidden"), 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "lost" || !lockoutEnd) return;
    const tick = () => {
      const remaining = lockoutEnd - Date.now();
      if (remaining <= 0) {
        localStorage.removeItem(LOCKOUT_KEY);
        setPhase("hidden");
        setLockoutEnd(null);
      } else {
        setTimeLeft(Math.ceil(remaining / 1000));
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [phase, lockoutEnd]);

  const handlePick = (index: number) => {
    if (phase !== "pick") return;
    cancelAnimationFrame(orbitRaf.current);
    const selected = colorOrder.current[index] ?? COLORS[index];
    const selectedPosition = positions[index] ?? { x: 50, y: 50 };
    if (index === correctIdx.current) {
      emitAchievementEvent("limbo_passed");
      setPhase("won");
      return;
    }

    emitAchievementEvent("limbo_failed");
    setWrongFlash({ color: selected.hex, x: selectedPosition.x, y: selectedPosition.y });
    setTimeout(() => setWrongFlash(null), 900);
    const until = Date.now() + LOCKOUT_MS;
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(until));
    setLockoutEnd(until);
    setPhase("lost");
  };

  const handleBypass = () => {
    localStorage.removeItem(LOCKOUT_KEY);
    setPhase("hidden");
    setLockoutEnd(null);
  };

  if (phase === "hidden") return null;

  const fmtTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        @keyframes limbo-glow { 0%,100% { text-shadow:0 0 10px #00ff88,0 0 32px #00ff88; color:#00ff88; } 50% { text-shadow:0 0 32px #00ff88,0 0 80px #00ff88; color:#afffdd; } }
        @keyframes center-pulse { 0%,100% { opacity:.72; text-shadow:0 0 14px #00D9FF,0 0 36px #00D9FF; transform:translate(-50%,-50%) scale(1); } 50% { opacity:1; text-shadow:0 0 36px #00D9FF,0 0 110px #00D9FF; transform:translate(-50%,-50%) scale(1.12); } }
        @keyframes won-pop { 0% { transform:translate(-50%,-50%) scale(.7); opacity:0; } 60% { transform:translate(-50%,-50%) scale(1.12); opacity:1; } 100% { transform:translate(-50%,-50%) scale(1); opacity:1; } }
        @keyframes wrong-flash { 0%,100% { opacity:0; transform:translate(-50%,-50%) scale(.8); } 25%,75% { opacity:1; transform:translate(-50%,-50%) scale(1.25); } }
        @keyframes spin-in { from { transform:rotate(-180deg) scale(0); opacity:0; } to { transform:rotate(0deg) scale(1); opacity:1; } }
        .lx-btn { position:absolute; transform:translate(-50%,-50%); background:transparent; border:0; padding:0; outline:0; }
        .lx-btn.pickable { cursor:pointer; }
        .lx-btn.pickable:hover .lx-char { filter:brightness(1.6) drop-shadow(0 0 12px currentColor); }
        .lx-char { display:block; font-size:72px; font-weight:900; font-style:italic; font-family:'Times New Roman',Georgia,serif; line-height:1; user-select:none; }
        .limbo-center { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); color:#00D9FF; font-size:132px; font-weight:900; font-style:italic; font-family:'Times New Roman',Georgia,serif; line-height:1; pointer-events:none; }
        .limbo-center.pulsing { animation:center-pulse 1.1s ease-in-out infinite; }
        .wrong-flash { position:absolute; z-index:8; font-size:104px; font-weight:900; font-style:italic; font-family:'Times New Roman',Georgia,serif; line-height:1; pointer-events:none; animation:wrong-flash .9s ease-in-out forwards; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(2,11,36,.97)", backdropFilter: "blur(8px)", overflow: "hidden" }}>
        {(phase === "dance" || phase === "pick") && (
          <>
            <p style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", margin: 0, zIndex: 2, color: "#00D9FF", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", opacity: .8, whiteSpace: "nowrap" }}>
              {phase === "dance" ? (isGlowing ? "Watch closely…" : "Keep your eyes on it!") : "Pick the x"}
            </p>
            {Array.from({ length: COUNT }).map((_, index) => {
              const isGlow = phase === "dance" && isGlowing && index === correctIdx.current;
              const color = phase === "pick" ? (colorOrder.current[index]?.hex ?? "#00D9FF") : "#00D9FF";
              const position = positions[index] ?? { x: 50, y: 50 };
              const transition = phase === "dance"
                ? "left .35s cubic-bezier(.4,0,.2,1),top .35s cubic-bezier(.4,0,.2,1)"
                : phase === "pick" && !pickReady
                  ? "left .85s cubic-bezier(.4,0,.2,1),top .85s cubic-bezier(.4,0,.2,1)"
                  : "none";
              return (
                <button
                  key={index}
                  className={`lx-btn${phase === "pick" ? " pickable" : ""}`}
                  onClick={() => handlePick(index)}
                  disabled={phase === "dance"}
                  style={{ left: `${position.x}%`, top: `${position.y}%`, transition, animation: isGlow ? "limbo-glow .55s ease-in-out infinite" : "none" }}
                >
                  <span className="lx-char" style={{ color: isGlow ? "#00ff88" : color, textShadow: isGlow ? undefined : phase === "pick" ? `0 0 20px ${color}aa` : `0 0 10px ${color}55` }}>𝑥</span>
                </button>
              );
            })}
            <div className="limbo-center">𝑥</div>
          </>
        )}

        {wrongFlash && (
          <div className="wrong-flash" style={{ left: `${wrongFlash.x}%`, top: `${wrongFlash.y}%`, color: wrongFlash.color, textShadow: `0 0 18px ${wrongFlash.color},0 0 48px ${wrongFlash.color}` }}>𝑥</div>
        )}

        {phase === "won" && (
          <div className="limbo-center pulsing" style={{ zIndex: 4 }}>𝑥</div>
        )}

        {phase === "lost" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: "spin-in .6s ease-out forwards" }}>🔒</div>
            <p style={{ color: "#FF2020", fontSize: 24, fontWeight: 800, margin: 0 }}>Wrong x.</p>
            <p style={{ color: "#aaa", fontSize: 14, margin: "12px 0 32px", lineHeight: 1.6 }}>You've been locked out.<br />Try again in:</p>
            <div style={{ fontSize: 52, fontWeight: 900, fontFamily: "monospace", color: "#FF2020", textShadow: "0 0 20px #FF202066", marginBottom: 32, letterSpacing: 4 }}>{fmtTime(timeLeft)}</div>
            {isOwner && <button onClick={handleBypass} style={{ padding: "10px 28px", background: "linear-gradient(135deg,#00D9FF22,#00D9FF11)", border: "2px solid #00D9FF", borderRadius: 8, color: "#00D9FF", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>⚡ Owner Override — Bypass Lockout</button>}
          </div>
        )}
      </div>
    </>
  );
}