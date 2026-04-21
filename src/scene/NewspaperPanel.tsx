import { Text } from '@react-three/drei';
import { BOARD, colors } from '@/ui/theme';
import { useGameStore } from '@/state/gameStore';
import { getStoryById } from '@/content/stories';

const MASTHEAD = 'O Cronista Industrial';
const LEAD_SNIPPET_CHARS = 240;
const SECONDARY_SNIPPET_CHARS = 380;

// Newspaper-style panel at the geometric center of the board. 6 headlines per
// issue laid out as a framed front page: masthead with rule, edition line,
// full-width lead, and a 3-column grid of 5 secondary items underneath.
export function NewspaperPanel({ innerSize }: { innerSize: number }) {
  const newspaper = useGameStore((s) => s.state?.currentNewspaper ?? null);
  if (!newspaper || newspaper.headlineIds.length === 0) return null;

  const stories = newspaper.headlineIds.map((id) => getStoryById(id));
  const lead = stories[0];
  const secondary = stories.slice(1, 6); // up to 5

  // Page geometry (board-local). The board's parchment plane is `innerSize`
  // wide; we inset slightly so the frame sits a touch inboard. Page is taller
  // than before to accommodate denser snippets in each item.
  const y = BOARD.tileDepth / 2 + 0.025;
  const pageW = innerSize - 4;
  const pageH = 11.0;
  const pageHalfH = pageH / 2;

  // Vertical layout, in panel-local coords (origin at center of page).
  // Title→snippet gaps trimmed to ~0.4 so the body sits right below the title.
  const yMasthead = pageHalfH - 0.65;
  const yMastheadRule = pageHalfH - 1.15;
  const yEdition = pageHalfH - 1.55;
  const yLeadDivider = pageHalfH - 2.05;
  const yLeadTitle = pageHalfH - 2.6;
  const yLeadSnippet = pageHalfH - 3.0;
  const ySecondaryDivider = pageHalfH - 4.85;

  // Secondary grid: 3 columns, up to 2 rows. Items 0-2 in row 0, items 3-4 in row 1.
  const colW = pageW / 3;
  // Column LEFT edges (we left-align the inner text).
  const colLefts = [-pageW / 2, -pageW / 6, pageW / 6].map((x) => x + 0.2);
  // Inner column width with a small right gutter.
  const colInnerW = colW - 0.4;
  const ySecondaryRow0Title = pageHalfH - 5.3;
  const ySecondaryRow0Snippet = pageHalfH - 5.7;
  const ySecondaryRow1Title = pageHalfH - 8.6;
  const ySecondaryRow1Snippet = pageHalfH - 9.0;

  return (
    <group position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Border frame: 4 thin dark planes (top, bottom, left, right). */}
      <Frame width={pageW} height={pageH} />

      {/* Masthead */}
      <Text
        position={[0, yMasthead, 0]}
        fontSize={0.7}
        color={colors.ink}
        anchorX="center"
        anchorY="middle"
        maxWidth={pageW - 0.6}
        outlineWidth={0.012}
        outlineColor={colors.parchmentLight}
        raycast={() => null}
      >
        {MASTHEAD}
      </Text>
      {/* Masthead rule (horizontal) */}
      <mesh position={[0, yMastheadRule, 0]}>
        <planeGeometry args={[pageW - 0.6, 0.03]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={0.4} />
      </mesh>
      {/* Edition line */}
      <Text
        position={[0, yEdition, 0]}
        fontSize={0.28}
        color={colors.inkSoft}
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
        maxWidth={pageW - 0.6}
        fillOpacity={0.85}
        raycast={() => null}
      >
        {`Edição ${newspaper.issueNumber}`}
      </Text>

      {/* Divider above the lead */}
      <mesh position={[0, yLeadDivider, 0]}>
        <planeGeometry args={[pageW - 0.6, 0.02]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={0.3} />
      </mesh>

      {/* Lead headline (full-width). Title is centered for emphasis; body left-aligned for readability. */}
      {lead && (
        <>
          <Text
            position={[0, yLeadTitle, 0]}
            fontSize={0.36}
            color={colors.ink}
            anchorX="center"
            anchorY="middle"
            maxWidth={pageW - 0.6}
            outlineWidth={0.008}
            outlineColor={colors.parchmentLight}
            raycast={() => null}
          >
            {lead.title}
          </Text>
          <Text
            position={[-pageW / 2 + 0.4, yLeadSnippet, 0]}
            fontSize={0.22}
            color={colors.inkSoft}
            anchorX="left"
            anchorY="top"
            textAlign="left"
            maxWidth={pageW - 0.8}
            lineHeight={1.35}
            raycast={() => null}
          >
            {trim(lead.body, LEAD_SNIPPET_CHARS)}
          </Text>
        </>
      )}

      {/* Divider above the secondary grid */}
      <mesh position={[0, ySecondaryDivider, 0]}>
        <planeGeometry args={[pageW - 0.6, 0.02]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={0.3} />
      </mesh>

      {/* Vertical column rules in the secondary grid */}
      {[-colW / 2, colW / 2].map((x, i) => (
        <mesh
          key={i}
          position={[x, (ySecondaryRow0Title + ySecondaryRow1Snippet) / 2, 0]}
        >
          <planeGeometry args={[0.02, ySecondaryDivider - ySecondaryRow1Snippet - 0.4]} />
          <meshBasicMaterial color={colors.ink} transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Secondary row 0: items 0..2 of secondary array */}
      {[0, 1, 2].map((i) => {
        const story = secondary[i];
        if (!story) return null;
        return (
          <SecondaryItem
            key={`r0-${i}`}
            xLeft={colLefts[i]!}
            yTitle={ySecondaryRow0Title}
            ySnippet={ySecondaryRow0Snippet}
            colWidth={colInnerW}
            title={story.title}
            snippet={trim(story.body, SECONDARY_SNIPPET_CHARS)}
          />
        );
      })}

      {/* Secondary row 1: items 3..4 of secondary array */}
      {[0, 1].map((col) => {
        const story = secondary[3 + col];
        if (!story) return null;
        return (
          <SecondaryItem
            key={`r1-${col}`}
            xLeft={colLefts[col]!}
            yTitle={ySecondaryRow1Title}
            ySnippet={ySecondaryRow1Snippet}
            colWidth={colInnerW}
            title={story.title}
            snippet={trim(story.body, SECONDARY_SNIPPET_CHARS)}
          />
        );
      })}
    </group>
  );
}

function SecondaryItem({
  xLeft,
  yTitle,
  ySnippet,
  colWidth,
  title,
  snippet,
}: {
  xLeft: number;
  yTitle: number;
  ySnippet: number;
  colWidth: number;
  title: string;
  snippet: string;
}) {
  return (
    <>
      <Text
        position={[xLeft, yTitle, 0]}
        fontSize={0.22}
        color={colors.ink}
        anchorX="left"
        anchorY="middle"
        maxWidth={colWidth}
        raycast={() => null}
      >
        {title}
      </Text>
      <Text
        position={[xLeft, ySnippet, 0]}
        fontSize={0.16}
        color={colors.inkSoft}
        anchorX="left"
        anchorY="top"
        textAlign="left"
        maxWidth={colWidth}
        lineHeight={1.3}
        raycast={() => null}
      >
        {snippet}
      </Text>
    </>
  );
}

function Frame({ width, height }: { width: number; height: number }) {
  const t = 0.04; // border thickness
  const halfW = width / 2;
  const halfH = height / 2;
  const opacity = 0.35;
  return (
    <group>
      {/* top */}
      <mesh position={[0, halfH, 0]}>
        <planeGeometry args={[width, t]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={opacity} />
      </mesh>
      {/* bottom */}
      <mesh position={[0, -halfH, 0]}>
        <planeGeometry args={[width, t]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={opacity} />
      </mesh>
      {/* left */}
      <mesh position={[-halfW, 0, 0]}>
        <planeGeometry args={[t, height]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={opacity} />
      </mesh>
      {/* right */}
      <mesh position={[halfW, 0, 0]}>
        <planeGeometry args={[t, height]} />
        <meshBasicMaterial color={colors.ink} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function trim(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max - 20 ? lastSpace : max;
  return text.slice(0, cut).trimEnd() + '…';
}
