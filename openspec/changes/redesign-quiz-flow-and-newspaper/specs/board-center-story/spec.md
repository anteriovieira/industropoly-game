## MODIFIED Requirements

### Requirement: Headline selection — distinct, no quiz exclusion
Each issue SHALL contain exactly **6** distinct `headlineIds` (changed from 3). The selection MUST draw uniformly from the full `STORIES` corpus, avoiding only the previous issue's `headlineIds` to minimise back-to-back repeats. The selection MUST NOT exclude the current quiz tile, the most recently resolved tile, or any other quiz-related content — ambient overlap with upcoming questions is intentional.

#### Scenario: 6 distinct headlines per issue
- **WHEN** an issue is picked
- **THEN** its `headlineIds` has length 6 and all ids are pairwise distinct

#### Scenario: Previous issue's headlines avoided
- **WHEN** an issue rotates to a new issue
- **THEN** the new `headlineIds` share as few ids as possible with the previous issue — with the 68-entry corpus the new issue MUST NOT repeat any id from the previous issue

#### Scenario: Quiz-related content not excluded
- **WHEN** the active player has a `currentQuiz` open for tile X or has just resolved a landing on tile X
- **THEN** the next issue's `headlineIds` MAY include `tile:X` (the engine does NOT filter it out)
