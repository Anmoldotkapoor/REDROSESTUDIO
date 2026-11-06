import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHeroSwipe,nextHeroIndex} from '../hero-swipe.mjs';

function fixture({legacy=false,captureFailure=false}={}) {
  const target={closest:()=>null};
  function element(){const handlers={},classes=new Set(),values={};return {style:{setProperty:(k,v)=>{values[k]=v;},removeProperty:k=>delete values[k]},values,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},addEventListener:(type,fn)=>(handlers[type]||=[]).push(fn),emit:(type,event={})=>(handlers[type]||[]).forEach(fn=>fn(event))};}
  const stage=element(),image=element(),win=element(),steps=[],captured=new Set();
  if(!legacy)win.PointerEvent=class {};
  stage.setPointerCapture=id=>{if(captureFailure)throw Error('Unavailable');captured.add(id);};stage.hasPointerCapture=id=>captured.has(id);stage.releasePointerCapture=id=>captured.delete(id);
  createHeroSwipe({stage,image,step:d=>steps.push(d),motionAllowed:()=>true,win});
  let prevented=0;
  const send=(name,extra={})=>stage.emit(name,{pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:200,clientY:150,target,cancelable:true,preventDefault(){prevented++;},stopPropagation(){},...extra});
  return {stage,image,win,steps,captured,send,prevented:()=>prevented};
}
test('portraits cycle 1→2→3→1 and backwards without exceeding the array',()=>{
  let index=0;const forward=[];for(let i=0;i<3;i++){index=nextHeroIndex(index,1,3);forward.push(index);}assert.deepEqual(forward,[1,2,0]);
  assert.equal(nextHeroIndex(0,-1,3),2);assert.equal(nextHeroIndex(2,-1,3),1);assert.equal(nextHeroIndex(0,1,0),0);
});
test('left/right gestures advance once and clear their visual drag state and capture',()=>{
  const f=fixture();f.send('pointerdown');f.send('pointermove',{clientX:100});assert(f.stage.classList.contains('is-swiping'));f.send('pointerup',{clientX:80});
  assert.deepEqual(f.steps,[1]);assert.equal(f.captured.size,0);assert.equal(f.stage.values['--hero-swipe-x'],undefined);
  f.send('pointerdown');f.send('pointermove',{clientX:280});f.send('pointerup',{clientX:300});assert.deepEqual(f.steps,[1,-1]);
});
test('vertical scrolling, small taps and cancelled gestures never change a portrait',()=>{
  const f=fixture();f.send('pointerdown');f.send('pointermove',{clientX:205,clientY:240});f.send('pointerup',{clientX:210,clientY:280});
  assert.equal(f.prevented(),0);f.send('pointerdown');f.send('pointermove',{clientX:220});f.send('pointerup',{clientX:220});
  f.send('pointerdown');f.send('pointermove',{clientX:80});f.send('pointercancel');f.send('pointerup',{clientX:80});assert.deepEqual(f.steps,[]);
});
test('save/index buttons, secondary fingers and non-primary mouse buttons keep their own actions',()=>{
  const f=fixture();f.send('pointerdown',{target:{closest:()=>({})}});f.send('pointermove',{clientX:50});f.send('pointerup',{clientX:50});
  f.send('pointerdown',{pointerType:'mouse',button:2});f.send('pointerup',{clientX:50});
  f.send('pointerdown',{isPrimary:false});f.send('pointerup',{clientX:50});assert.deepEqual(f.steps,[]);
});
test('capture failures do not break swiping, and keyboard arrows remain available',()=>{
  const f=fixture({captureFailure:true});f.send('pointerdown');assert.doesNotThrow(()=>f.send('pointermove',{clientX:80}));f.send('pointerup',{clientX:80});
  f.stage.emit('keydown',{target:f.stage,key:'ArrowLeft',preventDefault(){}});assert.deepEqual(f.steps,[1,-1]);
});
test('a quick flick still changes the portrait when the browser coalesces move events',()=>{
  const f=fixture();f.send('pointerdown');f.send('pointerup',{clientX:80});assert.deepEqual(f.steps,[1]);
});
test('older iOS touch events use the same gesture while multi-touch cancels it',()=>{
  const f=fixture({legacy:true});const a={identifier:8,clientX:200,clientY:160},b={...a,clientX:80};
  const ev=(t,ts=[t])=>({touches:ts,changedTouches:[t],target:{closest:()=>null},cancelable:true,preventDefault(){}});
  f.stage.emit('touchstart',ev(a));f.stage.emit('touchmove',ev(b));f.stage.emit('touchend',ev(b,[]));assert.deepEqual(f.steps,[1]);
  f.stage.emit('touchstart',ev(a));f.stage.emit('touchstart',ev(a,[a,{...a,identifier:9}]));f.stage.emit('touchmove',ev(b));f.stage.emit('touchend',ev(b,[]));assert.deepEqual(f.steps,[1]);
});
