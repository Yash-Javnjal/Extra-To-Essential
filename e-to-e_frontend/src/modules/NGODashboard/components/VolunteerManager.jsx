import { useState, useEffect, useCallback } from 'react'
import { useNGO } from '../context/NGOContext'
import { animateRowsStagger, animateButtonPress } from '../animations/ngoAnimations'

// vehicle_type enum from DB: 'bike', 'scooter', 'car', 'van', 'truck'
const VEHICLE_TYPES = ['bike', 'scooter', 'car', 'van', 'truck']

const INITIAL_FORM = {
    full_name: '',
    phone: '',
    vehicle_type: '',
}

export default function VolunteerManager() {
    const {
        volunteers,
        deliveries,
        loading,
        errors,
        handleAddVolunteer,
        handleUpdateVolunteer,
        handleRemoveVolunteer,
        fetchVolunteers,
    } = useNGO()

    const [form, setForm] = useState(INITIAL_FORM)
    const [formError, setFormError] = useState('')
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        if (!loading.volunteers && volunteers.length > 0) {
            animateRowsStagger('.ngo-vol-row')
        }
    }, [volunteers, loading.volunteers])

    /* Find current assignment for a volunteer */
    function getCurrentAssignment(volunteerId) {
        const active = deliveries.find(
            (d) =>
                d.volunteer_id === volunteerId &&
                ['assigned', 'in_transit'].includes(d.delivery_status)
        )
        if (!active) return null
        const foodType = active.ngo_claims?.food_listings?.food_type || 'Delivery'
        return `${foodType} (${active.delivery_status?.replace('_', ' ')})`
    }

    function handleFormChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        setFormError('')
    }

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault()
            if (!form.full_name.trim() || !form.phone.trim()) {
                setFormError('Name and phone are required')
                return
            }

            try {
                if (editingId) {
                    await handleUpdateVolunteer(editingId, {
                        full_name: form.full_name,
                        phone: form.phone,
                        vehicle_type: form.vehicle_type || null,
                    })
                    setEditingId(null)
                } else {
                    await handleAddVolunteer({
                        full_name: form.full_name,
                        phone: form.phone,
                        vehicle_type: form.vehicle_type || null,
                    })
                }
                setForm(INITIAL_FORM)
            } catch {
                /* handled in context */
            }
        },
        [form, editingId, handleAddVolunteer, handleUpdateVolunteer]
    )

    function startEdit(vol) {
        setEditingId(vol.volunteer_id)
        setForm({
            full_name: vol.full_name,
            phone: vol.phone,
            vehicle_type: vol.vehicle_type || '',
        })
    }

    function cancelEdit() {
        setEditingId(null)
        setForm(INITIAL_FORM)
    }

    const handleDelete = useCallback(
        async (volunteerId, e) => {
            animateButtonPress(e.currentTarget)
            if (!window.confirm('Remove this volunteer?')) return
            try {
                await handleRemoveVolunteer(volunteerId)
            } catch {
                /* handled in context */
            }
        },
        [handleRemoveVolunteer]
    )

    const handleToggleAvailability = useCallback(
        async (vol, e) => {
            animateButtonPress(e.currentTarget)
            try {
                await handleUpdateVolunteer(vol.volunteer_id, {
                    availability_status: !vol.availability_status,
                })
            } catch {
                /* handled in context */
            }
        },
        [handleUpdateVolunteer]
    )

    return (
        <div className="ngo-volunteer-module">
            {/* Add / Edit Form */}
            <form className="ngo-vol-form ngo-scroll-form" onSubmit={handleSubmit}>
                <h4 className="ngo-form-title">{editingId ? 'Edit Volunteer' : 'Add Volunteer'}</h4>
                <div className="ngo-form-grid">
                    <div className="ngo-form-group">
                        <label htmlFor="vol-name">Full Name *</label>
                        <input
                            id="vol-name"
                            name="full_name"
                            type="text"
                            className="ngo-input"
                            value={form.full_name}
                            onChange={handleFormChange}
                            placeholder="Volunteer name"
                            required
                        />
                    </div>
                    <div className="ngo-form-group">
                        <label htmlFor="vol-phone">Phone *</label>
                        <input
                            id="vol-phone"
                            name="phone"
                            type="tel"
                            className="ngo-input"
                            value={form.phone}
                            onChange={handleFormChange}
                            placeholder="+91 XXXXXXXXXX"
                            required
                        />
                    </div>
                    <div className="ngo-form-group">
                        <label htmlFor="vol-vehicle">Vehicle Type</label>
                        <select
                            id="vol-vehicle"
                            name="vehicle_type"
                            className="ngo-select"
                            value={form.vehicle_type}
                            onChange={handleFormChange}
                        >
                            <option value="">None</option>
                            {VEHICLE_TYPES.map((v) => (
                                <option key={v} value={v}>
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {formError && <p className="ngo-form-error">{formError}</p>}
                <div className="ngo-form-actions">
                    <button
                        type="submit"
                        className="ngo-btn ngo-btn--primary"
                        disabled={loading.action}
                    >
                        {editingId ? 'Update' : 'Add Volunteer'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            className="ngo-btn ngo-btn--ghost"
                            onClick={cancelEdit}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Volunteer Table */}
            {loading.volunteers && volunteers.length === 0 ? (
                <div className="ngo-table-wrap">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="ngo-skeleton-row"><div className="ngo-skeleton-line" /></div>
                    ))}
                </div>
            ) : errors.volunteers ? (
                <div className="ngo-error-state">
                    <span className="ngo-error-state__icon">⚠</span>
                    <p>{errors.volunteers}</p>
                    <button className="ngo-btn ngo-btn--outline" onClick={fetchVolunteers}>Retry</button>
                </div>
            ) : volunteers.length === 0 ? (
                <div className="ngo-empty-state">
                    <span className="ngo-empty-state__icon">◉</span>
                    <h4>No volunteers yet</h4>
                    <p>Add your first volunteer using the form above.</p>
                </div>
            ) : (
                <div className="ngo-table-wrap ngo-scroll-table">
                    <table className="ngo-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Vehicle</th>
                                <th>Availability</th>
                                <th>Current Assignment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {volunteers.map((vol) => {
                                const assignment = getCurrentAssignment(vol.volunteer_id)
                                return (
                                    <tr key={vol.volunteer_id} className="ngo-vol-row">
                                        <td className="ngo-cell-main">{vol.full_name}</td>
                                        <td>{vol.phone}</td>
                                        <td>
                                            {vol.vehicle_type
                                                ? vol.vehicle_type.charAt(0).toUpperCase() + vol.vehicle_type.slice(1)
                                                : '—'}
                                        </td>
                                        <td>
                                            <button
                                                className={`ngo-avail-toggle ${vol.availability_status ? 'ngo-avail-toggle--on' : ''
                                                    }`}
                                                onClick={(e) => handleToggleAvailability(vol, e)}
                                                disabled={loading.action}
                                            >
                                                {vol.availability_status ? 'Available' : 'Unavailable'}
                                            </button>
                                        </td>
                                        <td>
                                            {assignment ? (
                                                <span className="ngo-badge ngo-badge--info">{assignment}</span>
                                            ) : (
                                                <span className="ngo-cell-sub">Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="ngo-action-btns">
                                                <button
                                                    className="ngo-btn ngo-btn--sm ngo-btn--outline"
                                                    onClick={() => startEdit(vol)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="ngo-btn ngo-btn--sm ngo-btn--ghost"
                                                    onClick={(e) => handleDelete(vol.volunteer_id, e)}
                                                    disabled={loading.action}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
