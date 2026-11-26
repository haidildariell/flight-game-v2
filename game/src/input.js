// input.js — keyboard (and click) input for the seaplane.
// Holds the live key state; the game loop reads it each frame.
// Edge-triggered actions (gear, pause, restart) are consumed once.
export function makeInput() {
  const keys = {};
  const pressed = {};

  const state = {
    throttleUp: false,
    throttleDown: false,
    pitchUp: false,
    pitchDown: false,
    bankLeft: false,
    bankRight: false,
    gearToggle: false,
    pauseToggle: false,
    restart: false,
    menu: false,
    next: false,
    start: false,
    digit: 0,
    click: null,
  };

  function refresh() {
    state.throttleUp = !!keys['KeyW'];
    state.throttleDown = !!keys['KeyS'];
    state.pitchUp = !!keys['ArrowUp'];
    state.pitchDown = !!keys['ArrowDown'];
    state.bankLeft = !!keys['ArrowLeft'];
    state.bankRight = !!keys['ArrowRight'];
  }

  function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (pressed[e.code]) return;
    pressed[e.code] = true;
    keys[e.code] = true;
    if (e.code === 'KeyG') state.gearToggle = true;
    if (e.code === 'KeyP') state.pauseToggle = true;
    if (e.code === 'KeyR') state.restart = true;
    if (e.code === 'KeyM') state.menu = true;
    if (e.code === 'KeyN') state.next = true;
    if (e.code === 'Enter') state.start = true;
    if (e.code === 'Digit1') state.digit = 1;
    if (e.code === 'Digit2') state.digit = 2;
    if (e.code === 'Digit3') state.digit = 3;
    refresh();
  }

  function onKeyUp(e) {
    pressed[e.code] = false;
    keys[e.code] = false;
    refresh();
  }

  function onClick(e) {
    const rect = e.target.getBoundingClientRect();
    state.click = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    state,
    // Call once per frame after the game has read the edge flags.
    consumeEdges() {
      state.gearToggle = false;
      state.pauseToggle = false;
      state.restart = false;
      state.menu = false;
      state.next = false;
      state.start = false;
      state.digit = 0;
      state.click = null;
    },
    attachClick(canvas) {
      canvas.addEventListener('click', onClick);
    },
  };
}
