// Keyboard and mouse, read by the loop: held movement, and one-shot edges for
// the actions the world consumes once per press.

import { FIELD, PLATE } from './config.js';
import { stationAt } from './world.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';

export function createInput(canvas, world) {
  const keys = new Set();
  const edges = new Set();
  let mouse = { x: FIELD.width / 2, y: 0, clicked: false };

  function press(action) {
    edges.add(action);
  }

  function onKeyDown(event) {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'KeyE') {
      press('interact');
      event.preventDefault();
    } else if (event.code === 'KeyQ') {
      press('place');
    } else if (event.code === 'KeyX') {
      press('dump');
    } else if (event.code === 'Enter') {
      press(ACTION_CONFIRM);
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      press(ACTION_PAUSE);
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (FIELD.width / rect.width),
      y: (event.clientY - rect.top) * (FIELD.height / rect.height),
    };
  }

  function onClick(event) {
    const point = toLogical(event);
    mouse = { x: point.x, y: point.y, clicked: true };
    const chef = world.state.chef;
    chef.targetX = Math.max(56, Math.min(FIELD.width - 56, point.x));
    // Clicking the plate puts an item on it (or takes one back); clicking a
    // station uses it once the chef is standing there; anywhere else, walk.
    if (Math.abs(point.x - PLATE.x) < 90 && point.y > 420) {
      press('place');
    } else {
      const station = stationAt(point.x);
      if (station && Math.abs(chef.x - station.x) < 78) press('interact');
    }
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('click', onClick);

  return {
    /** Held movement: -1, 0 or 1, from the arrow keys or A/D. */
    move() {
      if (keys.has('ArrowLeft') || keys.has('KeyA')) return -1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) return 1;
      return 0;
    },
    /** The edges pressed since the last read, then cleared. */
    consume() {
      const taken = {
        interact: edges.has('interact'),
        place: edges.has('place'),
        dump: edges.has('dump'),
        confirm: edges.has(ACTION_CONFIRM),
        pause: edges.has(ACTION_PAUSE),
      };
      edges.clear();
      return taken;
    },
    mouse() {
      return mouse;
    },
  };
}
