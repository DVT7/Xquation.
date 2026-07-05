import { FORMULA_RELATED } from "./formula-related";
import type { FormulaRelated } from "./formula-related";

/* ─── types ─────────────────────────────────────────────────────────────── */

interface FormulaItem {
  id: number;
  name: string;
  category: string;
  subcategory: string | null;
  relatedFormulas: string | null;
  description: string | null;
  latex: string | null;
}

interface ConstantItem {
  id: number;
  name: string;
  symbol: string;
  value: string;
  units: string | null;
  category: string | null;
}

export interface MatchedFormula {
  formula: FormulaItem;
  score: number;
  reasons: string[];
  isAutoMatched: boolean;
}

export interface MatchedConstant {
  constant: ConstantItem;
  score: number;
  reasons: string[];
  isAutoMatched: boolean;
}

export interface MatchedTopic {
  topic: string;
  score: number;
  reasons: string[];
  isAutoMatched: boolean;
}

/* ─── helpers ───────────────────────────────────────────────────────────── */

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "and", "in", "on", "at", "by", "for", "with", "from",
  "as", "or", "it", "its", "this", "that", "these", "those",
  "formula", "equations", "equation", "calculate", "calculated",
]);

function extractKeywords(text: string | null): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function jaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = a.filter(x => setB.has(x));
  return inter.length / (setA.size + setB.size - inter.length || 1);
}

function overlapScore(a: string[], b: string[]): number {
  const setB = new Set(b);
  return a.filter(x => setB.has(x)).length;
}

/* ─── formula matchmaking ─────────────────────────────────────────────── */

export function matchRelatedFormulas(
  id: number,
  allFormulas: FormulaItem[],
  limit = 6
): MatchedFormula[] {
  const current = allFormulas.find(f => f.id === id);
  if (!current) return [];

  const currentRelated = FORMULA_RELATED[id];
  const currentTopics = new Set(currentRelated?.topics ?? []);
  const currentConstants = new Set(currentRelated?.constantIds ?? []);
  const currentDerivationNames = new Set(currentRelated?.derivationFormulaNames ?? []);
  const currentRelatedNames = new Set(
    (current.relatedFormulas ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
  );
  const currentKeywords = extractKeywords(current.name + " " + (current.description ?? ""));

  const scored: MatchedFormula[] = [];

  for (const f of allFormulas) {
    if (f.id === id) continue;

    const reasons: string[] = [];
    let score = 0;

    // Category / subcategory
    if (f.category === current.category) {
      score += 10;
      reasons.push("Same category");
    }
    if (f.subcategory && f.subcategory === current.subcategory) {
      score += 15;
      reasons.push("Same subcategory");
    }

    // Shared topics
    const fRelated = FORMULA_RELATED[f.id];
    const fTopics = new Set(fRelated?.topics ?? []);
    const sharedTopics = [...currentTopics].filter(t => fTopics.has(t));
    if (sharedTopics.length) {
      score += sharedTopics.length * 8;
      reasons.push(`Shared topics: ${sharedTopics.join(", ")}`);
    }

    // Shared constants
    const fConstants = new Set(fRelated?.constantIds ?? []);
    const sharedConstants = [...currentConstants].filter(c => fConstants.has(c));
    if (sharedConstants.length) {
      score += sharedConstants.length * 6;
      reasons.push(`Shared constants`);
    }

    // Shared related formula names
    const fRelatedNames = new Set(
      (f.relatedFormulas ?? "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
    );
    const sharedRelated = [...currentRelatedNames].filter(n => fRelatedNames.has(n));
    if (sharedRelated.length) {
      score += sharedRelated.length * 5;
      reasons.push("Cross-referenced");
    }

    // Shared derivation formula names
    const fDerivationNames = new Set(fRelated?.derivationFormulaNames ?? []);
    const sharedDerivation = [...currentDerivationNames].filter(n => fDerivationNames.has(n));
    if (sharedDerivation.length) {
      score += sharedDerivation.length * 5;
      reasons.push("Shared derivation steps");
    }

    // Keyword overlap
    const fKeywords = extractKeywords(f.name + " " + (f.description ?? ""));
    const kwOverlap = overlapScore(currentKeywords, fKeywords);
    if (kwOverlap) {
      score += kwOverlap * 2;
      if (kwOverlap >= 2) reasons.push("Keyword overlap");
    }

    // Name contains current topic words
    const fNameWords = new Set(f.name.toLowerCase().split(/\s+/));
    const nameTopicMatch = [...currentTopics].filter(t => fNameWords.has(t.toLowerCase()));
    if (nameTopicMatch.length) {
      score += nameTopicMatch.length * 4;
      reasons.push("Topic in name");
    }

    if (score > 0) {
      scored.push({
        formula: f,
        score,
        reasons: reasons.slice(0, 3),
        isAutoMatched: true,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/* ─── constant matchmaking ──────────────────────────────────────────────── */

export function matchRelatedConstants(
  id: number,
  allFormulas: FormulaItem[],
  allConstants: ConstantItem[],
  limit = 6
): MatchedConstant[] {
  const currentRelated = FORMULA_RELATED[id];
  const current = allFormulas.find(f => f.id === id);
  if (!current) return [];

  const currentTopics = new Set(currentRelated?.topics ?? []);
  const scored: MatchedConstant[] = [];

  for (const c of allConstants) {
    const reasons: string[] = [];
    let score = 0;

    // Direct reference in this formula
    if (currentRelated?.constantIds.includes(c.id)) {
      score += 25;
      reasons.push("Used in this formula");
    }

    // Reference in related formulas
    let relatedRefCount = 0;
    for (const f of allFormulas) {
      if (f.id === id) continue;
      const fr = FORMULA_RELATED[f.id];
      if (fr?.constantIds.includes(c.id)) {
        relatedRefCount++;
        // Bonus if that formula shares topics with current
        const fTopics = new Set(fr?.topics ?? []);
        const shared = [...currentTopics].filter(t => fTopics.has(t));
        if (shared.length) {
          score += 4;
        } else {
          score += 1;
        }
      }
    }
    if (relatedRefCount) {
      reasons.push(`Referenced in ${relatedRefCount} related formula${relatedRefCount > 1 ? "s" : ""}`);
    }

    // Symbol appears in current formula LaTeX
    if (current.latex && c.symbol && current.latex.includes(c.symbol)) {
      score += 8;
      reasons.push("Appears in equation");
    }

    // Topic overlap via constant name keywords
    const cKeywords = extractKeywords(c.name);
    const topicOverlap = [...currentTopics].filter(t =>
      cKeywords.some(kw => t.toLowerCase().includes(kw) || kw.includes(t.toLowerCase()))
    );
    if (topicOverlap.length) {
      score += topicOverlap.length * 3;
      reasons.push("Topic overlap");
    }

    if (score > 0) {
      scored.push({
        constant: c,
        score,
        reasons: reasons.slice(0, 3),
        isAutoMatched: true,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

/* ─── topic matchmaking ─────────────────────────────────────────────────── */

export function matchRelatedTopics(
  id: number,
  allFormulas: FormulaItem[],
  limit = 8
): MatchedTopic[] {
  const currentRelated = FORMULA_RELATED[id];
  const current = allFormulas.find(f => f.id === id);
  if (!current) return [];

  const currentTopics = currentRelated?.topics ?? [];
  if (!currentTopics.length) return [];

  // Count co-occurrence of topics across all formulas
  const topicCoOccurrence: Record<string, number> = {};
  const topicFormulas: Record<string, number> = {};

  for (const f of allFormulas) {
    const fr = FORMULA_RELATED[f.id];
    const topics = fr?.topics ?? [];
    for (const t of topics) {
      topicFormulas[t] = (topicFormulas[t] ?? 0) + 1;
    }
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const pair = [topics[i], topics[j]].sort().join("|");
        topicCoOccurrence[pair] = (topicCoOccurrence[pair] ?? 0) + 1;
      }
    }
  }

  const candidateScores: Record<string, { score: number; reasons: string[] }> = {};

  for (const topic of currentTopics) {
    // Topics that co-occur with this topic across the dataset
    for (const [pair, count] of Object.entries(topicCoOccurrence)) {
      const [a, b] = pair.split("|");
      if (a === topic || b === topic) {
        const other = a === topic ? b : a;
        if (currentTopics.includes(other)) continue; // skip already-known
        const entry = candidateScores[other] ?? { score: 0, reasons: [] };
        entry.score += count * 3;
        if (!entry.reasons.includes(`Often paired with ${topic}`)) {
          entry.reasons.push(`Often paired with ${topic}`);
        }
        candidateScores[other] = entry;
      }
    }
  }

  // Also pick topics from closely-related formulas
  const matchedFormulas = matchRelatedFormulas(id, allFormulas, 6);
  for (const mf of matchedFormulas) {
    const fr = FORMULA_RELATED[mf.formula.id];
    for (const t of fr?.topics ?? []) {
      if (currentTopics.includes(t)) continue;
      const entry = candidateScores[t] ?? { score: 0, reasons: [] };
      entry.score += Math.max(1, Math.floor(mf.score / 8));
      if (!entry.reasons.includes("Related formula topic")) {
        entry.reasons.push("Related formula topic");
      }
      candidateScores[t] = entry;
    }
  }

  const scored: MatchedTopic[] = Object.entries(candidateScores)
    .map(([topic, { score, reasons }]) => ({
      topic,
      score,
      reasons: reasons.slice(0, 2),
      isAutoMatched: true,
    }))
    .filter(m => m.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
