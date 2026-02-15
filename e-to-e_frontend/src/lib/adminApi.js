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

/* ─── Impact / Dashboard ─── */

export async function getDashboardSummary() {
    return apiFetch('/impact/dashboard')
}

export async function getTotalImpact() {
    return apiFetch('/impact/total')
}

export async function getDailyTrend(days = 30) {
    return apiFetch(`/impact/trend/daily?days=${days}`)
}

export async function getDonorLeaderboard(limit = 20) {
    return apiFetch(`/impact/leaderboard/donors?limit=${limit}`)
}

export async function getNGOPerformance(limit = 20) {
    return apiFetch(`/impact/performance/ngos?limit=${limit}`)
}

export async function getVolunteerPerformance(ngoId = null) {
    const param = ngoId ? `?ngo_id=${ngoId}` : ''
    return apiFetch(`/impact/performance/volunteers${param}`)
}

export async function getFoodDistribution() {
    return apiFetch('/impact/distribution/food-types')
}

export async function getImpactByCity() {
    return apiFetch('/impact/city')
}

/* ─── Entities ─── */

export async function getAllNGOs(city, verified) {
    let params = []
    if (city) params.push(`city=${encodeURIComponent(city)}`)
    if (verified !== undefined) params.push(`verified=${verified}`)
    const qs = params.length ? `?${params.join('&')}` : ''
    return apiFetch(`/ngos${qs}`)
}

export async function getAllDonors(city, verified) {
    let params = []
    if (city) params.push(`city=${encodeURIComponent(city)}`)
    if (verified !== undefined) params.push(`verified=${verified}`)
    const qs = params.length ? `?${params.join('&')}` : ''
    return apiFetch(`/donors${qs}`)
}

export async function getAllListings(status) {
    const param = status ? `?status=${status}` : ''
    return apiFetch(`/listings${param}`)
}

/* ─── Auth ─── */

export async function getCurrentUser() {
    return apiFetch('/auth/me')
}

export async function logoutUser() {
    try {
        await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }
}

/* ─── Admin Verification ─── */

export async function verifyNGO(ngoId, approve = true) {
    return apiFetch(`/ngos/${ngoId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verification_status: approve }),
    })
}

export async function verifyDonor(donorId, approve = true) {
    return apiFetch(`/donors/${donorId}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ verification_status: approve }),
    })
}
