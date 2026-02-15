import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { Search, Building2, Check, X, Ban } from 'lucide-react'
import { verifyNGO } from '../lib/adminApi'

function formatDate(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const mon = months[d.getMonth()]
    const year = d.getFullYear()
    let hours = d.getHours()
    const mins = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${day} ${mon} ${year}, ${hours}:${mins} ${ampm}`
}

export default function NgoManagement({ ngos, onRefresh }) {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [actionLoading, setActionLoading] = useState(null)
    const tableRef = useRef(null)

    useEffect(() => {
        if (!tableRef.current) return
        const rows = tableRef.current.querySelectorAll('tbody tr')
        gsap.from(rows, {
            y: 20,
            opacity: 0,
            duration: 0.35,
            stagger: 0.04,
            ease: 'power2.out',
            delay: 0.2,
        })
    }, [ngos, filter, search])

    const handleApprove = useCallback(async (ngoId) => {
        setActionLoading(ngoId)
        try {
            await verifyNGO(ngoId, true)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to approve NGO:', err)
            alert('Failed to approve NGO: ' + (err.message || err.error || 'Unknown error'))
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh])

    const handleDeny = useCallback(async (ngoId) => {
        if (!confirm('Are you sure you want to deny this NGO?')) return
        setActionLoading(ngoId)
        try {
            await verifyNGO(ngoId, false)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to deny NGO:', err)
            alert('Failed to deny NGO: ' + (err.message || err.error || 'Unknown error'))
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh])

    const handleSuspend = useCallback(async (ngoId) => {
        if (!confirm('Are you sure you want to suspend this NGO?')) return
        setActionLoading(ngoId)
        try {
            await verifyNGO(ngoId, false)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to suspend NGO:', err)
            alert('Failed to suspend NGO: ' + (err.message || err.error || 'Unknown error'))
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh])

    const filtered = ngos.filter(ngo => {
        const matchSearch = !search ||
            (ngo.ngo_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (ngo.city || '').toLowerCase().includes(search.toLowerCase())

        const matchFilter = filter === 'all' ||
            (filter === 'verified' && ngo.verification_status) ||
            (filter === 'unverified' && !ngo.verification_status)

        return matchSearch && matchFilter
    })

    return (
        <section className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">NGO Management</h2>
                    <p className="admin-section__subtitle">{ngos.length} organizations registered</p>
                </div>
            </div>

            <div className="admin-table-wrap" ref={tableRef}>
                <div className="admin-table-toolbar">
                    <div className="admin-search">
                        <span className="admin-search__icon">
                            <Search size={14} strokeWidth={1.8} />
                        </span>
                        <input
                            type="text"
                            className="admin-search__input"
                            placeholder="Search NGOs by name or city…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button
                        className={`admin-filter-btn ${filter === 'all' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`admin-filter-btn ${filter === 'verified' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('verified')}
                    >
                        <Check size={12} strokeWidth={2.5} style={{ marginRight: 4 }} />
                        Verified
                    </button>
                    <button
                        className={`admin-filter-btn ${filter === 'unverified' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('unverified')}
                    >
                        Pending
                    </button>
                </div>

                {filtered.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <Building2 size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">
                            {filter === 'verified' ? 'No verified NGOs yet.' :
                                filter === 'unverified' ? 'No pending NGO registrations.' :
                                    'No NGOs found.'}
                        </p>
                        <p className="admin-empty__hint">
                            {search ? 'Try adjusting your search query.' : 'NGOs will appear here once they register on the platform.'}
                        </p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>City</th>
                                <th>Status</th>
                                <th>Radius</th>
                                <th>Phone</th>
                                <th>Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(ngo => (
                                <tr key={ngo.ngo_id}>
                                    <td style={{ fontWeight: 600 }}>{ngo.ngo_name || '—'}</td>
                                    <td>{ngo.city || '—'}</td>
                                    <td>
                                        <span className={`admin-badge ${ngo.verification_status ? 'admin-badge--verified' : 'admin-badge--pending'}`}>
                                            <span className="admin-badge__dot" />
                                            {ngo.verification_status ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>{ngo.service_radius_km ? `${ngo.service_radius_km} km` : '—'}</td>
                                    <td>{ngo.profiles?.phone || '—'}</td>
                                    <td className="admin-log-timestamp">
                                        {formatDate(ngo.created_at)}
                                    </td>
                                    <td>
                                        <div className="admin-actions-cell">
                                            {!ngo.verification_status && (
                                                <>
                                                    <button
                                                        className="admin-action-btn admin-action-btn--approve"
                                                        onClick={() => handleApprove(ngo.ngo_id)}
                                                        disabled={actionLoading === ngo.ngo_id}
                                                    >
                                                        <Check size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                        {actionLoading === ngo.ngo_id ? 'Approving…' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className="admin-action-btn admin-action-btn--deny"
                                                        onClick={() => handleDeny(ngo.ngo_id)}
                                                        disabled={actionLoading === ngo.ngo_id}
                                                    >
                                                        <X size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                        Deny
                                                    </button>
                                                </>
                                            )}
                                            {ngo.verification_status && (
                                                <button
                                                    className="admin-action-btn admin-action-btn--suspend"
                                                    onClick={() => handleSuspend(ngo.ngo_id)}
                                                    disabled={actionLoading === ngo.ngo_id}
                                                >
                                                    <Ban size={12} strokeWidth={2} style={{ marginRight: 3 }} />
                                                    {actionLoading === ngo.ngo_id ? 'Suspending…' : 'Suspend'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    )
}
