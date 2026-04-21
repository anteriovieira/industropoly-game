## MODIFIED Requirements

### Requirement: Story panel renders below tokens and dice
The new newspaper panel SHALL render at the geometric center of the board, lying flat on the parchment surface using legible serif typography at full ink opacity (`colors.ink` for masthead/headlines, `colors.inkSoft` for body snippets and date line). It MUST NOT use the previous faded-italic treatment. Its draw order MUST keep it visually behind tokens and the dice meshes — overlap MUST show the token/dice on top of the text, not vice versa.

#### Scenario: Newspaper rendered with legible typography
- **WHEN** the panel is rendered for any non-null `currentNewspaper`
- **THEN** the masthead is drawn with full opacity in a serif display font, the date line shows `Edição <issueNumber>`, and 3 headlines are drawn in clear serif at full opacity (no italic + low-opacity treatment)

#### Scenario: Token over panel
- **WHEN** a token's tile happens to overlap the panel's bounds
- **THEN** the token mesh is rendered visibly on top of the text

#### Scenario: Dice tumble across panel
- **WHEN** the dice are mid-tumble above the central area
- **THEN** the dice are rendered above the text without z-fighting artifacts

### Requirement: Panel ignores pointer events
Every text element of the newspaper panel MUST set `raycast={() => null}` (or equivalent) so it never captures pointer or touch events. Clicks and touches in its area MUST pass through to whatever 3D object sits behind it.

#### Scenario: Click-through
- **WHEN** the player clicks on the central area where the newspaper text is rendered
- **THEN** no newspaper-related interaction fires; the click reaches the underlying 3D layer (e.g., board background) as it does today
