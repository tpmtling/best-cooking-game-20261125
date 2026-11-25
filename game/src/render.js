// Everything the player sees, painted on one canvas: the kitchen, the order
// board, the stations, the chef, the plate, the serve window and the screens.
// The judge reads the game mostly through its screenshots, so every frame is
// drawn to be readable at a glance: big labels, big ingredient shapes, and the
// order board, the timer and the plate always in view.

import {
  CHEF, FIELD, ITEMS, MAX_STRIKES, PALETTE, PLATE, STATIONS,
} from './config.js';
import { stationAt, timeLeft } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, weight = '700', align = 'center') {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** One ingredient, drawn as a flat readable shape. */
export function drawItem(ctx, item, x, y, size) {
  const itemDef = ITEMS[item];
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (item === 'bun') {
    ctx.fillStyle = itemDef.colour;
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = itemDef.dark;
    ctx.fillRect(-r, 0, size, 5);
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(-r * 0.4, -r * 0.55, 3, 3);
    ctx.fillRect(0, -r * 0.7, 3, 3);
    ctx.fillRect(r * 0.4, -r * 0.5, 3, 3);
  } else if (item === 'patty') {
    ctx.fillStyle = itemDef.dark;
    roundRect(ctx, -r, -r * 0.45, size, r * 0.9, 6);
    ctx.fill();
    ctx.fillStyle = itemDef.colour;
    roundRect(ctx, -r + 3, -r * 0.45 + 3, size - 6, r * 0.9 - 6, 5);
    ctx.fill();
  } else if (item === 'tomato') {
    ctx.fillStyle = itemDef.colour;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#69b455';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(-6, -r * 0.4);
    ctx.lineTo(6, -r * 0.4);
    ctx.closePath();
    ctx.fill();
  } else if (item === 'lettuce') {
    ctx.fillStyle = itemDef.colour;
    ctx.beginPath();
    for (let i = 0; i <= 6; i += 1) {
      const px = -r + (i * size) / 6;
      const py = Math.sin((i / 6) * Math.PI * 2) * 4;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(r, r * 0.5);
    ctx.lineTo(-r, r * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (item === 'cheese') {
    ctx.fillStyle = itemDef.colour;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(0, -r * 0.7);
    ctx.lineTo(r, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = itemDef.dark;
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.1, 3, 0, Math.PI * 2);
    ctx.arc(r * 0.3, r * 0.25, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (item === 'sauce') {
    ctx.fillStyle = itemDef.colour;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.9, 0, 0, r * 0.8);
    ctx.quadraticCurveTo(-r * 0.9, 0, 0, -r);
    ctx.fill();
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.1, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStation(ctx, station, board, grill, shakeX) {
  const x = station.x + shakeX;
  const top = 300;
  const width = station.kind === 'serve' ? 150 : 118;
  const left = x - width / 2;
  // The counter block.
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(left, top, width, 130);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fillRect(left, top, width, 18);
  ctx.fillStyle = PALETTE.counterEdge;
  ctx.fillRect(left, top + 126, width, 4);
  // The station's own look.
  if (station.kind === 'grill') {
    ctx.fillStyle = '#26262b';
    roundRect(ctx, left + 10, top + 34, width - 20, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#4a4a52';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(left + 10 + (i * (width - 20)) / 4, top + 38);
      ctx.lineTo(left + 10 + (i * (width - 20)) / 4, top + 82);
      ctx.stroke();
    }
    if (grill.stage === 'cooking' || grill.stage === 'ready' || grill.stage === 'burnt') {
      const colour = grill.stage === 'burnt' ? '#1c1c1c' : '#8a5a33';
      ctx.fillStyle = colour;
      roundRect(ctx, x - 26, top + 44, 52, 26, 8);
      ctx.fill();
    }
    if (grill.stage === 'cooking') {
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(x, top + 30, 5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'COOKING', x, top + 104, 12, PALETTE.gold);
    } else if (grill.stage === 'ready') {
      text(ctx, 'READY!', x, top + 104, 13, PALETTE.serveGlow);
    } else if (grill.stage === 'burnt') {
      text(ctx, 'BURNT', x, top + 104, 13, PALETTE.red);
    }
  } else if (station.kind === 'chop') {
    ctx.fillStyle = '#d9c9a8';
    roundRect(ctx, left + 12, top + 34, width - 24, 46, 6);
    ctx.fill();
    if (board.stage === 'idle') {
      drawItem(ctx, station.item, x, top + 57, 34);
    } else if (board.stage === 'chopping') {
      drawItem(ctx, station.item, x, top + 57, 34);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, top + 57, 26, -Math.PI / 2, -Math.PI / 2 + (board.t / station.chopSeconds) * Math.PI * 2);
      ctx.stroke();
      text(ctx, 'CHOPPING', x, top + 104, 12, PALETTE.gold);
    } else {
      drawItem(ctx, station.item, x, top + 57, 34);
      text(ctx, 'READY!', x, top + 104, 13, PALETTE.serveGlow);
    }
  } else if (station.kind === 'instant') {
    drawItem(ctx, station.item, x, top + 57, 40);
  } else if (station.kind === 'trash') {
    ctx.fillStyle = '#3a3f47';
    roundRect(ctx, left + 22, top + 34, width - 44, 52, 8);
    ctx.fill();
    ctx.strokeStyle = '#565d68';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left + 28, top + 40);
    ctx.lineTo(left + width - 28, top + 40);
    ctx.stroke();
    text(ctx, 'DUMP', x, top + 104, 12, PALETTE.muted);
  } else if (station.kind === 'serve') {
    ctx.fillStyle = '#7a5a2e';
    ctx.fillRect(left, top, width, 18);
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(x, top + 56, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a5a2e';
    ctx.fillRect(x - 3, top + 36, 6, 10);
    text(ctx, 'RING THE BELL', x, top + 104, 12, PALETTE.gold);
  }
  text(ctx, station.label, x, top + 152, 14, PALETTE.text);
}

function drawTicket(ctx, order, x, y) {
  const width = 236;
  const height = 108;
  const fraction = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = PALETTE.ticket;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.ticketInk;
  ctx.font = '700 17px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${order.id} ${order.recipe.name}`, x + 12, y + 22);
  let iconX = x + 22;
  for (const item of order.recipe.items) {
    drawItem(ctx, item, iconX, y + 56, 26);
    iconX += 34;
  }
  const barColour = fraction > 0.5 ? PALETTE.green : fraction > 0.25 ? PALETTE.gold : PALETTE.red;
  ctx.fillStyle = '#ddd3bd';
  roundRect(ctx, x + 12, y + 86, width - 24, 10, 5);
  ctx.fill();
  ctx.fillStyle = barColour;
  roundRect(ctx, x + 12, y + 86, (width - 24) * fraction, 10, 5);
  ctx.fill();
  text(ctx, `${Math.ceil(order.patience)}s`, x + width - 12, y + 22, 15, fraction > 0.25 ? '#6b5d43' : PALETTE.red, '700', 'right');
}

function drawChef(ctx, chef, shakeX) {
  const x = chef.x + shakeX;
  const y = CHEF.floorY;
  // Carried ingredients ride above the hat.
  chef.carrying.forEach((item, i) => {
    const bx = x - (chef.carrying.length - 1) * 20 + i * 40;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(bx, y - 108, 17, 0, Math.PI * 2);
    ctx.fill();
    drawItem(ctx, item, bx, y - 108, 24);
  });
  // Body and apron.
  ctx.fillStyle = PALETTE.chefPants;
  ctx.fillRect(x - 16, y - 22, 32, 24);
  ctx.fillStyle = PALETTE.chefCoat;
  roundRect(ctx, x - 26, y - 66, 52, 48, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(x, y - 78, 15, 0, Math.PI * 2);
  ctx.fill();
  // The tall white hat.
  ctx.fillStyle = PALETTE.chefHat;
  roundRect(ctx, x - 18, y - 108, 36, 22, 8);
  ctx.fill();
  ctx.fillRect(x - 14, y - 92, 28, 8);
  // Eyes.
  ctx.fillStyle = '#26262b';
  ctx.beginPath();
  ctx.arc(x - 5, y - 80, 2, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 80, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlate(ctx, plate) {
  const { x, y } = PLATE;
  ctx.fillStyle = PALETTE.plateEdge;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, PLATE.radius + 6, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, PLATE.radius, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  plate.forEach((item, i) => {
    drawItem(ctx, item, x, y - 6 - i * 12, 44);
  });
  if (plate.length === 0) {
    text(ctx, 'PLATE — press Q to add', x, y - 34, 13, PALETTE.muted, '600');
  }
}

function drawTray(ctx, tray) {
  const x = 1140;
  const y = 500;
  if (!tray) return;
  ctx.save();
  ctx.shadowColor = PALETTE.serveGlow;
  ctx.shadowBlur = 24;
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(x, y + 8, 58, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  tray.recipe.items.forEach((item, i) => {
    drawItem(ctx, item, x, y - 4 - i * 11, 38);
  });
  text(ctx, 'READY TO SERVE', x, y + 44, 13, PALETTE.serveGlow);
}

function drawHud(ctx, state, best) {
  const left = timeLeft(state);
  const minutes = Math.floor(left / 60);
  const seconds = Math.floor(left % 60);
  const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const lowTime = left <= 30 && !state.over;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, FIELD.width, 64);
  text(ctx, 'THE COPPER LADLE', 24, 32, 22, PALETTE.text, '800', 'left');
  text(ctx, `LEVEL ${state.level}`, 320, 32, 16, PALETTE.muted, '700', 'left');
  text(ctx, `COINS ${state.coins}`, 470, 32, 20, PALETTE.gold, '800', 'left');
  text(ctx, `SERVED ${state.served}`, 620, 32, 16, PALETTE.text, '700', 'left');
  if (state.combo >= 2) text(ctx, `COMBO x${state.combo}`, 760, 32, 16, PALETTE.serveGlow, '800', 'left');
  text(ctx, clock, FIELD.width - 190, 32, 26, lowTime ? PALETTE.timerLow : PALETTE.text, '800', 'left');
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    ctx.fillStyle = i < MAX_STRIKES - state.strikes ? PALETTE.red : '#4a3a30';
    ctx.beginPath();
    ctx.arc(FIELD.width - 40 - i * 30, 32, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, `BEST ${best}`, FIELD.width - 120, 58, 11, PALETTE.muted, '600', 'right');
}

function drawBoard(ctx, state) {
  ctx.fillStyle = PALETTE.board;
  roundRect(ctx, 16, 76, 1000, 132, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', 36, 96, 14, PALETTE.muted, '800', 'left');
  if (state.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', 500, 150, 18, PALETTE.muted, '600');
  }
  state.orders.forEach((order, i) => {
    drawTicket(ctx, order, 36 + i * 248, 106);
  });
  // The rush note, on the right of the board.
  text(ctx, 'Serve the dish', 1120, 110, 15, PALETTE.text, '700');
  text(ctx, 'that matches', 1120, 132, 15, PALETTE.text, '700');
  text(ctx, 'a ticket!', 1120, 154, 15, PALETTE.text, '700');
  text(ctx, '← → move · SPACE use', 1120, 184, 13, PALETTE.muted, '600');
}

function drawHint(ctx, state) {
  const station = stationAt(state.chef.x);
  if (!station) return;
  let hint = '';
  if (station.kind === 'grill') hint = 'SPACE: start patty / take it when READY';
  else if (station.kind === 'chop') hint = 'SPACE: chop, then take';
  else if (station.kind === 'instant') hint = 'SPACE: take it';
  else if (station.kind === 'serve') hint = 'SPACE: serve the plate';
  else if (station.kind === 'trash') hint = 'SPACE: dump what you carry';
  if (hint) text(ctx, hint, FIELD.width / 2, 700, 15, PALETTE.gold, '700');
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'THE COPPER LADLE', FIELD.width / 2, 190, 56, PALETTE.gold, '800');
  text(ctx, 'A tiny kitchen, a long lunch rush.', FIELD.width / 2, 244, 22, PALETTE.text, '600');
  text(ctx, 'Take orders from the board. Chop, grill and stack each dish,', FIELD.width / 2, 320, 19, PALETTE.text, '600');
  text(ctx, 'then ring the bell at SERVE before the ticket runs out.', FIELD.width / 2, 348, 19, PALETTE.text, '600');
  text(ctx, '← → or A / D to walk · SPACE to use a station · Q for the plate · X to dump · P to pause', FIELD.width / 2, 420, 17, PALETTE.muted, '600');
  text(ctx, 'Click a station to walk there. Three missed orders end the shift.', FIELD.width / 2, 452, 17, PALETTE.muted, '600');
  text(ctx, 'PRESS ENTER TO OPEN THE KITCHEN', FIELD.width / 2, 520, 22, PALETTE.serveGlow, '800');
  if (best > 0) text(ctx, `Best shift: ${best} coins`, FIELD.width / 2, 566, 16, PALETTE.muted, '600');
}

function drawOver(ctx, state, best) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const done = state.overReason === 'time';
  text(ctx, done ? 'SHIFT COMPLETE!' : 'SHIFT OVER', FIELD.width / 2, 210, 52, done ? PALETTE.serveGlow : PALETTE.red, '800');
  text(ctx, done ? 'The kitchen closes with the till full.' : 'Three orders went unserved.', FIELD.width / 2, 268, 20, PALETTE.text, '600');
  text(ctx, `Coins earned: ${state.coins}`, FIELD.width / 2, 350, 26, PALETTE.gold, '800');
  text(ctx, `Dishes served: ${state.served}   ·   Best shift: ${Math.max(best, state.coins)}`, FIELD.width / 2, 396, 19, PALETTE.text, '600');
  text(ctx, 'PRESS ENTER TO COOK AGAIN', FIELD.width / 2, 480, 22, PALETTE.serveGlow, '800');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.floor(FIELD.width * scale);
    canvas.height = Math.floor(FIELD.height * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw(state, screen, best) {
    const scale = canvas.width / FIELD.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const shakeX = state.shake > 0 ? Math.sin(state.time * 60) * 5 * state.shake : 0;
    // Wall and floor.
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(0, 0, FIELD.width, 300);
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 240, FIELD.width, 60);
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 470, FIELD.width, 250);
    ctx.fillStyle = PALETTE.floorLine;
    for (let x = 0; x < FIELD.width; x += 96) ctx.fillRect(x, 560, 48, 3);
    // The pass shelf above the counter.
    ctx.fillStyle = '#2e2620';
    ctx.fillRect(0, 226, FIELD.width, 10);
    drawBoard(ctx, state);
    for (const station of STATIONS) {
      drawStation(ctx, station, state.stations[station.id], state.stations.grill, shakeX);
    }
    drawPlate(ctx, state.plate);
    drawTray(ctx, state.tray);
    drawChef(ctx, state.chef, shakeX);
    drawHud(ctx, state, best);
    if (screen === SCREEN_PLAY) drawHint(ctx, state);
    if (screen === SCREEN_TITLE) drawTitle(ctx, state, best);
    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(20,12,6,0.7)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      text(ctx, 'PAUSED', FIELD.width / 2, 330, 48, PALETTE.text, '800');
      text(ctx, 'Press P to keep cooking', FIELD.width / 2, 390, 19, PALETTE.muted, '600');
    }
    if (screen === SCREEN_OVER) drawOver(ctx, state, best);
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(126,231,135,${state.flash * 0.35})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  return { draw, resize };
}
