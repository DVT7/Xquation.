import { useRoute, Link } from "wouter";
import { useGetFormula, useListFormulas, useListFavorites, useAddFavorite, useRemoveFavorite, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BlockMath } from "@/components/ui/math";
import { SymbolCards } from "@/components/formula/symbol-cards";
import { Star, Copy, Check, ChevronLeft, ChevronRight, ArrowUp, RotateCcw, BookOpen } from "lucide-react";
import { CALCULATORS } from "@/lib/formula-calculators";
import { cn } from "@/lib/utils";

function FormulaCalc({ formulaId }: { formulaId: number }) {
  const config = CALCULATORS[formulaId];
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(config?.inputs.map(f => [f.key, f.default ?? ""]) ?? [])
  );
  const [result, setResult] = useState<number | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!config) return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      Interactive calculator for this formula is coming soon.
    </div>
  );

  const numeric = Object.fromEntries(
    Object.entries(inputs).map(([k, v]) => [k, parseFloat(v)])
  );
  const allFilled = Object.values(numeric).every(v => !isNaN(v));

  const calculate = () => {
    if (!allFilled) return;
    const r = config.calculate(numeric);
    setResult(r);
    setSteps(config.steps(numeric, r));
  };

  const reset = () => {
    setInputs(Object.fromEntries(config.inputs.map(f => [f.key, f.default ?? ""])));
    setResult(null);
    setSteps([]);
  };

  const copyResult = () => {
    if (result !== null) {
      navigator.clipboard.writeText(`${result} ${config.outputUnit}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const fmt = (n: number) => {
    if (isNaN(n)) return "Undefined";
    if (Math.abs(n) > 1e6 || (Math.abs(n) < 1e-3 && n !== 0)) return n.toExponential(4);
    return n.toPrecision(5);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {config.inputs.map(field => (
          <div key={field.key}>
            <Label className="text-xs text-muted-foreground">
              {field.label}{field.unit ? ` (${field.unit})` : ""}
            </Label>
            <Input
              className="font-mono mt-1"
              placeholder="Enter value"
              value={inputs[field.key]}
              onChange={e => {
                setInputs(p => ({ ...p, [field.key]: e.target.value }));
                setResult(null);
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={calculate} disabled={!allFilled}>
          Calculate
        </Button>
        <Button variant="outline" size="icon" onClick={reset} title="Reset">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {result !== null && (
        <div className="space-y-3">
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-md">
            <div className="text-xs text-muted-foreground mb-1">{config.outputLabel}</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-mono text-primary">
                {fmt(result)} <span className="text-base text-muted-foreground">{config.outputUnit}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={copyResult} title="Copy result">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {steps.length > 0 && (
            <div className="bg-muted/20 border border-border/40 rounded-md p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Step-by-Step
              </div>
              <ol className="space-y-1.5">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm font-mono">
                    <span className="text-primary/60 font-bold shrink-0">{i + 1}.</span>
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

export default function FormulaDetail() {
  const [, params] = useRoute("/formulas/:id");
  const id = parseInt(params?.id ?? "0", 10);

  const { data: formula, isLoading } = useGetFormula(id);
  const { data: allFormulas } = useListFormulas({});
  const { data: favorites } = useListFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const sortedAll = useMemo(() => allFormulas ?? [], [allFormulas]);
  const currentIdx = sortedAll.findIndex(f => f.id === id);
  const prevF = currentIdx > 0 ? sortedAll[currentIdx - 1] : null;
  const nextF = currentIdx < sortedAll.length - 1 ? sortedAll[currentIdx + 1] : null;

  const isFav = useMemo(
    () => (favorites ?? []).some(f => f.itemType === "formula" && f.itemId === id),
    [favorites, id]
  );
  const favEntry = useMemo(
    () => (favorites ?? []).find(f => f.itemType === "formula" && f.itemId === id),
    [favorites, id]
  );

  const toggleFav = () => {
    if (isFav && favEntry) {
      removeFavorite.mutate({ id: favEntry.id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() }),
      });
    } else if (formula) {
      addFavorite.mutate({ data: { itemType: "formula", itemId: id, itemName: formula.name } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() }),
      });
    }
  };

  const copyLatex = () => {
    if (formula?.latex) {
      navigator.clipboard.writeText(formula.latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (isLoading) return (
    <div className="space-y-6 pb-12">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );

  if (!formula) return (
    <div className="text-center py-20 text-muted-foreground">
      Formula not found.{" "}
      <Link href="/formulas" className="text-primary hover:underline">Back to Formulas</Link>
    </div>
  );

  const relatedNames: string[] = formula.relatedFormulas
    ? formula.relatedFormulas.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-8 pb-16">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
        <Link href="/formulas" className="hover:text-primary transition-colors">Formulas</Link>
        <span>/</span>
        <span className="text-primary/70">{formula.category}</span>
        {formula.subcategory && <><span>/</span><span className="text-primary/50">{formula.subcategory}</span></>}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono mb-2">{formula.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-mono text-xs">
              {formula.category}
            </Badge>
            {formula.subcategory && (
              <Badge variant="outline" className="text-muted-foreground text-xs font-mono border-border/50">
                {formula.subcategory}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFav}
            className={cn(
              "gap-1.5 font-mono text-xs border-border/50",
              isFav ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10" : "text-muted-foreground"
            )}
          >
            <Star className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} />
            {isFav ? "Saved" : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyLatex}
            className="gap-1.5 font-mono text-xs border-border/50 text-muted-foreground"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy LaTeX"}
          </Button>
        </div>
      </div>

      {/* Main Formula */}
      <Card className="border-border/50 bg-card">
        <CardContent className="pt-6">
          <div className="bg-background/80 rounded-md p-8 border border-border/50 flex items-center justify-center overflow-x-auto min-h-[140px] mb-2">
            <BlockMath math={formula.latex} />
          </div>
          <SymbolCards variables={formula.variables} />
          <p className="text-sm text-foreground/70 mt-6 leading-relaxed">{formula.description}</p>
          {formula.siUnits && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Result Unit:</span>
              <span className="text-xs font-mono text-green-400">{formula.siUnits}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculator */}
      <Card className="border-border/50 bg-card">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-mono">Interactive Calculator</CardTitle>
          <CardDescription>Enter values to compute the result step by step.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <FormulaCalc formulaId={id} />
        </CardContent>
      </Card>

      {/* Worked Example */}
      {formula.example && (
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg font-mono flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Worked Example
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-muted/20 border border-border/40 rounded-md p-5 font-mono text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {formula.example}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Formulas */}
      {relatedNames.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-mono mb-4 flex items-center gap-2">
            <span className="text-primary">&gt;</span> Related Formulas
          </h2>
          <div className="flex flex-wrap gap-3">
            {relatedNames.map(name => {
              const related = sortedAll.find(f => f.name.toLowerCase().includes(name.toLowerCase()));
              return related ? (
                <Link key={name} href={`/formulas/${related.id}`}>
                  <div className="px-4 py-2.5 rounded-lg border border-border/50 bg-card hover:border-primary/50 hover:text-primary transition-all text-sm font-mono cursor-pointer">
                    {related.name}
                  </div>
                </Link>
              ) : (
                <div key={name} className="px-4 py-2.5 rounded-lg border border-border/30 bg-card/50 text-sm font-mono text-muted-foreground">
                  {name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Derivation / Additional detail accordion */}
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="latex" className="border border-border/50 rounded-lg bg-card px-4">
          <AccordionTrigger className="font-mono text-sm py-4">LaTeX Source</AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="bg-background/80 border border-border/40 rounded p-3 font-mono text-sm text-primary/80 select-all">
              {formula.latex}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Footer Navigation */}
      <div className="border-t border-border/40 pt-6 flex items-center justify-between gap-4">
        <div>
          {prevF ? (
            <Link href={`/formulas/${prevF.id}`}>
              <Button variant="outline" className="gap-2 font-mono text-xs border-border/50 text-muted-foreground hover:text-primary">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[160px]">{prevF.name}</span>
                <span className="sm:hidden">Previous</span>
              </Button>
            </Link>
          ) : <div />}
        </div>

        <div className="flex gap-2">
          <Link href="/formulas">
            <Button variant="ghost" size="sm" className="font-mono text-xs text-muted-foreground">
              All Formulas
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={scrollToTop} title="Back to top">
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
