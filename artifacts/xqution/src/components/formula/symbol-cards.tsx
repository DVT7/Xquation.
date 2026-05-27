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
  answer:   { border: "border-white/40",   text: "text-white",         glow: "hover:shadow-[0_0_16px_rgba(255,255,255,0.2)]",   label: "Final Answer" },
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
  "R":  { value: "8.314",        unit: "J/mol·K" },
  "kₑ": { value: "8.99×10⁹",    unit: "N·m²/C²" },
  "k":  { value: "8.99×10⁹",    unit: "N·m²/C²" },
  "H₀": { value: "~70",          unit: "km/s/Mpc" },
  "g":  { value: "9.81",         unit: "m/s²" },
  "Nₐ": { value: "6.022×10²³",   unit: "mol⁻¹" },
  "e":  { value: "1.602×10⁻¹⁹",  unit: "C" },
};

// Detect if a description implies a known numeric constant value inline
const VALUE_PATTERN = /\([\d.,×^⁻]+\s*[^\)]*\)/;

// Descriptions that should always be treated as variables, even if the symbol
// appears in KNOWN_CONSTANTS (e.g. h = height vs h = Planck's constant)
const VARIABLE_DESCRIPTIONS = new Set([
  "height", "depth", "altitude", "displacement", "distance",
  "time", "position", "length", "width", "radius", "angle",
]);

function detectType(symbol: string, description: string, index: number): SymbolType {
  if (index === 0) return "answer";
  // If the description clearly names a physical variable, don't treat it as a constant
  const descLower = description.toLowerCase().trim();
  if (VARIABLE_DESCRIPTIONS.has(descLower)) return "variable";
  const base = symbol.split(/[₀₁₂]/)[0];
  if (KNOWN_CONSTANTS[symbol] || KNOWN_CONSTANTS[base]) return "constant";
  if (VALUE_PATTERN.test(description)) return "constant";
  return "variable";
}

function getUnit(symbol: string, description: string): string {
  // Don't pull a unit from KNOWN_CONSTANTS if the description marks this as a plain variable
  if (VARIABLE_DESCRIPTIONS.has(description.toLowerCase().trim())) return "";
  const base = symbol.split(/[₀₁₂]/)[0];
  return KNOWN_CONSTANTS[symbol]?.unit ?? KNOWN_CONSTANTS[base]?.unit ?? "";
}

function getValue(symbol: string, description: string): string | undefined {
  if (VARIABLE_DESCRIPTIONS.has(description.toLowerCase().trim())) return undefined;
  const base = symbol.split(/[₀₁₂]/)[0];
  const known = KNOWN_CONSTANTS[symbol] ?? KNOWN_CONSTANTS[base];
  if (known) return known.value;
  const match = description.match(/\(([\d.,×^⁻~]+[^)]*)\)/);
  return match?.[1];
}

function parseVariables(variables: string): SymbolCard[] {
  if (!variables) return [];
  const cards: SymbolCard[] = [];

  const parts = variables.split(/,(?![^(]*\))/).map(s => s.trim()).filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const eqIdx = part.indexOf(" = ");
    if (eqIdx === -1) continue;

    const rawSymbol = part.substring(0, eqIdx).trim();
    const description = part.substring(eqIdx + 3).trim();

    // Handle joint definitions like "m₁, m₂ = masses"
    const symbols = rawSymbol.split(/,\s*/);
    for (const sym of symbols) {
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
