# Article screenshots

Root coordinator owns browser capture for the pilot. Other workers consume sanitized images and the capture manifest.
Use the user-selected Chrome connection first when available. Inspect current tools and sessions before selecting dev-browser fallback.
Read the selected tool's instructions. For dev-browser, read `dev-browser --help`; headless applies only to a launched browser.
A required screenshot stays outstanding if blocked. Record the blocker and next action; recheck after reconnection.

## Evidence and capture

Use real pixels for controls and reports. Conceptual components must identify themselves as demonstrations.
Raw captures, report JSON, and editable crop/annotation manifests belong in `~/scratch/unlighthouse-content-refresh/`.
Sanitized publication assets belong in `public/images/learn-lighthouse/`, served at `/images/learn-lighthouse/`.
Record exact capture commands, tested URL, final URL, URL/origin scope, device, reporting period, Chrome/Lighthouse versions, and lab settings.
A timestamp records capture time, not the period measured. Missing field data is a valid visible state.

Measure decoded PNG pixels against the captured CSS bounds. Require at least two source pixels per displayed CSS pixel.
Browser zoom and requested DPR are not proof of actual density. Never enlarge a blurry image to meet the target.
Wait for loading, animation, scroll, and content HMR to settle before capturing. Inspect the actual output at display size.

Use a lossless deterministic crop and overlay compositor. Add numbers, arrows, and outlines only.
Keep explanations in visible article text. Preserve labels, units, dates, and selected states.
Crop identifiers or flatten opaque redactions. Inspect pixels and metadata before publishing; do not invent replacement values.

## Integration

Use native figure, img, and figcaption in the learn article renderer, pending its pilot browser verification.
Scope any required styles to `app/pages/learn-lighthouse/[...slug].vue`; leave the unused FigureImage component and imported-doc renderer unchanged.
Provide actual dimensions, responsive display caps, independent alt text, capture context, and a keyboard-accessible full-size link.
Center figures and captions. Start captions at 14px with a readable muted theme token; check both themes.
Verify loading, crispness, callouts, caption contrast, links, and mobile overflow on the final rendered article.

## Required pilot shots

1. PSI field section: show URL/origin scope and metrics or actual missing-data state. Put observed device and period beside the crop in indexable text.
2. PSI lab section: show the score and relevant metrics. Record observed environment/version in the caption and private manifest.
3. Local Lighthouse report for the same public page: show actual results. Keep distinct run settings in the caption and private manifest.

These are explanatory captures, not a controlled before/after experiment or proof one tool is more accurate.
No captures are accepted yet. The pilot brief owns each image's exact state, caption, dimensions, and review decision.
