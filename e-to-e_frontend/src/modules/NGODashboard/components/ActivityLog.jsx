import { useEffect } from 'react'
import { useNGO } from '../context/NGOContext'
import { animateRowsStagger } from '../animations/ngoAnimations'

const EVENT_LABELS = {
    claim_created: 'Donation Claimed',
    claim_cancelled: 'Claim Cancelled',
    claim_status_changed: 'Claim Status Changed',
    delivery_assigned: 'Volunteer Assigned',
    delivery_status_updated: 'Delivery Updated',
    volunteer_added: 'Volunteer Added',
    volunteer_updated: 'Volunteer Updated',
    volunteer_removed: 'Volunteer Removed',
    new_donation_detected: 'New Donation',
}

const EVENT_ICONS = {
    claim_created: '✓',
    claim_cancelled: '✕',
    claim_status_changed: '⟳',
    delivery_assigned: '◉',
    delivery_status_updated: '↑',
    volunteer_added: '+',
    volunteer_updated: '✎',
    volunteer_removed: '−',
    new_donation_detected: '↓',
}

export default function ActivityLog() {
    const { activityLog } = useNGO()

    useEffect(() => {
        if (activityLog.length > 0) {
            animateRowsStagger('.ngo-log-row')
        }
    }, [activityLog])

    if (activityLog.length === 0) {
        return (
            <div className="ngo-empty-state">
                <span className="ngo-empty-state__icon">☰</span>
                <h4>No activity yet</h4>
                <p>Your actions will be logged here in real-time.</p>
            </div>
        )
    }

    return (
        <div className="ngo-table-wrap ngo-scroll-table">
            <table className="ngo-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Event</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    {activityLog.map((log) => (
                        <tr key={log.id} className="ngo-log-row">
                            <td>
                                <span className="ngo-cell-sub">
                                    {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>
                            </td>
                            <td>
                                <div className="ngo-log-event">
                                    <span className="ngo-log-event__icon">
                                        {EVENT_ICONS[log.event_type] || '•'}
                                    </span>
                                    <span>{EVENT_LABELS[log.event_type] || log.event_type}</span>
                                </div>
                            </td>
                            <td>
                                <span className="ngo-cell-sub">
                                    {log.listing_id && `Listing: ${log.listing_id.slice(0, 8)}…`}
                                    {log.claim_id && `Claim: ${log.claim_id.slice(0, 8)}…`}
                                    {log.volunteer_id && `Vol: ${log.volunteer_id.slice(0, 8)}…`}
                                    {log.delivery_id && `Del: ${log.delivery_id.slice(0, 8)}…`}
                                    {log.volunteer_name && log.volunteer_name}
                                    {log.food_type && log.food_type}
                                    {log.status && ` → ${log.status}`}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
