/**
 * Colorizes a LaTeX math string by wrapping symbols with \textcolor commands.
 * Colors: constants → gold (#FFD700), variables → blue (#00BFFF),
 *         answer (first symbol) → white (#FFFFFF), numbers → purple (#A855F7)
 *
 * Key rule: tokens that follow ^ or _ must be wrapped in {} so KaTeX
 * treats the \textcolor call as a single group (the superscript/subscript).
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

const KNOWN_CONST_SET = new Set([
  'G', 'c', 'σ', 'R', 'kₑ', 'k', 'H₀', 'g', 'Nₐ', 'e', 'h', 'ℏ',
]);

const VAR_DESCS = new Set([
  'height', 'depth', 'altitude', 'displacement', 'distance', 'time',
  'position', 'length', 'width', 'radius', 'angle', 'velocity',
]);

const VAL_PAT = /\([\d.,×^⁻]+\s*[^\)]*\)/;

function symType(sym: string, desc: string, isFirst: boolean): 'answer' | 'variable' | 'constant' {
  if (isFirst) return 'answer';
  const dl = desc.toLowerCase().trim();
  if (VAR_DESCS.has(dl)) return 'variable';
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

/** Wrap a colored token so it is safe after ^ or _ (KaTeX needs a single group). */
function colored(color: string, token: string, needsGroup: boolean): string {
  const inner = `\\textcolor{${color}}{${token}}`;
  return needsGroup ? `{${inner}}` : inner;
}

export function colorizeLatex(latex: string, variables?: string | null): string {
  if (!variables) return latex;

  const colorMap = buildColorMap(variables);
  if (Object.keys(colorMap).length === 0) return latex;

  // Longest symbol first so e.g. "v_0" is matched before "v"
  const symbols = Object.keys(colorMap).sort((a, b) => b.length - a.length);

  let i = 0;
  let out = '';
  // Track whether the last meaningful char output was ^ or _ so we know to wrap
  let lastScriptChar = false;

  while (i < latex.length) {
    const ch = latex[i];

    // Pass LaTeX commands through untouched (\frac, \sqrt, \textcolor, etc.)
    if (ch === '\\') {
      out += ch;
      i++;
      while (i < latex.length && /[a-zA-Z]/.test(latex[i])) out += latex[i++];
      lastScriptChar = false;
      continue;
    }

    // Track ^ and _ so the next token knows it needs to be a group
    if (ch === '^' || ch === '_') {
      out += ch;
      i++;
      lastScriptChar = true;
      continue;
    }

    // Opening brace: if we're right after ^ or _, the user already supplied {}
    // so the next token inside doesn't need extra wrapping
    if (ch === '{') {
      out += ch;
      i++;
      lastScriptChar = false;
      continue;
    }

    const needsGroup = lastScriptChar;
    lastScriptChar = false;

    // Try to match a known symbol at this position (longest first)
    let matched = false;
    for (const sym of symbols) {
      if (!latex.startsWith(sym, i)) continue;
      const after = latex[i + sym.length];
      // Word boundary: next char must not continue a plain identifier
      // Exception: subscripted symbols like v_0 already contain '_'
      if (after && /[a-zA-Z]/.test(after) && !sym.includes('_')) continue;
      out += colored(colorMap[sym], sym, needsGroup);
      i += sym.length;
      matched = true;
      break;
    }
    if (matched) continue;

    // Color digit sequences purple
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < latex.length && /[0-9.]/.test(latex[i])) num += latex[i++];
      out += colored('#A855F7', num, needsGroup);
      continue;
    }

    out += latex[i++];
  }

  return out;
}
