import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const AuthContext = createContext(null)

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const navigate = useNavigate()

    /**
     * Helper: make an authenticated API call
     */
    const authFetch = useCallback(async (endpoint, options = {}) => {
        const token = localStorage.getItem('access_token')
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        })

        // If 401, try to refresh the token once
        if (response.status === 401) {
            const refreshed = await refreshToken()
            if (refreshed) {
                // Retry the original request with the new token
                const newToken = localStorage.getItem('access_token')
                headers.Authorization = `Bearer ${newToken}`
                const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                    ...options,
                    headers,
                })
                return retryResponse
            }
        }

        return response
    }, [])

    /**
     * Attempt to refresh the access token using the refresh token
     */
    const refreshToken = useCallback(async () => {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) return false

        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refresh }),
            })

            if (!res.ok) {
                clearSession()
                return false
            }

            const data = await res.json()
            if (data.session) {
                localStorage.setItem('access_token', data.session.access_token)
                localStorage.setItem('refresh_token', data.session.refresh_token)
                return true
            }

            clearSession()
            return false
        } catch {
            clearSession()
            return false
        }
    }, [])

    /**
     * Clear tokens and auth state
     */
    const clearSession = useCallback(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        setIsAuthenticated(false)
    }, [])

    /**
     * Restore session on app startup
     */
    const restoreSession = useCallback(async () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (res.ok) {
                const data = await res.json()
                setUser(data.user)
                setIsAuthenticated(true)
            } else if (res.status === 401) {
                // Token expired, try refresh
                const refreshed = await refreshToken()
                if (refreshed) {
                    const newToken = localStorage.getItem('access_token')
                    const retryRes = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${newToken}` },
                    })
                    if (retryRes.ok) {
                        const data = await retryRes.json()
                        setUser(data.user)
                        setIsAuthenticated(true)
                    } else {
                        clearSession()
                    }
                } else {
                    clearSession()
                }
            } else {
                clearSession()
            }
        } catch {
            clearSession()
        } finally {
            setLoading(false)
        }
    }, [refreshToken, clearSession])

    useEffect(() => {
        restoreSession()
    }, [restoreSession])

    /**
     * Login: called after successful API login
     */
    const login = useCallback((userData, session) => {
        if (session) {
            localStorage.setItem('access_token', session.access_token)
            localStorage.setItem('refresh_token', session.refresh_token)
        }
        setUser(userData)
        setIsAuthenticated(true)
    }, [])

    /**
     * Logout: clear session and redirect
     */
    const logout = useCallback(async () => {
        try {
            const token = localStorage.getItem('access_token')
            if (token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })
            }
        } catch {
            // Ignore logout API errors
        } finally {
            clearSession()
            navigate('/login')
        }
    }, [clearSession, navigate])

    /**
     * Get the correct dashboard path for the current user's role
     */
    const getDashboardPath = useCallback((role) => {
        const roleToPath = {
            donor: '/donor-dashboard',
            ngo: '/ngo-dashboard',
            admin: '/admin-dashboard',
            volunteer: '/ngo-dashboard',
        }
        return roleToPath[role] || '/login'
    }, [])

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        clearSession,
        refreshToken,
        authFetch,
        getDashboardPath,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
