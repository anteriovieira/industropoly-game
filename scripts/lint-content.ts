// Validate tile + card educational payloads.
// Run: npm run lint:content

import { TILES } from '../src/content/tiles';
import { INVENTION_CARDS } from '../src/content/invention-cards';
import { EDICT_CARDS } from '../src/content/edict-cards';
import { QUESTIONS } from '../src/content/questions';
import type { EducationalPayload, Question, Tile } from '../src/engine/types';

const MIN_WORDS = 40;
const MAX_WORDS = 120;

// Technologies/concepts that would be strongly anachronistic to the pre-1850 industrial period.
// Keep substrings specific — the blurbs are Portuguese, so avoid tokens that collide with
// common Portuguese words (e.g. "ai" collides with "pai", "vai").
const BANNED_ANACHRONISMS = [
  'internet',
  'smartphone',
  'artificial intelligence',
  'inteligência artificial',
  'aircraft',
  'television',
  'televisão',
  'radio transmission',
  'transmissão de rádio',
  'nuclear',
  'electricity grid',
  'rede elétrica',
];

interface Finding {
  where: string;
  message: string;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

function tileNeedsQuestion(t: Tile): boolean {
  return t.role !== 'corner';
}

function validateQuestion(q: Question, where: string): Finding[] {
  const findings: Finding[] = [];
  if (!q.id) findings.push({ where, message: 'question id missing' });
  if (!q.prompt || q.prompt.trim().length < 5) {
    findings.push({ where, message: 'question prompt missing or too short' });
  }
  if (wordCount(q.prompt ?? '') > 25) {
    findings.push({ where, message: `prompt exceeds 25 words (${wordCount(q.prompt)})` });
  }
  if (!q.options || q.options.length < 2 || q.options.length > 4) {
    findings.push({ where, message: `options must be 2..4, got ${q.options?.length ?? 0}` });
    return findings;
  }
  const ids = new Set<string>();
  for (const opt of q.options) {
    if (!opt.id) findings.push({ where, message: 'option id missing' });
    if (ids.has(opt.id)) findings.push({ where, message: `duplicate option id "${opt.id}"` });
    ids.add(opt.id);
    if (!opt.text || opt.text.trim().length === 0) {
      findings.push({ where, message: `option "${opt.id}" has empty text` });
    }
  }
  if (!ids.has(q.correctOptionId)) {
    findings.push({ where, message: `correctOptionId "${q.correctOptionId}" is not among options` });
  }
  if (!q.source || q.source.length < 5) {
    findings.push({ where, message: 'question source missing or too short' });
  }
  for (const h of q.hints ?? []) {
    if (h.priceCash < 0) findings.push({ where, message: `hint ${h.id} has negative price` });
    if (h.kind === 'eliminate-option') {
      if (!h.payload) findings.push({ where, message: `hint ${h.id} missing target option id` });
      else if (h.payload === q.correctOptionId) {
        findings.push({ where, message: `hint ${h.id} cannot eliminate the correct option` });
      } else if (!ids.has(h.payload)) {
        findings.push({ where, message: `hint ${h.id} references unknown option "${h.payload}"` });
      }
    }
  }
  return findings;
}

function validate(payload: EducationalPayload, where: string): Finding[] {
  const findings: Finding[] = [];
  if (!payload.title || payload.title.length < 3) {
    findings.push({ where, message: 'title missing or too short' });
  }
  if (!payload.date || payload.date.length < 2) {
    findings.push({ where, message: 'date missing' });
  }
  const wc = wordCount(payload.blurb);
  if (wc < MIN_WORDS || wc > MAX_WORDS) {
    findings.push({ where, message: `blurb word count ${wc} out of [${MIN_WORDS}, ${MAX_WORDS}]` });
  }
  if (!payload.source || payload.source.length < 5) {
    findings.push({ where, message: 'source missing or too short' });
  }
  const lower = payload.blurb.toLowerCase();
  for (const bad of BANNED_ANACHRONISMS) {
    if (lower.includes(bad)) {
      findings.push({ where, message: `banned anachronism "${bad.trim()}" in blurb` });
    }
  }
  return findings;
}

function main(): void {
  const findings: Finding[] = [];

  // 40 tiles; each with educational payload.
  if (TILES.length !== 40) {
    findings.push({ where: 'tiles', message: `expected 40 tiles, got ${TILES.length}` });
  }
  for (const t of TILES) {
    findings.push(...validate(t.education, `tile:${t.id}:${t.name}`));
  }

  // Role mix
  const roleCounts: Record<string, number> = {};
  for (const t of TILES) roleCounts[t.role] = (roleCounts[t.role] ?? 0) + 1;
  const expected = { corner: 4, industry: 22, transport: 4, utility: 2, tax: 2, card: 6 };
  for (const [role, count] of Object.entries(expected)) {
    if (roleCounts[role] !== count) {
      findings.push({ where: 'tiles', message: `role ${role}: expected ${count}, got ${roleCounts[role] ?? 0}` });
    }
  }

  // Decks ≥ 16 each, ids unique.
  if (INVENTION_CARDS.length < 16) {
    findings.push({ where: 'invention', message: `≥ 16 required, got ${INVENTION_CARDS.length}` });
  }
  if (EDICT_CARDS.length < 16) {
    findings.push({ where: 'edict', message: `≥ 16 required, got ${EDICT_CARDS.length}` });
  }
  const ids = new Set<string>();
  for (const c of [...INVENTION_CARDS, ...EDICT_CARDS]) {
    if (ids.has(c.id)) findings.push({ where: `card:${c.id}`, message: 'duplicate card id' });
    ids.add(c.id);
    findings.push(...validate(c.education, `card:${c.id}:${c.title}`));
    if (!c.effectText || c.effectText.length < 5) {
      findings.push({ where: `card:${c.id}`, message: 'effectText missing or too short' });
    }
  }

  // Questions: every gameplay-rule tile needs at least one well-formed question.
  let questionCount = 0;
  for (const t of TILES) {
    if (!tileNeedsQuestion(t)) continue;
    const qs = QUESTIONS[t.id] ?? [];
    if (qs.length === 0) {
      findings.push({ where: `questions:tile:${t.id}:${t.name}`, message: 'no question authored for gameplay tile' });
      continue;
    }
    for (const q of qs) {
      questionCount += 1;
      findings.push(...validateQuestion(q, `questions:tile:${t.id}:${q.id}`));
    }
  }

  if (findings.length === 0) {
    // eslint-disable-next-line no-console
    console.log(
      `Content OK: ${TILES.length} tiles, ${INVENTION_CARDS.length + EDICT_CARDS.length} cards, ${questionCount} questions.`,
    );
    return;
  }
  // eslint-disable-next-line no-console
  console.error(`Content lint failed with ${findings.length} finding(s):`);
  for (const f of findings) {
    // eslint-disable-next-line no-console
    console.error(` - [${f.where}] ${f.message}`);
  }
  process.exit(1);
}

main();
