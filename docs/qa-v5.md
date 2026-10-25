# Arcade 05 · Mobile QA

2026-10-24. Camera/world viewport unchanged: 960×540 world units, 480×270 internal raster. The phone cabinet fills the stable viewport; the complete scene is contained without cropping attacks. Wide phones retain lateral space used by the controls. Portrait keeps the full scene between the HUD and the controls.

## Automated

- Syntax checks for every runtime ES module.
- Existing normal-input campaign route to victory across seven acts; patrol, wave, arrest, rescue, ally and speech checks.
- Existing narrative and audio suites.
- Independent pointer ownership for joystick/attack/jump; second contacts cannot steal or release another finger; reset and stale cancel; a short tap is not dropped between simulation frames.
- Every dialogue word preserved through 90-character pagination; reveal/advance/finish semantics retained.
- Object target matches attack direction, depth and range; destroyed objects excluded.
- Exact save/restore for all three difficulties, permanent ally Infinity lifetime, RNG and deterministic continuation; final boss identity rebound into the enemy list.
- Active arrest survives save/restore and can still be interrupted. Invalid save versions/JSON leave the live run intact.

## Browser

Managed preview in Chrome with source-authored same-origin viewport fixture. Tested 844×390 and 568×320 landscape; 390×844 and 320×568 portrait; desktop 1280×720. No fresh application JavaScript errors observed.

Checked title, story pagination/readability, combat HUD, visible object name, touch control dimensions, nonblocking portrait hint and dismissal, orientation changes, menu pause/resume, separate music toggle, help, manual save, reload and restore. Save retained score 254 and 120 HP in the UI after reload. Dialogs measured 17 px on small landscape / 19 px portrait; controls remained within the viewport. Computed combat surface touch-action was none; menu reverted to manipulation. No document overflow in phone viewports. Desktop retained its full HUD and normal page scrolling.

Preview fixture removed before packaging. `preview-v5.jpg` is a real 844×390 game viewport screenshot, cropped to the entire phone viewport, using a deterministic development setup of act III.

## Limits

These are browser viewport checks, not a physical-device trial. Multi-contact ownership is covered by unit tests; native iOS/Android pinch/double-tap handling, safe-area insets and collapsing browser chrome still need device verification. Stable svh layout and gesture guards are implemented, but the original unwanted zoom was not reproduced on a physical phone. No claim that Safari-specific behavior is conclusively fixed.
