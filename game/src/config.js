// Every tuning number, colour and recipe in one place. The kitchen is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One full shift, in seconds, before the kitchen closes and the day is scored. */
export const SHIFT_SECONDS = 180;

/** Strikes (missed orders) that end the shift early. */
export const MAX_STRIKES = 3;

/** How many ingredients the chef can carry at once. */
export const CARRY_MAX = 3;

/** Chef walk speed, in logical pixels per second. */
export const CHEF_SPEED = 420;

/** The chef's body, for drawing and for standing in front of a station. */
export const CHEF = { width: 54, height: 86, floorY: 560 };

/** Stations run left to right along the counter. x is the centre of each one. */
export const STATIONS = [
  { id: 'trash', label: 'TRASH', x: 92, kind: 'trash' },
  { id: 'buns', label: 'BUNS', x: 236, kind: 'instant', item: 'bun' },
  { id: 'grill', label: 'GRILL', x: 404, kind: 'grill', item: 'patty' },
  { id: 'tomato', label: 'TOMATO', x: 548, kind: 'chop', item: 'tomato', chopSeconds: 1.2 },
  { id: 'lettuce', label: 'LETTUCE', x: 668, kind: 'chop', item: 'lettuce', chopSeconds: 1.2 },
  { id: 'cheese', label: 'CHEESE', x: 788, kind: 'chop', item: 'cheese', chopSeconds: 1.2 },
  { id: 'sauce', label: 'SAUCE', x: 908, kind: 'instant', item: 'sauce' },
  { id: 'serve', label: 'SERVE', x: 1140, kind: 'serve' },
];

/** The assembly plate sits in the middle of the counter, in front of the grill. */
export const PLATE = { x: 640, y: 470, radius: 62 };

/** A raw patty on the grill cooks, then burns if it is left too long. */
export const GRILL = { cookSeconds: 4, burnSeconds: 6 };

/** Ingredients, in the order a plate stacks them, with their draw colours. */
export const ITEMS = {
  bun: { name: 'Bun', colour: '#e8b06a', dark: '#b97f3e' },
  patty: { name: 'Patty', colour: '#8a5a33', dark: '#5f3c1e' },
  tomato: { name: 'Tomato', colour: '#e5534b', dark: '#a92f28' },
  lettuce: { name: 'Lettuce', colour: '#69b455', dark: '#3f7d31' },
  cheese: { name: 'Cheese', colour: '#f2c94c', dark: '#c39a1d' },
  sauce: { name: 'Sauce', colour: '#f08a24', dark: '#b25c0e' },
};

/** The menu: every dish is a set of ingredients, order-insensitive. */
export const RECIPES = [
  { name: 'Sunset Burger', items: ['bun', 'patty', 'cheese', 'tomato'], base: 18 },
  { name: 'Garden Bowl', items: ['lettuce', 'tomato', 'cheese', 'sauce'], base: 16 },
  { name: 'Golden Melt', items: ['bun', 'cheese', 'patty'], base: 14 },
  { name: 'Crispy Stack', items: ['bun', 'patty', 'lettuce', 'tomato', 'sauce'], base: 22 },
  { name: 'Red Garden', items: ['tomato', 'lettuce', 'sauce'], base: 12 },
];

/** Order pacing: how the shift gets busier as the level rises. */
export const ORDERS = {
  maxOnBoard: 4,
  firstAfterSeconds: 3,
  spawnIntervalSeconds: 11,
  spawnIntervalPerLevel: -0.9,
  minSpawnIntervalSeconds: 7,
  patienceSeconds: 50,
  patiencePerLevel: -3,
  minPatienceSeconds: 34,
  levelEverySeconds: 40,
  maxLevel: 6,
};

/** Coins: a dish pays its base, plus a tip of up to 10 for serving it early. */
export const SCORING = { maxTip: 10, comboStep: 2, comboCap: 10 };

export const PALETTE = {
  wall: '#3d2b1f',
  wallTop: '#4a3423',
  floor: '#6b4a2f',
  floorLine: '#54371f',
  counter: '#8a5a33',
  counterTop: '#a9743f',
  counterEdge: '#6e4525',
  board: '#2e2620',
  ticket: '#fdf6e3',
  ticketInk: '#2e2620',
  plate: '#f4f1ea',
  plateEdge: '#cfc8b8',
  chefHat: '#f4f1ea',
  chefCoat: '#eef1f5',
  chefSkin: '#e8b58a',
  chefPants: '#2f3a4a',
  text: '#f4f1ea',
  muted: '#c9b8a3',
  gold: '#f2c94c',
  green: '#69b455',
  red: '#e5534b',
  timerLow: '#ff6b5e',
  serveGlow: '#7ee787',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best shift total is kept between visits (this browser only). */
export const BEST_KEY = 'copper-ladle.best';
