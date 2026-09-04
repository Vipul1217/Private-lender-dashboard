import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from './Common'

export default function ProtectedRoute({ children }) {
  const { officer, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Spinner />
      </div>
    )
  }

  if (!officer) {
    return <Navigate to="/login" replace />
  }

  return children
}
