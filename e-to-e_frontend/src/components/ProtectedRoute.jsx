import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute — wraps dashboard pages to enforce authentication + role checks.
 *
 * Props:
 *   allowedRoles  – array of roles that can access this route (e.g. ['donor'])
 *   children      – the page component to render if authorised
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
    const { user, isAuthenticated, loading, getDashboardPath } = useAuth()

    /* Still checking session — show a minimal loading state */
    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: '#0a0a0a',
                    color: '#999',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '0.875rem',
                    letterSpacing: '0.04em',
                }}
            >
                Verifying session…
            </div>
        )
    }

    /* Not logged in → send to login page */
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />
    }

    /* Logged in but wrong role → redirect to the correct dashboard */
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to={getDashboardPath(user.role)} replace />
    }

    /* All checks passed → render the page */
    return children
}
