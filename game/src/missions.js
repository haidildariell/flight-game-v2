// missions.js — the three sorties. Each mission places rings along
// the route and names its goal; the campaign is won one sortie
// at a time. Rings are scored on passing through the hoop.
export const MISSIONS = [
  {
    id: 1,
    name: 'Ring Run — Selat Banda',
    brief: 'Terbang melewati 5 ring penyelamat di atas selat.',
    fuel: 100,
    wind: 0,
    rings: [
      { x: 1400, alt: 120, z: 0 },
      { x: 3200, alt: 180, z: -30 },
      { x: 5000, alt: 140, z: 25 },
      { x: 6800, alt: 200, z: -15 },
      { x: 8600, alt: 150, z: 10 },
    ],
    needsLanding: false,
  },
  {
    id: 2,
    name: 'Medicine Run — Pulau Landas',
    brief: 'Antar obat lewat 3 ring, lalu mendarat di landasan.',
    fuel: 100,
    wind: 0,
    rings: [
      { x: 2400, alt: 150, z: 20 },
      { x: 5800, alt: 170, z: -20 },
      { x: 8800, alt: 130, z: 0 },
    ],
    needsLanding: true,
  },
  {
    id: 3,
    name: 'Storm Rescue — Badai Timur',
    brief: 'Lewati 5 ring di tengah badai, hemat fuel, lalu mendarat.',
    fuel: 62,
    wind: 9,
    rings: [
      { x: 1800, alt: 160, z: -25 },
      { x: 3600, alt: 210, z: 30 },
      { x: 5400, alt: 150, z: -35 },
      { x: 7400, alt: 190, z: 15 },
      { x: 9200, alt: 140, z: -10 },
    ],
    needsLanding: true,
  },
];

export const RING_RADIUS = 42; // metres: pass if |alt - ring.alt| and |z - ring.z| fit
export const RING_POINTS = 100;
export const LANDING_POINTS = 250;

export function newMissionState(mission) {
  return {
    mission,
    ringIndex: 0,
    ringsHit: 0,
    score: 0,
    message: mission.brief,
    messageTime: 0,
    finished: false,
    gustPhase: 0,
  };
}

// Check the next ring. Returns 'hit' | 'miss' | null.
export function checkRing(state, plane) {
  const ring = state.mission.rings[state.ringIndex];
  if (!ring) return null;
  if (plane.x < ring.x) return null;
  const dAlt = Math.abs(plane.alt - ring.alt);
  const dZ = Math.abs(plane.lateral - ring.z);
  state.ringIndex++;
  if (dAlt < RING_RADIUS && dZ < RING_RADIUS) {
    state.ringsHit++;
    const centred = dAlt < 18 && dZ < 18;
    state.score += centred ? RING_POINTS + 50 : RING_POINTS;
    state.message = centred ? 'RING TEPAT DI TENGAH! +150' : 'RING DILEWATI! +100';
    state.messageTime = 2.2;
    return 'hit';
  }
  state.message = 'RING TERLEWAT — lanjut ke ring berikut';
  state.messageTime = 2.2;
  return 'miss';
}

export function missionComplete(state, plane) {
  const m = state.mission;
  if (state.ringIndex < m.rings.length) return false;
  if (m.needsLanding) return plane.landed;
  return true;
}

export function finishScore(state, plane) {
  let bonus = 0;
  if (plane.landed) bonus += LANDING_POINTS;
  bonus += Math.round(plane.fuel);
  return state.score + bonus;
}
