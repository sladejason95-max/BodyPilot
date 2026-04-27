# Stage Prep Guide App - UX Improvement Roadmap

## Goal

Finish the simplification pass that has already started in the app. The product no longer needs a brand-new shell. It needs the current shell tightened so the information architecture, visual language, and role boundaries all tell the same story.

## Status Snapshot

| Workstream | Status | Current state |
|------------|--------|---------------|
| Primary operating shell | Done | Main nav is simplified; `library` and `schedule` remain internal fallback routes but are guarded away from guided athlete flow |
| Today-first athlete flow | Done | `TodaysPlanHero`, Today Week, route guards, collapsed review blocks, and mobile quick actions keep athletes in the daily path |
| Compounds progressive disclosure | Done | Stack tools are gated behind `showAdvancedEditors.compounds` |
| Mobile shell | Done | Bottom dock, compact mobile context, and athlete quick actions support common tasks without planner/browser detours |
| Surface simplification | Done | Shared primitives, sidebar, Today hero, daily fuel, dashboard tone helpers, label tracking, gradients, and custom shadows now follow the calm baseline |
| Settings progressive disclosure | Done | Settings are split into workspace, setup, and advanced tool sections |

## Implementation Progress

### Completed in the current cleanup run

- Settings now use separate `Workspace`, `Athlete setup`, and `Advanced tools` sections instead of one long control stack.
- Shared primitives and the desktop sidebar have calmer default styling.
- Exercise support now exists inline inside Training, while the full Library route remains available as a deeper browser.
- Today now has a contextual `Week` surface for execution-oriented weekly review.
- Common `Today week` CTAs in Dashboard, Nutrition, Coach, Compounds, and Tracker route to Today's Week surface where appropriate.
- The athlete Dashboard now keeps the deep prep roadmap collapsed by default.
- The Today's Plan hero and Tracker daily fuel card are visually quieter.
- Standalone `ScheduleTab` now reads as a fallback `Full calendar`, with direct exits back to `Today week`, `Today log`, and Training.
- Standalone `LibraryTab` now reads as a fallback `Exercise browser`, with a primary path back to Training.
- The athlete Dashboard now also keeps the prep signal board collapsed by default.
- Dashboard check-in and prep-roadmap tone helpers have been flattened from custom gradients to semantic tonal surfaces.
- Wide uppercase label tracking has been reduced to `tracking-[0.06em]` across `src/app` and the remaining shared component offenders.
- Shared helper surfaces, app-level command cards, top context fields, nutrition summary surfaces, and chart/tooltips now use flat or semantic surfaces.
- Custom `shadow-[...]` utilities have been eliminated from `src/app` and `src/components`.
- Explicit gradient background utilities have been eliminated from `src/app` and `src/components`.
- Recent check-ins now collapse by default for athletes, while coaches can still expand the full review.
- Coach plan activity history now stays hidden behind a `Show history` control.
- Guided athlete attempts to open `schedule`, `library`, or `compounds` now resolve to Today Week, Training, or Direction instead of hidden fallback routes.
- Stack tooling is hidden from guided athletes even when the advanced compounds toggle is enabled.
- Mobile athlete quick actions now provide direct access to `Log today`, `Add food`, and `Week` above the bottom dock.
- Mobile now uses a compact context bar for mode, date, session, and settings instead of the dense desktop top grid.
- Training, Schedule, and Library now display role guardrail copy for coach-managed vs self-managed athlete use.
- Athlete Training now tucks adaptation, weekly load, and frequency review behind a `Show review` control by default.
- Coach-managed athlete flows no longer show locked builder dead-end cards for Food, Training, or Direction tools.
- Athlete exercise-selection CTAs now open inline Training exercise support instead of routing to the standalone Exercise browser.
- Athlete Food Log now keeps the full meal diary tucked behind `Show diary`, leaving the fast dashboard and Add To Today path first.
- Training day-card edit actions now stay behind `Edit day`, so move, duplicate, and delete controls no longer crowd the default session map.
- Today Week keeps `Full calendar` as a coach-only deep path; self-managed athletes now route back to Training map instead.
- Compounds primary actions now open the detailed stack editor for editable modes and route guided athletes straight to Today Week or Meals instead of leaning on a fallback calendar redirect.
- Settings now includes an explicit ownership frame for Coach, Guided athlete, and Self-managed athlete modes.
- Athlete attempts to open `Library` or `Schedule` now resolve into Training exercise support or Today Week, making those fallback routes coach/deep-only in practice.
- Athlete Training now shows a compact lift order first, with the full order behind `Show full order`.
- Athlete Food Diary now collapses logged food rows per meal, so expanded diary mode does not immediately become a long serving editor.
- Today Log now opens the next active lift by default and keeps other lift set-entry panels tucked behind `Open log`.

### Closed structural decisions

- The fallback coach/deep `LibraryTab` and `ScheduleTab` routes remain internal routes for now. They are no longer taught as everyday athlete destinations, and athlete attempts resolve into Training exercise support or Today Week.
- Expanded mobile states now use deliberate reveal controls: food rows, full lift order, lift logs, and day edit controls are no longer open by default. Remaining work is device QA, not roadmap implementation.

## Phase 0 - Protect What Is Already Working

This phase is the guardrail set that stayed intact through the cleanup.

### Keep

- The reduced primary shell in `App.tsx`
- `TodaysPlanHero.tsx`
- compounds gating through advanced editors
- the mobile dock pattern
- shared surface helpers in `workspace_ui.tsx`

### Do not regress

- Do not reintroduce `library` or `schedule` as first-class primary nav items.
- Do not make compounds visible by default again.
- Do not replace the current shell with a larger navigation model.

## Phase 1 - Finish The Navigation Model

### Objective

Make the user-facing IA match the shell that the app already suggests.

### Completion notes

- `AppTab` still contains 8 internal route states by design, but the user-facing athlete model is Dashboard, Today, Food, Training, and Coach where applicable.
- `LibraryTab` and `ScheduleTab` remain coach/deep fallback routes, not primary athlete destinations.
- Dashboard and supporting cards now point athletes to owning workflows instead of hidden sibling routes.

### Completed changes

- Reframed `Library` as inline Training exercise support for athlete tasks.
- Reframed `Schedule` as a coach/deep `Full calendar`, with Today Week as the normal weekly operating surface.
- Replaced standalone "Week planner" and "Library" paths with contextual wording tied to Today and Training.
- Kept internal route support for fallback/deep access while removing those routes from common athlete navigation.

### Target files

- `src/app/App.tsx`
- `src/app/tabs/SplitTab.tsx`
- `src/app/tabs/TrackerTab.tsx`
- `src/app/tabs/DashboardTab.tsx`
- `src/app/tabs/LibraryTab.tsx`
- `src/app/tabs/ScheduleTab.tsx`

### Acceptance criteria

- Met: the app can be explained in 4-5 destinations for everyday use.
- Met: athletes can complete daily work without intentionally navigating to `library` or `schedule`.
- Met: Dashboard CTAs point to owning workflows rather than hidden sibling routes.
- Met: mobile users are not taken outside the dock mental model for common tasks.

### Status

Complete

## Phase 2 - Split Settings Into Clear Layers

### Objective

Turn settings from one long admin surface into a progressive-disclosure control center.

### Completed changes

- Created three internal sections:
  - Workspace
  - Athlete setup
  - Advanced tools
- Moved mode, self-management, builder visibility, and appearance to the top-level workspace section.
- Moved body metrics, phase, goal focus, and cadence choices into athlete setup.
- Moved editor toggles into advanced tools with stronger warnings around specialist surfaces.
- Added role ownership copy for Coach, Guided athlete, and Self-managed athlete modes.

### Target files

- `src/app/SettingsPanel.tsx`
- `src/app/App.tsx`

### Acceptance criteria

- Met: users can identify mode and control depth quickly from the Workspace section.
- Met: the first screen of settings contains everyday controls and ownership context.
- Met: advanced editor toggles no longer visually compete with basic workspace settings.

### Status

Complete

## Phase 3 - Simplify Visual Primitives First

### Objective

Reduce visual noise system-wide by simplifying the base components before polishing individual tabs.

### Completed changes

- Flattened primary component primitives:
  - `Button`
  - `Badge`
  - `Input`
  - `Textarea`
  - `Tabs`
  - `Switch`
- Simplified `WorkspaceSidebar.tsx` from premium-glass styling to a calmer, mostly neutral rail.
- Standardized surface classes around a small token set:
  - default surface
  - tonal surface
  - emphasis surface
- Reduced uppercase label tracking across standard cards.
- Removed explicit gradient background utilities and custom `shadow-[...]` utilities from `src/app` and `src/components`.

### Target files

- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/switch.tsx`
- `src/app/WorkspaceSidebar.tsx`
- `src/app/workspace_ui.tsx`

### Acceptance criteria

- Met: gradient and custom shadow usage is zero unless a future exception is documented.
- Met: standard cards read without relying on blur, glow, or stacked shadows.
- Met: the sidebar no longer visually dominates the main content column.
- Met: labels use quieter tracking values.

### Status

Complete

## Phase 4 - Tighten Dashboard And Mobile Completion Paths

### Objective

Preserve the better shell, but make the most common flows faster to scan and finish.

### Completed changes

- Kept the dashboard organized into three layers:
  - Action now
  - What changed
  - Deep review
- Collapsed low-frequency review blocks for athletes by default.
- Reduced competing top-of-dashboard context.
- Added fixed mobile athlete quick actions for `Log today`, `Add food`, and `Week`.
- Guarded hidden-route migration so common mobile tasks resolve back into Today, Food, or Training.

### Target files

- `src/app/tabs/DashboardTab.tsx`
- `src/app/TodaysPlanHero.tsx`
- `src/app/App.tsx`
- `src/app/tabs/TrackerTab.tsx`
- `src/app/tabs/NutritionTab.tsx`

### Acceptance criteria

- Met: athletes can answer "what do I do now?" from the top dashboard section.
- Met: mobile users can log the day without touching a planner-style screen unless they intentionally choose to.
- Met: the first screenful of the dashboard has one obvious primary action.

### Status

Complete

## Phase 5 - Role Ownership Cleanup

### Objective

Make coach and athlete mode feel intentionally different rather than lightly filtered.

### Completed changes

- Defined athlete-owned, coach-owned, and self-managed-only flow boundaries in navigation, settings, Training, Today, Food, and fallback route behavior.
- Updated CTA copy so role expectations are visible in the language itself.
- Removed coach-managed locked builder dead ends for athletes.
- Added stronger self-managed and coach-owned frames where planner depth remains available.

### Target files

- `src/app/App.tsx`
- `src/app/SettingsPanel.tsx`
- `src/app/tabs/DashboardTab.tsx`
- `src/app/tabs/CoachTab.tsx`
- `src/app/tabs/SplitTab.tsx`
- `src/app/tabs/TrackerTab.tsx`

### Acceptance criteria

- Met: athlete mode feels execution-first through Today-first routing, quick actions, and collapsed deep review.
- Met: coach mode feels review-and-publish-first through coach-owned calendar and ownership copy.
- Met: self-managed athlete mode is clearly an expanded athlete workflow, not accidental coach mode.

### Status

Complete

## Later Work, Outside This Roadmap

These items are still valuable, but they are intentionally outside the completed simplification roadmap:

- onboarding flow
- peak week and contest-day specific workflows
- progress photo timeline
- wearable integration
- richer coach-athlete communication surfaces

The app got more value from sharper editing than from broader feature scope. These can remain future product bets.

## Completed Sequence

1. Phase 1 - Finish navigation model
2. Phase 2 - Split settings
3. Phase 3 - Simplify primitives and sidebar
4. Phase 4 - Tighten dashboard and mobile flow
5. Phase 5 - Final role ownership cleanup

This order was followed enough to avoid polishing dead-end surfaces before the IA and role boundaries were settled.

## Completion Measurement

The completed pass now measures against these outcomes:

- Reachable destinations users need to understand: 4-5 for everyday use
- Hidden full-screen routes in athlete daily flow: 0 for common tasks
- Gradient utility count in app surfaces: 0 explicit gradient background utilities in `src/app` and `src/components`
- Custom shadow utility count in app surfaces: 0 custom `shadow-[...]` utilities in `src/app` and `src/components`
- Time-to-orient in settings: ownership, mode, and depth are visible in the Workspace section
- Mobile daily logging flow: no forced detours into planner-first screens

## Definition Of Success

This roadmap is complete because the product now feels smaller, calmer, and more predictable without losing its depth.

That means:

- fewer places
- clearer roles
- quieter components
- stronger completion flow

The app now has that system in place. Future work should protect it rather than reopen the completed simplification scope.
