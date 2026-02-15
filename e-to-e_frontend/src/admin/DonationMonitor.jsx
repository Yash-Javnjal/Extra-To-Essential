import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Package } from 'lucide-react'

function timeAgo(date) {
    if (!date) return '—'
    const now = new Date()
    const diff = Math.floor((now - new Date(date)) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return new Date(date).toLocaleDateString()
}

export default function DonationMonitor({ listings }) {
    const listRef = useRef(null)

    useEffect(() => {
        if (!listRef.current) return
        const items = listRef.current.querySelectorAll('.admin-donation-item')
        gsap.from(items, {
            x: 30,
            opacity: 0,
            duration: 0.35,
            stagger: 0.04,
            ease: 'power2.out',
            delay: 0.3,
        })
    }, [listings])

    const sorted = [...(listings || [])].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    ).slice(0, 15)

    return (
        <div className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">Live Donations</h2>
                    <p className="admin-section__subtitle">Recent donation stream</p>
                </div>
                <div className="admin-section__actions">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {listings?.length || 0} total
                    </span>
                </div>
            </div>

            <div className="admin-donation-stream">
                {sorted.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty__icon">
                            <Package size={32} strokeWidth={1.2} />
                        </div>
                        <p className="admin-empty__text">No donations yet.</p>
                        <p className="admin-empty__hint">Donations will appear here as donors list food items.</p>
                    </div>
                ) : (
                    <div ref={listRef} style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {sorted.map(listing => (
                            <div key={listing.listing_id} className="admin-donation-item">
                                <div className="admin-donation-item__id">
                                    #{(listing.listing_id || '').slice(0, 8)}
                                </div>
                                <div className="admin-donation-item__info">
                                    <div className="admin-donation-item__donor">
                                        {listing.food_type || 'Food Item'} — {listing.quantity_kg || 0} kg
                                    </div>
                                    <div className="admin-donation-item__ngo">
                                        {listing.donors?.city || listing.pickup_address || '—'}
                                    </div>
                                </div>
                                <div className="admin-donation-item__meta">
                                    <span className={`admin-badge admin-badge--${listing.status || 'open'}`}>
                                        <span className="admin-badge__dot" />
                                        {listing.status || 'open'}
                                    </span>
                                    <div className="admin-donation-item__time">
                                        {timeAgo(listing.created_at)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
