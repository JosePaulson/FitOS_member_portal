// Bump APP_VERSION and add an entry to the TOP of APP_CHANGELOG with every
// shipped update, so the version shown on the Profile page's About section
// identifies exactly which build a member is running — useful for confirming
// someone has picked up a fix.
//
// Format: MAJOR.MINOR.PATCH
//   - Major updates / big overhauls                  → bump MAJOR (first number), reset the others to 0
//   - New features / noticeable changes              → bump MINOR (middle number), reset PATCH to 0
//   - Bug fixes / small tweaks / copy changes        → bump PATCH (last number)
//
// Changelog entries: newest first; `type` is 'feature' | 'improvement' | 'fix'.
export const APP_VERSION = '2.0.3'

export const APP_CHANGELOG = [
  {
    version: '2.0.3',
    type: 'fix',
    notes: [
      'Date and time fields in pop-ups and forms (workout log, meal log, progress, transformation) now show dd/mm/yyyy',
    ],
  },
  {
    version: '2.0.2',
    type: 'improvement',
    notes: [
      'Your trainer is now notified straight away when you request or cancel a PT session',
    ],
  },
  {
    version: '2.0.1',
    type: 'feature',
    notes: [
      'Share your workout log and meal log with your gym — choose which trainers can see them (owner and managers can see anything you share)',
      'Dates now appear as dd/mm/yyyy everywhere',
      'Log reps, sets and weight after each workout video; they are saved to your workout log automatically (skipped exercises are not logged)',
      'Log your weight at the end of a video session',
      'Check-ins, streaks and challenges count a day once if you attended, had a PT session or logged a workout',
      'Floating Videos shortcut on the home screen',
      'Clearer pop-ups instead of browser alerts, and a new notification bell',
    ],
  },
]
