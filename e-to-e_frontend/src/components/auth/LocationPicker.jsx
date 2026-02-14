import { useRef, useEffect, useState, useCallback } from 'react'
import { useJsApiLoader, GoogleMap, Marker, Circle } from '@react-google-maps/api'

const LIBRARIES = ['places']

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#f5f0ed' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#443c3c' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e8e1de' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#d4ccca' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8d6e5' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dce8d4' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

const MAP_OPTIONS = {
    styles: MAP_STYLES,
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 } // India center
const DEFAULT_ZOOM = 5

/**
 * LocationPicker — Google Places Autocomplete + Interactive Map + Radius Circle
 *
 * Props:
 * - address, onAddressChange
 * - city, onCityChange
 * - lat, lng, onCoordsChange
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
    const autocompleteInputRef = useRef(null)
    const autocompleteRef = useRef(null)
    const mapRef = useRef(null)

    const [markerPos, setMarkerPos] = useState(null)
    const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER)
    const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
    const [isMapVisible, setIsMapVisible] = useState(false)

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
    })

    // Initialize Autocomplete
    useEffect(() => {
        if (!isLoaded || !autocompleteInputRef.current) return

        const autocomplete = new window.google.maps.places.Autocomplete(
            autocompleteInputRef.current,
            {
                types: ['geocode', 'establishment'],
                componentRestrictions: { country: 'in' },
                fields: ['formatted_address', 'geometry', 'address_components'],
            }
        )

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()

            if (!place.geometry?.location) return

            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const formattedAddress = place.formatted_address || ''

            // Extract city from address components
            let city = ''
            if (place.address_components) {
                for (const component of place.address_components) {
                    if (component.types.includes('locality')) {
                        city = component.long_name
                        break
                    }
                    if (component.types.includes('administrative_area_level_2')) {
                        city = component.long_name
                    }
                }
            }

            onAddressChange?.(formattedAddress)
            onCityChange?.(city)
            onCoordsChange?.(lat, lng)

            setMarkerPos({ lat, lng })
            setMapCenter({ lat, lng })
            setMapZoom(15)
            setIsMapVisible(true)
        })

        autocompleteRef.current = autocomplete

        return () => {
            window.google.maps.event.clearInstanceListeners(autocomplete)
        }
    }, [isLoaded, onAddressChange, onCityChange, onCoordsChange])

    // Marker drag end handler
    const handleMarkerDragEnd = useCallback(
        (e) => {
            const lat = e.latLng.lat()
            const lng = e.latLng.lng()

            setMarkerPos({ lat, lng })
            onCoordsChange?.(lat, lng)

            // Reverse geocode to update address
            if (window.google) {
                const geocoder = new window.google.maps.Geocoder()
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        onAddressChange?.(results[0].formatted_address)

                        // Extract city
                        let city = ''
                        for (const comp of results[0].address_components) {
                            if (comp.types.includes('locality')) {
                                city = comp.long_name
                                break
                            }
                            if (comp.types.includes('administrative_area_level_2')) {
                                city = comp.long_name
                            }
                        }
                        onCityChange?.(city)
                    }
                })
            }
        },
        [onAddressChange, onCityChange, onCoordsChange]
    )

    const onMapLoad = useCallback((map) => {
        mapRef.current = map
    }, [])

    if (loadError) {
        return (
            <div className="auth-location-error">
                <p>Failed to load Google Maps. Check your API key.</p>
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="auth-location-loading">
                <div className="auth-location-loading__spinner" />
                <span>Loading Maps…</span>
            </div>
        )
    }

    return (
        <div className="auth-location-picker">
            {/* Autocomplete Search */}
            <div className="auth-input-group auth-input-group--search">
                <label htmlFor="address-autocomplete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle', opacity: 0.5 }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                    </svg>
                    Address
                </label>
                <input
                    ref={autocompleteInputRef}
                    type="text"
                    id="address-autocomplete"
                    placeholder="Start typing your address…"
                    defaultValue={address}
                    autoComplete="off"
                />
                <span className="auth-input-line" />
            </div>

            {/* Address confirmation */}
            {address && (
                <div className="auth-address-confirmation">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tundora)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{address}</span>
                </div>
            )}

            {/* Interactive Map */}
            {isMapVisible && markerPos && (
                <div className="auth-map-container">
                    <GoogleMap
                        mapContainerClassName="auth-map"
                        center={mapCenter}
                        zoom={mapZoom}
                        options={MAP_OPTIONS}
                        onLoad={onMapLoad}
                    >
                        <Marker
                            position={markerPos}
                            draggable
                            onDragEnd={handleMarkerDragEnd}
                            animation={window.google.maps.Animation.DROP}
                        />

                        {showRadius && (
                            <Circle
                                center={markerPos}
                                radius={radius * 1000}
                                options={{
                                    strokeColor: '#443c3c',
                                    strokeOpacity: 0.3,
                                    strokeWeight: 2,
                                    fillColor: '#443c3c',
                                    fillOpacity: 0.08,
                                }}
                            />
                        )}
                    </GoogleMap>

                    <div className="auth-map-hint">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        Drag the marker to fine-tune your location
                    </div>
                </div>
            )}

            {/* Radius Slider (NGO only) */}
            {showRadius && isMapVisible && (
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
        </div>
    )
}
