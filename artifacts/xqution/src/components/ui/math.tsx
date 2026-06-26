import katex from "katex";
import { colorizeLatex } from "@/lib/colorize-latex";

// ── Unicode → LaTeX converter ─────────────────────────────────────────────────
// Converts common Unicode math characters to LaTeX equivalents so plain-text
// physics strings can be rendered by KaTeX.
export function toLatex(s: string): string {
  return s
    // ── Negative scientific notation first (before individual superscripts)
    // e.g. 10⁻¹³ → 10^{-13}
    .replace(/(\d+)⁻([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, base, exp) => {
      const map: Record<string, string> = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9' };
      const digits = [...exp].map((c: string) => map[c] ?? c).join('');
      return `${base}^{-${digits}}`;
    })
    // ── Subscripts
    .replace(/v₀/g, 'v_0').replace(/x₀/g, 'x_0').replace(/a₀/g, 'a_0')
    .replace(/F₀/g, 'F_0').replace(/E₀/g, 'E_0').replace(/p₀/g, 'p_0')
    .replace(/₀/g, '_0').replace(/₁/g, '_1').replace(/₂/g, '_2')
    .replace(/₃/g, '_3').replace(/₄/g, '_4').replace(/₅/g, '_5')
    .replace(/₆/g, '_6').replace(/₇/g, '_7').replace(/₈/g, '_8').replace(/₉/g, '_9')
    // ── Superscripts
    .replace(/⁻¹/g, '^{-1}').replace(/⁻²/g, '^{-2}').replace(/⁻³/g, '^{-3}')
    .replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4')
    .replace(/⁵/g, '^5').replace(/⁶/g, '^6').replace(/⁷/g, '^7')
    .replace(/⁸/g, '^8').replace(/⁹/g, '^9').replace(/¹/g, '^1')
    // ── Fractions
    .replace(/½/g, '\\tfrac{1}{2}')
    .replace(/⅓/g, '\\tfrac{1}{3}')
    .replace(/¼/g, '\\tfrac{1}{4}')
    // ── Greek letters
    .replace(/π/g, '\\pi')
    .replace(/Δ/g, '\\Delta\\!')
    .replace(/δ/g, '\\delta')
    .replace(/λ/g, '\\lambda')
    .replace(/σ/g, '\\sigma')
    .replace(/μ/g, '\\mu')
    .replace(/θ/g, '\\theta')
    .replace(/ω/g, '\\omega')
    .replace(/α/g, '\\alpha')
    .replace(/β/g, '\\beta')
    .replace(/γ/g, '\\gamma')
    .replace(/ρ/g, '\\rho')
    .replace(/φ/g, '\\phi')
    .replace(/η/g, '\\eta')
    // ── Math symbols
    .replace(/≈/g, '\\approx ')
    .replace(/≥/g, '\\geq ')
    .replace(/≤/g, '\\leq ')
    .replace(/≠/g, '\\neq ')
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/·/g, '\\cdot ')
    .replace(/√/g, '\\sqrt')
    .replace(/∞/g, '\\infty')
    .replace(/°/g, '^{\\circ}')
    .replace(/→/g, '\\to ')
    .replace(/←/g, '\\leftarrow ')
    // ── Unicode minus → ASCII minus
    .replace(/−/g, '-')
    // ── Superscript braces: wrap bare ^N in ^{N} for multi-digit exponents
    .replace(/\^(\d{2,})/g, '^{$1}');
}

// ── MathText: renders a mixed plain-text + $...$ inline-math string ───────────
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          return <InlineMath key={i} math={math} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

interface MathProps {
  math: string;
  className?: string;
}

interface ColoredMathProps extends MathProps {
  variables?: string | null;
}

export function BlockMath({ math, className }: MathProps) {
  let html = "";
  try {
    html = katex.renderToString(math, { displayMode: true, throwOnError: false });
  } catch {
    html = `<span class="text-red-400 text-sm">${math}</span>`;
  }
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function ColoredBlockMath({ math, variables, className }: ColoredMathProps) {
  const coloredMath = colorizeLatex(math, variables);
  let html = "";
  try {
    html = katex.renderToString(coloredMath, { displayMode: true, throwOnError: false, trust: true, strict: false });
  } catch {
    // Fall back to uncolored if colorization breaks KaTeX
    try {
      html = katex.renderToString(math, { displayMode: true, throwOnError: false });
    } catch {
      html = `<span class="text-red-400 text-sm">${math}</span>`;
    }
  }
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function InlineMath({ math, className }: MathProps) {
  let html = "";
  try {
    html = katex.renderToString(math, { displayMode: false, throwOnError: false });
  } catch {
    html = `<span class="text-red-400 text-sm">${math}</span>`;
  }
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
