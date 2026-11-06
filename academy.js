import { courses, locations, formatLabels, normalizeSelection, chooseCourse, buildEnquiry } from './academy-data.mjs?v=afdd2584cf';
import { configureInstagramLinks } from './instagram-links.mjs?v=27bca4c578';

configureInstagramLinks();

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const root = document.documentElement;
root.classList.add('js');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed = () => !reducedMotion.matches && root.dataset.motion !== 'off';
function remember(key, value) { try { localStorage.setItem(key, value); } catch {} }
function applyTheme(theme) {
  root.dataset.theme = theme;
  $('#theme-toggle').removeAttribute('aria-pressed');
  const next = theme === 'dark' ? 'light' : 'dark';
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${next} mode`);
  $('#theme-toggle').title = `Switch to ${next} mode`;
  $('#theme-label').textContent = next === 'light' ? 'Light' : 'Dark';
  $('meta[name="theme-color"]').content = theme === 'dark' ? '#210e18' : '#faf3ed';
}
applyTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
$('#theme-toggle').addEventListener('click', () => { applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); remember('royal-rose-theme', root.dataset.theme); });

const menu = $('.menu-toggle');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open menu');
  $('#mobile-nav').hidden = true; document.body.classList.remove('menu-open');
}
menu.addEventListener('click', () => {
  if (menu.getAttribute('aria-expanded') === 'true') { closeMenu(); return; }
  menu.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-label', 'Close menu');
  $('#mobile-nav').hidden = false; document.body.classList.add('menu-open');
});
$$('#mobile-nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('pointerdown', e => { if (!menu.contains(e.target) && !$('#mobile-nav').contains(e.target)) closeMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
matchMedia('(min-width:701px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); reveals.unobserve(entry.target); }
}), { threshold: .08 });
$$('.reveal').forEach(el => reveals.observe(el));
let scrollFrame = 0;
function scrollDetails() {
  const range = root.scrollHeight - innerHeight;
  $('.reading-progress span').style.transform = `scaleX(${range > 0 ? Math.min(scrollY / range, 1) : 0})`;
  $('.header').classList.toggle('scrolled', scrollY > 30);
  document.body.classList.toggle('footer-in-view', $('.footer').getBoundingClientRect().top < innerHeight - 80);
  scrollFrame = 0;
}
addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(scrollDetails); }, { passive: true });
addEventListener('resize', scrollDetails, { passive: true }); scrollDetails();
$('#year').textContent = new Date().getFullYear();

let selection = normalizeSelection();
let pathFilter = 'all';
let dialogCourse = courses[0].id;
const planner = $('#academy-planner');
function renderLocation() {
  const location = locations.find(c => c.id === selection.city);
  $$('.city-choice').forEach(button => {
    const active = button.dataset.city === selection.city;
    button.setAttribute('aria-pressed', String(active)); button.classList.toggle('active', active);
  });
  $('#city-title').textContent = location ? location.name : 'Where would you love to learn?';
  $('#city-region').textContent = location ? location.region : 'NORTHERN CALIFORNIA · SURREY, BC';
  $('#city-copy').textContent = location
    ? `Ask Gagan about training in ${location.name}. Your session dates, venue and learning arrangements will be confirmed directly with her.`
    : 'Explore training enquiries across Yuba City, Lincoln, Sacramento, Elk Grove and Surrey, BC. Choose your city to add it to your enquiry.';
}
function renderEnquiry() {
  const draft = buildEnquiry(selection); selection = draft.selection;
  const course = courses.find(c => c.id === selection.course);
  $('#course-select').value = selection.course;
  const formatSelect = $('#format-select');
  if (formatSelect.dataset.course !== course.id) {
    formatSelect.replaceChildren(...course.formats.map(value => new Option(formatLabels[value], value)));
    formatSelect.dataset.course = course.id;
  }
  formatSelect.value = selection.format;
  $('#city-select').value = selection.city;
  $('#experience-select').value = selection.experience;
  $('#enquiry-whatsapp').href = draft.whatsapp; $('#enquiry-email').href = draft.email;
  $('#academy-message').textContent = draft.message;
  $('#planner-course-title').textContent = course.title;
  $('#planner-format-note').textContent = course.formats.length === 1
    ? `${formatLabels[course.formats[0]]}. Gagan will share the full arrangements with you.`
    : 'Explore one-to-one or group learning. Gagan will confirm the arrangements with you.';
  $$('.course-card').forEach(card => card.classList.toggle('is-selected', card.dataset.course === selection.course));
  renderLocation();
}
function updateSelectionFromPlanner() {
  const before = $('#format-select').value;
  selection = normalizeSelection({ course: $('#course-select').value, format: before, city: $('#city-select').value, experience: $('#experience-select').value, goal: $('#academy-goal').value });
  renderEnquiry();
  if (before !== selection.format) $('#planner-status').textContent = `This path is offered as ${selection.format === 'group' ? 'group learning' : 'one-to-one training'} with Gagan.`;
}
planner.addEventListener('input', updateSelectionFromPlanner);
planner.addEventListener('change', updateSelectionFromPlanner);
planner.addEventListener('submit', e => e.preventDefault());
function selectPath(id, format) {
  selection = chooseCourse(selection, id, format); renderEnquiry();
  $('#planner-status').textContent = `${courses.find(c => c.id === selection.course).title} is ready to discuss with Gagan.`;
  $('#academy-enquire').scrollIntoView({ behavior: motionAllowed() ? 'smooth' : 'instant', block: 'start' });
  $('#course-select').focus({ preventScroll: true });
}
$$('[data-choose-course]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault(); selectPath(a.dataset.chooseCourse, pathFilter === 'group' ? 'group' : undefined);
}));
$$('[data-path-filter]').forEach(button => button.addEventListener('click', () => {
  pathFilter = button.dataset.pathFilter;
  $$('[data-path-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  let count = 0;
  $$('.course-card').forEach(card => {
    const show = pathFilter === 'all' || courses.find(c => c.id === card.dataset.course).tags.includes(pathFilter);
    card.hidden = !show; if (show) count++;
  });
  $('#path-count').textContent = `${count} ${count === 1 ? 'path' : 'paths'} to explore`;
}));
$$('.city-choice').forEach(button => button.addEventListener('click', () => {
  selection.city = button.dataset.city; renderEnquiry();
  $('#city-status').textContent = `${locations.find(c => c.id === selection.city).name} added to your enquiry.`;
}));

function openDialog(dialog) { pauseStudy(); closeMenu(); if (!dialog.open) dialog.showModal(); }
$$('.modal').forEach(dialog => {
  $('.modal-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
});
$$('[data-course-details]').forEach(button => button.addEventListener('click', () => {
  dialogCourse = button.dataset.courseDetails;
  const course = courses.find(c => c.id === dialogCourse);
  $('#course-dialog-title').textContent = course.title;
  $('#course-dialog-image').src = course.image;
  $('#course-dialog-image').alt = course.imageAlt;
  $('#course-dialog-category').textContent = course.category;
  $('#course-dialog-copy').textContent = course.description;
  $('#course-dialog-topics').replaceChildren(...course.topics.map(topic => { const li = document.createElement('li'); li.textContent = topic; return li; }));
  $('#course-dialog-note').textContent = course.note;
  $('#course-dialog-formats').textContent = course.formats.map(value => formatLabels[value]).join(' · ');
  const draft = buildEnquiry(chooseCourse(selection, course.id, pathFilter === 'group' ? 'group' : undefined));
  $('#dialog-whatsapp').href = draft.whatsapp; $('#dialog-email').href = draft.email;
  openDialog($('#course-dialog'));
}));
$('#dialog-personalise').addEventListener('click', () => { $('#course-dialog').close(); selectPath(dialogCourse, pathFilter === 'group' ? 'group' : undefined); });
$('#copy-academy-message').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(buildEnquiry(selection).message);
    $('#copy-academy-status').textContent = 'Copied. Paste it into your preferred message or email app.';
  } catch {
    $('#message-preview').open = true;
    $('#copy-academy-status').textContent = 'Open the message preview below to select and copy the text.';
  }
});
$('#facebook-info').addEventListener('click', () => openDialog($('#facebook-dialog')));

const studySteps = [
  { id: 'place', title: 'Begin with intention.', copy: 'A deliberate first mark gives a look its direction. In training, explore placement, tools and the effect you want to create.', cue: '01 / PLACE THE COLOUR' },
  { id: 'blend', title: 'Soften the edges.', copy: 'Watch colour meet colour. Explore brush movement, pressure and the transition from one tone to the next.', cue: '02 / FIND THE FLOW' },
  { id: 'refine', title: 'See the whole picture.', copy: 'Step back and look at the balance. The finishing touch is knowing which detail deserves a little more attention.', cue: '03 / REFINE THE FEELING' }
];
let studyStep = 0, studyPlaying = false, studyTimer = 0;
function renderStudy() {
  const step = studySteps[studyStep];
  $('#lesson-stage').dataset.step = step.id;
  $('#lesson-title').textContent = step.title; $('#lesson-copy').textContent = step.copy;
  $('#lesson-cue').textContent = step.cue;
  $$('.lesson-step').forEach((b, i) => b.setAttribute('aria-pressed', String(i === studyStep)));
  $('#lesson-stage').classList.toggle('is-playing', studyPlaying);
  $('#lesson-play').setAttribute('aria-pressed', String(studyPlaying));
  $('.play-symbol').textContent = studyPlaying ? 'Ⅱ' : '▶';
  $('#lesson-play-label').textContent = studyPlaying ? 'Pause the brush study' : 'Play the brush study';
}
function pauseStudy() {
  clearTimeout(studyTimer); studyPlaying = false; renderStudy();
}
function nextStudy() {
  if (!studyPlaying || !motionAllowed()) { pauseStudy(); return; }
  studyStep = (studyStep + 1) % studySteps.length; renderStudy();
  studyTimer = setTimeout(nextStudy, 2400);
}
$('#lesson-play').addEventListener('click', () => {
  if (studyPlaying) { pauseStudy(); return; }
  if (!motionAllowed()) return;
  studyPlaying = true; renderStudy(); studyTimer = setTimeout(nextStudy, 2400);
});
$$('.lesson-step').forEach((button, index) => button.addEventListener('click', () => {
  pauseStudy(); studyStep = index; renderStudy();
  $('#lesson-status').textContent = studySteps[index].title;
}));
function updateMotion() {
  const on = motionAllowed();
  $('#motion-toggle').setAttribute('aria-label', reducedMotion.matches ? 'Motion off, following your system preference' : `Turn motion ${on ? 'off' : 'on'}`);
  $('#motion-toggle').setAttribute('aria-pressed', String(!on)); $('#motion-toggle').disabled = reducedMotion.matches;
  $('#motion-toggle span').textContent = on ? 'on' : 'off';
  $('#lesson-play').disabled = !on;
  $('#lesson-motion-note').textContent = on ? 'An animated colour study. Press play, or explore each movement.' : 'Motion is off. Explore each movement with the buttons below.';
  if (!on) pauseStudy();
}
$('#motion-toggle').addEventListener('click', () => {
  root.dataset.motion = motionAllowed() ? 'off' : 'on'; remember('royal-rose-motion', root.dataset.motion); updateMotion();
});
reducedMotion.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseStudy(); });
new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pauseStudy(); }, { threshold: .05 }).observe($('#atelier'));
renderEnquiry(); renderStudy(); updateMotion();
