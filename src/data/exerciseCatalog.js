// ─────────────────────────────────────────────────────────────────────────
// Exercise name catalog, organized by muscle group. Powers the "Exercise
// name" autocomplete suggestions when logging a workout. Same key set as
// the Workout Videos feature (data/workoutVideos.js) for consistency.
// ─────────────────────────────────────────────────────────────────────────

export const MUSCLE_GROUPS = [
  { key: 'chest',     label: 'Chest',     icon: '🏋️' },
  { key: 'back',      label: 'Back',      icon: '🎯' },
  { key: 'shoulders', label: 'Shoulders', icon: '🔺' },
  { key: 'biceps',    label: 'Biceps',    icon: '💪' },
  { key: 'triceps',   label: 'Triceps',   icon: '🦾' },
  { key: 'legs',      label: 'Legs',      icon: '🦵' },
  { key: 'core',      label: 'Core',      icon: '🔥' },
]

export const EXERCISE_CATALOG = {
  chest: [
    'Barbell Bench Press', 'Incline Barbell Press', 'Decline Bench Press',
    'Incline Dumbbell Press', 'Flat Dumbbell Press', 'Dumbbell Fly',
    'Cable Crossover', 'Cable Chest Fly', 'Pec Deck Machine', 'Push-ups',
    'Diamond Push-ups', 'Chest Dips', 'Machine Chest Press', 'Landmine Press',
  ],
  back: [
    'Pull-ups', 'Chin-ups', 'Lat Pulldown', 'Bent-over Barbell Row',
    'Seated Cable Row', 'T-Bar Row', 'Single-arm Dumbbell Row', 'Deadlift',
    'Rack Pulls', 'Face Pulls', 'Straight-arm Pulldown', 'Meadows Row',
    'Inverted Row', 'Hyperextensions',
  ],
  shoulders: [
    'Overhead Barbell Press', 'Seated Dumbbell Press', 'Arnold Press',
    'Lateral Raises', 'Front Raises', 'Rear Delt Fly', 'Cable Lateral Raise',
    'Face Pulls', 'Upright Row', 'Shrugs', 'Machine Shoulder Press',
    'Landmine Press', 'Cuban Press', 'Push Press',
  ],
  biceps: [
    'Barbell Curl', 'EZ-Bar Curl', 'Dumbbell Curl', 'Hammer Curl',
    'Incline Dumbbell Curl', 'Concentration Curl', 'Preacher Curl',
    'Cable Curl', 'Cross-body Hammer Curl', 'Spider Curl', 'Zottman Curl',
    'Drag Curl', '21s',
  ],
  triceps: [
    'Close-grip Bench Press', 'Rope Pushdown', 'Overhead Dumbbell Extension',
    'Skull Crushers', 'Dips', 'Bench Dips', 'Kickbacks',
    'Single-arm Cable Pushdown', 'Diamond Push-ups', 'Overhead Cable Extension',
    'JM Press', 'French Press', 'Tricep Push-down (bar)',
  ],
  legs: [
    'Barbell Back Squat', 'Front Squat', 'Romanian Deadlift', 'Leg Press',
    'Walking Lunges', 'Bulgarian Split Squat', 'Leg Extension', 'Leg Curl',
    'Hip Thrust', 'Calf Raises', 'Goblet Squat', 'Step-ups', 'Hack Squat',
    'Sumo Deadlift', 'Seated Calf Raise', 'Glute Bridge',
  ],
  core: [
    'Hanging Leg Raise', 'Plank', 'Russian Twists', 'Cable Woodchopper',
    'Ab Wheel Rollout', 'Bicycle Crunches', 'Sit-ups', 'Mountain Climbers',
    'Side Plank', 'Toe Touches', 'Flutter Kicks', 'V-Ups', 'Cable Crunch',
    'Dead Bug',
  ],
}
