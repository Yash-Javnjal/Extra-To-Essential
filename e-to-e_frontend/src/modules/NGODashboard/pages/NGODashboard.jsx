import { useState, useEffect, useRef } from 'react'
import { NGOProvider, useNGO } from '../context/NGOContext'
import Sidebar from '../components/Sidebar'
import OverviewCards from '../components/OverviewCards'
import IncomingDonations from '../components/IncomingDonations'
import AcceptedPickups from '../components/AcceptedPickups'
import VolunteerManager from '../components/VolunteerManager'
import MapPanel from '../components/MapPanel'
import ActivityLog from '../components/ActivityLog'
import NotificationToast from '../components/NotificationToast'
import { runPageLoadSequence, animateViewEnter, killAllAnimations } from '../animations/ngoAnimations'
import './NGODashboard.css'

const VIEW_TITLES = {
    overview: 'Operations Overview',
    incoming: 'Incoming Donations',
    pickups: 'Accepted Pickups',
    volunteers: 'Volunteer Management',
    map: 'Operations Map',
    log: 'Activity Log',
}

const VIEW_SUBTITLES = {
    overview: 'Real-time logistics command center',
    incoming: 'Available food donations within your service radius',
    pickups: 'Manage claimed donations and assign volunteers',
    volunteers: 'Add, edit, and manage your volunteer team',
    map: 'Live map showing donors, volunteers, and routes',
    log: 'Session activity history',
}

function DashboardInner() {
    const { loading, errors, ngoProfile } = useNGO()
    const [activeView, setActiveView] = useState('overview')
    const [collapsed, setCollapsed] = useState(false)
    const contentRef = useRef(null)
    const hasAnimated = useRef(false)

    /* Cinematic page load */
    useEffect(() => {
        if (!loading.initial && !hasAnimated.current) {
            hasAnimated.current = true
            setTimeout(() => runPageLoadSequence(), 100)
        }
    }, [loading.initial])

    /* View transition animation */
    useEffect(() => {
        if (contentRef.current) animateViewEnter(contentRef.current)
    }, [activeView])

    /* Cleanup */
    useEffect(() => {
        return () => killAllAnimations()
    }, [])

    /* Responsive collapse */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 1024) setCollapsed(true)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    /* Initial loading state */
    if (loading.initial) {
        return (
            <div className="ngo-loading-screen">
                <div className="ngo-loading-spinner" />
                <p>Loading NGO Dashboard…</p>
            </div>
        )
    }

    /* Init error */
    if (errors.init || errors.profile) {
        return (
            <div className="ngo-loading-screen">
                <div className="ngo-error-state">
                    <span className="ngo-error-state__icon">⚠</span>
                    <h3>Failed to load dashboard</h3>
                    <p>{errors.init || errors.profile}</p>
                    <button className="ngo-btn ngo-btn--primary" onClick={() => window.location.reload()}>
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    function renderView() {
        switch (activeView) {
            case 'overview':
                return (
                    <div id="ngo-overview-view">
                        <OverviewCards />
                        <div className="ngo-section-divider" />
                        <div className="ngo-overview-panels">
                            <div className="ngo-overview-panel">
                                <h4 className="ngo-panel-title">Recent Incoming</h4>
                                <IncomingDonations />
                            </div>
                            <div className="ngo-overview-panel">
                                <h4 className="ngo-panel-title">Active Pickups</h4>
                                <AcceptedPickups />
                            </div>
                        </div>
                    </div>
                )
            case 'incoming':
                return <IncomingDonations />
            case 'pickups':
                return <AcceptedPickups />
            case 'volunteers':
                return <VolunteerManager />
            case 'map':
                return <MapPanel />
            case 'log':
                return <ActivityLog />
            default:
                return <OverviewCards />
        }
    }

    return (
        <div className={`ngo-layout ${collapsed ? 'ngo-layout--collapsed' : ''}`}>
            <Sidebar
                activeView={activeView}
                onViewChange={setActiveView}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((c) => !c)}
            />

            <main className="ngo-content">
                <div className="ngo-view-header">
                    <div>
                        <h2 className="ngo-view-title">{VIEW_TITLES[activeView]}</h2>
                        <p className="ngo-view-subtitle">{VIEW_SUBTITLES[activeView]}</p>
                    </div>
                    <div className="ngo-view-header__meta">
                        <span className="ngo-live-dot" />
                        <span className="ngo-live-label">Live</span>
                    </div>
                </div>

                <div ref={contentRef} className="ngo-view-body">
                    {renderView()}
                </div>
            </main>

            <NotificationToast />
        </div>
    )
}

export default function NGODashboard() {
    return (
        <NGOProvider>
            <DashboardInner />
        </NGOProvider>
    )
}
