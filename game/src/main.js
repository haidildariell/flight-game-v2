// main.js — game loop and state machine for Banda Sea Rescue.
// Modes: title → fly ⇄ paused → crashed | complete.
// A demo query (?demo=cruise|ring|landing|menu) stages a scene
// and flies it on autopilot, so screenshots are real renders of
// the game playing itself.
import { buildWorld } from './world.js';
import { newPlane, stepFlight, PLANE } from './flight.js';
import { MISSIONS, newMissionState, checkRing, missionComplete, finishScore } from './missions.js';
import { makeCamera, render, drawTitleScreen } from './render.js';
import { makeAudio } from './audio.js';
import { makeInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const world = buildWorld();
const camera = makeCamera();
const audio = makeAudio();
const input = makeInput();
input.attachClick(canvas);

const params = new URLSearchParams(location.search);
const demo = params.get('demo') || '';

let mode = 'title';
let selected = 0;
let plane = newPlane();
let missionState = newMissionState(MISSIONS[0]);
let finalScore = 0;
let crashCause = '';
let time = 0;
let last = performance.now();

// Autopilot: holds altitude and steers the lateral offset toward
// the next ring. Only used in demo mode for screenshots.
function autopilot(dt) {
  const st = missionState;
  const ring = st.mission.rings[st.ringIndex];
  const wantAlt = ring ? ring.alt : 150;
  const wantZ = ring ? ring.z : 0;
  const keys = input.state;
  keys.throttleUp = plane.throttle < 0.6;
  keys.throttleDown = plane.throttle > 0.65;
  keys.pitchUp = plane.alt < wantAlt - 6;
  keys.pitchDown = plane.alt > wantAlt + 6;
  const headingErr = plane.lateral < wantZ - 4 ? 8 : plane.lateral > wantZ + 4 ? -8 : 0;
  const wantHeading = 90 + headingErr;
  let diff = ((wantHeading - plane.heading + 540) % 360) - 180;
  keys.bankRight = diff > 1.5;
  keys.bankLeft = diff < -1.5;
  if (demo === 'landing') {
    keys.throttleUp = plane.throttle < 0.35;
    keys.throttleDown = plane.throttle > 0.4;
    keys.pitchDown = plane.alt > 46;
    keys.pitchUp = plane.alt < 40;
    if (!plane.gear && plane.x > 9800) plane.gear = true;
  }
}

function startMission(i) {
  selected = i;
  plane = newPlane();
  plane.fuel = MISSIONS[i].fuel;
  missionState = newMissionState(MISSIONS[i]);
  finalScore = 0;
  crashCause = '';
  mode = 'fly';
}

function stageDemo() {
  // Place the plane in the middle of the action for each shot.
  if (demo === 'menu') {
    mode = 'title';
    return;
  }
  startMission(demo === 'landing' ? 1 : 0);
  if (demo === 'cruise') {
    plane.x = 1100;
    plane.alt = 120;
  } else if (demo === 'ring') {
    plane.x = 1250;
    plane.alt = 118;
    plane.lateral = 0;
  } else if (demo === 'landing') {
    plane.x = 9900;
    plane.alt = 60;
    plane.speed = 40;
    plane.gear = true;
    // The shot stages the final approach: the three rings of this
    // sortie are already flown, so the HUD shows the progress.
    missionState.ringIndex = 3;
    missionState.ringsHit = 3;
    missionState.score = 300;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  const keys = input.state;

  if (demo) autopilot(dt);

  if (mode === 'title') {
    if (keys.digit >= 1 && keys.digit <= 3) startMission(keys.digit - 1);
    else if (keys.start) startMission(selected);
    else if (keys.click) {
      const y = keys.click.y;
      const idx = Math.floor((y - 290) / 74);
      if (idx >= 0 && idx < 3) startMission(idx);
    }
    render(ctx, { plane, world, missionState, camera, time, mode, missions: MISSIONS, selected });
  } else if (mode === 'fly') {
    audio.unlock();
    const wind = missionState.mission.wind * Math.sin(time * 0.4) * 0.6;
    const events = stepFlight(plane, keys, dt, world, wind);
    for (const ev of events) {
      if (ev === 'gear-down' || ev === 'gear-up') audio.ring();
      if (ev === 'landed' || ev === 'hard-landing') audio.land();
      if (ev.startsWith('crash')) audio.crash();
    }
    const ringEv = checkRing(missionState, plane);
    if (ringEv === 'hit') audio.ring();
    if (missionState.messageTime > 0) missionState.messageTime -= dt;
    audio.engine(plane.throttle, plane.speed);
    if (plane.crashed) {
      mode = 'crashed';
      crashCause = plane.crashCause;
    } else if (missionComplete(missionState, plane)) {
      finalScore = finishScore(missionState, plane);
      missionState.score = finalScore;
      missionState.finished = true;
      mode = 'complete';
    }
    if (keys.pauseToggle) mode = 'paused';
    render(ctx, { plane, world, missionState, camera, time, mode, missions: MISSIONS, selected });
  } else if (mode === 'paused') {
    if (keys.pauseToggle || keys.start) mode = 'fly';
    render(ctx, { plane, world, missionState, camera, time, mode, missions: MISSIONS, selected });
  } else if (mode === 'crashed' || mode === 'complete') {
    if (keys.restart) startMission(selected);
    else if (keys.menu) { mode = 'title'; plane = newPlane(); missionState = newMissionState(MISSIONS[selected]); }
    else if (keys.next && mode === 'complete') startMission((selected + 1) % MISSIONS.length);
    render(ctx, {
      plane, world, missionState, camera, time, mode,
      missions: MISSIONS, selected, finalScore, crashCause,
    });
  }

  input.consumeEdges();
  requestAnimationFrame(frame);
}

// Expose a tiny probe for automated play-testing (CDP).
window.__game = {
  mode: () => mode,
  plane: () => ({ x: plane.x, alt: plane.alt, speed: plane.speed, fuel: plane.fuel, damage: plane.damage, crashed: plane.crashed, landed: plane.landed }),
  mission: () => ({ ringsHit: missionState.ringsHit, ringIndex: missionState.ringIndex, score: missionState.score }),
};

if (demo) stageDemo();
requestAnimationFrame(frame);
