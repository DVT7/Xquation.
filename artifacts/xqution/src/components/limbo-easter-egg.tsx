import { useState, useEffect, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";

/* ─────────────────────────────── constants ───────────────────────────────── */

const LOCKOUT_KEY = "xqution_limbo_lockout";
const LOCKOUT_MS = 5 * 60 * 1000;
const DANCE_MS = 30_000;
const GLOW_MS = 1_800;

const COLORS = [
  { label: "orange",    hex: "#FF8C00" },
  { label: "lime",      hex: "#32FF32" },
  { label: "green",     hex: "#00BB00" },
  { label: "red",       hex: "#FF2020" },
  { label: "dark blue", hex: "#00008B" },
  { label: "light blue",hex: "#00BFFF" },
  { label: "pink",      hex: "#FF69B4" },
  { label: "purple",    hex: "#9400D3" },
];

/* ─────────────────────────────── helpers ─────────────────────────────────── */

function getLockout(): number | null {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return null;
    const until = JSON.parse(raw) as number;
    return until > Date.now() ? until : (localStorage.removeItem(LOCKOUT_KEY), null);
  } catch { return null; }
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ────────────────────────── web-audio limbo beat ─────────────────────────── */

function startLimboAudio(ctx: AudioContext): () => void {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.25, ctx.currentTime);
  master.connect(ctx.destination);

  const kick = (t: number) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
    g.gain.setValueAtTime(1.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + 0.4);
  };

  const synth = (freq: number, t: number, dur: number) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur);
  };

  const bass = (freq: number, t: number, dur: number) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur);
  };

  const BPM  = 138;
  const BEAT = 60 / BPM;
  const now  = ctx.currentTime + 0.05;
  // GD-limbo inspired melody fragment (C D Eb F G)
  const mel  = [261, 293, 311, 349, 392, 349, 311, 293];
  const BARS = Math.ceil(DANCE_MS / 1000 / (BEAT * 4)) + 1;

  for (let b = 0; b < BARS * 8; b++) {
    const t = now + b * BEAT;
    // Kick every beat
    kick(t);
    // Melody: 8th-note pattern
    synth(mel[b % mel.length], t, BEAT * 0.85);
    // Bass every half-bar
    if (b % 4 === 0) bass(mel[b % mel.length] / 2, t, BEAT * 3.8);
  }

  return () => {
    master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    setTimeout(() => { try { ctx.close(); } catch { /* ok */ } }, 700);
  };
}

/* ────────────────────────────── component ────────────────────────────────── */

type Phase = "hidden" | "dance" | "pick" | "won" | "lost";

export function LimboEasterEgg() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  // initialise directly from localStorage so there's no flash on reload
  const [phase,      setPhase]      = useState<Phase>(() => getLockout() ? "lost" : "hidden");
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(() => getLockout());
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [isGlowing,  setIsGlowing]  = useState(false);
  const [dancing,    setDancing]    = useState(false);
  const [danceStopped, setDanceStopped] = useState(false);

  // fixed per-trigger randomness
  const correctIdx = useRef(0);
  const glowIdx    = useRef(0);
  const colorOrder = useRef<typeof COLORS>([]);
  const bufRef     = useRef("");
  const stopAudio  = useRef<(() => void) | null>(null);
  const audioCtx   = useRef<AudioContext | null>(null);

  /* ── keydown listener ── */
  useEffect(() => {
    if (phase !== "hidden") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.length === 1) bufRef.current += e.key;
      if (bufRef.current.length > 10) bufRef.current = bufRef.current.slice(-10);
      if (bufRef.current.endsWith("/limbo")) {
        bufRef.current = "";
        // randomise for this run
        const idx = Math.floor(Math.random() * 8);
        correctIdx.current  = idx;
        glowIdx.current     = idx;      // same position — that's the hint!
        colorOrder.current  = shuffled(COLORS);
        setPhase("dance");
        setIsGlowing(false);
        setDancing(false);
        setDanceStopped(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  /* ── dance phase orchestration ── */
  useEffect(() => {
    if (phase !== "dance") return;

    // 1. glow one X immediately
    setIsGlowing(true);

    // 2. start audio
    try {
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      stopAudio.current = startLimboAudio(ctx);
    } catch { /* no audio on some browsers */ }

    // 3. after glow → start dancing
    const glowTimer = setTimeout(() => {
      setIsGlowing(false);
      setDancing(true);
    }, GLOW_MS);

    // 4. after full dance → pick phase
    const danceTimer = setTimeout(() => {
      stopAudio.current?.();
      stopAudio.current = null;
      setDancing(false);
      setDanceStopped(true);
      setTimeout(() => setPhase("pick"), 400);
    }, DANCE_MS);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(danceTimer);
      stopAudio.current?.();
      stopAudio.current = null;
    };
  }, [phase]);

  /* ── won: auto-close ── */
  useEffect(() => {
    if (phase !== "won") return;
    const t = setTimeout(() => setPhase("hidden"), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  /* ── lockout countdown ── */
  useEffect(() => {
    if (phase !== "lost" || !lockoutEnd) return;
    const tick = () => {
      const rem = lockoutEnd - Date.now();
      if (rem <= 0) {
        localStorage.removeItem(LOCKOUT_KEY);
        setPhase("hidden");
        setLockoutEnd(null);
      } else {
        setTimeLeft(Math.ceil(rem / 1000));
      }
    };
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [phase, lockoutEnd]);

  /* ── pick handler ── */
  const handlePick = (idx: number) => {
    if (phase !== "pick") return;
    if (idx === correctIdx.current) {
      setPhase("won");
    } else {
      const until = Date.now() + LOCKOUT_MS;
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(until));
      setLockoutEnd(until);
      setPhase("lost");
    }
  };

  const handleBypass = () => {
    localStorage.removeItem(LOCKOUT_KEY);
    setPhase("hidden");
    setLockoutEnd(null);
  };

  if (phase === "hidden") return null;

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── OVERLAY ── */
  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes limbo-dance {
          0%   { transform: translateX(-18px) translateY(0px) rotate(-4deg); }
          25%  { transform: translateX(0px)   translateY(-10px) rotate(0deg); }
          50%  { transform: translateX(18px)  translateY(0px) rotate(4deg); }
          75%  { transform: translateX(0px)   translateY(8px) rotate(0deg); }
          100% { transform: translateX(-18px) translateY(0px) rotate(-4deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 8px #00ff88, 0 0 24px #00ff88; color: #00ff88; }
          50%       { text-shadow: 0 0 24px #00ff88, 0 0 60px #00ff88; color: #88ffcc; }
        }
        @keyframes won-pop {
          0%   { transform: scale(0.7) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes spin-in {
          from { transform: rotate(-180deg) scale(0); opacity: 0; }
          to   { transform: rotate(0deg) scale(1); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(2,11,36,0.97)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* ── DANCE / PICK phase ── */}
        {(phase === "dance" || phase === "pick") && (
          <div style={{ textAlign: "center", userSelect: "none" }}>
            <p style={{
              color: "#00D9FF", fontSize: 13, letterSpacing: 4,
              marginBottom: 32, textTransform: "uppercase", opacity: 0.8,
            }}>
              {phase === "dance" ? (dancing ? "🕺 Do the limbo!" : "Watch closely...") : "Pick the X"}
            </p>

            {/* 2×4 grid of X's */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 88px)",
              gridTemplateRows: "repeat(2, 88px)",
              gap: 16,
            }}>
              {Array.from({ length: 8 }).map((_, i) => {
                const isGlow  = phase === "dance" && isGlowing && i === glowIdx.current;
                const isDance = phase === "dance" && dancing;
                const color   = phase === "pick" ? colorOrder.current[i].hex : "#00D9FF";

                return (
                  <button
                    key={i}
                    onClick={() => handlePick(i)}
                    disabled={phase === "dance"}
                    style={{
                      width: 88, height: 88,
                      background: phase === "pick" ? `${color}18` : "#081B45",
                      border: `2px solid ${color}`,
                      borderRadius: 12,
                      cursor: phase === "pick" ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "border-color 0.3s, background 0.3s",
                      animation: isGlow
                        ? "glow-pulse 0.6s ease-in-out infinite"
                        : isDance
                        ? `limbo-dance 0.9s ease-in-out infinite`
                        : "none",
                      animationDelay: isDance ? `${(i % 4) * 0.05}s` : "0s",
                    }}
                  >
                    <span style={{
                      fontSize: 40, fontWeight: 900, lineHeight: 1,
                      color: isGlow ? "#00ff88" : color,
                      fontFamily: "monospace",
                      transition: "color 0.3s",
                    }}>
                      ✕
                    </span>
                  </button>
                );
              })}
            </div>

            {phase === "pick" && (
              <p style={{ color: "#00D9FF", fontSize: 12, marginTop: 24, opacity: 0.6 }}>
                Remember which one glowed green?
              </p>
            )}

            {/* colour legend during pick */}
            {phase === "pick" && (
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 8,
                justifyContent: "center", marginTop: 16, maxWidth: 380,
              }}>
                {colorOrder.current.map((c, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "2px 8px",
                    borderRadius: 99, background: `${c.hex}22`,
                    border: `1px solid ${c.hex}`, color: c.hex,
                  }}>
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WON phase ── */}
        {phase === "won" && (
          <div style={{ textAlign: "center", animation: "won-pop 0.5s ease-out forwards" }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
            <p style={{ color: "#00ff88", fontSize: 28, fontWeight: 800 }}>You got it!</p>
            <p style={{ color: "#00D9FF", fontSize: 14, marginTop: 8, opacity: 0.7 }}>
              Welcome to Xquation.
            </p>
          </div>
        )}

        {/* ── LOST / LOCKOUT phase ── */}
        {phase === "lost" && (
          <div style={{ textAlign: "center", maxWidth: 360 }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: "spin-in 0.6s ease-out forwards" }}>🔒</div>
            <p style={{ color: "#FF2020", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              Wrong X.
            </p>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              You've been locked out.<br />Try again in:
            </p>

            {/* Countdown timer */}
            <div style={{
              fontSize: 52, fontWeight: 900, fontFamily: "monospace",
              color: "#FF2020",
              textShadow: "0 0 20px #FF202066",
              marginBottom: 32,
              letterSpacing: 4,
            }}>
              {fmtTime(timeLeft)}
            </div>

            {/* Owner bypass */}
            {isOwner && (
              <button
                onClick={handleBypass}
                style={{
                  padding: "10px 28px",
                  background: "linear-gradient(135deg, #00D9FF22, #00D9FF11)",
                  border: "2px solid #00D9FF",
                  borderRadius: 8, color: "#00D9FF",
                  fontSize: 14, fontWeight: 700,
                  cursor: "pointer", letterSpacing: 1,
                }}
              >
                ⚡ Owner Override — Bypass Lockout
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
