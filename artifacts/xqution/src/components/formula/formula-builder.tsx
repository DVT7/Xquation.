import {
  useCreateOwnerFormula,
  useListFormulaCategories,
  getListFormulasQueryKey,
  type CreateFormulaBody,
} from "@workspace/api-client-react";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BlockMath, ColoredBlockMath } from "@/components/ui/math";
import { Calculator, Code2, Eye, Plus, Save, Trash2 } from "lucide-react";

type FormulaComponent = {
  id: number;
  symbol: string;
  description: string;
  type: "variable" | "constant";
};

type CalculatorInput = {
  id: number;
  key: string;
  label: string;
  unit: string;
  default: string;
};

const newComponent = (id: number): FormulaComponent => ({
  id,
  symbol: "",
  description: "",
  type: "variable",
});

const newCalculatorInput = (id: number): CalculatorInput => ({
  id,
  key: "",
  label: "",
  unit: "",
  default: "",
});

export function FormulaBuilder() {
  const queryClient = useQueryClient();
  const { data: categories } = useListFormulaCategories();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [latex, setLatex] = useState("");
  const [description, setDescription] = useState("");
  const [components, setComponents] = useState<FormulaComponent[]>([newComponent(1)]);
  const [siUnits, setSiUnits] = useState("");
  const [example, setExample] = useState("");
  const [relatedFormulas, setRelatedFormulas] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [calculatorEnabled, setCalculatorEnabled] = useState(false);
  const [calculatorLatex, setCalculatorLatex] = useState("");
  const [calculatorExpression, setCalculatorExpression] = useState("");
  const [calculatorOutputLabel, setCalculatorOutputLabel] = useState("");
  const [calculatorOutputUnit, setCalculatorOutputUnit] = useState("");
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInput[]>([newCalculatorInput(1)]);
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const categoryOptions = useMemo(
    () => (categories ?? []).map((item) => item.category).filter(Boolean),
    [categories],
  );

  const updateComponent = (id: number, patch: Partial<FormulaComponent>) => {
    setComponents((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateCalculatorInput = (id: number, patch: Partial<CalculatorInput>) => {
    setCalculatorInputs((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const reset = () => {
    setName("");
    setCategory("");
    setSubcategory("");
    setLatex("");
    setDescription("");
    setComponents([newComponent(Date.now())]);
    setSiUnits("");
    setExample("");
    setRelatedFormulas("");
    setIsFeatured(false);
    setCalculatorEnabled(false);
    setCalculatorLatex("");
    setCalculatorExpression("");
    setCalculatorOutputLabel("");
    setCalculatorOutputUnit("");
    setCalculatorInputs([newCalculatorInput(Date.now() + 1)]);
  };

  const createFormula = useCreateOwnerFormula({
    mutation: {
      onSuccess: (formula) => {
        queryClient.invalidateQueries({ queryKey: getListFormulasQueryKey() });
        setSavedMessage(`Saved “${formula.name}” as formula #${formula.id}.`);
        setFormError("");
        reset();
      },
      onError: (error) => {
        setSavedMessage("");
        setFormError(error instanceof Error ? error.message : "Could not save this formula.");
      },
    },
  });

  const handleSubmit = () => {
    setFormError("");
    setSavedMessage("");
    if (!name.trim() || !category.trim() || !latex.trim() || !description.trim()) {
      setFormError("Name, category, LaTeX, and description are required.");
      return;
    }

    const validComponents = components.filter((item) => item.symbol.trim() && item.description.trim());
    const variables = validComponents
      .map((item) => `${item.symbol.trim()} = ${item.description.trim()} [${item.type}]`)
      .join(", ");

    let calculator: string | null = null;
    if (calculatorEnabled) {
      const validInputs = calculatorInputs.filter((input) => input.key.trim() && input.label.trim());
      if (!calculatorExpression.trim() || !calculatorOutputLabel.trim() || validInputs.length === 0) {
        setFormError("Add a calculator expression, output label, and at least one input.");
        return;
      }
      if (validInputs.some((input) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(input.key.trim()))) {
        setFormError("Calculator input keys must use letters, numbers, and underscores only, starting with a letter.");
        return;
      }
      const keys = validInputs.map((input) => input.key.trim());
      if (new Set(keys).size !== keys.length) {
        setFormError("Each calculator input key must be unique.");
        return;
      }
      calculator = JSON.stringify({
        formulaLatex: calculatorLatex.trim() || latex.trim(),
        outputLabel: calculatorOutputLabel.trim(),
        outputUnit: calculatorOutputUnit.trim(),
        expression: calculatorExpression.trim(),
        inputs: validInputs.map((input) => ({
          key: input.key.trim(),
          label: input.label.trim(),
          unit: input.unit.trim(),
          ...(input.default.trim() ? { default: input.default.trim() } : {}),
        })),
      });
    }

    const data: CreateFormulaBody = {
      name: name.trim(),
      category: category.trim(),
      subcategory: subcategory.trim() || null,
      latex: latex.trim(),
      description: description.trim(),
      variables,
      siUnits: siUnits.trim() || null,
      example: example.trim() || null,
      relatedFormulas: relatedFormulas.trim() || null,
      calculator,
      isFeatured,
    };
    createFormula.mutate({ data });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" /> Formula details
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Fill in the page content once. The formula page will render the equation, component cards, examples, and related links.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Formula name *">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Newton’s Second Law" />
            </Field>
            <Field label="Category *">
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Mechanics"
                list="formula-category-options"
              />
              <datalist id="formula-category-options">
                {categoryOptions.map((item) => <option key={item} value={item} />)}
              </datalist>
            </Field>
            <Field label="Subcategory">
              <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="e.g. Dynamics" />
            </Field>
            <Field label="Result unit">
              <Input value={siUnits} onChange={(e) => setSiUnits(e.target.value)} placeholder="e.g. N (newtons)" />
            </Field>
          </div>

          <Field label="Main LaTeX code *" hint="This is the equation shown at the top of the formula page.">
            <Textarea
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder={"F = ma\\n\\nUse standard KaTeX/LaTeX syntax."}
              className="font-mono min-h-[80px]"
            />
          </Field>

          <Field label="Description *">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what the formula describes and when it is useful."
              className="min-h-[100px]"
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label>Formula components</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose Variable for blue or Constant for gold. The first symbol is treated as the answer.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setComponents((items) => [...items, newComponent(Date.now())])}
              >
                <Plus className="w-3.5 h-3.5" /> Add symbol
              </Button>
            </div>
            <div className="space-y-2">
              {components.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[minmax(70px,0.3fr)_minmax(0,1fr)_auto_auto] gap-2 items-center">
                  <Input
                    value={item.symbol}
                    onChange={(e) => updateComponent(item.id, { symbol: e.target.value })}
                    placeholder={index === 0 ? "F" : "m"}
                    className="font-mono"
                    aria-label={`Symbol ${index + 1}`}
                  />
                  <Input
                    value={item.description}
                    onChange={(e) => updateComponent(item.id, { description: e.target.value })}
                    placeholder={index === 0 ? "force (answer)" : "mass"}
                    aria-label={`Description for symbol ${index + 1}`}
                  />
                  <select
                    value={item.type}
                    onChange={(e) => updateComponent(item.id, { type: e.target.value as FormulaComponent["type"] })}
                    className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    aria-label={`Type for symbol ${index + 1}`}
                  >
                    <option value="variable">Variable</option>
                    <option value="constant">Constant</option>
                  </select>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-red-400"
                    onClick={() => setComponents((items) => items.filter((component) => component.id !== item.id))}
                    disabled={components.length === 1}
                    aria-label={`Remove symbol ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Example or extra explanation">
              <Textarea value={example} onChange={(e) => setExample(e.target.value)} placeholder="Add a worked example or helpful note." className="min-h-[90px]" />
            </Field>
            <Field label="Related formulas">
              <Textarea value={relatedFormulas} onChange={(e) => setRelatedFormulas(e.target.value)} placeholder="Comma-separated formula names" className="min-h-[90px]" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <Checkbox checked={isFeatured} onCheckedChange={(checked) => setIsFeatured(checked === true)} />
            Feature this formula on the home page
          </label>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Interactive calculator
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Optional. Use a safe expression such as <span className="font-mono text-primary/80">m * c^2</span>; no code needs to be pasted.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
              <Checkbox checked={calculatorEnabled} onCheckedChange={(checked) => setCalculatorEnabled(checked === true)} />
              Enable
            </label>
          </div>
        </CardHeader>
        {calculatorEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Calculator LaTeX">
                <Input value={calculatorLatex} onChange={(e) => setCalculatorLatex(e.target.value)} placeholder="E = mc^2" className="font-mono" />
              </Field>
              <Field label="Output label *">
                <Input value={calculatorOutputLabel} onChange={(e) => setCalculatorOutputLabel(e.target.value)} placeholder="Energy" />
              </Field>
              <Field label="Output unit">
                <Input value={calculatorOutputUnit} onChange={(e) => setCalculatorOutputUnit(e.target.value)} placeholder="J" />
              </Field>
            </div>
            <Field label="Calculation expression *" hint="Use the input keys below with +, -, *, /, ^, parentheses, and functions like sqrt().">
              <Input value={calculatorExpression} onChange={(e) => setCalculatorExpression(e.target.value)} placeholder="m * c^2" className="font-mono" />
            </Field>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Calculator inputs *</Label>
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setCalculatorInputs((items) => [...items, newCalculatorInput(Date.now())])}>
                  <Plus className="w-3.5 h-3.5" /> Add input
                </Button>
              </div>
              <div className="space-y-2">
                {calculatorInputs.map((input) => (
                  <div key={input.id} className="grid grid-cols-2 md:grid-cols-[0.7fr_1.4fr_0.8fr_0.7fr_auto] gap-2">
                    <Input value={input.key} onChange={(e) => updateCalculatorInput(input.id, { key: e.target.value })} placeholder="m" className="font-mono" aria-label="Calculator input key" />
                    <Input value={input.label} onChange={(e) => updateCalculatorInput(input.id, { label: e.target.value })} placeholder="Mass" aria-label="Calculator input label" />
                    <Input value={input.unit} onChange={(e) => updateCalculatorInput(input.id, { unit: e.target.value })} placeholder="kg" aria-label="Calculator input unit" />
                    <Input value={input.default} onChange={(e) => updateCalculatorInput(input.id, { default: e.target.value })} placeholder="Default" aria-label="Calculator input default" />
                    <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-red-400" onClick={() => setCalculatorInputs((items) => items.filter((item) => item.id !== input.id))} disabled={calculatorInputs.length === 1} aria-label="Remove calculator input">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {(formError || savedMessage) && (
        <div className={formError ? "rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" : "rounded-lg border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-300"}>
          {formError || savedMessage}
        </div>
      )}

      <Card className="bg-card/60 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Live preview
            {components.some((item) => item.type === "constant" && item.symbol.trim()) && (
              <Badge variant="outline" className="ml-auto text-[10px] border-[#FFD700]/30 text-[#FFD700]">Constants appear gold</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border/40 bg-background/60 min-h-[100px] flex items-center justify-center overflow-x-auto p-4">
            {latex.trim() ? <ColoredBlockMath math={latex} variables={components.filter((item) => item.symbol.trim() && item.description.trim()).map((item) => `${item.symbol.trim()} = ${item.description.trim()} [${item.type}]`).join(", ")} /> : <p className="text-sm text-muted-foreground italic">Your equation preview will appear here.</p>}
          </div>
          {calculatorEnabled && calculatorLatex.trim() && (
            <div className="rounded-lg border border-border/40 bg-background/40 px-4 py-3 overflow-x-auto">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Calculator equation</p>
              <BlockMath math={calculatorLatex} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={createFormula.isPending} className="gap-2">
          <Save className="w-4 h-4" /> {createFormula.isPending ? "Saving..." : "Create formula page"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}