// Validate tile + card educational payloads.
// Run: npm run lint:content

import { TILES } from '../src/content/tiles';
import { INVENTION_CARDS } from '../src/content/invention-cards';
import { EDICT_CARDS } from '../src/content/edict-cards';
import type { EducationalPayload } from '../src/engine/types';

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

  if (findings.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`Content OK: ${TILES.length} tiles, ${INVENTION_CARDS.length + EDICT_CARDS.length} cards.`);
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
