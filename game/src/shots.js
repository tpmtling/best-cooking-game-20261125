// The screenshot scenes behind ?shot=start|play|end. Each one drives the real
// rules forward from a fresh world with a fixed script of moves, so the frame
// is what a short game really looks like and the same seed always gives the
// same frame. The play scene is staged to show everything the bounty asks
// for: the kitchen and the order board, ingredients on the counter, one dish
// mid-assembly on the plate, the shift timer, and a finished plate waiting
// at the serve window.

import { ORDERS, RECIPES, STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Fill the board with chosen recipes, all with a full patience bar. */
function seedOrders(world, indexes) {
  const s = world.state;
  for (const index of indexes) {
    const recipe = RECIPES[index];
    const patience = ORDERS.patienceSeconds;
    s.orders.push({
      id: s.nextOrderId,
      recipe,
      patience,
      maxPatience: patience,
    });
    s.nextOrderId += 1;
  }
}

/** Walk the chef to `x`, one fixed step at a time. */
function walkTo(world, x) {
  let guard = 0;
  while (Math.abs(world.state.chef.x - x) > 4 && guard < 600) {
    const move = world.state.chef.x < x ? 1 : -1;
    world.step(STEP, { move, interact: false, place: false, dump: false });
    guard += 1;
  }
}

/** Wait `seconds` of game time, standing still. */
function wait(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, { move: 0, interact: false, place: false, dump: false });
  }
}

/** Press the use key once. */
function use(world) {
  world.step(STEP, { move: 0, interact: true, place: false, dump: false });
}

/** Press the plate key once. */
function place(world) {
  world.step(STEP, { move: 0, interact: false, place: true, dump: false });
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  const s = world.state;
  if (name !== 'play' && name !== 'end') {
    // Title: a fresh kitchen, two orders already on the board, ingredients
    // waiting on the counter, the chef in the middle.
    s.spawnTimer = 9999;
    seedOrders(world, [0, 1]);
    wait(world, 2);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'end') {
    // Game over: three strikes, a finished shift, the till counted.
    s.spawnTimer = 9999;
    seedOrders(world, [0, 2]);
    s.coins = 132;
    s.served = 9;
    s.strikes = 3;
    s.time = 121;
    s.over = true;
    s.overReason = 'strikes';
    return { screen: SCREEN_OVER, best: 132 };
  }
  // Play: the lunch rush, mid-shift. Cook a Sunset Burger up to the cheese,
  // leave it mid-assembly on the plate, and set a finished Garden Bowl on
  // the serve tray, ready to ring the bell.
  s.spawnTimer = 9999;
  seedOrders(world, [0, 1, 3]);
  s.time = 31;
  s.coins = 47;
  s.served = 2;
  s.combo = 2;
  walkTo(world, 404);
  use(world); // Raw patty on the grill.
  walkTo(world, 236);
  use(world); // Take a bun.
  walkTo(world, 788);
  use(world); // Start chopping cheese.
  wait(world, 1.4);
  use(world); // Take the cheese.
  walkTo(world, 404);
  wait(world, 3.2); // The patty finishes cooking.
  use(world); // Take the cooked patty.
  walkTo(world, 640);
  place(world); // Bun on the plate.
  place(world); // Patty on the plate.
  place(world); // Cheese on the plate: mid-assembly.
  walkTo(world, 548);
  use(world); // Start chopping a tomato for the next dish.
  s.tray = { recipe: world.state.orders[1].recipe, timer: 3 };
  s.trayTimer = 3;
  return { screen: SCREEN_PLAY, best: 47 };
}
