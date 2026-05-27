/**
 * Colorizes a LaTeX math string by wrapping symbols with \textcolor commands.
 * Colors: constants → gold (#FFD700), variables → blue (#00BFFF),
 *         answer (first symbol) → white (#FFFFFF), numbers → purple (#A855F7)
 *
 * Rules:
 * - Single-letter symbols do NOT require a word boundary (implicit multiplication
 *   is standard in math: "mgh" = m × g × h, "at" = a × t, "IR" = I × R).
 * - Multi-letter symbols (PE, KE, etc.) do require a word boundary.
 * - Digits that follow ^ or _ (superscript/subscript position) are left white.
 * - Tokens that follow ^ or _ are wrapped in {} so KaTeX treats them as a group.
 */

const UNI_SUB: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  'ₛ': 's', 'ₑ': 'e', 'ₐ': 'a', 'ₙ': 'n', 'ᵢ': 'i',
};

function unicodeSubToLatex(sym: string): string {
  let result = '';
  for (const ch of sym) {
    result += UNI_SUB[ch] !== undefined ? '_' + UNI_SUB[ch] : ch;
  }
  return result;
}

// Only symbols that are ALWAYS physical constants regardless of context.
// Ambiguous symbols (R, k, H₀) are excluded — they rely on description matching.
const KNOWN_CONST_SET = new Set(['G', 'c', 'σ', 'g', 'h', 'ℏ', 'e', 'Nₐ', 'H₀', 'kₑ']);

// Descriptions are matched with word-boundary regex so "star radius" matches
// "radius", "surface temperature" matches "temperature", etc.
const VAR_DESC_RE =
  /\b(height|depth|altitude|displacement|distance|time|position|length|width|radius|angle|velocity|resistance|temperature|pressure|volume|mass|force|charge|current|frequency|wavelength|momentum|acceleration|period|luminosity|separation|moles|amplitude|density|index|indices|refractive|star|orbital|surface|central|initial|final|incident|refracted)\b/i;

// Value-in-parens pattern — marks a symbol as a constant (e.g. "8.314 J/mol·K").
// Allows optional ~ or ≈ before the numeric value.
const VAL_PAT = /\([~≈]?[\d.,×^⁻]+/;

function symType(sym: string, desc: string, isFirst: boolean): 'answer' | 'variable' | 'constant' {
  if (isFirst) return 'answer';
  const dl = desc.toLowerCase().trim();
  // Description-based variable detection (word-boundary, handles compound descriptions)
  if (VAR_DESC_RE.test(dl)) return 'variable';
  // Well-known physical constants by symbol
  if (KNOWN_CONST_SET.has(sym)) return 'constant';
  // Inline value in the description marks it as a constant (e.g. "Planck constant (6.626×10⁻³⁴ J·s)")
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

  for (const part of parts) {
    const eqIdx = part.indexOf(' = ');
    if (eqIdx === -1) continue;
    const rawSym = part.substring(0, eqIdx).trim();
    const desc = part.substring(eqIdx + 3).trim();

    for (const sym of rawSym.split(/,\s*/)) {
      const s = sym.trim();
      if (!s) continue;
      const type = symType(s, desc, isFirst);
      isFirst = false;
      const latexSym = unicodeSubToLatex(s);
      map[latexSym] = TYPE_COLORS[type];
    }
  }

  return map;
}

/** Wrap token in \textcolor, with an outer {} group when after ^ or _. */
function colored(color: string, token: string, needsGroup: boolean): string {
  const inner = `\\textcolor{${color}}{${token}}`;
  return needsGroup ? `{${inner}}` : inner;
}

export function colorizeLatex(latex: string, variables?: string | null): string {
  if (!variables) return latex;

  const colorMap = buildColorMap(variables);
  if (Object.keys(colorMap).length === 0) return latex;

  // Longest symbol first so "v_0" is tried before "v"
  const symbols = Object.keys(colorMap).sort((a, b) => b.length - a.length);

  let i = 0;
  let out = '';
  // True when the immediately preceding output char was ^ or _ (script context)
  let afterScript = false;

  while (i < latex.length) {
    const ch = latex[i];

    // Pass LaTeX commands through untouched (\frac, \sqrt, \pi, etc.)
    if (ch === '\\') {
      out += ch;
      i++;
      while (i < latex.length && /[a-zA-Z]/.test(latex[i])) out += latex[i++];
      afterScript = false;
      continue;
    }

    // Record ^ and _ so the immediately following token gets wrapped in {}
    if (ch === '^' || ch === '_') {
      out += ch;
      i++;
      afterScript = true;
      continue;
    }

    // Opening brace after ^/_ means the user already supplied the group;
    // reset afterScript so contents aren't double-wrapped
    if (ch === '{') {
      out += ch;
      i++;
      afterScript = false;
      continue;
    }

    const needsGroup = afterScript;
    afterScript = false;

    // ── Try to match a known symbol at this position ──────────────────────
    let matched = false;
    for (const sym of symbols) {
      if (!latex.startsWith(sym, i)) continue;

      const after = latex[i + sym.length];
      const isMultiLetter = sym.length > 1 && !sym.includes('_');

      // Multi-letter symbols (PE, KE, …) need a word boundary so they don't
      // match a prefix of a longer word. Single-letter symbols never do —
      // implicit multiplication is standard in physics: mgh, at, IR, nRT.
      if (isMultiLetter && after && /[a-zA-Z]/.test(after)) continue;

      out += colored(colorMap[sym], sym, needsGroup);
      i += sym.length;
      matched = true;
      break;
    }
    if (matched) continue;

    // ── Color standalone digit sequences purple ───────────────────────────
    // Exception: digits in superscript/subscript position stay white
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < latex.length && /[0-9.]/.test(latex[i])) num += latex[i++];

      if (needsGroup) {
        // Superscript/subscript digit — leave white, still needs {} wrapping
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
