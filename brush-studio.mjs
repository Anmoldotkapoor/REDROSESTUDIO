// Keep the reveal independent of canvas filters: iPhone Safari must paint the same mask.
export function createBrushStudio({ stage, canvas, image, cursor, size, prompt, status, toggle, revealButton, slider, splitControls, guide, motionAllowed, win = window }) {
  let ctx;
  try { ctx = canvas.getContext('2d', { willReadFrequently: true }); } catch { ctx = null; }
  const touchLayout = win.matchMedia('(max-width: 700px), (any-pointer: coarse)');
  let width = 0, height = 0, ratio = 1, frame = 0;
  let mode = 'brush', active = false, pointer = null, last = null;
  let strokes = [], stroke = null, revealed = false, ready = false;
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

  function stopPointer() {
    const id = pointer;
    pointer = null; last = null; stroke = null;
    try { if (id !== null && canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id); } catch {}
    stage.classList.remove('is-painting');
  }
  function syncControls() {
    const touch = touchLayout.matches;
    stage.classList.toggle('touch-studio', touch);
    stage.classList.toggle('brush-active', active && mode === 'brush');
    stage.classList.toggle('split-active', mode === 'split');
    win.document.body?.classList.toggle('brush-editing', touch && active && mode === 'brush');
    toggle.hidden = !touch || mode !== 'brush' || !ready || revealed;
    toggle.textContent = active ? 'Done brushing ✓' : strokes.length ? 'Continue brushing ↗' : 'Start brushing ↗';
    toggle.setAttribute('aria-pressed', String(active));
    splitControls.hidden = mode !== 'split';
    revealButton.disabled = !ready;
    slider.disabled = !ready;
    guide.hidden = mode !== 'split';
    cursor.hidden = !ready || revealed || mode !== 'brush' || touch && !active;
    canvas.style.pointerEvents = mode === 'split' || (touch && !active) || !ready || revealed ? 'none' : 'auto';
    prompt.textContent = !ready ? 'Your colour edit is loading…' : revealed ? 'Your colour, in full bloom.' : mode === 'split' ? 'Drag the slider below to compare' : touch ? active ? 'Paint with your finger. Tap Done to scroll.' : 'Tap Start, then sweep with your finger' : 'Sweep the brush to reveal your radiance';
    prompt.style.opacity = strokes.length && mode === 'brush' && !revealed ? '0' : '1';
    status.textContent = !ready ? 'Preparing your edit…' : revealed ? 'Beautifully revealed' : mode === 'split' ? `${slider.value}% colour revealed` : touch && active ? 'Brush is on · tap Done to scroll' : strokes.length ? 'Your colour is blooming' : touch ? 'Ready for your touch' : 'Your brush. A little magic.';
    revealButton.textContent = revealed && mode === 'brush' || mode === 'split' && Number(slider.value) === 100 ? 'Beautifully revealed ✓' : 'Reveal the glow ↗';
  }
  function paintPoint(point, radius, previous) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; ctx.fillStyle = '#000'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
    ctx.lineWidth = radius * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo((previous || point).x, (previous || point).y); ctx.lineTo(point.x, point.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill();
  }
  function replay() {
    strokes.forEach(saved => {
      let previous = null;
      saved.points.forEach(p => {
        const point = { x: p.x * width, y: p.y * height };
        paintPoint(point, saved.radius * width, previous); previous = point;
      });
    });
  }
  function updateSplit() {
    if (mode !== 'split') return;
    const value = clamp(Number(slider.value), 0, 100);
    canvas.style.opacity = '1'; canvas.style.clipPath = `inset(0 0 0 ${value}%)`;
    guide.style.left = `${value}%`;
    slider.setAttribute('aria-valuetext', `${value} percent colour revealed`);
    splitControls.querySelector('output').textContent = `${value}% colour`;
    syncControls();
  }
  function render() {
    if (!ctx || !image.complete || !image.naturalWidth) return;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    stopPointer(); win.cancelAnimationFrame(frame); frame = 0;
    width = rect.width; height = rect.height; ratio = Math.min(win.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0;
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    ctx.drawImage(image, (width - w) / 2, (height - h) * 0.36, w, h);
    try {
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const grey = Math.round(pixels.data[i] * .2126 + pixels.data[i + 1] * .7152 + pixels.data[i + 2] * .0722);
        pixels.data[i] = grey; pixels.data[i + 1] = grey; pixels.data[i + 2] = grey;
      }
      ctx.putImageData(pixels, 0, 0);
    } catch {
      // A future remote image without CORS must still leave the portrait usable.
      ready = false; canvas.style.opacity = '0'; syncControls();
      prompt.textContent = 'Explore this edit in full colour';
      status.textContent = 'Your colour edit is ready'; return;
    }
    ctx.fillStyle = '#e9d8c42b'; ctx.fillRect(0, 0, width, height);
    canvas.style.opacity = revealed && mode === 'brush' ? '0' : '1'; canvas.style.clipPath = '';
    ready = true;
    if (mode === 'split') updateSplit(); else replay();
    syncControls();
  }
  function setActive(value) {
    stopPointer(); active = Boolean(value) && ready && !revealed && mode === 'brush'; syncControls();
    if (active) positionCursor({ x:width * .62, y:height * .47 });
  }
  function reset() {
    stopPointer(); strokes = []; revealed = false; active = false; slider.value = '50'; render();
  }
  function pointFrom(event) {
    const rect = stage.getBoundingClientRect();
    return { x: clamp(event.clientX - rect.left, 0, width), y: clamp(event.clientY - rect.top, 0, height) };
  }
  function addPoint(event) {
    const point = pointFrom(event);
    if (last && Math.hypot(point.x - last.x, point.y - last.y) < 1.5) return;
    const radius = Number(size.value) * (event.pointerType === 'mouse' ? 1 : 1.25);
    if (!stroke) { stroke = { radius: radius / width, points: [] }; strokes.push(stroke); }
    paintPoint(point, stroke.radius * width, last);
    stroke.points.push({ x: point.x / width, y: point.y / height });
    last = point; prompt.style.opacity = '0'; status.textContent = 'Your colour is blooming';
  }
  function positionCursor(point) {
    cursor.style.left = `${point.x}px`; cursor.style.top = `${point.y}px`;
  }
  function down(event) {
    if (mode !== 'brush' || !ready || revealed || event.isPrimary === false || pointer !== null || event.pointerType === 'mouse' && event.button !== 0 || touchLayout.matches && !active) return;
    if (event.cancelable) event.preventDefault();
    win.cancelAnimationFrame(frame); frame = 0; last = null; stroke = null; pointer = event.pointerId;
    try { canvas.setPointerCapture?.(event.pointerId); } catch {}
    positionCursor(pointFrom(event));
    stage.classList.add('is-painting'); addPoint(event);
  }
  function move(event) {
    if (mode !== 'brush' || !ready || revealed || event.isPrimary === false) return;
    const hovering = event.pointerType === 'mouse' && !touchLayout.matches && pointer === null;
    if (!hovering && (pointer !== event.pointerId || touchLayout.matches && !active)) return;
    if (event.cancelable && !hovering) event.preventDefault();
    const point = pointFrom(event);
    positionCursor(point);
    addPoint(event);
  }
  function up(event) { if (pointer === event.pointerId) { stopPointer(); syncControls(); } }
  function leave() { if (pointer === null) { last = null; stroke = null; } }
  function setMode(value) {
    stopPointer(); active = false; mode = value === 'split' ? 'split' : 'brush'; render();
  }
  function revealAll() {
    if (!ready) return;
    stopPointer(); active = false; win.cancelAnimationFrame(frame); frame = 0;
    if (mode === 'split') { slider.value = '100'; updateSplit(); return; }
    if (!motionAllowed()) { revealed = true; canvas.style.opacity = '0'; syncControls(); return; }
    const start = win.performance.now();
    toggle.hidden = true; canvas.style.pointerEvents = 'none';
    function sweep(now) {
      const progress = Math.min((now - start) / 1000, 1);
      const y = progress * (height + 140) - 70;
      paintPoint({ x: width + 90, y }, 75, { x: -90, y });
      if (progress < 1) frame = win.requestAnimationFrame(sweep);
      else { frame = 0; revealed = true; canvas.style.opacity = '0'; syncControls(); }
    }
    frame = win.requestAnimationFrame(sweep);
  }
  toggle.addEventListener('click', () => setActive(!active));
  slider.addEventListener('input', updateSplit);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  canvas.addEventListener('pointerleave', leave);
  if (!win.PointerEvent) {
    const pointerEvent = (touch, event) => ({ pointerId:touch.identifier, pointerType:'touch', isPrimary:true, clientX:touch.clientX, clientY:touch.clientY, cancelable:event.cancelable, preventDefault:()=>event.preventDefault() });
    canvas.addEventListener('touchstart', event => { if (event.touches.length === 1) down(pointerEvent(event.changedTouches[0],event)); }, { passive:false });
    canvas.addEventListener('touchmove', event => { const touch = [...event.touches].find(t => t.identifier === pointer); if (touch) move(pointerEvent(touch,event)); }, { passive:false });
    canvas.addEventListener('touchend', event => { for (const touch of event.changedTouches) up(pointerEvent(touch,event)); }, { passive:false });
    canvas.addEventListener('touchcancel', event => { for (const touch of event.changedTouches) up(pointerEvent(touch,event)); }, { passive:false });
  }
  image.addEventListener('load', reset);
  image.addEventListener('error', () => { ready = false; canvas.style.opacity = '0'; syncControls(); status.textContent = 'This edit could not load. Try another mood.'; });
  touchLayout.addEventListener('change', () => setActive(false));
  win.addEventListener('blur', () => setActive(false));
  win.document.addEventListener('visibilitychange', () => { if (win.document.hidden) setActive(false); });
  const resize = new win.ResizeObserver(() => {
    const rect = stage.getBoundingClientRect();
    if (Math.abs(rect.width - width) > 1 || Math.abs(rect.height - height) > 1 || ratio !== Math.min(win.devicePixelRatio || 1, 2)) render();
  });
  resize.observe(stage);
  image.draggable = false;
  syncControls();
  if (image.complete) render();
  if (!ctx) { canvas.hidden = true; status.textContent = 'Explore your edit in full colour'; }
  return { reset, setMode, revealAll, render, pause: () => setActive(false) };
}
