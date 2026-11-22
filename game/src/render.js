// Emberfall — the table, painted. One job: turn game state into DOM.
// Cards are real DOM nodes (legible at thumbnail size, clickable, focusable);
// the felt, the fan of the hand and the slide/flip animations live in CSS.

import { WINDS, START_LIFE } from './config.js';
import { defOf } from './deck.js';

const seenCards = new Set();

/** Build one face-up card node. `playable` marks cards the player may click. */
export function cardNode(card, { playable = false, mini = false } = {}) {
  const def = defOf(card);
  const wind = WINDS[def.wind];
  const node = document.createElement('div');
  node.className = `card wind-${def.wind}${playable ? ' playable' : ''}${mini ? ' mini' : ''}`;
  node.dataset.uid = card.uid;
  node.style.setProperty('--wind', wind.color);
  node.style.setProperty('--wind-soft', wind.soft);
  node.innerHTML =
    `<div class="card-cost" title="Mana cost">${def.cost}</div>` +
    `<div class="card-glyph" aria-hidden="true">${wind.glyph}</div>` +
    `<div class="card-name">${def.name}</div>` +
    `<div class="card-text">${def.text}</div>` +
    `<div class="card-wind">${wind.name.toUpperCase()}</div>`;
  node.setAttribute('aria-label', `${def.name}, ${wind.name}, cost ${def.cost}. ${def.text}`);
  return node;
}

/** Build one face-down card back for the rival's hand. */
function cardBackNode() {
  const node = document.createElement('div');
  node.className = 'card back';
  node.innerHTML = '<div class="back-glyph" aria-hidden="true">✦</div><div class="back-word">EMBERFALL</div>';
  node.setAttribute('aria-label', 'Sable holds a card');
  return node;
}

function setLife(fillEl, textEl, fighter) {
  const pct = Math.max(0, Math.min(100, (fighter.life / START_LIFE) * 100));
  fillEl.style.width = `${pct}%`;
  textEl.textContent = `${Math.max(0, fighter.life)} / ${START_LIFE}`;
}

function setMana(gemsEl, fighter) {
  gemsEl.innerHTML = '';
  for (let i = 0; i < fighter.maxMana; i += 1) {
    const gem = document.createElement('span');
    gem.className = `gem${i < fighter.mana ? ' lit' : ''}`;
    gem.textContent = '◆';
    gemsEl.appendChild(gem);
  }
  const label = document.createElement('span');
  label.className = 'mana-num';
  label.textContent = `${fighter.mana}/${fighter.maxMana}`;
  gemsEl.appendChild(label);
}

/** Paint the whole table from `game`. Call after every move. */
export function render(game) {
  const $ = (id) => document.getElementById(id);

  setLife($('foe-life-fill'), $('foe-life-text'), game.foe);
  setLife($('you-life-fill'), $('you-life-text'), game.you);
  $('foe-shield').textContent = game.foe.shield > 0 ? `🛡 ${game.foe.shield} shield · ` : '';
  $('you-shield').textContent = game.you.shield > 0 ? `🛡 ${game.you.shield} shield · ` : '';
  $('foe-deck').textContent = `Deck ${game.foe.deck.length} · Hand ${game.foe.hand.length}`;
  $('you-deck').textContent = `Deck ${game.you.deck.length} · Discard ${game.you.discard.length}`;
  $('round-label').textContent = `ROUND ${game.round}`;
  $('score-label').textContent = `SCORE ${game.score}`;
  const intent = $('intent-label');
  intent.textContent = `Intent: ${game.intent.label}`;
  intent.dataset.kind = game.intent.kind;
  setMana($('mana-gems'), game.you);

  // Rival's hand: face-down backs, fanned, so the table always shows both hands.
  const foeHand = $('foe-hand');
  foeHand.innerHTML = '';
  game.foe.hand.forEach((card, i) => {
    const back = cardBackNode();
    const spread = game.foe.hand.length > 1 ? (i - (game.foe.hand.length - 1) / 2) * 6 : 0;
    back.style.setProperty('--fan', `${spread}deg`);
    foeHand.appendChild(back);
  });

  // The player's hand, fanned with a little weight; new cards slide in.
  const youHand = $('you-hand');
  youHand.innerHTML = '';
  game.you.hand.forEach((card, i) => {
    const def = defOf(card);
    const node = cardNode(card, { playable: game.phase === 'player' && def.cost <= game.you.mana });
    if (!seenCards.has(card.uid)) {
      node.classList.add('just-dealt');
      seenCards.add(card.uid);
    }
    const spread = game.you.hand.length > 1 ? (i - (game.you.hand.length - 1) / 2) * 5 : 0;
    node.style.setProperty('--fan', `${spread}deg`);
    node.dataset.index = String(i);
    node.tabIndex = 0;
    youHand.appendChild(node);
  });

  // The arena: the last cards played, newest first, with who played them.
  const arena = $('arena-cards');
  arena.innerHTML = '';
  if (game.played.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'arena-empty';
    empty.textContent = 'The arena waits — play a card to open the duel.';
    arena.appendChild(empty);
  } else {
    for (const entry of game.played) {
      const wrap = document.createElement('div');
      wrap.className = `arena-card${entry.resonance ? ' resonance' : ''}`;
      wrap.appendChild(cardNode(entry.card, { mini: true }));
      const who = document.createElement('div');
      who.className = 'arena-who';
      who.textContent = entry.side === 'you' ? 'YOU' : 'SABLE';
      wrap.appendChild(who);
      arena.appendChild(wrap);
    }
  }

  // The log, newest at the bottom, always scrolled there.
  const log = $('log');
  log.innerHTML = '';
  for (const line of game.log.slice(-8)) {
    const row = document.createElement('div');
    row.className = 'log-line';
    row.textContent = line;
    log.appendChild(row);
  }
  log.scrollTop = log.scrollHeight;

  $('end-turn').disabled = game.phase !== 'player';
}

/** Flash a short banner across the arena (Resonance, round changes, turns). */
export function flashBanner(text, kind = '') {
  const banner = document.getElementById('banner');
  banner.textContent = text;
  banner.dataset.kind = kind;
  banner.classList.remove('show');
  void banner.offsetWidth; // restart the animation
  banner.classList.add('show');
}

/** Announce a line to screen readers. */
export function announce(text) {
  document.getElementById('status').textContent = text;
}
