// Emberfall — the rival's brain. One job: decide what Sable does, and what
// plan she telegraphs so the player can read her and counter her.
//
// Sable plays greedily: finish the player when she can, mend when she is
// bleeding, otherwise spend her mana on the best damage she can afford, then
// guard, then draw. Her telegraphed intent is read from her hand at the start
// of the player's turn, so a "Heavy strike" warning really does mean her hand
// is full of damage, and "Mending" means she is about to heal.

import { defOf } from './deck.js';

/** Value a card for Sable: damage first, then survival, then card flow. */
export function cardValue(def, me, foe) {
  let value = def.dmg * 2 + def.shield * 1.2 + def.heal * 1.4 + def.draw * 1.6;
  if (foe.life - def.dmg <= 0) value += 100; // lethal now
  if (me.life <= 8 && def.heal > 0) value += 12; // mending matters when low
  if (me.life <= 8 && def.shield > 0) value += 6;
  if (def.cost > 0) value -= def.cost * 0.4;
  return value;
}

/**
 * Pick the order Sable plays her hand in this turn: repeatedly take the
 * best-value card she can still afford, until her mana runs out. Returns
 * the cards' uids in play order (uids, not positions — the hand shifts as
 * cards leave it).
 */
export function choosePlays(me, foe) {
  const order = [];
  let mana = me.mana;
  const remaining = me.hand.map((card, index) => ({ card, index }));
  for (;;) {
    let best = null;
    let bestValue = -Infinity;
    for (const entry of remaining) {
      const def = defOf(entry.card);
      if (def.cost > mana) continue;
      const value = cardValue(def, me, foe);
      if (value > bestValue) {
        bestValue = value;
        best = entry;
      }
    }
    if (best === null) break;
    order.push(best.card.uid);
    mana -= defOf(best.card).cost;
    remaining.splice(remaining.indexOf(best), 1);
  }
  return order;
}

/**
 * What Sable plans next turn, read honestly from her hand: the player sees
 * this at the start of their turn and can guard, heal or race accordingly.
 */
export function readIntent(me, foe) {
  const defs = me.hand.map(defOf);
  const damage = defs.reduce((sum, d) => sum + d.dmg, 0);
  const healing = defs.reduce((sum, d) => sum + d.heal + d.shield, 0);
  if (damage >= foe.life) return { label: 'Heavy strike — lethal in hand!', kind: 'strike' };
  if (me.life <= 9 && healing >= 5) return { label: 'Mending — she will heal', kind: 'mend' };
  if (damage >= 8) return { label: 'Heavy strike — brace for damage', kind: 'strike' };
  if (healing >= 8 && damage < 5) return { label: 'Raising guard — she will shield', kind: 'guard' };
  return { label: 'Balanced — watching you', kind: 'balanced' };
}
