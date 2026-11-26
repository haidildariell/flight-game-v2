// flight.js — the seaplane's flight model.
// The plane flies a route eastwards: x is distance along the route,
// alt is metres above the sea, heading steers a lateral offset z
// that decides whether a ring is really flown through.
// Speed comes from the throttle, lift from speed and pitch.
import { SEA_LEVEL } from './world.js';

export const PLANE = {
  maxSpeed: 92, // m/s at full throttle
  minFlySpeed: 26, // below this the wing stops lifting
  climbRate: 9.5, // m/s at best climb
  sinkRate: 7.0, // m/s sinking with no lift
  turnRate: 26, // deg/s at full bank
  fuelBurn: 0.55, // % per second at full throttle
  cruiseBurn: 0.16, // % per second at idle
  maxDamage: 100,
};

export function newPlane() {
  return {
    x: 120,
    alt: 60,
    vspeed: 0,
    speed: 42,
    heading: 90, // route heading is east, 090
    lateral: 0, // metres off the route centreline
    throttle: 0.55,
    pitch: 0, // -1 dive .. +1 climb
    bank: 0, // -1 left .. +1 right
    gear: false,
    fuel: 100,
    damage: 0,
    crashed: false,
    landed: false,
    crashCause: '',
  };
}

// One physics step. dt is seconds. wind is a lateral push in m/s
// (storm gusts). Returns a list of event strings for the frame.
export function stepFlight(p, input, dt, world, wind) {
  const events = [];
  if (p.crashed || p.landed) return events;

  // Throttle: W/S, clamped 0..1.
  p.throttle = Math.min(1, Math.max(0, p.throttle + (input.throttleUp ? 0.55 : 0) * dt + (input.throttleDown ? -0.55 : 0) * dt));
  // Pitch: ArrowUp climbs, ArrowDown dives.
  const targetPitch = (input.pitchUp ? 1 : 0) + (input.pitchDown ? -1 : 0);
  p.pitch += (targetPitch - p.pitch) * Math.min(1, dt * 6);
  // Bank: ArrowLeft/Right. Bank turns the heading.
  const targetBank = (input.bankRight ? 1 : 0) + (input.bankLeft ? -1 : 0);
  p.bank += (targetBank - p.bank) * Math.min(1, dt * 5);
  p.heading = (p.heading + p.bank * PLANE.turnRate * dt + 360) % 360;

  // Gear: G toggles (handled by caller through input.gearToggle).
  if (input.gearToggle) {
    p.gear = !p.gear;
    events.push(p.gear ? 'gear-down' : 'gear-up');
  }

  // Speed chases the throttle setting.
  const targetSpeed = 12 + p.throttle * (PLANE.maxSpeed - 12);
  p.speed += (targetSpeed - p.speed) * Math.min(1, dt * 0.8);

  // Lift: enough speed + pitch climbs, too slow sinks.
  const lift = Math.max(0, (p.speed - PLANE.minFlySpeed) / (PLANE.maxSpeed - PLANE.minFlySpeed));
  const climb = p.pitch * PLANE.climbRate * lift;
  const sink = p.speed < PLANE.minFlySpeed ? PLANE.sinkRate * (1 - p.speed / PLANE.minFlySpeed) : 0.6;
  p.vspeed += (climb - sink - p.vspeed) * Math.min(1, dt * 2.2);
  p.alt += p.vspeed * dt;

  // Forward motion, and lateral drift from heading error + wind.
  const headingErr = ((p.heading - 90 + 540) % 360) - 180;
  p.x += p.speed * dt;
  p.lateral += (Math.sin((headingErr * Math.PI) / 180) * p.speed + wind) * dt;

  // Fuel: throttle-heavy flying drinks the tank.
  p.fuel -= (PLANE.cruiseBurn + p.throttle * PLANE.fuelBurn) * dt;
  if (p.fuel <= 0) {
    p.fuel = 0;
    p.throttle = Math.max(0, p.throttle - dt * 0.5);
    events.push('fuel-empty');
  }

  // Ground contact.
  const ground = Math.max(SEA_LEVEL, world.terrainHeight(p.x));
  const isRunway = p.x > world.runway.x0 && p.x < world.runway.x1;
  if (p.alt <= ground + 0.5) {
    p.alt = ground;
    if (isRunway && p.gear && Math.abs(p.vspeed) < 4.5 && p.speed < 48 && Math.abs(p.lateral) < 18) {
      p.landed = true;
      events.push('landed');
    } else if (isRunway && p.gear && Math.abs(p.vspeed) < 8 && p.speed < 55) {
      // Hard but survivable runway touchdown.
      p.damage += 22;
      p.landed = p.damage < PLANE.maxDamage;
      events.push(p.landed ? 'hard-landing' : 'crash-hard-landing');
      if (!p.landed) { p.crashed = true; p.crashCause = 'Pendaratan terlalu keras'; }
    } else if (ground <= SEA_LEVEL + 0.5) {
      p.crashed = true;
      p.damage = PLANE.maxDamage;
      p.crashCause = 'Mendarat di laut tanpa landasan';
      events.push('crash-water');
    } else {
      p.crashed = true;
      p.damage = PLANE.maxDamage;
      p.crashCause = 'Menabrak daratan';
      events.push('crash-terrain');
    }
  }
  return events;
}
