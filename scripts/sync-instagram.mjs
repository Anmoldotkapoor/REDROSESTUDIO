// Public profile snapshots only: no Meta app, access token, login, cookies or private endpoints.
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INSTAGRAM_USERNAME, INSTAGRAM_PROFILE, postCode } from '../instagram-data.mjs';

export function parsePublicProfile(html) {
  if (typeof html !== 'string' || html.length > 4 * 1024 * 1024) throw new Error('Instagram returned an unsupported public page.');
  const posts = new Map();
  let profile = null;
  let visited = 0;
  function walk(value, depth = 0) {
    if (!value || typeof value !== 'object' || depth > 80 || ++visited > 100000) return;
    if (value.username?.toLowerCase() === INSTAGRAM_USERNAME && typeof value.is_private === 'boolean') profile = value;
    if (typeof value.code === 'string' && /^[A-Za-z0-9_-]+$/.test(value.code) && value.user?.username?.toLowerCase() === INSTAGRAM_USERNAME && typeof value.display_uri === 'string') {
      const type = value.media_type === 2 ? 'VIDEO' : value.media_type === 8 ? 'CAROUSEL_ALBUM' : 'IMAGE';
      const permalink = `https://www.instagram.com/${type === 'VIDEO' ? 'reel' : 'p'}/${value.code}/`;
      let timestamp = '';
      const match = value.accessibility_caption?.match(/\bon ([A-Za-z]+ \d{1,2}, \d{4})\./);
      if (match) { const date = Date.parse(match[1] + ' UTC'); if (Number.isFinite(date)) timestamp = new Date(date).toISOString().slice(0, 10); }
      posts.set(value.code, { id:value.code, permalink, preview:value.display_uri, alt:typeof value.accessibility_caption === 'string' ? value.accessibility_caption.slice(0,300) : 'Makeup and artistry from Royal Rose Studio’s Instagram', type, timestamp, caption:typeof value.caption?.text === 'string' ? value.caption.text.slice(0,220) : '' });
    }
    for (const child of Object.values(value)) walk(child, depth + 1);
  }
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (!/\btype=["']application\/json["']/i.test(script[1])) continue;
    let value;
    try { value = JSON.parse(script[2]); } catch { continue; }
    walk(value);
  }
  if (!profile) throw new Error('Instagram did not expose a public profile snapshot. The published gallery was preserved.');
  // If the owner makes the account private/unpublished, remove its public previews.
  if (profile.is_private || profile.is_unpublished) return [];
  if (!posts.size && profile.all_media_count !== 0) throw new Error('Instagram did not expose public post previews. The published gallery was preserved.');
  return [...posts.values()].slice(0, 24);
}

async function fetchPublicPage(fetcher) {
  try {
    const response = await fetcher(INSTAGRAM_PROFILE, { headers:{ 'User-Agent':'Mozilla/5.0 (compatible; RoyalRoseStudioGallery/1.0; +https://anmoldotkapoor.github.io/REDROSESTUDIO/)', Accept:'text/html', 'Accept-Language':'en-US,en;q=0.9' }, signal:AbortSignal.timeout(25000), redirect:'error' });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('Public page unavailable');
    const chunks=[]; let size=0;
    for await (const chunk of response.body) { size+=chunk.byteLength; if (size>4*1024*1024) throw new Error('Page too large'); chunks.push(chunk); }
    return Buffer.concat(chunks).toString('utf8');
  } catch { throw new Error('Instagram is limiting public access right now. The published gallery was preserved. No login or bypass was attempted.'); }
}

export function approvedMediaUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && ['cdninstagram.com', 'fbcdn.net'].some(host => url.hostname === host || url.hostname.endsWith('.' + host));
  } catch { return false; }
}
export function imageExtension(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'webp';
  throw new Error('Instagram returned an unsupported image format.');
}
export function fallbackMarkup(posts) {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  if (!posts.length) return `<a class="instagram-empty" href="${INSTAGRAM_PROFILE}" target="_blank" rel="noopener noreferrer">Find the next chapter on Instagram ↗</a>`;
  return posts.slice(0, 5).map(post => {
    const kind = post.type === 'VIDEO' ? 'Reel' : post.type === 'CAROUSEL_ALBUM' ? 'Photos' : 'Post';
    return `<a class="instagram-card" href="${escape(post.permalink)}" target="_blank" rel="noopener noreferrer" aria-label="Open Royal Rose Instagram ${kind.toLowerCase()} (opens in a new tab)"><img src="${escape(post.image)}" alt="${escape(post.alt)}" loading="lazy" decoding="async" width="640" height="800"><span class="instagram-kind">${kind}</span><span class="instagram-open" aria-hidden="true">↗</span><span class="instagram-card-caption"><span>THE ROYAL ROSE JOURNAL</span><span>View on Instagram</span></span></a>`;
  }).join('\n      ');
}
export async function updateFallback(root, posts) {
  const page = join(root, 'index.html');
  let html;
  try { html = await readFile(page, 'utf8'); } catch { return; }
  const next = html.replace(/<!-- instagram-posts:start -->[\s\S]*?<!-- instagram-posts:end -->/, `<!-- instagram-posts:start -->\n      ${fallbackMarkup(posts)}\n      <!-- instagram-posts:end -->`);
  if (next !== html) await writeFile(page, next);
}
async function fetchImage(url, fetcher) {
  if (!approvedMediaUrl(url)) throw new Error('Instagram returned an unsupported media host.');
  let response;
  try { response = await fetcher(url, { signal: AbortSignal.timeout(25000), redirect: 'error' }); }
  catch { throw new Error('An Instagram preview could not be downloaded.'); }
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Instagram returned an unavailable preview.');
  const maxBytes = 10 * 1024 * 1024;
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Instagram preview exceeds the image limit.');
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > maxBytes) throw new Error('Instagram preview exceeds the image limit.');
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  return { bytes, extension: imageExtension(bytes) };
}


export async function syncInstagram({ root, fetcher = fetch, now = Date.now() }) {
  const publicPosts = parsePublicProfile(await fetchPublicPage(fetcher));
  const posts = []; const files = []; const seen = new Set();
  for (const item of publicPosts) {
    const code = postCode(item.permalink);
    if (!code || seen.has(code)) continue;
    const { bytes, extension } = await fetchImage(item.preview, fetcher);
    const file = `${code}-${createHash('sha256').update(bytes).digest('hex').slice(0, 12)}.${extension}`;
    const { preview, ...post } = item;
    posts.push({ ...post, image:`assets/instagram/${file}` });
    files.push({ file, bytes }); seen.add(code);
  }
  const dataDirectory = join(root, 'data');
  const imageDirectory = join(root, 'assets/instagram');
  const feedFile = join(dataDirectory, 'instagram-feed.json');
  const feed = { version: 1, username: INSTAGRAM_USERNAME, profileUrl: INSTAGRAM_PROFILE, source: 'public-instagram-profile', syncedAt: new Date(now).toISOString(), posts };
  let old;
  try { old = JSON.parse(await readFile(feedFile, 'utf8')); } catch {}
  const changed = old?.source !== feed.source || JSON.stringify(old?.posts) !== JSON.stringify(posts);
  if (!changed) { await updateFallback(root, posts); return { changed: false, count: posts.length }; }
  // Complete all API/image requests before replacing the previous good snapshot.
  await mkdir(dataDirectory, { recursive: true });
  await mkdir(imageDirectory, { recursive: true });
  for (const file of files) await writeFile(join(imageDirectory, file.file), file.bytes);
  await writeFile(feedFile, JSON.stringify(feed, null, 2) + '\n');
  await updateFallback(root, posts);
  const keep = new Set(files.map(file => file.file));
  for (const file of await readdir(imageDirectory)) if (!keep.has(file) && /^[A-Za-z0-9_-]+\.(?:jpg|png|webp)$/.test(file)) await rm(join(imageDirectory, file));
  return { changed: true, count: posts.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await syncInstagram({ root: resolve(process.env.INSTAGRAM_SITE_ROOT || '.') });
    console.log(`Public Instagram check complete: ${result.count} previews, ${result.changed ? 'snapshot updated' : 'no post changes'}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
