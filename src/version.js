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
export const APP_VERSION = '2.4.1'

export const APP_CHANGELOG = [
  {
    version: '2.4.1',
    type: 'improvement',
    notes: [
      'Workout videos: the category name shown when you swipe into a new category is now larger and bolder, and fades out more slowly',
    ],
  },
  {
    version: '2.4.0',
    type: 'feature',
    notes: [
      'Workout videos: swipe left or right over the video to jump to the next or previous exercise',
      'Swiping past the last (or first) exercise of a category moves on to the next (or previous) category, and its name appears briefly above the play button',
    ],
  },
  {
    version: '2.3.2',
    type: 'improvement',
    notes: [
      'Workout videos: the exercise name, timer and PR / Done pills are now a little smaller, and the workout-list and ⚠ icons match the PR pill’s size, with a larger invisible tap area so they are easy to hit',
    ],
  },
  {
    version: '2.3.1',
    type: 'improvement',
    notes: [
      'Workout videos: while a video plays, the exercise name, timer, PR and icons now dim to 60% after 3 seconds instead of hiding — they return to normal when you pause or touch the screen',
      'The video timer is back next to the exercise name, and the workout-list and ⚠ icons now sit together at the right end of the PR row',
    ],
  },
  {
    version: '2.3.0',
    type: 'feature',
    notes: [
      'Workout videos: tap the orange ⚠ icon next to an exercise to read its notes and warnings — they no longer sit under the video',
      'Workout videos: tap the new checklist icon (bottom-right of the video) to see every workout in the category with what you have completed — tap any workout to play it right away',
      'While a video plays, the exercise name hides after 3 seconds so it never covers your form, leaving just your PR, the video timer and the ⚠ icon at the bottom — touch the screen or pause to bring everything back',
      'The category pills now always stay fully visible, and the name and PR sit closer together',
      'The app now makes far fewer background requests, so it is lighter on your data and battery and stays fast at busy times',
    ],
  },
  {
    version: '2.2.0',
    type: 'feature',
    notes: [
      'Workout videos: while a video plays, the exercise name, personal record and notes fade out after 3 seconds (and the category chips dim), so nothing covers your form — touch the screen, or pause, to bring them back',
      'Rest timer: a loud beep sounds in the last 4 seconds of every rest, even if the app is in the background, your screen is locked or you switched to another app (turn your media volume up)',
      'The rest countdown now stays accurate while the app is in the background, and catches up the moment you come back',
    ],
  },
  {
    version: '2.1.0',
    type: 'feature',
    notes: [
      'Workout videos: closing the player after logging exercises now asks whether to log your workout or continue — with an optional body-weight field',
      'Exercises are logged only when you choose “Log workout”, and skipped exercises are never logged',
      'One workout log per day: if you already have a log for the day, new exercises are added to it, and the workout is named after what you trained (for example “Chest/Shoulders”)',
      'Unfinished video workouts are kept on your device — even with no internet — and when you next open the app you can continue, log or discard them',
      'See your personal record (best weight, or best reps if you never logged a weight) under each video and when logging reps, sets and weight',
      'Simpler flow: no pop-ups when you finish a category — switch categories any time from the chips at the top',
    ],
  },
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
