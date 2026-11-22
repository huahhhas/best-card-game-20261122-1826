// Emberfall — the four winds, the numbers every other file agrees on.
// One job: constants. No logic lives here.

export const START_LIFE = 24;
export const START_MANA = 3;
export const MAX_MANA = 10;
export const OPENING_HAND = 5;
export const DRAW_PER_TURN = 2;
export const MAX_HAND = 7;
export const RESONANCE_BONUS = 2;
export const DECK_SIZE = 30;

/** The four winds (suits). Colour AND shape carry the meaning, never text alone. */
export const WINDS = {
  ember: { name: 'Ember', glyph: '▲', color: '#e8501e', soft: '#ffd9c7' },
  tide: { name: 'Tide', glyph: '●', color: '#2b7de9', soft: '#cfe4ff' },
  thorn: { name: 'Thorn', glyph: '◆', color: '#2fae5f', soft: '#c9f2d8' },
  gale: { name: 'Gale', glyph: '✦', color: '#8b5cf6', soft: '#e6dbff' },
};

export const WIND_ORDER = ['ember', 'tide', 'thorn', 'gale'];
