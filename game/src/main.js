// Emberfall — boot and the one loop. The game is event-driven: every move
// re-renders the table, and the engine (not the DOM) owns the rules.
// ?seed=N fixes the shuffle. ?scene=title|table|win|loss stages that scene
// instead of the title screen, paints it twice and sets window.__shotReady
// for a screenshot — the scene hook ships in the game itself.

import { createGame, startDuel, PHASE_OVER } from './engine.js';
import { render, flashBanner, announce } from './render.js';
import { bindInput } from './input.js';
import { stageScene } from './shots.js';

const params = new URLSearchParams(window.location.search);
const scene = params.get('scene');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const game = createGame(seed);

function showEnd() {
  const endScreen = document.getElementById('end-screen');
  const endCard = document.getElementById('end-card');
  const title = document.getElementById('end-title');
  const won = game.winner === 'you';
  endCard.classList.toggle('win', won);
  title.textContent = won ? 'VICTORY' : 'DEFEAT';
  title.classList.toggle('lost', !won);
  document.getElementById('end-sub').textContent = won
    ? 'Sable the Tidecaller falls — the four winds bow to the Ember Warden.'
    : 'Sable the Tidecaller stands over the table — the winds turn against you.';
  document.getElementById('end-stats').textContent =
    `Score ${game.score} · ${game.damageDealt} damage dealt · ${game.cardsPlayed} cards played · ${game.round} rounds.`;
  endScreen.classList.remove('hidden');
  announce(won ? 'Victory! You won the duel.' : 'Defeat. Sable won the duel.');
}

const hooks = {
  onStart() {
    document.getElementById('title-screen').classList.add('hidden');
    render(game);
    flashBanner('Round 1 — your turn', '');
    announce('The duel begins. Your turn.');
  },
  onPlayed(event) {
    if (event.resonance) flashBanner('RESONANCE +2!', 'resonance');
    render(game);
    announce(`${event.def.name} played.`);
  },
  onDenied(reason) {
    flashBanner(reason === 'not enough mana' ? 'Not enough mana!' : 'Cannot play that card', '');
  },
  onAiStart() {
    render(game);
    flashBanner("Sable's turn…", '');
  },
  onAiDone() {
    render(game);
    if (game.phase !== PHASE_OVER) flashBanner(`Round ${game.round} — your turn`, '');
  },
  onOver() {
    render(game);
    showEnd();
  },
  onRestart() {
    window.location.href = window.location.pathname;
  },
};

bindInput(game, hooks);

if (scene) {
  const staged = stageScene(scene, game);
  if (staged !== 'title') document.getElementById('title-screen').classList.add('hidden');
  render(game);
  if (staged === 'win' || staged === 'loss') showEnd();
  if (staged === 'table') flashBanner('Round 2 — your turn', '');
  let painted = 0;
  (function paint() {
    render(game);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }());
} else {
  render(game);
}
