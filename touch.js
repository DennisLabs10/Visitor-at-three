export function isTouchDevice() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

export function setupTouchControls(player, story) {
  document.body.classList.add('touch-device');

  const joyBase = document.getElementById('joyBase');
  const joyThumb = document.getElementById('joyThumb');
  const lookZone = document.getElementById('lookZone');
  const jumpBtn = document.getElementById('jumpBtn');
  const crouchBtn = document.getElementById('crouchBtn');
  const interactBtn = document.getElementById('interactBtnMobile');

  const JOY_RADIUS = 45;
  let joyTouchId = null;
  let joyOrigin = { x: 0, y: 0 };
  let lookTouchId = null;
  let lookLast = { x: 0, y: 0 };

  function setDir(mx, mz) {
    player.keys['ArrowLeft'] = mx < -0.3;
    player.keys['ArrowRight'] = mx > 0.3;
    player.keys['ArrowUp'] = mz < -0.3;
    player.keys['ArrowDown'] = mz > 0.3;
  }

  joyBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (joyTouchId !== null) return;
    const t = e.changedTouches[0];
    joyTouchId = t.identifier;
    const rect = joyBase.getBoundingClientRect();
    joyOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, { passive: false });

  lookZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (lookTouchId !== null) return;
    const t = e.changedTouches[0];
    lookTouchId = t.identifier;
    lookLast = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) {
        e.preventDefault();
        let dx = t.clientX - joyOrigin.x;
        let dy = t.clientY - joyOrigin.y;
        const len = Math.hypot(dx, dy);
        if (len > JOY_RADIUS) { dx = (dx / len) * JOY_RADIUS; dy = (dy / len) * JOY_RADIUS; }
        joyThumb.style.transform = `translate(${dx}px, ${dy}px)`;
        setDir(dx / JOY_RADIUS, dy / JOY_RADIUS);
      } else if (t.identifier === lookTouchId) {
        e.preventDefault();
        const dx = t.clientX - lookLast.x;
        const dy = t.clientY - lookLast.y;
        lookLast = { x: t.clientX, y: t.clientY };
        player.look(dx * 1.6, dy * 1.6);
      }
    }
  }, { passive: false });

  function endTouch(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) {
        joyTouchId = null;
        joyThumb.style.transform = 'translate(0px, 0px)';
        setDir(0, 0);
      } else if (t.identifier === lookTouchId) {
        lookTouchId = null;
      }
    }
  }
  document.addEventListener('touchend', endTouch, { passive: false });
  document.addEventListener('touchcancel', endTouch, { passive: false });

  jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.keys['Space'] = true;
  }, { passive: false });
  jumpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    player.keys['Space'] = false;
  }, { passive: false });

  crouchBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    player.keys['ShiftLeft'] = true;
  }, { passive: false });
  crouchBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    player.keys['ShiftLeft'] = false;
  }, { passive: false });
  crouchBtn.addEventListener('touchcancel', (e) => {
    player.keys['ShiftLeft'] = false;
  }, { passive: false });

  interactBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    story.onKeyE();
  }, { passive: false });
}
