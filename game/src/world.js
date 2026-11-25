// The kitchen itself: the chef, the stations, the orders, the plate and the till.
// Everything here is pure state plus one fixed step, so a screenshot scene can be
// staged by driving the same rules a player drives, and the same seed always
// plays the same shift.

import {
  CARRY_MAX, CHEF, CHEF_SPEED, FIELD, GRILL, MAX_STRIKES, ORDERS,
  PLATE, RECIPES, SCORING, SHIFT_SECONDS, STATIONS, STEP,
} from './config.js';

export const EVENT_PICKUP = 1;
export const EVENT_CHOP_DONE = 2;
export const EVENT_GRILL_READY = 4;
export const EVENT_SERVED = 8;
export const EVENT_STRIKE = 16;
export const EVENT_FAIL = 32;
export const EVENT_OVER = 64;

/** The station whose counter the chef is standing at, or null. */
export function stationAt(x) {
  let best = null;
  let bestDistance = 78;
  for (const station of STATIONS) {
    const distance = Math.abs(station.x - x);
    if (distance < bestDistance) {
      best = station;
      bestDistance = distance;
    }
  }
  return best;
}

function freshStationState() {
  const state = {};
  for (const station of STATIONS) {
    if (station.kind === 'grill') state[station.id] = { stage: 'empty', t: 0 };
    else if (station.kind === 'chop') state[station.id] = { stage: 'idle', t: 0 };
  }
  return state;
}

export function createWorld(random) {
  const world = {
    random,
    state: null,
    reset() {
      world.state = {
        time: 0,
        level: 1,
        chef: { x: FIELD.width / 2, targetX: FIELD.width / 2, carrying: [] },
        stations: freshStationState(),
        orders: [],
        nextOrderId: 1,
        spawnTimer: ORDERS.firstAfterSeconds,
        plate: [],
        tray: null,
        trayTimer: 0,
        coins: 0,
        served: 0,
        combo: 0,
        strikes: 0,
        over: false,
        overReason: null,
        shake: 0,
        flash: 0,
      };
    },
    /** One fixed step. `input` is { move, interact, place, dump } with the last
     *  three true only on the frame the player pressed them. Returns event bits. */
    step(dt, input) {
      const s = world.state;
      if (s.over) return 0;
      let events = 0;
      s.time += dt;
      s.level = Math.min(ORDERS.maxLevel, 1 + Math.floor(s.time / ORDERS.levelEverySeconds));
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
      if (s.trayTimer > 0) {
        s.trayTimer -= dt;
        if (s.trayTimer <= 0) s.tray = null;
      }

      // The chef walks toward the held direction, or toward a clicked target.
      const chef = s.chef;
      if (input.move !== 0) {
        chef.x += input.move * CHEF_SPEED * dt;
        chef.targetX = chef.x;
      } else if (Math.abs(chef.targetX - chef.x) > 2) {
        const direction = chef.targetX > chef.x ? 1 : -1;
        chef.x += direction * CHEF_SPEED * dt;
        if ((direction > 0 && chef.x > chef.targetX) || (direction < 0 && chef.x < chef.targetX)) {
          chef.x = chef.targetX;
        }
      }
      chef.x = Math.max(56, Math.min(FIELD.width - 56, chef.x));

      // The grill cooks, then burns; the chopping boards finish their chop.
      const grill = s.stations.grill;
      if (grill.stage === 'cooking') {
        grill.t += dt;
        if (grill.t >= GRILL.cookSeconds) {
          grill.stage = 'ready';
          grill.t = 0;
          events |= EVENT_GRILL_READY;
        }
      } else if (grill.stage === 'ready') {
        grill.t += dt;
        if (grill.t >= GRILL.burnSeconds) {
          grill.stage = 'burnt';
          grill.t = 0;
        }
      }
      for (const station of STATIONS) {
        if (station.kind !== 'chop') continue;
        const board = s.stations[station.id];
        if (board.stage === 'chopping') {
          board.t += dt;
          if (board.t >= station.chopSeconds) {
            board.stage = 'ready';
            board.t = 0;
            events |= EVENT_CHOP_DONE;
          }
        }
      }

      // Orders arrive on a timer, and their patience runs out.
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0 && s.orders.length < ORDERS.maxOnBoard) {
        spawnOrder(s);
        s.spawnTimer = spawnInterval(s.level);
      }
      for (let i = s.orders.length - 1; i >= 0; i -= 1) {
        const order = s.orders[i];
        order.patience -= dt;
        if (order.patience <= 0) {
          s.orders.splice(i, 1);
          s.strikes += 1;
          s.combo = 0;
          events |= EVENT_STRIKE;
          if (s.strikes >= MAX_STRIKES) {
            s.over = true;
            s.overReason = 'strikes';
            events |= EVENT_OVER;
            return events;
          }
        }
      }

      // The shift ends when the clock runs out.
      if (s.time >= SHIFT_SECONDS) {
        s.over = true;
        s.overReason = 'time';
        events |= EVENT_OVER;
        return events;
      }

      if (input.interact) events |= useStation(s);
      if (input.place) events |= usePlate(s);
      if (input.dump) events |= dumpCarried(s);
      return events;
    },
  };
  world.reset();
  return world;
}

function spawnInterval(level) {
  return Math.max(
    ORDERS.minSpawnIntervalSeconds,
    ORDERS.spawnIntervalSeconds + ORDERS.spawnIntervalPerLevel * (level - 1),
  );
}

function patienceFor(level) {
  return Math.max(
    ORDERS.minPatienceSeconds,
    ORDERS.patienceSeconds + ORDERS.patiencePerLevel * (level - 1),
  );
}

function spawnOrder(s) {
  const maxItems = s.level >= 3 ? 5 : 4;
  const menu = RECIPES.filter((recipe) => recipe.items.length <= maxItems);
  const recipe = s.random.pick(menu);
  const patience = patienceFor(s.level);
  s.orders.push({
    id: s.nextOrderId,
    recipe,
    patience,
    maxPatience: patience,
  });
  s.nextOrderId += 1;
}

/** Press Space / E / click at a station: take, start, or serve. */
function useStation(s) {
  const chef = s.chef;
  const station = stationAt(chef.x);
  if (!station) return 0;
  if (station.kind === 'trash') return dumpCarried(s);
  if (station.kind === 'serve') return servePlate(s);
  if (chef.carrying.length >= CARRY_MAX) {
    s.shake = 0.25;
    return EVENT_FAIL;
  }
  if (station.kind === 'instant') {
    chef.carrying.push(station.item);
    return EVENT_PICKUP;
  }
  if (station.kind === 'grill') {
    const grill = s.stations.grill;
    if (grill.stage === 'empty') {
      grill.stage = 'cooking';
      grill.t = 0;
      return EVENT_PICKUP;
    }
    if (grill.stage === 'ready') {
      grill.stage = 'empty';
      grill.t = 0;
      chef.carrying.push('patty');
      return EVENT_PICKUP;
    }
    if (grill.stage === 'burnt') {
      grill.stage = 'empty';
      grill.t = 0;
      return EVENT_FAIL;
    }
    return 0;
  }
  if (station.kind === 'chop') {
    const board = s.stations[station.id];
    if (board.stage === 'idle') {
      board.stage = 'chopping';
      board.t = 0;
      return EVENT_PICKUP;
    }
    if (board.stage === 'ready') {
      board.stage = 'idle';
      board.t = 0;
      chef.carrying.push(station.item);
      return EVENT_PICKUP;
    }
    return 0;
  }
  return 0;
}

/** Press Q / click the plate: put the top carried item on it, or take one back
 *  with empty hands. */
function usePlate(s) {
  const chef = s.chef;
  if (Math.abs(chef.x - PLATE.x) > 150) return 0;
  if (chef.carrying.length > 0) {
    if (s.plate.length >= 5) {
      s.shake = 0.25;
      return EVENT_FAIL;
    }
    s.plate.push(chef.carrying.pop());
    return EVENT_PICKUP;
  }
  if (s.plate.length > 0) {
    chef.carrying.push(s.plate.pop());
    return EVENT_PICKUP;
  }
  return 0;
}

/** Press X: throw away everything carried. */
function dumpCarried(s) {
  if (s.chef.carrying.length === 0) return 0;
  s.chef.carrying = [];
  return EVENT_PICKUP;
}

function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const counts = {};
  for (const item of a) counts[item] = (counts[item] ?? 0) + 1;
  for (const item of b) {
    if (!counts[item]) return false;
    counts[item] -= 1;
  }
  return true;
}

/** Serve the plate at the window: it must match an open order exactly. */
function servePlate(s) {
  if (s.plate.length === 0) return 0;
  const index = s.orders.findIndex((order) => sameItems(s.plate, order.recipe.items));
  if (index === -1) {
    s.shake = 0.3;
    return EVENT_FAIL;
  }
  const order = s.orders[index];
  s.orders.splice(index, 1);
  const tip = Math.round(SCORING.maxTip * Math.max(0, order.patience / order.maxPatience));
  const comboBonus = Math.min(SCORING.comboCap, SCORING.comboStep * s.combo);
  s.coins += order.recipe.base + tip + comboBonus;
  s.served += 1;
  s.combo += 1;
  s.tray = { recipe: order.recipe, timer: 3 };
  s.trayTimer = 3;
  s.plate = [];
  s.flash = 0.4;
  return EVENT_SERVED;
}

/** Seconds left on the shift clock. */
export function timeLeft(state) {
  return Math.max(0, SHIFT_SECONDS - state.time);
}
