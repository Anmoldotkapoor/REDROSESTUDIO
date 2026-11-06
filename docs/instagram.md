# Instagram gallery

Public profile: https://www.instagram.com/royalrosestudiobygagan/

The homepage displays five randomly selected post previews from the latest successful public-profile snapshot. Desktop uses a collage; phones have native horizontal scrolling, scroll snap, previous/next buttons and a position indicator. Keyboard users can focus the gallery and use arrow keys on narrow layouts. Each card opens its original Instagram post or reel in a new tab. A fresh mix button reshuffles immediately. Reloading the same tab avoids the identical order where multiple posts are available.

The photos are actual previews published by Royal Rose Studio, not AI editorial concepts. Full preview images are fitted inside the frames with a soft image backdrop, preserving faces and any text in the original. No Instagram embed scripts or trackers load on the visitor's device. The site hosts its own cached previews so expiring Instagram CDN URLs cannot break older snapshots. Only post-order IDs are stored in sessionStorage, alongside the website's existing device preferences.

## Automatic updates using the public Instagram link

No Meta developer app, Instagram login, access token, password, cookie, third-party feed subscription or repository secret is required.

`.github/workflows/instagram-sync.yml` checks the public profile every six hours, at minute 23 (UTC). GitHub may delay scheduled jobs. The same workflow can be run from **Actions → Refresh Instagram gallery → Run workflow**.

`scripts/sync-instagram.mjs` makes one anonymous request to the supplied public profile URL, parses JSON already included in its public HTML, and accepts only post previews explicitly belonging to `royalrosestudiobygagan`. It does not execute Instagram scripts, use private endpoints, log in, replay browser sessions, solve challenges or bypass access restrictions. It downloads up to 24 previews exposed by the public page, validates the image hosts/type/size, replaces the local JSON snapshot and static fallback cards, and removes obsolete cached previews. Only changed content creates a commit. The workflow explicitly requests a Pages build because commits made with GitHub's workflow token do not automatically trigger Pages builds.

The private original Sites copy reads the published GitHub snapshot and images, so it receives these data updates without a second deployment. Its local static post previews remain available if the cross-origin feed is unavailable.

### Reliability boundary

This is a best-effort public-page integration, not Instagram's supported API. Instagram can change its page structure, restrict anonymous access, or rate-limit GitHub's runners. If a page/download is blocked or no longer has the expected structure, the job fails visibly and leaves the last good published snapshot intact. It makes no attempt to evade the restriction. If the account is explicitly marked private or unpublished, or its valid public snapshot has zero posts, the next successful update removes the gallery previews. Only the previews exposed by the public page enter the random pool; this is not a complete account archive. New posts are eligible after a successful scheduled check and Pages deployment, rather than instantly after upload.

GitHub can disable schedules on inactive public repositories. Re-enable the workflow in Actions if that happens. If anonymous access stops working persistently, reliable unattended updates would require an authorized connection or a separately chosen feed provider. No such service, subscription or app has been created.

## Verified source posts

The initial snapshot was fetched anonymously from the public link and matched against the visible Instagram profile:

- https://www.instagram.com/reel/DfZTAvJofBn/
- https://www.instagram.com/reel/DfV73Zao9A4/
- https://www.instagram.com/p/DfSkfv-volV/
- https://www.instagram.com/p/DfRX4n5G4IR/
- https://www.instagram.com/reel/DfRCNQFDaph/
- https://www.instagram.com/p/DfNyfroBNDO/
- https://www.instagram.com/reel/DfJjtAGI3tM/

## Validation

`node --test tests/instagram.test.mjs` covers public-page extraction, account matching, reel/carousel types, date extraction, login walls, genuine empty/private profiles, safe image paths and permalinks, unique/nonrepeating compositions, allowed CDN hosts, HTML escaping, anonymous fetching, content hashes, no-op syncs, removed posts and preserving prior content after failures.

The local public-link sync fetched seven posts successfully. Browser checks covered 320, 390, 430, 768, 1024 and 1440 pixels in dark/light themes, no document overflow, loaded images, changed compositions on reload/shuffle, and phone next/previous controls. Physical phone hardware was not available. Hosted workflow results and live-page checks are recorded in the task handoff.

Sources: [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [workflow token trigger behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow), [requesting a Pages build](https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build). Instagram offers no stability guarantee for this public HTML format.
