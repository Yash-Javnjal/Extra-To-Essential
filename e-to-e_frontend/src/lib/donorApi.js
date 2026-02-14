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

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
        delete headers['Content-Type']
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

/* ─── Donor Profile ─── */

export async function getDonorProfile() {
    return apiFetch('/donors/me')
}

export async function updateDonorProfile(updates) {
    return apiFetch('/donors/me', {
        method: 'PUT',
        body: JSON.stringify(updates),
    })
}

export async function getDonorImpact() {
    return apiFetch('/donors/me/impact')
}

/* ─── Food Listings ─── */

export async function createListing(listingData) {
    return apiFetch('/listings', {
        method: 'POST',
        body: JSON.stringify(listingData),
    })
}

export async function getMyListings() {
    return apiFetch('/listings/my')
}

export async function getListingById(listingId) {
    return apiFetch(`/listings/${listingId}`)
}

export async function updateListing(listingId, updates) {
    return apiFetch(`/listings/${listingId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    })
}

export async function deleteListing(listingId) {
    return apiFetch(`/listings/${listingId}`, {
        method: 'DELETE',
    })
}

/* ─── Impact & Dashboard ─── */

export async function getDashboardSummary() {
    return apiFetch('/impact/dashboard')
}

export async function getTotalImpact() {
    return apiFetch('/impact/total')
}

export async function getDonorLeaderboard(limit = 10) {
    return apiFetch(`/impact/leaderboard/donors?limit=${limit}`)
}

/* ─── Auth Helpers ─── */

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
