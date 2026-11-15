// Props every screen gets. Screens read state and call `act`; they hold no game rules.

import type { Ruleset } from '../../content/types.ts';
import type { Action, GameState, RocketChoice } from '../../core/index.ts';
import type { Draft } from '../draft.ts';

export interface ScreenProps {
  s: GameState;
  r: Ruleset;
  act: (action: Action) => void;
  draft: Draft;
  setDraft: (d: Draft) => void;
  lastRocket: RocketChoice | null;
}
