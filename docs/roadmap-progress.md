# Core product roadmap progress

Updated September 3, 2026. Scope: food, lifting, training splits, and the suggestion engine. Coaching is excluded. The original audit and earlier sections below are historical; the latest batch is summarized first.

## Latest batch — workbook tracker, dark workspace, and roadmap follow-through

- Full configurable weight/macro workbook model: 365 dated rows, 53 review intervals, three trend methods, goal trajectory and projections, adherence, expenditure estimate, calorie adjustments, all macro allocation modes, calorie cycling, overrides, and source-referenced diagnostics. See `workbook-engine-map.md` for arithmetic coverage and documented source defects/safety differences.
- Accepted targets, decision history and settings snapshots are separate from calculated proposals and from actual food/weight/lifting records. Later settings and review changes take effect tomorrow or later. Incomplete food days do not become trustworthy daily intake automatically; changing a marked-complete diary day invalidates its completion confirmation.
- Compact dark-only core interface, mobile document scrolling, consolidated Home actions, accessible input sizing and retained keyboard focus. Legacy light-theme data remains readable in backups; it does not turn the interface light.
- Save reliability now uses queued exclusive Web Locks around comparison and write; unsupported locks/read errors fail closed. Restore is asynchronous, blocks edits while pending, invalidates obsolete saves, and verifies the saved version before reporting success. This coordinates current cooperating tabs, not obsolete writers that ignore the lock protocol.
- Meal/recipe creation no longer requires logging first. Full ingredient snapshots, servings/cooked-weight yield, editable default portions and per-log portion selection preserve old meals and prior logs.
- Default profile inputs no longer create a precise readiness score or an undated recovery calorie penalty. Dated recovery/pain evidence takes priority, and weekly intake review also exposes recent completed workouts and holds for recovery flags, deload or disruption. These are explicit planning rules, not clinical predictions.

Still not complete: account-backed cross-device synchronization (no connected provider/API), physical iOS/Android acceptance testing, and measured real-user preference/speed/repeat-use results. `mobile-field-validation.md` defines those checks without claiming they were run. Coaching, older iOS work and unrelated legal/server changes are excluded from this release.

## Delivered in this release sequence

- **R1 — Truthful food diary:** dated immutable portions, derived totals that preserve overages, search and recent-food reuse, portion corrections, delete/undo, and explicit treatment of undated legacy entries. Commit `801c3932`.
- **R2 — Training safety:** persistent exercise pain and saved recovery constrain recommendations, including frozen-session targets; Stop checks remain editable; bodyweight history supports zero external load. Commit `ecedf18f`. Follow-up identity and saved-check preservation are included in the workout-logging batch.
- **R4 — Repeat meals:** assemble a named meal from selected diary entries, inspect saved portions, log the whole meal, copy selected foods or a whole day to an explicit date, and undo the entire added batch. Restoring a deleted meal never replaces a newer meal with the same name. Commit `bf01267d`. This is diary-based assembly; a separate unlogged meal-building workspace and recipe yield are still future work.

## Workout-logging batch

R3 replaces the separate accept-then-complete flow with a visible suggested draft and one explicit confirmation. An unconfirmed suggestion is not a completed set. It also separates previous, target, entered, and logged values, makes advanced actions secondary, exposes exercise-specific increments, and uses actual elapsed time rather than a completion-based estimate.

Committed and pushed as `9e534b73`.

Validation covers suggested values, partial edits, invalid loads, bodyweight sets, pause/resume, undo, reload, and pain constraints. Browser checks confirmed one-tap logging of an unchanged 60 lb × 6 target, preserved partial inputs, blocked invalid reps, paused input locks, rest/undo, exact completed-work totals, and editable Stop checks. The workout rows fit a 375px viewport without clipped controls.

## Remaining work, in order

1. **R5 — Scheduling and priorities:** validate the new dated-occurrence and priority-aware preview workflows on real phones; retain separate dates, split templates, and immutable completed workouts.
2. **R6 — Recoverability:** build transactional persistence before account-backed synchronization, ownership, retries, and conflict resolution. Versioned portable backup/restore is now implemented; automatic cross-device synchronization is not.
3. **R7 — Explainable suggestions:** return traceable observations, rule version, constraints, data coverage and age, reason, and a hold/adjust action. Track accepting or overriding a plan separately from recording actual work. Pain guardrails are not a substitute for this broader contract.
4. **R8 — Mobile refinement:** continue reducing competing actions and test keyboard, zoom, dark mode, resume, and save failure on actual phones. Smaller set rows and nearby food search address only part of this work.
5. **R9 — Cross-domain decisions:** only after sufficient trustworthy longitudinal records; no claims of measured expenditure or physiological precision from default profile values.

## Verification and release discipline

- Each commit is tested from an exported copy of the exact staged tree so unrelated local work cannot conceal a release dependency.
- R1: 91 automated tests, type checking, production build, and mobile food workflow checks passed.
- R2: 112 automated tests, type checking, and production build passed.
- R4: 123 automated tests, type checking, and production build passed. Browser checks verified exact meal totals, date-specific additive copy, whole-batch undo, reload persistence, and collision-safe meal restoration at a 375px viewport.
- R3: 145 automated tests, type checking, and production build passed from the exact staged release. Independent callback checks also verified that a safety-constrained visible target, not an older frozen load, is the value recorded on confirmation.
- Commits are pushed to the existing `main` release pipeline. A push is not itself proof that the public production alias has updated; deployment status is checked separately.
- Pre-existing unrelated changes remain outside these release batches.

The audit's claims about likely user preference remain expert judgments. No competitor timing, retention improvement, or native-device reliability has been measured by these implementation checks.

## R6 first safeguard: conflicting local saves

Two-tab testing exposed whole-state overwrites from stale tabs, including a development refresh of an older tab. The persistence boundary now compares the exact last-read/saved value before replacing it. A conflict pauses saving and editing in that tab, offers a local JSON copy, and requires explicit reload of the latest saved data. Reset cannot erase the unsaved copy while a conflict is active. Read failures are not treated as an empty store.

Eleven persistence regression tests cover stale writes, identical-content no-ops, deletion/creation conflicts, and read/write failures. Browser verification showed a new food log survives a second tab's stale update and explicit reload. This is not account sync, an import/restore workflow, or a guarantee against truly simultaneous cross-tab transactions: localStorage has no atomic compare-and-swap. Transactional storage or cross-tab locking remains part of R6.

The safeguard was committed and pushed as `8a1f6e7b`, after 156 tests, type checking, and a production build passed from the staged release.

### Bodyweight classification follow-up

Phone-width testing also caught a catalog boundary issue: hanging knee raises were treated as requiring external weight. Exact known bodyweight exercise names now allow zero added load, while unknown and loaded movements keep conservative defaults. Explicit load metadata takes precedence. New sessions use this correction; existing frozen sessions are not silently rewritten. Browser checks confirmed a 0 lb × 10 hanging knee raise records one working set and survives reload; fractional exercise increments also persist.

Final release verification: 160 automated tests, type checking, and the production build passed from the exact staged application snapshot.

## Next roadmap batch: scheduling, time constraints, and recoverability

### R5 — Dated workouts and honest time tradeoffs

- Workout dates are attached to a mesocycle/week/day occurrence, not to its reusable split or logged set values. Moving one occurrence preserves its identity, frozen targets, actual sets, and other weeks.
- Training weeks are seven-day windows starting on the selected program date. A Thursday start never invents missed Monday workouts; following weeks advance each occurrence by seven days.
- Home, Lift, Split, and the weekly schedule use the same dated selection. Active or paused work takes precedence. Finished or skipped workouts are not offered as the next unstarted workout; explicit completed-workout review remains available.
- Move has a guarded Undo. Moving never earns a completion. Mesocycle completion credits are recorded once per mesocycle, including skip/unskip/re-skip and explicit ending.
- Short-session generation reserves direct weekly coverage for specialized/emphasized muscles before allocating remaining time. The preview lists omitted exercises and blocks unresolved priorities or infeasible estimates. This guarantees coverage, not an optimal training program or sufficient weekly volume.
- Estimates use the same adjusted set counts as week-one workouts and are labeled as estimates. Later-week set growth is not falsely promised to fit the week-one time budget.

### R6 — Portable backups and fail-closed recovery

- More includes versioned JSON export and restore with a read-only preview of record counts, format, and export date. Restore replaces rather than merges data, and requires downloading and confirming a pre-restore copy.
- Files have an 8 MB size limit. They contain personal fitness data and are not encrypted; the UI explicitly advises private storage. Existing schema-4 tab-copy files remain supported.
- Validation rejects unknown/future formats, malformed records, unsafe keys, and normalization that would drop or change supplied values. Optional new defaults can be added without changing existing records.
- Restore writes successfully to device storage before replacing visible state. Read errors, write errors, and stale-tab conflicts cannot silently replace the current copy.
- Unreadable or damaged current-format saves pause editing and autosave. The original raw data remains downloadable for recovery, including legacy-only storage failures; a damaged primary save cannot silently fall back to older data.
- Real application round-trip tests cover dated and undated foods, saved meals, paused/completed sessions, partial set drafts, safety constraints, 4.5/5 RIR actuals, empty schedules, unchecked flags, and 700-record histories. History is no longer truncated at 480 records. Set timestamps retain the time the set changed, not a later session pause time.

These are local-first improvements, not cloud sync or a guarantee against simultaneous cross-tab transactions. This batch is verified with automated module and real-App integration tests; current browser-control discovery returned no available browser surfaces, so new phone/browser interaction checks are not claimed.

Release gate: 237 automated tests, type checking, and the production build pass from the exact staged roadmap-only snapshot. The live host remains the existing Vercel project; deployment success is checked separately from the push.
