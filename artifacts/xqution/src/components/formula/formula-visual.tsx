import { useState, useEffect, useRef, type JSX } from "react";

// ── Color palette ─────────────────────────────────────────────────────────────
const VAR = "#00BFFF";
const CON = "#FFD700";
const ANS = "#FFFFFF";
const ACC = "#00D9FF";
const PUR = "#A855F7";
const GR  = "rgba(0,191,255,0.08)";
const BG  = "#050F2A";

// ── Animation hook ────────────────────────────────────────────────────────────
function useT() {
  const [t, setT] = useState(0);
  const raf = useRef<number>(0);
  const t0  = useRef<number | null>(null);
  useEffect(() => {
    const tick = (ts: number) => {
      if (!t0.current) t0.current = ts;
      setT((ts - t0.current) / 1000);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);
  return t;
}

// ── Mini slider ───────────────────────────────────────────────────────────────
function S({ label, val, min, max, step = 0.1, set, unit = "", color = VAR }: {
  label: string; val: number; min: number; max: number;
  step?: number; set: (v: number) => void; unit?: string; color?: string;
}) {
  return (
    <div className="flex items-center gap-2" style={{ fontSize: 10, fontFamily: "monospace" }}>
      <span style={{ color, width: 70, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(+e.target.value)}
        style={{ flex: 1, height: 3, accentColor: ACC, cursor: "pointer" }} />
      <span style={{ color: "rgba(255,255,255,0.5)", width: 42, textAlign: "right" }}>
        {val % 1 === 0 ? val : val.toFixed(1)}{unit}
      </span>
    </div>
  );
}

// ── SVG background grid ───────────────────────────────────────────────────────
function Grid({ W = 280, H = 160 }: { W?: number; H?: number }) {
  const xs = [W * 0.25, W * 0.5, W * 0.75];
  const ys = [H * 0.25, H * 0.5, H * 0.75];
  return (
    <>
      {xs.map(x => <line key={x} x1={x} y1={0} x2={x} y2={H} stroke={GR} strokeWidth={1} />)}
      {ys.map(y => <line key={y} x1={0} y1={y} x2={W} y2={y} stroke={GR} strokeWidth={1} />)}
    </>
  );
}

// ── Wrapper ───────────────────────────────────────────────────────────────────
function Wrap({ children, result }: { children: React.ReactNode; result?: string }) {
  return (
    <div style={{ width: 280, flexShrink: 0, background: BG, borderRadius: 12,
      border: "1px solid rgba(0,191,255,0.2)", overflow: "hidden" }}>
      {children}
      {result && (
        <div style={{ padding: "2px 12px 8px", fontSize: 11, fontFamily: "monospace",
          textAlign: "center", color: ANS }}>
          = {result}
        </div>
      )}
    </div>
  );
}

function Controls({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "6px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 1 — v = v₀ + at  (v-t graph)
// ═══════════════════════════════════════════════════════════════════════════════
function V1() {
  const [a, setA] = useState(3);
  const [t, setT] = useState(4);
  const v0 = 2;
  const v = v0 + a * t;
  const W = 280; const H = 155;
  const pad = 30;
  const maxT = 10; const maxV = 40;
  const sx = (tv: number) => pad + (tv / maxT) * (W - pad - 10);
  const sy = (vv: number) => H - pad - (vv / maxV) * (H - pad - 10);
  const x1 = sx(0); const y1 = sy(v0);
  const x2 = sx(maxT); const y2 = sy(v0 + a * maxT);
  const dotX = sx(t); const dotY = sy(v);
  return (
    <Wrap result={`v = ${v.toFixed(1)} m/s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* Axes */}
        <line x1={pad} y1={10} x2={pad} y2={H - pad + 5} stroke={ACC} strokeWidth={1.5} />
        <line x1={pad - 5} y1={H - pad} x2={W - 10} y2={H - pad} stroke={ACC} strokeWidth={1.5} />
        <text x={pad - 8} y={14} fill={ANS} fontSize={9} textAnchor="middle">v</text>
        <text x={W - 8} y={H - pad + 3} fill={ANS} fontSize={9}>t</text>
        {/* Graph line */}
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={VAR} strokeWidth={2} />
        {/* v₀ marker */}
        <circle cx={x1} cy={y1} r={3} fill={CON} />
        <text x={x1 + 5} y={y1 - 4} fill={CON} fontSize={8}>v₀={v0}</text>
        {/* Current point */}
        <circle cx={dotX} cy={dotY} r={5} fill={ANS} stroke={ACC} strokeWidth={2} />
        <line x1={dotX} y1={dotY} x2={dotX} y2={H - pad} stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 2" />
        <text x={dotX + 6} y={dotY - 4} fill={ANS} fontSize={9}>{v.toFixed(0)}</text>
      </svg>
      <Controls>
        <S label="a (m/s²)" val={a} min={0} max={8} step={0.5} set={setA} />
        <S label="t (s)"    val={t} min={0} max={10} step={0.5} set={setT} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 2 — x = v₀t + ½at²  (x-t parabola)
// ═══════════════════════════════════════════════════════════════════════════════
function V2() {
  const [v0, setV0] = useState(5);
  const [a, setA]   = useState(2);
  const W = 280; const H = 155; const pad = 30;
  const maxT = 8; const maxX = 100;
  const sx = (tv: number) => pad + (tv / maxT) * (W - pad - 10);
  const sy = (xv: number) => H - pad - Math.min(xv / maxX, 1) * (H - pad - 10);
  const pts = Array.from({ length: 41 }, (_, i) => {
    const tv = (i / 40) * maxT;
    return `${sx(tv)},${sy(v0 * tv + 0.5 * a * tv * tv)}`;
  }).join(" ");
  const tEnd = maxT;
  const xEnd = v0 * tEnd + 0.5 * a * tEnd * tEnd;
  return (
    <Wrap result={`x = ${(v0 * 5 + 0.5 * a * 25).toFixed(1)} m at t=5s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        <line x1={pad} y1={10} x2={pad} y2={H - pad + 5} stroke={ACC} strokeWidth={1.5} />
        <line x1={pad - 5} y1={H - pad} x2={W - 10} y2={H - pad} stroke={ACC} strokeWidth={1.5} />
        <text x={pad - 8} y={14} fill={ANS} fontSize={9} textAnchor="middle">x</text>
        <text x={W - 8} y={H - pad + 3} fill={ANS} fontSize={9}>t</text>
        <polyline points={pts} fill="none" stroke={VAR} strokeWidth={2} />
        {/* Ball at t=5 */}
        {(() => { const tv = 5; const xv = v0 * tv + 0.5 * a * tv * tv;
          return <circle cx={sx(tv)} cy={sy(xv)} r={5} fill={ANS} stroke={ACC} strokeWidth={2} />; })()}
      </svg>
      <Controls>
        <S label="v₀ (m/s)" val={v0} min={0} max={15} step={0.5} set={setV0} color={CON} />
        <S label="a (m/s²)" val={a}  min={0} max={8}  step={0.5} set={setA} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 3 — v² = v₀² + 2ax
// ═══════════════════════════════════════════════════════════════════════════════
function V3() {
  const [a, setA] = useState(3);
  const [x, setX] = useState(5);
  const v0 = 2;
  const v2 = Math.max(0, v0 * v0 + 2 * a * x);
  const v  = Math.sqrt(v2);
  const W = 280; const H = 155; const pad = 30;
  const maxX = 15; const maxV2 = 200;
  const sx = (xv: number) => pad + (xv / maxX) * (W - pad - 10);
  const sy = (vv2: number) => H - pad - Math.min(vv2 / maxV2, 1) * (H - pad - 10);
  const pts = Array.from({ length: 31 }, (_, i) => {
    const xv = (i / 30) * maxX;
    const vv2 = Math.max(0, v0 * v0 + 2 * a * xv);
    return `${sx(xv)},${sy(vv2)}`;
  }).join(" ");
  return (
    <Wrap result={`v = ${v.toFixed(2)} m/s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        <line x1={pad} y1={10} x2={pad} y2={H - pad + 5} stroke={ACC} strokeWidth={1.5} />
        <line x1={pad - 5} y1={H - pad} x2={W - 10} y2={H - pad} stroke={ACC} strokeWidth={1.5} />
        <text x={pad - 8} y={14} fill={ANS} fontSize={8} textAnchor="middle">v²</text>
        <text x={W - 8} y={H - pad + 3} fill={ANS} fontSize={9}>x</text>
        <polyline points={pts} fill="none" stroke={VAR} strokeWidth={2} />
        <circle cx={sx(x)} cy={sy(v2)} r={5} fill={ANS} stroke={ACC} strokeWidth={2} />
        <line x1={sx(x)} y1={sy(v2)} x2={sx(x)} y2={H - pad} stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 2" />
        <text x={sx(x) + 6} y={sy(v2) - 4} fill={ANS} fontSize={9}>{v2.toFixed(0)}</text>
      </svg>
      <Controls>
        <S label="a (m/s²)" val={a} min={0.5} max={10} step={0.5} set={setA} />
        <S label="x (m)"    val={x} min={0}   max={15} step={0.5} set={setX} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 4 — F = ma  (force arrow on block)
// ═══════════════════════════════════════════════════════════════════════════════
function V4() {
  const [m, setM] = useState(5);
  const [a, setA] = useState(3);
  const F = m * a;
  const W = 280; const H = 140;
  const cx = 100; const cy = 80;
  const bw = 20 + m * 4; const bh = 20 + m * 3;
  const arrowLen = Math.min(F * 2, 110);
  return (
    <Wrap result={`F = ${F.toFixed(1)} N`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* Ground */}
        <line x1={0} y1={H - 20} x2={W} y2={H - 20} stroke={GR} strokeWidth={2} />
        {/* Block */}
        <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh}
          fill="rgba(0,191,255,0.15)" stroke={VAR} strokeWidth={1.5} rx={3} />
        <text x={cx} y={cy + 4} fill={VAR} fontSize={11} textAnchor="middle" fontWeight="bold">m={m}</text>
        {/* Force arrow */}
        <defs>
          <marker id="arrowF" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={ANS} />
          </marker>
        </defs>
        <line x1={cx + bw / 2} y1={cy} x2={cx + bw / 2 + arrowLen} y2={cy}
          stroke={ANS} strokeWidth={2.5} markerEnd="url(#arrowF)" />
        {/* Labels */}
        <text x={cx + bw / 2 + arrowLen / 2} y={cy - 8} fill={ANS} fontSize={10} textAnchor="middle">
          F = {F.toFixed(0)} N
        </text>
        <text x={cx + bw / 2 + arrowLen / 2} y={cy + 18} fill={ACC} fontSize={8} textAnchor="middle">
          a = {a} m/s²
        </text>
      </svg>
      <Controls>
        <S label="m (kg)"   val={m} min={1} max={10} step={0.5} set={setM} color={VAR} />
        <S label="a (m/s²)" val={a} min={0} max={10} step={0.5} set={setA} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 5 — W = mg  (hanging weight)
// ═══════════════════════════════════════════════════════════════════════════════
function V5() {
  const [m, setM] = useState(5);
  const g = 9.81;
  const W_val = m * g;
  const W = 280; const H = 140;
  const springLen = 30 + m * 4;
  const cx = 140;
  const boxY = 8 + springLen;
  return (
    <Wrap result={`W = ${W_val.toFixed(1)} N`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Ceiling */}
        <rect x={80} y={0} width={120} height={8} fill={GR} />
        {/* Spring */}
        {Array.from({ length: 6 }, (_, i) => {
          const y0 = 8 + (i * springLen) / 6;
          const y1 = 8 + ((i + 1) * springLen) / 6;
          const xOff = i % 2 === 0 ? 8 : -8;
          return <line key={i} x1={cx + (i % 2 === 0 ? 0 : xOff)} y1={y0} x2={cx + ((i + 1) % 2 === 0 ? 0 : xOff)} y2={y1} stroke={ACC} strokeWidth={1.5} />;
        })}
        <line x1={cx} y1={8} x2={cx} y2={12} stroke={ACC} strokeWidth={1.5} />
        {/* Weight block */}
        <rect x={cx - 20} y={boxY} width={40} height={30 + m * 2}
          fill="rgba(0,191,255,0.2)" stroke={VAR} strokeWidth={2} rx={4} />
        <text x={cx} y={8 + springLen + 18 + m} fill={VAR} fontSize={11} textAnchor="middle">
          m={m} kg
        </text>
        {/* Down arrow */}
        <defs>
          <marker id="arrowW" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={ANS} />
          </marker>
        </defs>
        <line x1={cx} y1={8 + springLen + 30 + m * 2} x2={cx} y2={H - 5}
          stroke={ANS} strokeWidth={2} markerEnd="url(#arrowW)" />
        <text x={cx + 8} y={H - 15} fill={ANS} fontSize={9}>{W_val.toFixed(1)} N</text>
        {/* g label */}
        <text x={20} y={H - 5} fill={CON} fontSize={9}>g = {g}</text>
      </svg>
      <Controls>
        <S label="m (kg)" val={m} min={1} max={15} step={0.5} set={setM} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 6 — KE = ½mv²  (ball + energy bar)
// ═══════════════════════════════════════════════════════════════════════════════
function V6() {
  const [m, setM] = useState(3);
  const [v, setV] = useState(5);
  const KE = 0.5 * m * v * v;
  const maxKE = 200;
  const barFrac = Math.min(KE / maxKE, 1);
  const W = 280; const H = 140;
  const ballR = 6 + m * 1.5;
  return (
    <Wrap result={`KE = ${KE.toFixed(1)} J`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* Ground */}
        <line x1={0} y1={H - 20} x2={200} y2={H - 20} stroke={GR} strokeWidth={2} />
        {/* Ball */}
        <circle cx={80} cy={H - 20 - ballR} r={ballR} fill="rgba(0,191,255,0.3)" stroke={VAR} strokeWidth={2} />
        {/* Velocity arrow */}
        <defs><marker id="arrowKE" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={VAR} /></marker></defs>
        <line x1={80 + ballR} y1={H - 20 - ballR} x2={80 + ballR + v * 5} y2={H - 20 - ballR}
          stroke={VAR} strokeWidth={2} markerEnd="url(#arrowKE)" />
        <text x={80 + ballR + v * 2.5} y={H - 20 - ballR - 6} fill={VAR} fontSize={8} textAnchor="middle">
          v={v}m/s
        </text>
        {/* KE bar */}
        <rect x={210} y={20} width={20} height={H - 40} fill={GR} rx={3} />
        <rect x={210} y={20 + (H - 40) * (1 - barFrac)} width={20} height={(H - 40) * barFrac}
          fill={ACC} rx={3} />
        <text x={220} y={15} fill={ACC} fontSize={8} textAnchor="middle">KE</text>
        <text x={220} y={H - 5} fill={ANS} fontSize={7} textAnchor="middle">{KE.toFixed(0)}J</text>
      </svg>
      <Controls>
        <S label="m (kg)"  val={m} min={0.5} max={10} step={0.5} set={setM} color={VAR} />
        <S label="v (m/s)" val={v} min={0}   max={10} step={0.5} set={setV} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 7 — PE = mgh  (ball at height, energy split bars)
// ═══════════════════════════════════════════════════════════════════════════════
function V7() {
  const [h, setH] = useState(8);
  const [m, setM] = useState(3);
  const g = 9.81;
  const PE = m * g * h;
  const maxE = 500;
  const frac = Math.min(PE / maxE, 1);
  const W = 280; const H = 150;
  const ballY = Math.max(H - 15 - h * 10, 20);
  return (
    <Wrap result={`PE = ${PE.toFixed(1)} J`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* Ground */}
        <line x1={20} y1={H - 15} x2={210} y2={H - 15} stroke={GR} strokeWidth={2} />
        {/* Height line */}
        <line x1={60} y1={ballY} x2={60} y2={H - 15} stroke={CON} strokeWidth={1} strokeDasharray="3 2" />
        <text x={45} y={(ballY + H - 15) / 2 + 3} fill={CON} fontSize={9} textAnchor="middle">h={h}m</text>
        {/* Ball */}
        <circle cx={60} cy={Math.max(H - 15 - h * 10, 25)} r={10} fill="rgba(0,191,255,0.3)" stroke={VAR} strokeWidth={2} />
        {/* PE bar */}
        <rect x={200} y={20} width={24} height={H - 40} fill={GR} rx={3} />
        <rect x={200} y={20 + (H - 40) * (1 - frac)} width={24} height={(H - 40) * frac}
          fill={CON} rx={3} />
        <text x={212} y={15} fill={CON} fontSize={8} textAnchor="middle">PE</text>
        <text x={212} y={H - 5} fill={ANS} fontSize={7} textAnchor="middle">{PE.toFixed(0)}J</text>
        <text x={130} y={H - 5} fill={CON} fontSize={8}>g={g} m/s²</text>
      </svg>
      <Controls>
        <S label="m (kg)" val={m} min={0.5} max={10} step={0.5} set={setM} color={VAR} />
        <S label="h (m)"  val={h} min={0}   max={12} step={0.5} set={setH} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 8 — W = Fd cosθ  (force vector at angle)
// ═══════════════════════════════════════════════════════════════════════════════
function V8() {
  const [F, setF] = useState(10);
  const [theta, setTheta] = useState(30);
  const rad = (theta * Math.PI) / 180;
  const Work = F * 5 * Math.cos(rad);
  const W = 280; const H = 150;
  const ox = 60; const oy = H - 30;
  const arrowLen = F * 5;
  const ax = ox + arrowLen * Math.cos(-rad);
  const ay = oy + arrowLen * Math.sin(-rad);
  const horizLen = F * Math.cos(rad) * 5;
  return (
    <Wrap result={`W = ${Work.toFixed(1)} J`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* Ground */}
        <line x1={0} y1={oy} x2={W} y2={oy} stroke={GR} strokeWidth={2} />
        {/* Block */}
        <rect x={ox - 15} y={oy - 20} width={30} height={20} fill="rgba(0,191,255,0.15)" stroke={VAR} strokeWidth={1.5} rx={2} />
        {/* Horizontal component */}
        <line x1={ox} y1={oy - 10} x2={ox + horizLen} y2={oy - 10}
          stroke={ANS} strokeWidth={1.5} strokeDasharray="4 2" />
        {/* Force arrow */}
        <defs><marker id="arrowFd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={PUR} /></marker></defs>
        <line x1={ox} y1={oy - 10} x2={ax} y2={ay}
          stroke={PUR} strokeWidth={2.5} markerEnd="url(#arrowFd)" />
        {/* Angle arc */}
        <path d={`M${ox + 25},${oy - 10} A25,25 0 0,1 ${ox + 25 * Math.cos(rad)},${oy - 10 - 25 * Math.sin(rad)}`}
          fill="none" stroke={CON} strokeWidth={1.5} />
        <text x={ox + 32} y={oy - 18} fill={CON} fontSize={9}>θ={theta}°</text>
        <text x={ax + 5} y={ay - 4} fill={PUR} fontSize={9}>F={F}N</text>
        <text x={ox + horizLen / 2} y={oy - 16} fill={ANS} fontSize={8} textAnchor="middle">Fcosθ</text>
      </svg>
      <Controls>
        <S label="F (N)" val={F}     min={1}  max={20} step={0.5} set={setF} color={PUR} />
        <S label="θ (°)" val={theta} min={0}  max={85} step={1}   set={setTheta} color={CON} unit="°" />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 9 — P = W/t  (power gauge)
// ═══════════════════════════════════════════════════════════════════════════════
function V9() {
  const [Wk, setWk] = useState(400);
  const [t, setT]   = useState(4);
  const P = Wk / t;
  const maxP = 200;
  const frac = Math.min(P / maxP, 1);
  const angle = -Math.PI * 0.8 + frac * Math.PI * 1.6;
  const cx = 140; const cy = 95; const r = 60;
  const nx = cx + r * Math.cos(angle);
  const ny = cy + r * Math.sin(angle);
  const W = 280; const H = 150;
  return (
    <Wrap result={`P = ${P.toFixed(1)} W`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Gauge background arc */}
        <path d={`M${cx - r},${cy} A${r},${r} 0 1,1 ${cx + r},${cy}`}
          fill="none" stroke={GR} strokeWidth={10} />
        {/* Colored arc */}
        {frac > 0 && (() => {
          const startA = -Math.PI * 0.8;
          const endA = angle;
          const sx = cx + r * Math.cos(startA);
          const sy = cy + r * Math.sin(startA);
          const largeArc = (endA - startA) > Math.PI ? 1 : 0;
          return (
            <path d={`M${sx},${sy} A${r},${r} 0 ${largeArc},1 ${nx},${ny}`}
              fill="none" stroke={ACC} strokeWidth={10} strokeLinecap="round" />
          );
        })()}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={ANS} strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={5} fill={ACC} />
        {/* Labels */}
        <text x={cx} y={cy + 25} fill={ANS} fontSize={14} textAnchor="middle" fontWeight="bold">
          {P.toFixed(0)} W
        </text>
        <text x={cx - r - 8} y={cy + 8} fill={GR} fontSize={8}>0</text>
        <text x={cx + r + 2} y={cy + 8} fill={GR} fontSize={8}>{maxP}</text>
        <text x={cx} y={H - 5} fill="rgba(255,255,255,0.3)" fontSize={8} textAnchor="middle">Power (watts)</text>
      </svg>
      <Controls>
        <S label="W (J)" val={Wk} min={10} max={800} step={10} set={setWk} color={VAR} />
        <S label="t (s)" val={t}  min={0.5} max={10} step={0.5} set={setT} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 10 — p = mv  (momentum arrow)
// ═══════════════════════════════════════════════════════════════════════════════
function V10() {
  const [m, setM] = useState(4);
  const [v, setV] = useState(5);
  const p = m * v;
  const W = 280; const H = 130;
  const r = 10 + m * 2.5;
  const cx = 70; const cy = 70;
  const arrowLen = Math.min(p * 2.5, 160);
  return (
    <Wrap result={`p = ${p.toFixed(1)} kg·m/s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* Object */}
        <circle cx={cx} cy={cy} r={r} fill="rgba(0,191,255,0.25)" stroke={VAR} strokeWidth={2} />
        <text x={cx} y={cy + 4} fill={VAR} fontSize={9} textAnchor="middle">m={m}</text>
        {/* Speed lines */}
        {[-1, 0, 1].map(off => (
          <line key={off} x1={cx - r} y1={cy + off * 8} x2={cx - r - 12} y2={cy + off * 8}
            stroke={VAR} strokeWidth={1} strokeOpacity={0.4} />
        ))}
        {/* Momentum arrow */}
        <defs><marker id="arrowP" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={ANS} /></marker></defs>
        <line x1={cx + r} y1={cy} x2={cx + r + arrowLen} y2={cy}
          stroke={ANS} strokeWidth={3} markerEnd="url(#arrowP)" />
        <text x={cx + r + arrowLen / 2} y={cy - 10} fill={ANS} fontSize={9} textAnchor="middle">
          p = {p.toFixed(0)} kg·m/s
        </text>
        <text x={cx + r + arrowLen / 2} y={cy + 18} fill={VAR} fontSize={8} textAnchor="middle">
          v = {v} m/s →
        </text>
      </svg>
      <Controls>
        <S label="m (kg)"  val={m} min={0.5} max={10} step={0.5} set={setM} color={VAR} />
        <S label="v (m/s)" val={v} min={0}   max={10} step={0.5} set={setV} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 11 — J = FΔt  (force-time rectangle = impulse)
// ═══════════════════════════════════════════════════════════════════════════════
function V11() {
  const [F, setF] = useState(8);
  const [dt, setDt] = useState(3);
  const J = F * dt;
  const W = 280; const H = 150; const pad = 30;
  const maxF = 15; const maxT = 8;
  const sw = (tv: number) => pad + (tv / maxT) * (W - pad - 10);
  const sy = (fv: number) => H - pad - (fv / maxF) * (H - pad - 10);
  const rectX = sw(0); const rectW = sw(dt) - sw(0);
  const rectY = sy(F); const rectH = (H - pad) - sy(F);
  return (
    <Wrap result={`J = ${J.toFixed(1)} N·s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        <line x1={pad} y1={10} x2={pad} y2={H - pad + 5} stroke={ACC} strokeWidth={1.5} />
        <line x1={pad - 5} y1={H - pad} x2={W - 10} y2={H - pad} stroke={ACC} strokeWidth={1.5} />
        <text x={pad - 8} y={14} fill={ANS} fontSize={9} textAnchor="middle">F</text>
        <text x={W - 8} y={H - pad + 3} fill={ANS} fontSize={9}>t</text>
        {/* Area = Impulse */}
        <rect x={rectX} y={rectY} width={rectW} height={rectH}
          fill={`rgba(0,191,255,0.2)`} stroke={VAR} strokeWidth={1.5} />
        <text x={rectX + rectW / 2} y={rectY + rectH / 2 + 4} fill={ANS} fontSize={10} textAnchor="middle">
          J = {J.toFixed(1)}
        </text>
        <text x={rectX + rectW / 2} y={H - pad - 5} fill={ACC} fontSize={8} textAnchor="middle">
          Δt = {dt}s
        </text>
        {/* F label */}
        <text x={pad - 4} y={rectY + 4} fill={PUR} fontSize={8} textAnchor="end">{F}N</text>
      </svg>
      <Controls>
        <S label="F (N)"  val={F}  min={0.5} max={15} step={0.5} set={setF} color={PUR} />
        <S label="Δt (s)" val={dt} min={0.5} max={8}  step={0.5} set={setDt} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 12 — F = Gm₁m₂/r²  (two masses with arrows)
// ═══════════════════════════════════════════════════════════════════════════════
function V12() {
  const G = 6.674e-11;
  const [m1, setM1] = useState(5e10);
  const [r, setR] = useState(3);
  const m2 = 3e10;
  const F = G * m1 * m2 / (r * r);
  const W = 280; const H = 130;
  const gap = 50 + r * 15;
  const cx1 = 140 - gap / 2;
  const cx2 = 140 + gap / 2;
  const cy = 65;
  const arrowLen = Math.min(F * 5e9, 40);
  return (
    <Wrap result={`F = ${F.toExponential(2)} N`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        <defs>
          <marker id="arrowG1" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
            <path d="M5,0 L0,2.5 L5,5 Z" fill={ACC} /></marker>
          <marker id="arrowG2" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill={ACC} /></marker>
        </defs>
        {/* Masses */}
        <circle cx={cx1} cy={cy} r={12} fill="rgba(255,215,0,0.2)" stroke={CON} strokeWidth={2} />
        <circle cx={cx2} cy={cy} r={10} fill="rgba(0,191,255,0.2)" stroke={VAR} strokeWidth={2} />
        <text x={cx1} y={cy + 4} fill={CON} fontSize={8} textAnchor="middle">m₁</text>
        <text x={cx2} y={cy + 4} fill={VAR} fontSize={8} textAnchor="middle">m₂</text>
        {/* Force arrows toward each other */}
        <line x1={cx1 + 12 + arrowLen} y1={cy} x2={cx1 + 12} y2={cy}
          stroke={ACC} strokeWidth={2} markerEnd="url(#arrowG1)" />
        <line x1={cx2 - 10 - arrowLen} y1={cy} x2={cx2 - 10} y2={cy}
          stroke={ACC} strokeWidth={2} markerEnd="url(#arrowG2)" />
        {/* r label */}
        <line x1={cx1} y1={cy + 22} x2={cx2} y2={cy + 22} stroke={GR} strokeWidth={1} />
        <text x={(cx1 + cx2) / 2} y={cy + 32} fill={CON} fontSize={9} textAnchor="middle">r = {r} units</text>
      </svg>
      <Controls>
        <S label="m₁ (×10¹⁰)" val={m1 / 1e10} min={1} max={10} step={0.5} set={v => setM1(v * 1e10)} color={CON} />
        <S label="r (units)"   val={r}          min={1} max={8}  step={0.25} set={setR} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 13 — vₑ = √(2GM/r)  (planet + escape trajectory)
// ═══════════════════════════════════════════════════════════════════════════════
function V13() {
  const G = 6.674e-11;
  const [M, setM] = useState(1);  // ×10²⁴ kg
  const [r, setR] = useState(6.4);  // ×10⁶ m
  const ve = Math.sqrt(2 * G * M * 1e24 / (r * 1e6));
  const W = 280; const H = 150;
  const pcx = 100; const pcy = 90;
  const pr = 30 + (M * 2);
  const arrowEndX = 240; const arrowEndY = 25;
  return (
    <Wrap result={`vₑ = ${(ve / 1000).toFixed(1)} km/s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Planet */}
        <circle cx={pcx} cy={pcy} r={pr} fill="rgba(0,191,255,0.15)" stroke={VAR} strokeWidth={2} />
        <text x={pcx} y={pcy + 4} fill={VAR} fontSize={9} textAnchor="middle">M = {M}×10²⁴</text>
        {/* Escape trajectory */}
        <defs><marker id="arrowEsc" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={ANS} /></marker></defs>
        <path d={`M${pcx + pr * 0.7},${pcy - pr * 0.7} Q${170},${60} ${arrowEndX},${arrowEndY}`}
          fill="none" stroke={ANS} strokeWidth={2} markerEnd="url(#arrowEsc)" />
        {/* Spacecraft */}
        <circle cx={pcx + pr * 0.7} cy={pcy - pr * 0.7} r={4} fill={ANS} />
        {/* vₑ label */}
        <text x={185} y={45} fill={ANS} fontSize={9}>{(ve / 1000).toFixed(1)} km/s</text>
        <text x={180} y={H - 5} fill={CON} fontSize={8}>G = 6.67×10⁻¹¹</text>
      </svg>
      <Controls>
        <S label="M (×10²⁴ kg)" val={M} min={0.5} max={5}  step={0.1} set={setM} color={CON} />
        <S label="r (×10⁶ m)"   val={r} min={3}   max={15} step={0.1} set={setR} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 14 — PV = nRT  (gas container with animated molecules)
// ═══════════════════════════════════════════════════════════════════════════════
type GasMolecule = { x: number; y: number; dx: number; dy: number };

// Container inner bounds (SVG coords)
const G14_CX = 52, G14_CY = 27, G14_CW = 136, G14_CH = 96, G14_R = 4;
const G14_N = 12;

function initMolecules(): GasMolecule[] {
  return Array.from({ length: G14_N }, () => {
    const angle = Math.random() * 2 * Math.PI;
    return {
      x: G14_CX + G14_R + Math.random() * (G14_CW - 2 * G14_R),
      y: G14_CY + G14_R + Math.random() * (G14_CH - 2 * G14_R),
      dx: Math.cos(angle),
      dy: Math.sin(angle),
    };
  });
}

function V14() {
  const [T, setT] = useState(300);
  const [V, setV] = useState(1);
  const n = 1; const R = 8.314;
  const P = n * R * T / V;

  const tempColor = T < 200 ? "#4488ff" : T < 400 ? "#00D9FF" : T < 600 ? "#ffaa00" : "#ff4444";

  const molsRef    = useRef<GasMolecule[]>(initMolecules());
  const rafRef     = useRef<number>(0);
  const lastRef    = useRef<number>(0);
  const TRef       = useRef(T);
  const [dots, setDots] = useState<{ x: number; y: number }[]>(
    molsRef.current.map(({ x, y }) => ({ x, y }))
  );

  useEffect(() => { TRef.current = T; }, [T]);

  useEffect(() => {
    function loop(now: number) {
      const dt = Math.min((now - lastRef.current) / 1000, 0.05);
      lastRef.current = now;
      // Speed: kinetic theory — v ∝ √T; 80 px/s at 300 K
      const speed = Math.sqrt(TRef.current / 300) * 80;
      molsRef.current = molsRef.current.map(({ x, y, dx, dy }) => {
        x += dx * speed * dt;
        y += dy * speed * dt;
        if (x < G14_CX + G14_R)               { x = G14_CX + G14_R;                      dx =  Math.abs(dx); }
        if (x > G14_CX + G14_CW - G14_R)      { x = G14_CX + G14_CW - G14_R;             dx = -Math.abs(dx); }
        if (y < G14_CY + G14_R)               { y = G14_CY + G14_R;                      dy =  Math.abs(dy); }
        if (y > G14_CY + G14_CH - G14_R)      { y = G14_CY + G14_CH - G14_R;             dy = -Math.abs(dy); }
        return { x, y, dx, dy };
      });
      setDots(molsRef.current.map(({ x, y }) => ({ x, y })));
      rafRef.current = requestAnimationFrame(loop);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const W = 280; const H = 150;
  return (
    <Wrap result={`P = ${P.toFixed(0)} Pa`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Container */}
        <rect x={50} y={25} width={140} height={100} fill="rgba(0,191,255,0.05)"
          stroke={ACC} strokeWidth={2} rx={4} />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={G14_R} fill={tempColor} opacity={0.85} />
        ))}
        {/* Pressure gauge */}
        <rect x={210} y={30} width={18} height={90} fill={GR} rx={3} />
        <rect x={210} y={30 + 90 * (1 - Math.min(P / 4000, 1))} width={18}
          height={90 * Math.min(P / 4000, 1)} fill={tempColor} rx={3} />
        <text x={219} y={25} fill={ANS} fontSize={7} textAnchor="middle">P</text>
        <text x={219} y={128} fill={ANS} fontSize={7} textAnchor="middle">{P.toFixed(0)}</text>
        <text x={120} y={H - 3} fill={CON} fontSize={8} textAnchor="middle">R = 8.314 J/(mol·K)</text>
      </svg>
      <Controls>
        <S label="T (K)" val={T} min={100} max={800} step={10} set={setT} color={CON} unit="K" />
        <S label="V (m³)" val={V} min={0.5} max={3}  step={0.1} set={setV} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 15 — ΔU = Q - W  (energy flow box)
// ═══════════════════════════════════════════════════════════════════════════════
function V15() {
  const [Q, setQ]   = useState(500);
  const [Wk, setWk] = useState(200);
  const dU = Q - Wk;
  const W = 280; const H = 150;
  return (
    <Wrap result={`ΔU = ${dU.toFixed(0)} J`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* System box */}
        <rect x={90} y={35} width={100} height={80} fill="rgba(0,191,255,0.1)" stroke={ACC} strokeWidth={2} rx={6} />
        <text x={140} y={78} fill={ANS} fontSize={10} textAnchor="middle">SYSTEM</text>
        <text x={140} y={94} fill={ACC} fontSize={9} textAnchor="middle">ΔU = {dU.toFixed(0)} J</text>
        {/* Q arrow in */}
        <defs>
          <marker id="arrowQ" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={CON} /></marker>
          <marker id="arrowWk" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={PUR} /></marker>
        </defs>
        <line x1={20} y1={75} x2={88} y2={75} stroke={CON} strokeWidth={3} markerEnd="url(#arrowQ)" />
        <text x={54} y={68} fill={CON} fontSize={10} textAnchor="middle">Q</text>
        <text x={54} y={88} fill={CON} fontSize={8} textAnchor="middle">{Q}J in</text>
        {/* W arrow out */}
        <line x1={192} y1={75} x2={255} y2={75} stroke={PUR} strokeWidth={3} markerEnd="url(#arrowWk)" />
        <text x={223} y={68} fill={PUR} fontSize={10} textAnchor="middle">W</text>
        <text x={223} y={88} fill={PUR} fontSize={8} textAnchor="middle">{Wk}J out</text>
        {/* Internal energy bar */}
        <rect x={110} y={108} width={60} height={10} fill={GR} rx={2} />
        <rect x={110} y={108} width={Math.max(0, Math.min(60, 60 * (dU / 600 + 0.5)))} height={10}
          fill={dU >= 0 ? ACC : "#ff4444"} rx={2} />
      </svg>
      <Controls>
        <S label="Q (J)" val={Q}  min={0}   max={800} step={10} set={setQ}  color={CON} />
        <S label="W (J)" val={Wk} min={0}   max={800} step={10} set={setWk} color={PUR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 16 — v = fλ  (animated scrolling wave)
// ═══════════════════════════════════════════════════════════════════════════════
function V16() {
  const t = useT();
  const [f, setF] = useState(2);
  const [lam, setLam] = useState(3);
  const v = f * lam;
  const W = 280; const H = 140; const A = 30; const cy = 70;
  const phase = t * f * 2 * Math.PI;
  const pts = Array.from({ length: 281 }, (_, i) => {
    const x = i;
    const y = cy + A * Math.sin((x / (lam * 28)) * 2 * Math.PI - phase);
    return `${x},${y}`;
  }).join(" ");
  return (
    <Wrap result={`v = ${v.toFixed(1)} m/s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", background: BG }}>
        {/* Center line */}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={GR} strokeWidth={1} />
        {/* Wave */}
        <polyline points={pts} fill="none" stroke={ACC} strokeWidth={2.5} />
        {/* Wavelength indicator */}
        <line x1={30} y1={cy - A - 12} x2={30 + lam * 28} y2={cy - A - 12}
          stroke={VAR} strokeWidth={1} />
        <text x={30 + lam * 14} y={cy - A - 16} fill={VAR} fontSize={8} textAnchor="middle">λ = {lam} m</text>
        <text x={10} y={30} fill={CON} fontSize={9}>f = {f} Hz</text>
        <text x={W - 10} y={30} fill={ANS} fontSize={9} textAnchor="end">v = {v} m/s</text>
      </svg>
      <Controls>
        <S label="f (Hz)" val={f}   min={0.5} max={5}  step={0.25} set={setF}   color={CON} unit="Hz" />
        <S label="λ (m)"  val={lam} min={1}   max={6}  step={0.25} set={setLam} color={VAR} unit="m" />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 17 — Snell's Law  (ray bending at interface)
// ═══════════════════════════════════════════════════════════════════════════════
function V17() {
  const [theta1, setTheta1] = useState(35);
  const [n1, setN1] = useState(1.0);
  const n2 = 1.5;
  const sinTheta2 = n1 * Math.sin((theta1 * Math.PI) / 180) / n2;
  const theta2 = Math.abs(sinTheta2) <= 1 ? (Math.asin(sinTheta2) * 180) / Math.PI : null;
  const W = 280; const H = 150; const cx = 140; const cy = 75;
  const t1 = (theta1 * Math.PI) / 180;
  const t2 = theta2 != null ? (theta2 * Math.PI) / 180 : 0;
  const len = 65;
  return (
    <Wrap result={theta2 != null ? `θ₂ = ${theta2.toFixed(1)}°` : "Total internal reflection"}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Interface */}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={ACC} strokeWidth={1.5} />
        {/* n labels */}
        <text x={8} y={cy - 6} fill={GR} fontSize={9}>n₁ = {n1}</text>
        <text x={8} y={cy + 16} fill={GR} fontSize={9}>n₂ = {n2}</text>
        {/* Normal */}
        <line x1={cx} y1={10} x2={cx} y2={H - 10} stroke={GR} strokeWidth={1} strokeDasharray="4 3" />
        {/* Incident ray */}
        <defs><marker id="arrowSnell" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={CON} /></marker></defs>
        <line x1={cx - len * Math.sin(t1)} y1={cy - len * Math.cos(t1)} x2={cx} y2={cy}
          stroke={CON} strokeWidth={2.5} markerEnd="url(#arrowSnell)" />
        {/* Refracted ray */}
        {theta2 != null && (
          <line x1={cx} y1={cy} x2={cx + len * Math.sin(t2)} y2={cy + len * Math.cos(t2)}
            stroke={VAR} strokeWidth={2.5} />
        )}
        {/* Angle arcs */}
        <text x={cx - 30} y={cy - 22} fill={CON} fontSize={9}>θ₁={theta1}°</text>
        {theta2 != null && <text x={cx + 8} y={cy + 30} fill={VAR} fontSize={9}>θ₂={theta2.toFixed(1)}°</text>}
      </svg>
      <Controls>
        <S label="θ₁ (°)" val={theta1} min={0} max={85} step={1} set={setTheta1} color={CON} unit="°" />
        <S label="n₁"     val={n1}     min={1} max={1.5} step={0.05} set={setN1} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 18 — Thin Lens  (converging rays)
// ═══════════════════════════════════════════════════════════════════════════════
function V18() {
  const [f, setF]   = useState(60);
  const [d0, setD0] = useState(120);
  const di = 1 / (1 / f - 1 / d0);
  const W = 280; const H = 150; const cy = 75; const lx = 140;
  const scale = 0.6;
  const objX = lx - d0 * scale; const imgX = lx + di * scale;
  const objH = 25;
  const imgH = di > 0 ? -objH * (di / d0) : objH;
  const fxL = lx - f * scale; const fxR = lx + f * scale;
  return (
    <Wrap result={`dᵢ = ${di.toFixed(1)} mm`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Optical axis */}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={GR} strokeWidth={1} />
        {/* Lens */}
        <ellipse cx={lx} cy={cy} rx={6} ry={40} fill="rgba(0,191,255,0.1)" stroke={ACC} strokeWidth={2} />
        {/* Focal points */}
        <circle cx={fxL} cy={cy} r={3} fill={CON} />
        <circle cx={fxR} cy={cy} r={3} fill={CON} />
        <text x={fxR + 2} y={cy - 5} fill={CON} fontSize={7}>f</text>
        {/* Object */}
        {objX > 5 && (
          <>
            <line x1={objX} y1={cy} x2={objX} y2={cy - objH} stroke={VAR} strokeWidth={2} />
            <circle cx={objX} cy={cy - objH} r={3} fill={VAR} />
          </>
        )}
        {/* Rays */}
        {objX > 5 && di > 0 && imgX < W - 5 && (
          <>
            {/* Ray parallel to axis → through focal point */}
            <line x1={objX} y1={cy - objH} x2={lx} y2={cy - objH} stroke="rgba(255,215,0,0.5)" strokeWidth={1} />
            <line x1={lx} y1={cy - objH} x2={imgX} y2={cy - imgH} stroke="rgba(255,215,0,0.5)" strokeWidth={1} />
            {/* Ray through center → straight */}
            <line x1={objX} y1={cy - objH} x2={imgX} y2={cy - imgH} stroke="rgba(0,191,255,0.5)" strokeWidth={1} />
          </>
        )}
        {/* Image */}
        {di > 0 && imgX < W - 5 && (
          <>
            <line x1={imgX} y1={cy} x2={imgX} y2={cy - imgH} stroke={ANS} strokeWidth={2} strokeDasharray="3 2" />
            <circle cx={imgX} cy={cy - imgH} r={3} fill={ANS} />
          </>
        )}
      </svg>
      <Controls>
        <S label="f (mm)"  val={f}  min={20} max={100} step={2} set={setF}  color={CON} />
        <S label="d₀ (mm)" val={d0} min={70} max={200} step={5} set={setD0} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 19 — V = IR  (circuit diagram)
// ═══════════════════════════════════════════════════════════════════════════════
function V19() {
  const [Vv, setVv] = useState(12);
  const [R, setR]   = useState(4);
  const I = Vv / R;
  const W = 280; const H = 150;
  return (
    <Wrap result={`I = ${I.toFixed(2)} A`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Circuit loop */}
        <rect x={50} y={30} width={180} height={90} fill="none" stroke={GR} strokeWidth={1.5} rx={8} />
        {/* Battery (left) */}
        <line x1={50} y1={58} x2={50} y2={112} stroke={ACC} strokeWidth={2} />
        <line x1={40} y1={68} x2={60} y2={68} stroke={CON} strokeWidth={3} />
        <line x1={44} y1={78} x2={56} y2={78} stroke={CON} strokeWidth={1.5} />
        <line x1={40} y1={92} x2={60} y2={92} stroke={CON} strokeWidth={1.5} />
        <line x1={44} y1={102} x2={56} y2={102} stroke={CON} strokeWidth={3} />
        <text x={28} y={85} fill={CON} fontSize={11} textAnchor="middle">{Vv}V</text>
        {/* Resistor (top) */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = 100 + i * 16;
          return <path key={i} d={`M${x},30 L${x + 8},18 L${x + 16},30`}
            fill="none" stroke={PUR} strokeWidth={2} />;
        })}
        <text x={140} y={14} fill={PUR} fontSize={9} textAnchor="middle">{R}Ω</text>
        {/* Current arrows */}
        <defs><marker id="arrowI" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={VAR} /></marker></defs>
        <line x1={180} y1={30} x2={240} y2={30} stroke={VAR} strokeWidth={1.5} markerEnd="url(#arrowI)" />
        <line x1={230} y1={120} x2={60} y2={120} stroke={VAR} strokeWidth={1.5} markerEnd="url(#arrowI)" />
        <text x={140} y={138} fill={VAR} fontSize={9} textAnchor="middle">I = {I.toFixed(2)} A</text>
      </svg>
      <Controls>
        <S label="V (volts)" val={Vv} min={1}  max={24} step={0.5} set={setVv} color={CON} />
        <S label="R (ohms)"  val={R}  min={0.5} max={12} step={0.5} set={setR}  color={PUR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 20 — P = IV  (power glow bar)
// ═══════════════════════════════════════════════════════════════════════════════
function V20() {
  const [Iv, setIv] = useState(4);
  const [Vv, setVv] = useState(6);
  const P = Iv * Vv;
  const maxP = 100;
  const frac = Math.min(P / maxP, 1);
  const W = 280; const H = 140;
  return (
    <Wrap result={`P = ${P.toFixed(0)} W`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* IV = P visual */}
        <rect x={50} y={30} width={Iv * 12} height={Vv * 10} fill={`rgba(0,191,255,${0.1 + frac * 0.4})`}
          stroke={ACC} strokeWidth={1.5} rx={3} />
        <text x={50 + Iv * 6} y={30 + Vv * 5 + 4} fill={ANS} fontSize={10} textAnchor="middle">
          P = {P} W
        </text>
        {/* Axes labels */}
        <text x={50 + Iv * 12 + 6} y={30 + Vv * 5 + 4} fill={VAR} fontSize={8}>I={Iv}A</text>
        <text x={50 + Iv * 6} y={30 + Vv * 10 + 12} fill={CON} fontSize={8} textAnchor="middle">V={Vv}V</text>
        {/* Power bar */}
        <rect x={230} y={25} width={22} height={H - 45} fill={GR} rx={3} />
        <rect x={230} y={25 + (H - 45) * (1 - frac)} width={22} height={(H - 45) * frac} fill={ACC} rx={3} />
        <text x={241} y={20} fill={ACC} fontSize={7} textAnchor="middle">P</text>
        <text x={241} y={H - 10} fill={ANS} fontSize={7} textAnchor="middle">{P}W</text>
      </svg>
      <Controls>
        <S label="I (A)" val={Iv} min={0.5} max={8} step={0.5} set={setIv} color={VAR} />
        <S label="V (V)" val={Vv} min={0.5} max={12} step={0.5} set={setVv} color={CON} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 21 — F = kₑq₁q₂/r²  (two charges with arrows)
// ═══════════════════════════════════════════════════════════════════════════════
function V21() {
  const ke = 8.99e9;
  const [q, setQ]   = useState(2);   // ×10⁻⁶ C
  const [r, setR]   = useState(0.3);
  const F = ke * (q * 1e-6) * (q * 1e-6) / (r * r);
  const W = 280; const H = 130;
  const gap = 40 + r * 120;
  const cx1 = 140 - gap / 2;
  const cx2 = 140 + gap / 2;
  const cy = 65;
  const arrowLen = Math.min(F * 0.0001, 40);
  return (
    <Wrap result={`F = ${F.toFixed(2)} N`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        <defs>
          <marker id="arrowC1" markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
            <path d="M5,0 L0,2.5 L5,5 Z" fill={CON} /></marker>
          <marker id="arrowC2" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill={CON} /></marker>
        </defs>
        {/* Charges */}
        <circle cx={cx1} cy={cy} r={12} fill="rgba(255,100,100,0.3)" stroke="#ff6666" strokeWidth={2} />
        <circle cx={cx2} cy={cy} r={12} fill="rgba(255,100,100,0.3)" stroke="#ff6666" strokeWidth={2} />
        <text x={cx1} y={cy + 4} fill={ANS} fontSize={10} textAnchor="middle">+q</text>
        <text x={cx2} y={cy + 4} fill={ANS} fontSize={10} textAnchor="middle">+q</text>
        {/* Repulsion arrows */}
        <line x1={cx1 - 12} y1={cy} x2={cx1 - 12 - arrowLen} y2={cy}
          stroke={CON} strokeWidth={2} markerEnd="url(#arrowC1)" />
        <line x1={cx2 + 12} y1={cy} x2={cx2 + 12 + arrowLen} y2={cy}
          stroke={CON} strokeWidth={2} markerEnd="url(#arrowC2)" />
        {/* r label */}
        <line x1={cx1} y1={cy + 20} x2={cx2} y2={cy + 20} stroke={GR} strokeWidth={1} />
        <text x={(cx1 + cx2) / 2} y={cy + 32} fill={VAR} fontSize={8} textAnchor="middle">r = {r.toFixed(2)} m</text>
        <text x={W / 2} y={H - 2} fill={CON} fontSize={8} textAnchor="middle">kₑ = 8.99×10⁹</text>
      </svg>
      <Controls>
        <S label="q (μC)"  val={q} min={0.5} max={5}   step={0.1} set={setQ} color={CON} />
        <S label="r (m)"   val={r} min={0.1} max={0.8}  step={0.05} set={setR} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 22 — E = F/q  (electric field lines)
// ═══════════════════════════════════════════════════════════════════════════════
function V22() {
  const [qv, setQv] = useState(4);
  const ke = 8.99e9;
  const E_at1m = ke * qv * 1e-6 / 1;
  const W = 280; const H = 150; const cx = 140; const cy = 75;
  const numLines = Math.round(qv * 2);
  return (
    <Wrap result={`E ≈ ${E_at1m.toFixed(0)} N/C at 1m`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Field lines */}
        {Array.from({ length: numLines }, (_, i) => {
          const angle = (i / numLines) * 2 * Math.PI;
          const len = 55 + qv * 3;
          const ex = cx + len * Math.cos(angle);
          const ey = cy + len * Math.sin(angle);
          return (
            <g key={i}>
              <line x1={cx + 8 * Math.cos(angle)} y1={cy + 8 * Math.sin(angle)}
                x2={ex} y2={ey} stroke={ACC} strokeWidth={1} strokeOpacity={0.6} />
              {/* Arrow head */}
              <polygon points={`${ex},${ey} ${ex - 6 * Math.cos(angle) - 3 * Math.sin(angle)},${ey - 6 * Math.sin(angle) + 3 * Math.cos(angle)} ${ex - 6 * Math.cos(angle) + 3 * Math.sin(angle)},${ey - 6 * Math.sin(angle) - 3 * Math.cos(angle)}`}
                fill={ACC} opacity={0.6} />
            </g>
          );
        })}
        {/* Charge */}
        <circle cx={cx} cy={cy} r={10} fill="rgba(255,215,0,0.3)" stroke={CON} strokeWidth={2} />
        <text x={cx} y={cy + 4} fill={CON} fontSize={10} textAnchor="middle">+q</text>
        <text x={W - 8} y={H - 4} fill={VAR} fontSize={8} textAnchor="end">E = F/q (N/C)</text>
      </svg>
      <Controls>
        <S label="q (μC)" val={qv} min={1} max={8} step={0.5} set={setQv} color={CON} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 23 — E = mc²  (mass → energy conversion bar)
// ═══════════════════════════════════════════════════════════════════════════════
function V23() {
  const c = 3e8;
  const [m, setM] = useState(0.001); // kg
  const E = m * c * c;
  const W = 280; const H = 150;
  const massW = 30 + m * 5000;
  const eBar = Math.min(220, Math.log10(E + 1) * 18);
  return (
    <Wrap result={`E = ${E.toExponential(2)} J`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <Grid W={W} H={H} />
        {/* Mass block */}
        <rect x={20} y={55} width={Math.min(massW, 80)} height={40}
          fill="rgba(0,191,255,0.2)" stroke={VAR} strokeWidth={2} rx={4} />
        <text x={20 + Math.min(massW, 80) / 2} y={79} fill={VAR} fontSize={9} textAnchor="middle">
          m = {(m * 1000).toFixed(1)}g
        </text>
        {/* Arrow */}
        <defs><marker id="arrowE" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={CON} /></marker></defs>
        <line x1={Math.min(massW, 80) + 26} y1={75} x2={105} y2={75}
          stroke={CON} strokeWidth={2} markerEnd="url(#arrowE)" />
        <text x={88} y={68} fill={CON} fontSize={9}>c²</text>
        {/* Energy bar */}
        <rect x={108} y={25} width={eBar} height={100} fill="rgba(255,165,0,0.3)"
          stroke="#FF8C42" strokeWidth={2} rx={4} />
        <text x={108 + eBar / 2} y={78} fill={ANS} fontSize={9} textAnchor="middle">E</text>
        <text x={108 + eBar / 2} y={92} fill={ANS} fontSize={8} textAnchor="middle">
          {E.toExponential(1)} J
        </text>
        <text x={20} y={H - 4} fill={CON} fontSize={8}>c = 3×10⁸ m/s</text>
      </svg>
      <Controls>
        <S label="m (g)" val={m * 1000} min={0.1} max={5} step={0.1} set={v => setM(v / 1000)} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 24 — E = hf  (photon wave with frequency)
// ═══════════════════════════════════════════════════════════════════════════════
function V24() {
  const t = useT();
  const h = 6.626e-34;
  const [f, setF] = useState(5e14);  // Hz (visible light range)
  const E = h * f;
  const W = 280; const H = 140; const cy = 70; const A = 28;
  const lam = (3e8 / f);  // wavelength in m
  const lamPx = Math.max(8, Math.min(60, 1e7 / (f / 1e14)));
  const phase = t * 3;
  const pts = Array.from({ length: 281 }, (_, i) => {
    const y = cy + A * Math.sin((i / lamPx) * 2 * Math.PI - phase);
    return `${i},${y}`;
  }).join(" ");
  // Color based on frequency
  const col = f < 4.3e14 ? "#ff4444" : f < 5.2e14 ? "#ffaa00" : f < 6.1e14 ? "#aaff44" : f < 7.5e14 ? "#4444ff" : "#aa00ff";
  return (
    <Wrap result={`E = ${E.toExponential(2)} J`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={GR} strokeWidth={1} />
        <polyline points={pts} fill="none" stroke={col} strokeWidth={2.5} />
        {/* Photon particle */}
        <circle cx={140} cy={cy} r={6} fill={col} opacity={0.8} />
        <text x={140} y={cy + 18} fill={col} fontSize={8} textAnchor="middle">photon</text>
        {/* Labels */}
        <text x={10} y={20} fill={GR} fontSize={9}>f = {(f / 1e14).toFixed(1)}×10¹⁴ Hz</text>
        <text x={W - 10} y={20} fill={ANS} fontSize={9} textAnchor="end">λ = {(lam * 1e9).toFixed(0)} nm</text>
        <text x={10} y={H - 4} fill={CON} fontSize={8}>h = 6.626×10⁻³⁴ J·s</text>
      </svg>
      <Controls>
        <S label="f (×10¹⁴ Hz)" val={f / 1e14} min={3.8} max={7.5} step={0.1}
          set={v => setF(v * 1e14)} color={col} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 25 — λ = h/mv  (de Broglie wave on particle)
// ═══════════════════════════════════════════════════════════════════════════════
function V25() {
  const t = useT();
  const hv = 6.626e-34;
  const [m, setM] = useState(9.11);  // ×10⁻³¹ kg (electron-scale)
  const [v, setV] = useState(5);     // ×10⁶ m/s
  const lam = hv / (m * 1e-31 * v * 1e6);
  const lamPx = Math.max(6, Math.min(80, lam * 2e9));
  const W = 280; const H = 140; const cy = 70; const A = 22;
  const phase = t * v * 0.5;
  const pts = Array.from({ length: 281 }, (_, i) => {
    const y = cy + A * Math.sin((i / lamPx) * 2 * Math.PI - phase);
    return `${i},${y}`;
  }).join(" ");
  const particleX = (t * v * 20) % 280;
  return (
    <Wrap result={`λ = ${(lam * 1e9).toFixed(2)} nm`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={GR} strokeWidth={1} />
        <polyline points={pts} fill="none" stroke={ACC} strokeWidth={1.5} strokeOpacity={0.6} />
        {/* Particle */}
        <circle cx={particleX} cy={cy} r={7} fill="rgba(0,191,255,0.4)" stroke={VAR} strokeWidth={2} />
        <text x={10} y={20} fill={VAR} fontSize={9}>m = {m.toFixed(2)}×10⁻³¹ kg</text>
        <text x={10} y={33} fill={VAR} fontSize={9}>v = {v}×10⁶ m/s</text>
        <text x={W - 10} y={20} fill={ANS} fontSize={9} textAnchor="end">λ = {(lam * 1e9).toFixed(2)} nm</text>
        <text x={10} y={H - 4} fill={CON} fontSize={8}>h = 6.626×10⁻³⁴ J·s</text>
      </svg>
      <Controls>
        <S label="m (×10⁻³¹ kg)" val={m} min={1} max={20} step={0.5} set={setM} color={VAR} />
        <S label="v (×10⁶ m/s)"  val={v} min={1} max={10} step={0.5} set={setV} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 26 — Heisenberg ΔxΔp ≥ ℏ/2  (position-momentum trade-off)
// ═══════════════════════════════════════════════════════════════════════════════
function V26() {
  const hbar = 1.055e-34;
  const [dx, setDx] = useState(0.5);  // relative Δx
  const dp = 0.25 / dx;  // relative Δp (product = const)
  const W = 280; const H = 155; const cy = 80;
  // Position Gaussian: narrow σ = dx*20
  const sigX = dx * 25;
  const ptsX = Array.from({ length: 141 }, (_, i) => {
    const xv = i; const x0 = 70;
    const y = cy - 50 * Math.exp(-0.5 * ((xv - x0) / sigX) ** 2);
    return `${xv},${y}`;
  }).join(" ");
  // Momentum Gaussian: broad σ = dp*20
  const sigP = dp * 20;
  const ptsP = Array.from({ length: 141 }, (_, i) => {
    const xv = i + 140; const x0 = 210;
    const y = cy - 50 * Math.exp(-0.5 * ((xv - x0) / sigP) ** 2);
    return `${xv},${y}`;
  }).join(" ");
  return (
    <Wrap result={`Δx·Δp ≥ ℏ/2`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Baseline */}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={GR} strokeWidth={1} />
        <line x1={140} y1={10} x2={140} y2={H - 10} stroke={GR} strokeWidth={1} strokeDasharray="4 3" />
        {/* Position curve */}
        <polyline points={ptsX} fill="none" stroke={VAR} strokeWidth={2} />
        <text x={70} y={H - 4} fill={VAR} fontSize={9} textAnchor="middle">Δx = {dx.toFixed(1)}</text>
        {/* Momentum curve */}
        <polyline points={ptsP} fill="none" stroke={CON} strokeWidth={2} />
        <text x={210} y={H - 4} fill={CON} fontSize={9} textAnchor="middle">Δp = {dp.toFixed(1)}</text>
        {/* Labels */}
        <text x={70} y={20} fill={VAR} fontSize={8} textAnchor="middle">Position</text>
        <text x={210} y={20} fill={CON} fontSize={8} textAnchor="middle">Momentum</text>
      </svg>
      <Controls>
        <S label="Δx (narrow→)" val={dx} min={0.1} max={1.5} step={0.05} set={setDx} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 27 — Kepler's Third Law  (orbiting planet)
// ═══════════════════════════════════════════════════════════════════════════════
function V27() {
  const t = useT();
  const G = 6.674e-11;
  const [a, setA] = useState(1.5);  // AU-scale
  const M_sun = 2e30;
  const T = 2 * Math.PI * Math.sqrt(Math.pow(a * 1.5e11, 3) / (G * M_sun));
  const W = 280; const H = 155; const cx = 140; const cy = 80;
  const orbitR = a * 45;
  const angle = (t / (T / (2 * Math.PI * 2))) % (2 * Math.PI);
  const px = cx + orbitR * Math.cos(angle);
  const py = cy + orbitR * Math.sin(angle);
  return (
    <Wrap result={`T = ${(T / (3.15e7)).toFixed(2)} yr`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Orbit */}
        <ellipse cx={cx} cy={cy} rx={orbitR} ry={orbitR * 0.75}
          fill="none" stroke={GR} strokeWidth={1.5} strokeDasharray="4 3" />
        {/* Star */}
        <circle cx={cx} cy={cy} r={10} fill={CON} opacity={0.9} />
        <text x={cx + 12} y={cy + 4} fill={CON} fontSize={8}>M☉</text>
        {/* Planet */}
        <circle cx={px} cy={py} r={6} fill={VAR} />
        {/* Labels */}
        <text x={10} y={15} fill={VAR} fontSize={9}>a = {a} AU</text>
        <text x={10} y={28} fill={ANS} fontSize={9}>T = {(T / 3.15e7).toFixed(2)} yr</text>
      </svg>
      <Controls>
        <S label="a (AU)" val={a} min={0.3} max={3} step={0.1} set={setA} color={VAR} unit=" AU" />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 28 — Schwarzschild Radius  (black hole + event horizon)
// ═══════════════════════════════════════════════════════════════════════════════
function V28() {
  const G = 6.674e-11; const c2 = (3e8) * (3e8);
  const [M, setM] = useState(5);  // solar masses
  const Msun = 2e30;
  const rs = 2 * G * M * Msun / c2;
  const W = 280; const H = 155; const cx = 140; const cy = 78;
  const displayR = Math.max(8, Math.min(60, M * 6));
  return (
    <Wrap result={`rₛ = ${(rs / 1000).toFixed(1)} km`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Photon orbit rings */}
        {[1.4, 1.7, 2.0].map((f, i) => (
          <circle key={i} cx={cx} cy={cy} r={displayR * f}
            fill="none" stroke={GR} strokeWidth={1} strokeDasharray={`${i + 2} ${i + 2}`} />
        ))}
        {/* Event horizon */}
        <circle cx={cx} cy={cy} r={displayR}
          fill="black" stroke={ACC} strokeWidth={2} />
        {/* Singularity */}
        <circle cx={cx} cy={cy} r={3} fill={ANS} />
        {/* Labels */}
        <text x={cx} y={cy - displayR - 8} fill={ACC} fontSize={8} textAnchor="middle">rₛ = {(rs / 1000).toFixed(1)} km</text>
        <text x={cx} y={H - 4} fill={CON} fontSize={8} textAnchor="middle">M = {M} M☉ — Event Horizon</text>
        {/* Mass label */}
        <text x={10} y={15} fill={CON} fontSize={9}>c = 3×10⁸ m/s</text>
      </svg>
      <Controls>
        <S label="M (M☉)" val={M} min={1} max={20} step={0.5} set={setM} color={CON} unit=" M☉" />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 29 — F = L/(4πd²)  (inverse-square light)
// ═══════════════════════════════════════════════════════════════════════════════
function V29() {
  const t = useT();
  const [d, setD] = useState(3);  // arbitrary units
  const L = 100;
  const F = L / (4 * Math.PI * d * d);
  const W = 280; const H = 155; const sx = 30; const cy = 78;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2);
  return (
    <Wrap result={`F = ${F.toFixed(2)} W/m²`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Expanding rings */}
        {[1, 2, 3, 4].map(i => {
          const r = ((t * 20 + i * 45) % 180) + 5;
          const op = Math.max(0, 0.5 - r / 360);
          return <circle key={i} cx={sx} cy={cy} r={r} fill="none" stroke={CON} strokeWidth={1.5} opacity={op} />;
        })}
        {/* Star */}
        <circle cx={sx} cy={cy} r={10 + pulse * 3} fill={CON} opacity={0.9} />
        {/* Detector at distance d */}
        <rect x={sx + d * 35 - 4} y={cy - 12} width={8} height={24}
          fill={`rgba(0,191,255,${Math.min(F / 5, 1) * 0.8 + 0.1})`} stroke={VAR} strokeWidth={1.5} rx={2} />
        <text x={sx + d * 35} y={cy + 24} fill={VAR} fontSize={8} textAnchor="middle">d={d}</text>
        <line x1={sx + 10} y1={cy - 18} x2={sx + d * 35} y2={cy - 18} stroke={GR} strokeWidth={1} />
        <text x={sx + d * 17} y={cy - 22} fill={GR} fontSize={8} textAnchor="middle">distance</text>
        <text x={sx + d * 35 + 16} y={cy} fill={ANS} fontSize={8}>F={F.toFixed(2)}</text>
      </svg>
      <Controls>
        <S label="d (units)" val={d} min={1} max={5} step={0.25} set={setD} color={VAR} />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 30 — L = 4πR²σT⁴  (glowing star)
// ═══════════════════════════════════════════════════════════════════════════════
function V30() {
  const sigma = 5.671e-8;
  const [R, setR] = useState(1);   // solar radii (×6.96e8 m)
  const [T, setT] = useState(5778); // K (sun's T)
  const Rsun = 6.96e8;
  const L = 4 * Math.PI * (R * Rsun) ** 2 * sigma * T ** 4;
  const Lsun = 3.828e26;
  // Star color based on temperature
  const col = T < 3500 ? "#ff4444" : T < 5000 ? "#ffaa44" : T < 7000 ? "#ffffaa" : T < 10000 ? "#aaaaff" : "#aaddff";
  const starR = 20 + R * 15;
  const W = 280; const H = 155; const cx = 140; const cy = 78;
  return (
    <Wrap result={`L = ${(L / Lsun).toFixed(2)} L☉`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Glow */}
        <radialGradient id="glow30" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={col} stopOpacity="0.5" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </radialGradient>
        <circle cx={cx} cy={cy} r={starR * 2.5} fill="url(#glow30)" />
        {/* Star */}
        <circle cx={cx} cy={cy} r={starR} fill={col} />
        {/* Temperature label */}
        <text x={cx} y={cy + 4} fill="rgba(0,0,0,0.7)" fontSize={9} textAnchor="middle" fontWeight="bold">
          {T >= 1000 ? (T / 1000).toFixed(1) + "kK" : T + "K"}
        </text>
        {/* Info */}
        <text x={10} y={H - 18} fill={col} fontSize={8}>T = {T} K</text>
        <text x={10} y={H - 6} fill={VAR} fontSize={8}>R = {R} R☉</text>
        <text x={W - 8} y={H - 6} fill={ANS} fontSize={8} textAnchor="end">σ = 5.67×10⁻⁸</text>
      </svg>
      <Controls>
        <S label="R (R☉)" val={R} min={0.2} max={5}    step={0.1}  set={setR} color={VAR} />
        <S label="T (K)"  val={T} min={2500} max={25000} step={100} set={setT} color={CON} unit="K" />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 31 — v = √(GM/r)  (circular orbit with velocity vector)
// ═══════════════════════════════════════════════════════════════════════════════
function V31() {
  const t = useT();
  const G = 6.674e-11;
  const [r, setR] = useState(2);  // ×10⁸ m
  const M = 2e30;  // solar mass
  const v = Math.sqrt(G * M / (r * 1e8));
  const W = 280; const H = 155; const cx = 140; const cy = 78;
  const orbitR = r * 30;
  const period = 2 * Math.PI * Math.sqrt(Math.pow(r * 1e8, 3) / (G * M));
  const angle = (t / (period / (2 * Math.PI * 2))) % (2 * Math.PI);
  const px = cx + orbitR * Math.cos(angle);
  const py = cy + orbitR * Math.sin(angle);
  const vx = -Math.sin(angle) * 18;
  const vy =  Math.cos(angle) * 18;
  return (
    <Wrap result={`v = ${(v / 1000).toFixed(1)} km/s`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Orbit */}
        <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke={GR} strokeWidth={1.5} strokeDasharray="4 3" />
        {/* Central mass */}
        <circle cx={cx} cy={cy} r={10} fill={CON} opacity={0.9} />
        {/* Planet */}
        <circle cx={px} cy={py} r={5} fill={VAR} />
        {/* Velocity arrow */}
        <defs><marker id="arrowV31" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill={ANS} /></marker></defs>
        <line x1={px} y1={py} x2={px + vx} y2={py + vy}
          stroke={ANS} strokeWidth={2} markerEnd="url(#arrowV31)" />
        {/* Labels */}
        <text x={10} y={15} fill={VAR} fontSize={9}>r = {r}×10⁸ m</text>
        <text x={10} y={28} fill={ANS} fontSize={9}>v = {(v / 1000).toFixed(1)} km/s</text>
      </svg>
      <Controls>
        <S label="r (×10⁸ m)" val={r} min={0.5} max={5} step={0.1} set={setR} color={VAR} unit="×10⁸" />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Formula 32 — Hubble's Law  (expanding universe)
// ═══════════════════════════════════════════════════════════════════════════════
function V32() {
  const [H0, setH0] = useState(70);  // km/s/Mpc
  const W = 280; const H = 155; const cx = 140; const cy = 78;
  const galaxies = [
    [60, 50], [180, 45], [50, 100], [200, 110], [90, 130], [175, 130],
    [70, 78], [200, 78]
  ];
  return (
    <Wrap result={`v = H₀ × d`}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* Milky Way at center */}
        <circle cx={cx} cy={cy} r={7} fill={CON} />
        <text x={cx + 10} y={cy + 3} fill={CON} fontSize={7}>MW</text>
        {/* Galaxies with recession arrows */}
        {galaxies.map(([gx, gy], i) => {
          const dx = gx - cx; const dy = gy - cy;
          const d = Math.sqrt(dx * dx + dy * dy);
          const v = H0 * d / 30;
          const arrowScale = v / 15;
          const ex = gx + dx * arrowScale * 0.4;
          const ey = gy + dy * arrowScale * 0.4;
          return (
            <g key={i}>
              <ellipse cx={gx} cy={gy} rx={6} ry={3} transform={`rotate(${Math.atan2(dy, dx) * 57},${gx},${gy})`}
                fill="rgba(0,191,255,0.4)" stroke={VAR} strokeWidth={1} />
              <line x1={gx} y1={gy} x2={ex} y2={ey} stroke={ACC} strokeWidth={1} strokeOpacity={0.7} />
            </g>
          );
        })}
        <text x={W / 2} y={H - 4} fill={CON} fontSize={8} textAnchor="middle">
          H₀ = {H0} km/s/Mpc
        </text>
      </svg>
      <Controls>
        <S label="H₀ (km/s/Mpc)" val={H0} min={50} max={100} step={1} set={setH0} color={CON} unit="" />
      </Controls>
    </Wrap>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════════════
const VISUALS: Record<number, () => JSX.Element> = {
  1: V1, 2: V2, 3: V3, 4: V4, 5: V5, 6: V6, 7: V7, 8: V8,
  9: V9, 10: V10, 11: V11, 12: V12, 13: V13, 14: V14, 15: V15, 16: V16,
  17: V17, 18: V18, 19: V19, 20: V20, 21: V21, 22: V22, 23: V23, 24: V24,
  25: V25, 26: V26, 27: V27, 28: V28, 29: V29, 30: V30, 31: V31, 32: V32,
};

export function FormulaVisual({ formulaId }: { formulaId: number }) {
  const Component = VISUALS[formulaId];
  if (!Component) return null;
  return <Component />;
}
