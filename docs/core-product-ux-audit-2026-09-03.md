# BodyPilot: real-life preference audit

Reviewed September 3, 2026. Scope: lifting, food, training splits, and the suggestion engine. Coaching and athlete-management products are deliberately excluded.

Baseline: production at commit 2530cd16, inspected on a 375 × 812 browser viewport, plus the active application code and official competitor documentation. The first food-diary pass below is a local, uncommitted change, not the production baseline.

This is an expert product audit, not a controlled usability study. No competitor task times, retention rates, paid native-app sessions, or user preference results were measured. Statements about likely preference are judgments grounded in the documented workflows and observed defects. Source line references below are pinned to the baseline commit so they do not drift after the implementation.

## 1. Executive verdict

**Promising training foundation; overbuilt and under-polished as a daily product. Not competitive enough to recommend switching from a good lifting tracker plus food logger.**

The problem is not a shortage of screens. The product repeatedly asks for attention before earning it. Food begins with reporting instead of logging. Training presents many controls but makes routine sets unnecessarily deliberate. The engine gives precise-looking advice from thin history and assumed inputs.

Three failures outweigh most of the feature list:

- “Log meal” records a made-up meal and caps the resulting intake at the target.
- Food history is not a dependable dated diary in the active production flow.
- A pain warning promises a constraint that the next-load recommendation does not consistently enforce.

These are not cosmetic defects. They make the user question whether anything else is real.

Preserve the frozen workout prescriptions, resumable session state, stable exercise identity, completion checks, and exercise substitutions. Those are useful foundations. They are not yet a reason to tolerate an inferior daily food experience.

## 2. Competitor comparison by category

### Food speed and habit: loses to MacroFactor

MacroFactor brings recent/frequent foods into the logging workflow, lets users choose quantity and units, and collects multiple foods in one plate. The product advantage is repeated effort removed, not another dashboard. BodyPilot's production search started 1,258 CSS pixels below the top of its Food view on the inspected mobile viewport; serving selection and a usable daily history were absent from that flow. These are structural disadvantages, not measured timing claims. [Official logging workflow](https://help.macrofactorapp.com/en/articles/215-how-to-log-food-in-macrofactor).

Copying a meal or day is a habit tool: yesterday's work makes today easier. BodyPilot still lacks this complete loop after the first pass. [MacroFactor copy/paste](https://help.macrofactorapp.com/en/articles/95-copy-and-paste).

### Food trust: loses to Cronometer

Cronometer documents its sources and distinguishes nutritional data completeness from a nutrient actually being absent. BodyPilot's binary verified/community presentation gives too little context, while its provider parser can turn missing values into zeros. The local pass guards required macros and portion basis; it does not create a curated database or a nutrient-completeness system. [Data sources](https://support.cronometer.com/hc/en-us/articles/360018239472-Data-Sources), [data confidence](https://support.cronometer.com/hc/en-us/articles/360042550452-Data-Confidence-Scores).

### Lifting speed: loses to Hevy's focus

Hevy puts previous performance beside the current entry and supports tapping it to populate the set. BodyPilot also has history, but the normal path requires accepting the prescription and then separately completing the set; advanced controls compete with those repeated actions. A 20-set workout can therefore incur 20 extra “accept” actions when the user follows the recommendation. That is an interaction count, not an elapsed-time comparison. [Hevy previous values](https://www.hevyapp.com/features/track-exercises/).

### Hypertrophy decisions: does not yet earn RP-style confidence

RP documents how performance and feedback influence reps, load, and sets, with manual adjustment available. BodyPilot has similar vocabulary but a narrower rule set: one previous exposure, simple progression branches, and a volume delta applied to each exercise of a muscle. Four recovery questions per muscle plus extensive post-workout feedback are an expensive input contract for that limited output. The gap is dependable interpretation and useful explanation, not more questionnaires. [RP progression behavior](https://hypertrophy.zendesk.com/hc/en-us/articles/14605661323671-How-Does-the-App-Determine-When-to-Add-Weight-Reps-and-Sets).

### Split planning: benchmark Fitbod's constraints, not its branding

Fitbod documents workout generation around inputs such as equipment, duration, split, recovery, and past work. BodyPilot's duration trim keeps exercises in list order before later priority adjustments. A priority muscle can disappear because its exercise sits late in the list. The product needs a comprehensible tradeoff preview and a recoverable missed-session schedule, not simply more split presets. [How Fitbod works](https://help.fitbod.me/hc/en-us/sections/360001078993-How-Fitbod-Works).

### Daily habit and premium mobile feel

The useful habit loop is: open → know the next action → record it easily → trust that it survives → see a better decision next time. BodyPilot weakens this with duplicate macro cards, badges, large readiness surfaces, and local-only history. A streak or notification layer would not repair those foundations. Visually it still feels like a dashboard wrapped for mobile. This is an expert UI judgment; no retention lift is claimed.

## 3. Missing functionality

Meaningful gaps in the active product, not a list of every possible competitor feature:

- **Food core:** dated diary, actual portions, entry correction, undo, recent-item reuse. These are addressed in the first local pass. Still missing: multi-food meal assembly, named saved meals, meal/day copy, recipe yield/portion handling, favorite food management, and editing a custom food's nutrition.
- **Food trust:** consistent provenance, completeness indicators, raw/cooked distinctions, serving-basis validation across every entry route, understandable not-found results, and reliable native barcode fallback. A provider connection alone does not establish database quality.
- **Lifting core:** one-action completion of an unchanged prescription, exercise-specific increments, bodyweight progression that recognizes zero added load, and clear previous-versus-planned-versus-actual values.
- **Split core:** date-based scheduling, move/skip/resume handling without accidental double progression, explicit priority-muscle preservation, and a transparent duration tradeoff. Exercise library scale is secondary to equipment, technique, identity, and substitution quality.
- **Suggestion core:** assessed-versus-default inputs, data sufficiency, stale-history handling, a pain/recovery constraint enforced at the decision boundary, a plain-language reason, and the ability to keep or override the recommendation.
- **Daily habit:** quick weight/steps capture where relevant, a single next action, an optional reminder tied to an unfinished task, and honest trend coverage. Existing weigh-in history is useful; it is not a complete adherence system.
- **Reliability core:** tested account-backed restore/sync for the actual product state, conflict handling, export/import, migration coverage, and visible save status. Backend files are not proof that the active diary and workouts are recoverable on another device.

## 4. Biggest usability failures

1. **Reporting blocks doing.** Search is below repeated calorie/macro displays. A frequent action must not require touring a dashboard first.
2. **Routine lifting is over-interactive.** Separate accept/complete steps, many badges, and always-visible advanced controls increase decisions between sets.
3. **Feedback asks too much too early.** Collect only information that can change an identifiable upcoming recommendation. Put optional detail behind a disclosure.
4. **Recovery can create a dead end.** After a “Stop” recovery entry is saved, the start button can remain disabled while the editor needed to change that entry is no longer visible.
5. **A schedule is treated too much like a generated list.** The user needs to understand what happens after a missed Tuesday, a shorter session, or an unavailable station.
6. **Precision is confused with clarity.** “Readiness 71%” is not a useful primary action when its personal inputs have not been assessed.

## 5. Biggest trust / retention / product-quality failures

### Release-blocking before the next broad rollout

- **Fabricated intake:** the production “Log meal” action adds 450 kcal / 40 P / 45 C / 14 F without asking what was eaten. The macro values do not even sum to the displayed energy. Intake is clamped to targets, so adding food can reduce an over-target total. [Baseline handler](https://github.com/sladejason95-max/BodyPilot/blob/2530cd16/src/app/App.tsx#L6163). Fixed in the local pass.
- **Unreliable date attribution:** global counters plus undated food entries cannot answer “what did I eat yesterday?” The active flow also keeps only 24 newly logged items. [Baseline food logging](https://github.com/sladejason95-max/BodyPilot/blob/2530cd16/src/app/App.tsx#L5700). Fixed for future entries locally; old unknown dates remain unknown.
- **Pain promise not enforced:** the UI says next exposure progression is disabled, but saved painful-exercise IDs feed replacement ranking rather than every next-load calculation. A skipped recovery response can leave the load-increase path available. [Promise](https://github.com/sladejason95-max/BodyPilot/blob/2530cd16/src/app/App.tsx#L5447), [start logic](https://github.com/sladejason95-max/BodyPilot/blob/2530cd16/src/app/App.tsx#L4195). Not fixed in this food pass.

### Serious cumulative trust debt

- Default sleep, soreness, steps, demographics, and energy are consumed as if personally meaningful. Starting estimates need to be labeled and confirmed; unassessed readiness should not look measured.
- The calorie engine is a profile/activity calculator, including a fixed recovery adjustment, not a learned expenditure model. The prior “next meal” is a capped macro remainder, not a reasoned meal suggestion.
- Session “elapsed” minutes are estimated from completion fraction despite real timing data being available. Label estimates or use the real timer.
- Local saving can fail and has no demonstrated cross-device recovery path. A save warning is good error handling, not a backup.
- Provider blanks can be treated as zero and unknown serving weights as 100 g. The first pass adds a fail-closed macro/basis boundary, but does not certify all provider data.

## 6. Biggest strategic mistakes

- **Selling intelligence before establishing reliable inputs.** Better-looking advice from bad logs compounds the trust problem.
- **Using breadth as differentiation.** An all-in-one app that is worse at each repeated action loses to two excellent apps.
- **Charging an attention tax for every feature.** More cards, questions, and badges are not more daily value.
- **Optimizing an ideal session rather than real interruptions.** Missed days, changed portions, short workouts, unknown products, and device changes are the product.
- **Planning gamification before utility.** Make the user's history increasingly useful first.

## 7. Highest-impact opportunities

1. Make food logging truthful, nearby, repeatable, and reversible. This is the first implemented pass.
2. Make an ordinary lifting set a single confirmation; reveal complexity only when the user changes the set.
3. Establish an explicit recommendation contract: observed inputs → constraints → suggested change → reason → uncertainty → override. “Keep the plan” must be a valid output.
4. Show one coherent week: what is next, what moved, and what stays unchanged.
5. Make history safe enough to invest in. Recovery across reloads is necessary; recovery across devices is the stronger retention foundation.

## 8. Prioritized implementation roadmap

### Highest impact / fastest win

R1. Replace synthetic food logging with a truthful dated ledger and fast repeat loop. Implemented locally.

R2. Fix pain-progression enforcement and the recovery editing dead end. This takes priority over any new recommendation feature.

### Highest impact / medium complexity

R3. Simplify the workout set row; support exercise-specific increments and correct zero-load/bodyweight history.

R4. Add multi-food meal assembly, saved meals, and meal/day copy. Do not begin with meal photography or a giant micronutrient dashboard.

R5. Make split scheduling constraint-aware and interruption-safe.

### Foundational architecture

R6. Versioned canonical food/workout/measurement records, migration tests, local-first save queue, account ownership, conflict handling, and export/restore.

R7. A pure, replayable recommendation layer with data quality and safety gates. Separate suggested changes from accepted plans and recorded actuals.

### Premium polish

R8. Reduce the dashboard to the next workout, compact food status, and one justified adjustment. Improve touch targets, keyboard/focus behavior, loading/empty/error states, light/dark contrast, and real-device resume behavior.

### Advanced differentiation

R9. Connect intake, weight trend, workout performance, and adherence into restrained decisions. Only after reliable longitudinal data exists. Do not promise physiological precision from a handful of logs.

## 9. Exact implementation plan

- **R1 — Core; usability, trust, retention.** Build immutable nutrient-basis entries with explicit local date and recorded time. Derive daily totals; preserve unknown-date legacy records separately. Put search/recents near the top; select servings or trustworthy grams before saving; edit/delete/undo. Closes the most basic MacroFactor/Cronometer flow gap. Acceptance: changing, deleting, repeating, and reloading never invents intake or hides an overage.
- **R2 — Core; trust.** Feed persistent pain and current recovery constraints into the recommendation function itself, including skipped questionnaires and exercise replacement. Keep recovery editable while start is blocked. Closes the gap between RP-like feedback language and actual behavior. Acceptance: regression tests prove an active pain constraint cannot produce a load-increase recommendation.
- **R3 — Core; speed and retention.** Stage the prescription as editable input, not a completed log. One check records an unchanged set and starts rest. Show prior performance in-line; move set type, notes, and advanced controls into a menu. Store increment per exercise/equipment. Closes Hevy's focus gap. Acceptance: a normal 20-set session requires 20 confirmations, not 20 accepts plus 20 confirmations; no set is recorded without explicit completion.
- **R4 — Core; habit.** Add a draft meal containing multiple immutable food portions, saved meal templates, and date-aware copy. Recipe yield belongs after these basics. Closes repeated search/re-entry work. Acceptance: a returning user can log a saved meal without retyping ingredient names; later recipe edits do not rewrite historical meals.
- **R5 — Core; clarity.** Separate scheduled occurrence from reusable split/template and completed session. Preview duration versus priorities before accepting a change; allow move/skip/resume with stable IDs. Benchmark Fitbod's explicit constraints. Acceptance: moving Tuesday to Wednesday does not advance the training week twice or silently drop the priority muscle.
- **R6 — Core; production trust.** Put a repository boundary around the active product state before connecting sync. Add encrypted transport, authenticated ownership, retryable writes, conflicts, backup export, and tested restore. Do not silently replace a locally newer log. Acceptance: offline logging survives relaunch and reconciles without duplicates after reconnecting; account restore recreates the diary and workout history.
- **R7 — Core; recommendation trust.** Each suggestion returns action, reasons, observations, timestamps, constraints, confidence/data coverage, and a rule version. Track accept/override separately. Thin or stale data produces “not enough evidence” or “hold,” not an invented percentage. MacroFactor's documented intake/weight sufficiency behavior is a useful example of restraint, not a formula to copy. [Data requirements](https://help.macrofactorapp.com/en/articles/110-how-frequently-do-i-need-to-log-my-nutrition-for-the-expenditure-algorithm-and-weekly-coaching-updates). Acceptance: identical evidence and rule version produce the same decision; each input can be traced to a real record.
- **R8 — Core; clarity and polish.** Use one primary action per screen. Collapse explanations and advanced controls; remove duplicate progress representations. Test at 375/430 px, with keyboard open, accessibility zoom, dark mode, and interrupted sessions. Acceptance: primary actions remain reachable, focus is retained, and no important state relies only on color.
- **R9 — Advanced; differentiation.** Add conservative cross-domain adjustments with an explanation and a small explicit change budget. Prefer one useful action to multiple speculative alerts. Acceptance: an opt-in longitudinal pilot shows suggestions are understood, accepted or meaningfully overridden, and do not increase logging burden.

Validation plan: run the same fixed tasks with actual users in BodyPilot and their existing tools—repeat breakfast, new packaged food, edit yesterday, log a routine set, change equipment, miss a training day, and explain a recommendation. Measure task success, corrections, steps/taps, median/p90 time, confidence in the result, and second-week unprompted return. Do not substitute screen-count parity or invented audit scores for these outcomes.

## 10. First implementation pass

Implemented the trustworthy daily food loop only. Changes are local, not pushed or deployed.

- Replaced the active Food view and removed the synthetic meal action.
- Added dated entries with immutable nutrient bases and derived totals; actual overages remain visible.
- Added serving/gram selection, source/basis context, recent-food repeat, editing, delete/undo, and explicit custom-label macros.
- Preserved undated earlier entries and aggregate totals separately without assigning invented dates.
- Added local-date refresh on focus/visibility/interval, and date-at-submit protection around midnight.
- Added a provider boundary rejecting missing required macros and ambiguous portion conversions while retaining genuine zeros.
- Fixed camera mount/cleanup and stale search/image/camera result guards.
- Kept barcode/manual fallback. Real-device camera decoding, native lifecycle, cloud sync, and historical target snapshots are not claimed as complete.

Implementation files: src/app/food_diary.ts, src/app/food_provider_quality.ts, src/app/food_connector.ts, src/components/nutrition/NutritionDiaryView.tsx, src/components/nutrition/FoodDiaryPanel.tsx, and the active App.tsx integration.

Observed local mobile change: empty-diary search is at 388 CSS pixels from the view top versus 1,258 on the production baseline, using the same 375 × 812 viewport. This demonstrates improved reachability, not a measured task-time improvement.

Verified through the UI: 85 g of a 170 g / 281 kcal chicken entry logs 140.5 kcal; repeat totals 281; invalid zero quantity is blocked; edits and delete/undo preserve arithmetic; Sep 2 and Sep 3 stay separate; reload preserves entries; 3,102.5 kcal remains visible against a 2,700 target as 402.5 over. No production food records were changed during testing.

The pass closes a release-blocking honesty gap. It does not yet beat the best food loggers, fix training safety contracts, or establish cloud reliability.

Verification: 91 automated tests pass, including 26 diary/provider cases; TypeScript and the production build pass. Mobile food layouts were inspected in light and dark mode. Camera behavior was code-reviewed but not validated with a real phone camera. The audit canvas separately type-checks without errors.
