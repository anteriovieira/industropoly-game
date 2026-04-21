## MODIFIED Requirements

### Requirement: Story panel renders below tokens and dice
The newspaper panel SHALL render at the geometric center of the board as a **3-column framed front page** with a masthead, an italic edition line, a horizontal masthead rule, a full-width lead headline (title + ~140-char snippet), and 5 secondary items distributed across 3 columns underneath separated by thin column rules. A thin border frame (4 dark mesh planes) MUST surround the page. Typography SHALL use legible serif at full ink opacity, with clearly distinct sizes for masthead / edition / lead title / lead snippet / secondary title / secondary snippet. The previous faded-italic single-block treatment MUST NOT be used.

#### Scenario: 3-column layout with frame
- **WHEN** the panel renders for any non-null `currentNewspaper` whose `headlineIds` has length ≥ 6
- **THEN** the scene contains a masthead text, an edition line, a horizontal masthead rule mesh, a lead text block spanning the page width, 5 secondary text blocks in a 3-column grid below the lead, vertical column-separator meshes between columns, and 4 thin border meshes outlining the page

#### Scenario: Distinct typography
- **WHEN** the panel renders
- **THEN** the masthead font size is the largest, the lead title is larger than secondary titles, secondary snippets are the smallest text, and the edition line is rendered in italic

#### Scenario: Token over panel
- **WHEN** a token's tile happens to overlap the panel's bounds
- **THEN** the token mesh is rendered visibly on top of the text and frame meshes

#### Scenario: Dice tumble across panel
- **WHEN** the dice are mid-tumble above the central area
- **THEN** the dice are rendered above the text without z-fighting artifacts

### Requirement: Panel ignores pointer events
Every text element of the newspaper panel MUST set `raycast={() => null}` (or equivalent). Frame and column-separator meshes MUST NOT register pointer handlers. Clicks and touches in the panel area MUST pass through to whatever 3D object sits behind it.

#### Scenario: Click-through
- **WHEN** the player clicks anywhere on the central area where the newspaper text or frame is rendered
- **THEN** no newspaper-related interaction fires; the click reaches the underlying 3D layer
