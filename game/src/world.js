// world.js — the Banda Sea archipelago: terrain height, islands,
// the volcano, the lighthouse rock and the landing strip.
// All shapes come from a fixed seed, so the world never changes
// between runs or screenshots.
import { mulberry32, makeNoise, range } from './rng.js';

export const SEA_LEVEL = 0;
export const WORLD_SEED = 20261126;

export function buildWorld() {
  const rand = mulberry32(WORLD_SEED);
  const hills = makeNoise(WORLD_SEED + 7);
  const palms = makeNoise(WORLD_SEED + 21);

  // Islands along the route: each has a centre x, a half-width and a
  // peak height. The runway island is flattened on top by hand.
  const islands = [
    { x: 0, half: 520, peak: 46, name: 'Pulau Start' },
    { x: 2600, half: 700, peak: 120, name: 'Gunung Api', volcano: true },
    { x: 5200, half: 560, peak: 70, name: 'Pulau Karang' },
    { x: 7900, half: 640, peak: 88, name: 'Pulau Mercusuar', lighthouse: true },
    { x: 10600, half: 900, peak: 34, name: 'Pulau Landas', runway: true },
    { x: 13400, half: 760, peak: 140, name: 'Gunung Besar', volcano: true },
    { x: 16200, half: 620, peak: 60, name: 'Pulau Timur' },
  ];

  // The landing strip sits on the flat top of Pulau Landas.
  const runway = { x0: 10200, x1: 11000, y: 34 };

  // Palm trees: fixed spots on each island, away from the runway.
  const trees = [];
  for (const isl of islands) {
    const n = Math.floor(range(rand, 6, 12));
    for (let i = 0; i < n; i++) {
      const tx = isl.x + range(rand, -isl.half * 0.9, isl.half * 0.9);
      if (isl.runway && tx > runway.x0 - 80 && tx < runway.x1 + 80) continue;
      trees.push({ x: tx, s: range(rand, 0.7, 1.3), lean: range(rand, -0.2, 0.2) });
    }
  }

  // Drifting clouds: fixed lanes in the sky.
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    clouds.push({
      x: range(rand, -500, 17500),
      y: range(rand, 380, 720),
      w: range(rand, 120, 320),
      s: range(rand, 0.5, 1.1),
    });
  }

  // Terrain height in metres above the sea at route position x.
  function terrainHeight(x) {
    let h = 0;
    for (const isl of islands) {
      const d = Math.abs(x - isl.x) / isl.half;
      if (d >= 1) continue;
      const bump = Math.cos(d * Math.PI * 0.5);
      let peak = isl.peak * bump * bump;
      if (isl.runway) {
        // Flatten the strip: full height only outside the runway span.
        const edge = Math.max(0, (Math.abs(x - 10600) - 400) / 500);
        peak = isl.peak * Math.min(1, edge) * bump * bump;
        if (x > runway.x0 && x < runway.x1) peak = runway.y;
      }
      h = Math.max(h, peak);
    }
    // Gentle rolling between islands so the sea line never looks flat.
    h += hills(x / 900) * 6;
    return h;
  }

  function islandAt(x) {
    for (const isl of islands) {
      if (Math.abs(x - isl.x) < isl.half) return isl;
    }
    return null;
  }

  return {
    islands,
    runway,
    trees,
    clouds,
    terrainHeight,
    islandAt,
    // Palm sway phase for a given tree (pure function of x).
    palmSway: (x) => palms(x / 37) * 0.12,
  };
}
