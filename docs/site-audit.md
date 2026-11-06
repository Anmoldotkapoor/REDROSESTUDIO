# Reveal repair and performance audit — 7 November 2026

## Repairs

The visible comparison divider previously had no input handling: only the lower range worked. The photograph now accepts mouse/pen dragging and touch dragging or tapping. Vertical touch gestures remain available for scrolling; cancellation, secondary pointers, pointer-capture errors and legacy Touch Events are handled. The lower native range retains keyboard and screen-reader support. Colour percentage, image mask, divider, output and status update together. Mode changes release active gestures. Switching from a fully revealed brush to comparison no longer leaves a stale “Beautifully revealed” message. Labels identify the colour and monochrome sides accurately.

## Performance changes

- Same logo artwork, with smaller web derivatives. Logo: 509,934 → 96,828 bytes. Emblem: 449,267 → 147,837 bytes. Together: 959,201 → 244,665 bytes, a 74.5% reduction. Original full-resolution brand/download files remain intact.
- Canvas monochrome pixels are cached for the current image and size. Resets and mode switches reuse that work. A size or image change invalidates the cache; previous strokes still replay at their normalized positions.
- Brush portrait and closed-dialog imagery decode lazily. Hero imagery retains its high loading priority.
- Instagram feed loading and dynamic preview rendering start as its section approaches the viewport. The static real-post fallback remains available. The gallery still picks a fresh mix per visit and links to the original posts.
- Entry module dependencies preload using the same content-versioned URLs as their imports. Changed scripts/styles get fresh URLs on publication.
- Replaced AbortSignal.timeout with an AbortController timer for compatibility and added a resize-listener fallback when ResizeObserver is unavailable.

These are measured asset-byte reductions and reductions in repeated work, not an asserted page-load or Lighthouse score. Photo originals, design, themes, Academy paths, contact routes, saved edits and existing features are retained.

## Automated checks

All 41 Node regression tests pass. Six additional cases cover direct photo comparison, touch versus vertical scroll intent, endpoints and cancellation, mouse capture failure, switching from a full brush reveal, cached canvas conversion and legacy touch/resize fallback. Existing hero-swipe, brush, Academy and Instagram tests remain passing. JavaScript syntax, HTML structure, ARIA targets, local/cross-page links, module paths, CSS assets and whitespace checks pass.

## Browser audit

An isolated localhost origin was used to avoid changing the owner’s saved preferences or collection on the public site. Both pages were checked in dark and light themes at 320, 390, 768 and 1440 CSS pixels (16 page/theme/width combinations); document widths matched the viewport throughout.

The homepage checks included real photo clicks changing the comparison from 0% to 50%, native range Home/End/arrow control, correct status after brush/slider mode changes, reset, phone-sized Start/Done brush controls and a real canvas click, hero keyboard wraparound, saved collection and comparison images, the complete three-step look finder and enquiry carry-through, distinct Jago/Mehndi photos, five-detail progress, multiple-event choices, a correctly populated Surrey email draft, mobile navigation, FAQs, privacy, persisted theme/motion/saved keys and Instagram shuffle/mobile navigation with loaded local previews.

Academy checks included all four detail dialogs and matching loaded images/curricula, all four filters, group-only versus one-to-one format normalization, Surrey and experience/goal carry-through into WhatsApp/email enquiry links, manual lesson steps, motion-off behavior, play/pause and mobile navigation back to the studio. Browser console checks found no errors or warnings on either page.

## Verification limits

Phone-sized browser layouts and synthetic touch-event regression streams were tested; physical iOS/Android hardware was unavailable. No email or WhatsApp message was sent. External apps determine whether their installed app opens. Instagram collection updates remain manual, per the owner’s selected free option.
