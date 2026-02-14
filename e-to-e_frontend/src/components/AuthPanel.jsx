import { useEffect, useRef, forwardRef } from 'react'
import { gsap } from 'gsap'

/* ─── Login Form ─── */
export const LoginForm = forwardRef(function LoginForm({ onToggle }, ref) {
    const headingRef = useRef(null)
    const subtitleRef = useRef(null)
    const fieldsRef = useRef(null)
    const btnRef = useRef(null)
    const toggleRef = useRef(null)

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

    return (
        <div className="auth-form-block" ref={ref}>
            <h1 className="auth-heading" ref={headingRef}>
                {titleChars}
            </h1>
            <p className="auth-subtitle" ref={subtitleRef}>
                Continue your mission of impact.
            </p>

            <div className="auth-fields" ref={fieldsRef}>
                <div className="auth-input-group">
                    <label htmlFor="login-email">Email</label>
                    <input
                        type="email"
                        id="login-email"
                        placeholder="you@example.com"
                        autoComplete="email"
                    />
                    <span className="auth-input-line" />
                </div>

                <div className="auth-input-group">
                    <label htmlFor="login-password">Password</label>
                    <input
                        type="password"
                        id="login-password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />
                    <span className="auth-input-line" />
                </div>
            </div>

            <button className="auth-submit-btn" ref={btnRef} type="button">
                Login
            </button>

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

/* ─── Register Form ─── */
export const RegisterForm = forwardRef(function RegisterForm(
    { onToggle },
    ref
) {
    // Split title text into characters
    const titleChars = 'Join Movement'.split('').map((char, i) => (
        <span className="char" key={i} style={{ display: 'inline-block' }}>
            {char === ' ' ? '\u00A0' : char}
        </span>
    ))

    return (
        <div className="auth-form-block auth-form-block--hidden" ref={ref}>
            <h1 className="auth-heading">{titleChars}</h1>
            <p className="auth-subtitle">
                Be part of climate-conscious food redistribution.
            </p>

            <div className="auth-fields">
                <div className="auth-input-group">
                    <label htmlFor="register-name">Full Name</label>
                    <input
                        type="text"
                        id="register-name"
                        placeholder="Your full name"
                        autoComplete="name"
                    />
                    <span className="auth-input-line" />
                </div>

                <div className="auth-input-group">
                    <label htmlFor="register-mobile">Mobile Number</label>
                    <input
                        type="tel"
                        id="register-mobile"
                        placeholder="+91 00000 00000"
                        autoComplete="tel"
                    />
                    <span className="auth-input-line" />
                </div>

                <div className="auth-input-group">
                    <label htmlFor="register-password">Password</label>
                    <input
                        type="password"
                        id="register-password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                    />
                    <span className="auth-input-line" />
                </div>
            </div>

            <button className="auth-submit-btn" type="button">
                Create Account
            </button>

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
        </div>
    )
})
