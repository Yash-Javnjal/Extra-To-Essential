import { useEffect, useCallback } from 'react'
import { useNGO } from '../context/NGOContext'
import { animateRowsStagger, animateButtonPress } from '../animations/ngoAnimations'

export default function IncomingDonations() {
    const { listings, loading, errors, handleClaimListing, fetchListings } = useNGO()

    useEffect(() => {
        if (!loading.listings && listings.length > 0) {
            animateRowsStagger('.ngo-incoming-row')
        }
    }, [listings, loading.listings])

    const handleAccept = useCallback(
        async (listing, e) => {
            animateButtonPress(e.currentTarget)
            try {
                await handleClaimListing(listing.listing_id)
            } catch {
                /* handled in context */
            }
        },
        [handleClaimListing]
    )

    /* Extract donor info — geo-matched listings may have flat fields or nested donors */
    function getDonorName(listing) {
        if (listing.organization_name) return listing.organization_name
        if (listing.donors?.organization_name) return listing.donors.organization_name
        if (listing.donor_name) return listing.donor_name
        if (listing.donors?.city) return `Donor (${listing.donors.city})`
        return 'Unknown Donor'
    }

    function getDonorPhone(listing) {
        if (listing.phone) return listing.phone
        if (listing.donors?.phone) return listing.donors.phone
        return '—'
    }

    function getDistance(listing) {
        if (listing.distance_km != null) {
            const km = parseFloat(listing.distance_km).toFixed(1)
            const isFar = listing.within_service_radius === false
            return (
                <>
                    <span className={`ngo-distance-badge ${isFar ? 'ngo-distance-badge--far' : 'ngo-distance-badge--near'}`}>
                        {isFar ? '⚠ Far' : '✓ Nearby'}
                    </span>
                    {' '}{km} km
                </>
            )
        }
        return '—'
    }

    function getTimeRemaining(expiryTime) {
        if (!expiryTime) return '—'
        const diff = new Date(expiryTime) - new Date()
        if (diff <= 0) return 'Expired'
        const hours = Math.floor(diff / 3600000)
        const mins = Math.floor((diff % 3600000) / 60000)
        if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
        return `${hours}h ${mins}m`
    }

    if (loading.listings && listings.length === 0) {
        return (
            <div className="ngo-table-wrap ngo-scroll-table">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="ngo-skeleton-row">
                        <div className="ngo-skeleton-line" />
                    </div>
                ))}
            </div>
        )
    }

    if (errors.listings) {
        return (
            <div className="ngo-error-state">
                <span className="ngo-error-state__icon">⚠</span>
                <p>{errors.listings}</p>
                <button className="ngo-btn ngo-btn--outline" onClick={fetchListings}>
                    Retry
                </button>
            </div>
        )
    }

    if (listings.length === 0) {
        return (
            <div className="ngo-empty-state">
                <span className="ngo-empty-state__icon">☐</span>
                <h4>No incoming donations</h4>
                <p>New donations within your service radius will appear here automatically.</p>
            </div>
        )
    }

    return (
        <div className="ngo-table-wrap ngo-scroll-table">
            <table className="ngo-table">
                <thead>
                    <tr>
                        <th>Donor</th>
                        <th>Food Type</th>
                        <th>Quantity</th>
                        <th>Distance</th>
                        <th>Expiry</th>
                        <th>Address</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {listings.map((listing) => (
                        <tr key={listing.listing_id} className="ngo-incoming-row">
                            <td>
                                <div className="ngo-cell-main">{getDonorName(listing)}</div>
                                <div className="ngo-cell-sub">{getDonorPhone(listing)}</div>
                            </td>
                            <td>{listing.food_type || '—'}</td>
                            <td>{listing.quantity_kg ? `${listing.quantity_kg} kg` : '—'}</td>
                            <td>{getDistance(listing)}</td>
                            <td>
                                <span
                                    className={`ngo-expiry-badge ${getTimeRemaining(listing.expiry_time) === 'Expired'
                                        ? 'ngo-expiry-badge--expired'
                                        : ''
                                        }`}
                                >
                                    {getTimeRemaining(listing.expiry_time)}
                                </span>
                            </td>
                            <td>
                                <div className="ngo-cell-address">{listing.pickup_address || '—'}</div>
                            </td>
                            <td>
                                <div className="ngo-action-btns">
                                    <button
                                        className="ngo-btn ngo-btn--accept"
                                        onClick={(e) => handleAccept(listing, e)}
                                        disabled={loading.action}
                                    >
                                        {loading.action ? 'Accepting...' : 'Accept'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
