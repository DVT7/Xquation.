import { useGetStats, useListFeaturedFormulas, useListFormulaCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Search, Activity, BookOpen, BrainCircuit, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BlockMath } from "@/components/ui/math";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: featured, isLoading: featuredLoading } = useListFeaturedFormulas();
  const { data: categories, isLoading: categoriesLoading } = useListFormulaCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/formulas?search=${encodeURIComponent(search)}`);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative text-center py-20 px-4 flex flex-col items-center justify-center min-h-[40vh] border border-border rounded-xl bg-card/30 backdrop-blur overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
          XQUTION
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 font-medium">
          Physics, Mathematics, and Astronomy Calculations Made Simple
        </p>
        
        <form onSubmit={handleSearch} className="relative w-full max-w-xl mx-auto group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            type="search" 
            placeholder="Search formulas, constants, topics..." 
            className="w-full h-14 pl-12 pr-4 bg-background/50 border-primary/20 text-lg rounded-full focus-visible:ring-primary/50 shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Formulas", value: stats?.formulaCount, icon: Hash, loading: statsLoading },
          { label: "Constants", value: stats?.constantCount, icon: BookOpen, loading: statsLoading },
          { label: "Problems", value: stats?.problemCount, icon: BrainCircuit, loading: statsLoading },
          { label: "Categories", value: stats?.categoryCount, icon: Activity, loading: statsLoading },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <stat.icon className="w-6 h-6 text-primary mb-2 opacity-80" />
              {stat.loading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-3xl font-bold font-mono text-foreground">{stat.value}</div>
              )}
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-mono tracking-tight flex items-center gap-2">
            <span className="text-primary">&gt;</span> DOMAINS
          </h2>
          <Link href="/formulas" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-mono">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoriesLoading ? (
             Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : (
            categories?.map((cat) => (
              <Link key={cat.category} href={`/formulas?category=${encodeURIComponent(cat.category)}`} className="block">
                <Card className="h-full bg-card/40 hover:bg-card border-border/50 hover:border-primary/50 transition-all cursor-pointer group min-h-[100px]">
                  <CardHeader className="p-6">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors break-words">{cat.category}</CardTitle>
                    <CardDescription className="mt-1">{cat.count} formulas</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Formulas */}
      <section>
        <h2 className="text-2xl font-bold font-mono tracking-tight mb-6 flex items-center gap-2">
          <span className="text-secondary">&gt;</span> FEATURED
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
          ) : (
            featured?.map((formula) => (
              <Card key={formula.id} className="bg-card border-border overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-1">
                    <CardTitle className="text-base line-clamp-1" title={formula.name}>{formula.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">{formula.category}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center py-6 bg-background/50 border-y border-border/30">
                  <div className="overflow-x-auto w-full text-center px-4">
                    <BlockMath math={formula.latex} />
                  </div>
                </CardContent>
                <CardFooter className="p-3 bg-card flex justify-end">
                  <Link href={`/formulas?search=${encodeURIComponent(formula.name)}`} className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
