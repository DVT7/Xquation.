import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX, Square } from "lucide-react";

// ── Smart math-to-speech converter ───────────────────────────────────────────
//
// Context-aware: operators like * are read as "times" when surrounded by math
// tokens (digits, letters, parens) but as "asterisk" when isolated.

const MATH_TOKEN = /[a-zA-Z0-9πσθλωαβγδεζηικμνξρτυφχψΔΩΣΛΘΞΠΥΦΨΓ)\]]/;

function isMathLeft(s: string, i: number) {
  const ch = s[i - 1];
  return ch !== undefined && MATH_TOKEN.test(ch);
}

function isMathRight(s: string, i: number) {
  const ch = s[i + 1];
  return ch !== undefined && MATH_TOKEN.test(ch);
}

export function mathToSpeech(raw: string): string {
  const t = raw.trim();

  // ── Standalone single-symbol literal readings ──────────────────────────────
  const STANDALONE: Record<string, string> = {
    "*": "asterisk", "×": "multiplication symbol", "/": "slash", "^": "caret",
    "=": "equals sign", "+": "plus sign", "-": "dash", "−": "minus sign",
    "<": "less-than sign", ">": "greater-than sign", "~": "tilde", "|": "vertical bar",
    "\\": "backslash", "(": "open parenthesis", ")": "close parenthesis",
    "[": "open bracket", "]": "close bracket", "{": "open brace", "}": "close brace",
    "%": "percent", "#": "hash", "@": "at sign", "&": "ampersand", "!": "exclamation mark",
    "?": "question mark", "_": "underscore", ".": "period", ",": "comma",
    ":": "colon", ";": "semicolon", "≈": "approximately-equals sign",
    "≤": "less-than-or-equal sign", "≥": "greater-than-or-equal sign",
    "≠": "not-equal sign", "√": "square-root sign", "∞": "infinity symbol",
    "°": "degree symbol", "π": "pi", "σ": "sigma", "θ": "theta", "λ": "lambda",
    "ω": "omega", "α": "alpha", "β": "beta", "Δ": "delta", "μ": "mu",
    "ρ": "rho", "η": "eta", "φ": "phi", "ℏ": "h-bar", "²": "superscript 2",
    "³": "superscript 3",
  };
  if (STANDALONE[t]) return STANDALONE[t];

  let s = t;

  // ── 1. Strip LaTeX formatting commands ────────────────────────────────────
  s = s.replace(/\\textcolor\{[^}]+\}\{([^}]+)\}/g, "$1");
  s = s.replace(/\\text\{([^}]+)\}/g, "$1");
  s = s.replace(/\\left[\s([{|]/g, "");
  s = s.replace(/\\right[\s)\]}|]/g, "");
  s = s.replace(/\\!\s*/g, "");
  s = s.replace(/\\[,;: ]/g, " ");

  // ── 2. LaTeX fractions ────────────────────────────────────────────────────
  s = s.replace(/\\(?:t?frac)\{([^}]+)\}\{([^}]+)\}/g, (_, n, d) =>
    `${mathToSpeech(n)} over ${mathToSpeech(d)}`
  );

  // ── 3. LaTeX sqrt ─────────────────────────────────────────────────────────
  s = s.replace(/\\sqrt\{([^}]+)\}/g, (_, c) => `square root of ${mathToSpeech(c)}`);
  s = s.replace(/\\sqrt\b/g, "square root of ");

  // ── 4. LaTeX commands → spoken words ─────────────────────────────────────
  const LATEX: Record<string, string> = {
    "\\sigma": "sigma", "\\pi": "pi", "\\theta": "theta", "\\lambda": "lambda",
    "\\omega": "omega", "\\alpha": "alpha", "\\beta": "beta", "\\gamma": "gamma",
    "\\delta": "delta", "\\epsilon": "epsilon", "\\zeta": "zeta", "\\eta": "eta",
    "\\iota": "iota", "\\kappa": "kappa", "\\mu": "mu", "\\nu": "nu",
    "\\xi": "xi", "\\rho": "rho", "\\tau": "tau", "\\phi": "phi",
    "\\chi": "chi", "\\psi": "psi", "\\upsilon": "upsilon",
    "\\Delta": "delta", "\\Sigma": "sigma", "\\Omega": "omega", "\\Gamma": "gamma",
    "\\Lambda": "lambda", "\\Theta": "theta", "\\Xi": "xi", "\\Pi": "pi",
    "\\Upsilon": "upsilon", "\\Phi": "phi", "\\Psi": "psi",
    "\\hbar": "h-bar", "\\infty": "infinity",
    "\\times": "times", "\\div": "divided by", "\\cdot": "times",
    "\\approx": "approximately", "\\leq": "less than or equal to",
    "\\geq": "greater than or equal to", "\\neq": "not equal to",
    "\\pm": "plus or minus", "\\mp": "minus or plus",
    "\\propto": "proportional to", "\\sim": "approximately",
    "\\nabla": "del", "\\partial": "partial",
  };
  for (const [cmd, word] of Object.entries(LATEX)) {
    s = s.replace(new RegExp(cmd.replace("\\", "\\\\") + "\\b", "g"), ` ${word} `);
  }

  // ── 5. Scientific notation: N × 10^M ─────────────────────────────────────
  s = s.replace(
    /(\d[\d.]*)\s*(?:×|\\times|\*)\s*10\s*\^?\{?(-?\d+)\}?/g,
    (_, n, exp) => {
      const e = parseInt(exp);
      const pw = e === 2 ? "squared" : e === 3 ? "cubed" : `to the ${e}`;
      return `${n} times 10 ${pw}`;
    }
  );

  // ── 6. Superscripts ───────────────────────────────────────────────────────
  s = s.replace(/\^\{-(\d+)\}/g, (_, e) => ` to the minus ${e}`);
  s = s.replace(/\^2\b/g, " squared");
  s = s.replace(/\^3\b/g, " cubed");
  s = s.replace(/\^\{(\d+)\}/g, (_, e) => ` to the ${e}`);
  s = s.replace(/\^(\d+)/g, (_, e) => ` to the ${e}`);
  s = s.replace(/²/g, " squared");
  s = s.replace(/³/g, " cubed");
  s = s.replace(/⁴/g, " to the 4");
  s = s.replace(/⁵/g, " to the 5");
  s = s.replace(/⁶/g, " to the 6");
  s = s.replace(/⁻¹/g, " to the minus 1");
  s = s.replace(/⁻²/g, " to the minus 2");
  s = s.replace(/⁻³/g, " to the minus 3");

  // ── 7. Subscripts ─────────────────────────────────────────────────────────
  s = s.replace(/v₀/g, "v naught").replace(/v_0\b/g, "v naught");
  s = s.replace(/([a-zA-Z])₀/g, "$1 naught").replace(/([a-zA-Z])_0\b/g, "$1 naught");
  s = s.replace(/([a-zA-Z])_\{([^}]+)\}/g, "$1 sub $2");
  s = s.replace(/([a-zA-Z])_([a-zA-Z0-9]+)/g, "$1 sub $2");
  s = s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => " sub " + "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(c)]);

  // ── 8. Greek unicode → spoken ─────────────────────────────────────────────
  const GREEK: Record<string, string> = {
    "π": "pi", "σ": "sigma", "θ": "theta", "λ": "lambda", "ω": "omega",
    "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "μ": "mu",
    "ρ": "rho", "η": "eta", "φ": "phi", "ℏ": "h-bar", "Δ": "delta",
    "Σ": "sigma", "Ω": "omega", "Λ": "lambda", "Γ": "gamma", "Θ": "theta",
  };
  for (const [ch, word] of Object.entries(GREEK)) {
    s = s.replace(new RegExp(ch, "g"), ` ${word} `);
  }

  // ── 9. Context-aware operators ────────────────────────────────────────────
  // Walk character-by-character for ambiguous symbols
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "*") {
      out += isMathLeft(s, i) && isMathRight(s, i) ? " times " : " asterisk ";
    } else if (ch === "/") {
      out += isMathLeft(s, i) && isMathRight(s, i) ? " over " : " slash ";
    } else if (ch === "^") {
      out += isMathLeft(s, i) ? " to the power of " : " caret ";
    } else if (ch === "-" || ch === "−") {
      // negative if at start or after operator/space, else minus
      const prevCh = s[i - 1];
      const isNeg = !prevCh || /[\s+\-=(*\/^]/.test(prevCh);
      out += isNeg ? " negative " : " minus ";
    } else {
      out += ch;
    }
  }
  s = out;

  // ── 10. Remaining math symbols ────────────────────────────────────────────
  s = s.replace(/×/g, " times ").replace(/÷/g, " divided by ");
  s = s.replace(/≈/g, " approximately equals ").replace(/≠/g, " not equal to ");
  s = s.replace(/≤/g, " less than or equal to ").replace(/≥/g, " greater than or equal to ");
  s = s.replace(/√/g, " square root of ").replace(/∞/g, " infinity ");
  s = s.replace(/°/g, " degrees ").replace(/±/g, " plus or minus ");
  s = s.replace(/=/g, " equals ");
  s = s.replace(/\+/g, " plus ");

  // ── 11. Punctuation / LaTeX remnants ─────────────────────────────────────
  s = s.replace(/[{}\\]/g, " ");
  s = s.replace(/\s+/g, " ");

  return s.trim();
}

// ── ReadAloudMenu component ───────────────────────────────────────────────────

interface MenuState {
  x: number;
  y: number;
  text: string;
}

export function ReadAloudMenu() {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep speaking state in sync with speechSynthesis
  useEffect(() => {
    const tick = setInterval(() => {
      setSpeaking(window.speechSynthesis?.speaking ?? false);
    }, 200);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const sel = window.getSelection()?.toString().trim();
      if (sel && sel.length > 0) {
        e.preventDefault();
        // Clamp so menu doesn't go off-screen
        const menuW = 200;
        const menuH = 90;
        const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
        const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
        setMenu({ x, y, text: sel });
      } else {
        setMenu(null);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(null);
        window.speechSynthesis?.cancel();
        setSpeaking(false);
      }
    };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const speak = () => {
    if (!menu) return;
    const spoken = mathToSpeech(menu.text);
    const utt = new SpeechSynthesisUtterance(spoken);
    utt.rate = 0.92;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
    setMenu(null);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  return (
    <>
      {/* Floating "stop" pill while speaking */}
      {speaking && (
        <div className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-mono animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span>Reading aloud…</span>
          <button
            onClick={stop}
            className="ml-1 hover:opacity-70 transition-opacity"
            aria-label="Stop reading"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      )}

      {/* Context menu */}
      {menu &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: menu.y, left: menu.x }}
            className="fixed z-[9999] bg-card border border-border/70 rounded-xl shadow-2xl overflow-hidden py-1.5 min-w-[190px] animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Preview of what will be said */}
            <div className="px-3 py-1.5 mb-1 border-b border-border/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Will say:</p>
              <p className="text-xs text-foreground/80 font-mono leading-snug line-clamp-2">
                "{mathToSpeech(menu.text)}"
              </p>
            </div>

            <button
              onClick={speak}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors font-mono"
            >
              <Volume2 className="w-4 h-4 text-primary" />
              Read Aloud
            </button>

            {speaking && (
              <button
                onClick={stop}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-mono"
              >
                <VolumeX className="w-4 h-4" />
                Stop Speaking
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
