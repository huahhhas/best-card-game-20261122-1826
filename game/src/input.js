// Emberfall — hands on the table. One job: mouse and keyboard input.
// Click (or Enter/Space on a focused card, or keys 1–7) plays a card;
// Enter ends the turn; R restarts from an end screen; Enter starts the duel.

import { playCard, runAiTurn, startDuel, PHASE_PLAYER, PHASE_OVER } from './engine.js';

export function bindInput(game, hooks) {
  const youHand = document.getElementById('you-hand');
  const endTurnBtn = document.getElementById('end-turn');
  const startBtn = document.getElementById('start-btn');
  const againBtn = document.getElementById('again-btn');

  function tryPlay(index) {
    if (game.phase !== PHASE_PLAYER) return;
    const event = playCard(game, 'you', index);
    if (!event.ok) {
      hooks.onDenied(event.reason);
      return;
    }
    hooks.onPlayed(event);
    if (game.phase === PHASE_OVER) hooks.onOver();
  }

  youHand.addEventListener('click', (ev) => {
    const node = ev.target.closest('.card');
    if (!node || node.dataset.index === undefined) return;
    tryPlay(Number(node.dataset.index));
  });

  youHand.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList.contains('card')) {
      ev.preventDefault();
      const node = ev.target;
      if (node.dataset.index !== undefined) tryPlay(Number(node.dataset.index));
    }
  });

  function endTurn() {
    if (game.phase !== PHASE_PLAYER) return;
    hooks.onAiStart();
    // Sable's cards land one beat at a time so her turn reads as a turn,
    // not a blink. The engine itself stays synchronous and testable.
    const events = runAiTurn(game);
    hooks.onAiDone(events);
    if (game.phase === PHASE_OVER) hooks.onOver();
  }

  endTurnBtn.addEventListener('click', endTurn);

  startBtn.addEventListener('click', () => {
    startDuel(game);
    hooks.onStart();
  });

  againBtn.addEventListener('click', () => hooks.onRestart());

  document.addEventListener('keydown', (ev) => {
    const titleOpen = !document.getElementById('title-screen').classList.contains('hidden');
    const endOpen = !document.getElementById('end-screen').classList.contains('hidden');
    if (titleOpen && (ev.key === 'Enter' || ev.key === ' ')) {
      ev.preventDefault();
      startBtn.click();
      return;
    }
    if (endOpen && (ev.key === 'r' || ev.key === 'R' || ev.key === 'Enter')) {
      ev.preventDefault();
      hooks.onRestart();
      return;
    }
    if (game.phase === PHASE_PLAYER) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        endTurn();
        return;
      }
      const n = Number.parseInt(ev.key, 10);
      if (n >= 1 && n <= 7) tryPlay(n - 1);
    }
  });
}
