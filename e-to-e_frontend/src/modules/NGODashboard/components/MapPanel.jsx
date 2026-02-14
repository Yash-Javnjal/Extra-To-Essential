import { useEffect, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNGO } from '../context/NGOContext'
import 'leaflet/dist/leaflet.css'

/* ─── Custom Marker Icons ─── */
function createIcon(color, label) {
    return L.divIcon({
        className: 'ngo-map-marker',
        html: `<div style="
            width:32px;height:32px;border-radius:50%;
            background:${color};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;font-weight:700;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            border:2px solid #fff;
        ">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
    })
}

const NGO_ICON = createIcon('#443c3c', 'N')
const DONOR_ICON = createIcon('#6c7483', 'D')
const VOLUNTEER_ICON = createIcon('#7f7a7b', 'V')

/* ─── Auto-fit bounds ─── */
function FitBounds({ positions }) {
    const map = useMap()
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions)
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
        }
    }, [positions, map])
    return null
}

export default function MapPanel() {
    const { ngoProfile, claims, deliveries, listings } = useNGO()
    const mapRef = useRef(null)

    /* NGO center */
    const ngoLat = parseFloat(ngoProfile?.latitude) || 17.6599
    const ngoLng = parseFloat(ngoProfile?.longitude) || 75.9064

    /* Donor markers from claims + listings */
    const donorMarkers = useMemo(() => {
        const markers = []
        const seen = new Set()

        // From active claims
        claims.forEach((claim) => {
            const fl = claim.food_listings
            if (!fl || !fl.latitude || !fl.longitude) return
            const key = `${fl.latitude}-${fl.longitude}`
            if (seen.has(key)) return
            seen.add(key)
            markers.push({
                id: fl.listing_id || claim.claim_id,
                lat: parseFloat(fl.latitude),
                lng: parseFloat(fl.longitude),
                name: fl.donors?.organization_name || fl.donors?.city || 'Donor',
                food: fl.food_type || '',
                qty: fl.quantity_kg || '',
                address: fl.pickup_address || '',
                type: 'claim',
            })
        })

        // From available listings
        listings.forEach((l) => {
            const lat = parseFloat(l.latitude)
            const lng = parseFloat(l.longitude)
            if (!lat || !lng) return
            const key = `${lat}-${lng}`
            if (seen.has(key)) return
            seen.add(key)
            markers.push({
                id: l.listing_id,
                lat,
                lng,
                name: l.donors?.organization_name || l.donors?.city || l.organization_name || 'Donor',
                food: l.food_type || '',
                qty: l.quantity_kg || '',
                address: l.pickup_address || '',
                type: 'listing',
            })
        })

        return markers
    }, [claims, listings])

    /* Volunteer markers from deliveries */
    const volunteerMarkers = useMemo(() => {
        const markers = []
        deliveries.forEach((d) => {
            if (!d.volunteers || !d.ngo_claims?.food_listings) return
            const fl = d.ngo_claims.food_listings
            // Place volunteer marker near pickup (offset slightly)
            if (!fl.latitude || !fl.longitude) return
            markers.push({
                id: d.delivery_id,
                lat: parseFloat(fl.latitude) + 0.001,
                lng: parseFloat(fl.longitude) + 0.001,
                name: d.volunteers.full_name,
                vehicle: d.volunteers.vehicle_type || '',
                status: d.delivery_status,
            })
        })
        return markers
    }, [deliveries])

    /* Route lines: NGO → Donor for active claims */
    const routeLines = useMemo(() => {
        return donorMarkers
            .filter((m) => m.type === 'claim')
            .map((m) => ({
                id: m.id,
                positions: [
                    [ngoLat, ngoLng],
                    [m.lat, m.lng],
                ],
            }))
    }, [donorMarkers, ngoLat, ngoLng])

    /* All positions for bounds fitting */
    const allPositions = useMemo(() => {
        const pts = [[ngoLat, ngoLng]]
        donorMarkers.forEach((m) => pts.push([m.lat, m.lng]))
        volunteerMarkers.forEach((m) => pts.push([m.lat, m.lng]))
        return pts
    }, [ngoLat, ngoLng, donorMarkers, volunteerMarkers])

    return (
        <div className="ngo-map-container ngo-scroll-map">
            <MapContainer
                ref={mapRef}
                center={[ngoLat, ngoLng]}
                zoom={12}
                style={{ width: '100%', height: '100%', borderRadius: '12px' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />

                <FitBounds positions={allPositions} />

                {/* NGO marker */}
                <Marker position={[ngoLat, ngoLng]} icon={NGO_ICON}>
                    <Popup>
                        <strong>{ngoProfile?.ngo_name || 'Your NGO'}</strong>
                        <br />
                        {ngoProfile?.address || ''}
                    </Popup>
                </Marker>

                {/* Donor markers */}
                {donorMarkers.map((m) => (
                    <Marker key={m.id} position={[m.lat, m.lng]} icon={DONOR_ICON}>
                        <Popup>
                            <strong>{m.name}</strong>
                            <br />
                            {m.food} — {m.qty} kg
                            <br />
                            <small>{m.address}</small>
                        </Popup>
                    </Marker>
                ))}

                {/* Volunteer markers */}
                {volunteerMarkers.map((m) => (
                    <Marker key={m.id} position={[m.lat, m.lng]} icon={VOLUNTEER_ICON}>
                        <Popup>
                            <strong>{m.name}</strong>
                            <br />
                            {m.vehicle && `Vehicle: ${m.vehicle}`}
                            <br />
                            Status: {m.status?.replace('_', ' ')}
                        </Popup>
                    </Marker>
                ))}

                {/* Route lines */}
                {routeLines.map((r) => (
                    <Polyline
                        key={r.id}
                        positions={r.positions}
                        pathOptions={{
                            color: '#443c3c',
                            weight: 2,
                            opacity: 0.6,
                            dashArray: '8, 8',
                        }}
                    />
                ))}
            </MapContainer>

            {/* Map legend */}
            <div className="ngo-map-legend">
                <div className="ngo-map-legend__item">
                    <span className="ngo-map-legend__dot" style={{ background: '#443c3c' }} />
                    <span>NGO</span>
                </div>
                <div className="ngo-map-legend__item">
                    <span className="ngo-map-legend__dot" style={{ background: '#6c7483' }} />
                    <span>Donors</span>
                </div>
                <div className="ngo-map-legend__item">
                    <span className="ngo-map-legend__dot" style={{ background: '#7f7a7b' }} />
                    <span>Volunteers</span>
                </div>
            </div>
        </div>
    )
}
