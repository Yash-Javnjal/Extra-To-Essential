const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Generic fetch wrapper with auth token injection
 */
async function apiFetch(endpoint, options = {}) {
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

    const data = await response.json()

    if (!response.ok) {
        throw { status: response.status, ...data }
    }

    return data
}

/* ─── Auth Endpoints ─── */

export async function registerUser({ full_name, email, password, phone, role, organization_name }) {
    const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password, phone, role, organization_name }),
    })

    // Store tokens
    if (data.session) {
        localStorage.setItem('access_token', data.session.access_token)
        localStorage.setItem('refresh_token', data.session.refresh_token)
    }

    return data
}

export async function loginUser({ email, password }) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    })

    // Store tokens
    if (data.session) {
        localStorage.setItem('access_token', data.session.access_token)
        localStorage.setItem('refresh_token', data.session.refresh_token)
    }

    return data
}

export async function logoutUser() {
    try {
        await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }
}

export async function getCurrentUser() {
    return apiFetch('/auth/me')
}

/* ─── Donor Endpoints ─── */

export async function createDonorProfile(donorData) {
    return apiFetch('/donors', {
        method: 'POST',
        body: JSON.stringify(donorData),
    })
}

/* ─── NGO Endpoints ─── */

export async function createNGOProfile(ngoData) {
    return apiFetch('/ngos', {
        method: 'POST',
        body: JSON.stringify(ngoData),
    })
}
