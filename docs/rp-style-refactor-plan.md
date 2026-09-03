# RP-Style Hypertrophy Refactor Plan

## Repository baseline

- Runtime: React 18, Vite 8, TypeScript, Tailwind CSS, Capacitor/iOS.
- Live entry path: `src/main.tsx` mounts `src/app/App.tsx`.
- Navigation: five hash views (`home`, `today`, `food`, `training`, `more`).
- Persistence: normalized local/offline state in localStorage; the production service worker preserves the app shell.
- Design system: shared UI primitives under `src/components/ui` and tokens/premium surface classes in `src/index.css`.
- Baseline validation: TypeScript, Vite build, and iOS preflight pass. The repository has no lint configuration.
- Repository instructions: no `AGENTS.md` or root README was found.

The working tree already contains a large, user-owned rewrite. Several older tabs, the Zustand store, authentication, membership, and live-connector modules are not mounted by the current entry path. Preserve those files and avoid combining their incompatible workout models until an explicit adapter is added.

## Screen map

### Active workout / `TodayView`

- Existing components: `TodayView`, `ReplacementPicker`, `MuscleFeedbackControls`, UI primitives, and the new `WorkoutNumberField`/`RirSelect` controls.
- Current functionality: persistent set logging, prior results, recommendations, target RIR, set completion/edit/skip/add/remove, exercise reorder/replace/add, technique cues, feedback, workout history, and a rest timer.
- Target behavior: compact one-handed logging, a frozen session prescription, sticky next/save actions, explicit incomplete-set handling, persistent recovery, and contextual feedback.
- Preserve: local workout data, generated split, prior performance, recommendation explanations, same-target substitutions, and offline persistence.
- Rewrite/add: compact mobile set rows, finish confirmation, save errors, mesocycle-scoped history keys, stable replacement slots, and session-specific feedback.
- Testing: recommendation branches, safe load caps, completion rules, mesocycle isolation, mobile layout, persistence/reload, timer behavior, and finish flow.

### Home / today dashboard

- Existing components: `HomeView`, suggestion cards, Today card, and Meso card.
- Current functionality: readiness, macro/split summary, workout start/resume, and current-week progress.
- Target behavior: keep the workout action above the fold, show expected duration/target muscles/recovery notices, and distinguish completed from not-started sessions.
- Preserve: real derived plan and readiness values.
- Rewrite/add: compact supporting metrics and explicit workout lifecycle status.
- Testing: small-phone CTA visibility and start/resume routing.

### Mesocycle and weekly schedule / `TrainingView` and `WeeklyScheduler`

- Current functionality: selectable weeks, target RIR, completed/skipped sessions, templates, schedule editing, start/skip actions, and pause/end/new mesocycle controls.
- Target behavior: unambiguous loading versus deload weeks, isolated histories, move/edit actions, and explanations for prescription changes.
- Preserve: current scheduling rules, split generator, priorities, and custom-day editing.
- Rewrite/add: stable mesocycle identity, base-program versus effective-prescription separation, and workout move semantics.
- Testing: week transitions, skip/unskip, new-mesocycle isolation, and custom-program stability.

### Program builder and exercise substitution

- Current functionality: templates, frequency, duration, equipment, load increment, six priority levels, custom days/lifts, and same-target replacements.
- Target behavior: guided review with weekly sets/frequency/duration and ranked replacements using the richer existing exercise catalog.
- Preserve: templates, custom split data, and historical lift names/results.
- Rewrite/add: builder steps, equipment/day availability, restriction filters, stable slot IDs, and progression-transfer explanations.
- Testing: customization without compounded set adjustments, replacement with in-progress logs, and regeneration that preserves user edits.

### Recovery, feedback, and analytics / `MoreView`

- Current functionality: local feedback, readiness inputs, workout history, volume by muscle, estimated strength, and recent lift rows.
- Target behavior: relevant pre-exposure check-ins and per-session feedback feeding transparent next-session recommendations; filterable real-data analytics.
- Preserve: actual persisted history and existing calculation helpers.
- Rewrite/add: timestamped/session-scoped feedback, pain escalation, trend filters, and adapters to richer dormant analytics where appropriate.
- Testing: feedback affects only future prescriptions, bodyweight/reps-only history, and empty states.

## Implementation status

Completed across the incremental slices:

- Shared workout number/RIR controls, premium training surfaces, responsive touch targets, sticky workout actions, accessible status labels, storage-error messaging, and reduced-motion behavior.
- A canonical, versioned workout session with frozen prescriptions, start/pause/resume/finish timestamps, pause-adjusted duration, session-scoped feedback, deterministic set operations, interruption recovery, and an explicit discard path.
- Fast set logging with recommendation acceptance, completed-set correction, skip/add/remove, bodyweight-set support, previous performance, technique cues, exercise reordering, exercise addition, and finish validation.
- Session-scoped rest timers that do not double-start for the same set, survive navigation, pause with the workout, serialize native schedule/cancel work, and leave already-due alerts available for OS delivery.
- Mesocycle-scoped workout, skip, check-in, and history keys plus versioned import of legacy `workoutSplit`, `trackerDays`, bodyweight, and unscoped workout-log data.
- Base-program/effective-prescription separation so week, feedback, priority, and deload adjustments never compound into the saved program.
- Ranked exercise substitution using the existing exercise library, real preference/history/pain signals, combined filters, transfer explanations, stable slots, and preservation of completed history during mid-workout replacement.
- Relevant pre-exposure recovery check-ins, exercise-specific joint response, pain-safe recommendation guards, fast muscle feedback, and transparent next-session set/load/RIR changes.
- A guided mesocycle builder with schedule, equipment, priority, maintenance/exclusion, preference/restriction, structure, validation, per-exercise replacement, draft custom-exercise equipment metadata, and full program review stages.
- A guarded mesocycle lifecycle with week/day status, move/edit/skip controls, current-plan-only completion counts, pause/end and template-replacement confirmation, program-completion review, and safe next-mesocycle creation.
- Real-data analytics for progression, strength, muscle volume, adherence, duration, RIR, feedback, pain, personal records, bodyweight history/trend, and mesocycle/week/workout/exercise filters.
- Focused tests for recommendation safety, workout-session transitions, migration, substitution, builder equipment compatibility, analytics, bodyweight history, and notification lifecycle boundaries, supplemented by responsive browser interaction checks.

## Preserved integration boundaries

The repository's dormant authentication, membership, connector, Zustand, and cloud-sync modules remain untouched and available to their existing consumers. They use a separate product model and are not mounted by the current `src/main.tsx` entry path; this refactor deliberately does not fabricate a production account provider or silently merge incompatible persisted stores.
