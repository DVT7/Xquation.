import { cn } from "@/lib/utils";
import { InlineMath } from "@/components/ui/math";

type SymbolType = "answer" | "variable" | "constant" | "number";

interface SymbolCard {
  symbol: string;
  name: string;
  description: string;
  unit: string;
  value?: string;
  type: SymbolType;
}

const TYPE_COLORS: Record<SymbolType, { border: string; text: string; glow: string; label: string }> = {
  answer:   { border: "border-emerald-400/40",   text: "text-emerald-400",         glow: "hover:shadow-[0_0_16px_rgba(52,211,153,0.2)]",   label: "Final Answer" },
  variable: { border: "border-[#00BFFF]/50", text: "text-[#00BFFF]",  glow: "hover:shadow-[0_0_16px_rgba(0,191,255,0.3)]",    label: "Variable" },
  constant: { border: "border-[#FFD700]/50", text: "text-[#FFD700]",  glow: "hover:shadow-[0_0_16px_rgba(255,215,0,0.3)]",    label: "Physical Constant" },
  number:   { border: "border-[#FF8C42]/50", text: "text-[#FF8C42]",  glow: "hover:shadow-[0_0_16px_rgba(255,140,66,0.3)]",   label: "Coefficient" },
};

const KNOWN_CONSTANTS: Record<string, { value: string; unit: string }> = {
  "G":  { value: "6.674×10⁻¹¹", unit: "N·m²/kg²" },
  "c":  { value: "299,792,458",  unit: "m/s" },
  "h":  { value: "6.626×10⁻³⁴", unit: "J·s" },
  "ℏ":  { value: "1.055×10⁻³⁴", unit: "J·s" },
  "σ":  { value: "5.670×10⁻⁸",  unit: "W/m²·K⁴" },
  "kₑ": { value: "8.99×10⁹",    unit: "N·m²/C²" },
  "H₀": { value: "~70",          unit: "km/s/Mpc" },
  "g":  { value: "9.81",         unit: "m/s²" },
  "Nₐ": { value: "6.022×10²³",   unit: "mol⁻¹" },
  "e":  { value: "1.602×10⁻¹⁹",  unit: "C" },
  "π":  { value: "3.141592653",  unit: "dimensionless" },
};

// Detect if a description implies a known numeric constant value inline
const VALUE_PATTERN = /\([\d.,×^⁻]+\s*[^\)]*\)/;

// Word-boundary regex: matches descriptions like "star radius", "surface temperature",
// "orbital period", etc. — so R = star radius is correctly a variable, not a constant.
const VAR_DESC_RE =
  /\b(height|depth|altitude|displacement|distance|time|position|length|width|radius|angle|velocity|resistance|temperature|pressure|volume|mass|force|charge|current|frequency|wavelength|momentum|acceleration|period|luminosity|separation|moles|amplitude|density|index|indices|refractive|star|orbital|surface|central|initial|final|incident|refracted)\b/i;

// Symbols that exist in KNOWN_CONSTANTS but can also appear as plain variables
// in certain formulas (e.g. h = height in PE=mgh vs h = Planck's constant in E=hf).
// If the description matches the override pattern the symbol is treated as a variable.
const CONTEXT_VAR_OVERRIDES: Record<string, RegExp> = {
  h: /\b(height|altitude|depth)\b/i,
};

function detectType(symbol: string, description: string, index: number): SymbolType {
  if (index === 0) return "answer";
  const base = symbol.split(/[₀₁₂]/)[0];
  const isKnownConst = !!(KNOWN_CONSTANTS[symbol] || KNOWN_CONSTANTS[base]);
  if (isKnownConst) {
    // Allow a description-based override: if the description clearly names this
    // symbol as a variable quantity (e.g. "height"), treat it as a variable for
    // this formula rather than the global physical constant.
    const override = CONTEXT_VAR_OVERRIDES[symbol] ?? CONTEXT_VAR_OVERRIDES[base];
    if (override && override.test(description)) return "variable";
    return "constant";
  }
  if (VALUE_PATTERN.test(description)) return "constant";
  const descLower = description.toLowerCase().trim();
  if (VAR_DESC_RE.test(descLower)) return "variable";
  return "variable";
}

function isConstantInContext(symbol: string, description: string): boolean {
  const base = symbol.split(/[₀₁₂]/)[0];
  if (!(KNOWN_CONSTANTS[symbol] || KNOWN_CONSTANTS[base])) return false;
  const override = CONTEXT_VAR_OVERRIDES[symbol] ?? CONTEXT_VAR_OVERRIDES[base];
  if (override && override.test(description)) return false;
  return true;
}

function getUnit(symbol: string, description: string): string {
  const base = symbol.split(/[₀₁₂]/)[0];
  if (isConstantInContext(symbol, description))
    return KNOWN_CONSTANTS[symbol]?.unit ?? KNOWN_CONSTANTS[base]?.unit ?? "";
  if (VAR_DESC_RE.test(description.toLowerCase().trim())) return "";
  return "";
}

function getValue(symbol: string, description: string): string | undefined {
  const base = symbol.split(/[₀₁₂]/)[0];
  if (isConstantInContext(symbol, description)) {
    return KNOWN_CONSTANTS[symbol]?.value ?? KNOWN_CONSTANTS[base]?.value;
  }
  if (VAR_DESC_RE.test(description.toLowerCase().trim())) return undefined;
  const match = description.match(/\(([\d.,×^⁻~]+[^)]*)\)/);
  return match?.[1];
}

function parseVariables(variables: string): SymbolCard[] {
  if (!variables) return [];
  const cards: SymbolCard[] = [];

  const parts = variables.split(/,(?![^(]*\))/).map(s => s.trim()).filter(Boolean);

  // Symbols that have no description yet — they share the next part's description.
  // e.g. "m₁, m₂ = masses" splits into ["m₁"] and ["m₂ = masses"]; m₁ is pending.
  let pending: string[] = [];

  for (const part of parts) {
    const eqIdx = part.indexOf(" = ");
    if (eqIdx === -1) {
      // No description — queue this symbol for the next description we find
      pending.push(part.trim());
      continue;
    }

    const rawSymbol = part.substring(0, eqIdx).trim();
    const description = part.substring(eqIdx + 3).trim();

    // All pending symbols + any comma-separated symbols in this part share this description
    const allSyms = [...pending, ...rawSymbol.split(/,\s*/)];
    pending = [];

    for (const sym of allSyms) {
      const s = sym.trim();
      if (!s) continue;
      const type = detectType(s, description, cards.length);
      cards.push({
        symbol: s,
        name: description.replace(VALUE_PATTERN, "").trim(),
        description,
        unit: getUnit(s, description),
        value: type === "constant" ? getValue(s, description) : undefined,
        type,
      });
    }
  }

  return cards;
}

interface SymbolCardsProps {
  variables?: string | null;
  highlightedSymbol?: string | null;
  onHover?: (symbol: string | null) => void;
}

export function SymbolCards({ variables, highlightedSymbol, onHover }: SymbolCardsProps) {
  if (!variables) return null;
  const cards = parseVariables(variables);
  if (cards.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
        Formula Components
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((card) => {
          const colors = TYPE_COLORS[card.type];
          const isHighlighted = highlightedSymbol === card.symbol;
          return (
            <div
              key={card.symbol}
              onMouseEnter={() => onHover?.(card.symbol)}
              onMouseLeave={() => onHover?.(null)}
              className={cn(
                "rounded-lg border bg-background/60 p-3 cursor-default transition-all duration-200",
                "hover:-translate-y-0.5 hover:scale-[1.02]",
                colors.border,
                colors.glow,
                isHighlighted && "scale-[1.03] -translate-y-1 brightness-110"
              )}
            >
              <div className={cn("text-2xl font-bold font-mono mb-1 leading-none", colors.text)}>
                <InlineMath math={card.symbol.replace(/₀/g, "_0").replace(/₁/g, "_1").replace(/₂/g, "_2").replace(/ₑ/g, "_e").replace(/ₛ/g, "_s").replace(/ₐ/g, "_a")} />
              </div>
              <div className="text-xs font-semibold text-foreground/90 mb-0.5 leading-tight">{card.name}</div>
              {card.value && (
                <div className={cn("text-xs font-mono mb-0.5", colors.text)}>{card.value}</div>
              )}
              {card.unit && (
                <div className="text-xs text-green-400 font-mono">{card.unit}</div>
              )}
              <div className={cn("text-[10px] font-medium uppercase tracking-wide mt-1 opacity-70", colors.text)}>
                {colors.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
