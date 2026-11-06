import { normaliseFeed, selectPosts } from './instagram-data.mjs?v=c7266b9d95';

const section = document.querySelector('#instagram');
if (section) {
  const gallery = section.querySelector('#instagram-collage');
  const shuffle = section.querySelector('#instagram-shuffle');
  const controls = section.querySelector('#instagram-swipe-controls');
  const previous = section.querySelector('#instagram-previous');
  const next = section.querySelector('#instagram-next');
  const position = section.querySelector('#instagram-position');
  const status = section.querySelector('#instagram-status');
  const mobile = matchMedia('(max-width: 700px)');
  const storageKey = 'royal-rose-instagram-order';
  let feed = [];
  let displayed = [];
  let scrollFrame = 0;
  let requested = false;
  const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  function lastOrder() { try { return JSON.parse(sessionStorage.getItem(storageKey)) || []; } catch { return []; } }
  function updatePosition() {
    const cards = [...gallery.querySelectorAll('.instagram-card')];
    if (!cards.length) return;
    const left = gallery.getBoundingClientRect().left;
    const current = cards.reduce((best, card, index) => Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left) ? index : best, 0);
    position.textContent = `${current + 1} / ${cards.length}`;
    previous.disabled = current === 0;
    next.disabled = current === cards.length - 1;
    controls.hidden = !mobile.matches || cards.length < 2;
    scrollFrame = 0;
  }
  function render(announce = false) {
    displayed = selectPosts(feed, lastOrder());
    if (!displayed.length) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(displayed.map(post => post.id))); } catch {}
    const cards = displayed.map(post => {
      const kind = post.type === 'VIDEO' ? 'Reel' : post.type === 'CAROUSEL_ALBUM' ? 'Photos' : 'Post';
      const date = post.timestamp ? dateFormat.format(new Date(post.timestamp)) : '';
      const card = document.createElement('a');
      card.className = 'instagram-card';
      card.style.setProperty('--instagram-image', `url("${post.image}")`);
      card.href = post.permalink;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.setAttribute('aria-label', `Open Royal Rose Instagram ${kind.toLowerCase()}${date ? ` from ${date}` : ''} (opens in a new tab)`);
      const image = document.createElement('img');
      image.src = post.image;
      image.alt = post.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = 640;
      image.height = 800;
      image.addEventListener('error', () => {
        image.hidden = true;
        card.classList.add('instagram-image-unavailable');
      }, { once: true });
      const badge = document.createElement('span');
      badge.className = 'instagram-kind';
      badge.textContent = kind;
      const arrow = document.createElement('span');
      arrow.className = 'instagram-open';
      arrow.textContent = '↗';
      arrow.setAttribute('aria-hidden', 'true');
      const caption = document.createElement('span');
      caption.className = 'instagram-card-caption';
      const label = document.createElement('span');
      label.textContent = 'THE ROYAL ROSE JOURNAL';
      const action = document.createElement('span');
      action.textContent = `${date ? `${date} · ` : ''}View on Instagram`;
      caption.append(label, action);
      card.append(image, badge, arrow, caption);
      return card;
    });
    gallery.replaceChildren(...cards);
    gallery.scrollTo({ left: 0, behavior: 'instant' });
    shuffle.hidden = feed.length < 2;
    updatePosition();
    if (announce) status.textContent = `A fresh mix of ${displayed.length} Instagram posts. Tap any image to open its original post.`;
  }
  function move(direction) {
    const cards = [...gallery.children];
    const current = Number(position.textContent.split('/')[0]) - 1;
    const target = cards[Math.max(0, Math.min(cards.length - 1, current + direction))];
    if (!target) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
    gallery.scrollTo({ left: target.offsetLeft - cards[0].offsetLeft, behavior: still ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  shuffle.addEventListener('click', () => render(true));
  gallery.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updatePosition); }, { passive: true });
  gallery.addEventListener('keydown', event => {
    if (event.target !== gallery || !mobile.matches || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  mobile.addEventListener('change', updatePosition);
  addEventListener('resize', updatePosition, { passive: true });
  async function loadFeed() {
    if (requested) return;
    requested = true;
    try {
      const feedUrl = new URL(section.dataset.instagramFeed, location.href);
      const response = await fetch(feedUrl, { cache: 'no-cache', credentials: 'omit', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Feed unavailable');
      const data = await response.json();
      if (data?.version !== 1 || data.username !== 'royalrosestudiobygagan' || !Array.isArray(data.posts)) throw new Error('Invalid feed');
      const posts = normaliseFeed(data, new URL('../', feedUrl).href);
      if (data.posts.length && !posts.length) throw new Error('Invalid posts');
      // A successful empty sync removes deleted or no-longer-public previews.
      if (!posts.length) {
        gallery.replaceChildren();
        shuffle.hidden = true;
        controls.hidden = true;
        const link = document.createElement('a');
        link.className = 'instagram-empty';
        link.href = 'https://www.instagram.com/royalrosestudiobygagan/';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Find the next chapter on Instagram ↗';
        gallery.append(link);
        return;
      }
      feed = posts;
      render();
    } catch {
      // Keep the real, locally hosted post previews if the feed cannot be refreshed.
      const cards = [...gallery.children];
      feed = normaliseFeed({ version: 1, username: 'royalrosestudiobygagan', posts: cards.map(card => ({ permalink: card.href, image: card.querySelector('img')?.getAttribute('src'), alt: card.querySelector('img')?.alt, type: card.querySelector('.instagram-kind')?.textContent === 'Reel' ? 'VIDEO' : 'IMAGE' })) }, location.href);
      if (feed.length) render();
    }
  }
  updatePosition();
  // Fetch once on each visit; no Meta scripts, third-party embeds or visitor tracking.
  loadFeed();
}
