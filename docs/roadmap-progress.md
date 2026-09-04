# Core product roadmap progress

Updated September 3, 2026. Scope: food, lifting, training splits, and the suggestion engine. Coaching is excluded. The original audit is a historical baseline, not the current release status.

## Delivered in this release sequence

- **R1 — Truthful food diary:** dated immutable portions, derived totals that preserve overages, search and recent-food reuse, portion corrections, delete/undo, and explicit treatment of undated legacy entries. Commit `801c3932`.
- **R2 — Training safety:** persistent exercise pain and saved recovery constrain recommendations, including frozen-session targets; Stop checks remain editable; bodyweight history supports zero external load. Commit `ecedf18f`. Follow-up identity and saved-check preservation are included in the workout-logging batch.
- **R4 — Repeat meals:** assemble a named meal from selected diary entries, inspect saved portions, log the whole meal, copy selected foods or a whole day to an explicit date, and undo the entire added batch. Restoring a deleted meal never replaces a newer meal with the same name. Commit `bf01267d`. This is diary-based assembly; a separate unlogged meal-building workspace and recipe yield are still future work.

## Workout-logging batch

R3 replaces the separate accept-then-complete flow with a visible suggested draft and one explicit confirmation. An unconfirmed suggestion is not a completed set. It also separates previous, target, entered, and logged values, makes advanced actions secondary, exposes exercise-specific increments, and uses actual elapsed time rather than a completion-based estimate.

Validation covers suggested values, partial edits, invalid loads, bodyweight sets, pause/resume, undo, reload, and pain constraints. Browser checks confirmed one-tap logging of an unchanged 60 lb × 6 target, preserved partial inputs, blocked invalid reps, paused input locks, rest/undo, exact completed-work totals, and editable Stop checks. The workout rows fit a 375px viewport without clipped controls.

## Remaining work, in order

1. **R5 — Scheduling and priorities:** model each scheduled occurrence separately from a reusable split and a completed workout; make move/skip/resume safe; preview duration tradeoffs without silently removing priority muscles.
2. **R6 — Recoverability:** establish versioned canonical records and export/restore tests before account-backed synchronization, ownership, retries, and conflict resolution. Current diary and meal persistence is on this device; cross-device restore is not delivered.
3. **R7 — Explainable suggestions:** return traceable observations, rule version, constraints, data coverage and age, reason, and a hold/adjust action. Track accepting or overriding a plan separately from recording actual work. Pain guardrails are not a substitute for this broader contract.
4. **R8 — Mobile refinement:** continue reducing competing actions and test keyboard, zoom, dark mode, resume, and save failure on actual phones. Smaller set rows and nearby food search address only part of this work.
5. **R9 — Cross-domain decisions:** only after sufficient trustworthy longitudinal records; no claims of measured expenditure or physiological precision from default profile values.

## Verification and release discipline

- Each commit is tested from an exported copy of the exact staged tree so unrelated local work cannot conceal a release dependency.
- R1: 91 automated tests, type checking, production build, and mobile food workflow checks passed.
- R2: 112 automated tests, type checking, and production build passed.
- R4: 123 automated tests, type checking, and production build passed. Browser checks verified exact meal totals, date-specific additive copy, whole-batch undo, reload persistence, and collision-safe meal restoration at a 375px viewport.
- R3: 145 automated tests, type checking, and production build passed in the working tree; the exact staged release is checked again before its commit. Independent callback checks also verified that a safety-constrained visible target, not an older frozen load, is the value recorded on confirmation.
- Commits are pushed to the existing `main` release pipeline. A push is not itself proof that the public production alias has updated; deployment status is checked separately.
- Pre-existing unrelated changes remain outside these release batches.

The audit's claims about likely user preference remain expert judgments. No competitor timing, retention improvement, or native-device reliability has been measured by these implementation checks.
