import {
  useCreateOwnerFormula,
  useListFormulaCategories,
  useListFormulas,
  useListConstants,
  useListGlossaryTerms,
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
import { Calculator, Code2, Eye, Plus, Save, Trash2, Link2, BookOpen, FlaskConical, ListChecks } from "lucide-react";
import { DIFFICULTY_LABELS } from "@/lib/formula-problems";

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

type ProblemVariable = {
  id: number;
  symbol: string;
  value: string;
  unit: string;
};

type ProblemDraft = {
  id: number;
  difficulty: number;
  question: string;
  hint: string;
  solution: string;
  answer: string;
  variables: ProblemVariable[];
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

const newProblemVariable = (id: number): ProblemVariable => ({ id, symbol: "", value: "", unit: "" });
const newProblem = (id: number): ProblemDraft => ({
  id,
  difficulty: 3,
  question: "",
  hint: "",
  solution: "",
  answer: "",
  variables: [newProblemVariable(id + 1)],
});

export function FormulaBuilder() {
  const queryClient = useQueryClient();
  const { data: categories } = useListFormulaCategories();
  const { data: existingFormulas } = useListFormulas({});
  const { data: existingConstants } = useListConstants({});
  const { data: existingGlossary } = useListGlossaryTerms({});
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [latex, setLatex] = useState("");
  const [description, setDescription] = useState("");
  const [components, setComponents] = useState<FormulaComponent[]>([newComponent(1)]);
  const [siUnits, setSiUnits] = useState("");
  const [example, setExample] = useState("");
  const [selectedFormulaIds, setSelectedFormulaIds] = useState<number[]>([]);
  const [selectedConstantIds, setSelectedConstantIds] = useState<number[]>([]);
  const [selectedGlossaryIds, setSelectedGlossaryIds] = useState<number[]>([]);
  const [formulaSearch, setFormulaSearch] = useState("");
  const [constantSearch, setConstantSearch] = useState("");
  const [glossarySearch, setGlossarySearch] = useState("");
  const [derivation, setDerivation] = useState("");
  const [problemDrafts, setProblemDrafts] = useState<ProblemDraft[]>([]);
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

  const updateProblem = (id: number, patch: Partial<ProblemDraft>) => {
    setProblemDrafts((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateProblemVariable = (problemId: number, variableId: number, patch: Partial<ProblemVariable>) => {
    setProblemDrafts((items) => items.map((problem) => problem.id === problemId
      ? {
          ...problem,
          variables: problem.variables.map((variable) => variable.id === variableId ? { ...variable, ...patch } : variable),
        }
      : problem));
  };

  const toggleSelected = (ids: number[], id: number, setIds: (next: number[]) => void) => {
    setIds(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
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
    setSelectedFormulaIds([]);
    setSelectedConstantIds([]);
    setSelectedGlossaryIds([]);
    setFormulaSearch("");
    setConstantSearch("");
    setGlossarySearch("");
    setDerivation("");
    setProblemDrafts([]);
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

    if (problemDrafts.some((problem) =>
      !problem.question.trim() ||
      !problem.answer.trim() ||
      !problem.solution.split("\n").some((step) => step.trim()) ||
      problem.variables.some((variable) => !variable.symbol.trim() || !variable.value.trim())
    )) {
      setFormError("Each practice problem needs a question, difficulty, selected variable values, a solution, and an answer.");
      return;
    }

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
      relatedFormulas: selectedFormulaIds.length ? JSON.stringify(selectedFormulaIds) : null,
      relatedConstants: selectedConstantIds.length ? JSON.stringify(selectedConstantIds) : null,
      relatedGlossary: selectedGlossaryIds.length ? JSON.stringify(selectedGlossaryIds) : null,
      derivation: derivation.trim() || null,
      problems: problemDrafts.length ? JSON.stringify(problemDrafts.map(({ id: _id, ...problem }) => ({
        ...problem,
        question: problem.question.trim(),
        hint: problem.hint.trim(),
        answer: problem.answer.trim(),
        solution: problem.solution.split("\n").map((step) => step.trim()).filter(Boolean),
        variables: problem.variables
          .filter((variable) => variable.symbol.trim() && variable.value.trim())
          .map(({ id: _variableId, ...variable }) => ({
            symbol: variable.symbol.trim(),
            value: variable.value.trim(),
            unit: variable.unit.trim(),
          })),
      }))) : null,
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
            <Field label="Derivation" hint="Write one step per line. These steps appear in the Derivation section of the formula page.">
              <Textarea value={derivation} onChange={(e) => setDerivation(e.target.value)} placeholder={"Start from ...\nRearrange ...\nTherefore ..."} className="min-h-[90px] font-mono" />
            </Field>
          </div>

          <Card className="bg-background/40 border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" /> Related content
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Select from records already in XQution. Nothing is saved as a misspelled or unavailable related item.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SelectionPanel
                label="Related formulas"
                icon={<FlaskConical className="w-3.5 h-3.5 text-primary" />}
                search={formulaSearch}
                onSearch={setFormulaSearch}
                selectedIds={selectedFormulaIds}
                onToggle={(id) => toggleSelected(selectedFormulaIds, id, setSelectedFormulaIds)}
                items={(existingFormulas ?? [])
                  .filter((item) => item.name.toLowerCase().includes(formulaSearch.toLowerCase()))
                  .map((item) => ({ id: item.id, label: item.name, meta: item.category }))}
              />
              <SelectionPanel
                label="Related constants"
                icon={<span className="font-mono text-[#FFD700]">C</span>}
                search={constantSearch}
                onSearch={setConstantSearch}
                selectedIds={selectedConstantIds}
                onToggle={(id) => toggleSelected(selectedConstantIds, id, setSelectedConstantIds)}
                items={(existingConstants ?? [])
                  .filter((item) => `${item.name} ${item.symbol}`.toLowerCase().includes(constantSearch.toLowerCase()))
                  .map((item) => ({ id: item.id, label: item.name, meta: `${item.symbol} · ${item.units}` }))}
              />
              <SelectionPanel
                label="Related glossary terms"
                icon={<BookOpen className="w-3.5 h-3.5 text-primary" />}
                search={glossarySearch}
                onSearch={setGlossarySearch}
                selectedIds={selectedGlossaryIds}
                onToggle={(id) => toggleSelected(selectedGlossaryIds, id, setSelectedGlossaryIds)}
                items={(existingGlossary ?? [])
                  .filter((item) => item.term.toLowerCase().includes(glossarySearch.toLowerCase()))
                  .map((item) => ({ id: item.id, label: item.term, meta: item.category ?? "Glossary" }))}
              />
            </CardContent>
          </Card>

          <Card className="bg-background/40 border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-primary" /> Practice problems
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add problems that use this formula. Each one includes its own difficulty, selected variable values, solution, and final answer.
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => setProblemDrafts((items) => [...items, newProblem(Date.now())])}>
                  <Plus className="w-3.5 h-3.5" /> Add problem
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {problemDrafts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic border border-dashed border-border/50 rounded-lg px-3 py-4 text-center">
                  No formula-specific problems yet.
                </p>
              ) : (
                problemDrafts.map((problem, index) => (
                  <ProblemEditor
                    key={problem.id}
                    problem={problem}
                    index={index}
                    symbols={components.filter((item) => item.symbol.trim()).map((item) => item.symbol.trim())}
                    onUpdate={(patch) => updateProblem(problem.id, patch)}
                    onUpdateVariable={(variableId, patch) => updateProblemVariable(problem.id, variableId, patch)}
                    onAddVariable={() => updateProblem(problem.id, { variables: [...problem.variables, newProblemVariable(Date.now())] })}
                    onRemoveVariable={(variableId) => updateProblem(problem.id, { variables: problem.variables.filter((item) => item.id !== variableId) })}
                    onRemove={() => setProblemDrafts((items) => items.filter((item) => item.id !== problem.id))}
                  />
                ))
              )}
            </CardContent>
          </Card>

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

type SelectionItem = { id: number; label: string; meta: string };

function SelectionPanel({
  label,
  icon,
  items,
  selectedIds,
  search,
  onSearch,
  onToggle,
}: {
  label: string;
  icon: React.ReactNode;
  items: SelectionItem[];
  selectedIds: number[];
  search: string;
  onSearch: (value: string) => void;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-2">
        {icon} {label}
        {selectedIds.length > 0 && <Badge variant="outline" className="ml-auto text-[10px]">{selectedIds.length} selected</Badge>}
      </div>
      <Input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={`Search ${label.toLowerCase()}...`} className="h-8 text-xs mb-2" />
      <div className="max-h-44 overflow-y-auto space-y-1 rounded-lg border border-border/40 bg-background/50 p-1.5">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic px-2 py-3 text-center">No matching records.</p>
        ) : (
          items.map((item) => (
            <label key={item.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-primary/5 cursor-pointer">
              <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => onToggle(item.id)} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-xs text-foreground truncate">{item.label}</span>
                <span className="block text-[10px] text-muted-foreground truncate">{item.meta}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function ProblemEditor({
  problem,
  index,
  symbols,
  onUpdate,
  onUpdateVariable,
  onAddVariable,
  onRemoveVariable,
  onRemove,
}: {
  problem: ProblemDraft;
  index: number;
  symbols: string[];
  onUpdate: (patch: Partial<ProblemDraft>) => void;
  onUpdateVariable: (id: number, patch: Partial<ProblemVariable>) => void;
  onAddVariable: () => void;
  onRemoveVariable: (id: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Problem {index + 1}</p>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={onRemove} aria-label={`Remove problem ${index + 1}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
        <Field label="Question *">
          <Textarea value={problem.question} onChange={(e) => onUpdate({ question: e.target.value })} placeholder="A body of mass ... Find ..." className="min-h-[70px]" />
        </Field>
        <Field label="Difficulty *">
          <select value={problem.difficulty} onChange={(e) => onUpdate({ difficulty: Number(e.target.value) })} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground">
            {Object.entries(DIFFICULTY_LABELS).map(([level, label]) => <option key={level} value={level}>Level {level} — {label}</option>)}
          </select>
        </Field>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Selected variables *</Label>
          <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onAddVariable} disabled={symbols.length === 0}>
            <Plus className="w-3 h-3" /> Add value
          </Button>
        </div>
        {symbols.length === 0 ? (
          <p className="text-[11px] text-amber-300/80 border border-amber-300/20 bg-amber-300/5 rounded-md px-2 py-2">Add symbols above before assigning problem values.</p>
        ) : (
          <div className="space-y-2">
            {problem.variables.map((variable) => (
              <div key={variable.id} className="grid grid-cols-[1fr_1fr_0.8fr_auto] gap-2">
                <select value={variable.symbol} onChange={(e) => onUpdateVariable(variable.id, { symbol: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground">
                  <option value="">Select symbol</option>
                  {symbols.map((symbol) => <option key={symbol} value={symbol}>{symbol}</option>)}
                </select>
                <Input value={variable.value} onChange={(e) => onUpdateVariable(variable.id, { value: e.target.value })} placeholder="Value" className="font-mono text-xs" />
                <Input value={variable.unit} onChange={(e) => onUpdateVariable(variable.id, { unit: e.target.value })} placeholder="Unit" className="text-xs" />
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-red-400" onClick={() => onRemoveVariable(variable.id)} disabled={problem.variables.length === 1} aria-label="Remove variable value">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Hint">
          <Textarea value={problem.hint} onChange={(e) => onUpdate({ hint: e.target.value })} placeholder="Give a small nudge." className="min-h-[60px]" />
        </Field>
        <Field label="Final answer *">
          <Input value={problem.answer} onChange={(e) => onUpdate({ answer: e.target.value })} placeholder="e.g. 12 N" className="font-mono" />
        </Field>
      </div>
      <Field label="Solution steps *" hint="One step per line. These appear when the learner opens the solution.">
        <Textarea value={problem.solution} onChange={(e) => onUpdate({ solution: e.target.value })} placeholder={"F = ma\nF = (2 kg)(6 m/s²)\nF = 12 N"} className="min-h-[90px] font-mono" />
      </Field>
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