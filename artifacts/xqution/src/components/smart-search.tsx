import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, FlaskConical, BookOpen, Calculator, BookA, FileQuestion, LayoutGrid, X } from "lucide-react";
import { hasDiscoveredLimbo, LIMBO_SEARCH_HREF, LIMBO_TRIGGER_EVENT } from "@/lib/limbo";

/* ─── static local entries ─────────────────────────────────────────────────── */

interface LocalEntry {
  id: string;
  label: string;
  description: string;
  href: string;
  kind: "page" | "calculator";
  tags?: string[];
}

const PAGES: LocalEntry[] = [
  { id: "pg-formulas",   label: "Formulas",         href: "/formulas",   description: "Browse all physics formulas",       kind: "page", tags: ["equation","physics","math"] },
  { id: "pg-constants",  label: "Constants",         href: "/constants",  description: "Physical constants reference",      kind: "page", tags: ["reference","values"] },
  { id: "pg-calcs",      label: "Calculators",       href: "/calculators",description: "Interactive physics calculators",   kind: "page", tags: ["compute","solve"] },
  { id: "pg-converter",  label: "Unit Converter",    href: "/converter",  description: "Convert between physical units",    kind: "page", tags: ["units","convert"] },
  { id: "pg-glossary",   label: "Glossary",          href: "/glossary",   description: "Physics and astronomy terms",       kind: "page", tags: ["definitions","terms"] },
  { id: "pg-problems",   label: "Practice Problems", href: "/problems",   description: "Test your knowledge",               kind: "page", tags: ["quiz","test","exercise"] },
  { id: "pg-favorites",  label: "Favorites",         href: "/favorites",  description: "Your saved content",               kind: "page", tags: ["saved","starred"] },
  { id: "pg-astronomy",  label: "Astronomy Tools",   href: "/astronomy-tools", description: "Planetary and orbital tools", kind: "page", tags: ["space","planet","star"] },
  { id: "pg-about",      label: "About",             href: "/about",      description: "About XQuation",                   kind: "page" },
];

const CALCULATORS: LocalEntry[] = [
  { id: "calc-kin",  label: "Kinematic Displacement",  href: "/calculators", kind: "calculator", description: "Displacement from velocity, time, and acceleration",   tags: ["kinematics","displacement","motion"] },
  { id: "calc-ke",   label: "Kinetic Energy",           href: "/calculators", kind: "calculator", description: "Energy of a moving object — ½mv²",                   tags: ["energy","mass","velocity"] },
  { id: "calc-emc2", label: "Mass–Energy Equivalence",  href: "/calculators", kind: "calculator", description: "Rest energy from mass — E=mc²",                      tags: ["relativity","einstein","energy","mass"] },
  { id: "calc-esc",  label: "Escape Velocity",          href: "/calculators", kind: "calculator", description: "Minimum speed to escape a gravitational body",        tags: ["gravity","orbit","speed","velocity"] },
  { id: "calc-orb",  label: "Orbital Period",           href: "/calculators", kind: "calculator", description: "Time for one complete circular orbit",               tags: ["orbit","period","gravity","orbital velocity","kepler"] },
  { id: "calc-sch",  label: "Schwarzschild Radius",     href: "/calculators", kind: "calculator", description: "Event horizon radius of a black hole",               tags: ["black hole","gravity","relativity"] },
  { id: "calc-ohm",  label: "Ohm's Law",                href: "/calculators", kind: "calculator", description: "Voltage, current, and resistance relationship",      tags: ["electricity","voltage","current","resistance"] },
];

const LOCAL_ENTRIES = [...PAGES, ...CALCULATORS];
const LIMBO_ENTRY: LocalEntry = {
  id: "cmd-limbo",
  label: "/limbo",
  href: LIMBO_SEARCH_HREF,
  description: "Enter the hidden Limbo challenge",
  kind: "page",
  tags: ["easter egg", "secret", "challenge"],
};

/* ─── fuzzy scoring ─────────────────────────────────────────────────────────── */

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function score(query: string, entry: LocalEntry): number {
  const words = normalise(query).split(" ").filter(Boolean);
  if (!words.length) return 0;

  const targets = [
    entry.label,
    entry.description,
    ...(entry.tags ?? []),
  ].map(normalise).join(" ");

  let s = 0;
  for (const w of words) {
    if (targets.includes(w)) s += 3;
    else if (targets.split(" ").some(t => t.startsWith(w) && w.length >= 3)) s += 2;
    else if (targets.includes(w.slice(0, Math.max(3, w.length - 1)))) s += 1;
  }
  return s;
}

/* ─── text highlight ────────────────────────────────────────────────────────── */

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const words = normalise(query).split(" ").filter(w => w.length >= 2);
  if (!words.length) return <>{text}</>;

  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part)
          ? <mark key={i} className="bg-primary/25 text-primary rounded-[2px] px-[1px]">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

/* ─── result types ──────────────────────────────────────────────────────────── */

interface ResultItem {
  id: string;
  label: string;
  description: string;
  href: string;
  group: string;
}

/* ─── API fetch (debounced) ─────────────────────────────────────────────────── */

interface ApiResults {
  formulas: Array<{ id: number; name: string; description: string; category: string }>;
  constants: Array<{ id: number; name: string; symbol: string; description: string }>;
  problems: Array<{ id: number; question: string; topic: string }>;
  glossary: Array<{ id: number; term: string; definition: string }>;
}

async function fetchSearch(q: string): Promise<ApiResults> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("search failed");
  return res.json() as Promise<ApiResults>;
}

/* ─── group icon ─────────────────────────────────────────────────────────────── */

function GroupIcon({ group }: { group: string }) {
  const cls = "w-3.5 h-3.5 shrink-0";
  if (group === "Formulas")   return <FlaskConical className={cls} />;
  if (group === "Constants")  return <BookOpen className={cls} />;
  if (group === "Calculators") return <Calculator className={cls} />;
  if (group === "Glossary")   return <BookA className={cls} />;
  if (group === "Problems")   return <FileQuestion className={cls} />;
  return <LayoutGrid className={cls} />;
}

/* ─── SmartSearch component ─────────────────────────────────────────────────── */

export function SmartSearch() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [apiData, setApiData] = useState<ApiResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [cursor,  setCursor]  = useState(0);
  const [limboDiscovered, setLimboDiscovered] = useState(hasDiscoveredLimbo);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, navigate] = useLocation();

  /* open/close */
  const openSearch  = useCallback(() => { setOpen(true);  setQuery(""); setApiData(null); setCursor(0); }, []);
  const closeSearch = useCallback(() => { setOpen(false); setQuery(""); }, []);

  /* Cmd+K / Ctrl+K + custom event from sidebar */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); open ? closeSearch() : openSearch(); }
      if (e.key === "Escape" && open) closeSearch();
    };
    const onEvent = () => openSearch();
    window.addEventListener("keydown", onKey);
    window.addEventListener("xqution:open-search", onEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("xqution:open-search", onEvent);
    };
  }, [open, openSearch, closeSearch]);

  useEffect(() => {
    const onDiscovered = () => setLimboDiscovered(true);
    window.addEventListener("xqution:limbo-discovered", onDiscovered);
    return () => window.removeEventListener("xqution:limbo-discovered", onDiscovered);
  }, []);

  /* focus input when opened */
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  /* debounced API search */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 2) { setApiData(null); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await fetchSearch(query.trim());
        setApiData(data);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }, 280);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  /* build result list */
  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim();

    // Local fuzzy matches
    const visibleEntries = limboDiscovered ? [...LOCAL_ENTRIES, LIMBO_ENTRY] : LOCAL_ENTRIES;
    const local: ResultItem[] = visibleEntries
      .map(e => ({ e, s: score(q, e) }))
      .filter(x => q.length < 2 ? x.e.kind === "page" : x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 6)
      .map(({ e }) => ({
        id: e.id,
        label: e.label,
        description: e.description,
        href: e.href,
        group: e.kind === "calculator" ? "Calculators" : "Pages",
      }));

    if (!apiData) return local;

    const formulas: ResultItem[] = apiData.formulas.slice(0, 5).map(f => ({
      id: `f-${f.id}`,
      label: f.name,
      description: f.description || f.category,
      href: `/formulas/${f.id}`,
      group: "Formulas",
    }));

    const constants: ResultItem[] = apiData.constants.slice(0, 3).map(c => ({
      id: `c-${c.id}`,
      label: `${c.name} (${c.symbol})`,
      description: c.description,
      href: "/constants",
      group: "Constants",
    }));

    const glossary: ResultItem[] = apiData.glossary.slice(0, 3).map(g => ({
      id: `g-${g.id}`,
      label: g.term,
      description: g.definition.slice(0, 90) + (g.definition.length > 90 ? "…" : ""),
      href: "/glossary",
      group: "Glossary",
    }));

    const problems: ResultItem[] = apiData.problems.slice(0, 2).map(p => ({
      id: `p-${p.id}`,
      label: p.topic,
      description: p.question.slice(0, 80) + (p.question.length > 80 ? "…" : ""),
      href: "/problems",
      group: "Problems",
    }));

    // Merge: deduplicate local Calculators/Pages with API results
    const all = [...formulas, ...local, ...constants, ...glossary, ...problems];
    const seen = new Set<string>();
    return all.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  }, [query, apiData, limboDiscovered]);

  /* group results */
  const groups = useMemo(() => {
    const map = new Map<string, ResultItem[]>();
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    }
    return map;
  }, [results]);

  /* flat list for keyboard nav */
  const flat = useMemo(() => results, [results]);

  /* reset cursor when results change */
  useEffect(() => { setCursor(0); }, [flat.length]);

  /* keyboard nav */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && flat[cursor]) { navigateTo(flat[cursor].href); }
  };

  /* scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const navigateTo = (href: string) => {
    closeSearch();
    if (href === LIMBO_SEARCH_HREF) {
      window.dispatchEvent(new Event(LIMBO_TRIGGER_EVENT));
      return;
    }
    navigate(href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center pt-[12vh]"
      style={{ background: "rgba(2,11,36,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) closeSearch(); }}
    >
      <div
        className="w-full max-w-xl mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 0 1px rgba(0,217,255,0.08), 0 24px 48px rgba(0,0,0,0.6)" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search formulas, calculators, constants…"
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
          />
          {loading && <div className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin shrink-0" />}
          <button onClick={closeSearch} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {flat.length === 0 && query.trim().length >= 2 && !loading && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results for "{query}"</p>
          )}

          {flat.length === 0 && query.trim().length < 2 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Start typing to search…</p>
          )}

          {(() => {
            let globalIdx = 0;
            return Array.from(groups.entries()).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 pt-3 pb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  <GroupIcon group={group} />
                  {group}
                </div>
                {items.map(item => {
                  const idx = globalIdx++;
                  const active = idx === cursor;
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onClick={() => navigateTo(item.href)}
                      onMouseEnter={() => setCursor(idx)}
                      className={`w-full flex flex-col items-start px-4 py-2.5 text-left transition-colors ${active ? "bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent hover:bg-muted/50"}`}
                    >
                      <span className="text-sm font-medium text-foreground leading-snug">
                        <Highlight text={item.label} query={query} />
                      </span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-1">
                          <Highlight text={item.description} query={query} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ));
          })()}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[11px] text-muted-foreground/60">
          <span><kbd className="font-mono bg-muted border border-border rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono bg-muted border border-border rounded px-1">↵</kbd> select</span>
          <span><kbd className="font-mono bg-muted border border-border rounded px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
