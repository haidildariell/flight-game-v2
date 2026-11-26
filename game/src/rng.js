// rng.js — deterministic random numbers for the Banda Sea world.
// Every number the world draws comes from a fixed seed, so the same
// build always draws the same islands, clouds and ring layout.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth 1D value noise: pick() gives a stable pseudo-random value
// for an integer lattice point, lerp blends between neighbours.
export function makeNoise(seed) {
  const rand = mulberry32(seed);
  const table = new Float64Array(512);
  for (let i = 0; i < 512; i++) table[i] = rand();
  const pick = (i) => table[((i % 512) + 512) % 512];
  const smooth = (t) => t * t * (3 - 2 * t);
  return function noise(x) {
    const i = Math.floor(x);
    const f = x - i;
    return pick(i) + (pick(i + 1) - pick(i)) * smooth(f);
  };
}

// Range helper: rand in [lo, hi).
export function range(rand, lo, hi) {
  return lo + rand() * (hi - lo);
}
