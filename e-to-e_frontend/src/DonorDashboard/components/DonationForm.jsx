import { useState, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { playSuccessAnimation } from '../animations/dashboardAnimations'
import { createListing } from '../../lib/donorApi'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* Fix Leaflet default marker icon */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const FOOD_TYPES = [
    'Cooked Meals',
    'Raw Vegetables',
    'Packaged Food',
    'Bakery Items',
    'Dairy Products',
    'Fruits',
    'Grains & Cereals',
    'Beverages',
    'Other',
]

const PACKAGING_TYPES = [
    'Sealed Containers',
    'Aluminium Foil',
    'Plastic Wrap',
    'Cardboard Box',
    'Thermal Bag',
    'None / Open',
]

/* ── MapPicker sub-component ── */
function MapClickHandler({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng)
        },
    })
    return null
}

export default function DonationForm({ onSuccess }) {
    const [form, setForm] = useState({
        food_type: '',
        quantity_kg: '',
        meal_equivalent: '',
        packaging_type: '',
        expiry_time: '',
        pickup_address: '',
        latitude: null,
        longitude: null,
        special_instructions: '',
    })
    const [markerPos, setMarkerPos] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const submitBtnRef = useRef(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    /* ── Reverse geocode via backend proxy ── */
    const reverseGeocode = useCallback(async (lat, lng) => {
        try {
            const res = await fetch(
                `${API_URL}/geocode/reverse?format=json&lat=${lat}&lon=${lng}`
            )
            const data = await res.json()
            return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        } catch {
            return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        }
    }, [])

    const handleMapClick = useCallback(
        async (latlng) => {
            setMarkerPos(latlng)
            setForm((prev) => ({
                ...prev,
                latitude: latlng.lat,
                longitude: latlng.lng,
            }))
            const address = await reverseGeocode(latlng.lat, latlng.lng)
            setForm((prev) => ({ ...prev, pickup_address: address }))
        },
        [reverseGeocode]
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        // Validation
        if (
            !form.food_type ||
            !form.quantity_kg ||
            !form.meal_equivalent ||
            !form.expiry_time ||
            !form.pickup_address ||
            !form.latitude ||
            !form.longitude
        ) {
            setError('Please fill all required fields and select a location on the map.')
            return
        }

        setSubmitting(true)
        try {
            await createListing({
                food_type: form.food_type,
                quantity_kg: parseFloat(form.quantity_kg),
                meal_equivalent: parseInt(form.meal_equivalent, 10),
                packaging_type: form.packaging_type || null,
                expiry_time: form.expiry_time,
                pickup_address: form.pickup_address,
                latitude: form.latitude,
                longitude: form.longitude,
                special_instructions: form.special_instructions || null,
            })

            playSuccessAnimation(submitBtnRef.current)
            setSuccess(true)

            // Reset form
            setForm({
                food_type: '',
                quantity_kg: '',
                meal_equivalent: '',
                packaging_type: '',
                expiry_time: '',
                pickup_address: '',
                latitude: null,
                longitude: null,
                special_instructions: '',
            })
            setMarkerPos(null)

            if (onSuccess) onSuccess()

            setTimeout(() => setSuccess(false), 4000)
        } catch (err) {
            // Map technical error messages to user-friendly ones
            const rawMsg = err?.message || err?.error || ''
            let userMsg = 'Something went wrong while creating your donation. Please try again.'

            if (rawMsg.includes('stack depth') || rawMsg.includes('recursion')) {
                userMsg = 'We are experiencing a temporary server issue. Please try again in a moment.'
            } else if (rawMsg.includes('Donor profile not found')) {
                userMsg = 'Your donor profile was not found. Please log out and register again.'
            } else if (rawMsg.includes('Missing required fields')) {
                userMsg = 'Please fill in all required fields before submitting.'
            } else if (rawMsg.includes('Failed to create listing')) {
                userMsg = 'Could not create your donation listing. Please check your details and try again.'
            } else if (rawMsg.includes('network') || rawMsg.includes('fetch')) {
                userMsg = 'Unable to reach the server. Please check your internet connection.'
            } else if (rawMsg && rawMsg.length < 100) {
                userMsg = rawMsg
            }

            setError(userMsg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form className="dd-donation-form" onSubmit={handleSubmit} id="donation-form">
            <div className="dd-form-grid">
                {/* Food Type */}
                <div className="dd-form-group">
                    <label htmlFor="food_type" className="dd-form-label">
                        Food Type *
                    </label>
                    <select
                        id="food_type"
                        name="food_type"
                        className="dd-form-select"
                        value={form.food_type}
                        onChange={handleChange}
                    >
                        <option value="">Select food type</option>
                        {FOOD_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quantity */}
                <div className="dd-form-group">
                    <label htmlFor="quantity_kg" className="dd-form-label">
                        Quantity (kg) *
                    </label>
                    <input
                        id="quantity_kg"
                        name="quantity_kg"
                        type="number"
                        min="0.5"
                        step="0.5"
                        className="dd-form-input"
                        placeholder="e.g. 5"
                        value={form.quantity_kg}
                        onChange={handleChange}
                    />
                </div>

                {/* Meal Equivalent */}
                <div className="dd-form-group">
                    <label htmlFor="meal_equivalent" className="dd-form-label">
                        Meal Equivalent *
                    </label>
                    <input
                        id="meal_equivalent"
                        name="meal_equivalent"
                        type="number"
                        min="1"
                        className="dd-form-input"
                        placeholder="Number of meals"
                        value={form.meal_equivalent}
                        onChange={handleChange}
                    />
                </div>

                {/* Packaging Type */}
                <div className="dd-form-group">
                    <label htmlFor="packaging_type" className="dd-form-label">
                        Packaging Type
                    </label>
                    <select
                        id="packaging_type"
                        name="packaging_type"
                        className="dd-form-select"
                        value={form.packaging_type}
                        onChange={handleChange}
                    >
                        <option value="">Select packaging</option>
                        {PACKAGING_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Expiry Time */}
                <div className="dd-form-group">
                    <label htmlFor="expiry_time" className="dd-form-label">
                        Expiry Time *
                    </label>
                    <input
                        id="expiry_time"
                        name="expiry_time"
                        type="datetime-local"
                        className="dd-form-input"
                        value={form.expiry_time}
                        onChange={handleChange}
                    />
                </div>

                {/* Special Instructions */}
                <div className="dd-form-group dd-form-group--full">
                    <label htmlFor="special_instructions" className="dd-form-label">
                        Special Instructions
                    </label>
                    <textarea
                        id="special_instructions"
                        name="special_instructions"
                        rows="3"
                        className="dd-form-textarea"
                        placeholder="Any notes about handling, allergies, etc."
                        value={form.special_instructions}
                        onChange={handleChange}
                    />
                </div>

                {/* Map Picker */}
                {/* Divider before map */}
                <div className="dd-form-divider" />

                <div className="dd-form-group dd-form-group--full">
                    <label className="dd-form-label">
                        Pickup Location * — Click the map
                    </label>
                    <div className="dd-map-picker-wrapper">
                        <MapContainer
                            center={[17.6599, 75.9064]}
                            zoom={13}
                            className="dd-map-picker"
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <MapClickHandler onMapClick={handleMapClick} />
                            {markerPos && <Marker position={markerPos} />}
                        </MapContainer>
                    </div>
                    {form.pickup_address && (
                        <div className="dd-map-address">
                            <span className="dd-map-address__icon">—</span>
                            <span className="dd-map-address__text">{form.pickup_address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback */}
            {error && <div className="dd-form-error">{error}</div>}
            {success && (
                <div className="dd-form-success">
                    ✓ Donation created successfully! Thank you for your generosity.
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                className="btn btn--primary dd-form-submit"
                disabled={submitting}
                ref={submitBtnRef}
            >
                {submitting ? 'Creating Donation…' : 'Create Donation'}
            </button>
        </form>
    )
}
