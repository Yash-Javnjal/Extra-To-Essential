import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function ProfileSection({ user, donorProfile, impact }) {
    const panelRef = useRef(null)

    const email = user?.email || ''
    const avatarLetter = email ? email.charAt(0).toUpperCase() : 'D'
    const displayName = user?.full_name || 'Donor'
    const role = user?.role || 'donor'

    useEffect(() => {
        if (!panelRef.current) return
        gsap.fromTo(
            panelRef.current.children,
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.08,
                ease: 'expo.out',
            }
        )
    }, [])

    const details = [
        { label: 'Full Name', value: displayName },
        { label: 'Email Address', value: email || '—' },
        { label: 'Phone', value: user?.phone || '—' },
        { label: 'Role', value: role.charAt(0).toUpperCase() + role.slice(1) },
        { label: 'Organization', value: user?.organization_name || donorProfile?.organization_name || '—' },
        { label: 'Address', value: donorProfile?.address || user?.address || '—' },
        { label: 'CSR Participant', value: donorProfile?.csr_participant ? 'Yes' : 'No' },
        {
            label: 'Member Since',
            value: user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })
                : '—',
        },
    ]

    const impactStats = [
        { label: 'Total Donations', value: impact?.total_donations ?? '—' },
        { label: 'Meals Shared', value: impact?.total_meals ?? '—' },
        { label: 'NGOs Served', value: impact?.total_ngos_served ?? '—' },
        { label: 'Food Saved (kg)', value: impact?.total_quantity_kg ? `${impact.total_quantity_kg} kg` : '—' },
    ]

    return (
        <div className="dd-profile-view" ref={panelRef}>
            {/* ── Identity Card ── */}
            <div className="dd-profile-identity">
                <div className="dd-profile-identity__left">
                    <div className="dd-profile-identity__avatar">
                        {avatarLetter}
                    </div>
                    <div className="dd-profile-identity__illustration">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.08">
                            <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="1" />
                            <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="0.5" />
                            <circle cx="60" cy="60" r="26" stroke="currentColor" strokeWidth="0.3" />
                            <circle cx="60" cy="45" r="14" stroke="currentColor" strokeWidth="0.8" />
                            <path d="M30 95c0-17 13-30 30-30s30 13 30 30" stroke="currentColor" strokeWidth="0.8" />
                        </svg>
                    </div>
                </div>
                <div className="dd-profile-identity__right">
                    <span className="dd-profile-identity__label">IDENTITY</span>
                    <h2 className="dd-profile-identity__name">{displayName}</h2>
                    <span className="dd-profile-identity__role-badge">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                    <p className="dd-profile-identity__email">{email}</p>
                </div>
            </div>

            {/* ── Details Grid ── */}
            <div className="dd-profile-details-card">
                <span className="dd-profile-details-card__label">PERSONAL INFORMATION</span>
                <div className="dd-profile-details-grid">
                    {details.map((d) => (
                        <div key={d.label} className="dd-profile-detail-item">
                            <span className="dd-profile-detail-item__label">{d.label}</span>
                            <span className="dd-profile-detail-item__value">{d.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Impact Summary ── */}
            <div className="dd-profile-details-card">
                <span className="dd-profile-details-card__label">IMPACT SUMMARY</span>
                <div className="dd-profile-impact-grid">
                    {impactStats.map((s) => (
                        <div key={s.label} className="dd-profile-impact-item">
                            <span className="dd-profile-impact-item__value">{s.value}</span>
                            <span className="dd-profile-impact-item__label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
