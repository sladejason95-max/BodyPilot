# BodyPilot Competitive Product Audit

Date: 2026-04-25

## 1. Executive Verdict

BodyPilot is a strong concept with weak execution in the places that decide adoption: daily logging speed, mobile simplicity, trust, and continuity.

It is not category-leading yet. It is overbuilt and under-polished. The product has a smarter coaching thesis than many generic fitness dashboards, but users do not pay for thesis. They pay because the app is faster, clearer, and more reliable than what they already use every day.

Right now the app feels like a powerful prototype that has been designed from the coach's brain outward. Best-in-class products are designed from the tired user's thumb inward.

The unique angle is real: physique prep plus training, food, readiness, and coach decisions in one app. The weakness is also real: the app asks users to read too much, infer too much, and trust too many panels before the core logging loops feel effortless.

## 2. Competitor Comparison By Category

### Nutrition And Macro Tracking

It loses to MacroFactor, Cronometer, and MyFitnessPal on logging speed and database trust.

MacroFactor claims AI photo food logging, barcode scanning, verified food search, label scanning, URL recipe import, custom foods, smart history, speech-to-text, and fewer taps for logging than other apps: https://macrofactor.com/macrofactor/. BodyPilot has a useful food surface, but it does not yet feel like a dedicated logger. It has search, barcode, custom foods, templates, and quick macros, but the flow is still surrounded by coaching context and panels. That is slower than a user expects from a macro app.

Cronometer wins on food-data trust. It markets verified food data, over 1M verified foods, barcode scanning, device sync, and deep micronutrient visibility: https://cronometer.com/index.html. BodyPilot cannot currently compete on database credibility. If a physique athlete does not trust the numbers, the app is dead.

MyFitnessPal still wins on muscle memory. Its barcode flow is obvious: search page, scan barcode, camera opens: https://support.myfitnesspal.com/hc/en-us/articles/360032624771-How-do-I-use-the-barcode-scanner-to-log-foods. BodyPilot's barcode flow exists, but it is not the obvious default action everywhere food entry appears.

Missing or weak: recent foods, smart history priority, copy yesterday, copy meal, repeat last food, speech logging, nutrition-label OCR quality, verified database labeling, database contribution workflow, faster edit/delete for logged foods, fewer taps from dashboard to actual entry.

### Workout Logging

It loses to Strong, StrengthLog, and similar workout trackers on speed of logging sets.

Strong's competitive pitch is simple: record progress and access training across phone, desktop, and Apple Watch. It reports millions of users and workouts logged: https://www.strong.app/. That matters because workout logging is a repeated, sweaty, distracted use case. BodyPilot has richer context, RPE/RIR, split logic, and coaching intelligence, but the set entry experience is heavier than the best workout trackers.

BodyPilot is trying to solve programming, logging, coaching, readiness, and education in one area. Strong and similar apps mostly optimize the moment in the gym. BodyPilot must match that moment before its intelligence matters.

Missing or weak: rapid set entry, plate/rest timer logic, previous-performance defaults, one-tap repeat previous set, personal records, progression history per exercise, exercise video/demo depth, offline confidence, wearable/watch companion, stronger planned-versus-actual comparison.

### Coaching

It loses to TrueCoach and Trainerize on operational completeness.

TrueCoach markets program building, video exercise library, nutrition tracking, habit tracking, wearables sync, client tracking, dashboard, and messaging in one coach system: https://truecoach.co/. Trainerize positions itself around meal planning, meal tracking, habit coaching, and managing nutrition inside the coaching workflow: https://www.trainerize.com/nutrition-coaching/.

BodyPilot's coaching logic is more interesting than generic coach software in one way: it attempts to diagnose and recommend. But coach platforms win because they are operationally dependable: client roster, messaging, payments, notifications, history, permissions, reports, check-ins, and client compliance all work as a business system.

BodyPilot has the shape of a coaching product, not yet the reliability of one.

Missing or weak: real backend, coach/client accounts, role permissions, client invites, multi-client queues with filters, message delivery, unread states, payment/subscription workflow, notification delivery, check-in forms, media review workflow, audit trail, publishing/version history that feels legally and professionally durable.

### Athlete Management

It loses to coaching platforms on client operations and to consumer apps on self-serve clarity.

For self-managed athletes, BodyPilot is deep but mentally expensive. It contains a lot of "why" before the athlete has completed the "do." For coaches managing many clients, the roster and decision surfaces are promising but not robust enough to replace a real coach dashboard.

Missing or weak: coach triage by risk, adherence heatmaps, client tags, next-contact queue, missed-check-in alerts, plan-change approvals, client-visible change summaries, private coach notes, comparative progress panels, photo review workflow, exportable reports with delivery confidence.

### Daily Habit And Performance Tracking

It loses to Apple Fitness and wearable ecosystems on daily habit clarity.

Apple's Activity Rings are not powerful because they are complex. They are powerful because the user knows exactly what remains today. Apple's own materials emphasize daily rings, trends, weekly summaries, training load, cardio fitness, and recovery: https://www.apple.com/cf/newsroom/2026/01/apple-watch-keeps-users-active-and-motivated-in-2026/.

BodyPilot has better bodybuilding-specific context, but it is too verbose. The daily loop needs to be brutally obvious: food, basics, lifts, check-in, closeout. Everything else is secondary.

Missing or weak: streaks or adherence momentum that does not feel childish, reminders tied to actual gaps, persistent daily closeout, wearable sync as a first-class input, low-friction recovery capture, "you are done for today" satisfaction.

### Premium Mobile UX

It loses to premium consumer apps on restraint.

The app still has too many cards, too much copy, and too many equal-priority panels. Some of the visual system now looks premium, but the product still behaves like a canvas dashboard in several places. A premium mobile app does not make the user scan six panels to decide what to do. It surfaces one action, then hides depth until asked.

Missing or weak: native-feeling mobile hierarchy, tighter bottom-sheet interactions, lower text density, fewer dashboard objects, stronger empty/loading/error states, clearer touch targets, fewer desktop-first grids appearing on mobile, better animation restraint, more confidence after actions.

## 3. Missing Functionality

- Real backend accounts with auth, sync, and conflict handling.
- Coach/client relationship model with invites, permissions, and client switching.
- Reliable notifications for food gaps, lift gaps, check-ins, coach updates, and closeout.
- Production-grade food database strategy: verified source labels, barcode contribution, label scan, recent/frequent foods, copied meals, recipes, import from URL.
- Faster workout logging: previous set defaults, repeat set, PR history, rest timers, exercise history, offline mode, optional watch companion.
- Clear onboarding that chooses mode: beginner, lifestyle, self-managed athlete, coach-managed athlete, contest prep, coach.
- True first-run sample plan and guided setup.
- Strong empty states that tell the user what to do next instead of showing dead dashboards.
- Error states and action confirmations for copy/export/apply/publish/import.
- Better coach operations: queue, unread messages, client filters, risk ranking, report delivery, plan versioning.
- Retention systems: daily closeout, progress streaks, adherence trends, gentle reminders, weekly review ritual.
- Privacy and data trust: export/import is not enough; users expect account durability.

## 4. Biggest Usability Failures

- Too much reading before action. Users should not need to understand the model before logging today's food or lifts.
- Food logging is not always one tap from the current context. That is fatal versus macro apps.
- Workout logging is still too form-like. In the gym, the user needs fast set entry, not a rich dashboard.
- Insights repeat the same concept in different panels. Repetition reduces trust because it feels generated rather than decisive.
- Navigation still mixes destinations with jobs. "AI Coach," "Dashboard," "Today," "Food," and "Plan" are closer now, but the app still sometimes exposes internal product architecture.
- Mobile has improved but remains crowded. The user sees a polished compressed dashboard, not a native mobile workflow.
- Some actions feel vague: "Make change," "Open review," "Review package," and "Latest update" are not always explicit enough.

## 5. Biggest Trust / Retention / Product-Quality Failures

- Silent success is a trust killer. Copy/export/apply actions need visible confirmation and fallback behavior.
- Fake completeness risk is high. Barcode, account, coach, and insight features exist visually, but users will judge them by edge cases.
- The account system is not production-grade enough for a coaching product.
- No real notification delivery means adherence support is conceptual, not operational.
- No credible database provenance means nutrition numbers feel less trustworthy than Cronometer or MacroFactor.
- The app's intelligence sometimes recommends before the logging signal is complete. That makes the coaching engine look overeager.
- There is too much generated-sounding guidance. Good coaching software should be direct and sparse.

## 6. Biggest Strategic Mistakes

- Trying to be a dashboard before being the fastest daily logger.
- Treating insight density as value. Insight is valuable only when it changes the next action.
- Building coach intelligence before coach operations are solid.
- Building many surfaces with similar visual weight instead of one dominant daily loop.
- Underestimating database trust. Macro tracking users are unforgiving when numbers are wrong.
- Underestimating mobile. This category is won on phones, during meals, at the gym, and while tired.

## 7. Highest-Impact Opportunities

1. Make logging immediate everywhere: food, basics, lifts, check-in.
2. Collapse dashboards into job-based lanes: Log, Review, Adjust, Publish.
3. Make every insight resolve to one action with confirmation.
4. Build recent/frequent food and repeat-last-food flows.
5. Build previous-set workout defaults and one-tap set repeat.
6. Add real action receipts: copied, published, applied, logged, synced.
7. Make coach queue operational: who needs attention, why, and what to send.
8. Add production trust: account sync, notifications, permissions, error handling.

## 8. Prioritized Implementation Roadmap

### Highest Impact / Fastest Win

- Add fast capture from the daily shell: Food, Basics, Lifts, Check-in.
- Fix vague or misleading primary actions so they open the exact surface or show confirmation.
- Add action receipts for apply/copy/publish/log actions.
- Reduce insight repetition on the AI Coach and Dashboard surfaces.

### Highest Impact / Medium Complexity

- Build food speed layer: recent foods, frequent foods, repeat last, copy yesterday, meal templates as first-class quick actions.
- Build workout speed layer: previous set defaults, repeat set, next open lift focus, rest timer, exercise history.
- Add guided daily closeout with "done for today" state.
- Build coach action queue with filters: missing food, missed lifts, low recovery, check-in due, update unacknowledged.

### Foundational Architecture

- Backend auth, sync, role model, coach/client relationship, plan versions, notification scheduling.
- Durable event log for actions and plan changes.
- Food data provenance and contribution workflow.
- Offline-first local logging with sync conflict resolution.

### Premium Polish

- Mobile-first rebuild of the daily flow using bottom sheets and focused capture screens.
- Better loading, empty, and error states.
- Reduce card count and copy density.
- Tighten dark mode contrast and chart legibility.

### Advanced Differentiation

- Prep-specific decision engine that only recommends changes after signal confidence clears a threshold.
- Coach-published plan diffs: "what changed, why, what to do today."
- Visual check-in review with comparison tools.
- Adaptive prep roadmap tied to actual adherence, not theoretical targets.

## 9. Exact Implementation Plan

### Fast Capture Shell

Build: persistent Food, Basics, Lifts, Check-in actions on desktop and mobile daily shell.

Why: Users should not hunt for the most repeated actions.

Competitor gap closed: narrows the logging-speed gap against MacroFactor, MyFitnessPal, Cronometer, and Strong.

Placement: core.

Improves: usability, retention, trust.

### Food Speed Layer

Build: recent foods, frequent foods, repeat last food, copy meal, copy yesterday, verified-source labels, faster barcode fallback.

Why: Food logging is the highest-frequency behavior. If it is slower than MyFitnessPal or MacroFactor, users will abandon.

Competitor gap closed: nutrition logger parity.

Placement: core.

Improves: usability, retention, trust.

### Workout Speed Layer

Build: next open lift focus, previous set defaults, repeat set, previous performance, PR marker, rest timer.

Why: Current workout logging is too dashboard-like for an active gym session.

Competitor gap closed: Strong/StrengthLog logging speed.

Placement: core.

Improves: daily use, athlete value.

### Action Receipts

Build: visible confirmation and fallback for copied, applied, published, imported, synced, and logged actions.

Why: Silent success feels broken.

Competitor gap closed: production trust.

Placement: core.

Improves: trust.

### Coach Queue

Build: operational coach queue with filters, unread states, high-risk clients, next action, and publish history.

Why: Coach value is not a dashboard. It is knowing who needs attention and sending the right update fast.

Competitor gap closed: TrueCoach/Trainerize operations.

Placement: advanced core for coach mode.

Improves: coaching value, differentiation.

### Backend Readiness

Build: auth, cloud sync, roles, notifications, persisted plans, plan versions, client invites.

Why: A coaching product cannot feel local-only.

Competitor gap closed: real production readiness.

Placement: foundational.

Improves: trust, retention, coach adoption.

## 10. Single Highest-Impact Pass First

Chosen pass: Fast Capture Shell.

Reason: The biggest competitive failure is not missing intelligence. It is that repeated daily logging still takes too much scanning and navigation. The app needs to feel useful in five seconds.

Implementation target:

- Desktop dashboard daily shell gets a Fast Capture panel.
- Mobile top context gets four compact quick actions.
- Actions route directly to food add, tracker log, lift log, and check-in creation.
- The goal is not feature bloat. The goal is speed.

Status: implemented in this pass.

## Implementation Progress

### 2026-04-25 - Pass 2: Speed, Trust, Continuity

Status: implemented.

- Food logging: added repeat-last from the Food Log view, per-meal Add actions, compact repeat foods, visible source labels, and confirmation messages for repeat/undo/saved-meal actions.
- Workout logging: added target-fill, copy-previous-set, repeat-first-set, and visible lift completion receipts inside the live workout log.
- Continuity: fixed Exercise Library primary actions so they add the best matching exercise instead of navigating vaguely; Today now opens the tracker log directly.
- AI Coach: closeout logic now opens the exact log surface for tracker work instead of dropping users at a generic tab.
- Trust: clipboard export, athlete handoff, publish, acknowledge, and target-apply actions now show visible success or blocked-copy receipts.

Next highest-value pass: previous-performance workout defaults, rest timer, and a tighter coach queue that ranks clients by missing food, missed lifts, low recovery, check-in due, and unacknowledged updates.

### 2026-04-25 - Pass 3: Workout Speed And Coach Triage

Status: implemented.

- Workout speed: added last-performance recall per lift, Use last numbers, target-fill, copy-previous-set, repeat-first-set, and per-lift rest timers.
- Rest flow: added a visible rest timer panel with pause, resume, and reset so the workout logger feels usable mid-session instead of only after the workout.
- Coach triage: queue now prioritizes food gaps, missed lifts, missing data, low recovery, check-in cadence, queued publish work, athlete receipts, and open support tasks.
- Coach workflow: added queue filters for Food, Lifts, Recovery, Check-in, and Publish, with exact routing into the needed surface instead of generic tab navigation.

Next highest-value pass: reduce dashboard/AI Coach insight repetition, make advanced insights collapse behind one decisive next action, and create stronger empty/error states for production trust.

### 2026-04-25 - Pass 4: One-Action Insight Hierarchy

Status: implemented.

- AI Coach: rebuilt the top of the surface around one dominant top action instead of three equal insight cards.
- AI Coach: deep trend, watchpoint, progress, and closeout analysis now stays behind a deliberate Deep read toggle for athlete-style scanning.
- AI Coach: weekly plan shows only the most relevant lanes by default, with the full read available when needed.
- Dashboard: coach attention queue now shows the highest-priority items first, hides lower-priority queue density by default, and keeps exact routing into food, tracker, check-in, or plan surfaces.

Next highest-value pass: production trust states for offline/local save, food database failures, empty first-run experiences, and notification/account readiness.

### 2026-04-26 - Pass 5: Production Trust States

Status: implemented.

- App shell: added visible local-save, offline-ready, account, and notification status in the desktop and mobile shell so users do not have to infer whether data is safe.
- Settings: trust/status chips now open directly to the relevant Account, Notifications, or Data section instead of dropping users into a generic settings drawer.
- First-run trust: re-enabled a compact dashboard setup prompt for local-only/account/notification gaps with a clear "Protect data" action and a non-blocking "Continue local" path.
- Data operations: backup export, backup import, and local reset now produce visible success/error receipts instead of relying only on a settings banner.
- Food database recovery: live search and barcode failures now explain that local staples, saved foods, recent foods, and custom logging still work; barcode failures offer a direct custom-food fallback with the barcode carried over.

Next highest-value pass: tighten onboarding/setup so a new athlete can personalize profile, show date, food targets, and training week in one guided flow without being pushed into advanced builders.

### 2026-04-26 - Pass 6: Guided Athlete Setup

Status: implemented.

- Dashboard onboarding: added a compact four-step setup guide for athlete profile, show date, food targets, and training week so first-run users are not dumped into advanced builders.
- Real state, not fake setup: the guide edits the live athlete name, bodyweight, body-fat estimate, target weight, contest date, food targets, split template, weekly schedule, and tracker entry path.
- Food setup: added a one-click model sync for active macros, water, salt, estimated TDEE, and step target so beginners get usable defaults without understanding the model first.
- Training setup: added template selection and a Build week action that uses the existing split builder and schedule generator, keeping onboarding tied to the real planning system.
- Flow cleanup: Start Today and Add first food dismiss setup prompts and route into the exact logging surface instead of leaving users in configuration mode.

Next highest-value pass: compress the mobile bottom navigation and daily shell so Today, Food, and Start/Closeout stay reachable with fewer competing surfaces.

### 2026-04-26 - Pass 7: Mobile Daily Dock

Status: implemented.

- Mobile control simplification: removed the separate tracker-only action rail and the duplicated quick-action grid from the mobile header.
- Persistent daily dock: rebuilt the mobile bottom dock around Home, Today, Food, and one dynamic command so the highest-frequency actions stay reachable with one thumb.
- Dynamic command logic: athlete mode now surfaces Acknowledge, Close, Start, Week, or Coach based on the current day state instead of forcing users to hunt through secondary controls.
- Header compression: mobile top context now keeps brand/current view, date, save status, and one next-action prompt without exposing mode switching and repeated capture buttons.
- Layout cleanup: reduced mobile bottom padding now that the stacked rail is gone, giving more usable content height on small screens.

Next highest-value pass: tighten nutrition mobile logging further with a true bottom-sheet style add flow and fewer full-panel transitions between Food Log, Add Food, Search, Scan, and Custom.

### 2026-04-26 - Pass 8: Mobile Food Capture

Status: implemented.

- Mobile food flow: replaced the generic Food Log / Add Food / Targets tab picker on mobile with one Food Capture panel.
- Fewer transitions: Search, Scan, Custom, Repeat, quick macro logging, Review, target meal selection, and Undo now live in the first mobile food surface.
- Faster macro logging: mobile users can enter P / C / F and log a macro-only entry without opening the full Add Food panel.
- Target clarity: the selected meal is visible before Search, Scan, Custom, or Repeat so foods do not land in the wrong meal by accident.
- Library continuity: Search / Scan / Custom mode controls now stay sticky while scrolling the food library on mobile.

Next highest-value pass: reduce nutrition desktop density and consolidate repeated macro/meal panels so Food Log, Add Food, and Targets feel like one product system instead of adjacent tools.

### 2026-04-26 - Pass 9: Desktop Food Command System

Status: implemented.

- Desktop nutrition: replaced the tiny Food Log / Add Food / Targets tab picker with one command surface showing today's calories/macros, target meal, last logged item, repeat/undo, mode switching, and Search/Scan/Custom.
- Density reduction: the desktop Log view no longer repeats the full macro dashboard below the command surface; it focuses on meal status and diary access.
- Continuity: target meal selection now stays visible before desktop Search, Scan, Custom, Repeat, and Undo actions.
- Clutter removal: removed the redundant "Meal diary tucked away" summary because the Meals panel already owns the Show diary action.
- Product direction: Food Log, Add Food, and Targets now read as one nutrition workflow instead of three adjacent tools.

Next highest-value pass: tighten the workout Today surface the same way, with one command strip for current lift, previous numbers, rest timer, and closeout so training stops feeling split between planning and logging.

### 2026-04-26 - Pass 10: Workout Command Surface

Status: implemented.

- Training log: added a single workout command surface that shows the current lift, set progress, previous performance, rest timer, closeout state, and the next high-value actions.
- Logging speed: Hit target, Open lift log, Use last numbers, Repeat first set, Rest 1:30, Finish day, Close basics, and Add food now live in the first log surface.
- Continuity: previous lift numbers and rest timer feedback are visible before the full lift list, so the user does not have to scan every exercise card to know what to do next.
- Density reduction: removed the duplicate athlete entry-status block and separate rest-timer card from the lower detail section.
- Hierarchy: renamed the lower workout section to Training details so it reads as editable detail beneath the command surface, not the primary decision layer.

Next highest-value pass: make the workout lift cards faster on mobile by turning each lift into a compact row by default with one-tap set logging, expandable detail, and sticky current-lift navigation.

### 2026-04-26 - Pass 11: Mobile Lift Logging Speed

Status: implemented.

- Mobile lift list: added a sticky Current lift control with Hit, Log, and Rest actions so the user does not lose the active exercise while scrolling.
- Set logging: each lift now has compact S1/S2/S3 chips on mobile that log the set at target or copy the previous set with one tap.
- Density reduction: athlete lift cards are compact by default; detailed set fields stay behind the Details toggle while coach mode still opens detailed logs.
- Previous performance: last-session numbers stay out of the compact mobile row until Details is opened, but remain visible on desktop.
- Mid-workout flow: Hit target, Rest, Details, Use last numbers, and per-set logging are now reachable without reading the full exercise card.

Next highest-value pass: simplify the tracker Dashboard/Status view by removing repeated nutrition and execution panels now that Food and Workout have dedicated command surfaces.

### 2026-04-26 - Pass 12: Tracker Status Simplification

Status: implemented.

- Tracker Status: replaced the repeated daily fuel, macro progress, readiness chart, step bullet, and week line stack with one calm Today Status board.
- Job-based routing: Food, Training, Basics, and Closeout are now four clear status tiles that open the correct command surface instead of re-explaining the data.
- Density reduction: Status now shows blockers and a compact week snapshot only; full food logging stays in Food and full workout logging stays in Log.
- Closeout clarity: when nothing is blocking the day, Status surfaces Finish day instead of another chart.
- Product hierarchy: Tracker Status now answers "what matters today?" while Log answers "do the work."

Next highest-value pass: improve daily closeout into a stronger finished-state ritual with clear completion, coach/client visibility, and a satisfying "done for today" confirmation.

### 2026-04-26 - Pass 13: Daily Closeout Ritual

Status: implemented.

- Closeout experience: rebuilt Daily closeout around a clear finished-state headline: Ready to finish, Saved with review flags, or Done for today.
- Completion clarity: added Food signal, Training, Basics, and Support readiness rows so users see exactly why a day can close or why it needs review.
- Trust and visibility: added a What gets saved panel explaining saved record, coach/client visibility, and change-history behavior before the user finishes the day.
- Confirmation quality: Finish day now produces stronger saved messages and distinguishes clean closeouts from closeouts saved with review flags.
- Post-closeout state: closed days now disable the primary finish action and show the saved note and timestamped state instead of inviting repeated closure.

Next highest-value pass: finish food-speed parity with copy-yesterday/copy-meal flows and smarter recent/frequent food priority.

### 2026-04-26 - Pass 14: Food Copy Speed Layer

Status: implemented.

- Copy meal: added Copy shortcuts in Add Food so a user can append or replace the selected target meal with foods from any food-backed meal.
- Copy day pattern: added Copy saved day for saved food-backed meals, giving users a fast repeat-day workflow without pretending local-only state has historical food days.
- Saved meal loop: selected food-backed meals can now be saved directly from the Add Food target meal panel for one-tap future repeat use.
- Smarter quick picks: the food library now prioritizes foods already used in the target meal before frequent, recent, and saved foods.
- Database trust preserved: copied foods reuse the original food entry base nutrients, serving options, source labels, and recipe metadata instead of becoming macro-only approximations.

Next highest-value pass: tighten the food library result rows for mobile with fewer controls, clearer primary Log action, and quicker serving adjustment before logging.

### 2026-04-26 - Pass 15: Food Row Logging Speed

Status: implemented.

- Food result rows: made Log the primary action and moved serving amount/unit directly into each row before logging.
- Serving speed: added compact minus/plus serving controls and serving-unit selection, with calories/macros previewing the selected amount before the user taps Log.
- Mobile clarity: reduced row visual clutter by pushing fiber/sodium and barcode detail out of the primary action line while keeping source/provenance visible.
- Review tray continuity: Review now respects the selected serving amount and unit instead of always adding one default serving.
- Trust: quick logs now persist the chosen serving option, so barcode/live/custom foods keep accurate serving context.

Next highest-value pass: improve food database trust and empty/error states with clearer verified-source hierarchy, fallback choices, and contribution prompts for missing foods.

### 2026-04-26 - Pass 16: Food Database Trust States

Status: implemented.

- Source hierarchy: food results now rank verified core staples, saved foods, recent foods, and custom foods ahead of looser live catalog matches.
- Row trust: each food result now explains its provenance with source detail, and unverified live catalog matches clearly ask the user to confirm serving size before logging.
- Search trust: the search surface now shows verified-first, live-backup, and missing-food recovery affordances so users understand what is reliable and what to do next.
- Empty states: missing searches now offer Create custom, Scan barcode, and Retry live search instead of ending in a generic no-results panel.
- Barcode recovery: empty scan results now keep lookup and custom creation available, and the custom-food form explains the minimum information needed to log now and reuse later.

Next highest-value pass: strengthen coach/client continuity by making plan-change diffs, acknowledgements, and "what changed" visibility obvious across the athlete dashboard and coach publish flow.

### 2026-04-26 - Pass 17: Coach Change Continuity

Status: implemented.

- Published packages now generate a clear change diff: direction, queued plan changes, next action, and signal/confidence movement.
- Athlete Dashboard now shows "What changed" inside the live published update before the athlete acknowledges it.
- Athlete Coach view now repeats the same change list with a direct acknowledgement action, so the receipt flow is not trapped on one page.
- Coach publish flow now includes an athlete-visible change summary before publishing, forcing the package to explain what changed in five seconds.
- Coach published-history panel now shows the exact change list the athlete sees plus the current receipt state.
- Athlete handoff copy now includes a "What changed" line so pasted updates stay aligned with the in-app package.

Next highest-value pass: tighten mobile coach-update and notification-like surfaces so unacknowledged changes appear as a compact top-of-day alert without crowding the daily logging flow.

### 2026-04-26 - Pass 18: Mobile Coach Update Alert

Status: implemented.

- Mobile shell now surfaces unacknowledged coach updates as a compact top-of-day alert with the published title and first changed item.
- The alert offers Review and Acknowledge actions so athletes can see what changed before confirming receipt.
- Mobile dock no longer instantly acknowledges the update; its dynamic command opens the update instead.
- The alert stays outside the food/training command surfaces, keeping daily logging reachable while still making the update impossible to miss.

Next highest-value pass: improve notification/account readiness by turning local notification preferences into visible scheduled reminders for food gaps, closeout, check-ins, and coach updates.

### 2026-04-26 - Pass 19: Reminder Plan Readiness

Status: implemented.

- Notification preferences now include a dedicated daily closeout reminder instead of hiding closeout behind generic schedule alerts.
- App state now builds a live reminder schedule for food gaps, closeout, open training, check-in cadence, coach update receipts, and queued plan changes.
- Settings now shows a "Today's reminder plan" panel with armed, waiting, blocked, and off states tied to real triggers.
- Reminder rows show the delivery channel and trigger logic, making the current local-only notification model honest instead of fake-complete.
- The app shell alert label now reflects armed/enabled reminder count instead of only saying alerts are on or off.

Next highest-value pass: build adherence momentum that is not gimmicky: streak/consistency signals for food logging, training completion, closeout, and check-ins with practical recovery when a day is missed.

### 2026-04-26 - Pass 20: Adherence Momentum

Status: implemented.

- Dashboard now shows a compact Consistency momentum layer directly under daily closeout.
- Momentum covers food signal, training completion, daily closeout, check-in cadence, and basic tracker fields.
- Training, closeout, and basics use real recent tracker history; food uses today's live food signal until dated food history exists.
- Each momentum item shows a score, current state, practical recovery copy, and routes back to the exact surface needed to recover the loop.
- The language avoids gimmicky streak pressure: missed days become a next clean action, not a punishment.

Next highest-value pass: add a weekly review ritual that turns the momentum, closeout, food, training, and check-in signals into one concise "review the week / set next week" flow.

### 2026-04-26 - Pass 21: Weekly Review Ritual

Status: implemented.

- Dashboard now adds a Weekly review ritual directly after consistency momentum so week closure is not buried in coach or tracker views.
- The ritual combines weekly completion, momentum health, check-in cadence, and next-week macro/plan readiness into one four-part review.
- Athletes and coaches can save a weekly review from the dashboard, creating a visible receipt with completion, recommendation, and limiter context.
- If next week's targets are out of sync, the same panel offers Sync next week instead of making the user hunt through planning surfaces.
- Coach and athlete paths stay distinct: coaches go to the review package, athletes go to the week view.

Next highest-value pass: deepen dated food history so food momentum can move from today-only signal to real weekly food adherence, copy-yesterday, and missed-day recovery.

### 2026-04-26 - Pass 22: Dated Food History And Copy Recovery

Status: implemented.

- Food logging now has a dated food-day history instead of only a live today state.
- Today's food day auto-saves once real food exists, and the user can explicitly Save today for a visible recovery/review receipt.
- Nutrition now shows a Food week strip with red, amber, and green day states so weekly food adherence is scannable in seconds.
- Copy yesterday and Add to today now restore a previous food-backed day without rebuilding meals food by food.
- Dashboard food momentum now reads from the last seven dated food days once history exists, so the weekly review is based on actual adherence instead of a single-day proxy.
- Previous-day food is carried into history when the app opens on a new day, then today's food log starts clean.

Next highest-value pass: improve workout logging speed with a true set-by-set mobile flow, repeat-last-set actions, and clearer planned-vs-actual progression.

### 2026-04-26 - Pass 23: Workout Set Logging Speed

Status: implemented.

- Tracker now has a current-set runway for the active lift: next set, planned reps, last logged set, and progression are visible without opening the full lift card.
- Added one-tap Log + rest, Copy last, and History actions so a sweaty mid-session user can log the next set without editing three fields.
- Mobile lift rows now show compact set chips with the actual logged result instead of anonymous S1/S2/S3 buttons.
- Each lift card now separates Plan, Actual, and Progression so planned-vs-actual comparison is visible before diving into detailed fields.
- Desktop and mobile both support repeat-last-set behavior from the compact surface, while detailed fields remain available when precision is needed.

Next highest-value pass: add exercise-level history and PR/recent-best markers so progression becomes motivating and trustworthy over multiple weeks.

## 2026-04-26 Re-Audit After Flow And Logging Passes

### 1. Executive Verdict

BodyPilot is still not category-leading. It is now more usable than the original prototype, but it remains a strong concept fighting product sprawl. The daily loops are materially better: fast food recovery, set logging, weekly review, reminders, closeout, and coach-change receipts exist. The app is no longer just a coach-brain dashboard.

The blunt verdict: promising but not competitive yet. It is closer to a serious v1, but top apps still beat it on single-job excellence. Nutrition apps beat it on food database trust. Workout apps beat it on exercise history and PR motivation. Coaching platforms beat it on operations and account durability. Premium consumer apps beat it on restraint.

The app's best chance is not to out-MyFitnessPal MyFitnessPal or out-Strong Strong. It should own prep coaching continuity: "What do I do today, what changed, did I execute, and what should adjust next?" Right now that promise is visible, but still surrounded by too much product weight.

### 2. Competitor Comparison By Category

Nutrition / macro tracking: BodyPilot still loses to MacroFactor, Cronometer, and MyFitnessPal. Cronometer markets trusted nutrient data, barcode scanning, copy/paste, multi-select, custom meals, recipes, and repeat items. MyFitnessPal exposes barcode from the dashboard plus diary/search flow. BodyPilot now has food-day history, saved-day recovery, quick macros, barcode/search/custom, and better source labeling, but it still cannot credibly claim database depth, label scanning, photo logging, or low-tap logging from every context.

Workout logging: BodyPilot is closer, but still loses to StrengthLog, Strong-style workout trackers, and dedicated gym logs. StrengthLog foregrounds no clutter, set timers, PRs, history, quick stats, exercise guides, and previous-workout importing. BodyPilot now has current-set logging, copy-last-set, history-based logging, and rest timers, but it still needs persistent exercise records, recent-best markers, per-exercise graphs, and clearer motivation after a good set.

Coaching: BodyPilot loses to TrueCoach, Trainerize, and Everfit on operational completeness. TrueCoach offers client management, messaging, compliance tracking, exercise videos, payments, dashboards, and exercise history. Trainerize sells nutrition coaching, meal tracking, habit coaching, and scalable coach operations. BodyPilot has stronger decision-support potential, but coach value is not real until client queues, messages, plan versions, permissions, notifications, and account sync are dependable.

Athlete management: BodyPilot is better for a self-managed physique athlete than many generic dashboards, but weaker than real coaching platforms for a coach with many clients. It lacks true unread states, client filters, media review workflow, and hard delivery receipts. It has a good thesis, not yet a business system.

Daily habit / performance tracking: BodyPilot is catching up on adherence momentum, reminder planning, and weekly review. It still loses to wearable ecosystems like WHOOP on passive data capture and direct recovery guidance. WHOOP wins because it measures continuously and turns data into clear personalized coaching. BodyPilot still asks the user to create too much of the signal manually.

Premium mobile UX: BodyPilot is improved but still too dense. Premium consumer apps hide complexity until needed. BodyPilot often exposes the whole operating system. That is powerful for coaches, tiring for athletes.

### 3. Missing Functionality

- Real cloud accounts, sync, role permissions, client invites, and conflict handling.
- Real notification delivery, not just reminder planning.
- Label scan, photo food logging, speech logging, recipe import, barcode contribution workflow.
- Exercise-level PRs, recent bests, volume trends, per-exercise charts, and history-backed progression.
- Coach queue filters, unread message states, SLA-style next-contact list, and client risk tags.
- Durable plan versioning, approval history, and athlete-visible change receipts backed by persisted versions.
- Progress photo comparison tools with measurement overlays and coach notes.
- Offline-first logging confidence and sync receipts.
- Strong empty/error states for failed barcode, failed save, no history, no coach connection, and no account sync.
- A genuinely native mobile capture model: bottom sheets, persistent quick actions, large touch targets, fewer panels.

### 4. Biggest Usability Failures

- The app still makes users read too much before logging. The daily surfaces are better, but the product still loves explanation.
- Mobile remains more compressed desktop than native mobile in several places.
- Nutrition logging is improved, but the database trust story is weak versus Cronometer and MacroFactor.
- Workout logging is faster, but exercise progression is not yet emotionally satisfying.
- Coaching workflow still has too many "review" destinations and not enough hard operational queues.
- "AI Coach" risks feeling like another dashboard until recommendations are gated by signal confidence and reduced to one sharp next move.

### 5. Biggest Trust / Retention / Product-Quality Failures

- Local-only state is not enough for a coaching product. Users will not trust serious prep data to a local browser app long term.
- Barcode/search/custom food exists, but without database provenance depth it feels weaker than dedicated nutrition tools.
- Coach/client messaging exists visually, but it lacks delivery, unread, and notification reliability.
- Insights can still outrun signal quality. Recommendations must refuse to decide when food, lifts, or check-ins are incomplete.
- The app is too broad for its current production maturity. Breadth without operational reliability reads as fake-complete.

### 6. Biggest Strategic Mistakes

- Trying to win every category at once instead of owning "prep execution cockpit."
- Letting coach intelligence appear before coach operations are production-grade.
- Treating dashboards as value. The value is reducing uncertainty and action time.
- Under-prioritizing database trust and cloud trust, the two things serious users will punish immediately.
- Letting power-user surfaces leak into beginner/mobile flows.

### 7. Highest-Impact Opportunities

1. Make exercise history and PR/recent-best feedback visible inside the workout logger.
2. Gate coaching recommendations behind signal completeness.
3. Build coach queue filters around real blockers: missed food, missed lifts, check-in due, low recovery, unacknowledged update.
4. Turn nutrition database trust into a first-class system: verified, custom, live, unverified, contribute.
5. Collapse AI/review/dashboard repetition into one decisive "next move" layer.
6. Start foundational account/sync architecture before adding more coaching features.

### 8. Prioritized Implementation Roadmap

Highest impact / fastest win:
- Add exercise history, recent best, and PR markers to the existing lift logger.
- Add signal-confidence gates before AI/coach recommendations.
- Reduce repeated insight panels on Dashboard, AI Coach, and Tracker Review.

Highest impact / medium complexity:
- Build coach triage queue filters and client-risk buckets.
- Improve food database trust states and label/barcode fallback.
- Add progress photo comparison and check-in review tools.

Foundational architecture:
- Auth, cloud sync, coach/client roles, plan versions, notification delivery, and offline-first event log.

Premium polish:
- Native mobile bottom-sheet capture for food, sets, bodyweight, and check-ins.
- Fewer dashboard cards, stronger empty states, tighter dark mode and chart hierarchy.

Advanced differentiation:
- Prep decision engine that refuses bad data, explains confidence, and publishes one next move.
- Adaptive prep roadmap tied to actual adherence and visual condition, not theoretical targets alone.

### 9. Exact Implementation Plan

Exercise history / PR markers: build recent exercise history inside lift cards, show prior best load, new-best markers, matched-best markers, and recent sessions. Core. Closes the StrengthLog/Strong progression gap. Improves retention and athlete value.

Signal confidence gates: block or downgrade recommendations when food, training, closeout, or check-in data is missing. Core. Closes trust gap. Improves clarity and decision quality.

Coach triage queue: add filters, sorting, unread/update states, and "send next update" actions. Core for coach mode. Closes TrueCoach/Trainerize operations gap. Improves coaching value.

Food database trust: rank verified foods harder, show unverified warnings, add label-scan placeholder/recovery path, and contribution receipts. Core. Closes Cronometer/MacroFactor trust gap. Improves adoption.

Mobile capture polish: replace remaining dense panels with focused capture sheets. Core. Closes premium mobile UX gap. Improves daily use.

Backend readiness: create the account/sync/event architecture. Foundational. Closes production trust gap. Improves retention and coach adoption.

### 10. Single Highest-Impact Pass First

Chosen pass: Exercise History And Recent Best.

Reason: Food and workout logging are now faster, but workout retention still lacks the motivational proof that serious lifters expect. StrengthLog-style PR/history feedback is not decorative; it is why users keep logging. BodyPilot needs to make progression visible at the exact moment of logging.

Status: implemented in Pass 24.

Sources used for this re-audit:
- Cronometer food tracking: https://cronometer.com/features/track-food.html
- MyFitnessPal barcode flow: https://support.myfitnesspal.com/hc/en-us/articles/360032624771-How-do-I-use-the-barcode-scanner-to-log-foods
- StrengthLog workout tracking: https://www.strengthlog.com/
- TrueCoach coaching platform: https://truecoach.co/
- Trainerize nutrition and habits: https://www.trainerize.com/nutrition-coaching/ and https://www.trainerize.com/features/habits/
- WHOOP guidance model: https://www.whoop.com/us/en/how-it-works/

### 2026-04-26 - Pass 24: Exercise History And Recent Best

Status: implemented.

- Tracker lift cards now compute exercise-level history across tracker days.
- Each lift can show Best load, New best, Matched best, or First load directly in the logging row.
- The active workout command surface now shows the current lift's history badge beside target and logged-set state.
- Lift cards now include recent-history strips with prior session summaries and top loads.
- Mobile detail view now exposes a compact history block so progression context is not desktop-only.

Next highest-value pass: add signal-confidence gates so AI/coach recommendations refuse to over-decide when food, lifts, check-ins, or closeout are incomplete.

### 2026-04-26 - Pass 25: Signal Confidence Gates

Status: implemented.

- Added a shared decision signal gate that scores food, training, basics, check-in, closeout, and coach-direction receipt before the app makes or publishes a coaching call.
- Dashboard now exposes the gate directly under the daily closeout so users see why the app is ready, cautious, or blocked.
- AI Coach now makes the first signal blocker the top action when the gate is blocked instead of presenting a plan change with false confidence.
- Coach workspace now shows the gate inside the publish package and disables Publish decision when the gate is blocked.
- Athlete handoffs now include the signal gate state, so exported updates do not pretend noisy data is clean.

Next highest-value pass: consolidate repeated insight surfaces so Dashboard, AI Coach, and Coach do not tell the same story three different ways.

### 2026-04-26 - Pass 26: Shared Decision Brief

Status: implemented.

- Added a shared decision brief that turns the current recommendation, signal gate, execution state, and food state into one source-of-truth narrative.
- Dashboard now uses the brief for the coach hero, direction lane, and decision evidence instead of repeating separate recommendation, blocker, and signal panels.
- AI Coach now leads with the same brief and removes the extra signal-gate tile from the first viewport.
- Coach workspace now uses the brief for athlete-facing direction, the current-call metric, and the review panel instead of showing a second "recommended action" stack.
- The brief keeps supporting items actionable, so consolidation reduces clutter without hiding the next tap.

Next highest-value pass: tighten mobile capture surfaces for food, bodyweight, steps, and check-in so the app feels faster in real daily use.

### 2026-04-26 - Pass 27: Mobile Quick Capture

Status: implemented.

- Mobile shell now exposes four thumb-sized capture actions for food, basics, lifts, and check-in instead of hiding capture behind the primary command only.
- Tracker log now has a mobile-only Fast capture card with bodyweight, steps, energy, food, and check-in in one compact surface.
- The larger desktop Quick entry panel is now hidden on mobile so the small-screen flow starts with the fastest inputs instead of a full desktop card.
- Check-in creation is available directly from Tracker mobile capture, reducing the jump between daily logging and review evidence.

Next highest-value pass: improve nutrition database trust and food selection hierarchy so fast food logging feels more credible than a prototype list.

### 2026-04-26 - Pass 28: Nutrition Trust Hierarchy

Status: implemented.

- Logged foods now preserve their verified/source confidence instead of becoming implicitly trusted after they enter a meal.
- Food search now has a shared trust model for verified staples, recipes, custom foods, barcode matches, macro-only entries, and community foods that need label checks.
- Search filters now include Trusted and Custom so users can avoid loose live-catalog results when speed or precision matters.
- Search result rows, speed picks, review tray items, and logged meal entries now show the same trust badges and label-check warnings.
- The nutrition command surface now calls out labels that need checking instead of hiding weak provenance inside generic food counts.

Next highest-value pass: add coach triage queue filters and blocker buckets so coach mode becomes an operational queue, not another dashboard.

### 2026-04-26 - Pass 29: Coach Operations Triage

Status: implemented.

- Coach mode now has a roster-wide triage board that answers who needs attention first before the coach reads the full workspace.
- The local coach roster now includes multiple client states so queue switching, blocker ranking, and coach operations can be exercised instead of hiding behind a one-client prototype.
- Triage rows rank critical blockers across athlete receipt, signal-gate blockers, missed lifts, low recovery, athlete-thread replies, queued changes, check-in review, peak-week support, and routine plan review.
- Added blocker bucket filters for All, Critical, Food, Lifts, Recovery, Check-in, and Publish with live counts.
- Clicking a triage row switches the active athlete and routes directly to the relevant surface instead of making the coach hunt through tabs.

Next highest-value pass: start tightening foundational production trust with a durable event/sync readiness layer for saved state, plan versions, offline confidence, and account-backed coaching data.

### 2026-04-26 - Pass 30: Production Trust Layer

Status: implemented.

- Added a shared production-trust signal model for local persistence, account scope, plan versions, event ledger, backup recency, and offline confidence.
- Settings/Data now has a Production trust board that shows what is ready, local-only, needs checking, or blocked instead of burying trust in generic backend-readiness copy.
- The local save envelope now carries a data-envelope version so future cloud sync and import validation have a clearer contract.
- Backup exports now stamp the exported payload and app state with `lastBackupExportedAt`, making backup recency visible instead of unknowable.
- The dashboard trust prompt now includes plan-version and backup state, so serious users see continuity risk before relying on the workspace.

Next highest-value pass: make plan version history more operational with compare/restore-style version cards and clearer athlete-visible delivery receipts.

### 2026-04-26 - Pass 31: Plan Version Operations

Status: implemented.

- Published coach decisions now receive athlete-specific version numbers at publish time instead of relying only on list order.
- Coach mode now treats the published package area as Plan version history, with current-package metrics, receipt state, athlete-visible diffs, and prior-version comparison cards.
- Older published versions now show confidence, completion, and compliance deltas against the previous package so the coach can see whether a change was made with stronger or weaker signal.
- Published versions can be reused as the active coach draft instruction and issue context, creating a safe rollback-style workflow without silently rewriting every connected nutrition or training field.
- Reused versions write a change-log event and visible receipt, so the app does not pretend important plan operations happened without trace.

Next highest-value pass: add progress-photo and check-in comparison tooling so coach decisions can be anchored to visual evidence, measurements, and adherence instead of text notes alone.

### 2026-04-26 - Pass 32: Coach Visual Check-In Review

Status: implemented.

- Added a shared visual check-in review model that compares the latest check-in against the prior check-in and the latest prior photo baseline.
- Coach mode now has a Visual evidence panel inside the coaching workspace instead of forcing visual review to live only on the Dashboard.
- The coach sees current photo coverage, latest-vs-prior front/side/back slots, bodyweight delta, waist delta, condition delta, recovery delta, and a short decision cue before publishing.
- Decision quality now includes a Visuals check, so the publish package warns when a coach is about to make a look-based call without any current photos.
- The panel includes Add check-in and Open photo review actions, keeping the workflow connected instead of making the coach hunt through tabs.

Next highest-value pass: make coach/client communication feel production-grade with unread states, delivery status, and update receipts tied to the coach thread and published plan versions.

### 2026-04-26 - Pass 33: Coach Communication Reliability

Status: implemented.

- Coach thread messages now carry delivery status, delivered timestamps, and read timestamps instead of behaving like anonymous notes.
- Publishing a coach decision now automatically creates a linked coach-thread update for that plan version, so the message trail and published package history stay connected.
- Athlete acknowledgement now marks the linked coach update as read, tying plan-version receipt to communication status instead of storing it in only one panel.
- Coach mode now shows unread athlete notes, current-version thread count, delivery trail count, and a review action before another plan update is sent.
- Dashboard thread preview now exposes unread athlete notes and lets the coach mark the thread reviewed without opening the full Coach workspace.

Next highest-value pass: reduce remaining dashboard density by making the first viewport one dominant daily action with supporting context collapsed behind progressive disclosure.

### 2026-04-26 - Pass 34: Dashboard First-Action Simplification

Status: implemented.

- Dashboard now opens on a single dominant next-action surface instead of immediately showing every daily, decision, momentum, and weekly review panel.
- The first card shows the active user or athlete, the most important action, readiness, open-loop count, daily completion, and the top closeout items in one compact surface.
- Daily board, decision details, momentum, and weekly review are now explicit progressive-disclosure toggles instead of always-visible competing sections.
- Coach strategy context is no longer forced above the action surface; it is available through Show coach context so the first viewport stays operational.
- Athlete plan context remains available through Show plan context without pushing the daily action lower on the page.

Next highest-value pass: tighten mobile capture further with bottom-sheet style focused logging states for food, basics, lifts, and check-ins so repeated daily input feels more native.

### 2026-04-26 - Pass 35: Mobile Focused Capture Sheet

Status: implemented.

- Tracker mobile fast capture now behaves like a focused capture sheet with four modes: Basics, Food, Lift, and Check.
- Basics mode keeps only bodyweight, steps, energy, and save actions visible, removing food and check-in clutter from the same panel.
- Food mode shows calorie and macro status plus Add food, Review log, Scan, and Custom actions without making the user leave through a generic dashboard card.
- Lift mode focuses on the current open lift with set progress, previous-performance context, Log set + rest, Repeat last, Use history, and Details actions.
- Check mode separates check-in and closeout work with the closeout note, Add check-in, and Close day actions in one tight mobile surface.

Next highest-value pass: improve production trust further by adding import validation and restore previews for backup files before they overwrite local prep history.

### 2026-04-26 - Pass 36: Backup Restore Preview

Status: implemented.

- Backup import no longer writes directly over the local workspace after file selection.
- Imported files now stage a restore preview with file name, size, export timestamp, backup version, data-envelope version, recognized BodyPilot sections, and section counts.
- Invalid or future-envelope backups are blocked before restore, so a newer or unrelated JSON file cannot silently replace prep history.
- Partial or legacy backups are allowed only after an explicit warning state, keeping recovery possible without pretending the restore is clean.
- Settings/Data now has a deliberate Confirm restore / Cancel flow, making continuity feel safer and more production-grade.

Next highest-value pass: add a sync/event ledger review surface so saved changes, plan publishes, imports, exports, and local-only actions can be audited before cloud sync exists.

### 2026-04-26 - Pass 37: Sync Event Ledger

Status: implemented.

- Added a shared sync-ledger event model for local saves, backup exports, plan versions, coach messages, change-log entries, food-day saves, weekly reviews, and wearable recovery imports.
- Settings/Data now includes a Sync event ledger with Ready, Local only, and Needs check totals instead of hiding continuity inside scattered panels.
- Recent events now show when they happened, which system produced them, what changed, and whether the item is saved, local-only, awaiting receipt, or blocked.
- Published coach decisions and coach-thread delivery states are visible in the same audit trail, making athlete-facing updates easier to trust before true cloud sync exists.
- The ledger uses existing real app state rather than fake activity, so it improves production trust without adding another manual maintenance surface.

Next highest-value pass: add data-conflict and restore-diff handling so imported backups can show what sections will change before replacing the local workspace.

### 2026-04-26 - Pass 38: Backup Restore Diff

Status: implemented.

- Backup restore preview now compares the selected backup against the current local workspace before the restore is confirmed.
- The preview shows current vs backup counts for meals, templates, custom foods, food history, tracker days, training days, schedule, check-ins, plan versions, coach messages, weekly reviews, recovery imports, and change-log records.
- Restore warnings now call out sections where the backup contains fewer records, making accidental data loss visible before the user replaces the workspace.
- Settings/Data now includes a Change preview table with current count, backup count, and the delta for each important continuity section.
- The diff stays section-level instead of exposing raw JSON, so the user gets the trust signal without drowning in implementation detail.

Next highest-value pass: add a lightweight conflict policy for future cloud sync, including owner/device/source labels and merge-vs-replace intent for plan, nutrition, tracker, and coach-thread data.

### 2026-04-26 - Pass 39: Sync Conflict Policy

Status: implemented.

- Added a shared conflict-policy model that names the owner, source, merge strategy, and conflict rule for each major data domain.
- Settings/Data now includes a Conflict policy board so future cloud sync behavior is explicit before a backend exists.
- Nutrition, tracker, training, plan versions, coach thread, schedule, protocol, and backup restore each have clear merge, append, replace, or manual-review intent.
- High-risk domains are no longer treated like ordinary data: published plan versions are append-only, coach messages are immutable after send, completed lift logs are preserved, and protocol conflicts require human review.
- The board reflects real app state where useful, including staged backup restore, unread coach receipts, unacknowledged plan versions, wearable imports, storage health, and self-managed vs coached ownership.

Next highest-value pass: tighten mobile production polish by reviewing Settings/Data density on small screens and converting the heaviest trust surfaces into collapsible disclosure groups.

### 2026-04-26 - Pass 40: Settings Data Disclosure

Status: implemented.

- Settings/Data now uses a reusable disclosure section for the heaviest trust surfaces instead of stacking every diagnostic board at full height.
- Production trust, Sync event ledger, Conflict policy, and Backend/lifecycle contracts default open on desktop and collapsed on smaller screens.
- Each collapsed section keeps a useful summary visible, such as ready counts, recent event count, review count, or system count.
- Direct actions remain exposed: backup export/import, staged restore preview, storage status, and reset controls are not buried behind disclosure.
- This keeps the production-trust depth available for coaches and advanced users while making the mobile settings flow less punishing.

Next highest-value pass: move direct backup/storage actions above the trust diagnostics on mobile so the Data tab starts with what users most often came to do.

### 2026-04-26 - Pass 41: Mobile Data Action Priority

Status: implemented.

- Settings/Data now prioritizes direct backup, import, restore preview, storage status, and reset actions immediately after the intro on mobile.
- Desktop keeps the operations-console order: production trust, sync ledger, conflict policy, lifecycle contracts, then direct data actions.
- The change uses responsive ordering instead of duplicating UI, so the same controls and state stay consistent across viewport sizes.
- Backup restore preview remains attached to the import action group, keeping the staged restore decision in the same flow that created it.
- This makes the Data tab faster for the exhausted user who opened settings to export, restore, or verify storage without reading every trust diagnostic first.

Next highest-value pass: tighten the backup/restore action group into a more command-like surface with clearer primary/secondary action hierarchy and a compact last-backup/status summary.

### 2026-04-26 - Pass 42: Data Command Surface

Status: implemented.

- Replaced the separate Backup file, Storage status, and Reset local data rows with one Local data controls surface.
- Export backup is now the primary action, Import backup is secondary, and reset remains a deliberate armed action instead of an equal-priority setting row.
- The command surface now shows compact Save, Backup, and Storage summaries before the user acts.
- Settings receives the last backup timestamp directly, so the backup summary can say whether a portable copy exists and when it was exported.
- The staged restore preview remains attached directly under the command surface, keeping import validation, diff review, confirm, and cancel in one continuous flow.

Next highest-value pass: add a compact Settings/Data mobile screenshot review and fix any spacing, wrapping, or touch-target issues that show up in the real viewport.

### 2026-04-26 - Pass 43: Settings Data Mobile QA

Status: implemented.

- Ran a real 390px mobile viewport review of the Settings/Data route instead of relying on code assumptions.
- Fixed the Settings deep-link bug where `settingsSection=data` opened briefly and then got overwritten by the default Account intent.
- Verified the Data tab opens directly from `?settings=1&settingsSection=data` with the correct active section.
- Checked the rendered mobile Data surface for horizontal overflow; the final viewport has matching `bodyScrollWidth` and viewport width with no overflow offenders.
- Increased the Export backup, Import backup, and Prepare reset controls to 44px mobile touch targets.
- Captured mobile review screenshots in `tmp-ui-review` for the top and action portions of the Data tab.

Next highest-value pass: continue production readiness by adding real account/sync adapter boundaries for auth, coach-client membership, and notification delivery.

### 2026-04-26 - Pass 44: Production Adapter Boundaries

Status: implemented.

- Added a typed production-adapter contract for auth/session, cloud sync, coach membership, notification delivery, and billing entitlement.
- Settings/Data now includes a Production adapters board that shows the current local adapter, required production adapter, handoff contract, metric, and readiness status.
- The board reflects real app state: account status, role, local roster size, reminder delivery status, storage health, and subscription tier.
- Added a formal local auth adapter object around the existing local account functions so auth is now represented as an adapter boundary instead of loose helper calls only.
- This does not pretend the backend exists; it makes the missing production systems explicit and gives the next implementation pass a concrete integration contract.

Next highest-value pass: add a coach-client membership adapter stub with invite, accept, revoke, and permission-state contracts so coach operations can move beyond local roster simulation.

### 2026-04-26 - Pass 45: Coach-Client Membership Adapter

Status: implemented.

- Added a typed local membership adapter for client invites, accepted coach-athlete relationships, revokes, permission updates, and account-scoped roster visibility.
- Membership records now have explicit status, coach identity, athlete identity/email, timestamps, and permission scopes instead of being implied by static demo roster state.
- Settings/Data now includes a Membership adapter board that separates invite, accept, revoke, permissions, and roster visibility readiness.
- The board shows what is still local and what needs production handoff, so coach workflows no longer look fake-complete.
- This preserves the current roster experience while creating the contract needed to replace demo clients with real membership-backed relationships.

Next highest-value pass: wire the membership adapter into the coach roster controls with a simple invite/revoke flow and visible pending invite state.

### 2026-04-26 - Pass 46: Coach Roster Membership Controls

Status: implemented.

- Wired the membership adapter into the coach roster surface instead of leaving it as a Settings/Data diagnostic only.
- The expanded coach roster now has a Client access command area for sending invites, seeing pending invites, and revoking/canceling membership access.
- Pending invite and active membership counts are visible in the roster flow, and production adapter metrics now reflect pending coach relationships.
- Active membership-backed clients are promoted into the visible roster, while static demo clients remain available until a real membership sync replaces them.
- Local data reset now clears membership records too, so client-access state does not survive a full workspace reset.

Next highest-value pass: add an athlete-side invite receipt so a coached athlete can accept a pending invite and clearly see what changed after becoming connected.

### 2026-04-26 - Pass 47: Athlete Invite Receipt

Status: implemented.

- Added athlete-side detection for pending coach invites that match the signed-in account email.
- The athlete dashboard now shows a compact Coach connection card only when there is a pending invite or active coach relationship.
- Accepting an invite updates the membership to active, switches the account role to coached athlete, turns off self-managed mode, and keeps the athlete in guided mode.
- Active coach connections now remain visible with coach name, relationship status, and permission-scope count, so the athlete can trust what changed.
- The flow keeps normal daily logging clean; the connection surface appears only when there is relationship state worth acting on.

Next highest-value pass: include coach-client membership records in export/import backup previews so relationship state has the same continuity guarantees as logs, plans, and messages.

### 2026-04-26 - Pass 48: Membership Backup Continuity

Status: implemented.

- Added membership records to the BodyPilot data envelope and bumped the envelope version because a complete backup now includes coach-client relationships.
- Exported backup JSON now includes coach invites, accepted relationships, revoked relationships, permission scopes, and membership timestamps.
- Restore preview now compares Memberships alongside meals, training, check-ins, plan versions, messages, recovery imports, and change log records.
- Confirmed restores now write membership records back into the dedicated local membership store before reload, so coach-client state survives import.
- App hydration now pulls membership records from the saved data envelope when present, with a fallback to the dedicated local membership store for older saves.

Next highest-value pass: add a visible athlete/coach change receipt after membership acceptance so both sides can see the relationship event in the local audit trail and coach thread context.

### 2026-04-26 - Pass 49: Relationship Audit Visibility

Status: implemented.

- Added Membership as a first-class change-log category instead of hiding relationship events under generic coach updates.
- Invite, accept, cancel, and revoke actions now create local audit entries with explicit coach, athlete, email, and impact copy.
- Accepted and revoked relationships also write coach-thread context notes, so connection changes sit beside coaching communication.
- The expanded coach roster now shows the latest access event, making membership changes visible where coaches manage clients.
- This closes the fake-complete gap where relationship state changed silently without a trustworthy trail.

Next highest-value pass: add a lightweight notification-delivery adapter stub for plan changes, invite receipts, check-in reminders, and closeout nudges so reminder logic has a production handoff path.

### 2026-04-26 - Pass 50: Notification Delivery Adapter

Status: implemented.

- Added a typed notification-delivery contract for coach invites, coach update receipts, plan changes, check-ins, closeout nudges, training follow-ups, food gaps, and weekly coach summaries.
- Created a local notification adapter that maps existing reminder state, push permission, email fallback, membership invites, active coach relationships, and queued plan changes into production handoff rows.
- Settings/Data now includes a Notification delivery board with event, audience, current trigger, production trigger, worker, channel, receipt policy, and readiness status.
- The contract calls out blocked states when a real delivery channel is missing instead of pretending push or email exists.
- This keeps the reminder UX user-facing and calm while making the backend worker responsibilities explicit enough to implement later.

Next highest-value pass: reduce main bundle weight by moving more heavy dashboard/diagnostic surfaces behind lazy imports and reviewing the persistent Vite chunk warning.

### 2026-04-26 - Pass 51: Bundle Weight Split

Status: implemented.

- Moved the full Settings panel behind a lazy import so the daily shell no longer pays for account, setup, notification, backup, adapter, and production diagnostics on first load.
- Added a compact settings-loading skeleton so deep-linked Settings/Data routes remain usable while the chunk loads.
- Split stable app data, scoring/decision engines, and infrastructure adapters into cacheable domain chunks through Vite manual chunks.
- The main app chunk dropped from roughly 603 kB before this pass to 390.71 kB after the split.
- The persistent Vite large chunk warning is cleared without hiding it by raising the warning limit.

Next highest-value pass: run a quick mobile/desktop visual QA pass on the new lazy Settings load state and coach roster membership surfaces to catch spacing or route-transition regressions.

### 2026-04-26 - Pass 52: Lazy Settings Visual QA

Status: implemented.

- Ran headless Edge QA against a fresh production preview for Settings/Data and coach roster membership surfaces on mobile and desktop.
- Verified the lazy Settings route resolves from the production build instead of relying on stale dev-server state.
- Fixed the desktop Settings panel from a narrow right-anchored surface to a centered, wider production Settings workspace.
- Confirmed Settings/Data mobile and desktop have no page-level horizontal overflow after the lazy split.
- Confirmed coach roster membership controls, pending invite state, and active membership rows render cleanly on mobile and desktop without page-level horizontal overflow.
- Saved visual QA evidence under `tmp-ui-review/pass52/` with screenshot captures and `qa-results.json`.

Next highest-value pass: tighten the remaining mobile coach roster polish by reviewing scrolled lower states under the fixed bottom dock, then convert any cramped roster/action rows into more native stacked mobile controls.

### 2026-04-26 - Pass 53: Mobile Coach Roster Ergonomics

Status: implemented.

- Converted coach invite/access rows from compressed desktop-style rows into stacked mobile controls with full-width Cancel and Revoke actions.
- Added action icons to Send invite, Cancel, and Revoke so destructive and invite actions scan faster without adding explanatory copy.
- Made the invite form responsive as a mobile-first command surface: inputs stack cleanly, the primary action stays full width on small screens, and desktop keeps the efficient inline layout.
- Tightened the coach roster rail controls into a mobile grid with thumb-sized Previous and Next actions, while preserving the fuller desktop labels.
- Added lower-scroll mobile QA coverage for roster and client-access states under the fixed bottom dock.
- Verified production preview screenshots for Settings/Data, coach roster, coach roster lower scroll, and client access lower scroll with no page-level horizontal overflow.

Next highest-value pass: turn coach mode from a visible roster into a true operational triage queue with filters for missing food, missed lifts, low recovery, check-in due, pending invites, and unacknowledged updates.

### 2026-04-26 - Pass 54: Coach Shell Triage Queue

Status: implemented.

- Promoted coach mode from "current athlete plus roster" into an operational queue that appears before roster controls.
- Added shell-level triage buckets for food gaps, missed lifts, low recovery, check-ins, pending invites, update receipts, and plan monitoring.
- Added critical/open counts, a top-blocker card, and horizontal filter chips so coaches can switch from all clients to urgent blockers without entering the deeper Coach tab.
- Triage rows now route to the right workflow: food opens fast food logging, lifts/recovery open today logging, check-ins and updates open the coach desk, and invites expand roster access controls.
- Kept the full Coach tab as the deeper workspace, while making the first coach-mode scan behave like an operations queue.
- Verified TypeScript, production build, and production-preview mobile/desktop screenshots with no page-level horizontal overflow.

Next highest-value pass: reduce duplicated coach triage between the shell and Coach tab by extracting the queue model into a shared helper so future backend client data feeds one triage system instead of two local implementations.

### 2026-04-26 - Pass 55: Shared Coach Triage Model

Status: implemented.

- Extracted coach triage scoring, bucket labels, priority labels, filtering, and row building into `src/app/coach_triage.ts`.
- Rewired the coach shell queue and full Coach tab to consume the same triage row model instead of maintaining separate priority rules.
- The shared model now supports food gaps, training gaps, recovery risk, check-in review, invites, update receipts, support replies, data blockers, and routine plan review.
- Added a workspace-specific triage build for the Coach tab while keeping the shell build focused on urgent scan-and-act rows.
- Fixed a mobile Coach-tab clipping issue by adding `minmax(0, ...)` grid tracks and `min-w-0` to the triage section panels.
- Expanded CDP visual QA to capture Coach tab mobile and desktop routes, not just the shell roster state.
- Verified TypeScript, production build, and production-preview QA with no page-level horizontal overflow.

Next highest-value pass: tighten the deeper Coach workspace density below triage, especially the desktop sections where visual review and publish/workspace panels still feel compressed and over-detailed.

### 2026-04-26 - Pass 56: Coach Workspace Density Cleanup

Status: implemented.

- Rebalanced the deeper Coach workspace so it no longer splits into compressed desktop columns too early.
- Shortened the top stat row from long sentence-style values into scan-friendly decision markers: athlete, completion, current call, and signal gate.
- Moved Previous/Next into compact header navigation and moved Save review, Export report, and Open week into a deliberate command strip.
- Reordered the publish lane around the actual coaching flow: publish package, athlete-visible change summary, coach instruction, decision quality, then optional advanced notes.
- Collapsed secondary draft clutter such as athlete issue, movement limitation, handoff preview, queued changes, and packaging rule behind Advanced notes.
- Added targeted Coach workspace visual QA captures for mobile and desktop, not just the top of the Coach tab.
- Verified TypeScript, production build, and production-preview QA with no page-level horizontal overflow.

Next highest-value pass: reduce the remaining Coach tab noise by turning Decision history, Plan version history, and Coach thread into a cleaner progressive-review area so coaches can inspect history without the lower workspace feeling like a long wall of cards.

### 2026-04-26 - Pass 57: Coach Review Trail Compression

Status: implemented.

- Replaced the separate Decision history, Plan version history, and Coach thread sections with one Review trail surface.
- Kept the live package and next action visible first, so the coach does not have to hunt through history to understand the current athlete-facing update.
- Added compact counters for weekly reviews, published versions, and unread athlete notes.
- Moved weekly decisions, version history, and coach-thread detail into collapsible review drawers, with the thread auto-opened only when unread athlete replies need attention.
- Preserved reuse, receipt, message review, and send-message actions inside the appropriate review drawer.
- Added targeted mobile and desktop QA captures for the Review trail itself, not just the top of the Coach workspace.
- Verified TypeScript, production build, and production-preview QA with no page-level horizontal overflow.

Next highest-value pass: make the coach review trail show meaningful production-grade empty states and fixture-backed continuity, because zero-count review panels still feel too demo-like when the coach QA account has no published package or weekly history.

### 2026-04-26 - Pass 58: Review Trail Empty States and QA Continuity

Status: implemented.

- Reworked the empty Review trail state so it leads with the private draft package, signal status, next receipt to create, and real actions instead of a generic dashed empty panel.
- Changed zero-count trail counters from dead-looking `0` panels into guided states such as Ready, Draft, and Clear.
- Added actionable empty states inside Weekly decisions, Version history, and Coach thread, including Save first review and Publish first package paths.
- Seeded the production-preview coach QA fixture with a live published package, a prior acknowledged package, two weekly snapshots, and coach-thread messages tied to the active package.
- The Review trail QA path now exercises version receipts, weekly continuity, unread athlete replies, and delivery status instead of only a no-data state.
- Verified TypeScript, production build, and production-preview QA with no page-level horizontal overflow.

Next highest-value pass: reduce duplication inside the Review trail drawer content by extracting small reusable review-card components, because the Coach tab is getting heavier and future history features will be harder to maintain if every drawer owns its own card markup.

### 2026-04-26 - Pass 59: Coach Review Trail Component Cleanup

Status: implemented.

- Extracted repeated Review trail primitives in `CoachTab.tsx` for stats, drawers, empty panels, metric grids, and info tiles.
- Rewired Weekly decisions, Version history, and Coach thread to use the shared primitives instead of each owning near-identical card markup.
- Reused the same metric grid for live and prior published decision packages so confidence, completion, and compliance deltas stay visually consistent.
- Kept the visible coaching workflow the same while making the Review trail easier to extend with deeper production history.
- Verified TypeScript, production build, and production-preview QA with no page-level horizontal overflow.

Next highest-value pass: split the Review trail into a dedicated Coach review component/module so `CoachTab.tsx` stops accumulating every coach workflow and future version-history work has a smaller, safer surface.

### 2026-04-26 - Pass 60: Coach Review Trail Module Split

Status: implemented.

- Extracted the full Review trail workflow from `CoachTab.tsx` into `src/app/coach_review_trail.tsx`.
- Moved Review trail state, thread filtering, receipt labels, version metrics, drawer primitives, empty states, and history cards into the dedicated module.
- Kept shared coach presentation helpers for publish tones and plan-diff tones reusable by the main Coach tab.
- Replaced the old inline Review trail wall with a single `CoachReviewTrail` component call, so the main Coach tab now reads closer to the actual coaching flow.
- Verified TypeScript, production build, and production-preview QA captures for Settings, coach roster, Coach tab, Coach workspace, and Coach Review trail with no page-level horizontal overflow.

Next highest-value pass: move the publish/workspace package builder into its own Coach package component so draft quality, athlete-facing summary, decision gate, and publish actions can evolve without bloating the operational Coach tab.

### 2026-04-26 - Pass 61: Coach Package Builder Module Split

Status: implemented.

- Extracted the publish package lane from `CoachTab.tsx` into `src/app/coach_package_builder.tsx`.
- Moved draft rendering, signal-gate unblock actions, athlete-visible change summary, coach instruction editing, decision-quality checks, advanced notes, and publish/handoff actions into the focused package builder.
- Added `src/app/coach_workflow_ui.ts` for shared coach workflow types and tone helpers, so Review trail and Package builder no longer depend on each other for common presentation rules.
- Preserved the visual-evidence quality check by passing the same photo coverage and decision-cue state into the package builder.
- Replaced the inline publish lane in `CoachTab.tsx` with a single `CoachPackageBuilder` call, making the main Coach workspace easier to scan and safer to extend.
- Verified TypeScript, production build, and production-preview QA captures for Settings, coach roster, Coach tab, Coach workspace, and Coach Review trail with no page-level horizontal overflow.

Next highest-value pass: make the package builder flow-first now that it is isolated: promote the single unblock action, collapse secondary metrics/advanced quality detail, and make the publish decision feel like a guided checkout instead of a dense form.

### 2026-04-26 - Pass 62: Flow-First Coach Publish Checkout

Status: implemented.

- Reworked the package builder from a dense draft form into a guided publish checkout.
- Promoted the first signal blocker into the primary action, so blocked coaches see one obvious next step instead of three competing buttons.
- Collapsed secondary blockers, package metrics, quality checks, and advanced notes into progressive review sections.
- Reframed the visible flow as Coach call, Athlete will see, Coach note, then delivery action, making the publish path scan in the order a coach actually thinks.
- Tightened mobile status badges so blocked/readiness pills no longer stretch full-width inside stacked layouts.
- Added dedicated production-preview QA captures for the package builder on mobile and desktop.
- Verified TypeScript, production build, and production-preview QA captures for Settings, coach roster, Coach tab, Coach workspace, Coach package builder, and Coach Review trail with no page-level horizontal overflow.

Next highest-value pass: apply the same flow-first treatment to the lower "Needs attention first" area by separating coach action queues from passive change history, because it still mixes urgent operations and informational updates in one column.

### 2026-04-26 - Pass 63: App Store Trust And Safety Readiness

Status: implemented.

- Added a dedicated Settings/Privacy section that exposes privacy policy, privacy choices, terms, support, data export, account deletion, notification consent, and health-scope boundaries in one place.
- Added a real in-app account deletion path from Settings/Account and Settings/Privacy instead of a mailto-only privacy request.
- Deletion now removes the local auth record, coach-client membership records, and local BodyPilot workspace data, then reloads into a clean workspace.
- Added public `/privacy.html`, `/privacy-choices.html`, `/terms.html`, and `/support.html` pages for App Store metadata, in-app links, user support, and privacy-choice access.
- Updated service worker caching so legal/support pages are available with the app shell.
- Updated production-readiness language so legal/support status reflects the new public pages and in-app deletion/export controls.
- Added mobile and desktop QA scenarios for the new Settings/Privacy route and fixed the app-level deep-link allowlist so `settingsSection=privacy` opens the correct tab.

Next highest-value pass: run a full App Store submission dry run checklist against metadata, screenshots, age rating, native wrapper permissions, App Privacy labels, and reviewer notes, because code-level trust controls do not replace App Store Connect configuration.

### 2026-04-26 - Pass 64: Live Backend Connector Layer

Status: implemented.

- Added a live backend connector model that maps accounts, sync, storage, email, push, payments, webhooks, jobs, coach audit, privacy automation, and observability to concrete providers, endpoints, secrets, events, owners, and launch requirements.
- Added a Settings/Data "Live backend connectors" board so production gaps are visible as product infrastructure instead of hidden inside vague readiness copy.
- Added a local `server/bodypilot-live-api.mjs` API with health checks, transactional email, Stripe checkout, Stripe webhook verification, an in-memory job queue, audit receipts, and privacy deletion queueing.
- Added `.env.example` and a `npm run live:api` script so every live service has a documented configuration path.
- Updated backend readiness language to include transactional email, payments/webhooks, background workers, StoreKit/Stripe entitlement boundaries, and observability.

Next highest-value pass: wire one production provider end to end, starting with Postgres auth/sync or transactional email, because the connector layer is now explicit but the app still needs durable server persistence before it can be trusted across devices.
