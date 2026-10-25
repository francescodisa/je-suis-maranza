# Corteo 06 · Restructure verification

2026-10-25. Version 2.0. Camera and seven-stage luxury progression preserved.

## Rule tests

`npm run check` and `npm test` pass. Engine tests verify police proximity aggression without vandalism; object-only strikes and no air-punch animations near humans; low-level prevention of player/ally damage to every human opponent; Nora has no attack behavior; recruitment and medic healing; K formation reduces damage, drains cohesion and disperses on exhaustion; recovery and isolated-group behavior; gates open while police remain unharmed; a fallback recruit prevents loss of all companions from blocking progress; arrest rescue via persuasion only; timed stand-down and conversion.

Full seven-act route uses only ordinary movement, J smash, held K gathering, L persuasion and jumping. No HP changes, teleports or gate overrides. Normal difficulty victory after 181 simulated seconds (excluding cutscenes), 98 HP, 28 objects, 25 converted officers, 38 collected protesters and 5 freed allies. Every frame asserts no enemy HP loss and zero kills. Final machine destroyed, President still 650/650 HP. This route establishes reachability, not human difficulty calibration; its timing uses systematic dodging.

Story tests cover page/reveal/skip/continuation and 90-character mobile pages preserving all words. Audio tests cover gesture start, two tracks, independent muting, pause and material effects. Save tests cover exact schema2 round trip and deterministic continuation (including active formation, RNG, jump latch, arrest, machine/civilian/boss reference identities), malformed save rejection, and v1 migration to the start of the same act with points/HP retained and old defeated police rebuilt.

## Presentation

Decorative crowd counterattacks and human enemy health bars removed. Waiting protesters carry join and role labels; gathered supporters have compact markers. Cohesion is displayed beside health and the held Raccogli command is highlighted. Final machine is a separately drawn unmanned pixel apparatus with its own integrity indicator and damaged chassis; President stays separate and intact.

Browser verification uses the managed preview and a temporary same-origin viewport harness, removed before packaging. Viewport checks passed at 844×390 and 568×320 landscape, plus 390×844 portrait, with no document overflow. Health, cohesion, target and touch commands remain visible. Persuasion visibly lowered three guards’ shields and all guards retained full HP; the separate machine appears in the final arena. Save/reload restored player position and nearby group. Music playback was observed running after reload. See preview-v6.jpg. Physical iOS/Android gestures remain outside the scope of browser viewport checks. New mechanics require playtesting for preferred difficulty and pacing.
