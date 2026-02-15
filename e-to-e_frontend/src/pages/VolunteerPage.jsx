import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import '../styles/VolunteerPage.css' // We will need to create this CSS file

export default function VolunteerPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isOnline, setIsOnline] = useState(false)
    const [status, setStatus] = useState('offline') // offline, available, busy
    const [location, setLocation] = useState(null)
    const [activeDelivery, setActiveDelivery] = useState(null)
    const [error, setError] = useState(null)

    const watchIdRef = useRef(null)
    const channelRef = useRef(null)

    // Redirect if not volunteer
    useEffect(() => {
        if (user && user.role !== 'volunteer') {
            navigate('/dashboard')
        }
    }, [user, navigate])

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopTracking()
        }
    }, [])

    const startTracking = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser')
            return
        }

        setIsOnline(true)
        setStatus('available')

        // Initialize Supabase channel
        channelRef.current = supabase.channel('tracking')
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to tracking channel')
                }
            })

        // Start watching position
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, heading, speed } = position.coords
                setLocation({ latitude, longitude })

                // Broadcast location
                if (channelRef.current) {
                    channelRef.current.send({
                        type: 'broadcast',
                        event: 'location_update',
                        payload: {
                            volunteer_id: user.id,
                            latitude,
                            longitude,
                            heading,
                            speed,
                            status: activeDelivery ? 'busy' : 'available'
                        }
                    })
                }
            },
            (err) => {
                console.error('Error watching position:', err)
                setError('Lost GPS signal. Please check your connection.')
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }

    const stopTracking = () => {
        setIsOnline(false)
        setStatus('offline')

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }

        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
            channelRef.current = null
        }
    }

    const toggleOnline = () => {
        if (isOnline) {
            stopTracking()
        } else {
            startTracking()
        }
    }

    return (
        <div className="volunteer-page">
            <header className="vp-header">
                <h1>Volunteer Console</h1>
                <div className="vp-user-info">
                    <span className="vp-avatar">{user?.user_metadata?.full_name?.[0]}</span>
                    <span>{user?.user_metadata?.full_name}</span>
                </div>
            </header>

            <main className="vp-main">
                <section className="vp-status-card">
                    <div className={`vp-status-indicator ${isOnline ? 'online' : 'offline'}`}>
                        <div className="vp-pulse"></div>
                        <span>{isOnline ? 'You are Online' : 'You are Offline'}</span>
                    </div>

                    <p className="vp-status-text">
                        {isOnline
                            ? "Broadcasting your location to nearby NGOs. Stay ready for pickup requests!"
                            : "Go online to start receiving delivery requests."}
                    </p>

                    <button
                        className={`vp-toggle-btn ${isOnline ? 'active' : ''}`}
                        onClick={toggleOnline}
                    >
                        {isOnline ? 'Go Offline' : 'Go Online'}
                    </button>
                </section>

                {error && (
                    <div className="vp-error">
                        {error}
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {/* Info Section for Demo */}
                <div className="vp-info-box">
                    <h3>📍 Live Tracking Info</h3>
                    <p>When online, your location is shared in real-time with NGOs on the dashboard map.</p>
                    {location && (
                        <div className="vp-coords">
                            <small>Lat: {location.latitude.toFixed(6)}</small>
                            <small>Lng: {location.longitude.toFixed(6)}</small>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
