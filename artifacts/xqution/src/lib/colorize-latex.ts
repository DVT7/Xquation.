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
 * - In \frac{number}{symbol} the numerator number inherits the denominator's color.
 */

// ── Unicode subscript → LaTeX subscript notation ─────────────────────────────
const UNI_SUB: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  'ₛ': 's', 'ₑ': 'e', 'ₐ': 'a', 'ₙ': 'n', 'ᵢ': 'i',
};

// ── Unicode character → LaTeX command ────────────────────────────────────────
const UNICODE_TO_LATEX: Record<string, string> = {
  'α': '\\alpha', 'β': '\\beta',  'γ': '\\gamma',   'δ': '\\delta',
  'ε': '\\epsilon','ζ': '\\zeta', 'η': '\\eta',      'θ': '\\theta',
  'ι': '\\iota',  'κ': '\\kappa', 'λ': '\\lambda',   'μ': '\\mu',
  'ν': '\\nu',    'ξ': '\\xi',    'π': '\\pi',        'ρ': '\\rho',
  'τ': '\\tau',   'υ': '\\upsilon', 'φ': '\\phi',      'χ': '\\chi',
  'ψ': '\\psi',   'ω': '\\omega',
  'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda',
  'Ξ': '\\Xi',    'Π': '\\Pi',    'Σ': '\\Sigma', 'Υ': '\\Upsilon',
  'Φ': '\\Phi',   'Ψ': '\\Psi',  'Ω': '\\Omega',
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
 * Convert a raw symbol to the set of LaTeX tokens that represent it.
 * - Greek/special chars → \command  (θ → \theta, Δ → \Delta, ℏ → \hbar)
 * - Unicode subscript digits → skipped (base letter gets the color; digit stays white)
 * - Unicode subscript letters (ₛ …) → kept as _letter for compound symbols like rₛ
 * - Δ-prefixed symbols (Δp, ΔU) emit BOTH \Delta AND the trailing letter(s)
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
      // Keep subscript LETTERS as part of the previous key (e.g. ₛ → _s for rₛ).
      // Subscript digits are positional markers — skip so θ₁ → [\theta] not [\theta, _1].
      if (/[a-zA-Z]/.test(mapped) && keys.length > 0) {
        keys[keys.length - 1] = keys[keys.length - 1] + '_' + mapped;
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

const KNOWN_CONST_SET = new Set(['G', 'c', 'σ', 'g', 'h', 'ℏ', 'e', 'Nₐ', 'H₀', 'kₑ', 'π']);

// LaTeX commands that are always constants regardless of the variables string.
// \pi is a mathematical constant; inject it into every formula's color map.
const ALWAYS_CONST_COMMANDS: Record<string, string> = {
  '\\pi': '#FFD700',
};

const VAR_DESC_RE =
  /\b(height|depth|altitude|displacement|distance|time|position|length|width|radius|angle|velocity|resistance|temperature|pressure|volume|mass|force|charge|current|frequency|wavelength|momentum|acceleration|period|luminosity|separation|moles|amplitude|density|index|indices|refractive|star|orbital|surface|central|initial|final|incident|refracted|uncertainty|internal|energy|change)\b/i;

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

      for (const key of symToLatexKeys(s)) {
        if (!map[key]) map[key] = color;
      }
      // Also keep the unicodeSubToLatex form for subscript-letter symbols like r_s
      const traditionalKey = unicodeSubToLatex(s);
      if (traditionalKey !== s && !UNICODE_TO_LATEX[s[0]] && !map[traditionalKey]) {
        map[traditionalKey] = color;
      }
    }
  }

  return map;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract a balanced brace group starting at pos.  Returns content + end index. */
function extractGroup(s: string, pos: number): { content: string; end: number } | null {
  if (s[pos] !== '{') return null;
  let depth = 0;
  for (let i = pos; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return { content: s.slice(pos + 1, i), end: i + 1 };
    }
  }
  return null;
}

/** Find the color of the first recognizable symbol in a snippet of LaTeX. */
function snippetColor(
  snippet: string,
  colorMap: Record<string, string>,
  symbols: string[],
  commands: string[],
): string | null {
  const t = snippet.trim();
  // LaTeX command (e.g. \hbar)
  const cmdMatch = t.match(/^\\([a-zA-Z]+)/);
  if (cmdMatch) {
    const key = '\\' + cmdMatch[1];
    if (commands.includes(key) && colorMap[key]) return colorMap[key];
  }
  // Plain symbol — longest first
  for (const sym of symbols) {
    if (t.startsWith(sym) || t === sym) return colorMap[sym];
  }
  return null;
}

/** Wrap token in \textcolor, with an outer {} group when after ^ or _. */
function colored(color: string, token: string, needsGroup: boolean): string {
  const inner = `\\textcolor{${color}}{${token}}`;
  return needsGroup ? `{${inner}}` : inner;
}

// ── Core colorizer (works on a pre-built colorMap) ────────────────────────────

function colorizeWithMap(
  latex: string,
  colorMap: Record<string, string>,
  symbols: string[],
  commands: string[],
): string {
  let i = 0;
  let out = '';
  let afterScript = false;

  while (i < latex.length) {
    const ch = latex[i];

    // ── LaTeX command ─────────────────────────────────────────────────────────
    if (ch === '\\') {
      i++;
      let cmd = '';
      while (i < latex.length && /[a-zA-Z]/.test(latex[i])) cmd += latex[i++];
      const latexCmd = '\\' + cmd;

      // Special case: \frac{numerator}{denominator}
      // If numerator is a bare integer and denominator starts with a colored symbol,
      // give the numerator the same color as the denominator.
      if (cmd === 'frac') {
        let j = i;
        while (j < latex.length && latex[j] === ' ') j++;
        const g1 = extractGroup(latex, j);
        if (g1) {
          let k = g1.end;
          while (k < latex.length && latex[k] === ' ') k++;
          const g2 = extractGroup(latex, k);
          if (g2) {
            const numStr   = g1.content.trim();
            const isPureNum = /^\d+(\.\d+)?$/.test(numStr);
            const coloredDenom = colorizeWithMap(g2.content, colorMap, symbols, commands);

            let coloredNum: string;
            if (isPureNum) {
              const denomColor = snippetColor(g2.content, colorMap, symbols, commands);
              coloredNum = denomColor
                ? `\\textcolor{${denomColor}}{${numStr}}`
                : `\\textcolor{#A855F7}{${numStr}}`;
            } else {
              coloredNum = colorizeWithMap(g1.content, colorMap, symbols, commands);
            }

            out += `\\frac{${coloredNum}}{${coloredDenom}}`;
            i = g2.end;
            afterScript = false;
            continue;
          }
        }
        // Fallback — couldn't parse groups
        out += latexCmd;
        afterScript = false;
        continue;
      }

      // Regular colorable command (\theta, \Delta, \hbar, …)
      if (commands.includes(latexCmd) && colorMap[latexCmd]) {
        out += colored(colorMap[latexCmd], latexCmd, afterScript);
      } else {
        out += latexCmd;
      }
      afterScript = false;
      continue;
    }

    // ── ^ / _ → next token needs {} wrapping ─────────────────────────────────
    if (ch === '^' || ch === '_') {
      out += ch;
      i++;
      afterScript = true;
      continue;
    }

    // ── Opening brace — reset afterScript (user-supplied group) ──────────────
    if (ch === '{') {
      out += ch;
      i++;
      afterScript = false;
      continue;
    }

    const needsGroup = afterScript;
    afterScript = false;

    // ── Try to match a known symbol ───────────────────────────────────────────
    let matched = false;
    for (const sym of symbols) {
      if (!latex.startsWith(sym, i)) continue;
      const after = latex[i + sym.length];
      const isMultiLetter = sym.length > 1 && !sym.includes('_');
      if (isMultiLetter && after && /[a-zA-Z]/.test(after)) continue;
      out += colored(colorMap[sym], sym, needsGroup);
      i += sym.length;
      matched = true;
      break;
    }
    if (matched) continue;

    // ── Digit sequences — purple, except in superscript/subscript position ────
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < latex.length && /[0-9.]/.test(latex[i])) num += latex[i++];
      out += needsGroup ? `{${num}}` : colored('#A855F7', num, false);
      continue;
    }

    out += latex[i++];
  }

  return out;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function colorizeLatex(latex: string, variables?: string | null): string {
  if (!variables) return latex;
  const colorMap = buildColorMap(variables);
  // Inject always-constant commands (e.g. \pi) that may not appear in variables
  for (const [cmd, color] of Object.entries(ALWAYS_CONST_COMMANDS)) {
    if (!colorMap[cmd]) colorMap[cmd] = color;
  }
  if (Object.keys(colorMap).length === 0) return latex;
  const symbols  = Object.keys(colorMap).filter(k => !k.startsWith('\\')).sort((a, b) => b.length - a.length);
  const commands = Object.keys(colorMap).filter(k => k.startsWith('\\'));
  return colorizeWithMap(latex, colorMap, symbols, commands);
}
