import { gameState } from './GameState.js';

// Control hints shown during dialogue until the player has used each control a few times.
// Counts live in GameState (gameState.uses), so they reset with a full restart.
export const ADVANCE_HINT = 'SPACE';
export const CHOICE_HINT = 'W/S: choose \u00b7 SPACE: confirm';
const ADVANCE_HINT_USES = 5;
const CHOICE_HINT_USES = 2;

export const showAdvanceHint = () => gameState.getUses('advance') < ADVANCE_HINT_USES;
export const showChoiceHint = () => gameState.getUses('choose') < CHOICE_HINT_USES;
export const countAdvance = () => gameState.countUse('advance');
export const countChoice = () => gameState.countUse('choose');
