import { useState, useEffect, useRef } from 'react'
import { useNGO } from '../context/NGOContext'

const NAV_ITEMS = [
    { key: 'overview', label: 'Overview', icon: '⬡' },
    { key: 'incoming', label: 'Incoming Donations', icon: '↓' },
    { key: 'pickups', label: 'Accepted Pickups', icon: '✓' },
    { key: 'volunteers', label: 'Volunteers', icon: '◉' },
    { key: 'map', label: 'Operations Map', icon: '◎' },
    { key: 'log', label: 'Activity Log', icon: '☰' },
]

export default function Sidebar({ activeView, onViewChange, collapsed, onToggleCollapse }) {
    const { ngoProfile, user, stats } = useNGO()
    const [mobileOpen, setMobileOpen] = useState(false)
    const sidebarRef = useRef(null)

    const orgName = ngoProfile?.ngo_name || user?.organization_name || 'NGO Dashboard'
    const contactPerson = ngoProfile?.contact_person || user?.full_name || ''

    /* Close mobile menu on resize */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 480) setMobileOpen(false)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    /* Lock body scroll when mobile menu is open */
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    function handleNavClick(key) {
        onViewChange(key)
        setMobileOpen(false)
    }

    function handleLogout() {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
    }

    const badgeMap = {
        incoming: stats.totalDonationsNearby,
        pickups: stats.acceptedPickups,
        volunteers: stats.availableVolunteers,
    }

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className={`ngo-mobile-hamburger ${mobileOpen ? 'ngo-mobile-hamburger--active' : ''}`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                <span /><span /><span />
            </button>

            {/* Mobile backdrop */}
            {mobileOpen && (
                <div className="ngo-mobile-backdrop" onClick={() => setMobileOpen(false)} />
            )}

            <aside
                ref={sidebarRef}
                className={[
                    'ngo-sidebar',
                    collapsed ? 'ngo-sidebar--collapsed' : '',
                    mobileOpen ? 'ngo-sidebar--mobile-open' : '',
                ].join(' ')}
            >
                {/* Logo / Org Header */}
                <div className="ngo-sidebar__header">
                    <div className="ngo-sidebar__logo-icon">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <rect width="28" height="28" rx="8" fill="var(--tundora)" />
                            <path d="M8 14l4 4 8-8" stroke="var(--white)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="ngo-sidebar__logo-text">{orgName}</span>
                </div>

                {/* Collapse toggle (desktop) */}
                <button
                    className="ngo-sidebar__collapse-btn"
                    onClick={onToggleCollapse}
                    aria-label="Toggle sidebar"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d={collapsed ? 'M6 3l5 5-5 5' : 'M10 3L5 8l5 5'}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                {/* Nav links */}
                <nav className="ngo-sidebar__nav">
                    <span className="ngo-sidebar__category">Operations</span>
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.key}
                            className={`ngo-sidebar__link ${activeView === item.key ? 'ngo-sidebar__link--active' : ''}`}
                            onClick={() => handleNavClick(item.key)}
                        >
                            <span className="ngo-sidebar__link-icon">{item.icon}</span>
                            <span className="ngo-sidebar__link-text">{item.label}</span>
                            {badgeMap[item.key] > 0 && (
                                <span className="ngo-sidebar__badge">{badgeMap[item.key]}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User section */}
                <div className="ngo-sidebar__user">
                    <div className="ngo-sidebar__user-avatar">
                        {(contactPerson?.[0] || 'N').toUpperCase()}
                    </div>
                    <div className="ngo-sidebar__user-info">
                        <span className="ngo-sidebar__user-name">{contactPerson}</span>
                        <span className="ngo-sidebar__user-role">NGO Operator</span>
                    </div>
                </div>

                <button className="ngo-sidebar__logout" onClick={handleLogout}>
                    <span className="ngo-sidebar__link-icon">⏻</span>
                    <span className="ngo-sidebar__link-text">Log Out</span>
                </button>
            </aside>
        </>
    )
}
