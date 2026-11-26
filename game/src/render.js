// render.js — every pixel of Banda Sea Rescue: dusk sky, sea,
// islands, volcano, lighthouse, runway, rings, the seaplane and
// the HUD. The camera chases the plane; the world scrolls past.
import { SEA_LEVEL } from './world.js';

const W = 1280;
const H = 720;
const PLANE_SX = 430;
const SCALE_X = 0.55; // px per metre along the route
const SCALE_Y = 1.05; // px per metre of altitude

export function makeCamera() {
  return { alt: 90 };
}

function skyGradient(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d3a5f');
  g.addColorStop(0.45, '#e8835a');
  g.addColorStop(0.62, '#f7b267');
  g.addColorStop(0.75, '#2e6f7e');
  g.addColorStop(1, '#123a4a');
  return g;
}

function drawSky(ctx, time, camAlt) {
  ctx.fillStyle = skyGradient(ctx);
  ctx.fillRect(0, 0, W, H);
  // Low sun over the strait.
  const sunY = 300 - camAlt * 0.02;
  const sg = ctx.createRadialGradient(1010, sunY, 8, 1010, sunY, 130);
  sg.addColorStop(0, 'rgba(255, 236, 180, 0.95)');
  sg.addColorStop(0.4, 'rgba(255, 190, 110, 0.55)');
  sg.addColorStop(1, 'rgba(255, 190, 110, 0)');
  ctx.fillStyle = sg;
  ctx.fillRect(880, sunY - 140, 260, 280);
  ctx.fillStyle = '#ffe9b0';
  ctx.beginPath();
  ctx.arc(1010, sunY, 34, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx, world, plane, camAlt) {
  ctx.fillStyle = 'rgba(255, 235, 220, 0.75)';
  for (const c of world.clouds) {
    const sx = PLANE_SX + (c.x - plane.x) * SCALE_X * 0.9;
    if (sx < -260 || sx > W + 260) continue;
    const sy = 640 - (c.y - camAlt) * SCALE_Y * 0.55;
    ctx.beginPath();
    ctx.ellipse(sx, sy, c.w * c.s, 16 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(sx + c.w * 0.28, sy + 6, c.w * 0.6 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSea(ctx, camAlt) {
  const horizon = 640 - camAlt * SCALE_Y * 0.55;
  const g = ctx.createLinearGradient(0, horizon, 0, H);
  g.addColorStop(0, '#2e7f8f');
  g.addColorStop(0.25, '#1d5a6e');
  g.addColorStop(1, '#0d2f3f');
  ctx.fillStyle = g;
  ctx.fillRect(0, horizon, W, H - horizon);
  // Sun glitter on the water.
  ctx.fillStyle = 'rgba(255, 210, 140, 0.35)';
  for (let i = 0; i < 26; i++) {
    const x = ((i * 173 + 960) % 1280);
    const y = horizon + 14 + ((i * 61) % 70);
    ctx.fillRect(x, y, 42 - (i % 3) * 10, 2);
  }
  return horizon;
}

function drawIslands(ctx, world, plane, camAlt, horizon, time) {
  const x0 = plane.x - PLANE_SX / SCALE_X - 100;
  const x1 = plane.x + (W - PLANE_SX) / SCALE_X + 100;
  for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) {
    const h = world.terrainHeight(x);
    if (h <= 0.5) continue;
    const sx = PLANE_SX + (x - plane.x) * SCALE_X;
    const sy = horizon - h * SCALE_Y * 0.55;
    const nextH = world.terrainHeight(x + 40);
    const nsx = PLANE_SX + (x + 40 - plane.x) * SCALE_X;
    const nsy = horizon - nextH * SCALE_Y * 0.55;
    ctx.fillStyle = '#1d4a2e';
    ctx.beginPath();
    ctx.moveTo(sx, horizon + 2);
    ctx.lineTo(sx, sy);
    ctx.lineTo(nsx, nsy);
    ctx.lineTo(nsx, horizon + 2);
    ctx.closePath();
    ctx.fill();
    // Sand rim where the hill meets the sea.
    if (h < 12) {
      ctx.fillStyle = '#d9b77c';
      ctx.fillRect(sx, horizon - 4, nsx - sx + 1, 5);
    }
  }
  // Volcano smoke.
  for (const isl of world.islands) {
    if (!isl.volcano) continue;
    const sx = PLANE_SX + (isl.x - plane.x) * SCALE_X;
    if (sx < -200 || sx > W + 200) continue;
    const topY = horizon - isl.peak * SCALE_Y * 0.55;
    ctx.fillStyle = 'rgba(220, 220, 220, 0.5)';
    for (let i = 0; i < 4; i++) {
      const ph = (time * 0.25 + i * 0.35) % 1;
      ctx.beginPath();
      ctx.arc(sx + i * 14 - 20, topY - 18 - ph * 70, 10 + ph * 16, 0, Math.PI * 2);
      ctx.fill();
    }
    // Glowing crater.
    ctx.fillStyle = '#ff7a2a';
    ctx.beginPath();
    ctx.ellipse(sx, topY + 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lighthouse with a slow rotating beam.
  for (const isl of world.islands) {
    if (!isl.lighthouse) continue;
    const sx = PLANE_SX + (isl.x - plane.x) * SCALE_X;
    if (sx < -100 || sx > W + 100) continue;
    const baseY = horizon - world.terrainHeight(isl.x) * SCALE_Y * 0.55;
    ctx.fillStyle = '#f2ede0';
    ctx.fillRect(sx - 7, baseY - 64, 14, 64);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(sx - 7, baseY - 52, 14, 8);
    ctx.fillRect(sx - 7, baseY - 28, 14, 8);
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(sx, baseY - 68, 6, 0, Math.PI * 2);
    ctx.fill();
    const ang = time * 0.7;
    const beam = ctx.createLinearGradient(sx, baseY - 68, sx + Math.cos(ang) * 260, baseY - 68 + Math.sin(ang) * 260);
    beam.addColorStop(0, 'rgba(255, 220, 90, 0.5)');
    beam.addColorStop(1, 'rgba(255, 220, 90, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(sx, baseY - 68);
    ctx.lineTo(sx + Math.cos(ang - 0.1) * 260, baseY - 68 + Math.sin(ang - 0.1) * 260);
    ctx.lineTo(sx + Math.cos(ang + 0.1) * 260, baseY - 68 + Math.sin(ang + 0.1) * 260);
    ctx.closePath();
    ctx.fill();
  }
  // Palm trees.
  for (const t of world.trees) {
    const sx = PLANE_SX + (t.x - plane.x) * SCALE_X;
    if (sx < -20 || sx > W + 20) continue;
    const gy = horizon - world.terrainHeight(t.x) * SCALE_Y * 0.55;
    const sway = world.palmSway(t.x) + Math.sin(time * 1.2 + t.x) * 0.05;
    ctx.strokeStyle = '#6b4a2a';
    ctx.lineWidth = 3 * t.s;
    ctx.beginPath();
    ctx.moveTo(sx, gy);
    ctx.quadraticCurveTo(sx + 6 * t.s, gy - 14 * t.s, sx + 10 * t.s + sway * 20, gy - 22 * t.s);
    ctx.stroke();
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2.5 * t.s;
    const tx = sx + 10 * t.s + sway * 20;
    const ty = gy - 22 * t.s;
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI * (0.15 + f * 0.18) + sway;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * 12 * t.s, ty + Math.sin(a) * 8 * t.s, tx + Math.cos(a) * 20 * t.s, ty + Math.sin(a) * 12 * t.s + 4);
      ctx.stroke();
    }
  }
  // Runway strip on Pulau Landas.
  const r = world.runway;
  const rsx0 = PLANE_SX + (r.x0 - plane.x) * SCALE_X;
  const rsx1 = PLANE_SX + (r.x1 - plane.x) * SCALE_X;
  if (rsx1 > -50 && rsx0 < W + 50) {
    const ry = horizon - r.y * SCALE_Y * 0.55;
    ctx.fillStyle = '#3a3f45';
    ctx.fillRect(rsx0, ry - 5, rsx1 - rsx0, 10);
    ctx.fillStyle = '#f5f5f5';
    for (let x = rsx0 + 20; x < rsx1 - 20; x += 46) {
      ctx.fillRect(x, ry - 1, 24, 2);
    }
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('LANDAS', (rsx0 + rsx1) / 2 - 30, ry - 12);
  }
}

function drawRings(ctx, plane, missionState, camAlt, horizon) {
  const st = missionState;
  st.mission.rings.forEach((ring, i) => {
    const sx = PLANE_SX + (ring.x - plane.x) * SCALE_X;
    if (sx < -160 || sx > W + 160) return;
    const sy = horizon - ring.alt * SCALE_Y * 0.55;
    const depth = Math.max(0.35, Math.min(1, 1 - (ring.x - plane.x) / 9000));
    const radius = 42 * SCALE_Y * 0.55 * (0.6 + depth * 0.6);
    const done = i < st.ringIndex;
    const next = i === st.ringIndex;
    ctx.save();
    ctx.globalAlpha = done ? 0.45 : 1;
    ctx.strokeStyle = done ? '#7ee787' : next ? '#ffb02e' : '#ff8c42';
    ctx.lineWidth = next ? 7 : 5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = next ? 18 : 8;
    ctx.beginPath();
    ctx.arc(sx, sy, Math.max(14, radius), 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(13, radius * 0.45)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(done ? '✓' : String(i + 1), sx, sy + radius * 0.18);
    ctx.restore();
  });
}

function drawPlane(ctx, plane, time, horizon) {
  const px = PLANE_SX;
  // Same vertical mapping as the world: the plane, the rings and the
  // terrain all sit at horizon - altitude * SCALE_Y * 0.55, so a ring
  // at the plane's altitude appears exactly at the plane's height.
  const py = horizon - plane.alt * SCALE_Y * 0.55;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(1.35, 1.35);
  ctx.rotate(plane.pitch * -0.28 + plane.bank * 0.35);
  // Twin floats.
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-34, 16, 66, 7);
  ctx.fillStyle = '#8e2f22';
  ctx.fillRect(-34, 16, 8, 10);
  // Fuselage.
  ctx.fillStyle = '#f2ede0';
  ctx.beginPath();
  ctx.moveTo(-46, 2);
  ctx.quadraticCurveTo(-30, -14, 6, -12);
  ctx.quadraticCurveTo(38, -10, 46, 0);
  ctx.quadraticCurveTo(30, 8, 0, 9);
  ctx.quadraticCurveTo(-30, 10, -46, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-40, 4);
  ctx.quadraticCurveTo(0, 8, 42, 1);
  ctx.stroke();
  // Lit cockpit windows.
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.moveTo(18, -10);
  ctx.lineTo(30, -8);
  ctx.lineTo(28, -2);
  ctx.lineTo(16, -3);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, -11);
  ctx.lineTo(14, -10);
  ctx.lineTo(13, -3);
  ctx.lineTo(5, -4);
  ctx.closePath();
  ctx.fill();
  // Wing + tail.
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.lineTo(14, -34);
  ctx.lineTo(22, -32);
  ctx.lineTo(6, -8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-44, -2);
  ctx.lineTo(-52, -20);
  ctx.lineTo(-44, -20);
  ctx.lineTo(-36, -4);
  ctx.closePath();
  ctx.fill();
  // Spinning propeller.
  const spin = time * 28;
  ctx.strokeStyle = 'rgba(40, 40, 40, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(46 + Math.cos(spin) * 16, Math.sin(spin) * 16);
  ctx.lineTo(46 - Math.cos(spin) * 16, -Math.sin(spin) * 16);
  ctx.moveTo(46 + Math.cos(spin + 1.57) * 16, Math.sin(spin + 1.57) * 16);
  ctx.lineTo(46 - Math.cos(spin + 1.57) * 16, -Math.sin(spin + 1.57) * 16);
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(46, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Gear-down hint: small wheels under the floats.
  if (plane.gear) {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(-20, 28, 5, 0, Math.PI * 2);
    ctx.arc(18, 28, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCompassTape(ctx, hdg) {
  const CARDINALS = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
  ctx.fillStyle = '#ffd94d';
  ctx.font = '13px monospace';
  ctx.textAlign = 'center';
  for (let d = -60; d <= 60; d += 30) {
    const a = (hdg + d + 360) % 360;
    const x = 400 + d * 2.4;
    ctx.fillText(CARDINALS[a] || String(a).padStart(3, '0'), x, 48);
  }
  // Caret on the current heading.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(400, 52);
  ctx.lineTo(394, 60);
  ctx.lineTo(406, 60);
  ctx.closePath();
  ctx.fill();
  ctx.textAlign = 'left';
}

function bar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * Math.min(1, Math.max(0, frac))), h - 2);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 4, y + h - 4);
}

function drawHud(ctx, plane, missionState, mode) {
  // Top strip.
  ctx.fillStyle = 'rgba(8, 20, 30, 0.72)';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`ALT ${Math.max(0, Math.round(plane.alt))} m`, 16, 26);
  ctx.fillText(`SPD ${Math.round(plane.speed * 3.6)} km/h`, 200, 26);
  const hdg = Math.round(plane.heading);
  ctx.fillText(`HDG ${String(hdg).padStart(3, '0')}°`, 400, 26);
  ctx.fillText(`SCORE ${missionState.score}`, 580, 26);
  // Compass tape: one label every 30 degrees, centred on its tick,
  // with a caret marking the current heading.
  drawCompassTape(ctx, hdg);
  // Fuel + damage bars.
  bar(ctx, 780, 14, 190, 18, plane.fuel / 100, plane.fuel < 25 ? '#ff5a3c' : '#7ee787', `FUEL ${Math.round(plane.fuel)}%`);
  bar(ctx, 780, 38, 190, 18, plane.damage / 100, '#ff5a3c', `DMG ${Math.round(plane.damage)}%`);
  // Gear + throttle.
  ctx.fillStyle = plane.gear ? '#7ee787' : '#bbb';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(plane.gear ? 'GEAR DOWN' : 'GEAR UP', 1000, 26);
  ctx.fillStyle = '#fff';
  ctx.fillText(`THR ${Math.round(plane.throttle * 100)}%`, 1000, 48);
  // Mission + rings.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(missionState.mission.name, 16, 88);
  let rx = 16;
  missionState.mission.rings.forEach((_, i) => {
    ctx.fillStyle = i < missionState.ringsHit ? '#7ee787' : i === missionState.ringIndex ? '#ffb02e' : 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(rx + 8, 104, 7, 0, Math.PI * 2);
    ctx.fill();
    rx += 22;
  });
  // Centre message.
  if (missionState.messageTime > 0) {
    ctx.fillStyle = 'rgba(8, 20, 30, 0.6)';
    const tw = ctx.measureText(missionState.message).width + 30;
    ctx.fillRect((W - tw) / 2, 120, tw, 34);
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(missionState.message, W / 2, 143);
    ctx.textAlign = 'left';
  }
  // Bottom hints.
  if (mode === 'fly') {
    ctx.fillStyle = 'rgba(8, 20, 30, 0.6)';
    ctx.fillRect(0, H - 26, W, 26);
    ctx.fillStyle = '#ddd';
    ctx.font = '13px monospace';
    ctx.fillText('W/S throttle · ↑/↓ pitch · ←/→ bank · G gear · P pause · R restart', 16, H - 8);
  }
}

export function drawTitleScreen(ctx, missions, selected) {
  ctx.fillStyle = 'rgba(6, 16, 26, 0.62)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffd94d';
  ctx.font = 'bold 58px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BANDA SEA RESCUE', W / 2, 130);
  ctx.fillStyle = '#fff';
  ctx.font = '22px monospace';
  ctx.fillText('Pilot amfibi di kepulauan Banda — lewati ring, antar bantuan, mendarat selamat.', W / 2, 172);
  ctx.font = 'bold 18px monospace';
  ctx.fillText('PILIH MISI  (klik atau tekan 1 / 2 / 3)', W / 2, 240);
  ctx.textAlign = 'left';
  missions.forEach((m, i) => {
    const y = 290 + i * 74;
    ctx.fillStyle = i === selected ? 'rgba(255, 176, 46, 0.9)' : 'rgba(255,255,255,0.14)';
    ctx.fillRect(340, y, 600, 58);
    ctx.fillStyle = i === selected ? '#1a1a1a' : '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`${i + 1}. ${m.name}`, 360, y + 24);
    ctx.font = '13px monospace';
    ctx.fillStyle = i === selected ? '#333' : '#ddd';
    ctx.fillText(m.brief, 360, y + 45);
  });
  ctx.fillStyle = '#ddd';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('W/S throttle · ↑/↓ pitch · ←/→ bank · G gear · P pause · R restart · Enter mulai', W / 2, 560);
  ctx.fillText('Terbang dengan keyboard. Misi 3 punya badai yang mendorong pesawat ke samping.', W / 2, 586);
  ctx.textAlign = 'left';
}

function drawEnd(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 16, 26, 0.68)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, W / 2, 250);
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 310 + i * 34));
  ctx.fillStyle = '#ddd';
  ctx.font = '15px monospace';
  ctx.fillText('Tekan R untuk terbang lagi · M untuk menu', W / 2, 480);
  ctx.textAlign = 'left';
}

export function render(ctx, view) {
  const { plane, world, missionState, camera, time, mode } = view;
  // Camera altitude chases the plane smoothly.
  camera.alt += (plane.alt - camera.alt) * 0.04;
  ctx.clearRect(0, 0, W, H);
  drawSky(ctx, time, camera.alt);
  drawClouds(ctx, world, plane, camera.alt);
  const horizon = drawSea(ctx, camera.alt);
  drawIslands(ctx, world, plane, camera.alt, horizon, time);
  drawRings(ctx, plane, missionState, camera.alt, horizon);
  drawPlane(ctx, plane, time, horizon);
  drawHud(ctx, plane, missionState, mode);
  if (mode === 'title') drawTitleScreen(ctx, view.missions, view.selected);
  if (mode === 'paused') {
    drawEnd(ctx, 'JEDA', ['Permainan dijeda.'], '#ffd94d');
  }
  if (mode === 'crashed') {
    drawEnd(ctx, 'PESAWAT JATUH', [view.crashCause || 'Pesawat hancur.', `Skor: ${missionState.score} · Ring: ${missionState.ringsHit}/${missionState.mission.rings.length}`], '#ff5a3c');
  }
  if (mode === 'complete') {
    drawEnd(ctx, 'MISI SELESAI!', [`Skor akhir: ${view.finalScore}`, `Ring: ${missionState.ringsHit}/${missionState.mission.rings.length} · Fuel tersisa ${Math.round(plane.fuel)}%`, 'Misi berikutnya: tekan N, atau R untuk ulang.'], '#7ee787');
  }
}
