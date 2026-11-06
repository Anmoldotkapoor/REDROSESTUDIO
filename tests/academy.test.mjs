import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { courses, locations, normalizeSelection, chooseCourse, buildEnquiry } from '../academy-data.mjs';

test('four distinct training paths have supported formats and no published fee data', () => {
  assert.equal(courses.length, 4);
  assert.equal(new Set(courses.map(c => c.id)).size, 4);
  assert.equal(new Set(courses.map(c => c.image)).size, 4);
  for (const course of courses) {
    assert.ok(course.title && course.description && course.topics.length >= 3);
    assert.ok(course.formats.length > 0);
    assert.ok(course.formats.every(value => ['one-to-one', 'group'].includes(value)));
    assert.equal(Object.prototype.hasOwnProperty.call(course, 'price'), false);
  }
});

test('all path / format combinations normalize to a format that path supports', () => {
  for (const course of courses) {
    for (const format of ['one-to-one', 'group', '', 'unsupported']) {
      const selection = normalizeSelection({ course: course.id, format });
      assert.ok(course.formats.includes(selection.format));
    }
  }
  assert.equal(normalizeSelection({ course: 'circle', format: 'one-to-one' }).format, 'group');
  assert.equal(normalizeSelection({ course: 'personal', format: 'group' }).format, 'one-to-one');
});

test('choosing paths preserves compatible preferences and corrects incompatible ones', () => {
  const selection = { course: 'foundations', format: 'group', city: 'surrey', experience: 'new', goal: 'Blend with confidence' };
  assert.equal(chooseCourse(selection, 'bridal').format, 'group');
  assert.equal(chooseCourse(selection, 'personal').format, 'one-to-one');
  assert.equal(chooseCourse(selection, 'bridal', 'one-to-one').city, 'surrey');
  assert.equal(chooseCourse(selection, 'bridal').goal, selection.goal);
});

test('every supported course and city reaches the correct WhatsApp and email recipients', () => {
  for (const course of courses) for (const city of locations) {
    const draft = buildEnquiry({ course: course.id, format: course.formats.at(-1), city: city.id, experience: 'new' });
    const whatsapp = new URL(draft.whatsapp), email = new URL(draft.email);
    assert.equal(whatsapp.origin, 'https://wa.me');
    assert.equal(whatsapp.pathname, '/19162179247');
    assert.equal(whatsapp.searchParams.get('text'), draft.message);
    assert.equal(email.protocol, 'mailto:');
    assert.equal(email.pathname, 'bookings.royalrosebygagan@outlook.com');
    assert.equal(email.searchParams.get('body'), draft.message);
    assert.ok(email.searchParams.get('subject').includes(course.title));
    assert.ok(draft.message.includes(course.title) && draft.message.includes(city.name));
    assert.ok(draft.message.includes('availability and pricing details'));
  }
});

test('free text stays inside the encoded message and cannot change recipients or headers', () => {
  const goal = 'Rose & gold? subject=other\ncc=someone@example.com\nI’d love to learn ✦';
  const draft = buildEnquiry({ course: 'bridal', format: 'group', city: 'surrey', goal });
  const whatsapp = new URL(draft.whatsapp), email = new URL(draft.email);
  assert.equal([...whatsapp.searchParams.keys()].join(','), 'text');
  assert.deepEqual([...email.searchParams.keys()], ['subject', 'body']);
  assert.ok(email.searchParams.get('body').includes(goal));
  assert.equal(email.pathname, 'bookings.royalrosebygagan@outlook.com');
});

test('unknown values fall back safely and optional text is limited without persistence', () => {
  const selection = normalizeSelection({ course: 'unknown', format: 'unknown', city: 'unknown', experience: '__proto__', goal: '  '+ 'a'.repeat(700) +'  ' });
  assert.equal(selection.course, 'personal'); assert.equal(selection.format, 'one-to-one');
  assert.equal(selection.city, ''); assert.equal(selection.experience, ''); assert.equal(selection.goal.length, 500);
  assert.equal(normalizeSelection({ goal: { unexpected: true } }).goal, '');
  assert.ok(buildEnquiry({}).message.includes('Please advise on the available locations'));
});

test('the static Academy page exposes every path, the teacher, both contact routes and no price amounts', async () => {
  const html = await readFile(new URL('../academy.html', import.meta.url), 'utf8');
  for (const course of courses) {
    assert.ok(html.includes('data-course="' + course.id + '"'));
    assert.ok(html.includes(course.title));
  }
  assert.ok(html.includes('PERSONALLY TAUGHT BY GAGAN'));
  assert.ok(html.includes('id="enquiry-whatsapp"') && html.includes('id="enquiry-email"'));
  assert.equal(/(?:[$£€]\s*\d|\b(?:USD|CAD)\s*\d)/i.test(html), false);
});
