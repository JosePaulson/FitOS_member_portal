import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import { isMemberActive } from '../lib/membership'
import { loadVideoDraft, clearVideoDraft, submitVideoDraft, draftCategoryNames } from '../lib/videoWorkoutDraft'
import WorkoutLogPrompt from './WorkoutLogPrompt'

/**
 * App-open check for a Workout Videos session that never got logged (app
 * closed, phone died, crash …). Its exercises were saved on this device as
 * they were completed — no network needed to find them — and the member
 * chooses to continue it, log it, or discard it. Mounted once in Layout, so it
 * runs once per app open, not on every page change.
 */
export default function PendingWorkoutPrompt() {
  const { member } = useMemberAuth()
  const navigate = useNavigate()
  const memberId = member?.id ?? member?._id // login returns `id`, /me returns `_id`
  const [draft, setDraft] = useState(null)

  useEffect(() => { setDraft(loadVideoDraft(memberId)) }, [memberId])

  if (!draft) return null

  return (
    <WorkoutLogPrompt
      mode="resume"
      exerciseCount={draft.exercises.length}
      categories={draftCategoryNames(draft)}
      startedAt={draft.startedAt}
      allowContinue={isMemberActive(member)}
      onLog={(bodyWeight) => submitVideoDraft(memberId, draft, bodyWeight)}
      onLogged={() => setDraft(null)}
      onContinue={() => { setDraft(null); navigate('/workouts', { state: { tab: 3 } }) }}
      onDiscard={() => { clearVideoDraft(memberId); setDraft(null) }}
    />
  )
}
