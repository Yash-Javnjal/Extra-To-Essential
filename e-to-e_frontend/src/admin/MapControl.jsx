import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { gsap } from 'gsap'
import 'leaflet/dist/leaflet.css'

/* ── Custom marker icons using colored circles ── */
const createIcon = (color) =>
    L.divIcon({
        className: '',
        html: `<div style="
      width: 14px; height: 14px;
      background: ${color};
      border: 2.5px solid #fff;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
    })

const ngoIcon = createIcon('#443c3c')
const donorIcon = createIcon('#6c7483')
const listingIcon = createIcon('#6abf69')

/* ── Map auto-fit sub-component ── */
function MapFitter({ markers }) {
    const map = useMap()

    useEffect(() => {
        if (!markers || markers.length === 0) return
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]))
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
        }
    }, [markers, map])

    return null
}

export default function MapControl({ ngos, donors, listings }) {
    const wrapRef = useRef(null)
    const [isReady, setIsReady] = useState(false)

    useEffect(() => {
        // Small delay to avoid rendering map before layout settles
        const timer = setTimeout(() => setIsReady(true), 500)
        return () => clearTimeout(timer)
    }, [])

    /* ── Zoom-in animation wrapper ── */
    useEffect(() => {
        if (!wrapRef.current || !isReady) return
        gsap.from(wrapRef.current, {
            scale: 0.92,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            delay: 0.3,
        })
    }, [isReady])

    /* ── Collect all markers ── */
    const allMarkers = []

        ; (ngos || []).forEach(n => {
            if (n.latitude && n.longitude) {
                allMarkers.push({
                    lat: parseFloat(n.latitude),
                    lng: parseFloat(n.longitude),
                    type: 'ngo',
                    label: n.ngo_name || 'NGO',
                    detail: n.city || '',
                })
            }
        })

        ; (donors || []).forEach(d => {
            if (d.latitude && d.longitude) {
                allMarkers.push({
                    lat: parseFloat(d.latitude),
                    lng: parseFloat(d.longitude),
                    type: 'donor',
                    label: d.profiles?.organization_name || 'Donor',
                    detail: d.city || '',
                })
            }
        })

        ; (listings || []).forEach(l => {
            if (l.latitude && l.longitude) {
                allMarkers.push({
                    lat: parseFloat(l.latitude),
                    lng: parseFloat(l.longitude),
                    type: 'listing',
                    label: l.food_type || 'Donation',
                    detail: `${l.quantity_kg || 0} kg · ${l.status || 'open'}`,
                })
            }
        })

    const center = allMarkers.length > 0
        ? [allMarkers[0].lat, allMarkers[0].lng]
        : [20.5937, 78.9629] // India center fallback

    const getIcon = (type) => {
        if (type === 'ngo') return ngoIcon
        if (type === 'donor') return donorIcon
        return listingIcon
    }

    return (
        <section className="admin-section">
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">Map Control Center</h2>
                    <p className="admin-section__subtitle">
                        {allMarkers.length} locations mapped
                    </p>
                </div>
            </div>

            <div className="admin-map-wrap" ref={wrapRef}>
                {isReady && (
                    <MapContainer
                        center={center}
                        zoom={5}
                        className="admin-map-container"
                        scrollWheelZoom={true}
                        zoomControl={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapFitter markers={allMarkers} />

                        {allMarkers.map((m, i) => (
                            <Marker key={`${m.type}-${i}`} position={[m.lat, m.lng]} icon={getIcon(m.type)}>
                                <Popup>
                                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem' }}>
                                        <strong>{m.label}</strong>
                                        <br />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                            {m.type.toUpperCase()} · {m.detail}
                                        </span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {/* Legend */}
                <div className="admin-map-legend">
                    <div className="admin-map-legend__item">
                        <span className="admin-map-legend__color" style={{ background: '#443c3c' }} />
                        NGOs
                    </div>
                    <div className="admin-map-legend__item">
                        <span className="admin-map-legend__color" style={{ background: '#6c7483' }} />
                        Donors
                    </div>
                    <div className="admin-map-legend__item">
                        <span className="admin-map-legend__color" style={{ background: '#6abf69' }} />
                        Active Pickups
                    </div>
                </div>
            </div>
        </section>
    )
}
