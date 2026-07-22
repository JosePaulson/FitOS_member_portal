// ─────────────────────────────────────────────────────────────────────────
// Mock data for the Workout Videos feature. This is UI-only for now — once
// the backend catalog exists (mirroring the admin WorkoutLibrary model),
// swap MUSCLE_GROUPS/WORKOUT_VIDEOS for an API call keyed by muscle group.
//
// Video URLs are stable public sample clips used as visual placeholders —
// swap in real exercise demo footage once uploads are wired up.
// ─────────────────────────────────────────────────────────────────────────

const SAMPLE_CLIPS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
]

export const MUSCLE_GROUPS = [
  { key: 'chest',     label: 'Chest',     icon: '🏋️' },
  { key: 'back',      label: 'Back',      icon: '🎯' },
  { key: 'shoulders', label: 'Shoulders', icon: '🔺' },
  { key: 'biceps',    label: 'Biceps',    icon: '💪' },
  { key: 'triceps',   label: 'Triceps',   icon: '🦾' },
  { key: 'legs',      label: 'Legs',      icon: '🦵' },
  { key: 'core',      label: 'Core',      icon: '🔥' },
]

function build(group, items) {
  return items.map((item, i) => ({
    id: `${group}-${i + 1}`,
    muscleGroup: group,
    videoUrl: SAMPLE_CLIPS[(i + MUSCLE_GROUPS.findIndex((g) => g.key === group)) % SAMPLE_CLIPS.length],
    ...item,
  }))
}

export const WORKOUT_VIDEOS = {
  chest: build('chest', [
    { name: 'Barbell Bench Press', sets: '4 sets', reps: '8–10 reps', cue: 'Keep shoulder blades pinned back, lower the bar to mid-chest with control.' },
    { name: 'Incline Dumbbell Press', sets: '3 sets', reps: '10–12 reps', cue: 'Set the bench to 30°, drive dumbbells up and slightly inward.' },
    { name: 'Cable Chest Fly', sets: '3 sets', reps: '12–15 reps', cue: 'Slight bend in the elbows, squeeze at the centre for a full second.' },
    { name: 'Push-ups', sets: '3 sets', reps: 'To failure', cue: 'Body in a straight line, elbows at ~45° from the torso.' },
  ]),
  back: build('back', [
    { name: 'Pull-ups', sets: '4 sets', reps: '6–10 reps', cue: 'Full dead hang at the bottom, chin clears the bar at the top.' },
    { name: 'Bent-over Barbell Row', sets: '4 sets', reps: '8–10 reps', cue: 'Hinge at the hips, pull the bar toward your lower ribs.' },
    { name: 'Lat Pulldown', sets: '3 sets', reps: '10–12 reps', cue: 'Lead with the elbows, avoid leaning back excessively.' },
    { name: 'Seated Cable Row', sets: '3 sets', reps: '10–12 reps', cue: 'Keep the spine tall, squeeze shoulder blades together at the end.' },
  ]),
  shoulders: build('shoulders', [
    { name: 'Overhead Barbell Press', sets: '4 sets', reps: '6–8 reps', cue: 'Brace your core, press straight overhead without arching the back.' },
    { name: 'Lateral Raises', sets: '3 sets', reps: '12–15 reps', cue: 'Lead with the elbows, raise to shoulder height, control the descent.' },
    { name: 'Face Pulls', sets: '3 sets', reps: '15 reps', cue: 'Pull to eye level, rotate hands so thumbs point back.' },
    { name: 'Rear Delt Fly', sets: '3 sets', reps: '12–15 reps', cue: 'Hinge forward, keep a slight bend in the elbows throughout.' },
  ]),
  biceps: build('biceps', [
    { name: 'Barbell Curl', sets: '3 sets', reps: '8–10 reps', cue: 'Elbows pinned to your sides, no swinging.' },
    { name: 'Dumbbell Hammer Curl', sets: '3 sets', reps: '10–12 reps', cue: 'Neutral grip throughout, control the negative.' },
    { name: 'Incline Dumbbell Curl', sets: '3 sets', reps: '10–12 reps', cue: 'Let arms hang fully at the bottom for a deep stretch.' },
    { name: 'Concentration Curl', sets: '3 sets', reps: '12 reps', cue: 'Brace elbow against the inner thigh, curl slowly.' },
  ]),
  triceps: build('triceps', [
    { name: 'Close-grip Bench Press', sets: '4 sets', reps: '8–10 reps', cue: 'Hands shoulder-width apart, elbows tucked close to the body.' },
    { name: 'Rope Pushdown', sets: '3 sets', reps: '12–15 reps', cue: 'Elbows fixed at your sides, spread the rope apart at the bottom.' },
    { name: 'Overhead Dumbbell Extension', sets: '3 sets', reps: '10–12 reps', cue: 'Elbows pointed forward, lower the weight behind your head.' },
    { name: 'Bench Dips', sets: '3 sets', reps: '12–15 reps', cue: 'Keep hips close to the bench, lower until elbows hit ~90°.' },
  ]),
  legs: build('legs', [
    { name: 'Barbell Back Squat', sets: '4 sets', reps: '6–8 reps', cue: 'Brace your core, knees track over toes, hips below parallel.' },
    { name: 'Romanian Deadlift', sets: '4 sets', reps: '8–10 reps', cue: 'Soft knees, hinge at the hips, bar stays close to the legs.' },
    { name: 'Walking Lunges', sets: '3 sets', reps: '12 reps/leg', cue: 'Front knee stays over the ankle, torso upright.' },
    { name: 'Leg Press', sets: '3 sets', reps: '10–12 reps', cue: 'Feet shoulder-width, don\u2019t let knees cave inward.' },
  ]),
  core: build('core', [
    { name: 'Hanging Leg Raise', sets: '3 sets', reps: '12–15 reps', cue: 'Avoid swinging, curl the pelvis at the top.' },
    { name: 'Cable Woodchopper', sets: '3 sets', reps: '12 reps/side', cue: 'Rotate through the torso, keep arms relatively straight.' },
    { name: 'Plank', sets: '3 sets', reps: '45–60 sec', cue: 'Straight line from head to heels, squeeze the glutes.' },
    { name: 'Russian Twists', sets: '3 sets', reps: '20 reps', cue: 'Feet off the floor for added difficulty, rotate fully each side.' },
  ]),
}

export const REST_SECONDS = 45
