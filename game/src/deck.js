// Emberfall — the cards. One job: what every card is and how a deck is built.
// Each card: id, name, wind (suit), cost, and an effect of damage / shield /
// heal / draw. A deck is two copies of the sixteen designs minus two singles,
// shuffled — the same thirty cards for both duelists, so the duel is fair.

import { DECK_SIZE } from './config.js';
import { shuffle } from './random.js';

/**
 * @typedef {{ id: string, name: string, wind: string, cost: number,
 *   dmg: number, shield: number, heal: number, draw: number, text: string }} CardDef
 */

/** @type {CardDef[]} */
export const CARD_DEFS = [
  { id: 'ember-slash', name: 'Ember Slash', wind: 'ember', cost: 1, dmg: 3, shield: 0, heal: 0, draw: 0, text: 'Deal 3 damage.' },
  { id: 'cinder-burst', name: 'Cinder Burst', wind: 'ember', cost: 2, dmg: 5, shield: 0, heal: 0, draw: 0, text: 'Deal 5 damage.' },
  { id: 'wildfire', name: 'Wildfire', wind: 'ember', cost: 4, dmg: 8, shield: 0, heal: 0, draw: 0, text: 'Deal 8 damage.' },
  { id: 'embermend', name: 'Embermend', wind: 'ember', cost: 2, dmg: 0, shield: 0, heal: 5, draw: 0, text: 'Restore 5 life.' },
  { id: 'tide-lash', name: 'Tide Lash', wind: 'tide', cost: 1, dmg: 2, shield: 0, heal: 0, draw: 1, text: 'Deal 2 damage. Draw a card.' },
  { id: 'deep-current', name: 'Deep Current', wind: 'tide', cost: 2, dmg: 4, shield: 0, heal: 0, draw: 1, text: 'Deal 4 damage. Draw a card.' },
  { id: 'floodwall', name: 'Floodwall', wind: 'tide', cost: 2, dmg: 0, shield: 6, heal: 0, draw: 0, text: 'Gain 6 shield.' },
  { id: 'tidal-surge', name: 'Tidal Surge', wind: 'tide', cost: 3, dmg: 3, shield: 4, heal: 0, draw: 0, text: 'Deal 3 damage. Gain 4 shield.' },
  { id: 'thorn-snare', name: 'Thorn Snare', wind: 'thorn', cost: 1, dmg: 2, shield: 3, heal: 0, draw: 0, text: 'Deal 2 damage. Gain 3 shield.' },
  { id: 'briar-guard', name: 'Briar Guard', wind: 'thorn', cost: 2, dmg: 0, shield: 8, heal: 0, draw: 0, text: 'Gain 8 shield.' },
  { id: 'thornbloom', name: 'Thornbloom', wind: 'thorn', cost: 3, dmg: 4, shield: 0, heal: 3, draw: 0, text: 'Deal 4 damage. Restore 3 life.' },
  { id: 'rootbind', name: 'Rootbind', wind: 'thorn', cost: 1, dmg: 1, shield: 5, heal: 0, draw: 0, text: 'Deal 1 damage. Gain 5 shield.' },
  { id: 'gale-step', name: 'Gale Step', wind: 'gale', cost: 1, dmg: 0, shield: 0, heal: 0, draw: 2, text: 'Draw 2 cards.' },
  { id: 'skyward-cut', name: 'Skyward Cut', wind: 'gale', cost: 2, dmg: 5, shield: 0, heal: 0, draw: 0, text: 'Deal 5 damage.' },
  { id: 'stormcall', name: 'Stormcall', wind: 'gale', cost: 3, dmg: 6, shield: 0, heal: 0, draw: 1, text: 'Deal 6 damage. Draw a card.' },
  { id: 'zephyr-feint', name: 'Zephyr Feint', wind: 'gale', cost: 0, dmg: 1, shield: 0, heal: 0, draw: 1, text: 'Deal 1 damage. Draw a card.' },
];

const DEF_BY_ID = new Map(CARD_DEFS.map((d) => [d.id, d]));

export function defOf(card) {
  return DEF_BY_ID.get(card.id);
}

/** Build a fresh 30-card deck (card instances with unique uids) and shuffle it. */
export function buildDeck(rng) {
  const ids = [];
  for (const def of CARD_DEFS) {
    ids.push(def.id);
    if (def.id !== 'wildfire' && def.id !== 'stormcall') ids.push(def.id);
  }
  // ids is 30: two of everything except one Wildfire and one Stormcall.
  const deck = shuffle(ids, rng).map((id, i) => ({ uid: `c${i}-${id}`, id }));
  if (deck.length !== DECK_SIZE) throw new Error(`deck is ${deck.length}, expected ${DECK_SIZE}`);
  return deck;
}
