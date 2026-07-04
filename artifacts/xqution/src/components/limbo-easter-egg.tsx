import { useState, useEffect, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";

/* ─────────────────────────────── constants ───────────────────────────────── */

const LOCKOUT_KEY = "xqution_limbo_lockout";
const LOCKOUT_MS  = 5 * 60 * 1000;
const DANCE_MS    = 30_000;
const GLOW_MS     = 1_800;

const COLORS = [
  { label: "orange",     hex: "#FF8C00" },
  { label: "lime",       hex: "#32FF32" },
  { label: "green",      hex: "#00BB00" },
  { label: "red",        hex: "#FF2020" },
  { label: "dark blue",  hex: "#0055CC" },
  { label: "light blue", hex: "#00BFFF" },
  { label: "pink",       hex: "#FF69B4" },
  { label: "purple",     hex: "#9400D3" },
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
  const mel  = [261, 293, 311, 349, 392, 349, 311, 293];
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

/* ────────────────────────────── component ────────────────────────────────── */

type Phase = "hidden" | "dance" | "pick" | "won" | "lost";
interface Particle { x: number; y: number; vx: number; vy: number; }

export function LimboEasterEgg() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [phase,      setPhase]      = useState<Phase>(() => getLockout() ? "lost" : "hidden");
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(() => getLockout());
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [isGlowing,  setIsGlowing]  = useState(false);
  const [dancing,    setDancing]    = useState(false);
  // final positions captured when dance ends, used for click targets in pick phase
  const [pickPositions, setPickPositions] = useState<Array<{ x: number; y: number }>>([]);

  const correctIdx  = useRef(0);
  const glowIdx     = useRef(0);
  const colorOrder  = useRef<typeof COLORS>([]);
  const bufRef      = useRef("");
  const stopAudio   = useRef<(() => void) | null>(null);

  // animation state (no re-render needed — DOM mutated directly)
  const posRef      = useRef<Particle[]>([]);
  const xBtnRefs    = useRef<Array<HTMLButtonElement | null>>(Array(8).fill(null));
  const rafRef      = useRef(0);
  const frozenRef   = useRef(false);
  const dancingRef  = useRef(false);

  useEffect(() => { dancingRef.current = dancing; }, [dancing]);

  /* ── keydown trigger ── */
  useEffect(() => {
    if (phase !== "hidden") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.length === 1) bufRef.current += e.key;
      if (bufRef.current.length > 10) bufRef.current = bufRef.current.slice(-10);
      if (bufRef.current.endsWith("/limbo")) {
        bufRef.current = "";
        const idx = Math.floor(Math.random() * 8);
        correctIdx.current = idx;
        glowIdx.current    = idx;
        colorOrder.current = shuffled(COLORS);
        frozenRef.current  = false;
        setPickPositions([]);
        setPhase("dance");
        setIsGlowing(false);
        setDancing(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  /* ── RAF animation: x's drift freely around screen ── */
  useEffect(() => {
    if (phase !== "dance") return;

    // Scatter them randomly across the viewport to start
    posRef.current = Array.from({ length: 8 }, (_, i) => {
      const angle  = (i / 8) * Math.PI * 2 + Math.random() * 0.8;
      const radius = 0.18 + Math.random() * 0.22;
      const vAngle = Math.random() * Math.PI * 2;
      const speed  = 0.055 + Math.random() * 0.055;
      return {
        x:  50 + Math.cos(angle) * radius * 80,
        y:  50 + Math.sin(angle) * radius * 44,
        vx: Math.cos(vAngle) * speed,
        vy: Math.sin(vAngle) * speed,
      };
    });

    const animate = () => {
      if (frozenRef.current) return;
      const spd = dancingRef.current ? 1 : 0.3;

      posRef.current = posRef.current.map((p, i) => {
        let { x, y, vx, vy } = p;
        // gentle individual wobble so they don't all clump
        vx += (Math.random() - 0.5) * 0.004 * (dancingRef.current ? 1 : 0.2);
        vy += (Math.random() - 0.5) * 0.004 * (dancingRef.current ? 1 : 0.2);
        // cap speed
        const maxSpd = dancingRef.current ? 0.22 : 0.07;
        const len = Math.sqrt(vx * vx + vy * vy);
        if (len > maxSpd) { vx = (vx / len) * maxSpd; vy = (vy / len) * maxSpd; }

        x += vx * spd;
        y += vy * spd;

        // bounce off edges (leave margin for element size)
        if (x < 6  || x > 88) { vx = -vx; x = Math.max(6,  Math.min(88, x)); }
        if (y < 10 || y > 82) { vy = -vy; y = Math.max(10, Math.min(82, y)); }

        // slight repulsion between neighbours so they spread out
        posRef.current.forEach((q, j) => {
          if (j === i) return;
          const dx = x - q.x, dy = y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 100 && d2 > 0.01) {
            const f = 0.006 / Math.sqrt(d2);
            vx += dx * f; vy += dy * f;
          }
        });

        return { x, y, vx, vy };
      });

      // Write directly to DOM (avoid React re-render overhead)
      xBtnRefs.current.forEach((el, i) => {
        const p = posRef.current[i];
        if (el && p) {
          el.style.left = `${p.x}%`;
          el.style.top  = `${p.y}%`;
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  /* ── dance phase orchestration ── */
  useEffect(() => {
    if (phase !== "dance") return;

    setIsGlowing(true);

    try {
      const ctx = new AudioContext();
      stopAudio.current = startLimboAudio(ctx);
    } catch { /* browser may block */ }

    const glowTimer  = setTimeout(() => { setIsGlowing(false); setDancing(true); }, GLOW_MS);

    const danceTimer = setTimeout(() => {
      // Freeze positions — capture them for pick-phase click targets
      frozenRef.current = true;
      const frozen = posRef.current.map(p => ({ x: p.x, y: p.y }));
      setPickPositions(frozen);
      stopAudio.current?.();
      stopAudio.current = null;
      setDancing(false);
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

  /* ── handlers ── */
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

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── render ── */
  return (
    <>
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 8px #00ff88, 0 0 24px #00ff88; color: #00ff88; }
          50%       { text-shadow: 0 0 28px #00ff88, 0 0 64px #00ff88; color: #88ffcc; }
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
        .lx {
          font-size: 68px;
          font-weight: 900;
          font-style: italic;
          font-family: 'Times New Roman', Georgia, serif;
          line-height: 1;
          user-select: none;
          display: block;
          transition: color 0.3s, text-shadow 0.3s;
        }
        .lx-btn {
          position: absolute;
          transform: translate(-50%, -50%);
          background: transparent;
          border: none;
          padding: 0;
          outline: none;
        }
        .lx-btn.pickable { cursor: pointer; }
        .lx-btn.pickable:hover .lx { filter: brightness(1.4); }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(2,11,36,0.97)",
        backdropFilter: "blur(8px)",
        overflow: "hidden",
      }}>

        {/* ── floating x's ── */}
        {(phase === "dance" || phase === "pick") && (
          <>
            <p style={{
              position: "absolute", top: 24, left: "50%",
              transform: "translateX(-50%)",
              color: "#00D9FF", fontSize: 13, letterSpacing: 4,
              textTransform: "uppercase", opacity: 0.8,
              margin: 0, zIndex: 2, whiteSpace: "nowrap",
            }}>
              {phase === "dance"
                ? (dancing ? "🕺 Do the limbo!" : "Watch closely...")
                : "Pick the x"}
            </p>

            {Array.from({ length: 8 }).map((_, i) => {
              const isGlow = phase === "dance" && isGlowing && i === glowIdx.current;
              const color  = phase === "pick"
                ? (colorOrder.current[i]?.hex ?? "#00D9FF")
                : "#00D9FF";
              const pos    = phase === "pick" ? pickPositions[i] : null;

              return (
                <button
                  key={i}
                  ref={el => { xBtnRefs.current[i] = el; }}
                  className={`lx-btn${phase === "pick" ? " pickable" : ""}`}
                  onClick={() => handlePick(i)}
                  disabled={phase === "dance"}
                  style={{
                    left: pos ? `${pos.x}%` : "50%",
                    top:  pos ? `${pos.y}%` : "50%",
                    animation: isGlow ? "glow-pulse 0.6s ease-in-out infinite" : "none",
                  }}
                >
                  <span
                    className="lx"
                    style={{
                      color: isGlow ? "#00ff88" : color,
                      textShadow: isGlow
                        ? undefined
                        : phase === "pick"
                          ? `0 0 18px ${color}99`
                          : `0 0 8px ${color}55`,
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
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center",
            animation: "won-pop 0.5s ease-out forwards",
          }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
            <p style={{ color: "#00ff88", fontSize: 28, fontWeight: 800, margin: 0 }}>You got it!</p>
            <p style={{ color: "#00D9FF", fontSize: 14, marginTop: 8, opacity: 0.7 }}>
              Welcome to Xquation.
            </p>
          </div>
        )}

        {/* ── lockout ── */}
        {phase === "lost" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16, animation: "spin-in 0.6s ease-out forwards" }}>🔒</div>
            <p style={{ color: "#FF2020", fontSize: 24, fontWeight: 800, marginBottom: 8, margin: 0 }}>
              Wrong x.
            </p>
            <p style={{ color: "#aaa", fontSize: 14, margin: "12px 0 32px", lineHeight: 1.6 }}>
              You've been locked out.<br />Try again in:
            </p>
            <div style={{
              fontSize: 52, fontWeight: 900, fontFamily: "monospace",
              color: "#FF2020", textShadow: "0 0 20px #FF202066",
              marginBottom: 32, letterSpacing: 4,
            }}>
              {fmtTime(timeLeft)}
            </div>
            {isOwner && (
              <button
                onClick={handleBypass}
                style={{
                  padding: "10px 28px",
                  background: "linear-gradient(135deg, #00D9FF22, #00D9FF11)",
                  border: "2px solid #00D9FF", borderRadius: 8,
                  color: "#00D9FF", fontSize: 14, fontWeight: 700,
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
