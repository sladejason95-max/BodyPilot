# Stage Prep Guide App - UX Audit Refresh
## April 23, 2026

## Executive Summary

The app is in a much better UX position than the earlier draft audit suggested. The current shell already has several strong moves in place:

- Primary navigation is simplified into a smaller operating shell.
- Athlete mode has a real "Today's plan" hero.
- Compounds are gated behind the advanced editor toggle.
- Mobile has a dedicated bottom dock.
- Shared surface primitives now exist in `src/app/workspace_ui.tsx`.
- Settings are split into clearer Workspace, Athlete setup, and Advanced tools sections.
- Schedule and Library are now framed as fallback/deep tools rather than everyday destinations.

That progress now has follow-through. The simplification roadmap is complete for the current scope: athletes stay inside the owning workflows for common tasks, coach/deep tools are framed as deeper tools, Settings explains ownership, and the visual baseline is calm enough to protect.

The current UX problem is no longer "the structure needs follow-through." The remaining concern is product QA and future refinement: validating expanded states on real devices, preserving the route guardrails as new features land, and resisting visual decoration creep.

### Current verdict

- Foundation quality: strong
- Daily-use clarity: high
- Visual discipline: high
- Mobile readiness: high for the roadmap scope, pending real-device QA
- Coach-athlete separation: high

Future work should focus on validation and protection rather than another broad simplification pass.

## What Improved Since The Earlier Draft

The last draft was directionally useful, but it now overstates a few problems that have already been addressed in code.

### Confirmed improvements

- The primary shell is no longer an 8-item top-nav problem. `App.tsx` now builds a smaller operating shell through `primaryWorkspaceNav`, `builderWorkspaceNav`, and `mobileDockNav`.
- `TodaysPlanHero.tsx` is real and already rendered on the athlete dashboard.
- The compounds surface is no longer always-on. It is conditionally exposed through `showAdvancedEditors.compounds`.
- Desktop and mobile navigation already distinguish between everyday surfaces and deeper builder tools.
- Several shared cards now use simplified surface helpers from `workspace_ui.tsx` instead of each screen inventing its own style from scratch.
- Today now owns the common week-review path through its `Week` surface.
- The athlete Dashboard keeps the prep signal board and prep roadmap collapsed by default.
- Wide uppercase label tracking has been normalized to quieter `tracking-[0.06em]` values.
- Custom shadow utilities have been removed from `src/app` and `src/components`.
- Explicit gradient utilities have been removed from `src/app` and `src/components`.
- Guided athlete flow is now guarded away from `schedule`, `library`, and `compounds`.
- Mobile athlete mode now has fixed quick actions for logging today, adding food, and opening the week view.
- Mobile now uses a compact context bar instead of inheriting the full desktop top control grid.
- Athlete Training tucks adaptation, weekly load, and frequency review behind `Show review` by default.
- Coach-managed athletes no longer see locked builder dead-end cards for Food, Training, or Direction tools.
- Athlete exercise-selection CTAs now open inline Training exercise support instead of teaching the standalone Exercise browser as a destination.
- Athlete Food Log tucks the full meal diary behind `Show diary`, keeping the daily logging dashboard first.
- Training day cards keep move, duplicate, and delete actions behind `Edit day`.
- Today Week reserves `Full calendar` for coach mode; self-managed athletes now get `Training map`.
- Settings now explains Coach, Guided athlete, and Self-managed athlete ownership directly in the Workspace section.
- Athlete attempts to open `Library` or `Schedule` now resolve into Training exercise support or Today Week.
- Athlete Training shows a compact lift order first, with the full order behind `Show full order`.
- Athlete Food Diary collapses logged food rows per meal behind `Show foods`.
- Today Log opens the next active lift by default and keeps other set-entry panels behind `Open log`.

### Residual QA And Future Work

- The product still carries some layout density in long workflows, especially when users intentionally expand deep review states.
- Dashboard still contains more context than a daily user needs in one sitting, but the deepest review blocks now collapse by default for athletes.
- Schedule and Library still exist as route states by design, but athlete attempts are redirected to owning workflows before landing there.
- Mobile density needs hands-on QA because flatter styling and better disclosure still need to be validated with real logged-food days and real exercise lists.

## Evidence Snapshot

These are the most useful code-level signals behind this refresh:

- `App.tsx` still defines 8 internal route states through `AppTab`: `dashboard`, `nutrition`, `compounds`, `split`, `tracker`, `library`, `schedule`, `coach`.
- `App.tsx` still renders full `LibraryTab` and `ScheduleTab` routes, but they now read as `Exercise browser` and `Full calendar` fallback surfaces and are guarded away from common athlete flows.
- `SettingsPanel.tsx` no longer uses one long vertical stack; it now separates workspace controls, athlete setup, and advanced tooling.
- Across `src/app` and `src/components`, the current UI still contains:
  - 0 explicit gradient background utilities
  - 0 custom `shadow-[...]` utilities
  - 0 wide-tracked uppercase label utilities using `tracking-[0.18em]` or `tracking-[0.2em]`

Those numbers show the visual system has reached the intended calm baseline for this roadmap.

## Highest-Value Findings

### 1. Hidden route sprawl is now controlled

This was the most important structural issue left.

The app shell presents a simplified model: Dashboard, Today, Food, Training, and Coach. Underneath that, `library` and `schedule` still exist as full-screen tabs, but they are now framed as fallback tools. Athlete attempts to open them resolve into Today Week or Training exercise support, so the remaining route complexity is mostly coach/deep tooling.

#### Completion state

- The shell presents fewer destinations for everyday use.
- Coaches can still access deeper tools when needed.
- Athletes no longer hit the fallback routes through common app navigation.
- Self-managed athlete flows resolve back to Training, Today, or Food instead of Schedule/Library.
- The remaining risk is implementation complexity, not everyday user confusion.

#### Guardrail

Keep treating `library` and `schedule` as fallback tools, not equal sibling destinations:

- `Library` should stay secondary to the inline Training exercise-support panel.
- `Schedule` should stay secondary to Today's `Week` surface and remain mostly coach/deep editing.

If future usage testing shows the fallback routes are rarely needed, consider turning one or both into modal/subview states. That is optional future architecture, not an open roadmap blocker.

### 2. Settings split is now in place

The settings panel used to act as:

- a workspace mode switcher
- an athlete profile and planning setup form
- an advanced tooling control center

The latest pass split those jobs into `Workspace`, `Athlete setup`, and `Advanced tools`. That resolves the biggest settings IA issue.

#### Guardrail

- Keep setup controls visually quieter than everyday workspace controls.
- Keep advanced editor copy clear so users understand those switches are depth controls, not missing features.
- Validate mobile settings scan speed during device QA.

The split structure is complete and should be protected.

### 3. The visual system has reached the calm baseline

The app has improved surface reuse and now has a clean decoration baseline. The remaining issue is not gradients or custom shadows; it is how many legitimate cards can appear in one region when users intentionally expand deep tools.

The most obvious offenders are:

- `WorkspaceSidebar.tsx`
- theme picker cards in `SettingsPanel.tsx`
- hero and summary surfaces in `DashboardTab.tsx`
- base primitives in `src/components/ui`

#### Completion state

- Users no longer need to read through heavy decoration before they read meaning.
- Strong emphasis is more limited and more intentional.
- The product can still look busy when a screen contains many valid sections, even without decorative effects.

#### Guardrail

- Keep `Button`, `Badge`, `Input`, `Textarea`, `Tabs`, and `Switch` neutral by default.
- Keep the sidebar shell calm.
- Reserve strong emphasis for one card per viewport region, not every card in that region.

### 4. The dashboard now has the right layered model

The athlete dashboard is much better than before because it now opens with `TodaysPlanHero`. That said, the page still tries to do several jobs at once:

- answer "what do I do now?"
- explain the current coaching direction
- summarize check-ins
- expose the signal board when requested
- preserve the deeper prep roadmap when requested

All of those are valid, and the latest pass no longer gives them equal default prominence.

#### Completion state

- The hero solves the first question.
- The signal board, prep roadmap, recent check-ins, and deeper review content now use stronger progressive disclosure for athletes.
- Returning users can start from the action layer and open review content only when needed.

#### Guardrail

Treat the dashboard as three layers:

- Action now
- What changed
- Deep review

Anything beyond those three layers should stay collapsed by default or move to the owning tab.

### 5. Mobile is completion-oriented and ready for device QA

The presence of `mobileDockNav` was already a real improvement. The latest passes added a fixed athlete quick-action rail for the three highest-frequency tasks and replaced the dense top control grid with a compact mobile context bar.

#### Mobile friction points

- Fallback routes are now guarded for guided athletes.
- Nutrition is improved, but expanded meal food rows still need phone QA with real logged-food days.
- Training is improved, but expanded `Show full order`, `Open log`, and `Edit day` states still need phone QA with real exercise lists.
- Settings are better grouped, but still need mobile scan testing.
- Some sections still rely on stacked secondary buttons and high-information cards rather than fast action rows.

#### Guardrail

Future mobile work should protect completion speed, not layout parity:

- keep the dock
- reduce branch points
- keep the quick actions close to the dock
- collapse deep review content by default

### 6. Coach and athlete separation is now complete for this scope

Coach mode is more explicit than before, and Settings now explains the ownership rule directly. The remaining issue is no longer basic role confusion; it is making sure future feature additions keep those boundaries intact.

#### Completion state

- Self-managed athletes can intentionally access expanded planning controls, but those flows are now framed as deliberate self-managed tooling.
- Shared settings now explain ownership instead of presenting one undifferentiated control pile.
- The ownership rule is clear enough to guide future additions.

#### Guardrail

Keep applying the ownership rule aggressively:

- Athlete mode: execute, review, acknowledge, light edit
- Coach mode: diagnose, plan, publish, manage

If a screen exists mainly to design or restructure the plan, it should either be coach-owned or explicitly marked as self-managed athlete tooling.

### 7. Base primitives are quieter and should stay guarded

Some of the visual noise was inherited from the component library itself. The primitive pass reduced that tax materially, so future work should protect the calmer baseline instead of reintroducing one-off decoration.

#### Guardrail

Keep primitives flat by default, and only add stronger treatment when the component is carrying the one primary action in a local region.

### 8. Typography overline noise is resolved for this scope

Wide uppercase label tracking has been normalized for this roadmap. Standard overlines now use quieter tracking, and the remaining rule is to avoid reintroducing ornamental labels as new cards are added.

#### Completion state

- Scan fatigue from decorative overlines is materially reduced.
- Label voice is calmer and less mechanical.
- The hierarchy between label, title, and detail is easier to maintain.

#### Guardrail

Keep small overlines only where they truly orient the user. Standard labels should stay at `tracking-[0.06em]` or use regular sentence-case captions.

## Workflow Audit

### Athlete daily flow

The athlete opening experience is now solid. `TodaysPlanHero` gives the user a real answer, and route guards keep athletes inside Dashboard, Today, Food, and Training for almost all daily work. The remaining daily-flow risk is expanded-state density, not destination confusion.

### Coach review flow

Coach mode is clearer and more operational than before. The remaining UX issue is not lack of tooling. It is signal overload. Coaches still have to visually parse many "important" cards before landing on the single best action.

### Training and builder flow

The shell says "Training", and athlete exercise support now resolves into that surface. The full Library route still exists as coach/deep tooling; future usage testing can decide whether it should become a modal or subview.

### Settings and setup flow

Settings now separates profile setup, planning defaults, and advanced editor control into clearer layers. The Workspace section also explains who owns the plan and how much control is enabled.

### Mobile execution flow

The base shell and quick-action path are in place. The next gain comes from testing real phone scan speed through expanded meal food rows, expanded lift order, open lift logs, and expanded `Edit day` controls, not from inventing a different mobile navigation system.

## Completion Check

The roadmap items are complete against the audit's highest-value criteria:

- Users can describe the app in 4-5 everyday destinations without needing to mention hidden tabs.
- Athletes can stay inside Dashboard, Today, Food, and Training for almost all daily work.
- Schedule and Library feel like deeper capabilities attached to Today and Training, not extra athlete places.
- Settings answer "where am I?" and "what level of control is enabled?" from the Workspace section.
- Gradient and custom shadow usage remain at zero in `src/app` and `src/components`.
- Mobile users can complete common tasks without being pushed into desktop-style review screens.

## Residual Risks

These are not open roadmap implementation tasks, but they should guide future QA and product planning:

- Real-device QA could reveal thumb-reach or density issues in intentionally expanded states.
- Future feature additions could accidentally re-teach `library`, `schedule`, or planning-heavy tools as everyday athlete destinations.
- Coach views can still become signal-heavy because coaches legitimately need more review context.
- The internal route model remains larger than the user-facing model, so route guards should be treated as product-critical behavior.

## Final Assessment

This is now a promising product with a completed simplification pass. The roadmap is complete for the current scope, and the audit findings have been rectified in the app and in this report.

The product now has:

- fewer true destinations
- calmer surfaces
- stricter progressive disclosure
- clearer role ownership

The next work is not another broad cleanup pass. It is validation, protection, and careful feature growth.
