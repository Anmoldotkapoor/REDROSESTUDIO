export const INSTAGRAM_USERNAME = 'royalrosestudiobygagan';
export const INSTAGRAM_PROFILE = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

export function postCode(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !['instagram.com', 'www.instagram.com'].includes(url.hostname) || url.username || url.password) return null;
    const match = url.pathname.match(/^\/(?:royalrosestudiobygagan\/)?(?:p|reel)\/([A-Za-z0-9_-]+)\/?$/);
    return match?.[1] ?? null;
  } catch { return null; }
}

export function normaliseFeed(value, baseUrl) {
  if (value?.version !== 1 || value.username !== INSTAGRAM_USERNAME || !Array.isArray(value.posts)) return [];
  const seen = new Set();
  return value.posts.slice(0, 60).flatMap(post => {
    const code = postCode(post?.permalink);
    if (!code || seen.has(code) || typeof post.image !== 'string' || !/^assets\/instagram\/[A-Za-z0-9_-]+\.(?:jpg|png|webp)$/.test(post.image)) return [];
    seen.add(code);
    return [{
      id: code,
      permalink: `https://www.instagram.com/${post.type === 'VIDEO' ? 'reel' : 'p'}/${code}/`,
      image: new URL(post.image, baseUrl).href,
      alt: typeof post.alt === 'string' ? post.alt.slice(0, 300) : 'Makeup and artistry from Royal Rose Studio’s Instagram',
      caption: typeof post.caption === 'string' ? post.caption.slice(0, 220) : '',
      type: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'].includes(post.type) ? post.type : 'IMAGE',
      timestamp: typeof post.timestamp === 'string' && /^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(post.timestamp) && Number.isFinite(Date.parse(post.timestamp)) ? post.timestamp : ''
    }];
  });
}

export function selectPosts(posts, previous = [], random = Math.random, limit = 5) {
  const shuffled = [...posts];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  // Avoid an identical composition on a reload in this tab, including a two-post feed.
  if (shuffled.length > 1 && shuffled.slice(0, limit).every((post, i) => post.id === previous[i])) shuffled.push(shuffled.shift());
  return shuffled.slice(0, limit);
}
