# Phone interaction fixes — November 6, 2026

The brush studio now has an explicit Start / Done control on narrow or touch screens. Painting uses pointer capture and permits pinch zoom while preventing a brush stroke from becoming a page pan. Done restores page scrolling. Floating contact controls tuck away during painting, and Start centers the portrait. The monochrome mask is generated from pixels, without a canvas filter dependency.

Strokes use normalized coordinates and survive width, height and orientation changes. A visible, labelled native range control replaces the invisible full-image slider. Reset, mood changes, full reveal and both motion settings remain supported. Asset URLs carry content versions so returning visitors receive updated code and styles.

Mobile refinements include 44px key controls, a larger brush-size selector, safer menu placement and outside-click dismissal, safe-area spacing, 16px form controls on phones and touch layouts, stacked email-preview actions, and contact controls that hide during form editing or modal use.

## Verification

Two verification passes were completed: initial interaction/layout checks and a fresh-load check with the other theme, changed brush mood and size, resize, reset, and both full-reveal paths.

- `node --test tests/brush-studio.test.mjs`: seven regression tests, covering monochrome pixels without filter support; opt-in touch drawing with `buttons=0`; pointer capture, cancellation and non-bridging strokes; secondary-finger rejection; normalized resize replay; split/reset/full-reveal state; desktop hover and canvas fallback.
- Browser layout checks at 320, 360, 390, 430, 768, 1024 and 1440px in both themes: no document, studio, enquiry-form or occasion-tab overflow.
- Browser pointer drags at phone sizes visibly reveal continuous colour. A painted light-theme portrait retains the stroke after resizing from 390 to 360px.
- Start / Done correctly changes touch policy and restores scrolling. Contact controls hide during drawing and return afterward.
- The visible slider responds to a drag (50 to 87), Home / End and arrow keys. Value and reveal survive resizing.
- Reset restores the mask; full reveal completes with motion on and off; full reveal remains visible after a landscape resize.
- At 844 × 390 landscape, no horizontal overflow; brush-size and email controls are 16px; the portrait fits the short viewport.
- Mobile navigation opens, hides the dock, and closes after following a section link. The comparison dialog fits at 320px and its selectors update the portraits.
- The look finder completes all three steps at 320px; its result scrolls within the dialog without horizontal overflow.
- A five-field multi-event enquiry for Surrey validates and produces a reviewable preview containing Jago and Mehndi. No email or WhatsApp message was sent.
- Bridal, Jago, Mehndi and pre-wedding panels load their four distinct images. Surrey details, the Lachesis credit and footer controls remain present.
- No browser console errors during the checks. HTML, asset, module-reference and JavaScript syntax checks passed.

These checks use the available browser at phone viewport sizes and automated pointer-event tests. Physical iOS/Android hardware was not available in this session.
