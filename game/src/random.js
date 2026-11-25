// A small seeded random source (mulberry32), so a screenshot seed always plays
// the same shift: the same orders, in the same order, at the same moments.

export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    /** A whole number from 0 to `count - 1`. */
    int(count) {
      return Math.floor(next() * count);
    },
    /** A number in [min, max). */
    range(min, max) {
      return min + next() * (max - min);
    },
    /** One element of `list`, uniformly. */
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
  };
}
