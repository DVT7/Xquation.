import { useListGlossaryTerms } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Glossary() {
  const searchParams = new URLSearchParams(window.location.search);
  const matchQuery = searchParams.get("match") || "";
  const [glowId, setGlowId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const { data: terms, isLoading } = useListGlossaryTerms({ search: search || undefined });

  /* glow the card that "matched" from smart search */
  useEffect(() => {
    if (!matchQuery || !terms?.length) return;
    const q = matchQuery.toLowerCase();
    const hit = terms.find(t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q));
    if (hit) {
      setGlowId(hit.id);
      setTimeout(() => setGlowId(null), 3200);
    }
  }, [matchQuery, terms]);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Glossary</h1>
        <p className="text-muted-foreground">Definitions for key terminology across physics and astronomy.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search terms..." 
          className="pl-9 font-mono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : terms?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No terms found.</div>
        ) : (
          terms?.map(term => (
            <Card key={term.id} className={cn("border-border/50 bg-card hover:border-primary/30 transition-colors", glowId === term.id && "match-glow")}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="text-xl font-bold font-mono text-primary">{term.term}</h3>
                  {term.category && <Badge variant="outline" className="text-[10px] font-mono whitespace-nowrap">{term.category}</Badge>}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{term.definition}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
