// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|end (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld, EVENT_CHOP_DONE, EVENT_FAIL, EVENT_GRILL_READY,
  EVENT_OVER, EVENT_PICKUP, EVENT_SERVED, EVENT_STRIKE,
} from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import {
  createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE,
} from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

/** Tiny WebAudio blips, made on first input so no sound file is shipped. */
let audio = null;
function beep(frequency, seconds, type = 'sine', volume = 0.08) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + seconds);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + seconds);
  } catch {
    // Sound is garnish: a browser that refuses audio still plays the game.
  }
}

function playEvents(events) {
  if (events & EVENT_PICKUP) beep(520, 0.08, 'triangle');
  if (events & EVENT_CHOP_DONE) {
    beep(660, 0.07, 'triangle');
    setTimeout(() => beep(880, 0.09, 'triangle'), 70);
  }
  if (events & EVENT_GRILL_READY) beep(980, 0.12, 'sine');
  if (events & EVENT_SERVED) {
    beep(660, 0.1, 'triangle');
    setTimeout(() => beep(880, 0.1, 'triangle'), 90);
    setTimeout(() => beep(1170, 0.16, 'triangle'), 180);
  }
  if (events & EVENT_FAIL) beep(140, 0.16, 'sawtooth', 0.05);
  if (events & EVENT_STRIKE) beep(180, 0.3, 'sawtooth', 0.07);
  if (events & EVENT_OVER) {
    setTimeout(() => beep(392, 0.2, 'triangle'), 100);
    setTimeout(() => beep(311, 0.3, 'triangle'), 300);
  }
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, world);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce() {
    const s = world.state;
    if (screen === SCREEN_TITLE) status.textContent = 'The Copper Ladle. Press Enter to open the kitchen.';
    else if (screen === SCREEN_OVER) status.textContent = `Shift over. ${s.coins} coins, ${s.served} dishes served.`;
    else status.textContent = `${s.coins} coins, ${s.served} served, ${s.orders.length} orders on the board.`;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const pressed = input.consume();
    if (pressed.pause && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
      announce();
    }
    if (pressed.confirm && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      world.reset();
      screen = SCREEN_PLAY;
      announce();
    }
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = world.step(STEP, {
          move: input.move(),
          interact: pressed.interact,
          place: pressed.place,
          dump: pressed.dump,
        });
        pressed.interact = false;
        pressed.place = false;
        pressed.dump = false;
        playEvents(events);
        if (events & EVENT_OVER) {
          screen = SCREEN_OVER;
          if (world.state.coins > best) {
            best = world.state.coins;
            saveBest(best);
          }
          announce();
          break;
        }
      }
    }
    renderer.draw(world.state, screen, best);
  }

  announce();
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
