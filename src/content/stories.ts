import { TILES } from './tiles';
import { INVENTION_CARDS } from './invention-cards';
import { EDICT_CARDS } from './edict-cards';

// Stories shown on the board's center "letter" panel. Derived from existing
// tile and card educational blurbs — no separate authoring needed in v1.
//
// Stable ids:
//   - tile-derived: `tile:<tileId>`
//   - card-derived: `card:<cardId>` (card ids are already globally unique)

export interface StoryEntry {
  id: string;
  sourceKind: 'tile' | 'card';
  sourceRefId: string; // 'tile:<n>' or 'card:<cardId>' — same as `id`
  title: string;
  body: string;
  citation: string;
}

function buildStories(): StoryEntry[] {
  const out: StoryEntry[] = [];

  for (const t of TILES) {
    if (t.role === 'corner') continue; // corner tiles have no quiz; story rotation
    // could include them, but their blurbs are scene-setting and we want the
    // exclusion logic (tile:<id>) to match the quiz tile ids cleanly.
    out.push({
      id: `tile:${t.id}`,
      sourceKind: 'tile',
      sourceRefId: `tile:${t.id}`,
      title: t.education.title,
      body: t.education.blurb,
      citation: t.education.source,
    });
  }

  for (const c of [...INVENTION_CARDS, ...EDICT_CARDS]) {
    out.push({
      id: `card:${c.id}`,
      sourceKind: 'card',
      sourceRefId: `card:${c.id}`,
      title: c.education.title,
      body: c.education.blurb,
      citation: c.education.source,
    });
  }

  return out;
}

export const STORIES: readonly StoryEntry[] = buildStories();

const STORY_INDEX: Record<string, StoryEntry> = {};
for (const s of STORIES) STORY_INDEX[s.id] = s;

export function getStoryById(id: string | null | undefined): StoryEntry | undefined {
  if (!id) return undefined;
  return STORY_INDEX[id];
}
