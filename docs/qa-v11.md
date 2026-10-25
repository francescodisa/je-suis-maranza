# Version 11 — Italian copy and mobile captions

All approved text from the edited draft is installed: seven chapters, boss departures, epilogue, act transitions, persuasion exchange, ambient dialogue, banners, menus, help, saves and audio notices. The typo “respitno” is corrected to “respinto”. Trump has his own ambient lines and the approved Truth joke.

During gameplay on phones, captions share the upper HUD band. At most two measured lines appear per page, using 14px Arial with a 10px speaker label. Long messages paginate without losing words. Arrest instructions, the persuasion exchange and urgent notices take precedence over ambient chatter. Health and motivation remain at upper left; the target is immediately below. Portrait captions end before the canvas starts. Audio notices are available in the menu during play.

Verification on 25 October 2026:
- `npm run check`, `npm test`, and `git diff --check` pass.
- Existing full campaigns pass: 185 seconds with optional destruction, 131 seconds without destroying optional objects; zero police casualties in either route.
- Save/resume, alternating protagonists, both boss escapes, scene pagination, sound, and multitouch ownership pass.
- Added regression checks for caption priorities and measured two-line pagination with every word retained.
- Browser QA at 844×390, 568×320 and 320×568 using the actual app inside fixed-size frames. Persuasion, reply, arrest and the port scene inspected.
- At 568×320, caption bounds: x178, y8, width290, height61.4; body has two lines. It stays above the characters and separate from health, target, menu and controls.
- At 320×568, caption bounds: y115–176.4; canvas starts at y180. The image and captions do not overlap.
- At 568×320, the narrative panel has client and scroll heights of 320px; its image and buttons are visible.

Verification covers browser layouts, not a physical iOS or Android handset. Temporary QA controls are removed from deployment. Save schema and gameplay balance remain unchanged.
