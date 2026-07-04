import { useListProblems } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BlockMath } from "@/components/ui/math";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { LogIn, Telescope, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export default function Problems() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const matchQuery = searchParams.get("match") || "";
  const [glowId, setGlowId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const { data: problems, isLoading } = useListProblems({ search: search || undefined });

  /* glow the card that "matched" from smart search */
  useEffect(() => {
    if (!matchQuery || !problems?.length) return;
    const q = matchQuery.toLowerCase();
    const hit = problems.find(p =>
      p.topic.toLowerCase().includes(q) ||
      p.question.toLowerCase().includes(q)
    );
    if (hit) {
      setGlowId(hit.id);
      setTimeout(() => setGlowId(null), 3200);
    }
  }, [matchQuery, problems]);

  if (authLoading) return null;
  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Telescope className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Sign in to practice</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Log in to test your knowledge with step-by-step solutions.
          </p>
        </div>
        <Button onClick={login} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8" size="lg">
          <LogIn className="w-4 h-4" />
          Log In
        </Button>
        <div className="flex gap-4 justify-center">
          <Link href="/formulas" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-mono text-sm">
            <FlaskConical className="w-4 h-4" /> Browse Formulas
          </Link>
        </div>
      </div>
    );
  }

  const diffColors: Record<string, string> = {
    easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Practice Problems</h1>
        <p className="text-muted-foreground">Test your knowledge with step-by-step solutions.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search topics or concepts..." 
          className="pl-9 font-mono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : problems?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No problems found.</div>
        ) : (
          problems?.map(problem => (
            <Card key={problem.id} className={cn("border-border/50 bg-card overflow-hidden", glowId === problem.id && "match-glow")}>
              <CardHeader className="bg-muted/20 border-b border-border/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{problem.topic}</CardTitle>
                  <Badge variant="outline" className={`${diffColors[problem.difficulty.toLowerCase()] || ""} uppercase text-xs tracking-wider`}>
                    {problem.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-base text-foreground mb-6 leading-relaxed">
                  {problem.question}
                </div>
                
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {problem.hint && (
                    <AccordionItem value="hint" className="border border-border/50 rounded-lg px-4 bg-background/50">
                      <AccordionTrigger className="text-sm font-mono text-muted-foreground hover:text-foreground hover:no-underline">
                        Need a hint?
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                        {problem.hint}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  {problem.solution && (
                    <AccordionItem value="solution" className="border border-border/50 rounded-lg px-4 bg-background/50">
                      <AccordionTrigger className="text-sm font-mono text-primary hover:no-underline">
                        View Solution
                      </AccordionTrigger>
                      <AccordionContent className="text-foreground pt-4 pb-2 space-y-4">
                        <div className="bg-muted/30 p-4 rounded-md font-mono whitespace-pre-wrap text-sm border border-border/50">
                          {problem.solution}
                        </div>
                        {problem.answer && (
                          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-md">
                            <span className="font-bold text-sm text-primary uppercase tracking-wider block mb-2">Final Answer</span>
                            <div className="text-center">
                              {problem.answer.includes('\\') ? <BlockMath math={problem.answer} /> : <span className="font-mono text-xl">{problem.answer}</span>}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
