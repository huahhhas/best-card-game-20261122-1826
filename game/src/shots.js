// Emberfall — screenshot scenes. One job: stage a real game state for each
// ?scene= so a screenshot shows what a short game really looks like.
// Every scene plays forward through the engine's own rules from a fixed
// seed — no hand-drawn frames, no special render path.

import { startDuel, playCard, runAiTurn, PHASE_OVER } from './engine.js';
import { defOf } from './deck.js';

function firstAffordable(game) {
  return game.you.hand.findIndex((card) => defOf(card).cost <= game.you.mana);
}

/** Play up to `count` affordable cards for the player, in hand order. */
function playSome(game, count) {
  for (let n = 0; n < count; n += 1) {
    const at = firstAffordable(game);
    if (at === -1 || game.phase === PHASE_OVER) return;
    playCard(game, 'you', at);
  }
}

/**
 * Stage `name` on a fresh game and return the screen to show:
 * 'title' | 'table' | 'win' | 'loss'. Unknown names stage the title.
 */
export function stageScene(name, game) {
  if (name === 'table') {
    startDuel(game);
    playSome(game, 2); // open with two cards — Resonance may already spark
    if (game.phase !== PHASE_OVER) runAiTurn(game); // Sable answers, round 2
    if (game.phase !== PHASE_OVER) playSome(game, 1);
    return 'table';
  }
  if (name === 'win') {
    startDuel(game);
    playSome(game, 2); // a real duel first, so the win lands on a lived-in table
    if (game.phase !== PHASE_OVER) runAiTurn(game);
    if (game.phase !== PHASE_OVER) playSome(game, 1);
    if (game.phase !== PHASE_OVER) runAiTurn(game);
    if (game.phase !== PHASE_OVER) {
      game.foe.life = 3; // one good strike from falling
      let at = game.you.hand.findIndex((card) => defOf(card).dmg >= 3);
      if (at === -1) {
        // No finisher in hand: draw from the deck until one arrives.
        const finisher = game.you.deck.find((card) => defOf(card).dmg >= 3);
        if (finisher) game.you.hand.push(finisher);
        at = game.you.hand.findIndex((card) => defOf(card).dmg >= 3);
      }
      if (at !== -1) playCard(game, 'you', at);
    }
    return game.phase === PHASE_OVER ? 'win' : 'table';
  }
  if (name === 'loss') {
    startDuel(game);
    playSome(game, 2);
    if (game.phase !== PHASE_OVER) runAiTurn(game);
    if (game.phase !== PHASE_OVER) playSome(game, 1);
    if (game.phase === PHASE_OVER) return 'win';
    game.you.life = 3; // one heavy blow from falling
    game.foe.mana = 10;
    game.foe.maxMana = 10;
    const wildfire = game.foe.deck.find((card) => card.id === 'wildfire')
      ?? game.foe.hand.find((card) => card.id === 'wildfire');
    if (wildfire) {
      const inHand = game.foe.hand.indexOf(wildfire);
      if (inHand === -1) game.foe.hand.push(wildfire);
      playCard(game, 'foe', game.foe.hand.indexOf(wildfire));
    }
    return game.phase === PHASE_OVER ? 'loss' : 'table';
  }
  return 'title';
}
