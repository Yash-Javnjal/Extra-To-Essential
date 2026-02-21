import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { gsap } from 'gsap'
import { Search, Handshake, Check, X } from 'lucide-react'
import { verifyDonor } from '../lib/adminApi'

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

export default function DonorManagement({ donors, onRefresh }) {
    const { t } = useTranslation('dashboard')
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
    }, [donors, filter, search])

    const handleApprove = useCallback(async (donorId) => {
        setActionLoading(donorId)
        try {
            await verifyDonor(donorId, true)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to approve donor:', err)
            alert(t('failedToApproveDonor', { error: err.message || err.error || 'Unknown error' }))
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh, t])

    const handleDeny = useCallback(async (donorId) => {
        if (!confirm(t('areYouSureDenyDonor'))) return
        setActionLoading(donorId)
        try {
            await verifyDonor(donorId, false)
            if (onRefresh) await onRefresh()
        } catch (err) {
            console.error('Failed to deny donor:', err)
            alert(t('failedToDenyDonor', { error: err.message || err.error || 'Unknown error' }))
        } finally {
            setActionLoading(null)
        }
    }, [onRefresh, t])

    const filtered = donors.filter(d => {
        const name = d.profiles?.organization_name || ''
        const city = d.city || ''
        const matchSearch = !search ||
            name.toLowerCase().includes(search.toLowerCase()) ||
            city.toLowerCase().includes(search.toLowerCase())

        const matchFilter = filter === 'all' ||
            (filter === 'verified' && d.verification_status) ||
            (filter === 'unverified' && !d.verification_status)

        return matchSearch && matchFilter
    })

    return (
        <section className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">{t('donorManagement')}</h2>
                    <p className="admin-section__subtitle">{t('donorsRegistered', { count: donors.length })}</p>
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
                            placeholder={t('searchDonorsByNameOrCity')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button
                        className={`admin-filter-btn ${filter === 'all' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        {t('all')}
                    </button>
                    <button
                        className={`admin-filter-btn ${filter === 'verified' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('verified')}
                    >
                        <Check size={12} strokeWidth={2.5} style={{ marginRight: 4 }} />
                        {t('verified')}
                    </button>
                    <button
                        className={`admin-filter-btn ${filter === 'unverified' ? 'admin-filter-btn--active' : ''}`}
                        onClick={() => setFilter('unverified')}
                    >
                        {t('pending')}
                    </button>
                </div>

                {filtered.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <Handshake size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">
                            {filter === 'verified' ? t('noVerifiedDonorsYet') :
                                filter === 'unverified' ? t('noPendingDonorRegistrations') :
                                    t('noDonorsFound')}
                        </p>
                        <p className="admin-empty__hint">
                            {search ? t('tryAdjustingSearchQuery') : t('donorsWillAppearHere')}
                        </p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t('organization')}</th>
                                <th>{t('businessType')}</th>
                                <th>{t('city')}</th>
                                <th>{t('status')}</th>
                                <th>{t('registered')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(d => (
                                <tr key={d.donor_id}>
                                    <td>
                                        {d.profiles?.organization_name || '—'}
                                    </td>
                                    <td>{d.business_type || '—'}</td>
                                    <td>{d.city || '—'}</td>
                                    <td>
                                        <span className={`admin-badge ${d.verification_status ? 'admin-badge--verified' : 'admin-badge--pending'}`}>
                                            <span className="admin-badge__dot" />
                                            {d.verification_status ? t('verified') : t('pending')}
                                        </span>
                                    </td>
                                    <td className="admin-log-timestamp">
                                        {formatDate(d.created_at)}
                                    </td>
                                    <td>
                                        <div className="admin-actions-cell">
                                            <button className="admin-action-btn admin-action-btn--view">
                                                {t('view')}
                                            </button>
                                            {!d.verification_status && (
                                                <>
                                                    <button
                                                        className="admin-action-btn admin-action-btn--approve"
                                                        onClick={() => handleApprove(d.donor_id)}
                                                        disabled={actionLoading === d.donor_id}
                                                    >
                                                        <Check size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                        {actionLoading === d.donor_id ? t('approving') : t('approve')}
                                                    </button>
                                                    <button
                                                        className="admin-action-btn admin-action-btn--deny"
                                                        onClick={() => handleDeny(d.donor_id)}
                                                        disabled={actionLoading === d.donor_id}
                                                    >
                                                        <X size={12} strokeWidth={2.5} style={{ marginRight: 3 }} />
                                                        {t('deny')}
                                                    </button>
                                                </>
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
