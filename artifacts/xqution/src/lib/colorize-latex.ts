/**
 * Colorizes a LaTeX math string by wrapping symbols with \textcolor commands.
 * Colors: constants → gold (#FFD700), variables → blue (#00BFFF),
 *         answer (first symbol) → white (#FFFFFF), coefficients → purple (#A855F7)
 *
 * Rules:
 * - Single-letter symbols do NOT require a word boundary (implicit multiplication
 *   is standard in math: "mgh" = m × g × h, "at" = a × t, "IR" = I × R).
 * - Multi-letter symbols (PE, KE, …) do require a word boundary.
 * - Digits that follow ^ or _ (superscript/subscript position) are left white.
 * - Tokens after ^ or _ are wrapped in {} for KaTeX grouping.
 * - Greek unicode (θ, Δ, ω, …) and special symbols (ℏ) are converted to their
 *   LaTeX command form and matched when the colorizer encounters those commands.
 * - Δ-prefixed compound symbols (Δp, Δt) each contribute \Delta AND the
 *   trailing letter(s) to the color map so both parts are colored.
 */

// ── Unicode subscript → LaTeX subscript notation ─────────────────────────────
const UNI_SUB: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  'ₛ': 's', 'ₑ': 'e', 'ₐ': 'a', 'ₙ': 'n', 'ᵢ': 'i',
};

// ── Unicode character → LaTeX command ────────────────────────────────────────
const UNICODE_TO_LATEX: Record<string, string> = {
  // Greek lowercase
  'α': '\\alpha', 'β': '\\beta',  'γ': '\\gamma',   'δ': '\\delta',
  'ε': '\\epsilon','ζ': '\\zeta', 'η': '\\eta',      'θ': '\\theta',
  'ι': '\\iota',  'κ': '\\kappa', 'λ': '\\lambda',   'μ': '\\mu',
  'ν': '\\nu',    'ξ': '\\xi',    'π': '\\pi',        'ρ': '\\rho',
  'τ': '\\tau',   'υ': '\\upsilon','φ': '\\phi',      'χ': '\\chi',
  'ψ': '\\psi',   'ω': '\\omega',
  // Greek uppercase
  'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda',
  'Ξ': '\\Xi',    'Π': '\\Pi',    'Σ': '\\Sigma', 'Υ': '\\Upsilon',
  'Φ': '\\Phi',   'Ψ': '\\Psi',  'Ω': '\\Omega',
  // Special physics symbols
  'ℏ': '\\hbar',
};

function unicodeSubToLatex(sym: string): string {
  let result = '';
  for (const ch of sym) {
    result += UNI_SUB[ch] !== undefined ? '_' + UNI_SUB[ch] : ch;
  }
  return result;
}

/**
 * Convert a raw symbol (from the variables string) to the set of LaTeX tokens
 * that represent it in a formula.
 *
 * - Greek / special chars → \command  (e.g. θ → \theta, Δ → \Delta, ℏ → \hbar)
 * - Unicode subscript digits → skipped (subscript is a positional marker; the
 *   base letter gets the color and the subscript digit stays white)
 * - Unicode subscript letters (ₛ, ₑ …) → kept as _letter for compound symbols
 *   like rₛ (Schwarzschild radius)
 * - Plain ASCII → kept as-is
 * - Δ-prefixed symbols (Δp, Δt, ΔU) emit BOTH \Delta AND the trailing letter(s)
 *   so the whole expression is colored in the equation.
 */
function symToLatexKeys(raw: string): string[] {
  const keys: string[] = [];
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (UNICODE_TO_LATEX[ch]) {
      keys.push(UNICODE_TO_LATEX[ch]);
      i++;
    } else if (UNI_SUB[ch] !== undefined) {
      const mapped = UNI_SUB[ch];
      // Only keep subscript LETTERS as part of the key (e.g. ₛ → _s for rₛ).
      // Subscript digits are positional markers — skip them so θ₁ → \theta only.
      if (/[a-zA-Z]/.test(mapped)) {
        keys[keys.length - 1] = (keys[keys.length - 1] ?? '') + '_' + mapped;
      }
      i++;
    } else {
      keys.push(ch);
      i++;
    }
  }
  return keys.filter(Boolean);
}

// ── Type detection ────────────────────────────────────────────────────────────

// Only symbols that are ALWAYS physical constants regardless of context.
// Ambiguous symbols (R, k, H₀) excluded — they rely on description matching.
const KNOWN_CONST_SET = new Set(['G', 'c', 'σ', 'g', 'h', 'ℏ', 'e', 'Nₐ', 'H₀', 'kₑ']);

// Word-boundary regex: "star radius" matches "radius", "surface temperature"
// matches "temperature", "orbital period" matches "period", etc.
const VAR_DESC_RE =
  /\b(height|depth|altitude|displacement|distance|time|position|length|width|radius|angle|velocity|resistance|temperature|pressure|volume|mass|force|charge|current|frequency|wavelength|momentum|acceleration|period|luminosity|separation|moles|amplitude|density|index|indices|refractive|star|orbital|surface|central|initial|final|incident|refracted|uncertainty|internal|energy|change)\b/i;

// Value-in-parens → constant (e.g. "Planck constant (6.626×10⁻³⁴ J·s)").
// Allows optional ~ or ≈ before the numeric value.
const VAL_PAT = /\([~≈]?[\d.,×^⁻]+/;

function symType(sym: string, desc: string, isFirst: boolean): 'answer' | 'variable' | 'constant' {
  if (isFirst) return 'answer';
  const dl = desc.toLowerCase().trim();
  if (VAR_DESC_RE.test(dl)) return 'variable';
  if (KNOWN_CONST_SET.has(sym)) return 'constant';
  if (VAL_PAT.test(desc)) return 'constant';
  return 'variable';
}

const TYPE_COLORS: Record<string, string> = {
  answer:   '#FFFFFF',
  variable: '#00BFFF',
  constant: '#FFD700',
};

function buildColorMap(variables: string): Record<string, string> {
  if (!variables) return {};
  const map: Record<string, string> = {};
  const parts = variables.split(/,(?![^(]*\))/).map(s => s.trim()).filter(Boolean);
  let isFirst = true;

  // Symbols without a description yet — they share the next part's description.
  // e.g. "m₁, m₂ = masses" splits into ["m₁"] then ["m₂ = masses"]; m₁ is pending.
  let pending: string[] = [];

  for (const part of parts) {
    const eqIdx = part.indexOf(' = ');
    if (eqIdx === -1) {
      pending.push(part.trim());
      continue;
    }
    const rawSym = part.substring(0, eqIdx).trim();
    const desc   = part.substring(eqIdx + 3).trim();

    const allSyms = [...pending, ...rawSym.split(/,\s*/)];
    pending = [];

    for (const sym of allSyms) {
      const s = sym.trim();
      if (!s) continue;
      const type  = symType(s, desc, isFirst);
      isFirst = false;
      const color = TYPE_COLORS[type];

      // Convert the unicode symbol to its LaTeX token(s) and register each key.
      // First-wins: don't overwrite if this key already has a color (e.g. when
      // both v and v₀ appear, the answer v keeps its white color).
      for (const key of symToLatexKeys(s)) {
        if (!map[key]) map[key] = color;
      }
      // Also register the traditional unicodeSubToLatex form for plain ASCII
      // subscript-letter symbols like r_s (matched as whole tokens in the LaTeX).
      const traditionalKey = unicodeSubToLatex(s);
      if (traditionalKey !== s && !UNICODE_TO_LATEX[s[0]] && !map[traditionalKey]) {
        map[traditionalKey] = color;
      }
    }
  }

  return map;
}

// ── Colorizer ─────────────────────────────────────────────────────────────────

/** Wrap token in \textcolor, with an outer {} group when after ^ or _. */
function colored(color: string, token: string, needsGroup: boolean): string {
  const inner = `\\textcolor{${color}}{${token}}`;
  return needsGroup ? `{${inner}}` : inner;
}

export function colorizeLatex(latex: string, variables?: string | null): string {
  if (!variables) return latex;

  const colorMap = buildColorMap(variables);
  if (Object.keys(colorMap).length === 0) return latex;

  // Longest symbol first so compound keys like "v_0" are tried before "v"
  const symbols = Object.keys(colorMap).filter(k => !k.startsWith('\\')).sort((a, b) => b.length - a.length);
  const commands = Object.keys(colorMap).filter(k => k.startsWith('\\'));

  let i = 0;
  let out = '';
  // True when the immediately preceding output char was ^ or _ (script context)
  let afterScript = false;

  while (i < latex.length) {
    const ch = latex[i];

    // ── LaTeX command (backslash) ─────────────────────────────────────────────
    if (ch === '\\') {
      i++;
      let cmd = '';
      while (i < latex.length && /[a-zA-Z]/.test(latex[i])) cmd += latex[i++];
      const latexCmd = '\\' + cmd;
      const cmdColor = colorMap[latexCmd];
      if (cmdColor && commands.includes(latexCmd)) {
        out += colored(cmdColor, latexCmd, afterScript);
      } else {
        out += latexCmd;
      }
      afterScript = false;
      continue;
    }

    // ── Record ^ / _ so next token gets wrapped in {} ─────────────────────────
    if (ch === '^' || ch === '_') {
      out += ch;
      i++;
      afterScript = true;
      continue;
    }

    // ── Opening brace already groups what follows; reset flag ─────────────────
    if (ch === '{') {
      out += ch;
      i++;
      afterScript = false;
      continue;
    }

    const needsGroup = afterScript;
    afterScript = false;

    // ── Try to match a known symbol at this position ──────────────────────────
    let matched = false;
    for (const sym of symbols) {
      if (!latex.startsWith(sym, i)) continue;

      const after = latex[i + sym.length];
      const isMultiLetter = sym.length > 1 && !sym.includes('_');

      // Multi-letter plain symbols (PE, KE) need a word boundary.
      // Single-letter symbols never do — implicit multiplication is standard.
      if (isMultiLetter && after && /[a-zA-Z]/.test(after)) continue;

      out += colored(colorMap[sym], sym, needsGroup);
      i += sym.length;
      matched = true;
      break;
    }
    if (matched) continue;

    // ── Color standalone digit sequences purple ───────────────────────────────
    // Exception: digits in superscript/subscript position stay white
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < latex.length && /[0-9.]/.test(latex[i])) num += latex[i++];
      if (needsGroup) {
        out += `{${num}}`;
      } else {
        out += colored('#A855F7', num, false);
      }
      continue;
    }

    out += latex[i++];
  }

  return out;
}
