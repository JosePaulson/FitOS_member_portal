import { Navigate } from 'react-router-dom'
import { useMemberAuth } from '../context/MemberAuthContext'
import Spinner from './ui/Spinner'

export default function PublicRoute({ children }) {
	const { member, loading } = useMemberAuth()
	if (loading) return <div className="flex items-center justify-center min-h-screen"><Spinner /></div>
	if (member) return <Navigate to="/" replace />
	return children
}