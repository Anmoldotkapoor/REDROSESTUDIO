'use strict';
import { createBrushStudio } from './brush-studio.mjs?v=a97b1fe103';
(() => {
  document.documentElement.classList.add('js');
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const form = $('#enquiry-form');
  const root = document.documentElement;
  const themeButton = $('#theme-toggle');
  function savePreference(key, value) { try { localStorage.setItem(key, value); } catch {} }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeButton.removeAttribute('aria-pressed');
    const next = theme === 'dark' ? 'light' : 'dark';
    themeButton.setAttribute('aria-label', `Switch to ${next} mode`);
    themeButton.title = `Switch to ${next} mode`;
    $('#theme-label').textContent = next === 'light' ? 'Light' : 'Dark';
    $('meta[name="theme-color"]').content = theme === 'dark' ? '#210e18' : '#faf3ed';
  }
  applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme); savePreference('royal-rose-theme', theme);
  });
  function motionAllowed() { return !reducedMotion.matches && root.dataset.motion !== 'off'; }
  function updateMotionControl() {
    const on = motionAllowed();
    $('#motion-toggle span').textContent = on ? 'on' : 'off';
    $('#motion-toggle').setAttribute('aria-pressed', String(!on));
    $('#motion-toggle').setAttribute('aria-label', reducedMotion.matches ? 'Motion off, following your system preference' : `Turn motion ${on ? 'off' : 'on'}`);
    $('#motion-toggle').disabled = reducedMotion.matches;
  }
  updateMotionControl();
  $('#motion-toggle').addEventListener('click', () => {
    root.dataset.motion = motionAllowed() ? 'off' : 'on';
    savePreference('royal-rose-motion', root.dataset.motion); updateMotionControl();
  });
  reducedMotion.addEventListener('change', updateMotionControl);
  function updateFormProgress() {
    const count = ['name', 'email', 'occasion', 'date', 'city'].filter(name => {
      const field = form.elements[name]; return field.value.trim() && field.validity.valid;
    }).length;
    $('#form-count').textContent = `${count} / 5`;
    $('#form-progress-fill').style.width = `${count * 20}%`;
    updateEventDetails();
  }
  form.addEventListener('input', updateFormProgress);
  form.addEventListener('change', updateFormProgress);
  let scrollFrame = 0;
  function updateScrollDetails() {
    const range = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress span').style.transform = `scaleX(${range > 0 ? Math.min(scrollY / range, 1) : 0})`;
    $('.header').classList.toggle('scrolled', scrollY > 30);
    document.body.classList.toggle('footer-in-view', $('.footer').getBoundingClientRect().top < innerHeight - 80);
    if (scrollY < 100) $$('.desktop-nav a').forEach(link => { link.classList.remove('current'); link.removeAttribute('aria-current'); });
    scrollFrame = 0;
  }
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollDetails); }, { passive: true });
  addEventListener('resize', updateScrollDetails, { passive: true });
  updateScrollDetails();
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.desktop-nav a').forEach(link => {
        const active = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('current', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -60% 0px' });
  $$('.hero,#artistry,#occasions,#experience,#enquire').forEach(section => navObserver.observe(section));
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $('.hero-visual').addEventListener('pointermove', event => {
      if (!motionAllowed()) return;
      const r = $('.hero-visual').getBoundingClientRect();
      $('.hero-image').style.setProperty('--portrait-x', `${(event.clientX - r.left - r.width / 2) * 0.018}px`);
      $('.hero-image').style.setProperty('--portrait-y', `${(event.clientY - r.top - r.height / 2) * 0.012}px`);
    });
    $('.hero-visual').addEventListener('pointerleave', () => {
      $('.hero-image').style.setProperty('--portrait-x', '0px'); $('.hero-image').style.setProperty('--portrait-y', '0px');
    });
    $$('.look-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        if (!motionAllowed()) return;
        const r = card.getBoundingClientRect();
        const image = $('.look-image', card);
        image.style.setProperty('--tilt-x', `${-(event.clientY - r.top - r.height / 2) / r.height * 4}deg`);
        image.style.setProperty('--tilt-y', `${(event.clientX - r.left - r.width / 2) / r.width * 5}deg`);
      });
      card.addEventListener('pointerleave', () => {
        $('.look-image', card).style.setProperty('--tilt-x', '0deg'); $('.look-image', card).style.setProperty('--tilt-y', '0deg');
      });
    });
  }
  let selectedMood = '';
  let toastTimer;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500);
  }
  function openDialog(dialog) {
    brushStudio.pause();
    setMenuOpen(false);
    if (!dialog.open) dialog.showModal();
  }
  $$('.modal').forEach(dialog => {
    $('.modal-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  });
  const menu = $('.menu-toggle');
  function setMenuOpen(open) {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('#mobile-nav').hidden = !open;
    document.body.classList.toggle('menu-open', open);
  }
  menu.addEventListener('click', () => setMenuOpen(menu.getAttribute('aria-expanded') !== 'true'));
  $$('#mobile-nav a').forEach(a => a.addEventListener('click', () => setMenuOpen(false)));
  document.addEventListener('pointerdown', event => {
    if (!$('#mobile-nav').contains(event.target) && !menu.contains(event.target)) setMenuOpen(false);
  });
  matchMedia('(min-width:701px)').addEventListener('change', event => { if (event.matches) setMenuOpen(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') menu.click();
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.08 });
  $$('.reveal').forEach(el => observer.observe(el));
  $('#year').textContent = new Date().getFullYear();

  const occasions = {
    'Bridal': { eyebrow: 'THE MAIN CHARACTER MOMENT', title: 'For your<br><em>forever moment.</em>', description: 'The anticipation. The entrance. The way you’ll remember feeling. A bridal look begins with your vision and the details that mean the most to you.', tags: ['Timeless radiance', 'Romantic definition', 'Your signature'], image: 'bridal', alt: 'Rich red and gold bridal makeup inspiration', cta: 'Let’s talk bridal' },
    'Jago': { eyebrow: 'LET YOUR JOY SHINE', title: 'For a night<br><em>full of light.</em>', description: 'The music, the movement, the joy of being surrounded by your people. Explore expressive eyes, warm tones and a look that feels as celebratory as your Jago.', tags: ['Celebration energy', 'Expressive eyes', 'Golden warmth'], image: 'jago', alt: 'Distinct Jago inspiration with berry-magenta silk, bronze eyes and gold jewellery', cta: 'Let’s talk Jago' },
    'Mehndi': { eyebrow: 'COLOR, CONNECTION & CELEBRATION', title: 'A little color.<br><em>A lot of joy.</em>', description: 'An afternoon of intricate details and beautiful beginnings. Think fresh skin, playful color and a little golden warmth to complement your Mehndi celebration.', tags: ['Fresh radiance', 'Playful color', 'Beautiful details'], image: 'mehndi', alt: 'Mehndi occasion inspiration with luminous skin and green silk', cta: 'Let’s talk Mehndi' },
    'Pre-wedding Photoshoot': { eyebrow: 'THE CHAPTER BEFORE FOREVER', title: 'For the photos.<br><em>And the feeling.</em>', description: 'Intimate, playful, quietly romantic — whatever your story looks like. Explore a makeup mood that feels at home with your outfit, your setting and you.', tags: ['Soft romance', 'Champagne tones', 'Effortless definition'], image: 'rose', alt: 'Soft romantic pre-wedding makeup inspiration in blush pink', cta: 'Let’s plan your photoshoot' }
  };
  let activeOccasion = 'Bridal';
  const tabs = $$('.occasion-tabs [role=tab]');
  function setOccasion(tab) {
    activeOccasion = tab.dataset.occasion;
    const o = occasions[activeOccasion];
    tabs.forEach(t => { const active = t === tab; t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; });
    $('#occasion-panel').setAttribute('aria-labelledby', tab.id);
    $('#occasion-eyebrow').textContent = o.eyebrow;
    $('#occasion-title').innerHTML = o.title;
    $('#occasion-description').textContent = o.description;
    $('#occasion-index').textContent = `${String(tabs.indexOf(tab) + 1).padStart(2, '0')} / 04`;
    if (motionAllowed()) $('#occasion-panel').animate([{ opacity: 0.3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
    $('#occasion-image').src = `assets/${o.image}.jpg`;
    $('#occasion-image').alt = o.alt;
    $('#occasion-tags').replaceChildren(...o.tags.map(tag => { const span = document.createElement('span'); span.textContent = tag; return span; }));
    $('#occasion-enquire').replaceChildren(document.createTextNode(o.cta + ' '), Object.assign(document.createElement('span'), { textContent: '↗' }));
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setOccasion(tab));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); tabs[next].focus(); setOccasion(tabs[next]);
    });
  });
  function goToEnquiry(occasion) {
    if (occasion) form.elements.occasion.value = occasion;
    updateFormProgress();
    $('#enquire').scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'instant', block: 'start' });
    toast('Your inspiration is ready. Tell Gagan about your moment.');
  }
  $('#occasion-enquire').addEventListener('click', () => goToEnquiry(activeOccasion));
  $$('.look-filters button').forEach(button => button.addEventListener('click', () => {
    $$('.look-filters button').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    $$('.look-card').forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; card.closest('.look-cell').hidden = card.hidden; if (!card.hidden) card.classList.add('visible'); });
  }));
  const looks = {
    bridal: { title: 'The timeless bride', description: 'Rich rose tones, softly sculpted eyes and luminous skin, framed by red silk and gold. An inspiration for a moment you’ll remember forever.', palette: ['#6b2339', '#a46d5a', '#c8aa79', '#efe0cf'], mood: 'The timeless bride — rose, gold and romantic definition' },
    mehndi: { title: 'The golden celebration', description: 'Warm golden eyes, a fresh peach-rose lip and an olive silk mood. A joyful starting point for your Jago or Mehndi celebration.', palette: ['#69704b', '#ba9661', '#b47564', '#ece0c3'], mood: 'The golden celebration — golden warmth and peach-rose tones' },
    rose: { title: 'The soft romantic', description: 'Champagne eyes, a dusty rose lip and softly luminous skin. A quiet, romantic mood for the moments before your next chapter.', palette: ['#b48384', '#d7b5a5', '#e6cba3', '#f4e7df'], mood: 'The soft romantic — champagne eyes and a dusty rose lip' }
  };
  let activeLook = 'bridal';
  function openLook(key) {
    activeLook = key;
    const look = looks[activeLook];
    $('#look-title').textContent = look.title;
    $('#look-description').textContent = look.description;
    $('#look-dialog-image').src = `assets/${activeLook}.jpg`;
    $('#look-dialog-image').alt = look.title + ', AI-created editorial makeup inspiration';
    $('#look-palette').replaceChildren(...look.palette.map(color => { const swatch = document.createElement('span'); swatch.style.background = color; swatch.setAttribute('title', color); return swatch; }));
    $('#save-detail').dataset.save = activeLook;
    syncSavedControls();
    openDialog($('#look-dialog'));
  }
  $$('.look-card').forEach(card => card.addEventListener('click', () => openLook(card.dataset.look)));
  function setMood(mood) {
    selectedMood = mood;
    $('#selected-mood').hidden = !mood;
    $('#selected-mood>span').textContent = mood ? 'Your mood: ' + mood : '';
  }
  $('#selected-mood button').addEventListener('click', () => setMood(''));
  $('#use-look').addEventListener('click', () => {
    setMood(looks[activeLook].mood);
    $('#look-dialog').close();
    goToEnquiry();
  });

  // A small, private collection of editorial inspiration. No visitor contact data is stored.
  const lookKeys = Object.keys(looks);
  let savedLooks = [];
  try {
    const saved = JSON.parse(localStorage.getItem('royal-rose-saved-edits') || '[]');
    if (Array.isArray(saved)) savedLooks = [...new Set(saved.filter(key => lookKeys.includes(key)))];
  } catch {}
  const heartIcon = '<svg class="icon" aria-hidden="true"><use href="#icon-heart"/></svg>';
  $('#save-studio').dataset.save = 'rose';
  $('#save-detail').dataset.save = activeLook;
  function syncSavedControls() {
    $$('[data-save]').forEach(button => {
      const key = button.dataset.save;
      if (!looks[key]) return;
      const saved = savedLooks.includes(key);
      button.classList.toggle('is-saved', saved);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${looks[key].title}${saved ? ' from your saved edits' : ''}`);
      if (!button.matches('.save-look,.hero-save')) {
        const label = saved ? 'Saved to your edit' : button.matches('.save-studio') ? 'Save this feeling' : 'Save this edit';
        button.innerHTML = heartIcon + `<span class="save-label">${label}</span>`;
      }
    });
    $('#moodboard-launch').hidden = savedLooks.length === 0;
    $('#moodboard-launch b').textContent = savedLooks.length;
    $('#moodboard-launch').setAttribute('aria-label', `Open your saved beauty edit, ${savedLooks.length} saved ${savedLooks.length === 1 ? 'edit' : 'edits'}`);
  }
  function flourish(button) {
    if (!motionAllowed()) return;
    for (let i = 0; i < 4; i++) {
      const petal = document.createElement('i');
      petal.className = 'heart-petal'; petal.setAttribute('aria-hidden', 'true');
      petal.style.setProperty('--petal-x', `${[-24, -10, 18, 29][i]}px`);
      petal.style.setProperty('--petal-y', `${[-25, -41, -38, -19][i]}px`);
      button.append(petal);
      petal.addEventListener('animationend', () => petal.remove(), { once: true });
      setTimeout(() => petal.remove(), 900);
    }
  }
  function persistCollection() {
    savePreference('royal-rose-saved-edits', JSON.stringify(savedLooks));
    syncSavedControls(); renderBoard();
  }
  function toggleSaved(key, button) {
    if (!looks[key]) return;
    const removing = savedLooks.includes(key);
    savedLooks = removing ? savedLooks.filter(k => k !== key) : [...savedLooks, key];
    persistCollection();
    if (!removing && button) flourish(button);
    toast(removing ? 'Removed from your saved edits.' : 'A little inspiration, kept close.');
  }
  document.addEventListener('click', event => {
    const save = event.target.closest('[data-save]');
    if (save) toggleSaved(save.dataset.save, save);
  });
  function renderBoard() {
    $('#board-count').textContent = `${savedLooks.length} ${savedLooks.length === 1 ? 'EDIT' : 'EDITS'} COLLECTED`;
    $('#clear-board').hidden = savedLooks.length === 0;
    $('#board-empty').hidden = savedLooks.length > 0;
    $('#board-actions').hidden = savedLooks.length === 0;
    $('#board-items').replaceChildren(...savedLooks.map((key, index) => {
      const item = document.createElement('div'); item.className = 'board-item';
      item.innerHTML = `<button class="board-view" aria-label="Explore ${looks[key].title}"><img src="assets/${key}.jpg" alt="${looks[key].title}, AI-created inspiration"></button><div><span class="eyebrow">EDIT ${String(index + 1).padStart(2, '0')}</span><button class="board-title">${looks[key].title}</button><div class="board-palette">${looks[key].palette.map(c => `<i style="background:${c}" title="${c}"></i>`).join('')}</div></div><button class="board-remove" aria-label="Remove ${looks[key].title}">×</button>`;
      $('.board-remove', item).addEventListener('click', () => {
        toggleSaved(key);
        ($('#board-items .board-remove') || $('#board-explore')).focus({ preventScroll: true });
      });
      [$('.board-view', item), $('.board-title', item)].forEach(button => button.addEventListener('click', () => { $('#moodboard-dialog').close(); openLook(key); }));
      return item;
    }));
  }
  $('#moodboard-launch').addEventListener('click', () => { renderBoard(); openDialog($('#moodboard-dialog')); });
  $('#clear-board').addEventListener('click', () => { savedLooks = []; persistCollection(); $('#board-explore').focus(); });
  $('#board-explore').addEventListener('click', () => { $('#moodboard-dialog').close(); $('#artistry').scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'instant' }); });
  $('#use-board').addEventListener('click', () => {
    if (!savedLooks.length) return;
    setMood('My collected inspiration: ' + savedLooks.map(key => looks[key].mood).join(' + '));
    $('#moodboard-dialog').close(); goToEnquiry();
  });
  function renderComparison() {
    const left = $('#compare-left').value, right = $('#compare-right').value;
    for (const [side, key] of [['left', left], ['right', right]]) {
      const look = looks[key];
      $(`#compare-image-${side}`).src = `assets/${key}.jpg`;
      $(`#compare-image-${side}`).alt = look.title + ', AI-created editorial inspiration';
      $(`#compare-name-${side}`).textContent = look.title;
      $(`#compare-copy-${side}`).textContent = look.description;
      $(`#compare-palette-${side}`).innerHTML = look.palette.map(c => `<span style="background:${c}" title="${c}"></span>`).join('');
      $(`.compare-save[data-side="${side}"]`).dataset.save = key;
    }
    $('#compare-note').textContent = left === right ? 'You’re viewing the same edit. Choose another to explore the differences.' : 'Drawn to both? Take a little of each into your conversation with Gagan.';
    syncSavedControls();
  }
  function openComparison() {
    const left = savedLooks[0] || 'bridal';
    const right = savedLooks.find(key => key !== left) || lookKeys.find(key => key !== left);
    $('#compare-left').value = left; $('#compare-right').value = right;
    if ($('#moodboard-dialog').open) $('#moodboard-dialog').close();
    renderComparison(); openDialog($('#compare-dialog'));
  }
  $('#compare-open').addEventListener('click', openComparison);
  $('#board-compare').addEventListener('click', openComparison);
  $('#compare-left').addEventListener('change', renderComparison);
  $('#compare-right').addEventListener('change', renderComparison);
  $('#use-comparison').addEventListener('click', () => {
    const keys = [...new Set([$('#compare-left').value, $('#compare-right').value])];
    setMood('Inspired by ' + keys.map(key => looks[key].mood).join(' + '));
    $('#compare-dialog').close(); goToEnquiry();
  });
  function coverPhoto(context, img, x, y, w, h) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale, sh = h / scale;
    const sx = (img.naturalWidth - sw) * 0.62, sy = (img.naturalHeight - sh) * 0.28;
    context.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function wrapCardText(context, text, x, y, maxWidth, lineHeight) {
    let line = '';
    for (const word of text.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (context.measureText(next).width > maxWidth && line) { context.fillText(line, x, y); y += lineHeight; line = word; }
      else line = next;
    }
    if (line) context.fillText(line, x, y);
    return y;
  }
  $('#download-board').addEventListener('click', async () => {
    if (!savedLooks.length) return;
    const button = $('#download-board'), previous = button.innerHTML;
    const keys = [...savedLooks]; button.disabled = true; button.textContent = 'Creating your card…';
    try {
      await document.fonts.ready;
      const photos = await Promise.all(keys.map(async key => { const img = new Image(); img.src = `assets/${key}.jpg`; await img.decode(); return img; }));
      const brandStamp = new Image(); brandStamp.src = 'assets/royal-rose-emblem.png'; await brandStamp.decode();
      const card = document.createElement('canvas'); card.width = 1080; card.height = 1440;
      const c = card.getContext('2d'); if (!c) throw new Error('Canvas unavailable');
      c.fillStyle = '#27101f'; c.fillRect(0, 0, 1080, 1440);
      c.strokeStyle = '#a779704d'; c.lineWidth = 1; c.strokeRect(30, 30, 1020, 1380);
      c.fillStyle = '#faf3ed'; c.beginPath(); c.arc(970, 85, 48, 0, Math.PI * 2); c.fill();
      c.drawImage(brandStamp, 930, 45, 80, 80);
      c.fillStyle = '#d3ae9c'; c.font = '500 19px "DM Sans", sans-serif'; c.fillText('ROYAL ROSE STUDIO / BY GAGAN', 65, 94);
      c.fillStyle = '#f3e4d9'; c.font = '400 70px "Bodoni Moda", Georgia'; c.fillText('My inspiration edit.', 61, 188);
      c.fillStyle = '#c2a6ab'; c.font = '400 20px "DM Sans", sans-serif'; c.fillText('A little romance. A little radiance. Beautifully me.', 65, 231);
      const gap = 22, width = (950 - gap * (keys.length - 1)) / keys.length;
      keys.forEach((key, index) => {
        const x = 65 + index * (width + gap);
        coverPhoto(c, photos[index], x, 278, width, 690);
        c.strokeStyle = '#d9b69d4d'; c.strokeRect(x + 10, 288, width - 20, 670);
        c.fillStyle = '#e7bdba'; c.font = '400 27px "Bodoni Moda", Georgia';
        wrapCardText(c, looks[key].title, x, 1012, width, 34);
        looks[key].palette.forEach((color, i) => { c.fillStyle = color; c.beginPath(); c.arc(x + 14 + i * 36, 1102, 12, 0, Math.PI * 2); c.fill(); });
      });
      c.strokeStyle = '#d7b8aa40'; c.beginPath(); c.moveTo(65, 1160); c.lineTo(1015, 1160); c.stroke();
      c.fillStyle = '#f3e4d9'; c.font = '400 32px "Bodoni Moda", Georgia'; c.fillText('Let’s make something beautiful.', 65, 1220);
      c.fillStyle = '#c2a6ab'; c.font = '400 19px "DM Sans", sans-serif'; c.fillText('916 217 9247  ·  bookings.royalrosebygagan@outlook.com', 65, 1268);
      c.font = '400 17px "DM Sans", sans-serif'; c.fillText('A personal creative starting point to explore with Gagan.', 65, 1325);
      c.fillStyle = '#ae8e95'; c.font = '400 16px "DM Sans", sans-serif'; c.fillText('AI-created editorial inspiration · Not client photographs.', 65, 1374);
      const blob = await new Promise(resolve => card.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Export unavailable');
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'royal-rose-inspiration-card.png'; document.body.append(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast('Your personal inspiration card is ready.');
    } catch { toast('The card couldn’t be prepared. Please try again.'); }
    finally { button.disabled = false; button.innerHTML = previous; }
  });
  const heroEdits = {
    bridal: { label: '01 / THE BRIDAL EDIT', copy: 'Some moments<br>deserve <em>everything.</em>' },
    mehndi: { label: '02 / THE GOLDEN EDIT', copy: 'A little light.<br>A lot of <em>feeling.</em>' },
    rose: { label: '03 / THE ROMANTIC EDIT', copy: 'Quiet confidence.<br>Beautifully <em>you.</em>' }
  };
  const sceneButtons = $$('.hero-scenes button');
  function setHeroEdit(button) {
    const key = button.dataset.scene, edit = heroEdits[key];
    sceneButtons.forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    $('.hero-image').src = `assets/${key}.jpg`; $('.hero-image').alt = looks[key].title + ', AI-created editorial inspiration';
    $('.image-script').innerHTML = `<span>${edit.label}</span>${edit.copy}`;
    $('#save-hero').dataset.save = key; syncSavedControls();
    if (motionAllowed()) $('.hero-image').animate([{ opacity: 0.4, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 600, easing: 'ease-out' });
  }
  sceneButtons.forEach((button, index) => {
    button.addEventListener('click', () => setHeroEdit(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); const next = sceneButtons[(index + (event.key === 'ArrowRight' ? 1 : sceneButtons.length - 1)) % sceneButtons.length]; next.focus(); setHeroEdit(next);
    });
  });
  function updateEventDetails() {
    $('#celebration-options').hidden = form.elements.occasion.value !== 'Multiple celebrations';
    const field = form.elements.date, notice = $('#event-countdown');
    if (!field.value || !field.validity.valid) { notice.hidden = true; return; }
    const [year, month, day] = field.value.split('-').map(Number), now = new Date();
    const days = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    notice.hidden = days < 0;
    notice.textContent = days === 0 ? 'Your moment is today. Let’s talk about the details.' : `Your moment is ${days} ${days === 1 ? 'day' : 'days'} away. Let the dreaming begin.`;
  }
  syncSavedControls(); renderBoard();


  // A short creative preference guide. It does not assess skin or simulate makeup.
  const questions = [
    { title: 'What are we<br><em>celebrating?</em>', description: 'Every occasion has a feeling of its own.', options: [ ['Bridal', '#6b2339'], ['Jago', '#ad7956'], ['Mehndi', '#79805a'], ['Pre-wedding Photoshoot', '#d4a7a3'] ] },
    { title: 'What feels most<br><em>like you?</em>', description: 'Go with the mood you’re drawn to.', options: [ ['Soft & romantic', '#d5a1a2'], ['Warm & glowing', '#c6a16c'], ['Timeless & defined', '#7b3347'] ] },
    { title: 'And your little<br><em>finishing touch?</em>', description: 'The detail that brings it all together.', options: [ ['A dusty rose lip', '#b5787b'], ['A touch of golden light', '#c6a16c'], ['A beautifully defined eye', '#553729'] ] }
  ];
  let finderStep = 0;
  let answers = [];
  function renderFinder() {
    const q = questions[finderStep];
    const root = $('#finder-content');
    root.innerHTML = `<h2 id="finder-title">${q.title}</h2><p>${q.description}</p><div class="finder-progress" aria-label="Step ${finderStep + 1} of 3">${questions.map((_, i) => `<span class="${i <= finderStep ? 'done' : ''}"></span>`).join('')}</div><div class="finder-options"></div><div class="finder-bottom"><button class="finder-back" ${finderStep === 0 ? 'hidden' : ''}>← Back</button><span>${String(finderStep + 1).padStart(2, '0')} / 03</span></div>`;
    q.options.forEach(([label, color], index) => {
      const b = document.createElement('button'); b.className = 'finder-option';
      b.innerHTML = `<span class="swatch" style="background:${color}"></span><span>${label}</span><span aria-hidden="true">↗</span>`;
      b.addEventListener('click', () => { answers[finderStep] = index; if (finderStep < 2) { finderStep++; renderFinder(); } else renderResult(); });
      $('.finder-options', root).append(b);
    });
    $('.finder-back', root).addEventListener('click', () => { finderStep--; renderFinder(); });
    if ($('#look-finder').open) $('.finder-option', root).focus({ preventScroll: true });
  }
  function renderResult() {
    const key = answers[1] === 0 ? 'rose' : answers[1] === 1 ? 'mehndi' : 'bridal';
    const look = looks[key];
    const mood = `${look.title} · ${questions[2].options[answers[2]][0].toLowerCase()}`;
    $('#finder-content').innerHTML = `<p class="eyebrow">YOUR SIGNATURE MOOD</p><h2 id="finder-title">${look.title.replace(' ', '<br><em>')}.</em></h2><img class="finder-result-img" src="assets/${key}.jpg" alt="${look.title}, AI-created editorial inspiration"><p>${look.description}</p><p style="margin-top:12px;color:var(--accent)">${questions[0].options[answers[0]][0]} · ${questions[2].options[answers[2]][0]}</p><div class="finder-result-actions"><button class="button button-dark" id="finder-use">Make this my starting point ↗</button><button class="text-link" id="finder-restart">Explore again ↺</button><button class="text-link finder-save" data-save="${key}" aria-pressed="false">Save this edit</button></div><p class="fine-print" style="margin-top:18px">A creative starting point, using AI-created editorial inspiration. Your final look is yours to dream up with Gagan.</p>`;
    $('#finder-use').addEventListener('click', () => { setMood(mood); $('#look-finder').close(); goToEnquiry(questions[0].options[answers[0]][0]); });
    $('#finder-restart').addEventListener('click', () => { finderStep = 0; answers = []; renderFinder(); });
    syncSavedControls();
    $('#finder-use').focus({ preventScroll: true });
  }
  $$('.look-finder-open').forEach(button => button.addEventListener('click', () => { finderStep = 0; answers = []; renderFinder(); openDialog($('#look-finder')); }));

  const sourceImage = $('#paint-stage>img:first-child');
  let currentPaintMood = 'rose';
  const brushStudio = createBrushStudio({
    stage: $('#paint-stage'), canvas: $('#reveal-canvas'), image: sourceImage,
    cursor: $('.paint-cursor'), size: $('#brush-size'), prompt: $('.paint-prompt'),
    status: $('#paint-status'), toggle: $('#brush-touch-toggle'), revealButton: $('#reveal-all'),
    slider: $('#split-reveal'), splitControls: $('#split-controls'), guide: $('.split-guide'), motionAllowed
  });
  $$('.studio-mode button').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.revealMode;
    $$('.studio-mode button').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    $('.brush-size-label').hidden = mode === 'split';
    brushStudio.setMode(mode);
  }));
  $$('.paint-moods button').forEach(button => button.addEventListener('click', () => {
    currentPaintMood = button.dataset.paint;
    $('#save-studio').dataset.save = currentPaintMood;
    syncSavedControls();
    $$('.paint-moods button').forEach(b => { const active = b === button; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
    brushStudio.pause();
    sourceImage.alt = looks[currentPaintMood].title + ', AI-created editorial inspiration in the interactive brush studio';
    sourceImage.src = `assets/${currentPaintMood}.jpg`;
    if (sourceImage.complete && sourceImage.naturalWidth) brushStudio.reset();
  }));
  $('#keep-paint-mood').addEventListener('click', () => { setMood(looks[currentPaintMood].mood); goToEnquiry(); });
  $('#reset-reveal').addEventListener('click', brushStudio.reset);
  $('#reveal-all').addEventListener('click', brushStudio.revealAll);

  const today = new Date();
  const localISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  form.elements.date.min = localISO;
  updateFormProgress();
  let enquiryText = '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const date = new Date(data.get('date') + 'T12:00:00');
    const formattedDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(date);
    enquiryText = `Hi Gagan,\n\nI’d love to enquire about Royal Rose Studio for my celebration.\n\nName: ${String(data.get('name')).trim()}\nEmail: ${String(data.get('email')).trim()}\nOccasion: ${data.get('occasion')}\nEvent date: ${formattedDate}\nCity: ${data.get('city')}${data.get('time') ? '\nReady-by time: ' + data.get('time') : ''}${data.get('occasion') === 'Multiple celebrations' && data.getAll('celebrations').length ? '\nCelebrations: ' + data.getAll('celebrations').join(', ') : ''}${selectedMood ? '\nInspiration mood: ' + selectedMood : ''}\n\nMy vision:\n${String(data.get('vision')).trim() || 'I’d love to explore the possibilities with you.'}\n\nPlease let me know about availability and the next steps.\n\nThank you!`;
    $('#email-preview').textContent = enquiryText;
    const subject = `Royal Rose enquiry — ${data.get('occasion')} — ${formattedDate}`;
    $('#email-send').href = `mailto:bookings.royalrosebygagan@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(enquiryText)}`;
    $('#copy-status').textContent = 'Your enquiry has not been sent. Please send it from your email app.';
    $('#copy-enquiry').textContent = 'Copy message';
    openDialog($('#email-dialog'));
  });
  $('#copy-enquiry').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(enquiryText);
      $('#copy-enquiry').textContent = 'Copied ✓';
      $('#copy-status').textContent = 'Message copied. Paste it into an email to bookings.royalrosebygagan@outlook.com.';
    } catch {
      const selection = window.getSelection(); const range = document.createRange();
      range.selectNodeContents($('#email-preview')); selection.removeAllRanges(); selection.addRange(range);
      $('#copy-status').textContent = 'The message is selected. Use your device’s Copy command, then paste it into your email.';
    }
  });
  function showInfo(title, paragraphs) {
    $('#info-title').textContent = title;
    $('#info-content').replaceChildren(...paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
    openDialog($('#info-dialog'));
  }
  $('#privacy-open').addEventListener('click', event => {
    event.preventDefault();
    showInfo('A little privacy.', ['The enquiry builder keeps your entries in this page while it is open. It does not save them to a database or send them automatically. There are no analytics or advertising trackers in this website.', 'Your light/dark theme, motion preferences and saved inspiration edits are kept on this device. The Instagram gallery temporarily remembers post order in this browser tab so its next mix can differ. You can clear your collected edits from your saved edits. Your enquiry details are not saved between page loads.', 'When you choose “Open email app”, your email app receives the enquiry draft. You choose whether to send it to Royal Rose Studio. “Copy message” copies the text to your clipboard. External social links follow those platforms’ privacy practices.', 'Please avoid sharing sensitive medical details here. You can discuss any relevant sensitivities directly with Gagan.']);
  });
  $('#facebook-info').addEventListener('click', () => showInfo('Find us on Facebook.', ['Search Facebook for “Royal Rose Studio”. The studio’s exact Facebook page URL has not been added yet.', 'You can also find Gagan on Instagram at @royalrosestudiobygagan, or call 916-217-9247.']));
})();
