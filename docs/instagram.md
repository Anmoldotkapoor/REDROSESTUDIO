# Instagram gallery

Public profile: https://www.instagram.com/royalrosestudiobygagan/

The homepage displays five randomly selected post previews from a collection of seven verified Royal Rose posts. Desktop uses a collage; phones have native horizontal scrolling, scroll snap, previous/next buttons and a position indicator. Keyboard users can focus the gallery and use arrow keys on narrow layouts. Each card links to its original Instagram post or reel. Desktop opens a new tab. Android uses a user-tapped Instagram app intent with the original HTTPS post as browser fallback. iPhone and iPad use direct cross-domain universal links in the same context so iOS can hand off to the installed app, with standard web fallback. The profile icons and Academy profile link use the same routing. No timer, forced App Store redirect or app launch without a tap is used. Browser/OS preferences or embedded browsers may still keep links on the web; a website cannot override those preferences. A fresh mix button reshuffles immediately. Reloading the same tab avoids the identical order where multiple posts are available.

The images are actual previews published by Royal Rose Studio, not AI editorial concepts. Full preview images fit inside the frames with a soft image backdrop, preserving faces and any text in the original. No Instagram embed scripts or trackers load on the visitor's device. The site hosts its own cached previews so expiring Instagram CDN URLs cannot break older snapshots. Only post-order IDs are stored in sessionStorage, alongside the website's existing device preferences.

## Owner's selected approach: free and manually maintained

The owner chose to keep the gallery free and update the post collection manually. There is no active automatic sync workflow, feed subscription, Meta developer app, Instagram login, access token, password or cookie. New Instagram uploads do not appear automatically. The existing collection reshuffles on page load and when a visitor selects “A fresh mix”.

An anonymous public-profile refresh succeeded locally with seven posts. The same request was blocked from GitHub's hosted runner, so it was not treated as a working automatic update integration. A third-party link-only feed was also previewed, but no account or subscription was created and none is required for the selected gallery. The failed scheduled workflow was removed.

## Refreshing the collection

From the public GitHub checkout, run:

```sh
node scripts/sync-instagram.mjs
python3 scripts/check-static.py
node --test tests/instagram.test.mjs
```

Review and publish the changed `index.html`, `data/instagram-feed.json` and `assets/instagram/` files through the normal GitHub publishing flow. The refresh command is a maintenance tool, not a background service. If anonymous access is blocked, the previous gallery stays intact. New post links and business-provided images can also be added manually to the same snapshot and fallback markup. Keep each cached image paired with its original permalink. Do not substitute editorial/AI images for Instagram previews.

The refresh script makes one anonymous request to the supplied public profile URL, parses JSON already included in its public HTML, and accepts only previews explicitly belonging to `royalrosestudiobygagan`. It does not execute Instagram scripts, use private endpoints, log in, replay browser sessions, solve challenges or bypass access restrictions. It validates image hosts, file signatures and sizes, creates image files with content hashes, updates the JSON and escaped static fallback cards, and removes obsolete previews. Download failures leave the prior snapshot intact. A valid private, unpublished or empty account snapshot removes the gallery previews.

This public-page format is unsupported and may change. Only previews exposed by the public page enter the collection, up to 24 per maintenance run. It is not a complete account archive. The original private Sites copy reads the published GitHub snapshot and images; its local static previews remain available if that request fails. After publishing collection changes, update the original source snapshot as part of normal maintenance.

## Source posts

- https://www.instagram.com/reel/DfZTAvJofBn/
- https://www.instagram.com/reel/DfV73Zao9A4/
- https://www.instagram.com/p/DfSkfv-volV/
- https://www.instagram.com/p/DfRX4n5G4IR/
- https://www.instagram.com/reel/DfRCNQFDaph/
- https://www.instagram.com/p/DfNyfroBNDO/
- https://www.instagram.com/reel/DfJjtAGI3tM/

## Validation

Eleven Instagram tests cover public-page extraction, exact account matching, reel/carousel types, date extraction, login walls, genuine empty/private profiles, safe image paths and permalinks, unique/nonrepeating compositions, allowed CDN hosts, HTML escaping, Android intent destinations/fallbacks, iPhone/iPad universal links, desktop targets, unsafe-link rejection, anonymous fetching, content hashes, no-op syncs, removed posts and preserving prior content after failures. All 25 tests across Instagram, Academy and the brush studio passed.

Browser checks covered 320, 390, 430, 768, 1024 and 1440 pixels in dark/light themes, no document overflow, loaded images, changed compositions on reload/shuffle, and phone next/previous controls. Physical phone hardware was not available. The public-link maintenance command successfully retrieved seven posts; cloud automatic syncing was explicitly left out of the owner's selected approach.

Phone link implementation follows [Chrome Android intents](https://developer.chrome.com/docs/android/intents) and [Apple universal links](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content). Device routing is tested with iPhone, iPad, iPad desktop-mode and Android user-agent fixtures. A physical installed Instagram app was not available for end-to-end launch verification.
