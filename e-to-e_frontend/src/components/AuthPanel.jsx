import { useEffect, useRef, forwardRef, useState } from 'react'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, createDonorProfile, createNGOProfile } from '../lib/api'
import StepIndicator from './auth/StepIndicator'
import RoleSelector from './auth/RoleSelector'
import LocationPicker from './auth/LocationPicker'

/* ─── Country Codes Data ─── */
const COUNTRY_CODES = [
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+61', country: 'Australia', flag: '🇦🇺' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+49', country: 'Germany', flag: '🇩🇪' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+971', country: 'UAE', flag: '🇦🇪' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+55', country: 'Brazil', flag: '🇧🇷' },
    { code: '+7', country: 'Russia', flag: '🇷🇺' },
]

/* ─── Password Eye Icon SVGs ─── */
const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
)

/* ─────────────────────────────────────────────
   LOGIN FORM
   ───────────────────────────────────────────── */
export const LoginForm = forwardRef(function LoginForm({ onToggle }, ref) {
    const headingRef = useRef(null)
    const subtitleRef = useRef(null)
    const fieldsRef = useRef(null)
    const btnRef = useRef(null)
    const toggleRef = useRef(null)

    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ delay: 0.5 })

            // Heading character reveal
            const chars = headingRef.current?.querySelectorAll('.char')
            if (chars?.length) {
                tl.fromTo(
                    chars,
                    { y: 40, opacity: 0, rotateX: -40 },
                    {
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        duration: 0.8,
                        ease: 'power3.out',
                        stagger: 0.035,
                    },
                    0
                )
            }

            // Subtitle
            tl.fromTo(
                subtitleRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
                0.35
            )

            // Fields stagger
            const inputs = fieldsRef.current?.children
            if (inputs?.length) {
                tl.fromTo(
                    inputs,
                    { y: 25, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.6,
                        ease: 'power3.out',
                        stagger: 0.1,
                    },
                    0.5
                )
            }

            // Button
            tl.fromTo(
                btnRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
                0.8
            )

            // Toggle link
            tl.fromTo(
                toggleRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.5, ease: 'power2.out' },
                0.95
            )
        })

        return () => ctx.revert()
    }, [])

    // Split title text into characters
    const titleChars = 'Welcome Back'.split('').map((char, i) => (
        <span className="char" key={i} style={{ display: 'inline-block' }}>
            {char === ' ' ? '\u00A0' : char}
        </span>
    ))

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')

        if (!email || !password) {
            setError('Please fill in all fields.')
            return
        }

        setLoading(true)
        try {
            const data = await loginUser({ email, password })
            const role = data.user?.role

            // Redirect based on role
            switch (role) {
                case 'admin':
                    navigate('/admin-dashboard')
                    break
                case 'ngo':
                    navigate('/ngo-dashboard')
                    break
                case 'donor':
                    navigate('/donor-dashboard')
                    break
                case 'volunteer':
                    navigate('/ngo-dashboard')
                    break
                default:
                    navigate('/')
            }
        } catch (err) {
            setError(err.message || 'Login failed. Check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-form-block" ref={ref}>
            <h1 className="auth-heading" ref={headingRef}>
                {titleChars}
            </h1>
            <p className="auth-subtitle" ref={subtitleRef}>
                Continue your mission of impact.
            </p>

            {error && <div className="auth-error-msg">{error}</div>}



            <form onSubmit={handleLogin}>

                <div className="auth-fields" ref={fieldsRef}>
                    <div className="auth-input-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            type="email"
                            id="login-email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <span className="auth-input-line" />
                    </div>

                    <div className="auth-input-group">
                        <label htmlFor="login-password">Password</label>
                        <div className="auth-password-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="login-password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        <span className="auth-input-line" />
                    </div>
                </div>

                <button
                    className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                    ref={btnRef}
                    type="submit"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="auth-btn-spinner" />
                    ) : (
                        'Login'
                    )}
                </button>
            </form>

            <div className="auth-toggle" ref={toggleRef}>
                Don't have an account?
                <button
                    className="auth-toggle-link"
                    type="button"
                    onClick={onToggle}
                >
                    Create one
                </button>
            </div>
        </div>
    )
})

/* ─────────────────────────────────────────────
   REGISTER FORM — Multi-Step
   ───────────────────────────────────────────── */
export const RegisterForm = forwardRef(function RegisterForm(
    { onToggle },
    ref
) {
    const navigate = useNavigate()

    /* Step state */
    const [step, setStep] = useState(1) // 1 = common, 2 = role-specific

    /* Step 1 fields */
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [countryCode, setCountryCode] = useState('+91')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [organizationName, setOrganizationName] = useState('')
    const [role, setRole] = useState('donor')

    /* Step 2 — Donor fields */
    const [businessType, setBusinessType] = useState('')
    const [donorAddress, setDonorAddress] = useState('')
    const [donorCity, setDonorCity] = useState('')
    const [donorLat, setDonorLat] = useState(null)
    const [donorLng, setDonorLng] = useState(null)
    const [csrParticipant, setCsrParticipant] = useState(false)

    /* Step 2 — NGO fields */
    const [ngoName, setNgoName] = useState('')
    const [registrationNumber, setRegistrationNumber] = useState('')
    const [contactPerson, setContactPerson] = useState('')
    const [ngoAddress, setNgoAddress] = useState('')
    const [ngoCity, setNgoCity] = useState('')
    const [ngoLat, setNgoLat] = useState(null)
    const [ngoLng, setNgoLng] = useState(null)
    const [serviceRadius, setServiceRadius] = useState(10)

    /* Step 2 — Volunteer fields */
    const [volunteerAddress, setVolunteerAddress] = useState('')
    const [volunteerCity, setVolunteerCity] = useState('')
    const [volunteerLat, setVolunteerLat] = useState(null)
    const [volunteerLng, setVolunteerLng] = useState(null)
    const [availability, setAvailability] = useState('weekends')
    const [hasVehicle, setHasVehicle] = useState(false)

    /* General UI state */
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [registeredUserId, setRegisteredUserId] = useState(null)

    /* Refs for GSAP animations */
    const step2Ref = useRef(null)

    // Split title text into characters
    const step1TitleChars = 'Join Movement'.split('').map((char, i) => (
        <span className="char" key={i} style={{ display: 'inline-block' }}>
            {char === ' ' ? '\u00A0' : char}
        </span>
    ))

    const step2Titles = {
        donor: 'Donor Profile',
        ngo: 'NGO Profile',
        volunteer: 'Volunteer Profile',
        admin: 'Almost Done',
    }

    const step2TitleChars = (step2Titles[role] || 'Profile').split('').map((char, i) => (
        <span className="char" key={i} style={{ display: 'inline-block' }}>
            {char === ' ' ? '\u00A0' : char}
        </span>
    ))

    // Whether the non-India warning should show
    const showCountryWarning = countryCode !== '+91'

    /* ── Step 1 Validation & Submit ── */
    const handleStep1Submit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        const hasOrg = ['donor', 'ngo'].includes(role)
        if (!fullName || !email || !password || !confirmPassword || !phoneNumber) {
            setError('Please fill in all fields.')
            return
        }
        if (hasOrg && !organizationName) {
            setError('Please fill in the organization name.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        const phone = `${countryCode} ${phoneNumber}`

        // For admin — no step 2 needed, register directly
        if (role === 'admin') {
            setLoading(true)
            try {
                const data = await registerUser({
                    full_name: fullName,
                    email,
                    password,
                    phone,
                    role,
                    organization_name: organizationName || null,
                })
                setRegisteredUserId(data.user?.id)
                // Navigate to step 2 to show success
                setStep(2)
            } catch (err) {
                setError(err.message || 'Registration failed.')
            } finally {
                setLoading(false)
            }
            return
        }

        // For donor/ngo/volunteer — register user first, then go to step 2
        setLoading(true)
        try {
            const data = await registerUser({
                full_name: fullName,
                email,
                password,
                phone,
                role,
                organization_name: organizationName || null,
            })
            setRegisteredUserId(data.user?.id)
            setStep(2)

            // Animate step 2 entrance
            requestAnimationFrame(() => {
                if (step2Ref.current) {
                    const fields = step2Ref.current.querySelectorAll('.auth-input-group, .auth-location-picker, .auth-checkbox-group, .auth-role-specific-section')
                    if (fields.length) {
                        gsap.fromTo(
                            fields,
                            { y: 25, opacity: 0 },
                            {
                                y: 0,
                                opacity: 1,
                                duration: 0.5,
                                ease: 'power3.out',
                                stagger: 0.08,
                            }
                        )
                    }
                }
            })
        } catch (err) {
            setError(err.message || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    /* ── Step 2 — Donor Submit ── */
    const handleDonorSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!donorAddress || !donorCity || donorLat == null || donorLng == null) {
            setError('Please select an address from the suggestions.')
            return
        }

        if (!businessType) {
            setError('Please select a business type.')
            return
        }

        setLoading(true)
        try {
            await createDonorProfile({
                business_type: businessType,
                address: donorAddress,
                city: donorCity,
                latitude: donorLat,
                longitude: donorLng,
                csr_participant: csrParticipant,
            })
            navigate('/donor-dashboard')
        } catch (err) {
            setError(err.message || 'Failed to create donor profile.')
        } finally {
            setLoading(false)
        }
    }

    /* ── Step 2 — NGO Submit ── */
    const handleNGOSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!ngoName || !contactPerson) {
            setError('Please fill in NGO name and contact person.')
            return
        }
        if (!ngoAddress || !ngoCity || ngoLat == null || ngoLng == null) {
            setError('Please select an address from the suggestions.')
            return
        }

        setLoading(true)
        try {
            await createNGOProfile({
                ngo_name: ngoName,
                registration_number: registrationNumber || null,
                contact_person: contactPerson,
                address: ngoAddress,
                city: ngoCity,
                latitude: ngoLat,
                longitude: ngoLng,
                service_radius_km: serviceRadius,
            })
            navigate('/ngo-dashboard')
        } catch (err) {
            setError(err.message || 'Failed to create NGO profile.')
        } finally {
            setLoading(false)
        }
    }

    /* ── Step 2 — Volunteer Submit (redirect to dashboard, profile saved in user table) ── */
    const handleVolunteerComplete = () => {
        // Volunteers don't need a separate profile table entry for now
        // They are already registered with role=volunteer in profiles
        navigate('/ngo-dashboard')
    }

    /* ── Step 2 — Admin (already registered, just redirect) ── */
    const handleAdminComplete = () => {
        navigate('/admin-dashboard')
    }

    /* ── Render ── */
    const noStep2 = role === 'admin'
    const totalSteps = noStep2 ? 1 : 2
    const stepLabels = noStep2
        ? ['Account']
        : ['Account', role === 'donor' ? 'Donor Details' : role === 'ngo' ? 'NGO Details' : 'Volunteer Details']

    return (
        <div className="auth-form-block auth-form-block--hidden" ref={ref}>
            {/* Step Indicator */}
            {step === 1 && !noStep2 && (
                <StepIndicator currentStep={step} totalSteps={totalSteps} labels={stepLabels} />
            )}
            {step === 2 && (
                <StepIndicator currentStep={step} totalSteps={totalSteps} labels={stepLabels} />
            )}

            {/* ═══════════ STEP 1 — Common Registration ═══════════ */}
            {step === 1 && (
                <>
                    <h1 className="auth-heading">{step1TitleChars}</h1>
                    <p className="auth-subtitle">
                        Be part of climate-conscious food redistribution.
                    </p>

                    {error && <div className="auth-error-msg">{error}</div>}

                    <div className="auth-input-group">
                        <label>Select your Role</label>
                        <RoleSelector value={role} onChange={setRole} />
                    </div>

                    <form onSubmit={handleStep1Submit}>
                        <div className="auth-fields">
                            <div className="auth-input-group">
                                <label htmlFor="register-name">Full Name</label>
                                <input
                                    type="text"
                                    id="register-name"
                                    placeholder="Your full name"
                                    autoComplete="name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                                <span className="auth-input-line" />
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="register-email">Email</label>
                                <input
                                    type="email"
                                    id="register-email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <span className="auth-input-line" />
                            </div>

                            <div className="auth-fields-row">
                                <div className="auth-input-group">
                                    <label htmlFor="register-password">Password</label>
                                    <div className="auth-password-wrapper">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="register-password"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="auth-password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    <span className="auth-input-line" />
                                </div>

                                <div className="auth-input-group">
                                    <label htmlFor="register-confirm-password">Confirm Password</label>
                                    <div className="auth-password-wrapper">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="register-confirm-password"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="auth-password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    <span className="auth-input-line" />
                                </div>
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="register-phone">Phone Number</label>
                                <div className="auth-phone-wrapper">
                                    <select
                                        className="auth-phone-code"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        id="register-country-code"
                                    >
                                        {COUNTRY_CODES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.flag} {c.code}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="tel"
                                        id="register-phone"
                                        placeholder="00000 00000"
                                        autoComplete="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                </div>
                                {showCountryWarning && (
                                    <p className="auth-country-warning">
                                        ⚠ Currently this web application is only supported for India. In future, other countries will be added into the list.
                                    </p>
                                )}
                                <span className="auth-input-line" />
                            </div>

                            {/* Organization Name — only for donor & ngo */}
                            {['donor', 'ngo'].includes(role) && (
                                <div className="auth-input-group">
                                    <label htmlFor="register-org">Organization Name</label>
                                    <input
                                        type="text"
                                        id="register-org"
                                        placeholder="Your organization"
                                        autoComplete="organization"
                                        value={organizationName}
                                        onChange={(e) => setOrganizationName(e.target.value)}
                                    />
                                    <span className="auth-input-line" />
                                </div>
                            )}

                        </div>

                        <button
                            className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="auth-btn-spinner" />
                            ) : role === 'admin' ? (
                                'Create Admin Account'
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </form>

                    <div className="auth-toggle">
                        Already have an account?
                        <button
                            className="auth-toggle-link"
                            type="button"
                            onClick={onToggle}
                        >
                            Login
                        </button>
                    </div>
                </>
            )}

            {/* ═══════════ STEP 2 — DONOR ═══════════ */}
            {step === 2 && role === 'donor' && (
                <div ref={step2Ref}>
                    <button
                        type="button"
                        className="auth-back-btn"
                        onClick={() => setStep(1)}
                        disabled
                        title="You've already registered. Complete your profile."
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <h1 className="auth-heading">{step2TitleChars}</h1>
                    <p className="auth-subtitle">
                        Complete your donor profile to start donating surplus food.
                    </p>

                    {error && <div className="auth-error-msg">{error}</div>}

                    <form onSubmit={handleDonorSubmit}>
                        <div className="auth-fields">
                            {/* Business Type Dropdown */}
                            <div className="auth-input-group">
                                <label htmlFor="donor-business-type">Business Type</label>
                                <select
                                    id="donor-business-type"
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="auth-select"
                                >
                                    <option value="">Select business type</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="catering">Catering</option>
                                    <option value="hotel">Hotel</option>
                                    <option value="individual">Individual</option>
                                    <option value="other">Other</option>
                                </select>
                                <span className="auth-input-line" />
                            </div>

                            {/* Location Picker */}
                            <div className="auth-role-specific-section">
                                <LocationPicker
                                    address={donorAddress}
                                    onAddressChange={setDonorAddress}
                                    onCityChange={setDonorCity}
                                    onCoordsChange={(lat, lng) => {
                                        setDonorLat(lat)
                                        setDonorLng(lng)
                                    }}
                                />
                            </div>

                            {/* Hidden coordinate display */}
                            {donorLat && donorLng && (
                                <div className="auth-coords-display">
                                    <span className="auth-coords-badge">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" /></svg>
                                        {donorLat.toFixed(6)}, {donorLng.toFixed(6)}
                                    </span>
                                    {donorCity && <span className="auth-coords-city">{donorCity}</span>}
                                </div>
                            )}

                            {/* CSR Participant Checkbox */}
                            <div className="auth-checkbox-group">
                                <label className="auth-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={csrParticipant}
                                        onChange={(e) => setCsrParticipant(e.target.checked)}
                                        className="auth-checkbox"
                                    />
                                    <span className="auth-checkbox-custom" />
                                    <span className="auth-checkbox-text">
                                        CSR Participant
                                        <small>Enable if this is part of your Corporate Social Responsibility initiative</small>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <button
                            className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <span className="auth-btn-spinner" /> : 'Complete Registration'}
                        </button>
                    </form>
                </div>
            )}

            {/* ═══════════ STEP 2 — NGO ═══════════ */}
            {step === 2 && role === 'ngo' && (
                <div ref={step2Ref}>
                    <button
                        type="button"
                        className="auth-back-btn"
                        onClick={() => setStep(1)}
                        disabled
                        title="You've already registered. Complete your profile."
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>

                    <h1 className="auth-heading">{step2TitleChars}</h1>
                    <p className="auth-subtitle">
                        Set up your NGO to start receiving surplus food donations.
                    </p>

                    {error && <div className="auth-error-msg">{error}</div>}

                    <form onSubmit={handleNGOSubmit}>
                        <div className="auth-fields">
                            <div className="auth-input-group">
                                <label htmlFor="ngo-name">NGO Name</label>
                                <input
                                    type="text"
                                    id="ngo-name"
                                    placeholder="Your NGO name"
                                    value={ngoName}
                                    onChange={(e) => setNgoName(e.target.value)}
                                />
                                <span className="auth-input-line" />
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="ngo-regnumber">Registration Number <span className="auth-optional">(Optional)</span></label>
                                <input
                                    type="text"
                                    id="ngo-regnumber"
                                    placeholder="e.g. NGO-MH-2024-1234"
                                    value={registrationNumber}
                                    onChange={(e) => setRegistrationNumber(e.target.value)}
                                />
                                <span className="auth-input-line" />
                            </div>

                            <div className="auth-input-group">
                                <label htmlFor="ngo-contact">Contact Person Name</label>
                                <input
                                    type="text"
                                    id="ngo-contact"
                                    placeholder="Primary contact person"
                                    value={contactPerson}
                                    onChange={(e) => setContactPerson(e.target.value)}
                                />
                                <span className="auth-input-line" />
                            </div>

                            {/* Location Picker with Radius */}
                            <div className="auth-role-specific-section">
                                <LocationPicker
                                    address={ngoAddress}
                                    onAddressChange={setNgoAddress}
                                    onCityChange={setNgoCity}
                                    onCoordsChange={(lat, lng) => {
                                        setNgoLat(lat)
                                        setNgoLng(lng)
                                    }}
                                    showRadius
                                    radius={serviceRadius}
                                    onRadiusChange={setServiceRadius}
                                />
                            </div>

                            {/* Hidden coordinate display */}
                            {ngoLat && ngoLng && (
                                <div className="auth-coords-display">
                                    <span className="auth-coords-badge">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" /></svg>
                                        {ngoLat.toFixed(6)}, {ngoLng.toFixed(6)}
                                    </span>
                                    {ngoCity && <span className="auth-coords-city">{ngoCity}</span>}
                                </div>
                            )}
                        </div>

                        <button
                            className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? <span className="auth-btn-spinner" /> : 'Complete Registration'}
                        </button>
                    </form>
                </div>
            )}

            {/* ═══════════ STEP 2 — VOLUNTEER ═══════════ */}
            {step === 2 && role === 'volunteer' && (
                <div ref={step2Ref} className="auth-success-block">
                    <div className="auth-success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--tundora)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h1 className="auth-heading">{step2TitleChars}</h1>
                    <p className="auth-subtitle">
                        Your volunteer account has been created successfully. You can now join community drives and help with food distribution.
                    </p>
                    <button
                        className="auth-submit-btn"
                        type="button"
                        onClick={handleVolunteerComplete}
                    >
                        Go to Dashboard
                    </button>
                </div>
            )}

            {/* ═══════════ STEP 2 — ADMIN (Success) ═══════════ */}
            {step === 2 && role === 'admin' && (
                <div className="auth-success-block" ref={step2Ref}>
                    <div className="auth-success-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--tundora)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h1 className="auth-heading">{step2TitleChars}</h1>
                    <p className="auth-subtitle">
                        Your admin account has been created successfully. Welcome aboard.
                    </p>
                    <button
                        className="auth-submit-btn"
                        type="button"
                        onClick={handleAdminComplete}
                    >
                        Go to Dashboard
                    </button>
                </div>
            )}
        </div>
    )
})
