import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ─── Fix Leaflet default marker icons in bundlers (Vite/Webpack) ─── */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/* ─── Solapur, India as default center ─── */
const DEFAULT_CENTER = [17.6599, 75.9064]
const DEFAULT_ZOOM = 12
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const NOMINATIM_BASE = `${API_URL}/geocode`

/* ─── Nominatim rate-limit helper (1 req/sec) ─── */
let lastNominatimCall = 0
async function nominatimFetch(url) {
    const now = Date.now()
    const diff = now - lastNominatimCall
    if (diff < 1000) {
        await new Promise((r) => setTimeout(r, 1000 - diff))
    }
    lastNominatimCall = Date.now()
    const res = await fetch(url)
    if (!res.ok) throw new Error('Geocoding request failed')
    return res.json()
}

/* ─── Extract city from Nominatim address object ─── */
function extractCity(addressObj) {
    if (!addressObj) return ''
    return (
        addressObj.city ||
        addressObj.town ||
        addressObj.village ||
        addressObj.county ||
        addressObj.state_district ||
        addressObj.state ||
        ''
    )
}

/* ─── Reverse geocode helper ─── */
async function reverseGeocode(lat, lng) {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    const data = await nominatimFetch(url)
    return {
        address: data.display_name || '',
        city: extractCity(data.address),
    }
}

/* ─── Forward geocode (search) helper ─── */
async function forwardGeocode(query) {
    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`
    return nominatimFetch(url)
}

/* ────────────────────────────────────────────────
   MapClickHandler — sub-component for click events
   ──────────────────────────────────────────────── */
function MapClickHandler({ onClick }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng)
        },
    })
    return null
}

/* ────────────────────────────────────────────────
   MapFlyTo — imperatively fly the map to a position
   Uses a counter-based key to trigger re-fly
   ──────────────────────────────────────────────── */
function MapFlyTo({ lat, lng, zoom, flyKey }) {
    const map = useMap()
    const lastFlyRef = useRef(null)

    useEffect(() => {
        if (lat != null && lng != null && flyKey !== lastFlyRef.current) {
            lastFlyRef.current = flyKey
            map.flyTo([lat, lng], zoom, { duration: 1.2 })
        }
    }, [lat, lng, zoom, flyKey, map])

    return null
}

/* ────────────────────────────────────────────────
   DraggableMarker — draggable marker sub-component
   ──────────────────────────────────────────────── */
function DraggableMarker({ position, onDragEnd }) {
    const markerRef = useRef(null)

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current
                if (marker) {
                    onDragEnd(marker.getLatLng())
                }
            },
        }),
        [onDragEnd]
    )

    return (
        <Marker
            draggable
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    )
}

/**
 * LocationPicker — OpenStreetMap + Leaflet + Nominatim
 *
 * Props (same interface as previous Google Maps version):
 * - address, onAddressChange
 * - onCityChange
 * - onCoordsChange(lat, lng)
 * - showRadius (boolean) — for NGO only
 * - radius (km), onRadiusChange
 */
export default function LocationPicker({
    address = '',
    onAddressChange,
    onCityChange,
    onCoordsChange,
    showRadius = false,
    radius = 10,
    onRadiusChange,
}) {
    const [markerPos, setMarkerPos] = useState(null)
    const [flyTarget, setFlyTarget] = useState({ lat: null, lng: null, zoom: 15, key: 0 })
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState('')
    const [showResults, setShowResults] = useState(false)
    const [isGeocoding, setIsGeocoding] = useState(false)

    const searchTimeoutRef = useRef(null)
    const resultsRef = useRef(null)
    const flyKeyRef = useRef(0)

    /* ── Close dropdown when clicking outside ── */
    useEffect(() => {
        function handleClickOutside(e) {
            if (resultsRef.current && !resultsRef.current.contains(e.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    /* ── Handle setting a location (from click, drag, or search) ── */
    const handleSetLocation = useCallback(
        async (lat, lng, skipReverseGeocode = false, addressData = null) => {
            setMarkerPos([lat, lng])
            flyKeyRef.current += 1
            setFlyTarget({ lat, lng, zoom: 15, key: flyKeyRef.current })
            onCoordsChange?.(lat, lng)

            if (skipReverseGeocode && addressData) {
                onAddressChange?.(addressData.address)
                onCityChange?.(addressData.city)
            } else {
                setIsGeocoding(true)
                try {
                    const result = await reverseGeocode(lat, lng)
                    onAddressChange?.(result.address)
                    onCityChange?.(result.city)
                } catch {
                    // Silently fail; coordinates are still set
                } finally {
                    setIsGeocoding(false)
                }
            }
        },
        [onAddressChange, onCityChange, onCoordsChange]
    )

    /* ── Map click handler ── */
    const handleMapClick = useCallback(
        (latlng) => {
            handleSetLocation(latlng.lat, latlng.lng)
        },
        [handleSetLocation]
    )

    /* ── Marker drag end ── */
    const handleMarkerDragEnd = useCallback(
        (latlng) => {
            handleSetLocation(latlng.lat, latlng.lng)
        },
        [handleSetLocation]
    )

    /* ── Search with debounce ── */
    const handleSearchChange = useCallback((e) => {
        const value = e.target.value
        setSearchQuery(value)
        setSearchError('')

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

        if (value.trim().length < 3) {
            setSearchResults([])
            setShowResults(false)
            return
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true)
            try {
                const results = await forwardGeocode(value)
                setSearchResults(results)
                setShowResults(results.length > 0)
                if (results.length === 0) {
                    setSearchError('No locations found. Try a different search.')
                }
            } catch {
                setSearchError('Search failed. Please try again.')
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }, 600)
    }, [])

    /* ── Search on Enter key ── */
    const handleSearchKeyDown = useCallback(
        async (e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()

            if (searchQuery.trim().length < 2) return

            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

            setIsSearching(true)
            setSearchError('')
            try {
                const results = await forwardGeocode(searchQuery)
                setSearchResults(results)
                setShowResults(results.length > 0)
                if (results.length === 0) {
                    setSearchError('No locations found. Try a different search.')
                } else {
                    // Auto-select first result
                    const first = results[0]
                    const lat = parseFloat(first.lat)
                    const lng = parseFloat(first.lon)
                    handleSetLocation(lat, lng, true, {
                        address: first.display_name,
                        city: extractCity(first.address),
                    })
                    setShowResults(false)
                    setSearchQuery(first.display_name)
                }
            } catch {
                setSearchError('Search failed. Please try again.')
            } finally {
                setIsSearching(false)
            }
        },
        [searchQuery, handleSetLocation]
    )

    /* ── Select a search result ── */
    const handleSelectResult = useCallback(
        (result) => {
            const lat = parseFloat(result.lat)
            const lng = parseFloat(result.lon)
            handleSetLocation(lat, lng, true, {
                address: result.display_name,
                city: extractCity(result.address),
            })
            setSearchQuery(result.display_name)
            setShowResults(false)
            setSearchResults([])
        },
        [handleSetLocation]
    )

    /* ── Cleanup timeout on unmount ── */
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        }
    }, [])

    const mapHeight = showRadius ? 450 : 400

    return (
        <div className="auth-location-picker">
            {/* Search bar */}
            <div className="auth-input-group auth-input-group--search" ref={resultsRef}>
                <label htmlFor="address-search">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: 6, verticalAlign: 'middle', opacity: 0.5 }}
                    >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    Address
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        id="address-search"
                        placeholder="Search for address… (e.g. Solapur, Maharashtra)"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        autoComplete="off"
                    />
                    {isSearching && (
                        <div className="auth-search-spinner">
                            <div className="auth-location-loading__spinner" />
                        </div>
                    )}

                    {/* Search results dropdown */}
                    {showResults && searchResults.length > 0 && (
                        <div className="auth-search-results">
                            {searchResults.map((result, idx) => (
                                <button
                                    key={`${result.place_id}-${idx}`}
                                    type="button"
                                    className="auth-search-result-item"
                                    onClick={() => handleSelectResult(result)}
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ flexShrink: 0, opacity: 0.4 }}
                                    >
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span>{result.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <span className="auth-input-line" />

                {searchError && (
                    <div className="auth-search-error">{searchError}</div>
                )}
            </div>

            {/* Current Location Button */}
            <div className="auth-location-actions" style={{ marginBottom: '1rem' }}>
                <button
                    type="button"
                    className="auth-btn-outline"
                    onClick={() => {
                        if (!navigator.geolocation) {
                            alert('Geolocation is not supported by your browser')
                            return
                        }
                        setIsGeocoding(true)
                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                const { latitude, longitude } = position.coords
                                handleSetLocation(latitude, longitude)
                            },
                            (error) => {
                                console.error('Geolocation error:', error)
                                setIsGeocoding(false)
                                alert('Unable to retrieve your location')
                            }
                        )
                    }}
                    disabled={isGeocoding}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '14px' }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    {isGeocoding ? 'Detecting...' : 'Use Current Location'}
                </button>
            </div>

            {/* Address confirmation */}
            {address && (
                <div className="auth-address-confirmation">
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--tundora)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{address}</span>
                    {isGeocoding && <span className="auth-geocoding-tag">Updating…</span>}
                </div>
            )}

            {/* Interactive Map — always visible, centered on Solapur by default */}
            <div className="auth-map-container">
                <MapContainer
                    center={DEFAULT_CENTER}
                    zoom={DEFAULT_ZOOM}
                    className="auth-map"
                    style={{ height: `${mapHeight}px`, width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapClickHandler onClick={handleMapClick} />

                    <MapFlyTo
                        lat={flyTarget.lat}
                        lng={flyTarget.lng}
                        zoom={flyTarget.zoom}
                        flyKey={flyTarget.key}
                    />

                    {markerPos && (
                        <DraggableMarker
                            position={markerPos}
                            onDragEnd={handleMarkerDragEnd}
                        />
                    )}

                    {showRadius && markerPos && (
                        <Circle
                            center={markerPos}
                            radius={radius * 1000}
                            pathOptions={{
                                color: '#443c3c',
                                weight: 2,
                                opacity: 0.3,
                                fillColor: '#443c3c',
                                fillOpacity: 0.08,
                            }}
                        />
                    )}
                </MapContainer>

                <div className="auth-map-hint">
                    <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ opacity: 0.5 }}
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Click on the map or drag the marker to set your location
                </div>
            </div>

            {/* Radius Slider (NGO only) */}
            {showRadius && (
                <div className="auth-radius-control">
                    <div className="auth-radius-control__header">
                        <label htmlFor="service-radius">Service Radius</label>
                        <span className="auth-radius-control__value">{radius} km</span>
                    </div>
                    <input
                        type="range"
                        id="service-radius"
                        min="5"
                        max="50"
                        step="1"
                        value={radius}
                        onChange={(e) => onRadiusChange?.(Number(e.target.value))}
                        className="auth-radius-slider"
                    />
                    <div className="auth-radius-control__ticks">
                        <span>5 km</span>
                        <span>25 km</span>
                        <span>50 km</span>
                    </div>
                </div>
            )}

            {/* Hidden inputs for form submission */}
            <input type="hidden" name="address" value={address || ''} />
            <input type="hidden" name="latitude" value={markerPos ? markerPos[0] : ''} />
            <input type="hidden" name="longitude" value={markerPos ? markerPos[1] : ''} />
            {showRadius && <input type="hidden" name="service_radius_km" value={radius} />}
        </div>
    )
}
