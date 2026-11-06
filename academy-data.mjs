export const courses = [
  {
    id: 'personal', title: 'The Personal Beauty Edit', category: 'For your own makeup',
    image: 'assets/academy-personal.jpg', imageAlt: 'Editorial study of personal makeup practice with a compact mirror and rose lip colour',
    tags: ['self'], formats: ['one-to-one'],
    description: 'Get to know your own features, your tools and the makeup you love wearing. A personal starting point for a routine that feels like you.',
    topics: ['Your tools, products and everyday routine', 'Skin preparation and complexion techniques', 'Eye, cheek and lip balance', 'Taking your look from day to occasion'],
    note: 'Bring your questions and tell Gagan what you would love to feel more confident creating.'
  },
  {
    id: 'foundations', title: 'The Artistry Foundation', category: 'For the artist beginning',
    image: 'assets/academy-foundations.jpg', imageAlt: 'Editorial study of hands practising colour blending with brushes, a palette and a practice sheet',
    tags: ['artist', 'group'], formats: ['one-to-one', 'group'],
    description: 'Explore the building blocks of makeup artistry, from brush choice and colour to bringing a complete look together.',
    topics: ['Brushes, product choices and preparation', 'Complexion, colour and blending', 'Eye, cheek and lip placement', 'Combining techniques into a complete look'],
    note: 'Share your current experience so Gagan can discuss a suitable learning starting point.'
  },
  {
    id: 'bridal', title: 'The Bridal Atelier', category: 'For your next creative chapter',
    image: 'assets/academy-bridal.jpg', imageAlt: 'Editorial study of a precision brush refining a rose and bronze bridal-inspired eye look',
    tags: ['artist', 'group'], formats: ['one-to-one', 'group'],
    description: 'Explore the details of bridal and occasion artistry: a considered look, thoughtful layers and the finishing touches that bring it together.',
    topics: ['Developing a look from a bridal brief', 'Complexion finish, definition and colour harmony', 'Layering and finishing techniques', 'Adapting a look for different celebrations'],
    note: 'Tell Gagan which skills you already practise and the bridal techniques you want to explore.'
  },
  {
    id: 'circle', title: 'The Beauty Circle', category: 'For learning together',
    image: 'assets/academy-circle.jpg', imageAlt: 'Editorial concept of three adult learners sharing makeup practice around a studio table',
    tags: ['group'], formats: ['group'],
    description: 'Bring your shared curiosity. Explore makeup in a group session with a demonstration theme, guided practice and space for questions.',
    topics: ['A demonstration theme for your group', 'Guided practice and questions', 'Exploring products and brush techniques', 'Adapting the ideas to your group’s interests'],
    note: 'Share your group’s interests and preferred city. Gagan will discuss the format and arrangements with you.'
  }
];

export const locations = [
  { id: 'yuba-city', name: 'Yuba City', region: 'Northern California' },
  { id: 'lincoln', name: 'Lincoln', region: 'Northern California' },
  { id: 'sacramento', name: 'Sacramento', region: 'Northern California' },
  { id: 'elk-grove', name: 'Elk Grove', region: 'Northern California' },
  { id: 'surrey', name: 'Surrey, BC, Canada', region: 'British Columbia, Canada' }
];

export const experienceLabels = {
  new: 'I’m just starting',
  personal: 'I’m comfortable doing my own makeup',
  practising: 'I’m a practising makeup artist'
};
export const formatLabels = { 'one-to-one': 'One-to-one with Gagan', group: 'Group learning with Gagan' };

export function normalizeSelection(input = {}) {
  const course = courses.find(c => c.id === input.course) || courses[0];
  return {
    course: course.id,
    format: course.formats.includes(input.format) ? input.format : course.formats[0],
    city: locations.some(c => c.id === input.city) ? input.city : '',
    experience: Object.prototype.hasOwnProperty.call(experienceLabels, input.experience) ? input.experience : '',
    goal: typeof input.goal === 'string' ? input.goal.trim().slice(0, 500) : ''
  };
}

export function chooseCourse(selection, id, preferredFormat) {
  return normalizeSelection({ ...selection, course: id, format: preferredFormat || selection.format });
}

export function buildEnquiry(input) {
  const selected = normalizeSelection(input);
  const course = courses.find(c => c.id === selected.course);
  const location = locations.find(c => c.id === selected.city);
  const message = [
    'Hi Gagan,', '', 'I’d love to learn with you at Royal Rose Academy.', '',
    `Learning path: ${course.title}`,
    `Format: ${formatLabels[selected.format]}`,
    `Preferred city: ${location ? location.name : 'Please advise on the available locations'}`,
    `My experience: ${experienceLabels[selected.experience] || 'I’d like to discuss my starting point'}`,
    ...(selected.goal ? ['', 'What I’d love to learn:', selected.goal] : []),
    '', 'Please share the course options, session arrangements, availability and pricing details.', '', 'Thank you!'
  ].join('\n');
  return {
    selection: selected, message,
    whatsapp: `https://wa.me/19162179247?text=${encodeURIComponent(message)}`,
    email: `mailto:bookings.royalrosebygagan@outlook.com?subject=${encodeURIComponent('Royal Rose Academy — ' + course.title)}&body=${encodeURIComponent(message)}`
  };
}
