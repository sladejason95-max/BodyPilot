# Visual Simplification Guide

## Purpose

Make Stage Prep Guide feel calmer, faster, and easier to scan without making it feel generic or cheap.

This guide is intentionally practical. It is based on the current codebase. The latest simplification pass reduced the styling load to a calm baseline:

- 0 explicit gradient background utilities across `src/app` and `src/components`
- 0 custom `shadow-[...]` utilities across `src/app` and `src/components`
- 0 remaining wide-tracked uppercase labels using `tracking-[0.18em]` or `tracking-[0.2em]`

The product now has the completed simplification baseline. Future work should protect that baseline while testing and refining density in the longest workflows.

## Latest Pass

- Standard overline tracking has been normalized to `tracking-[0.06em]`.
- Dashboard review and prep-roadmap tones now use semantic tonal surfaces instead of custom gradients.
- The athlete Dashboard keeps the prep signal board and prep roadmap collapsed by default.
- `ScheduleTab` is now framed as `Full calendar`, a deeper editor rather than the normal weekly operating surface.
- `LibraryTab` is now framed as `Exercise browser`, a fallback reference rather than the normal Training path.
- Shared helper surfaces, app command cards, Nutrition summary, Food Library review tray, Progress, Slider, and Card primitives now use flat/semantic styling.
- Theme shell, Nutrition fuel blocks, command cards, and the mobile/desktop context bars now avoid explicit gradient background utilities.
- Settings now includes an ownership frame for Coach, Guided athlete, and Self-managed athlete modes.
- Athlete routes now resolve to owning workflows instead of hidden standalone Schedule or Library destinations.
- Athlete Training, Food Diary, Today Log, and day-card editing now use deliberate reveal controls instead of opening dense editors by default.

## Core Principle

One area of emphasis per region.

If a screen section already has a hero, the supporting cards in that same section should become quiet. If a sidebar is already visually framed, its items should not also feel like mini hero cards.

## Design Rules

### 1. Treat gradients as an exception, not a default

Good use:

- background aura
- one true hero
- one active workspace state if needed

Bad use:

- every card
- every nav item
- every button variant
- every input surface

### 2. Prefer tonal surfaces before decorative surfaces

The default decision tree should be:

1. white surface
2. tonal semantic surface
3. strong emphasis surface
4. custom gradient only if the screen truly needs a documented focal point

### 3. Reserve strong shadows for emphasis, not normal structure

Most cards should use `shadow-sm` or a light token equivalent. Heavy custom shadows should be rare and should mostly belong to:

- a hero card
- a floating mobile dock
- a modal or elevated tray

### 4. Standard labels should be quiet

Use small labels to orient, not decorate.

- Default label tracking target: `0.06em`
- Avoid `0.18em` and `0.2em` in standard cards
- Sentence case is usually better than repeated uppercase micro-labels

### 5. Semantic color should do the meaning work

Color roles:

- Sky: information, movement, action
- Emerald: on-track, complete, healthy
- Amber: attention, friction, caution
- Rose: off-track, risk, correction
- Slate: neutral structure, secondary context

Use those tones with soft backgrounds first. Save saturated fills for the truly primary state.

## Surface Vocabulary

Use a small, repeatable set of surface types.

### Default surface

Use for most cards and sections.

```tsx
border-slate-200/70 bg-white shadow-sm
```

### Tonal surface

Use for status, semantic grouping, or supportive summaries.

```tsx
border-sky-200 bg-sky-50 shadow-sm
border-emerald-200 bg-emerald-50 shadow-sm
border-amber-200 bg-amber-50 shadow-sm
border-rose-200 bg-rose-50 shadow-sm
```

### Emphasis surface

Use rarely for a hero or currently active destination.

```tsx
bg-slate-950 text-white shadow-lg
```

### Interactive neutral surface

Use for standard buttons, nav triggers, and selectable cards.

```tsx
border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300
```

## Keep / Remove / Replace

| Pattern | Keep | Remove | Replace with |
|--------|------|--------|--------------|
| Page background aura | Yes | No | Keep as a soft screen-level effect |
| Gradient on every card | No | Yes | Default or tonal surfaces |
| Multiple custom shadows on one component | No | Yes | One shared elevation token |
| Glassy inputs and textareas | No | Yes | Clean solid surfaces |
| Loud active nav plus loud sidebar shell | No | Yes | Calm shell, one clear active state |
| Semantic status cards | Yes | No | Tonal semantic backgrounds with light borders |
| Strong hero card | Yes | No | One emphasis card per major region |
| Uppercase overlines everywhere | No | Yes | Quiet labels with low tracking |

## Component-Specific Guidance

### Workspace sidebar

Risk to avoid:

- The outer rail, group containers, and item cards all have strong styling.

Target:

- Make the rail mostly neutral.
- Keep one clear active item state.
- Remove hero treatment from non-active entries.

### Dashboard hero and support cards

Risk to avoid:

- The hero is valid, but nearby support cards still compete visually.

Target:

- Keep one hero.
- Make internal summary cards plain.
- Let meaning come from layout, not layered styling.

### Settings panel

Risk to avoid:

- Theme cards and settings rows still feel visually heavier than the job they do.

Target:

- Use simpler comparison cards for theme selection.
- Keep setting rows quiet and consistent.
- Let grouping and copy provide structure.

### Buttons

Risk to avoid:

- Primary, secondary, ghost, and outline styles all carry too much custom styling.

Target:

- One strong primary button
- one calm secondary/outline family
- lighter hover states
- no glass effect on standard actions

### Inputs and textareas

Risk to avoid:

- Inputs still look premium-object styled instead of utility-first.

Target:

- Solid surfaces
- light inset or no inset
- clean focus ring
- no gradient background

### Badges and pills

Risk to avoid:

- Badges are often too ornamental for metadata.

Target:

- Keep badges flat and semantic.
- Reserve pill emphasis for truly important state only.

## Maintenance Order

If visual debt returns, start where styling multiplies the fastest.

1. `src/components/ui/button.tsx`
2. `src/components/ui/badge.tsx`
3. `src/components/ui/input.tsx`
4. `src/components/ui/textarea.tsx`
5. `src/components/ui/tabs.tsx`
6. `src/components/ui/switch.tsx`
7. `src/app/workspace_ui.tsx`
8. `src/app/WorkspaceSidebar.tsx`
9. `src/app/tabs/DashboardTab.tsx`
10. remaining tab surfaces

This order matters because primitive noise leaks into multiple screens faster than tab-specific styling.

## Practical Do / Do Not Rules

### Do

- use semantic background tones for status
- let spacing create hierarchy
- keep one focal point per viewport region
- reuse shared surface classes
- simplify inactive states first

### Do not

- stack gradient, glow, inset highlight, and hover lift on the same component
- create a new custom shadow for a one-off case if a shared token already works
- use a wide-tracked uppercase label in every card header
- make secondary buttons feel as visually expensive as primary actions

## Standing Visual Targets

These thresholds have now been met; keep them as guardrails for future work:

- keep explicit gradient background utility usage at zero unless a future exception is documented
- keep custom `shadow-[...]` usage at zero unless a new case has a specific design reason
- keep standard overlines at `tracking-[0.06em]`; only reintroduce wider tracking with a specific design reason
- keep no more than one strongly emphasized card in a local section

## Visual Definition Of Done

A screen is simplified enough when:

- the first thing to do is obvious
- secondary cards feel supportive, not competitive
- the sidebar frames navigation without dominating the page
- status color reads clearly without needing decorative effects
- the app still feels intentional, but no longer feels over-produced

The right end state is not flat and boring. It is controlled.
