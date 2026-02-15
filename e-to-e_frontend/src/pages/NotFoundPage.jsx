import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFoundPage() {
    const { isAuthenticated, user, getDashboardPath } = useAuth()

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: '#0a0a0a',
                color: '#f5f5f5',
                fontFamily: 'Inter, system-ui, sans-serif',
                textAlign: 'center',
                padding: '2rem',
            }}
        >
            <h1
                style={{
                    fontSize: 'clamp(4rem, 10vw, 8rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    margin: 0,
                    lineHeight: 1,
                    color: '#555',
                }}
            >
                404
            </h1>
            <p
                style={{
                    fontSize: '1.1rem',
                    color: '#888',
                    margin: '1rem 0 2rem',
                    maxWidth: 420,
                    lineHeight: 1.6,
                }}
            >
                The page you're looking for doesn't exist or has been moved.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    to="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: '#1a1a1a',
                        color: '#f5f5f5',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                    }}
                >
                    ← Back to Home
                </Link>
                {isAuthenticated && user && (
                    <Link
                        to={getDashboardPath(user.role)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#f5f5f5',
                            color: '#0a0a0a',
                            border: '1px solid #f5f5f5',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        Go to Dashboard →
                    </Link>
                )}
            </div>
        </div>
    )
}
