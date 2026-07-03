import { Navigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import Spinner from './ui/Spinner'

export default function PrivateRoute({ children }) {
  const { member, loading } = useMemberAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'var(--color-surface)' }}>
        <Spinner />
      </div>
    )
  }
  if (!member) return <Navigate to="/login" replace />
  return children
}
