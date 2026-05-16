import { useListFormulas, useListFormulaCategories, useListFavorites, useAddFavorite, useRemoveFavorite, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Star, Filter, Copy, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BlockMath, InlineMath } from "@/components/ui/math";
import { SymbolCards } from "@/components/formula/symbol-cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocation } from "wouter";

export default function Formulas() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "all";

  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: formulas, isLoading } = useListFormulas({
    search: search || undefined,
    category: category !== "all" ? category : undefined
  });

  const { data: categories } = useListFormulaCategories();
  const { data: favorites } = useListFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favoriteFormulaIds = useMemo(() => {
    return new Set((favorites || []).filter(f => f.itemType === 'formula').map(f => f.itemId));
  }, [favorites]);

  const toggleFavorite = (formula: any) => {
    const isFav = favoriteFormulaIds.has(formula.id);
    if (isFav) {
      const fav = favorites?.find(f => f.itemType === 'formula' && f.itemId === formula.id);
      if (fav) {
        removeFavorite.mutate({ id: fav.id }, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() })
        });
      }
    } else {
      addFavorite.mutate({
        data: { itemType: 'formula', itemId: formula.id, itemName: formula.name }
      }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() })
      });
    }
  };

  const copyLatex = (id: number, latex: string) => {
    navigator.clipboard.writeText(latex);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Formula Explorer</h1>
        <p className="text-muted-foreground">Browse, search, and copy exact mathematical representations.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search formulas..." 
            className="pl-9 font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[200px] font-mono">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {categories?.map(c => (
              <SelectItem key={c.category} value={c.category}>{c.category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[300px] w-full" />)
        ) : formulas?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No formulas found matching your criteria.
          </div>
        ) : (
          formulas?.map(formula => (
            <Card key={formula.id} className="border-border/50 bg-card overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl mb-1">{formula.name}</CardTitle>
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary" className="font-mono text-xs">{formula.category}</Badge>
                      {formula.subcategory && <span className="text-xs text-muted-foreground">{formula.subcategory}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyLatex(formula.id, formula.latex)}
                      title="Copy LaTeX"
                    >
                      {copiedId === formula.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleFavorite(formula)}
                      className={favoriteFormulaIds.has(formula.id) ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                    >
                      <Star className="w-4 h-4" fill={favoriteFormulaIds.has(formula.id) ? "currentColor" : "none"} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-background/80 rounded-md p-6 border border-border/50 flex items-center justify-center overflow-x-auto min-h-[120px]">
                  <BlockMath math={formula.latex} />
                </div>

                <SymbolCards variables={formula.variables} />

                <p className="text-sm text-foreground/80 mt-6 mb-4">{formula.description}</p>

                {formula.siUnits && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Result Unit:</span>
                    <span className="text-xs font-mono text-green-400">{formula.siUnits}</span>
                  </div>
                )}

                {(formula.example || formula.relatedFormulas) && (
                  <Accordion type="single" collapsible className="mt-6">
                    {formula.example && (
                      <AccordionItem value="example">
                        <AccordionTrigger className="text-sm font-mono py-2">Example Application</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4">
                           <div className="bg-muted/30 p-4 rounded-md font-mono whitespace-pre-wrap">
                             {formula.example}
                           </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {formula.relatedFormulas && (
                      <AccordionItem value="related">
                        <AccordionTrigger className="text-sm font-mono py-2">Related Formulas</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4">
                           {formula.relatedFormulas}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
