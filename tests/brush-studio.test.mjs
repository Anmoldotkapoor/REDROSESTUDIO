import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrushStudio } from '../brush-studio.mjs';

function fixture({ touch = true, context = true, captureFailure = false, resizeObserver = true } = {}) {
  function element() {
    const handlers = {}, attrs = {}, classes = new Set();
    return { style: {}, hidden: false, value: '50', textContent: '', attrs,
      classList: { add: x => classes.add(x), remove: x => classes.delete(x), toggle: (x, value) => value ? classes.add(x) : classes.delete(x), contains: x => classes.has(x) },
      setAttribute: (key, value) => { attrs[key] = value; },
      addEventListener: (name, fn) => { (handlers[name] ||= []).push(fn); },
      emit: (name, event = {}) => { (handlers[name] || []).forEach(fn => fn(event)); }
    };
  }
  const stage = element(), canvas = element(), image = element(), cursor = element(), toggle = element();
  const prompt = element(), status = element(), revealButton = element(), slider = element(), splitControls = element(), guide = element();
  const rect = { left: 10, top: 20, width: 320, height: 400 };
  stage.getBoundingClientRect = () => rect;
  let scrolls = 0;
  stage.scrollIntoView = () => { scrolls++; };
  Object.assign(image, { complete: true, naturalWidth: 1024, naturalHeight: 1280 });
  const lines = [], pixels = []; let imageReads = 0;
  let from;
  const ctx = { setTransform() {}, drawImage() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {},
    moveTo(x, y) { from = [x, y]; }, lineTo(x, y) { lines.push({ from, to: [x, y] }); }, stroke() {},
    getImageData() { imageReads++; return { data: new Uint8ClampedArray([200, 100, 50, 255, 25, 60, 200, 255]) }; },
    putImageData(data) { pixels.push([...data.data]); }
  };
  canvas.getContext = () => context ? ctx : null;
  const captured = new Set();
  canvas.setPointerCapture = id => { if (captureFailure) throw new Error('Pointer capture unavailable'); captured.add(id); };
  canvas.hasPointerCapture = id => captured.has(id);
  canvas.releasePointerCapture = id => captured.delete(id);
  const stageCaptured = new Set();
  stage.setPointerCapture = id => { if (captureFailure) throw new Error('Pointer capture unavailable'); stageCaptured.add(id); };
  stage.hasPointerCapture = id => stageCaptured.has(id);
  stage.releasePointerCapture = id => stageCaptured.delete(id);
  const output = element(); splitControls.querySelector = () => output;
  const media = element(); media.matches = touch;
  const win = element(); win.document = element(); win.devicePixelRatio = 2;
  win.document.body = element();
  win.matchMedia = () => media; win.cancelAnimationFrame = () => {}; win.requestAnimationFrame = () => 1;
  win.performance = { now: () => 0 };
  let resize;
  if (resizeObserver) win.ResizeObserver = class { constructor(fn) { resize = fn; } observe() {} };
  const studio = createBrushStudio({ stage, canvas, image, cursor, size: { value: '40' }, prompt, status, toggle, revealButton, slider, splitControls, guide, motionAllowed: () => false, win });
  const pointer = (type, extra = {}) => canvas.emit(type, { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 120, button: 0, buttons: 0, cancelable: true, preventDefault() {}, ...extra });
  const compare = (type, extra = {}) => stage.emit(type, { pointerId: 4, pointerType: 'touch', isPrimary: true, clientX: 100, clientY: 120, button: 0, cancelable: true, preventDefault() {}, ...extra });
  return { studio, stage, canvas, image, cursor, toggle, prompt, status, revealButton, slider, splitControls, guide, lines, pixels, ctx, captured, stageCaptured, rect, win, pointer, compare, imageReads:()=>imageReads, scrolls:()=>scrolls, resize: () => resize() };
}

test('monochrome is generated from pixels without canvas filter support', () => {
  const f = fixture();
  assert.deepEqual(f.pixels[0], [118, 118, 118, 255, 63, 63, 63, 255]);
  assert.equal('filter' in f.ctx, false);
  assert.equal(f.revealButton.disabled, false);
});
test('touch scroll is available until Start, then zero-buttons touch moves paint', () => {
  const f = fixture();
  f.pointer('pointerdown'); assert.equal(f.lines.length, 0);
  assert.equal(f.canvas.style.pointerEvents, 'none');
  f.toggle.emit('click');
  f.pointer('pointerdown');
  f.pointer('pointermove', { clientX: 180, clientY: 260 });
  assert.equal(f.lines.length, 2);
  assert.equal(f.captured.has(1), true);
  f.pointer('pointerup'); assert.equal(f.captured.size, 0);
  f.toggle.emit('click');
  assert.equal(f.canvas.style.pointerEvents, 'none');
  assert.equal(f.stage.classList.contains('brush-active'), false);
});
test('cancellation releases capture and a new stroke never bridges the old stroke', () => {
  const f = fixture(); f.toggle.emit('click'); f.pointer('pointerdown');
  f.pointer('pointermove', { clientX: 170 }); f.pointer('pointercancel');
  const count = f.lines.length;
  f.pointer('pointermove', { clientX: 250 }); assert.equal(f.lines.length, count);
  f.pointer('pointerdown', { pointerId: 2, clientX: 260, clientY: 350 });
  const last = f.lines.at(-1); assert.deepEqual(last.from, last.to);
  assert.equal(f.captured.has(1), false); assert.equal(f.captured.has(2), true);
  f.win.emit('blur'); assert.equal(f.captured.size, 0);
  assert.equal(f.canvas.style.pointerEvents, 'none');
});
test('secondary fingers are ignored and leaving the canvas does not interrupt captured strokes', () => {
  const f = fixture(); f.toggle.emit('click'); f.pointer('pointerdown');
  f.pointer('pointerdown', { pointerId: 2, isPrimary: false });
  f.pointer('pointermove', { pointerId: 2, isPrimary: false });
  assert.equal(f.lines.length, 1);
  f.canvas.emit('pointerleave');
  f.pointer('pointermove', { clientX: 240 }); assert.equal(f.lines.length, 2);
});
test('resize in both dimensions retains normalized strokes and a full reveal', () => {
  const f = fixture(); f.toggle.emit('click'); f.pointer('pointerdown'); f.pointer('pointerup');
  const point = f.lines.at(-1).to;
  f.rect.width = 640; f.rect.height = 200; f.resize();
  assert.deepEqual(f.lines.at(-1).to, [point[0] * 2, point[1] / 2]);
  f.studio.revealAll(); assert.equal(f.canvas.style.opacity, '0');
  f.rect.height = 300; f.resize(); assert.equal(f.canvas.style.opacity, '0');
  f.studio.reset(); assert.equal(f.canvas.style.opacity, '1'); assert.equal(f.toggle.attrs['aria-pressed'], 'false');
});
test('slider, reset and reveal stay in sync across interaction modes', () => {
  const f = fixture(); f.studio.setMode('split');
  f.slider.value = '73'; f.slider.emit('input');
  assert.equal(f.canvas.style.clipPath, 'inset(0 0 0 73%)');
  assert.equal(f.slider.attrs['aria-valuetext'], '73 percent colour revealed');
  f.rect.height = 300; f.resize(); assert.equal(f.slider.value, '73');
  f.studio.revealAll(); assert.equal(f.slider.value, '100');
  f.studio.reset(); assert.equal(f.slider.value, '50');
  f.studio.setMode('brush'); assert.equal(f.splitControls.hidden, true);
});
test('desktop hover still paints and unavailable canvas leaves a usable portrait', () => {
  const desktop = fixture({ touch: false });
  desktop.pointer('pointermove', { pointerType: 'mouse' }); assert.equal(desktop.lines.length, 1);
  const fallback = fixture({ context: false });
  assert.equal(fallback.canvas.hidden, true); assert.equal(fallback.toggle.hidden, true);
  assert.equal(fallback.revealButton.disabled, true);
});
test('Start immediately positions and shows the touch brush without moving the portrait; Done restores scrolling', () => {
  const f = fixture(); assert.equal(f.cursor.hidden, true);
  f.toggle.emit('click');
  assert.equal(f.cursor.hidden, false); assert.equal(f.cursor.style.left, '198.4px'); assert.equal(f.cursor.style.top, '188px');
  assert.equal(f.scrolls(), 0); assert.equal(f.win.document.body.classList.contains('brush-editing'), true);
  f.pointer('pointerdown'); assert.equal(f.cursor.style.left, '90px'); assert.equal(f.cursor.style.top, '100px');
  f.toggle.emit('click'); assert.equal(f.cursor.hidden, true); assert.equal(f.win.document.body.classList.contains('brush-editing'), false);
});
test('a pointer-capture error never prevents the first touch mark or the following stroke', () => {
  const f = fixture({ captureFailure:true }); f.toggle.emit('click');
  assert.doesNotThrow(() => f.pointer('pointerdown')); f.pointer('pointermove',{clientX:210});
  assert.equal(f.lines.length, 2); f.pointer('pointerup');
  assert.equal(f.stage.classList.contains('is-painting'), false);
});
test('legacy touch events paint, cancel safely and ignore an additional finger', () => {
  const f = fixture(); let prevented = 0;
  const event = (touch, touches=[touch]) => ({ touches, changedTouches:[touch], cancelable:true, preventDefault(){prevented++;} });
  const first={identifier:7,clientX:90,clientY:130}, moved={...first,clientX:190};
  f.canvas.emit('touchstart',event(first)); assert.equal(f.lines.length,0); assert.equal(prevented,0);
  f.toggle.emit('click'); f.canvas.emit('touchstart',event(first)); f.canvas.emit('touchmove',event(moved));
  const second={identifier:8,clientX:150,clientY:200};f.canvas.emit('touchstart',event(second,[moved,second]));
  assert.equal(f.lines.length,2);assert.equal(prevented,2);
  f.canvas.emit('touchcancel',event(moved,[]));f.canvas.emit('touchmove',event({...moved,clientX:240}));assert.equal(f.lines.length,2);
});
test('the photo itself supports touch dragging, tap positioning and both comparison endpoints', () => {
  const f=fixture();f.studio.setMode('split');
  f.compare('pointerdown');f.compare('pointermove',{clientX:250});assert.equal(f.slider.value,'75');assert.equal(f.guide.style.left,'75%');
  f.compare('pointerup',{clientX:400});assert.equal(f.slider.value,'100');assert.equal(f.stageCaptured.size,0);
  f.compare('pointerdown',{clientX:10});f.compare('pointerup',{clientX:10});assert.equal(f.slider.value,'0');
  assert.equal(f.canvas.style.clipPath,'inset(0 0 0 0%)');assert.equal(f.slider.attrs['aria-valuetext'],'0 percent colour revealed');
});
test('vertical scrolling intent and cancellation leave the comparison unchanged',()=>{
  const f=fixture();f.studio.setMode('split');let prevented=0;
  f.compare('pointerdown');f.compare('pointermove',{clientX:105,clientY:240,preventDefault(){prevented++;}});f.compare('pointerup',{clientX:105,clientY:240});
  assert.equal(f.slider.value,'50');assert.equal(prevented,0);
  f.compare('pointerdown');f.compare('pointermove',{clientX:250});f.compare('pointercancel');f.compare('pointermove',{clientX:10});assert.equal(f.slider.value,'75');
});
test('mouse comparison and capture failures remain usable and ignore controls/secondary pointers',()=>{
  const f=fixture({captureFailure:true});f.studio.setMode('split');
  f.compare('pointerdown',{pointerType:'mouse',clientX:90});assert.equal(f.slider.value,'25');
  f.compare('pointermove',{pointerType:'mouse',clientX:170});f.compare('pointerup',{pointerType:'mouse',clientX:170});assert.equal(f.slider.value,'50');
  f.compare('pointerdown',{isPrimary:false});f.compare('pointerup',{clientX:10});assert.equal(f.slider.value,'50');
  f.compare('pointerdown',{target:{closest:()=>({})}});f.compare('pointerup',{clientX:10});assert.equal(f.slider.value,'50');
});
test('a fully revealed brush cannot leave stale text or a disabled comparison when modes change',()=>{
  const f=fixture();f.studio.revealAll();f.studio.setMode('split');
  f.slider.value='23';f.slider.emit('change');assert.equal(f.status.textContent,'23% colour revealed');assert.equal(f.canvas.style.opacity,'1');
  assert.match(f.prompt.textContent,/Drag across the photo/);f.studio.setMode('brush');assert.equal(f.canvas.style.opacity,'0');
});
test('monochrome conversion is reused for mode/reset changes and invalidated by size or image loading',()=>{
  const f=fixture();assert.equal(f.imageReads(),1);
  f.studio.setMode('split');f.studio.reset();f.studio.setMode('brush');assert.equal(f.imageReads(),1);
  f.rect.width=400;f.resize();assert.equal(f.imageReads(),2);
  f.image.emit('load');assert.equal(f.imageReads(),3);
});
test('legacy touch comparison and the resize fallback work without ResizeObserver',()=>{
  const f=fixture({resizeObserver:false});f.studio.setMode('split');
  const a={identifier:3,clientX:100,clientY:120},b={...a,clientX:250};
  const event=t=>({touches:[t],changedTouches:[t],cancelable:true,preventDefault(){}});
  f.stage.emit('touchstart',event(a));f.stage.emit('touchmove',event(b));f.stage.emit('touchend',event(b));assert.equal(f.slider.value,'75');
  f.rect.width=400;f.win.emit('resize');assert.equal(f.slider.value,'75');assert.equal(f.canvas.width,800);
});
