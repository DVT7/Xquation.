export interface CalcField {
  key: string;
  label: string;
  unit: string;
  default?: string;
}

export interface CalcConfig {
  inputs: CalcField[];
  outputLabel: string;
  outputUnit: string;
  calculate: (v: Record<string, number>) => number;
  steps: (v: Record<string, number>, r: number) => string[];
}

const G = 6.674e-11;
const c = 299792458;
const h = 6.626e-34;
const hbar = 1.055e-34;
const sigma = 5.671e-8;
const ke = 8.99e9;
const R_gas = 8.314;
const g = 9.81;

export const CALCULATORS: Record<number, CalcConfig> = {
  1: {
    inputs: [
      { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
      { key: "a",  label: "Acceleration (a)",      unit: "m/s²" },
      { key: "t",  label: "Time (t)",              unit: "s" },
    ],
    outputLabel: "Final Velocity (v)", outputUnit: "m/s",
    calculate: ({ v0, a, t }) => v0 + a * t,
    steps: ({ v0, a, t }, r) => [
      `v = v₀ + at`,
      `v = ${v0} + (${a})(${t})`,
      `v = ${v0} + ${a * t}`,
      `v = ${r.toPrecision(4)} m/s`,
    ],
  },
  2: {
    inputs: [
      { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
      { key: "a",  label: "Acceleration (a)",      unit: "m/s²" },
      { key: "t",  label: "Time (t)",              unit: "s" },
    ],
    outputLabel: "Displacement (x)", outputUnit: "m",
    calculate: ({ v0, a, t }) => v0 * t + 0.5 * a * t * t,
    steps: ({ v0, a, t }, r) => [
      `x = v₀t + ½at²`,
      `x = (${v0})(${t}) + ½(${a})(${t})²`,
      `x = ${v0 * t} + ${0.5 * a * t * t}`,
      `x = ${r.toPrecision(4)} m`,
    ],
  },
  3: {
    inputs: [
      { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
      { key: "a",  label: "Acceleration (a)",      unit: "m/s²" },
      { key: "x",  label: "Displacement (x)",      unit: "m" },
    ],
    outputLabel: "Final Velocity (v)", outputUnit: "m/s",
    calculate: ({ v0, a, x }) => Math.sqrt(Math.max(0, v0 * v0 + 2 * a * x)),
    steps: ({ v0, a, x }, r) => [
      `v² = v₀² + 2ax`,
      `v² = (${v0})² + 2(${a})(${x})`,
      `v² = ${v0 * v0 + 2 * a * x}`,
      `v = ${r.toPrecision(4)} m/s`,
    ],
  },
  4: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "a", label: "Acceleration (a)", unit: "m/s²" },
    ],
    outputLabel: "Force (F)", outputUnit: "N",
    calculate: ({ m, a }) => m * a,
    steps: ({ m, a }, r) => [
      `F = ma`,
      `F = (${m})(${a})`,
      `F = ${r.toPrecision(4)} N`,
    ],
  },
  5: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "g", label: "Gravitational Accel (g)", unit: "m/s²", default: "9.81" },
    ],
    outputLabel: "Weight (W)", outputUnit: "N",
    calculate: ({ m, g: gv }) => m * gv,
    steps: ({ m, g: gv }, r) => [
      `W = mg`,
      `W = (${m})(${gv})`,
      `W = ${r.toPrecision(4)} N`,
    ],
  },
  6: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "v", label: "Velocity (v)", unit: "m/s" },
    ],
    outputLabel: "Kinetic Energy (KE)", outputUnit: "J",
    calculate: ({ m, v }) => 0.5 * m * v * v,
    steps: ({ m, v }, r) => [
      `KE = ½mv²`,
      `KE = ½(${m})(${v})²`,
      `KE = ½(${m})(${v * v})`,
      `KE = ${r.toPrecision(4)} J`,
    ],
  },
  7: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "g", label: "Gravitational Accel (g)", unit: "m/s²", default: "9.81" },
      { key: "h", label: "Height (h)", unit: "m" },
    ],
    outputLabel: "Potential Energy (PE)", outputUnit: "J",
    calculate: ({ m, g: gv, h: hv }) => m * gv * hv,
    steps: ({ m, g: gv, h: hv }, r) => [
      `PE = mgh`,
      `PE = (${m})(${gv})(${hv})`,
      `PE = ${r.toPrecision(4)} J`,
    ],
  },
  8: {
    inputs: [
      { key: "F",     label: "Force (F)", unit: "N" },
      { key: "d",     label: "Displacement (d)", unit: "m" },
      { key: "theta", label: "Angle (θ)", unit: "°", default: "0" },
    ],
    outputLabel: "Work (W)", outputUnit: "J",
    calculate: ({ F, d, theta }) => F * d * Math.cos((theta * Math.PI) / 180),
    steps: ({ F, d, theta }, r) => [
      `W = Fd·cos(θ)`,
      `W = (${F})(${d})·cos(${theta}°)`,
      `W = ${r.toPrecision(4)} J`,
    ],
  },
  9: {
    inputs: [
      { key: "W", label: "Work (W)", unit: "J" },
      { key: "t", label: "Time (t)", unit: "s" },
    ],
    outputLabel: "Power (P)", outputUnit: "W",
    calculate: ({ W: Wv, t }) => Wv / t,
    steps: ({ W: Wv, t }, r) => [
      `P = W/t`,
      `P = ${Wv} / ${t}`,
      `P = ${r.toPrecision(4)} W`,
    ],
  },
  10: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "v", label: "Velocity (v)", unit: "m/s" },
    ],
    outputLabel: "Momentum (p)", outputUnit: "kg·m/s",
    calculate: ({ m, v }) => m * v,
    steps: ({ m, v }, r) => [
      `p = mv`,
      `p = (${m})(${v})`,
      `p = ${r.toPrecision(4)} kg·m/s`,
    ],
  },
  11: {
    inputs: [
      { key: "F", label: "Force (F)", unit: "N" },
      { key: "t", label: "Time interval (Δt)", unit: "s" },
    ],
    outputLabel: "Impulse (J)", outputUnit: "N·s",
    calculate: ({ F, t }) => F * t,
    steps: ({ F, t }, r) => [
      `J = FΔt`,
      `J = (${F})(${t})`,
      `J = ${r.toPrecision(4)} N·s`,
    ],
  },
  12: {
    inputs: [
      { key: "m1", label: "Mass 1 (m₁)", unit: "kg" },
      { key: "m2", label: "Mass 2 (m₂)", unit: "kg" },
      { key: "r",  label: "Separation (r)", unit: "m" },
    ],
    outputLabel: "Gravitational Force (F)", outputUnit: "N",
    calculate: ({ m1, m2, r }) => G * m1 * m2 / (r * r),
    steps: ({ m1, m2, r }, result) => [
      `F = Gm₁m₂/r²`,
      `F = (6.674×10⁻¹¹)(${m1})(${m2}) / (${r})²`,
      `F = ${result.toExponential(4)} N`,
    ],
  },
  13: {
    inputs: [
      { key: "M", label: "Mass of Body (M)", unit: "kg" },
      { key: "r", label: "Radius (r)", unit: "m" },
    ],
    outputLabel: "Escape Velocity (vₑ)", outputUnit: "m/s",
    calculate: ({ M, r }) => Math.sqrt(2 * G * M / r),
    steps: ({ M, r }, result) => [
      `vₑ = √(2GM/r)`,
      `vₑ = √(2 × 6.674×10⁻¹¹ × ${M} / ${r})`,
      `vₑ = ${result.toPrecision(4)} m/s`,
    ],
  },
  14: {
    inputs: [
      { key: "n", label: "Moles (n)", unit: "mol" },
      { key: "T", label: "Temperature (T)", unit: "K" },
      { key: "V", label: "Volume (V)", unit: "m³" },
    ],
    outputLabel: "Pressure (P)", outputUnit: "Pa",
    calculate: ({ n, T, V }) => n * R_gas * T / V,
    steps: ({ n, T, V }, result) => [
      `PV = nRT  →  P = nRT/V`,
      `P = (${n})(8.314)(${T}) / ${V}`,
      `P = ${result.toPrecision(4)} Pa`,
    ],
  },
  15: {
    inputs: [
      { key: "Q", label: "Heat Added (Q)", unit: "J" },
      { key: "W", label: "Work Done by System (W)", unit: "J" },
    ],
    outputLabel: "Change in Internal Energy (ΔU)", outputUnit: "J",
    calculate: ({ Q, W: Wv }) => Q - Wv,
    steps: ({ Q, W: Wv }, result) => [
      `ΔU = Q − W`,
      `ΔU = ${Q} − ${Wv}`,
      `ΔU = ${result.toPrecision(4)} J`,
    ],
  },
  16: {
    inputs: [
      { key: "f",      label: "Frequency (f)", unit: "Hz" },
      { key: "lambda", label: "Wavelength (λ)", unit: "m" },
    ],
    outputLabel: "Wave Speed (v)", outputUnit: "m/s",
    calculate: ({ f, lambda }) => f * lambda,
    steps: ({ f, lambda }, result) => [
      `v = fλ`,
      `v = (${f})(${lambda})`,
      `v = ${result.toPrecision(4)} m/s`,
    ],
  },
  17: {
    inputs: [
      { key: "n1",     label: "Index n₁", unit: "" },
      { key: "theta1", label: "Angle θ₁", unit: "°" },
      { key: "n2",     label: "Index n₂", unit: "" },
    ],
    outputLabel: "Refracted Angle (θ₂)", outputUnit: "°",
    calculate: ({ n1, theta1, n2 }) => {
      const val = n1 * Math.sin((theta1 * Math.PI) / 180) / n2;
      return Math.abs(val) <= 1 ? (Math.asin(val) * 180) / Math.PI : NaN;
    },
    steps: ({ n1, theta1, n2 }, result) => [
      `n₁sin(θ₁) = n₂sin(θ₂)`,
      `θ₂ = arcsin(n₁sin(θ₁)/n₂)`,
      `θ₂ = arcsin(${n1}×sin(${theta1}°)/${n2})`,
      `θ₂ = ${result.toPrecision(4)}°`,
    ],
  },
  18: {
    inputs: [
      { key: "f",  label: "Focal Length (f)", unit: "m" },
      { key: "do", label: "Object Distance (d₀)", unit: "m" },
    ],
    outputLabel: "Image Distance (dᵢ)", outputUnit: "m",
    calculate: ({ f, do: dov }) => 1 / (1 / f - 1 / dov),
    steps: ({ f, do: dov }, result) => [
      `1/f = 1/d₀ + 1/dᵢ  →  dᵢ = 1/(1/f − 1/d₀)`,
      `dᵢ = 1/(1/${f} − 1/${dov})`,
      `dᵢ = ${result.toPrecision(4)} m`,
    ],
  },
  19: {
    inputs: [
      { key: "I", label: "Current (I)", unit: "A" },
      { key: "R", label: "Resistance (R)", unit: "Ω" },
    ],
    outputLabel: "Voltage (V)", outputUnit: "V",
    calculate: ({ I, R }) => I * R,
    steps: ({ I, R }, result) => [
      `V = IR`,
      `V = (${I})(${R})`,
      `V = ${result.toPrecision(4)} V`,
    ],
  },
  20: {
    inputs: [
      { key: "I", label: "Current (I)", unit: "A" },
      { key: "V", label: "Voltage (V)", unit: "V" },
    ],
    outputLabel: "Power (P)", outputUnit: "W",
    calculate: ({ I, V }) => I * V,
    steps: ({ I, V }, result) => [
      `P = IV`,
      `P = (${I})(${V})`,
      `P = ${result.toPrecision(4)} W`,
    ],
  },
  21: {
    inputs: [
      { key: "q1", label: "Charge q₁", unit: "C" },
      { key: "q2", label: "Charge q₂", unit: "C" },
      { key: "r",  label: "Separation (r)", unit: "m" },
    ],
    outputLabel: "Electrostatic Force (F)", outputUnit: "N",
    calculate: ({ q1, q2, r }) => ke * q1 * q2 / (r * r),
    steps: ({ q1, q2, r }, result) => [
      `F = kₑq₁q₂/r²`,
      `F = (8.99×10⁹)(${q1})(${q2}) / (${r})²`,
      `F = ${result.toExponential(4)} N`,
    ],
  },
  22: {
    inputs: [
      { key: "F", label: "Force (F)", unit: "N" },
      { key: "q", label: "Test Charge (q)", unit: "C" },
    ],
    outputLabel: "Electric Field (E)", outputUnit: "N/C",
    calculate: ({ F, q }) => F / q,
    steps: ({ F, q }, result) => [
      `E = F/q`,
      `E = ${F} / ${q}`,
      `E = ${result.toExponential(4)} N/C`,
    ],
  },
  23: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
    ],
    outputLabel: "Energy (E)", outputUnit: "J",
    calculate: ({ m }) => m * c * c,
    steps: ({ m }, result) => [
      `E = mc²`,
      `E = (${m})(299,792,458)²`,
      `E = ${result.toExponential(4)} J`,
    ],
  },
  24: {
    inputs: [
      { key: "f", label: "Frequency (f)", unit: "Hz" },
    ],
    outputLabel: "Photon Energy (E)", outputUnit: "J",
    calculate: ({ f }) => h * f,
    steps: ({ f }, result) => [
      `E = hf`,
      `E = (6.626×10⁻³⁴)(${f})`,
      `E = ${result.toExponential(4)} J`,
    ],
  },
  25: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "v", label: "Velocity (v)", unit: "m/s" },
    ],
    outputLabel: "de Broglie Wavelength (λ)", outputUnit: "m",
    calculate: ({ m, v }) => h / (m * v),
    steps: ({ m, v }, result) => [
      `λ = h/(mv)`,
      `λ = 6.626×10⁻³⁴ / (${m})(${v})`,
      `λ = ${result.toExponential(4)} m`,
    ],
  },
  26: {
    inputs: [
      { key: "dx", label: "Position Uncertainty (Δx)", unit: "m" },
    ],
    outputLabel: "Min Momentum Uncertainty (Δp)", outputUnit: "kg·m/s",
    calculate: ({ dx }) => hbar / (2 * dx),
    steps: ({ dx }, result) => [
      `ΔxΔp ≥ ℏ/2  →  Δp_min = ℏ/(2Δx)`,
      `Δp = 1.055×10⁻³⁴ / (2 × ${dx})`,
      `Δp = ${result.toExponential(4)} kg·m/s`,
    ],
  },
  27: {
    inputs: [
      { key: "a", label: "Semi-major Axis (a)", unit: "m" },
      { key: "M", label: "Central Mass (M)", unit: "kg" },
    ],
    outputLabel: "Orbital Period (T)", outputUnit: "s",
    calculate: ({ a, M }) => 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (G * M)),
    steps: ({ a, M }, result) => [
      `T = 2π√(a³/GM)`,
      `T = 2π√((${a})³ / (6.674×10⁻¹¹ × ${M}))`,
      `T = ${result.toExponential(4)} s`,
    ],
  },
  28: {
    inputs: [
      { key: "M", label: "Mass (M)", unit: "kg" },
    ],
    outputLabel: "Schwarzschild Radius (rₛ)", outputUnit: "m",
    calculate: ({ M }) => 2 * G * M / (c * c),
    steps: ({ M }, result) => [
      `rₛ = 2GM/c²`,
      `rₛ = 2(6.674×10⁻¹¹)(${M}) / (299,792,458)²`,
      `rₛ = ${result.toExponential(4)} m`,
    ],
  },
  29: {
    inputs: [
      { key: "L", label: "Luminosity (L)", unit: "W" },
      { key: "d", label: "Distance (d)", unit: "m" },
    ],
    outputLabel: "Flux (F)", outputUnit: "W/m²",
    calculate: ({ L, d }) => L / (4 * Math.PI * d * d),
    steps: ({ L, d }, result) => [
      `F = L / (4πd²)`,
      `F = ${L} / (4π × ${d}²)`,
      `F = ${result.toExponential(4)} W/m²`,
    ],
  },
  30: {
    inputs: [
      { key: "R", label: "Stellar Radius (R)", unit: "m" },
      { key: "T", label: "Surface Temperature (T)", unit: "K" },
    ],
    outputLabel: "Luminosity (L)", outputUnit: "W",
    calculate: ({ R, T }) => 4 * Math.PI * R * R * sigma * Math.pow(T, 4),
    steps: ({ R, T }, result) => [
      `L = 4πR²σT⁴`,
      `L = 4π(${R})²(5.671×10⁻⁸)(${T})⁴`,
      `L = ${result.toExponential(4)} W`,
    ],
  },
  31: {
    inputs: [
      { key: "M", label: "Central Mass (M)", unit: "kg" },
      { key: "r", label: "Orbital Radius (r)", unit: "m" },
    ],
    outputLabel: "Orbital Velocity (v)", outputUnit: "m/s",
    calculate: ({ M, r }) => Math.sqrt(G * M / r),
    steps: ({ M, r }, result) => [
      `v = √(GM/r)`,
      `v = √(6.674×10⁻¹¹ × ${M} / ${r})`,
      `v = ${result.toPrecision(4)} m/s`,
    ],
  },
  32: {
    inputs: [
      { key: "H0", label: "Hubble Constant (H₀)", unit: "km/s/Mpc", default: "70" },
      { key: "d",  label: "Distance (d)", unit: "Mpc" },
    ],
    outputLabel: "Recession Velocity (v)", outputUnit: "km/s",
    calculate: ({ H0, d }) => H0 * d,
    steps: ({ H0, d }, result) => [
      `v = H₀d`,
      `v = (${H0})(${d})`,
      `v = ${result.toPrecision(4)} km/s`,
    ],
  },
};
