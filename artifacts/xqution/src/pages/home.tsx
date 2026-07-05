import { useGetStats, useListFeaturedFormulas, useListFormulaCategories, useListFormulas } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, Search, Activity, BookOpen, Hash, ChevronDown, ChevronRight, FlaskConical, Calculator, BookA, FileQuestion, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { BlockMath } from "@/components/ui/math";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

/* ─── static nav destinations ────────────────────────────────────────────── */

interface NavEntry {
  id: string; label: string; description: string; href: string;
  kind: "page" | "calculator"; tags?: string[];
}

const PAGES: NavEntry[] = [
  { id:"pg-formulas",   label:"Formulas",          href:"/formulas",        kind:"page",       description:"Browse all physics formulas",           tags:["equation","physics","math"] },
  { id:"pg-constants",  label:"Constants",          href:"/constants",       kind:"page",       description:"Physical constants reference",           tags:["reference","values"] },
  { id:"pg-calcs",      label:"Calculators",        href:"/calculators",     kind:"page",       description:"Interactive physics calculators",         tags:["compute","solve","calculate"] },
  { id:"pg-converter",  label:"Unit Converter",     href:"/converter",       kind:"page",       description:"Convert between physical units",          tags:["units","convert"] },
  { id:"pg-glossary",   label:"Glossary",           href:"/glossary",        kind:"page",       description:"Physics and astronomy terms",             tags:["definitions","terms","words"] },
  { id:"pg-problems",   label:"Practice Problems",  href:"/problems",        kind:"page",       description:"Test your knowledge",                    tags:["quiz","test","exercise"] },
  { id:"pg-favorites",  label:"Favorites",          href:"/favorites",       kind:"page",       description:"Your saved content",                     tags:["saved","starred","bookmarks"] },
  { id:"pg-astronomy",  label:"Astronomy Tools",    href:"/astronomy-tools", kind:"page",       description:"Planetary and orbital tools",            tags:["space","planet","star","telescope"] },
  { id:"pg-donate",     label:"Donate",             href:"/donate",          kind:"page",       description:"Support Xquation",                       tags:["support","help"] },
  { id:"pg-about",      label:"About",              href:"/about",           kind:"page",       description:"About Xquation" },
];

const CALCULATORS: NavEntry[] = [
  { id:"calc-kin",  label:"Kinematic Displacement", href:"/calculators", kind:"calculator", description:"Displacement from velocity, time, and acceleration", tags:["kinematics","displacement","motion"] },
  { id:"calc-ke",   label:"Kinetic Energy",          href:"/calculators", kind:"calculator", description:"Energy of a moving object — ½mv²",                  tags:["energy","mass","velocity"] },
  { id:"calc-emc2", label:"Mass–Energy Equivalence", href:"/calculators", kind:"calculator", description:"Rest energy from mass — E=mc²",                     tags:["relativity","einstein","energy","mass"] },
  { id:"calc-esc",  label:"Escape Velocity",         href:"/calculators", kind:"calculator", description:"Minimum speed to escape a gravitational body",       tags:["gravity","orbit","speed","velocity"] },
  { id:"calc-orb",  label:"Orbital Period",          href:"/calculators", kind:"calculator", description:"Time for one complete circular orbit",              tags:["orbit","period","gravity","orbital","kepler"] },
  { id:"calc-sch",  label:"Schwarzschild Radius",    href:"/calculators", kind:"calculator", description:"Event horizon radius of a black hole",              tags:["black hole","gravity","relativity"] },
  { id:"calc-ohm",  label:"Ohm's Law",               href:"/calculators", kind:"calculator", description:"Voltage, current, and resistance relationship",     tags:["electricity","voltage","current","resistance"] },
];

const LOCAL_ENTRIES = [...PAGES, ...CALCULATORS];

/* ─── fuzzy helpers ───────────────────────────────────────────────────────── */

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreLocal(query: string, e: NavEntry): number {
  const words = norm(query).split(" ").filter(Boolean);
  if (!words.length) return 0;
  const blob = [e.label, e.description, ...(e.tags ?? [])].map(norm).join(" ");
  let s = 0;
  for (const w of words) {
    if (blob.split(" ").includes(w)) s += 4;
    else if (blob.includes(w)) s += 2;
    else if (blob.includes(w.slice(0, Math.max(3, w.length - 1)))) s += 1;
  }
  return s;
}

/* ─── highlight (manual scan — no regex split edge cases) ─────────────────── */

function Hi({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const words = norm(q).split(" ").filter(w => w.length >= 2);
  if (!words.length) return <>{text}</>;

  // Find every match region in the original text (case-insensitive, whole-word-ish)
  const matches: Array<{ start: number; end: number }> = [];
  const lower = text.toLowerCase();
  for (const w of words) {
    let pos = 0;
    while ((pos = lower.indexOf(w, pos)) !== -1) {
      matches.push({ start: pos, end: pos + w.length });
      pos += 1; // allow overlapping
    }
  }
  if (matches.length === 0) return <>{text}</>;

  // Merge overlapping/adjacent regions
  matches.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (last && m.start <= last.end) {
      if (m.end > last.end) last.end = m.end;
    } else {
      merged.push({ start: m.start, end: m.end });
    }
  }

  // Build segments
  const segments: Array<{ text: string; mark: boolean }> = [];
  let cursor = 0;
  for (const m of merged) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start), mark: false });
    segments.push({ text: text.slice(m.start, m.end), mark: true });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), mark: false });

  return (
    <>
      {segments.map((seg, i) =>
        seg.mark
          ? <mark key={i} className="bg-primary/25 text-primary rounded-[2px] px-[1px] not-italic">{seg.text}</mark>
          : <span key={i}>{seg.text}</span>
      )}
    </>
  );
}

/* ─── group icon ──────────────────────────────────────────────────────────── */

function GIcon({ g }: { g: string }) {
  const cls = "w-3 h-3 shrink-0 opacity-70";
  if (g === "Formulas")    return <FlaskConical className={cls} />;
  if (g === "Constants")   return <BookOpen className={cls} />;
  if (g === "Calculators") return <Calculator className={cls} />;
  if (g === "Glossary")    return <BookA className={cls} />;
  if (g === "Problems")    return <FileQuestion className={cls} />;
  return <LayoutGrid className={cls} />;
}

/* ─── types ───────────────────────────────────────────────────────────────── */

interface Suggestion { id: string; label: string; description: string; href: string; group: string; }

/* ─── SmartSearchBar ──────────────────────────────────────────────────────── */

function SmartSearchBar() {
  const [query, setQuery] = useState("");
  const [apiHits, setApiHits] = useState<{ formulas: Array<{id:number;name:string;description:string;category:string}>; constants: Array<{id:number;name:string;symbol:string;description:string}>; glossary: Array<{id:number;term:string;definition:string}>; problems: Array<{id:number;question:string;topic:string}> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* debounced API search */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (q.length < 2) { setApiHits(null); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setApiHits(await res.json());
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 270);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  /* compute suggestions */
  const suggestions = useMemo<Suggestion[]>(() => {
    const q = query.trim();

    const local = LOCAL_ENTRIES
      .map(e => ({ e, s: scoreLocal(q, e) }))
      .filter(x => q.length < 2 ? false : x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map(({ e }) => ({ id: e.id, label: e.label, description: e.description, href: e.href, group: e.kind === "calculator" ? "Calculators" : "Pages" }));

    if (!apiHits) return local;

    const formulas = apiHits.formulas.slice(0, 4).map(f => ({ id:`f${f.id}`, label:f.name, description:f.description||f.category, href:`/formulas/${f.id}`, group:"Formulas" }));
    const constants = apiHits.constants.slice(0, 2).map(c => ({ id:`c${c.id}`, label:`${c.name} (${c.symbol})`, description:c.description, href:"/constants", group:"Constants" }));
    const glossary  = apiHits.glossary.slice(0, 2).map(g => ({ id:`g${g.id}`, label:g.term, description:g.definition.slice(0,80)+(g.definition.length>80?"…":""), href:"/glossary", group:"Glossary" }));
    const problems  = apiHits.problems.slice(0, 1).map(p => ({ id:`p${p.id}`, label:p.topic, description:p.question.slice(0,70)+(p.question.length>70?"…":""), href:"/problems", group:"Problems" }));

    const all = [...formulas, ...local, ...constants, ...glossary, ...problems];
    const seen = new Set<string>();
    return all.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  }, [query, apiHits]);

  /* grouped */
  const groups = useMemo(() => {
    const m = new Map<string, Suggestion[]>();
    for (const s of suggestions) { if (!m.has(s.group)) m.set(s.group, []); m.get(s.group)!.push(s); }
    return m;
  }, [suggestions]);

  useEffect(() => { setCursor(0); }, [suggestions.length]);

  /* scroll active into view */
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${cursor}"]`)?.scrollIntoView({ block:"nearest" });
  }, [cursor]);

  const go = useCallback((href: string) => {
    setOpen(false);
    const q = encodeURIComponent(query.trim());
    // pass the "matching" query so destination page can glow the result
    const sep = href.includes("?") ? "&" : "?";
    const dest = `${href}${sep}match=${q}`;
    navigate(dest);
    setQuery("");
  }, [navigate, query]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !suggestions.length) {
      if (e.key === "Enter" && query.trim()) {
        go(`/formulas?search=${encodeURIComponent(query.trim())}`);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c+1, suggestions.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c-1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (suggestions[cursor]) go(suggestions[cursor].href); }
    if (e.key === "Escape")    { setOpen(false); }
  };

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className="relative w-full max-w-xl mx-auto">
      {/* input */}
      <div className={cn("relative group flex items-center transition-all", showDropdown && "z-50")}>
        <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search formulas, constants, topics…"
          className={cn(
            "w-full h-14 pl-12 pr-4 bg-background/50 border border-primary/20 text-base rounded-full",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
            "shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all font-mono text-foreground placeholder:text-muted-foreground",
            showDropdown && "rounded-b-none border-b-0"
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <div className="absolute right-5 w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />}
      </div>

      {/* dropdown — in-flow so it pushes page content down */}
      {showDropdown && (
        <div
          ref={listRef}
          className="mt-3 bg-card border border-primary/20 rounded-2xl shadow-2xl overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,217,255,0.06)" }}
        >
          {suggestions.length === 0 && !loading && (
            <div className="px-6 py-8 text-sm text-muted-foreground text-center">
              No results for "<span className="text-foreground">{query}</span>"
              <br />
              <button
                className="mt-3 text-xs text-primary hover:underline"
                onClick={() => go(`/formulas?search=${encodeURIComponent(query)}`)}
              >
                Search all formulas →
              </button>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="py-4">
              {/* "Similar results" label */}
              <div className="px-6 pt-2 pb-4 text-[10px] font-semibold uppercase tracking-widest text-primary/50">
                Similar results
              </div>

              {(() => {
                let idx = 0;
                return Array.from(groups.entries()).map(([group, items]) => (
                  <div key={group} className="mb-4">
                    <div className="px-6 pt-3 pb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                      <GIcon g={group} />{group}
                    </div>
                    <div className="space-y-1.5 px-3">
                      {items.map(item => {
                        const i = idx++;
                        const active = i === cursor;
                        return (
                          <button
                            key={item.id}
                            data-idx={i}
                            onMouseDown={e => { e.preventDefault(); go(item.href); }}
                            onMouseEnter={() => setCursor(i)}
                            className={cn(
                              "w-full text-left px-4 py-4 flex flex-col rounded-xl transition-colors border-l-[3px]",
                              active ? "bg-primary/10 border-primary" : "border-transparent hover:bg-muted/50"
                            )}
                          >
                            <span className="text-sm font-medium text-foreground leading-snug">
                              <Hi text={item.label} q={query} />
                            </span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                                <Hi text={item.description} q={query} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}

              <div className="border-t border-border/30 px-6 py-3 mt-2">
                <button
                  onMouseDown={() => go(`/formulas?search=${encodeURIComponent(query)}`)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3 h-3" /> Search all formulas for "<span className="font-mono">{query}</span>"
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── category expand ─────────────────────────────────────────────────────── */

function CategoryFormulas({ category }: { category: string }) {
  const { data: formulas, isLoading } = useListFormulas({ category });
  if (isLoading) return <div className="py-4 text-center text-sm text-muted-foreground">Loading…</div>;
  return (
    <ul className="divide-y divide-border/40">
      {formulas?.map((f) => (
        <li key={f.id}>
          <Link href={`/formulas/${f.id}`} className="group flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-all">
            <span className="text-sm font-medium text-foreground/80 group-hover:text-primary group-hover:translate-x-1 transition-all duration-150 inline-block">
              {f.name}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ─── Home page ───────────────────────────────────────────────────────────── */

export default function Home() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: featured, isLoading: featuredLoading } = useListFeaturedFormulas();
  const { data: categories, isLoading: categoriesLoading } = useListFormulaCategories();

  const toggleCategory = (name: string) => {
    setExpandedCategory(prev => prev === name ? null : name);
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative text-center py-20 px-4 flex flex-col items-center justify-center min-h-[40vh] border border-border rounded-xl bg-card/30 backdrop-blur overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <h1 className="text-4xl md:text-6xl font-black font-mono tracking-tighter mb-2">
          <span style={{ color: "#00D9FF" }}>X</span>
          <span className="text-foreground/90">QUATION</span>
        </h1>
        <p className="text-base md:text-lg text-primary/80 font-mono tracking-widest mb-4 uppercase">
          Explore. Calculate. Understand.
        </p>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8">
          Physics, Mathematics, and Astronomy — all in one place.
        </p>

        <SmartSearchBar />
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Formulas",   value: stats?.formulaCount,  icon: Hash,     loading: statsLoading },
          { label: "Constants",  value: stats?.constantCount, icon: BookOpen, loading: statsLoading },
          { label: "Categories", value: stats?.categoryCount, icon: Activity, loading: statsLoading },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <stat.icon className="w-6 h-6 text-primary mb-2 opacity-80" />
              {stat.loading
                ? <Skeleton className="h-8 w-16 mb-1" />
                : <div className="text-3xl font-bold font-mono text-foreground">{stat.value}</div>}
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Expandable Domain Cards */}
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
          {categoriesLoading
            ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
            : categories?.map((cat) => {
                const isOpen = expandedCategory === cat.category;
                return (
                  <div
                    key={cat.category}
                    className={cn(
                      "rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer",
                      isOpen
                        ? "border-primary/60 bg-card shadow-[0_0_20px_rgba(0,217,255,0.08)] md:col-span-3"
                        : "border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card"
                    )}
                    onClick={() => toggleCategory(cat.category)}
                  >
                    <div className="flex items-center justify-between p-6 select-none">
                      <div>
                        <h3 className={cn("text-xl font-semibold transition-colors", isOpen ? "text-primary" : "group-hover:text-primary")}>
                          {cat.category}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{cat.count} formulas</p>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180 text-primary")} />
                    </div>
                    {isOpen && (
                      <div className="border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                        <CategoryFormulas category={cat.category} />
                        <div className="px-4 py-3 border-t border-border/30">
                          <Link
                            href={`/formulas?category=${encodeURIComponent(cat.category)}`}
                            className="text-xs font-mono text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            View all {cat.category} formulas <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      </section>

      {/* Discord Community */}
      <section>
        <a
          href="https://discord.com/channels/1523311638374256651/1523311639032631307"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/5 hover:bg-[#5865F2]/10 hover:border-[#5865F2]/50 transition-all duration-200 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#5865F2]/15 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 9a5 5 0 0 0-5-5h-2a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5V9z"/>
                <path d="m9 15 6-6"/>
                <path d="M15 15 9 9"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground">Join our Discord</p>
              <p className="text-sm text-muted-foreground mt-0.5">Chat with the community, ask questions, and share discoveries.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[#5865F2] shrink-0" />
          </div>
        </a>
      </section>

      {/* Featured Formulas */}
      <section>
        <h2 className="text-2xl font-bold font-mono tracking-tight mb-6 flex items-center gap-2">
          <span className="text-secondary">&gt;</span> FEATURED
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLoading
            ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
            : featured?.map((formula) => (
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
                    <Link
                      href={`/formulas/${formula.id}`}
                      className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardFooter>
                </Card>
              ))}
        </div>
      </section>
    </div>
  );
}
