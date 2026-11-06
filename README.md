# Royal Rose Studio by Gagan

Live site: https://anmoldotkapoor.github.io/REDROSESTUDIO/

Academy: https://anmoldotkapoor.github.io/REDROSESTUDIO/academy.html

The Velvet Rose experience: an editorial makeup and bridal artistry website with complete dark/light themes. Built with HTML, CSS and vanilla JavaScript; no framework, build dependency or API key is required.

## Local preview

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory .
```

Open http://127.0.0.1:4173/. All production files are in the repository root and can be served by a static host.

## Visitor experience

- Velvet burgundy and warm ivory themes, Bodoni Moda display type and DM Sans interface text, all served locally.
- Persistent theme and motion choices; system reduced-motion support.
- Three selectable hero portraits, a floating makeup brush, subtle portrait movement and a rose ticker.
- A brush studio with three moods, three brush sizes, a feathered colour reveal and an accessible split slider.
- Optional saved edits from the hero, studio, look finder and comparison. A drawer supports removal, comparison, PNG inspiration-card export and enquiry carry-through.
- Side-by-side comparison with independent look selectors, palettes and combined creative preferences.
- Four service panels: Bridal, Jago, Mehndi and Pre-wedding Photoshoot. Jago and Mehndi use distinct photographs.
- A three-step creative look finder.
- A guided enquiry with required-field validation, five-detail progress, optional multi-event choices, date encouragement, a reviewable email draft and copy fallback.
- Icon-only social controls, supplied phone/email/Instagram links, floating WhatsApp, responsive navigation, FAQs and privacy information.
- Floating controls tuck away at the footer so its controls remain reachable.

The separate homepage “Find your muse” gallery was removed at the user’s request. Exploration stays in the hero and brush studio.

## Supplied business facts

Royal Rose Studio by Gagan — Makeup & Bridal Artistry.

Service areas: Yuba City, Lincoln, Sacramento, Elk Grove and Surrey, BC, Canada.

Phone: 916-217-9247. Email: bookings.royalrosebygagan@outlook.com. Instagram: @royalrosestudiobygagan. Facebook is identified by its supplied page name; an exact page URL can be added when verified.

The footer credits “Website by Lachesis” and links to https://www.thelachesis.com.

No prices, reviews, credentials, physical address, hours or live availability have been invented. Enquiries prepare a draft for the visitor to send; the website does not send messages, process payments or confirm reservations.

## Imagery and privacy

All four portraits and the velvet still life are original AI-created editorial concepts, labelled as inspiration. They are not client photographs. Gagan’s supplied Instagram is linked for real work. Replace the concepts with licensed client imagery when available and update disclosures for the assets actually replaced.

Only theme, motion and whitelisted saved edit keys are stored on the visitor’s device. Enquiry entries are not persisted. PNG inspiration cards are generated locally in the browser. No analytics scripts are included.

## Files

- `index.html`: page content and controls.
- `styles.css`: design, responsive layouts and motion.
- `app.js`: all interactions, saved edits, export and enquiry logic.
- `assets/`: production photographs, SVG artwork and local fonts.
- `docs/100-design-ideas.md`: 100 reviewed ideas and decisions.
- `docs/competitor-research.md`: representative research with sources and user-supplied follow-up facts.
- `docs/image-prompts.md`: image provenance, saved paths and prompts.
- `docs/verification.md`: test coverage and operational boundaries.

## Validation

```sh
node --check app.js
python3 scripts/check-static.py
```

The final update was checked on desktop and phone. Both themes passed layout checks at 320, 390, 700, 768, 1024 and 1440 pixels. Functional checks include the collection, comparison, actual PNG downloads, separate service images, enquiry drafts and footer controls. No external message was sent. See the verification document for details.



## GitHub Pages deployment

Publish from the `main` branch and `/ (root)` folder in repository Settings → Pages. This copy is buildless and includes `.nojekyll`. Future commits to `main` update the live site.

## Logo files

The rose-and-brush logo is available as a [transparent PNG](assets/royal-rose-logo.png) and an [ivory presentation PNG](assets/royal-rose-logo-preview.png). See [brand notes](docs/brand-identity.md) for the emblem, colours, generation prompts and website treatment.

## Phone brush controls

On a phone, tap **Start brushing**, sweep with a finger, and tap **Done brushing** to return to scrolling. **Slide to reveal** offers a visible comparison slider. Strokes survive resizing and rotation. See [mobile verification](docs/mobile-qa.md).

After editing browser assets, run:

```sh
python3 scripts/version-assets.py
node --check app.js
node --check brush-studio.mjs
node --test tests/brush-studio.test.mjs
python3 scripts/check-static.py
```

## Royal Rose Academy

The dedicated Academy page offers four illustrated training paths, curriculum dialogs, filters, a city selector, an animated brush study and an enquiry planner. Contact links carry the selected course details to WhatsApp or email; prices are requested directly from Gagan. See [Academy notes and verification](docs/academy.md).

```sh
node --check academy.js
node --test tests/academy.test.mjs
```

The static checker validates both pages and their cross-page anchors. Asset versioning updates both pages and their scripts.

## Instagram journal

The homepage now includes real Instagram post previews: a randomized desktop collage, a swipeable phone gallery, and links to the original posts. The post collection is updated manually, as selected by the owner. No Meta app, Instagram credentials, feed subscription or active automatic schedule is required. A maintenance script can refresh the snapshot from the public link when anonymous access is available. See [Instagram setup, operation and verification](docs/instagram.md).

```sh
node --test tests/instagram.test.mjs
node scripts/sync-instagram.mjs
```

The second command contacts the public Instagram profile and refreshes the local snapshot. The gallery's sessionStorage key remembers only the previous post order for this browser tab.

## Additional social profiles

TikTok: https://www.tiktok.com/@royalrosestudiobygagan

Snapchat: https://www.snapchat.com/add/royalrosestudio

Both profiles appear as accessible logo links in the Studio and Academy footers. The handles are supplied by the owner. The TikTok and Snapchat SVG glyphs are from Simple Icons (CC0); the five social buttons wrap safely at narrow widths.
