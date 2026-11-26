// audio.js — tiny WebAudio synth: engine hum that follows the
// throttle, a chime for rings, a thud for landings. Created lazily
// on the first key press, so the page never needs autoplay.
export function makeAudio() {
  let ctx = null;
  let master = null;
  let engine = null;
  let engineGain = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.12;
      master.connect(ctx.destination);
      engine = ctx.createOscillator();
      engine.type = 'sawtooth';
      engine.frequency.value = 55;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0.0;
      engine.connect(engineGain);
      engineGain.connect(master);
      engine.start();
      return true;
    } catch (e) {
      return false;
    }
  }

  function blip(freq, dur, type, vol) {
    if (!ensure()) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(master);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  return {
    unlock() {
      ensure();
    },
    // Call every frame: the hum tracks throttle and speed.
    engine(throttle, speed) {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
      engine.frequency.setTargetAtTime(48 + throttle * 70 + speed * 0.4, ctx.currentTime, 0.1);
      engineGain.gain.setTargetAtTime(0.05 + throttle * 0.09, ctx.currentTime, 0.1);
    },
    ring() {
      blip(880, 0.35, 'sine', 0.3);
      setTimeout(() => blip(1318, 0.4, 'sine', 0.22), 90);
    },
    land() {
      blip(160, 0.3, 'triangle', 0.35);
    },
    crash() {
      if (!ensure()) return;
      const len = ctx.sampleRate * 0.5;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = 0.4;
      src.connect(g);
      g.connect(master);
      src.start();
    },
  };
}
