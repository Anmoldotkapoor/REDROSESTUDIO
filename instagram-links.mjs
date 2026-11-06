export function instagramPlatform(device = {}) {
  const userAgent = device.userAgent || '';
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPad|iPhone|iPod/i.test(userAgent) || device.platform === 'MacIntel' && device.maxTouchPoints > 1) return 'ios';
  return 'desktop';
}

export function instagramDestination(value, device = {}) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || !['instagram.com','www.instagram.com'].includes(url.hostname) || url.port || url.username || url.password) return null;
  let path;
  if (/^\/royalrosestudiobygagan\/?$/.test(url.pathname)) path = '/royalrosestudiobygagan/';
  else {
    const match = url.pathname.match(/^\/(?:royalrosestudiobygagan\/)?(p|reel)\/([A-Za-z0-9_-]+)\/?$/);
    if (!match) return null;
    path = `/${match[1]}/${match[2]}/`;
  }
  const webUrl = `https://www.instagram.com${path}`;
  const platform = instagramPlatform(device);
  if (platform === 'android') return {
    webUrl, platform, target:'_self',
    href:`intent://www.instagram.com${path}#Intent;scheme=https;package=com.instagram.android;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
  };
  // Cross-domain universal links let iOS open its associated installed app.
  // Same-context navigation preserves app handoff and a normal web fallback.
  return {webUrl, platform, target:platform === 'ios' ? '_self' : '_blank', href:webUrl};
}

export function configureInstagramLink(anchor, device = navigator) {
  const result = instagramDestination(anchor.dataset.instagramWebUrl || anchor.getAttribute('href'), device);
  if (!result) return;
  anchor.dataset.instagramWebUrl = result.webUrl;
  anchor.dataset.instagramPlatform = result.platform;
  anchor.href = result.href;
  anchor.target = result.target;
  anchor.rel = 'noopener noreferrer';
  const label = anchor.getAttribute('aria-label');
  if (label && result.platform !== 'desktop' && !label.includes('opens Instagram app')) anchor.setAttribute('aria-label', label.replace(' (opens in a new tab)', '') + ' (opens Instagram app when available)');
}

export function configureInstagramLinks(root = document, device = navigator) {
  for (const anchor of root.querySelectorAll('a[href]')) configureInstagramLink(anchor, device);
}
