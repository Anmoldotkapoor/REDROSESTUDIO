export function nextHeroIndex(index, direction, count) {
  return count ? ((index + direction) % count + count) % count : 0;
}

export function createHeroSwipe({ stage, image, step, motionAllowed, win = window }) {
  let gesture = null;
  let suppressClick = false;
  function finish() {
    if (gesture) {
      try { if (stage.hasPointerCapture?.(gesture.id)) stage.releasePointerCapture(gesture.id); } catch {}
    }
    gesture = null;
    stage.classList.remove('is-swiping');
    stage.style.removeProperty('--hero-swipe-x');
  }
  function down(event) {
    suppressClick = false;
    if (gesture || event.isPrimary === false || event.pointerType === 'mouse' && event.button !== 0 || event.target?.closest?.('button,a,input,select,textarea')) return;
    gesture = { id:event.pointerId, x:event.clientX, y:event.clientY, dx:0, dy:0, horizontal:false };
  }
  function move(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    gesture.dx = event.clientX - gesture.x;
    gesture.dy = event.clientY - gesture.y;
    const x = Math.abs(gesture.dx), y = Math.abs(gesture.dy);
    if (!gesture.horizontal && y > 12 && y > x) { finish(); return; }
    if (x > 12 && x > y * 1.25) {
      gesture.horizontal = true;
      try { if (!stage.hasPointerCapture?.(gesture.id)) stage.setPointerCapture?.(gesture.id); } catch {}
      if (event.cancelable) event.preventDefault();
      stage.classList.add('is-swiping');
      if (motionAllowed()) stage.style.setProperty('--hero-swipe-x', `${Math.max(-45, Math.min(45, gesture.dx * .15))}px`);
    }
  }
  function up(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    const swipe = Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy) * 1.25;
    finish();
    if (swipe) { suppressClick = true; step(dx < 0 ? 1 : -1); }
  }
  function cancel(event) { if (gesture?.id === event.pointerId) finish(); }
  stage.addEventListener('pointerdown', down);
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', cancel);
  stage.addEventListener('lostpointercapture', cancel);
  stage.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
  stage.addEventListener('keydown', event => {
    if (event.target !== stage || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1);
  });
  image.draggable = false;
  image.addEventListener('dragstart', event => event.preventDefault());
  win.addEventListener('blur', finish);
  // Older iOS browsers without Pointer Events still support the same swipe gesture.
  if (!win.PointerEvent) {
    const pointer = (touch, event) => ({ pointerId:touch.identifier, pointerType:'touch', clientX:touch.clientX, clientY:touch.clientY, target:event.target, isPrimary:true, cancelable:event.cancelable, preventDefault:()=>event.preventDefault() });
    stage.addEventListener('touchstart', event => { if (event.touches.length === 1) down(pointer(event.changedTouches[0], event)); else finish(); }, { passive:true });
    stage.addEventListener('touchmove', event => { const touch = [...event.touches].find(t => t.identifier === gesture?.id); if (touch) move(pointer(touch,event)); }, { passive:false });
    stage.addEventListener('touchend', event => { const touch = [...event.changedTouches].find(t => t.identifier === gesture?.id); if (touch) up(pointer(touch,event)); }, { passive:true });
    stage.addEventListener('touchcancel', finish, { passive:true });
  }
  return { cancel:finish };
}
