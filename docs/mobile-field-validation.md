# Mobile and real-use validation checklist

Status: **not yet verified on physical phones or with field participants**. This is a test plan, not a record of successful tests. Automated tests and server-rendered checks do not establish real-phone usability, offline reliability, nutrition accuracy, or user preference.

## Physical-phone checks

Record phone model, OS/browser versions, app build/commit, network state, date, tester, and result for each run. Include one current iPhone/Safari and one Android/Chrome; repeat the core flows as an installed home-screen app where supported.

- **Navigation and reachability:** move through Home, Lift, Food, Split, and More at normal and enlarged text sizes. Confirm no clipped labels, horizontal page overflow, keyboard-covered actions, or overlap between navigation and the workout action bar. Check portrait and landscape. Scroll position should restore correctly after navigation.
- **Workout logging:** start a real or clearly labeled test session; enter weight/reps/RIR, confirm, undo, pause, background the app, return, and reload. Verify the same session, values, elapsed time, and frozen targets remain. Confirm a paused older-week session is resumed rather than recreated under the selected week.
- **Interruptions and scheduling:** move an unfinished workout to another date; navigate away and back, then resume it. Verify the date changes without completing/skipping it, altering another week's plan, or losing work. Verify the immediate Undo action survives the original card disappearing.
- **Food and recipes:** search a food, verify its portion basis, and log it to an explicitly selected date. Build a two-ingredient recipe without logging first; test a serving-based yield and a weighed cooked-gram yield. Log a portion, edit the recipe, and confirm the historical log is unchanged. Test blank, zero, negative, and fractional amounts. Check recipe-delete Undo and batch-log Undo.
- **Recovery and suggestions:** record a pain flag and verify a conflicting load increase is blocked. Edit or keep an existing readiness check-in; verify skipping an edit cannot erase saved feedback. Inspect why a recommendation was made and whether the displayed inputs match the recorded data.
- **Storage, offline, and restore:** after a confirmed save, enable airplane mode, edit a test entry, reload, and return online. Test each supported persistence path separately; do not imply cloud sync from a local save. Open a second tab/device where supported and verify conflict handling. Export, preview, restore, and undo a test backup without overwriting unrelated real data.
- **Accessibility:** test VoiceOver/TalkBack labels, focus order, errors, dialogs, date controls, and set-completion announcements. Confirm primary touch targets are at least 44 px, numeric fields stay legible, and status is understandable without color alone.

## Real-life preference checks

Use consenting participants who already log lifting and food, including both new and experienced lifters. Use test data or their own data with permission. Do not collect account credentials or unnecessary health details. Compare against each participant's actual current app; counterbalance task order to reduce learning effects.

Give the same tasks: resume a workout, log three sets, change one exercise, move a missed workout, add a repeat meal, build a recipe, and explain the next suggested change. Record task completion, elapsed time, taps, errors, requests for help, confidence that data was saved, and whether the suggestion was understandable. Ask which app they would choose for tomorrow's workout and meal logging, and why.

For habit strength, ask participants to use the app across several ordinary training days and report missed logs, abandoned flows, repeated corrections, and whether they returned without a reminder. Distinguish stated preference from observed return use. Report the participant count, limitations, failures, and unresolved issues alongside any improvement claims; do not claim preference or retention gains without observed evidence.

## Release evidence

For each failed check, retain a reproducible sequence and redacted screenshot or recording where permitted. Mark checks **pass**, **fail**, or **not run**—never treat an untested item as a pass. Treat lost logs, wrong-date entries, incorrect portion scaling, silent restore loss, and blocked essential controls as release blockers until corrected and retested. Publish only the device/task coverage actually completed.
