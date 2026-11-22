// Emberfall — the duel itself. One job: the rules and the state machine.
// No DOM here: the engine takes a seed, holds both fighters, and answers
// every move with events the renderer can animate. Pure logic, so the
// screenshot scenes can run a whole duel synchronously.

import {
  START_LIFE, START_MANA, MAX_MANA, OPENING_HAND, DRAW_PER_TURN,
  MAX_HAND, RESONANCE_BONUS,
} from './config.js';
import { createRandom } from './random.js';
import { buildDeck, defOf } from './deck.js';
import { choosePlays, readIntent } from './ai.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAYER = 'player';
export const PHASE_AI = 'ai';
export const PHASE_OVER = 'over';

function makeFighter(rng, deck) {
  return {
    life: START_LIFE,
    shield: 0,
    mana: START_MANA,
    maxMana: START_MANA,
    deck,
    hand: [],
    discard: [],
  };
}

function drawCards(fighter, count, log) {
  for (let n = 0; n < count; n += 1) {
    if (fighter.hand.length >= MAX_HAND) return;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.deck = fighter.discard;
      fighter.discard = [];
      // Reshuffle is deterministic: the deck order is the discard order.
      fighter.deck.reverse();
      log.push('The deck runs out — the discard pile is shuffled back in.');
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

export function createGame(seed) {
  const rng = createRandom(seed);
  const game = {
    seed,
    rng,
    phase: PHASE_TITLE,
    round: 1,
    you: makeFighter(rng, buildDeck(rng)),
    foe: makeFighter(rng, buildDeck(rng)),
    windsPlayed: {}, // wind -> count this turn (Resonance)
    played: [], // cards on the arena this turn, newest first
    log: ['The duel begins. Sable shuffles her deck.'],
    winner: null, // 'you' | 'foe'
    score: 0,
    damageDealt: 0,
    cardsPlayed: 0,
    intent: { label: '—', kind: 'balanced' },
  };
  return game;
}

function shieldedHit(fighter, amount) {
  const absorbed = Math.min(fighter.shield, amount);
  fighter.shield -= absorbed;
  fighter.life -= amount - absorbed;
  return { absorbed, dealt: amount - absorbed };
}

/**
 * Resolve one card. Returns an event describing what happened, for the
 * renderer and the log. Resonance: the second (and later) card of a wind
 * in one turn gains +2 damage and +2 shield.
 */
export function playCard(game, side, handIndex) {
  const me = side === 'you' ? game.you : game.foe;
  const foe = side === 'you' ? game.foe : game.you;
  const card = me.hand[handIndex];
  if (!card) return { ok: false, reason: 'no such card' };
  const def = defOf(card);
  if (def.cost > me.mana) return { ok: false, reason: 'not enough mana' };

  const prior = game.windsPlayed[def.wind] ?? 0;
  const resonance = prior >= 1;
  const dmg = def.dmg + (resonance ? RESONANCE_BONUS : 0);
  const shield = def.shield + (resonance ? RESONANCE_BONUS : 0);

  me.mana -= def.cost;
  me.hand.splice(handIndex, 1);
  me.discard.push(card);
  game.windsPlayed[def.wind] = prior + 1;
  game.cardsPlayed += 1;

  let hit = null;
  if (dmg > 0) {
    hit = shieldedHit(foe, dmg);
    if (side === 'you') {
      game.damageDealt += hit.dealt;
      game.score += hit.dealt;
    }
  }
  if (shield > 0) me.shield += shield;
  if (def.heal > 0) me.life = Math.min(START_LIFE, me.life + def.heal);
  if (def.draw > 0) drawCards(me, def.draw, game.log);

  const event = {
    ok: true, side, card, def, resonance, dmg, shield, hit,
    heal: def.heal, draw: def.draw,
  };
  game.played.unshift({ card, def, side, resonance });
  if (game.played.length > 4) game.played.pop();
  logPlay(game, event);
  if (foe.life <= 0) {
    game.phase = PHASE_OVER;
    game.winner = side;
    if (side === 'you') game.score += 25; // winning flourish bonus
    game.log.push(side === 'you'
      ? 'Sable falls — the Ember Warden wins the duel!'
      : 'Your life falls to zero — Sable wins the duel.');
  }
  return event;
}

function logPlay(game, event) {
  const who = event.side === 'you' ? 'You' : 'Sable';
  const parts = [];
  if (event.dmg > 0) parts.push(`deals ${event.dmg} damage${event.hit.absorbed ? ` (${event.hit.absorbed} soaked by shield)` : ''}`);
  if (event.shield > 0) parts.push(`gains ${event.shield} shield`);
  if (event.heal > 0) parts.push(`restores ${event.heal} life`);
  if (event.draw > 0) parts.push(`draws ${event.draw}`);
  game.log.push(`${who} play${event.side === 'you' ? '' : 's'} ${event.def.name}${event.resonance ? ' — RESONANCE +2!' : ''} — ${parts.join(', ') || 'a quiet card'}.`);
  if (game.log.length > 40) game.log.splice(0, game.log.length - 40);
}

/** Start the duel: deal opening hands, open the player's first turn. */
export function startDuel(game) {
  drawCards(game.you, OPENING_HAND, game.log);
  drawCards(game.foe, OPENING_HAND, game.log);
  game.phase = PHASE_PLAYER;
  game.intent = readIntent(game.foe, game.you);
  game.log.push('Your turn — play cards, then end the turn.');
  return game;
}

/** Begin a player's turn: mana grows, two cards are drawn, intent is read. */
export function beginPlayerTurn(game) {
  game.round += 1;
  game.windsPlayed = {};
  const you = game.you;
  you.maxMana = Math.min(MAX_MANA, you.maxMana + 1);
  you.mana = you.maxMana;
  drawCards(you, DRAW_PER_TURN, game.log);
  game.phase = PHASE_PLAYER;
  game.intent = readIntent(game.foe, game.you);
  game.log.push(`Round ${game.round} — your turn. Mana refills to ${you.mana}; you draw ${DRAW_PER_TURN}.`);
}

/** Sable's turn, run synchronously: mana grows, she draws, then plays greedily. */
export function runAiTurn(game) {
  game.phase = PHASE_AI;
  game.windsPlayed = {};
  const foe = game.foe;
  foe.maxMana = Math.min(MAX_MANA, foe.maxMana + 1);
  foe.mana = foe.maxMana;
  drawCards(foe, DRAW_PER_TURN, game.log);
  game.log.push(`Sable's turn — mana ${foe.mana}, she draws ${DRAW_PER_TURN}.`);
  const plan = choosePlays(foe, game.you);
  const events = [];
  for (const uid of plan) {
    const pos = foe.hand.findIndex((c) => c.uid === uid);
    if (pos === -1) continue;
    const event = playCard(game, 'foe', pos);
    if (event.ok) events.push(event);
    if (game.phase === PHASE_OVER) break;
  }
  if (game.phase !== PHASE_OVER) {
    game.log.push('Sable ends her turn.');
    beginPlayerTurn(game);
  }
  return events;
}
