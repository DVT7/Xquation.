import { useRoute, Link } from "wouter";
import {
  useGetFormula, useListFormulas, useListConstants,
  useListFavorites, useAddFavorite, useRemoveFavorite, getListFavoritesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BlockMath, ColoredBlockMath } from "@/components/ui/math";
import { SymbolCards } from "@/components/formula/symbol-cards";
import {
  Star, Copy, Check, ChevronLeft, ChevronRight, ArrowUp,
  RotateCcw, ChevronDown, ChevronUp, Lightbulb, BookOpen,
  FlaskConical, Calculator, Atom,
} from "lucide-react";
import { CALCULATORS, type SolveMode } from "@/lib/formula-calculators";
import { WORKED_EXAMPLES } from "@/lib/formula-worked-examples";
import { FORMULA_RELATED } from "@/lib/formula-related";
import { FORMULA_PROBLEMS, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/lib/formula-problems";
import { cn } from "@/lib/utils";

/* ─── Inline Calculator ──────────────────────────────────────────────────── */

function FormulaCalc({ formulaId }: { formulaId: number }) {
  const config = CALCULATORS[formulaId];
  const [inputs, setInputs] = useState<Record<string, string>>(
    () => Object.fromEntries(config?.inputs.map(f => [f.key, f.default ?? ""]) ?? [])
  );
  const [result, setResult] = useState<number | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!config) return (
    <p className="text-center py-8 text-muted-foreground text-sm italic">
      Interactive calculator coming soon for this formula.
    </p>
  );

  const numeric = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, parseFloat(v)]));
  const allFilled = Object.values(numeric).every(v => !isNaN(v));

  const calculate = () => {
    if (!allFilled) return;
    const r = config.calculate(numeric);
    setResult(r);
    setSteps(config.steps(numeric, r));
  };

  const reset = () => {
    setInputs(Object.fromEntries(config.inputs.map(f => [f.key, f.default ?? ""])));
    setResult(null); setSteps([]);
  };

  const fmt = (n: number) =>
    isNaN(n) ? "Undefined"
    : Math.abs(n) > 1e6 || (Math.abs(n) < 1e-3 && n !== 0) ? n.toExponential(4)
    : n.toPrecision(5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {config.inputs.map(field => (
          <div key={field.key}>
            <Label className="text-xs text-muted-foreground mb-1 block">
              {field.label}{field.unit ? <span className="text-primary/60 ml-1">({field.unit})</span> : ""}
            </Label>
            <Input
              className="font-mono"
              placeholder="Enter value"
              value={inputs[field.key]}
              onChange={e => { setInputs(p => ({ ...p, [field.key]: e.target.value })); setResult(null); }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={calculate} disabled={!allFilled}>
          <Calculator className="w-4 h-4 mr-2" /> Calculate
        </Button>
        <Button variant="outline" size="icon" onClick={reset} title="Reset"><RotateCcw className="w-4 h-4" /></Button>
      </div>

      {result !== null && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="text-xs text-muted-foreground mb-1 font-mono uppercase tracking-wider">{config.outputLabel}</div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-2xl font-mono font-bold text-primary">
                {fmt(result)}{" "}
                <span className="text-base font-normal text-muted-foreground">{config.outputUnit}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(`${result} ${config.outputUnit}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          {steps.length > 0 && (
            <div className="bg-muted/20 border border-border/40 rounded-lg p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Step-by-Step</p>
              <ol className="space-y-1.5">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm font-mono">
                    <span className="text-primary/60 font-bold shrink-0 w-4">{i + 1}.</span>
                    <span className="text-foreground/80">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Worked Example ─────────────────────────────────────────────────────── */

function WorkedExampleSection({ formulaId, latex, variables }: { formulaId: number; latex: string; variables?: string | null }) {
  const ex = WORKED_EXAMPLES[formulaId];
  if (!ex) return null;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="text-lg font-mono flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Worked Example
        </CardTitle>
        <CardDescription>A fully solved problem using this formula.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">

        {/* Problem */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Problem</p>
          <p className="text-foreground leading-relaxed">{ex.problem}</p>
        </div>

        {/* Formula reminder */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Formula</p>
          <div className="bg-background/60 border border-border/40 rounded-lg px-4 py-3 overflow-x-auto">
            <ColoredBlockMath math={latex} variables={variables} />
          </div>
        </div>

        {/* Given */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Given</p>
          <div className="flex flex-wrap gap-2">
            {ex.given.map((g, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#00BFFF]/10 border border-[#00BFFF]/30 rounded-lg px-3 py-1.5">
                <span className="font-mono text-[#00BFFF] font-bold text-sm">{g.symbol}</span>
                <span className="text-foreground/70 text-sm">=</span>
                <span className="font-mono text-foreground font-semibold text-sm">{g.value}</span>
                <span className="text-muted-foreground text-xs">({g.description})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Constants */}
        {ex.constants && ex.constants.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Constants</p>
            <div className="flex flex-wrap gap-2">
              {ex.constants.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-[#FFD700] font-bold text-sm">{c.symbol}</span>
                  <span className="text-foreground/70 text-sm">=</span>
                  <span className="font-mono text-foreground font-semibold text-sm">{c.value}</span>
                  <span className="text-muted-foreground text-xs">({c.description})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Substitute */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Substitute</p>
          <div className="bg-background/60 border border-border/40 rounded-lg px-4 py-3 overflow-x-auto">
            <BlockMath math={ex.substituteLatex} />
          </div>
        </div>

        {/* Result */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Result</p>
          <div className="bg-background/60 border border-border/40 rounded-lg px-4 py-3 overflow-x-auto">
            <BlockMath math={ex.resultLatex} />
          </div>
        </div>

        {/* Final Answer */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary/80 mb-1">Final Answer</p>
          <p className="text-xl font-mono font-bold text-primary">{ex.finalAnswer}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Practice Problem Card ──────────────────────────────────────────────── */

function ProblemCard({ problem, index }: { problem: { difficulty: number; question: string; hint: string; solution: string[]; answer: string }; index: number }) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const color = DIFFICULTY_COLORS[problem.difficulty] ?? "#00D9FF";
  const label = DIFFICULTY_LABELS[problem.difficulty] ?? "";

  return (
    <div className="border border-border/50 rounded-lg bg-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <span className="font-mono text-muted-foreground/60 text-sm shrink-0 pt-0.5">#{index + 1}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{ color, borderColor: `${color}50`, backgroundColor: `${color}15` }}
              >
                Level {problem.difficulty} — {label}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{problem.question}</p>
          </div>
        </div>

        <div className="flex gap-2 ml-7">
          <button
            onClick={() => setShowHint(v => !v)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-mono"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            {showHint ? "Hide Hint" : "Show Hint"}
          </button>
          <button
            onClick={() => setShowSolution(v => !v)}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-mono"
          >
            {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showSolution ? "Hide Solution" : "Show Solution"}
          </button>
        </div>
      </div>

      {showHint && (
        <div className="mx-4 mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm text-amber-300/90 font-mono animate-in fade-in duration-200">
          💡 {problem.hint}
        </div>
      )}

      {showSolution && (
        <div className="mx-4 mb-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="bg-muted/20 border border-border/40 rounded-md p-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Solution</p>
            <ol className="space-y-1">
              {problem.solution.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm font-mono">
                  <span className="text-primary/60 shrink-0">{i + 1}.</span>
                  <span className="text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
            <span className="text-xs font-bold text-primary/80 uppercase tracking-wider mr-2">Answer:</span>
            <span className="font-mono text-primary font-semibold">{problem.answer}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Difficulty Legend ──────────────────────────────────────────────────── */

function DifficultyLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => {
        const color = DIFFICULTY_COLORS[parseInt(level)];
        return (
          <div key={level} className="flex items-center gap-1.5 text-[10px]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground font-mono">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function FormulaDetail() {
  const [, params] = useRoute("/formulas/:id");
  const id = parseInt(params?.id ?? "0", 10);

  const { data: formula, isLoading } = useGetFormula(id);
  const { data: allFormulas } = useListFormulas({});
  const { data: allConstants } = useListConstants({});
  const { data: favorites } = useListFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const queryClient = useQueryClient();
  const [latexCopied, setLatexCopied] = useState(false);

  const sortedAll = useMemo(() => allFormulas ?? [], [allFormulas]);
  const currentIdx = sortedAll.findIndex(f => f.id === id);
  const prevF = currentIdx > 0 ? sortedAll[currentIdx - 1] : null;
  const nextF = currentIdx < sortedAll.length - 1 ? sortedAll[currentIdx + 1] : null;

  const isFav = useMemo(() => (favorites ?? []).some(f => f.itemType === "formula" && f.itemId === id), [favorites, id]);
  const favEntry = useMemo(() => (favorites ?? []).find(f => f.itemType === "formula" && f.itemId === id), [favorites, id]);

  const toggleFav = () => {
    if (isFav && favEntry) {
      removeFavorite.mutate({ id: favEntry.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() }) });
    } else if (formula) {
      addFavorite.mutate({ data: { itemType: "formula", itemId: id, itemName: formula.name } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() }) });
    }
  };

  const copyLatex = () => {
    if (formula?.latex) { navigator.clipboard.writeText(formula.latex); setLatexCopied(true); setTimeout(() => setLatexCopied(false), 2000); }
  };

  const related = FORMULA_RELATED[id];
  const problems = FORMULA_PROBLEMS[id] ?? [];

  const relatedConstantObjs = useMemo(
    () => (allConstants ?? []).filter(c => related?.constantIds.includes(c.id)),
    [allConstants, related]
  );

  const relatedFormulaObjs = useMemo(() => {
    if (!formula?.relatedFormulas) return [];
    const names = formula.relatedFormulas.split(",").map(s => s.trim()).filter(Boolean);
    return names.map(name => ({
      name,
      formula: sortedAll.find(f => f.name.toLowerCase().includes(name.toLowerCase())),
    }));
  }, [formula, sortedAll]);

  const derivationFormulaObjs = useMemo(() => {
    if (!related?.derivationFormulaNames) return [];
    return related.derivationFormulaNames.map(name => ({
      name,
      formula: sortedAll.find(f => f.name.toLowerCase().includes(name.toLowerCase())),
    }));
  }, [related, sortedAll]);

  if (isLoading) return (
    <div className="space-y-6 pb-12">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );

  if (!formula) return (
    <div className="text-center py-20 text-muted-foreground">
      Formula not found.{" "}
      <Link href="/formulas" className="text-primary hover:underline">Back to Formulas</Link>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 max-w-4xl">

      {/* ── 1. Breadcrumb ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono flex-wrap">
        <Link href="/formulas" className="hover:text-primary transition-colors">Formulas</Link>
        <span>/</span>
        <Link href={`/formulas?category=${encodeURIComponent(formula.category)}`} className="text-primary/70 hover:text-primary transition-colors">{formula.category}</Link>
        {formula.subcategory && <><span>/</span><span className="text-primary/50">{formula.subcategory}</span></>}
      </div>

      {/* ── 1. Title + Category Tags ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono mb-3">{formula.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/30 font-mono text-xs hover:bg-primary/20 transition-colors cursor-default">
              {formula.category}
            </Badge>
            {formula.subcategory && (
              <Badge variant="outline" className="text-muted-foreground text-xs font-mono border-border/50 cursor-default">
                {formula.subcategory}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={toggleFav}
            className={cn("gap-1.5 font-mono text-xs border-border/50", isFav ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : "text-muted-foreground")}
          >
            <Star className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} />
            {isFav ? "Saved" : "Save"}
          </Button>
          <Button variant="outline" size="sm" onClick={copyLatex}
            className="gap-1.5 font-mono text-xs border-border/50 text-muted-foreground"
          >
            {latexCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {latexCopied ? "Copied!" : "Copy LaTeX"}
          </Button>
        </div>
      </div>

      {/* ── 2. Color-coded Equation ───────────────────────────────────── */}
      <Card className="border-border/50 bg-card">
        <CardContent className="pt-6">
          <div className="bg-background/80 rounded-lg p-8 border border-border/50 flex items-center justify-center overflow-x-auto min-h-[140px] mb-6">
            <ColoredBlockMath math={formula.latex} variables={formula.variables} />
          </div>

          {/* ── 3. Symbol Cards ────────────────────────────────────────── */}
          <SymbolCards variables={formula.variables} />

          <p className="text-sm text-foreground/70 mt-6 leading-relaxed">{formula.description}</p>
          {formula.siUnits && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Result Unit:</span>
              <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">{formula.siUnits}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Interactive Calculator ─────────────────────────────────── */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-mono flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" /> Interactive Calculator
          </CardTitle>
          <CardDescription>Enter known values to calculate the result with step-by-step working.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <FormulaCalc formulaId={id} />
        </CardContent>
      </Card>

      {/* ── 5. Worked Example ─────────────────────────────────────────── */}
      <WorkedExampleSection formulaId={id} latex={formula.latex} variables={formula.variables} />

      {/* ── 6. Related Formulas ───────────────────────────────────────── */}
      {relatedFormulaObjs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> Related Formulas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedFormulaObjs.map(({ name, formula: rf }) =>
              rf ? (
                <Link key={name} href={`/formulas/${rf.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{rf.name}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">{rf.category}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ) : (
                <div key={name} className="p-3 rounded-lg border border-border/30 bg-card/50 text-sm text-muted-foreground">{name}</div>
              )
            )}
          </div>
        </div>
      )}

      {/* ── 7. Related Constants ──────────────────────────────────────── */}
      {relatedConstantObjs.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
            <Atom className="w-5 h-5 text-[#FFD700]" /> Related Constants
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedConstantObjs.map(c => (
              <Link key={c.id} href={`/constants?search=${encodeURIComponent(c.name)}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-[#FFD700]/20 bg-[#FFD700]/5 hover:border-[#FFD700]/50 hover:bg-[#FFD700]/10 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-md bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center shrink-0">
                    <span className="font-mono font-bold text-[#FFD700] text-sm">{c.symbol}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground group-hover:text-[#FFD700] transition-colors truncate">{c.name}</div>
                    <div className="text-xs font-mono text-muted-foreground truncate">{c.value} {c.units}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#FFD700] transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Related Topics ─────────────────────────────────────────── */}
      {related?.topics && related.topics.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Related Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {related.topics.map(topic => (
              <Link key={topic} href={`/glossary?search=${encodeURIComponent(topic)}`}>
                <div className="px-3 py-1.5 rounded-full border border-border/50 bg-card text-sm font-mono text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                  {topic}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 9. Derivation ─────────────────────────────────────────────── */}
      {related?.derivation && related.derivation.length > 0 && (
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-mono">Derivation</CardTitle>
            <CardDescription>Step-by-step origin of this formula.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ol className="space-y-3">
              {related.derivation.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>

            {/* ── 10. Derivation Formula Cards ───────────────────────── */}
            {derivationFormulaObjs.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border/40">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Formulas Used in This Derivation</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {derivationFormulaObjs.map(({ name, formula: df }) =>
                    df ? (
                      <Link key={name} href={`/formulas/${df.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer">
                          <div>
                            <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{df.name}</div>
                            <div className="text-xs font-mono text-muted-foreground mt-0.5 opacity-70">{df.latex}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ) : (
                      <div key={name} className="p-3 rounded-lg border border-border/30 bg-card/50 text-sm text-muted-foreground">{name}</div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── 11. Practice Problems ─────────────────────────────────────── */}
      {problems.length > 0 && (
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold font-mono flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" /> Practice Problems
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{problems.length} problems — click a problem to reveal its hint and solution.</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Difficulty Scale</p>
            <DifficultyLegend />
          </div>
          <div className="space-y-3">
            {problems.map((p, i) => (
              <ProblemCard key={i} problem={p} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Footer Navigation ─────────────────────────────────────────── */}
      <div className="border-t border-border/40 pt-6 flex items-center justify-between gap-4">
        <div>
          {prevF ? (
            <Link href={`/formulas/${prevF.id}`}>
              <Button variant="outline" className="gap-2 font-mono text-xs border-border/50 text-muted-foreground hover:text-primary">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[160px]">{prevF.name}</span>
                <span className="sm:hidden">Prev</span>
              </Button>
            </Link>
          ) : <div />}
        </div>
        <div className="flex gap-2">
          <Link href="/formulas">
            <Button variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground">All Formulas</Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title="Back to top">
            <ArrowUp className="w-4 h-4" />
          </Button>
        </div>
        <div>
          {nextF ? (
            <Link href={`/formulas/${nextF.id}`}>
              <Button variant="outline" className="gap-2 font-mono text-xs border-border/50 text-muted-foreground hover:text-primary">
                <span className="hidden sm:inline truncate max-w-[160px]">{nextF.name}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : <div />}
        </div>
      </div>
    </div>
  );
}
