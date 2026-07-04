import { useState, useEffect, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";

/* ─────────────────────────────── constants ───────────────────────────────── */

const LOCKOUT_KEY = "xqution_limbo_lockout";
const LOCKOUT_MS  = 5 * 60 * 1000;
const DANCE_MS    = 30_000;
const GLOW_MS     = 1_800;
const COUNT       = 8;

// 2-column × 4-row grid — x positions as % of viewport width,
// y positions as % of viewport height
const GRID: Array<{ x: number; y: number }> = [
  { x: 38, y: 20 }, { x: 62, y: 20 },
  { x: 38, y: 36 }, { x: 62, y: 36 },
  { x: 38, y: 52 }, { x: 62, y: 52 },
  { x: 38, y: 68 }, { x: 62, y: 68 },
];

const COLORS = [
  { label: "orange",     hex: "#FF8C00" },
  { label: "lime",       hex: "#39FF14" },
  { label: "green",      hex: "#00BB44" },
  { label: "red",        hex: "#FF2020" },
  { label: "dark blue",  hex: "#2255FF" },
  { label: "light blue", hex: "#00CFFF" },
  { label: "pink",       hex: "#FF69B4" },
  { label: "purple",     hex: "#CC44FF" },
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
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);
    g.gain.setValueAtTime(1.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + 0.4);
  };
  const synth = (freq: number, t: number, dur: number) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = "square"; osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + dur);
  };
  const bass = (freq: number, t: number, dur: number) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = "sawtooth"; osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + dur);
  };

  const BPM = 138; const BEAT = 60 / BPM;
  const now = ctx.currentTime + 0.05;
  const mel = [261, 293, 311, 349, 392, 349, 311, 293];
  const BARS = Math.ceil(DANCE_MS / 1000 / (BEAT * 4)) + 1;
  for (let b = 0; b < BARS * 8; b++) {
    const t = now + b * BEAT;
    kick(t);
    synth(mel[b % mel.length], t, BEAT * 0.85);
    if (b % 4 === 0) bass(mel[b % mel.length] / 2, t, BEAT * 3.8);
  }
  return () => {
    master.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    setTimeout(() => { try { ctx.close(); } catch { /* ok */ } }, 700);
  };
}

/* ────────────────────────────── types ────────────────────────────────────── */

type Phase = "hidden" | "dance" | "pick" | "won" | "lost";
type XPos  = { x: number; y: number };

/* ────────────────────────────── component ────────────────────────────────── */

export function LimboEasterEgg() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [phase,      setPhase]      = useState<Phase>(() => getLockout() ? "lost" : "hidden");
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(() => getLockout());
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [isGlowing,  setIsGlowing]  = useState(false);

  // positions[i] = current screen position of x[i]
  const [positions, setPositions] = useState<XPos[]>(() => GRID.map(g => ({ ...g })));

  // permutation: xSlot[i] = which grid slot x[i] currently occupies
  const xSlot       = useRef<number[]>([0,1,2,3,4,5,6,7]);
  const correctIdx  = useRef(0);          // which x is the correct one
  const colorOrder  = useRef<typeof COLORS>([]);
  const bufRef      = useRef("");
  const stopAudio   = useRef<(() => void) | null>(null);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const danceStartRef = useRef(0);
  const orbitRafRef = useRef(0);
  const orbitAngle  = useRef(0);

  /* ── utils ── */
  const clearSwap = () => {
    if (swapTimerRef.current != null) { clearTimeout(swapTimerRef.current); swapTimerRef.current = null; }
  };

  /* ── keydown trigger ── */
  useEffect(() => {
    if (phase !== "hidden") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.length === 1) bufRef.current += e.key;
      if (bufRef.current.length > 10) bufRef.current = bufRef.current.slice(-10);
      if (bufRef.current.endsWith("/limbo")) {
        bufRef.current = "";
        colorOrder.current = shuffled(COLORS);
        const idx = Math.floor(Math.random() * COUNT);
        correctIdx.current = idx;
        xSlot.current = [0,1,2,3,4,5,6,7];        // reset permutation
        setPositions(GRID.map(g => ({ ...g })));   // reset to grid
        setIsGlowing(false);
        setPhase("dance");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  /* ── dance phase: glow → shuffle → transition to pick ── */
  useEffect(() => {
    if (phase !== "dance") return;

    // Start audio
    try { const ctx = new AudioContext(); stopAudio.current = startLimboAudio(ctx); }
    catch { /* ok */ }

    // Show glow immediately
    setIsGlowing(true);
    danceStartRef.current = Date.now();

    // After glow window, start shuffling
    const glowTimer = setTimeout(() => {
      setIsGlowing(false);
      scheduleNextSwap();
    }, GLOW_MS);

    // After full dance, go to pick
    const endTimer = setTimeout(() => {
      clearSwap();
      stopAudio.current?.(); stopAudio.current = null;
      setPhase("pick");
    }, DANCE_MS);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(endTimer);
      clearSwap();
      stopAudio.current?.(); stopAudio.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── accelerating swap scheduler ── */
  const scheduleNextSwap = () => {
    const elapsed = Date.now() - danceStartRef.current;
    const remaining = DANCE_MS - elapsed;
    if (remaining <= 0) return;

    // delay goes from 550ms at 0% → 130ms at 100% of dance time
    const progress = Math.min(elapsed / DANCE_MS, 1);
    const delay = Math.round(550 - progress * 420);

    swapTimerRef.current = setTimeout(() => {
      // pick two different x indices to swap
      let a = Math.floor(Math.random() * COUNT);
      let b = Math.floor(Math.random() * (COUNT - 1));
      if (b >= a) b++;

      // swap their slots
      const sa = xSlot.current[a];
      const sb = xSlot.current[b];
      xSlot.current[a] = sb;
      xSlot.current[b] = sa;

      // update only the two affected positions
      setPositions(prev => {
        const next = [...prev];
        next[a] = { ...GRID[sb] };
        next[b] = { ...GRID[sa] };
        return next;
      });

      scheduleNextSwap();
    }, delay);
  };

  /* ── pick phase: orbit circle ── */
  useEffect(() => {
    if (phase !== "pick") return;

    // Compute orbit positions from current angle
    const updateOrbit = () => {
      orbitAngle.current += 0.006; // radians per frame ≈ ~1 RPM
      const W = window.innerWidth;
      const H = window.innerHeight;
      const R = Math.min(W, H) * 0.3;
      const cx = W / 2; const cy = H / 2;
      setPositions(
        Array.from({ length: COUNT }, (_, i) => {
          const angle = orbitAngle.current + (i / COUNT) * Math.PI * 2;
          return {
            x: ((cx + R * Math.cos(angle)) / W) * 100,
            y: ((cy + R * Math.sin(angle)) / H) * 100,
          };
        })
      );
      orbitRafRef.current = requestAnimationFrame(updateOrbit);
    };

    orbitRafRef.current = requestAnimationFrame(updateOrbit);
    return () => cancelAnimationFrame(orbitRafRef.current);
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
      if (rem <= 0) { localStorage.removeItem(LOCKOUT_KEY); setPhase("hidden"); setLockoutEnd(null); }
      else { setTimeLeft(Math.ceil(rem / 1000)); }
    };
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [phase, lockoutEnd]);

  /* ── pick handler ── */
  const handlePick = (idx: number) => {
    if (phase !== "pick") return;
    cancelAnimationFrame(orbitRafRef.current);
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
    setPhase("hidden"); setLockoutEnd(null);
  };

  if (phase === "hidden") return null;

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  /* ── render ── */
  return (
    <>
      <style>{`
        @keyframes glow-pulse {
          0%,100% { text-shadow: 0 0 10px #00ff88, 0 0 32px #00ff88; color: #00ff88; }
          50%      { text-shadow: 0 0 32px #00ff88, 0 0 80px #00ff88; color: #afffdd; }
        }
        @keyframes won-pop {
          0%   { transform: scale(0.7) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);   opacity: 1; }
        }
        @keyframes spin-in {
          from { transform: rotate(-180deg) scale(0); opacity: 0; }
          to   { transform: rotate(0deg)   scale(1); opacity: 1; }
        }
        .lx-btn {
          position: absolute;
          transform: translate(-50%, -50%);
          background: transparent;
          border: none;
          padding: 0;
          outline: none;
          cursor: default;
        }
        .lx-btn.pickable { cursor: pointer; }
        .lx-btn.pickable:hover .lx-char { filter: brightness(1.5) drop-shadow(0 0 12px currentColor); }
        .lx-char {
          display: block;
          font-size: 72px;
          font-weight: 900;
          font-style: italic;
          font-family: 'Times New Roman', Georgia, serif;
          line-height: 1;
          user-select: none;
          transition: color 0.4s, text-shadow 0.4s;
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(2,11,36,0.97)",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
      }}>

        {/* ── floating x's (dance + pick) ── */}
        {(phase === "dance" || phase === "pick") && (
          <>
            <p style={{
              position: "absolute", top: 20, left: "50%",
              transform: "translateX(-50%)",
              margin: 0, zIndex: 2,
              color: "#00D9FF", fontSize: 13,
              letterSpacing: 4, textTransform: "uppercase",
              opacity: 0.8, whiteSpace: "nowrap",
            }}>
              {phase === "dance"
                ? (isGlowing ? "Watch closely…" : "Keep your eyes on it!")
                : "Pick the x"}
            </p>

            {Array.from({ length: COUNT }).map((_, i) => {
              const isGlow  = phase === "dance" && isGlowing && i === correctIdx.current;
              const color   = phase === "pick"
                ? (colorOrder.current[i]?.hex ?? "#00D9FF")
                : "#00D9FF";
              const pos     = positions[i] ?? { x: 50, y: 50 };
              // swap transition only during dance phase
              const transition = phase === "dance"
                ? "left 0.35s cubic-bezier(.4,0,.2,1), top 0.35s cubic-bezier(.4,0,.2,1)"
                : "none";

              return (
                <button
                  key={i}
                  className={`lx-btn${phase === "pick" ? " pickable" : ""}`}
                  onClick={() => handlePick(i)}
                  disabled={phase === "dance"}
                  style={{
                    left: `${pos.x}%`, top: `${pos.y}%`,
                    transition,
                    animation: isGlow ? "glow-pulse 0.55s ease-in-out infinite" : "none",
                  }}
                >
                  <span
                    className="lx-char"
                    style={{
                      color: isGlow ? "#00ff88" : color,
                      textShadow: isGlow
                        ? undefined
                        : phase === "pick"
                          ? `0 0 20px ${color}aa`
                          : `0 0 10px ${color}55`,
                    }}
                  >
                    𝑥
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* ── won ── */}
        {phase === "won" && (
          <div style={{
            position:"absolute", inset:0,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            textAlign:"center",
            animation:"won-pop 0.5s ease-out forwards",
          }}>
            <div style={{ fontSize:72, marginBottom:16 }}>🎉</div>
            <p style={{ color:"#00ff88", fontSize:28, fontWeight:800, margin:0 }}>You got it!</p>
            <p style={{ color:"#00D9FF", fontSize:14, marginTop:8, opacity:0.7 }}>Welcome to Xquation.</p>
          </div>
        )}

        {/* ── lockout ── */}
        {phase === "lost" && (
          <div style={{
            position:"absolute", inset:0,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            textAlign:"center",
          }}>
            <div style={{ fontSize:64, marginBottom:16, animation:"spin-in 0.6s ease-out forwards" }}>🔒</div>
            <p style={{ color:"#FF2020", fontSize:24, fontWeight:800, margin:0 }}>Wrong x.</p>
            <p style={{ color:"#aaa", fontSize:14, margin:"12px 0 32px", lineHeight:1.6 }}>
              You've been locked out.<br />Try again in:
            </p>
            <div style={{
              fontSize:52, fontWeight:900, fontFamily:"monospace",
              color:"#FF2020", textShadow:"0 0 20px #FF202066",
              marginBottom:32, letterSpacing:4,
            }}>
              {fmtTime(timeLeft)}
            </div>
            {isOwner && (
              <button
                onClick={handleBypass}
                style={{
                  padding:"10px 28px",
                  background:"linear-gradient(135deg,#00D9FF22,#00D9FF11)",
                  border:"2px solid #00D9FF", borderRadius:8,
                  color:"#00D9FF", fontSize:14, fontWeight:700,
                  cursor:"pointer", letterSpacing:1,
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
