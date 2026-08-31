export interface CalcField {
  key: string;
  label: string;
  unit: string;
  default?: string;
}

export interface SolveMode {
  key: string;
  label: string;
  unit: string;
  latex: string;
  inputs: CalcField[];
  calculate: (v: Record<string, number>) => number;
  steps: (v: Record<string, number>, r: number) => string[];
}

export interface CalcConfig {
  inputs: CalcField[];
  outputLabel: string;
  outputUnit: string;
  calculate: (v: Record<string, number>) => number;
  steps: (v: Record<string, number>, r: number) => string[];
  solveModes?: SolveMode[];
  formulaLatex?: string;
}

export interface StoredCalculatorInput extends CalcField {}

export interface StoredCalculatorDefinition {
  formulaLatex?: string;
  outputLabel: string;
  outputUnit: string;
  expression: string;
  inputs: StoredCalculatorInput[];
}

type ExpressionToken = { kind: "number" | "identifier" | "operator" | "paren" | "comma"; value: string };

function tokenizeExpression(expression: string): ExpressionToken[] {
  const tokens: ExpressionToken[] = [];
  let i = 0;
  while (i < expression.length) {
    const char = expression[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const match = expression.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
      if (!match) throw new Error("Invalid number");
      tokens.push({ kind: "number", value: match[0] });
      i += match[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(char)) {
      const match = expression.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!match) throw new Error("Invalid variable");
      tokens.push({ kind: "identifier", value: match[0] });
      i += match[0].length;
      continue;
    }
    if ("+-*/^".includes(char)) {
      tokens.push({ kind: "operator", value: char });
      i++;
      continue;
    }
    if (char === "(" || char === ")") {
      tokens.push({ kind: "paren", value: char });
      i++;
      continue;
    }
    if (char === ",") {
      tokens.push({ kind: "comma", value: char });
      i++;
      continue;
    }
    throw new Error("Unsupported character");
  }
  return tokens;
}

function evaluateExpression(expression: string, values: Record<string, number>): number {
  const tokens = tokenizeExpression(expression);
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];

  const parseAddSub = (): number => {
    let value = parseMulDiv();
    while (peek()?.kind === "operator" && (peek()?.value === "+" || peek()?.value === "-")) {
      const operator = take().value;
      const right = parseMulDiv();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  const parseMulDiv = (): number => {
    let value = parsePower();
    while (peek()?.kind === "operator" && (peek()?.value === "*" || peek()?.value === "/")) {
      const operator = take().value;
      const right = parsePower();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };

  const parsePower = (): number => {
    const left = parseUnary();
    if (peek()?.kind === "operator" && peek()?.value === "^") {
      take();
      return Math.pow(left, parsePower());
    }
    return left;
  };

  const parseUnary = (): number => {
    if (peek()?.kind === "operator" && (peek()?.value === "+" || peek()?.value === "-")) {
      const operator = take().value;
      const value = parseUnary();
      return operator === "-" ? -value : value;
    }
    return parsePrimary();
  };

  const parsePrimary = (): number => {
    const token = take();
    if (!token) throw new Error("Incomplete expression");
    if (token.kind === "number") return Number(token.value);
    if (token.kind === "paren" && token.value === "(") {
      const value = parseAddSub();
      const closing = take();
      if (!closing || closing.value !== ")") throw new Error("Missing closing parenthesis");
      return value;
    }
    if (token.kind === "identifier") {
      if (peek()?.kind === "paren" && peek()?.value === "(") {
        take();
        const argument = parseAddSub();
        const closing = take();
        if (!closing || closing.value !== ")") throw new Error("Missing function parenthesis");
        const functions: Record<string, (n: number) => number> = {
          abs: Math.abs,
          cos: Math.cos,
          exp: Math.exp,
          ln: Math.log,
          log: Math.log10,
          sin: Math.sin,
          sqrt: Math.sqrt,
          tan: Math.tan,
        };
        const fn = functions[token.value.toLowerCase()];
        if (!fn) throw new Error("Unsupported function");
        return fn(argument);
      }
      if (token.value.toLowerCase() === "pi") return Math.PI;
      if (token.value.toLowerCase() === "e") return Math.E;
      if (!(token.value in values)) throw new Error(`Missing value for ${token.value}`);
      return values[token.value];
    }
    throw new Error("Invalid expression");
  };

  const result = parseAddSub();
  if (position !== tokens.length || !Number.isFinite(result)) throw new Error("Expression could not be calculated");
  return result;
}

export function parseStoredCalculator(raw?: string | null): CalcConfig | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredCalculatorDefinition>;
    if (
      typeof parsed.expression !== "string" ||
      !parsed.expression.trim() ||
      typeof parsed.outputLabel !== "string" ||
      typeof parsed.outputUnit !== "string" ||
      !Array.isArray(parsed.inputs) ||
      parsed.inputs.length === 0 ||
      parsed.inputs.length > 12
    ) return undefined;

    const inputs = parsed.inputs.filter((input): input is StoredCalculatorInput =>
      !!input &&
      typeof input === "object" &&
      typeof input.key === "string" &&
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(input.key) &&
      typeof input.label === "string" &&
      typeof input.unit === "string" &&
      (input.default === undefined || typeof input.default === "string")
    );
    if (inputs.length !== parsed.inputs.length || new Set(inputs.map(input => input.key)).size !== inputs.length) return undefined;

    const expression = parsed.expression.trim();
    // Parse once so an invalid expression is rejected before it reaches the UI.
    tokenizeExpression(expression);
    const outputUnit = parsed.outputUnit.trim();
    return {
      inputs,
      outputLabel: parsed.outputLabel.trim() || "Result",
      outputUnit,
      formulaLatex: typeof parsed.formulaLatex === "string" ? parsed.formulaLatex : undefined,
      calculate: (values) => evaluateExpression(expression, values),
      steps: (values, result) => [
        `Result = ${expression}`,
        `${expression} = ${inputs.map(input => `${input.key}: ${values[input.key]}`).join(", ")}`,
        `Result = ${result.toPrecision(6)}${outputUnit ? ` ${outputUnit}` : ""}`,
      ],
    };
  } catch {
    return undefined;
  }
}

const G = 6.674e-11;
const c = 299792458;
const h = 6.626e-34;
const hbar = 1.055e-34;
const sigma = 5.671e-8;
const ke = 8.99e9;
const R_gas = 8.314;

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
      `v = ${r.toPrecision(4)} m/s`,
    ],
    solveModes: [
      {
        key: "v0", label: "Initial Velocity (v₀)", unit: "m/s",
        latex: "v_0 = v - at",
        inputs: [
          { key: "v", label: "Final Velocity (v)", unit: "m/s" },
          { key: "a", label: "Acceleration (a)",   unit: "m/s²" },
          { key: "t", label: "Time (t)",           unit: "s" },
        ],
        calculate: ({ v, a, t }) => v - a * t,
        steps: ({ v, a, t }, r) => [`v₀ = v − at`, `v₀ = ${v} − (${a})(${t})`, `v₀ = ${r.toPrecision(4)} m/s`],
      },
      {
        key: "a", label: "Acceleration (a)", unit: "m/s²",
        latex: "a = \\frac{v - v_0}{t}",
        inputs: [
          { key: "v",  label: "Final Velocity (v)",    unit: "m/s" },
          { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
          { key: "t",  label: "Time (t)",              unit: "s" },
        ],
        calculate: ({ v, v0, t }) => (v - v0) / t,
        steps: ({ v, v0, t }, r) => [`a = (v − v₀)/t`, `a = (${v} − ${v0}) / ${t}`, `a = ${r.toPrecision(4)} m/s²`],
      },
      {
        key: "t", label: "Time (t)", unit: "s",
        latex: "t = \\frac{v - v_0}{a}",
        inputs: [
          { key: "v",  label: "Final Velocity (v)",    unit: "m/s" },
          { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
          { key: "a",  label: "Acceleration (a)",      unit: "m/s²" },
        ],
        calculate: ({ v, v0, a }) => (v - v0) / a,
        steps: ({ v, v0, a }, r) => [`t = (v − v₀)/a`, `t = (${v} − ${v0}) / ${a}`, `t = ${r.toPrecision(4)} s`],
      },
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
      `x = ${r.toPrecision(4)} m`,
    ],
    solveModes: [
      {
        key: "v0", label: "Initial Velocity (v₀)", unit: "m/s",
        latex: "v_0 = \\frac{x - \\frac{1}{2}at^2}{t}",
        inputs: [
          { key: "x", label: "Displacement (x)", unit: "m" },
          { key: "a", label: "Acceleration (a)", unit: "m/s²" },
          { key: "t", label: "Time (t)",         unit: "s" },
        ],
        calculate: ({ x, a, t }) => (x - 0.5 * a * t * t) / t,
        steps: ({ x, a, t }, r) => [`v₀ = (x − ½at²)/t`, `v₀ = (${x} − ½(${a})(${t})²) / ${t}`, `v₀ = ${r.toPrecision(4)} m/s`],
      },
      {
        key: "a", label: "Acceleration (a)", unit: "m/s²",
        latex: "a = \\frac{2(x - v_0 t)}{t^2}",
        inputs: [
          { key: "x",  label: "Displacement (x)",      unit: "m" },
          { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
          { key: "t",  label: "Time (t)",              unit: "s" },
        ],
        calculate: ({ x, v0, t }) => 2 * (x - v0 * t) / (t * t),
        steps: ({ x, v0, t }, r) => [`a = 2(x − v₀t)/t²`, `a = 2(${x} − (${v0})(${t})) / (${t})²`, `a = ${r.toPrecision(4)} m/s²`],
      },
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
      `v = ${r.toPrecision(4)} m/s`,
    ],
    solveModes: [
      {
        key: "a", label: "Acceleration (a)", unit: "m/s²",
        latex: "a = \\frac{v^2 - v_0^2}{2x}",
        inputs: [
          { key: "v",  label: "Final Velocity (v)",    unit: "m/s" },
          { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
          { key: "x",  label: "Displacement (x)",      unit: "m" },
        ],
        calculate: ({ v, v0, x }) => (v * v - v0 * v0) / (2 * x),
        steps: ({ v, v0, x }, r) => [`a = (v² − v₀²)/(2x)`, `a = ((${v})² − (${v0})²) / (2 × ${x})`, `a = ${r.toPrecision(4)} m/s²`],
      },
      {
        key: "x", label: "Displacement (x)", unit: "m",
        latex: "x = \\frac{v^2 - v_0^2}{2a}",
        inputs: [
          { key: "v",  label: "Final Velocity (v)",    unit: "m/s" },
          { key: "v0", label: "Initial Velocity (v₀)", unit: "m/s", default: "0" },
          { key: "a",  label: "Acceleration (a)",      unit: "m/s²" },
        ],
        calculate: ({ v, v0, a }) => (v * v - v0 * v0) / (2 * a),
        steps: ({ v, v0, a }, r) => [`x = (v² − v₀²)/(2a)`, `x = ((${v})² − (${v0})²) / (2 × ${a})`, `x = ${r.toPrecision(4)} m`],
      },
    ],
  },
  4: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "a", label: "Acceleration (a)", unit: "m/s²" },
    ],
    outputLabel: "Force (F)", outputUnit: "N",
    calculate: ({ m, a }) => m * a,
    steps: ({ m, a }, r) => [`F = ma`, `F = (${m})(${a})`, `F = ${r.toPrecision(4)} N`],
    solveModes: [
      {
        key: "m", label: "Mass (m)", unit: "kg",
        latex: "m = \\frac{F}{a}",
        inputs: [
          { key: "F", label: "Force (F)",        unit: "N" },
          { key: "a", label: "Acceleration (a)", unit: "m/s²" },
        ],
        calculate: ({ F, a }) => F / a,
        steps: ({ F, a }, r) => [`m = F/a`, `m = ${F} / ${a}`, `m = ${r.toPrecision(4)} kg`],
      },
      {
        key: "a", label: "Acceleration (a)", unit: "m/s²",
        latex: "a = \\frac{F}{m}",
        inputs: [
          { key: "F", label: "Force (F)", unit: "N" },
          { key: "m", label: "Mass (m)",  unit: "kg" },
        ],
        calculate: ({ F, m }) => F / m,
        steps: ({ F, m }, r) => [`a = F/m`, `a = ${F} / ${m}`, `a = ${r.toPrecision(4)} m/s²`],
      },
    ],
  },
  5: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "g", label: "Gravitational Accel (g)", unit: "m/s²", default: "9.81" },
    ],
    outputLabel: "Weight (W)", outputUnit: "N",
    calculate: ({ m, g: gv }) => m * gv,
    steps: ({ m, g: gv }, r) => [`W = mg`, `W = (${m})(${gv})`, `W = ${r.toPrecision(4)} N`],
    solveModes: [
      {
        key: "m", label: "Mass (m)", unit: "kg",
        latex: "m = \\frac{W}{g}",
        inputs: [
          { key: "W", label: "Weight (W)",              unit: "N" },
          { key: "g", label: "Gravitational Accel (g)", unit: "m/s²", default: "9.81" },
        ],
        calculate: ({ W, g: gv }) => W / gv,
        steps: ({ W, g: gv }, r) => [`m = W/g`, `m = ${W} / ${gv}`, `m = ${r.toPrecision(4)} kg`],
      },
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
      `KE = ½mv²`, `KE = ½(${m})(${v})²`, `KE = ${r.toPrecision(4)} J`,
    ],
    solveModes: [
      {
        key: "m", label: "Mass (m)", unit: "kg",
        latex: "m = \\frac{2\\,KE}{v^2}",
        inputs: [
          { key: "KE", label: "Kinetic Energy (KE)", unit: "J" },
          { key: "v",  label: "Velocity (v)",        unit: "m/s" },
        ],
        calculate: ({ KE, v }) => 2 * KE / (v * v),
        steps: ({ KE, v }, r) => [`m = 2KE/v²`, `m = 2(${KE}) / (${v})²`, `m = ${r.toPrecision(4)} kg`],
      },
      {
        key: "v", label: "Velocity (v)", unit: "m/s",
        latex: "v = \\sqrt{\\frac{2\\,KE}{m}}",
        inputs: [
          { key: "KE", label: "Kinetic Energy (KE)", unit: "J" },
          { key: "m",  label: "Mass (m)",            unit: "kg" },
        ],
        calculate: ({ KE, m }) => Math.sqrt(2 * KE / m),
        steps: ({ KE, m }, r) => [`v = √(2KE/m)`, `v = √(2 × ${KE} / ${m})`, `v = ${r.toPrecision(4)} m/s`],
      },
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
    steps: ({ m, g: gv, h: hv }, r) => [`PE = mgh`, `PE = (${m})(${gv})(${hv})`, `PE = ${r.toPrecision(4)} J`],
    solveModes: [
      {
        key: "m", label: "Mass (m)", unit: "kg",
        latex: "m = \\frac{PE}{gh}",
        inputs: [
          { key: "PE", label: "Potential Energy (PE)",   unit: "J" },
          { key: "g",  label: "Gravitational Accel (g)", unit: "m/s²", default: "9.81" },
          { key: "h",  label: "Height (h)",              unit: "m" },
        ],
        calculate: ({ PE, g: gv, h: hv }) => PE / (gv * hv),
        steps: ({ PE, g: gv, h: hv }, r) => [`m = PE/(gh)`, `m = ${PE} / (${gv} × ${hv})`, `m = ${r.toPrecision(4)} kg`],
      },
      {
        key: "h", label: "Height (h)", unit: "m",
        latex: "h = \\frac{PE}{mg}",
        inputs: [
          { key: "PE", label: "Potential Energy (PE)",   unit: "J" },
          { key: "m",  label: "Mass (m)",                unit: "kg" },
          { key: "g",  label: "Gravitational Accel (g)", unit: "m/s²", default: "9.81" },
        ],
        calculate: ({ PE, m, g: gv }) => PE / (m * gv),
        steps: ({ PE, m, g: gv }, r) => [`h = PE/(mg)`, `h = ${PE} / (${m} × ${gv})`, `h = ${r.toPrecision(4)} m`],
      },
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
      `W = Fd·cos(θ)`, `W = (${F})(${d})·cos(${theta}°)`, `W = ${r.toPrecision(4)} J`,
    ],
    solveModes: [
      {
        key: "F", label: "Force (F)", unit: "N",
        latex: "F = \\frac{W}{d\\cos\\theta}",
        inputs: [
          { key: "W",     label: "Work (W)",         unit: "J" },
          { key: "d",     label: "Displacement (d)", unit: "m" },
          { key: "theta", label: "Angle (θ)",        unit: "°", default: "0" },
        ],
        calculate: ({ W, d, theta }) => W / (d * Math.cos((theta * Math.PI) / 180)),
        steps: ({ W, d, theta }, r) => [`F = W/(d·cosθ)`, `F = ${W} / (${d}·cos(${theta}°))`, `F = ${r.toPrecision(4)} N`],
      },
      {
        key: "d", label: "Displacement (d)", unit: "m",
        latex: "d = \\frac{W}{F\\cos\\theta}",
        inputs: [
          { key: "W",     label: "Work (W)",   unit: "J" },
          { key: "F",     label: "Force (F)",  unit: "N" },
          { key: "theta", label: "Angle (θ)",  unit: "°", default: "0" },
        ],
        calculate: ({ W, F, theta }) => W / (F * Math.cos((theta * Math.PI) / 180)),
        steps: ({ W, F, theta }, r) => [`d = W/(F·cosθ)`, `d = ${W} / (${F}·cos(${theta}°))`, `d = ${r.toPrecision(4)} m`],
      },
    ],
  },
  9: {
    inputs: [
      { key: "W", label: "Work (W)", unit: "J" },
      { key: "t", label: "Time (t)", unit: "s" },
    ],
    outputLabel: "Power (P)", outputUnit: "W",
    calculate: ({ W: Wv, t }) => Wv / t,
    steps: ({ W: Wv, t }, r) => [`P = W/t`, `P = ${Wv} / ${t}`, `P = ${r.toPrecision(4)} W`],
    solveModes: [
      {
        key: "W", label: "Work (W)", unit: "J",
        latex: "W = Pt",
        inputs: [
          { key: "P", label: "Power (P)", unit: "W" },
          { key: "t", label: "Time (t)",  unit: "s" },
        ],
        calculate: ({ P, t }) => P * t,
        steps: ({ P, t }, r) => [`W = Pt`, `W = (${P})(${t})`, `W = ${r.toPrecision(4)} J`],
      },
      {
        key: "t", label: "Time (t)", unit: "s",
        latex: "t = \\frac{W}{P}",
        inputs: [
          { key: "W", label: "Work (W)",  unit: "J" },
          { key: "P", label: "Power (P)", unit: "W" },
        ],
        calculate: ({ W: Wv, P }) => Wv / P,
        steps: ({ W: Wv, P }, r) => [`t = W/P`, `t = ${Wv} / ${P}`, `t = ${r.toPrecision(4)} s`],
      },
    ],
  },
  10: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
      { key: "v", label: "Velocity (v)", unit: "m/s" },
    ],
    outputLabel: "Momentum (p)", outputUnit: "kg·m/s",
    calculate: ({ m, v }) => m * v,
    steps: ({ m, v }, r) => [`p = mv`, `p = (${m})(${v})`, `p = ${r.toPrecision(4)} kg·m/s`],
    solveModes: [
      {
        key: "m", label: "Mass (m)", unit: "kg",
        latex: "m = \\frac{p}{v}",
        inputs: [
          { key: "p", label: "Momentum (p)", unit: "kg·m/s" },
          { key: "v", label: "Velocity (v)", unit: "m/s" },
        ],
        calculate: ({ p, v }) => p / v,
        steps: ({ p, v }, r) => [`m = p/v`, `m = ${p} / ${v}`, `m = ${r.toPrecision(4)} kg`],
      },
      {
        key: "v", label: "Velocity (v)", unit: "m/s",
        latex: "v = \\frac{p}{m}",
        inputs: [
          { key: "p", label: "Momentum (p)", unit: "kg·m/s" },
          { key: "m", label: "Mass (m)",     unit: "kg" },
        ],
        calculate: ({ p, m }) => p / m,
        steps: ({ p, m }, r) => [`v = p/m`, `v = ${p} / ${m}`, `v = ${r.toPrecision(4)} m/s`],
      },
    ],
  },
  11: {
    inputs: [
      { key: "F", label: "Force (F)", unit: "N" },
      { key: "t", label: "Time interval (Δt)", unit: "s" },
    ],
    outputLabel: "Impulse (J)", outputUnit: "N·s",
    calculate: ({ F, t }) => F * t,
    steps: ({ F, t }, r) => [`J = FΔt`, `J = (${F})(${t})`, `J = ${r.toPrecision(4)} N·s`],
    solveModes: [
      {
        key: "F", label: "Force (F)", unit: "N",
        latex: "F = \\frac{J}{\\Delta t}",
        inputs: [
          { key: "J", label: "Impulse (J)",        unit: "N·s" },
          { key: "t", label: "Time interval (Δt)", unit: "s" },
        ],
        calculate: ({ J, t }) => J / t,
        steps: ({ J, t }, r) => [`F = J/Δt`, `F = ${J} / ${t}`, `F = ${r.toPrecision(4)} N`],
      },
      {
        key: "t", label: "Time interval (Δt)", unit: "s",
        latex: "\\Delta t = \\frac{J}{F}",
        inputs: [
          { key: "J", label: "Impulse (J)", unit: "N·s" },
          { key: "F", label: "Force (F)",   unit: "N" },
        ],
        calculate: ({ J, F }) => J / F,
        steps: ({ J, F }, r) => [`Δt = J/F`, `Δt = ${J} / ${F}`, `Δt = ${r.toPrecision(4)} s`],
      },
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
    solveModes: [
      {
        key: "r", label: "Separation (r)", unit: "m",
        latex: "r = \\sqrt{\\frac{Gm_1 m_2}{F}}",
        inputs: [
          { key: "F",  label: "Gravitational Force (F)", unit: "N" },
          { key: "m1", label: "Mass 1 (m₁)",             unit: "kg" },
          { key: "m2", label: "Mass 2 (m₂)",             unit: "kg" },
        ],
        calculate: ({ F, m1, m2 }) => Math.sqrt(G * m1 * m2 / F),
        steps: ({ F, m1, m2 }, r) => [`r = √(Gm₁m₂/F)`, `r = √((6.674×10⁻¹¹)(${m1})(${m2})/${F})`, `r = ${r.toExponential(4)} m`],
      },
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
      `vₑ = √(2GM/r)`, `vₑ = √(2 × 6.674×10⁻¹¹ × ${M} / ${r})`, `vₑ = ${result.toPrecision(4)} m/s`,
    ],
    solveModes: [
      {
        key: "r", label: "Radius (r)", unit: "m",
        latex: "r = \\frac{2GM}{v_e^2}",
        inputs: [
          { key: "ve", label: "Escape Velocity (vₑ)", unit: "m/s" },
          { key: "M",  label: "Mass of Body (M)",      unit: "kg" },
        ],
        calculate: ({ ve, M }) => 2 * G * M / (ve * ve),
        steps: ({ ve, M }, r) => [`r = 2GM/vₑ²`, `r = 2(6.674×10⁻¹¹)(${M}) / (${ve})²`, `r = ${r.toExponential(4)} m`],
      },
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
      `PV = nRT  →  P = nRT/V`, `P = (${n})(8.314)(${T}) / ${V}`, `P = ${result.toPrecision(4)} Pa`,
    ],
    solveModes: [
      {
        key: "V", label: "Volume (V)", unit: "m³",
        latex: "V = \\frac{nRT}{P}",
        inputs: [
          { key: "n", label: "Moles (n)",       unit: "mol" },
          { key: "T", label: "Temperature (T)", unit: "K" },
          { key: "P", label: "Pressure (P)",    unit: "Pa" },
        ],
        calculate: ({ n, T, P }) => n * R_gas * T / P,
        steps: ({ n, T, P }, r) => [`V = nRT/P`, `V = (${n})(8.314)(${T}) / ${P}`, `V = ${r.toPrecision(4)} m³`],
      },
      {
        key: "T", label: "Temperature (T)", unit: "K",
        latex: "T = \\frac{PV}{nR}",
        inputs: [
          { key: "P", label: "Pressure (P)", unit: "Pa" },
          { key: "V", label: "Volume (V)",   unit: "m³" },
          { key: "n", label: "Moles (n)",    unit: "mol" },
        ],
        calculate: ({ P, V, n }) => P * V / (n * R_gas),
        steps: ({ P, V, n }, r) => [`T = PV/(nR)`, `T = (${P})(${V}) / (${n} × 8.314)`, `T = ${r.toPrecision(4)} K`],
      },
      {
        key: "n", label: "Moles (n)", unit: "mol",
        latex: "n = \\frac{PV}{RT}",
        inputs: [
          { key: "P", label: "Pressure (P)",    unit: "Pa" },
          { key: "V", label: "Volume (V)",       unit: "m³" },
          { key: "T", label: "Temperature (T)", unit: "K" },
        ],
        calculate: ({ P, V, T }) => P * V / (R_gas * T),
        steps: ({ P, V, T }, r) => [`n = PV/(RT)`, `n = (${P})(${V}) / (8.314 × ${T})`, `n = ${r.toPrecision(4)} mol`],
      },
    ],
  },
  15: {
    inputs: [
      { key: "Q", label: "Heat Added (Q)", unit: "J" },
      { key: "W", label: "Work Done by System (W)", unit: "J" },
    ],
    outputLabel: "Change in Internal Energy (ΔU)", outputUnit: "J",
    calculate: ({ Q, W: Wv }) => Q - Wv,
    steps: ({ Q, W: Wv }, result) => [`ΔU = Q − W`, `ΔU = ${Q} − ${Wv}`, `ΔU = ${result.toPrecision(4)} J`],
    solveModes: [
      {
        key: "Q", label: "Heat Added (Q)", unit: "J",
        latex: "Q = \\Delta U + W",
        inputs: [
          { key: "dU", label: "Change in Internal Energy (ΔU)", unit: "J" },
          { key: "W",  label: "Work Done by System (W)",         unit: "J" },
        ],
        calculate: ({ dU, W: Wv }) => dU + Wv,
        steps: ({ dU, W: Wv }, r) => [`Q = ΔU + W`, `Q = ${dU} + ${Wv}`, `Q = ${r.toPrecision(4)} J`],
      },
      {
        key: "W", label: "Work Done by System (W)", unit: "J",
        latex: "W = Q - \\Delta U",
        inputs: [
          { key: "Q",  label: "Heat Added (Q)",                   unit: "J" },
          { key: "dU", label: "Change in Internal Energy (ΔU)",   unit: "J" },
        ],
        calculate: ({ Q, dU }) => Q - dU,
        steps: ({ Q, dU }, r) => [`W = Q − ΔU`, `W = ${Q} − ${dU}`, `W = ${r.toPrecision(4)} J`],
      },
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
      `v = fλ`, `v = (${f})(${lambda})`, `v = ${result.toPrecision(4)} m/s`,
    ],
    solveModes: [
      {
        key: "f", label: "Frequency (f)", unit: "Hz",
        latex: "f = \\frac{v}{\\lambda}",
        inputs: [
          { key: "v",      label: "Wave Speed (v)",  unit: "m/s" },
          { key: "lambda", label: "Wavelength (λ)",  unit: "m" },
        ],
        calculate: ({ v, lambda }) => v / lambda,
        steps: ({ v, lambda }, r) => [`f = v/λ`, `f = ${v} / ${lambda}`, `f = ${r.toPrecision(4)} Hz`],
      },
      {
        key: "lambda", label: "Wavelength (λ)", unit: "m",
        latex: "\\lambda = \\frac{v}{f}",
        inputs: [
          { key: "v", label: "Wave Speed (v)", unit: "m/s" },
          { key: "f", label: "Frequency (f)",  unit: "Hz" },
        ],
        calculate: ({ v, f }) => v / f,
        steps: ({ v, f }, r) => [`λ = v/f`, `λ = ${v} / ${f}`, `λ = ${r.toPrecision(4)} m`],
      },
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
      `n₁sin(θ₁) = n₂sin(θ₂)`, `θ₂ = arcsin(n₁sin(θ₁)/n₂)`,
      `θ₂ = arcsin(${n1}×sin(${theta1}°)/${n2})`, `θ₂ = ${result.toPrecision(4)}°`,
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
      `dᵢ = 1/(1/${f} − 1/${dov})`, `dᵢ = ${result.toPrecision(4)} m`,
    ],
    solveModes: [
      {
        key: "f", label: "Focal Length (f)", unit: "m",
        latex: "f = \\frac{1}{\\dfrac{1}{d_0} + \\dfrac{1}{d_i}}",
        inputs: [
          { key: "do", label: "Object Distance (d₀)", unit: "m" },
          { key: "di", label: "Image Distance (dᵢ)",  unit: "m" },
        ],
        calculate: ({ do: dov, di }) => 1 / (1 / dov + 1 / di),
        steps: ({ do: dov, di }, r) => [`f = 1/(1/d₀ + 1/dᵢ)`, `f = 1/(1/${dov} + 1/${di})`, `f = ${r.toPrecision(4)} m`],
      },
      {
        key: "do", label: "Object Distance (d₀)", unit: "m",
        latex: "d_0 = \\frac{1}{\\dfrac{1}{f} - \\dfrac{1}{d_i}}",
        inputs: [
          { key: "f",  label: "Focal Length (f)",    unit: "m" },
          { key: "di", label: "Image Distance (dᵢ)", unit: "m" },
        ],
        calculate: ({ f, di }) => 1 / (1 / f - 1 / di),
        steps: ({ f, di }, r) => [`d₀ = 1/(1/f − 1/dᵢ)`, `d₀ = 1/(1/${f} − 1/${di})`, `d₀ = ${r.toPrecision(4)} m`],
      },
    ],
  },
  19: {
    inputs: [
      { key: "I", label: "Current (I)", unit: "A" },
      { key: "R", label: "Resistance (R)", unit: "Ω" },
    ],
    outputLabel: "Voltage (V)", outputUnit: "V",
    calculate: ({ I, R }) => I * R,
    steps: ({ I, R }, result) => [`V = IR`, `V = (${I})(${R})`, `V = ${result.toPrecision(4)} V`],
    solveModes: [
      {
        key: "I", label: "Current (I)", unit: "A",
        latex: "I = \\frac{V}{R}",
        inputs: [
          { key: "V", label: "Voltage (V)",    unit: "V" },
          { key: "R", label: "Resistance (R)", unit: "Ω" },
        ],
        calculate: ({ V, R }) => V / R,
        steps: ({ V, R }, r) => [`I = V/R`, `I = ${V} / ${R}`, `I = ${r.toPrecision(4)} A`],
      },
      {
        key: "R", label: "Resistance (R)", unit: "Ω",
        latex: "R = \\frac{V}{I}",
        inputs: [
          { key: "V", label: "Voltage (V)", unit: "V" },
          { key: "I", label: "Current (I)", unit: "A" },
        ],
        calculate: ({ V, I }) => V / I,
        steps: ({ V, I }, r) => [`R = V/I`, `R = ${V} / ${I}`, `R = ${r.toPrecision(4)} Ω`],
      },
    ],
  },
  20: {
    inputs: [
      { key: "I", label: "Current (I)", unit: "A" },
      { key: "V", label: "Voltage (V)", unit: "V" },
    ],
    outputLabel: "Power (P)", outputUnit: "W",
    calculate: ({ I, V }) => I * V,
    steps: ({ I, V }, result) => [`P = IV`, `P = (${I})(${V})`, `P = ${result.toPrecision(4)} W`],
    solveModes: [
      {
        key: "I", label: "Current (I)", unit: "A",
        latex: "I = \\frac{P}{V}",
        inputs: [
          { key: "P", label: "Power (P)",   unit: "W" },
          { key: "V", label: "Voltage (V)", unit: "V" },
        ],
        calculate: ({ P, V }) => P / V,
        steps: ({ P, V }, r) => [`I = P/V`, `I = ${P} / ${V}`, `I = ${r.toPrecision(4)} A`],
      },
      {
        key: "V", label: "Voltage (V)", unit: "V",
        latex: "V = \\frac{P}{I}",
        inputs: [
          { key: "P", label: "Power (P)",   unit: "W" },
          { key: "I", label: "Current (I)", unit: "A" },
        ],
        calculate: ({ P, I }) => P / I,
        steps: ({ P, I }, r) => [`V = P/I`, `V = ${P} / ${I}`, `V = ${r.toPrecision(4)} V`],
      },
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
      `F = kₑq₁q₂/r²`, `F = (8.99×10⁹)(${q1})(${q2}) / (${r})²`, `F = ${result.toExponential(4)} N`,
    ],
    solveModes: [
      {
        key: "r", label: "Separation (r)", unit: "m",
        latex: "r = \\sqrt{\\frac{k_e q_1 q_2}{F}}",
        inputs: [
          { key: "F",  label: "Electrostatic Force (F)", unit: "N" },
          { key: "q1", label: "Charge q₁",               unit: "C" },
          { key: "q2", label: "Charge q₂",               unit: "C" },
        ],
        calculate: ({ F, q1, q2 }) => Math.sqrt(ke * q1 * q2 / F),
        steps: ({ F, q1, q2 }, r) => [`r = √(kₑq₁q₂/F)`, `r = √((8.99×10⁹)(${q1})(${q2})/${F})`, `r = ${r.toExponential(4)} m`],
      },
    ],
  },
  22: {
    inputs: [
      { key: "F", label: "Force (F)", unit: "N" },
      { key: "q", label: "Test Charge (q)", unit: "C" },
    ],
    outputLabel: "Electric Field (E)", outputUnit: "N/C",
    calculate: ({ F, q }) => F / q,
    steps: ({ F, q }, result) => [`E = F/q`, `E = ${F} / ${q}`, `E = ${result.toExponential(4)} N/C`],
    solveModes: [
      {
        key: "F", label: "Force (F)", unit: "N",
        latex: "F = Eq",
        inputs: [
          { key: "E", label: "Electric Field (E)", unit: "N/C" },
          { key: "q", label: "Test Charge (q)",    unit: "C" },
        ],
        calculate: ({ E, q }) => E * q,
        steps: ({ E, q }, r) => [`F = Eq`, `F = (${E})(${q})`, `F = ${r.toExponential(4)} N`],
      },
      {
        key: "q", label: "Test Charge (q)", unit: "C",
        latex: "q = \\frac{F}{E}",
        inputs: [
          { key: "F", label: "Force (F)",          unit: "N" },
          { key: "E", label: "Electric Field (E)", unit: "N/C" },
        ],
        calculate: ({ F, E }) => F / E,
        steps: ({ F, E }, r) => [`q = F/E`, `q = ${F} / ${E}`, `q = ${r.toExponential(4)} C`],
      },
    ],
  },
  23: {
    inputs: [
      { key: "m", label: "Mass (m)", unit: "kg" },
    ],
    outputLabel: "Energy (E)", outputUnit: "J",
    calculate: ({ m }) => m * c * c,
    steps: ({ m }, result) => [
      `E = mc²`, `E = (${m})(299,792,458)²`, `E = ${result.toExponential(4)} J`,
    ],
    solveModes: [
      {
        key: "m", label: "Mass (m)", unit: "kg",
        latex: "m = \\frac{E}{c^2}",
        inputs: [{ key: "E", label: "Energy (E)", unit: "J" }],
        calculate: ({ E }) => E / (c * c),
        steps: ({ E }, r) => [`m = E/c²`, `m = ${E} / (299,792,458)²`, `m = ${r.toExponential(4)} kg`],
      },
    ],
  },
  24: {
    inputs: [
      { key: "f", label: "Frequency (f)", unit: "Hz" },
    ],
    outputLabel: "Photon Energy (E)", outputUnit: "J",
    calculate: ({ f }) => h * f,
    steps: ({ f }, result) => [
      `E = hf`, `E = (6.626×10⁻³⁴)(${f})`, `E = ${result.toExponential(4)} J`,
    ],
    solveModes: [
      {
        key: "f", label: "Frequency (f)", unit: "Hz",
        latex: "f = \\frac{E}{h}",
        inputs: [{ key: "E", label: "Photon Energy (E)", unit: "J" }],
        calculate: ({ E }) => E / h,
        steps: ({ E }, r) => [`f = E/h`, `f = ${E} / 6.626×10⁻³⁴`, `f = ${r.toExponential(4)} Hz`],
      },
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
      `λ = h/(mv)`, `λ = 6.626×10⁻³⁴ / (${m})(${v})`, `λ = ${result.toExponential(4)} m`,
    ],
    solveModes: [
      {
        key: "v", label: "Velocity (v)", unit: "m/s",
        latex: "v = \\frac{h}{m\\lambda}",
        inputs: [
          { key: "lambda", label: "Wavelength (λ)", unit: "m" },
          { key: "m",      label: "Mass (m)",        unit: "kg" },
        ],
        calculate: ({ lambda, m }) => h / (m * lambda),
        steps: ({ lambda, m }, r) => [`v = h/(mλ)`, `v = 6.626×10⁻³⁴ / (${m})(${lambda})`, `v = ${r.toExponential(4)} m/s`],
      },
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
      `Δp = 1.055×10⁻³⁴ / (2 × ${dx})`, `Δp = ${result.toExponential(4)} kg·m/s`,
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
      `T = 2π√(a³/GM)`, `T = 2π√((${a})³ / (6.674×10⁻¹¹ × ${M}))`, `T = ${result.toExponential(4)} s`,
    ],
    solveModes: [
      {
        key: "a", label: "Semi-major Axis (a)", unit: "m",
        latex: "a = \\sqrt[3]{\\frac{GM\\,T^2}{4\\pi^2}}",
        inputs: [
          { key: "T", label: "Orbital Period (T)", unit: "s" },
          { key: "M", label: "Central Mass (M)",   unit: "kg" },
        ],
        calculate: ({ T, M }) => Math.cbrt(G * M * (T / (2 * Math.PI)) ** 2),
        steps: ({ T, M }, r) => [`a = (GM(T/2π)²)^(1/3)`, `a³ = GM(T/2π)²`, `a = ${r.toExponential(4)} m`],
      },
    ],
  },
  28: {
    inputs: [
      { key: "M", label: "Mass (M)", unit: "kg" },
    ],
    outputLabel: "Schwarzschild Radius (rₛ)", outputUnit: "m",
    calculate: ({ M }) => 2 * G * M / (c * c),
    steps: ({ M }, result) => [
      `rₛ = 2GM/c²`, `rₛ = 2(6.674×10⁻¹¹)(${M}) / (299,792,458)²`, `rₛ = ${result.toExponential(4)} m`,
    ],
    solveModes: [
      {
        key: "M", label: "Mass (M)", unit: "kg",
        latex: "M = \\frac{r_s c^2}{2G}",
        inputs: [{ key: "rs", label: "Schwarzschild Radius (rₛ)", unit: "m" }],
        calculate: ({ rs }) => rs * c * c / (2 * G),
        steps: ({ rs }, r) => [`M = rₛc²/(2G)`, `M = (${rs})(299,792,458)² / (2 × 6.674×10⁻¹¹)`, `M = ${r.toExponential(4)} kg`],
      },
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
      `F = L / (4πd²)`, `F = ${L} / (4π × ${d}²)`, `F = ${result.toExponential(4)} W/m²`,
    ],
    solveModes: [
      {
        key: "L", label: "Luminosity (L)", unit: "W",
        latex: "L = 4\\pi d^2 F",
        inputs: [
          { key: "F", label: "Flux (F)",      unit: "W/m²" },
          { key: "d", label: "Distance (d)",  unit: "m" },
        ],
        calculate: ({ F, d }) => F * 4 * Math.PI * d * d,
        steps: ({ F, d }, r) => [`L = 4πd²F`, `L = 4π(${d})²(${F})`, `L = ${r.toExponential(4)} W`],
      },
      {
        key: "d", label: "Distance (d)", unit: "m",
        latex: "d = \\sqrt{\\frac{L}{4\\pi F}}",
        inputs: [
          { key: "L", label: "Luminosity (L)", unit: "W" },
          { key: "F", label: "Flux (F)",        unit: "W/m²" },
        ],
        calculate: ({ L, F }) => Math.sqrt(L / (4 * Math.PI * F)),
        steps: ({ L, F }, r) => [`d = √(L/(4πF))`, `d = √(${L} / (4π × ${F}))`, `d = ${r.toExponential(4)} m`],
      },
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
      `L = 4πR²σT⁴`, `L = 4π(${R})²(5.671×10⁻⁸)(${T})⁴`, `L = ${result.toExponential(4)} W`,
    ],
    solveModes: [
      {
        key: "R", label: "Stellar Radius (R)", unit: "m",
        latex: "R = \\sqrt{\\frac{L}{4\\pi\\sigma T^4}}",
        inputs: [
          { key: "L", label: "Luminosity (L)",          unit: "W" },
          { key: "T", label: "Surface Temperature (T)", unit: "K" },
        ],
        calculate: ({ L, T }) => Math.sqrt(L / (4 * Math.PI * sigma * Math.pow(T, 4))),
        steps: ({ L, T }, r) => [`R = √(L/(4πσT⁴))`, `R = √(${L} / (4π × 5.671×10⁻⁸ × (${T})⁴))`, `R = ${r.toExponential(4)} m`],
      },
      {
        key: "T", label: "Surface Temperature (T)", unit: "K",
        latex: "T = \\left(\\frac{L}{4\\pi R^2 \\sigma}\\right)^{\\!1/4}",
        inputs: [
          { key: "L", label: "Luminosity (L)",     unit: "W" },
          { key: "R", label: "Stellar Radius (R)", unit: "m" },
        ],
        calculate: ({ L, R }) => Math.pow(L / (4 * Math.PI * R * R * sigma), 0.25),
        steps: ({ L, R }, r) => [`T = (L/(4πR²σ))^(1/4)`, `T = (${L} / (4π(${R})² × 5.671×10⁻⁸))^0.25`, `T = ${r.toExponential(4)} K`],
      },
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
      `v = √(GM/r)`, `v = √(6.674×10⁻¹¹ × ${M} / ${r})`, `v = ${result.toPrecision(4)} m/s`,
    ],
    solveModes: [
      {
        key: "r", label: "Orbital Radius (r)", unit: "m",
        latex: "r = \\frac{GM}{v^2}",
        inputs: [
          { key: "v", label: "Orbital Velocity (v)", unit: "m/s" },
          { key: "M", label: "Central Mass (M)",      unit: "kg" },
        ],
        calculate: ({ v, M }) => G * M / (v * v),
        steps: ({ v, M }, r) => [`r = GM/v²`, `r = (6.674×10⁻¹¹)(${M}) / (${v})²`, `r = ${r.toExponential(4)} m`],
      },
    ],
  },
  32: {
    inputs: [
      { key: "H0", label: "Hubble Constant (H₀)", unit: "km/s/Mpc", default: "70" },
      { key: "d",  label: "Distance (d)", unit: "Mpc" },
    ],
    outputLabel: "Recession Velocity (v)", outputUnit: "km/s",
    calculate: ({ H0, d }) => H0 * d,
    steps: ({ H0, d }, result) => [`v = H₀d`, `v = (${H0})(${d})`, `v = ${result.toPrecision(4)} km/s`],
    solveModes: [
      {
        key: "d", label: "Distance (d)", unit: "Mpc",
        latex: "d = \\frac{v}{H_0}",
        inputs: [
          { key: "v",  label: "Recession Velocity (v)", unit: "km/s" },
          { key: "H0", label: "Hubble Constant (H₀)",   unit: "km/s/Mpc", default: "70" },
        ],
        calculate: ({ v, H0 }) => v / H0,
        steps: ({ v, H0 }, r) => [`d = v/H₀`, `d = ${v} / ${H0}`, `d = ${r.toPrecision(4)} Mpc`],
      },
    ],
  },
};
