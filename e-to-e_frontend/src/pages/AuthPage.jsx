import { useRef, useCallback, useState } from 'react'
import { gsap } from 'gsap'
import AuthImage from '../components/AuthImage'
import { LoginForm, RegisterForm } from '../components/AuthPanel'
import './AuthPage.css'

function AuthPage() {
    const [isRegister, setIsRegister] = useState(false)
    const animatingRef = useRef(false)

    // Refs
    const imagePanelRef = useRef(null)
    const loginFormRef = useRef(null)
    const registerFormRef = useRef(null)
    const formPanelLoginRef = useRef(null)
    const formPanelRegisterRef = useRef(null)

    // Check if mobile / tablet
    const isMobile = () => window.innerWidth <= 1024

    /* ─── Toggle to Register ─── */
    const showRegister = useCallback(() => {
        if (animatingRef.current || isRegister) return
        animatingRef.current = true

        const tl = gsap.timeline({
            onComplete: () => {
                animatingRef.current = false
                setIsRegister(true)
            },
        })

        if (isMobile()) {
            // Mobile: show the register wrapper panel first
            tl.set(formPanelRegisterRef.current, {
                visibility: 'visible',
                opacity: 1,
            })

            // Fade out login form
            tl.to(loginFormRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.4,
                ease: 'power2.inOut',
                onComplete: () => {
                    loginFormRef.current.classList.add('auth-form-block--hidden')
                    // Hide the login panel on mobile since register is now fixed overlay
                    formPanelLoginRef.current.style.visibility = 'hidden'
                },
            })

            tl.set(registerFormRef.current, {
                className: '-=auth-form-block--hidden',
                opacity: 0,
                y: 20,
                visibility: 'visible',
                pointerEvents: 'auto',
            })
            tl.to(registerFormRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power3.out',
            })

            // Animate register form chars
            const regChars = registerFormRef.current?.querySelectorAll('.char')
            if (regChars?.length) {
                tl.fromTo(
                    regChars,
                    { y: 30, opacity: 0, rotateX: -30 },
                    {
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                        stagger: 0.025,
                    },
                    '-=0.3'
                )
            }
        } else {
            // Desktop: cinematic panel slide

            // 1. Fade out login form
            tl.to(loginFormRef.current, {
                opacity: 0,
                x: -40,
                duration: 0.5,
                ease: 'power3.inOut',
            }, 0)

            // 2. Slide image panel from right to left
            tl.to(imagePanelRef.current, {
                x: '-100%',
                duration: 1.1,
                ease: 'power3.inOut',
            }, 0.1)

            // 3. Reveal register panel
            tl.set(formPanelRegisterRef.current, {
                visibility: 'visible',
                opacity: 1,
            }, 0.3)

            tl.set(registerFormRef.current, {
                className: '-=auth-form-block--hidden',
                visibility: 'visible',
            }, 0.3)

            tl.fromTo(
                registerFormRef.current,
                { opacity: 0, x: 50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                },
                0.5
            )

            // 4. Character reveal on register heading
            const regChars = registerFormRef.current?.querySelectorAll('.char')
            if (regChars?.length) {
                tl.fromTo(
                    regChars,
                    { y: 35, opacity: 0, rotateX: -35 },
                    {
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        duration: 0.7,
                        ease: 'power3.out',
                        stagger: 0.03,
                    },
                    0.6
                )
            }

            // 5. Stagger register fields
            const regFields = registerFormRef.current?.querySelectorAll(
                '.auth-input-group'
            )
            if (regFields?.length) {
                tl.fromTo(
                    regFields,
                    { y: 20, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        ease: 'power3.out',
                        stagger: 0.08,
                    },
                    0.75
                )
            }

            // 6. Hide login panel
            tl.set(loginFormRef.current, {
                className: '+=auth-form-block--hidden',
            })
        }
    }, [isRegister])

    /* ─── Toggle to Login ─── */
    const showLogin = useCallback(() => {
        if (animatingRef.current || !isRegister) return
        animatingRef.current = true

        const tl = gsap.timeline({
            onComplete: () => {
                animatingRef.current = false
                setIsRegister(false)
            },
        })

        if (isMobile()) {
            // Fade out register form
            tl.to(registerFormRef.current, {
                opacity: 0,
                y: -20,
                duration: 0.4,
                ease: 'power2.inOut',
                onComplete: () => {
                    registerFormRef.current.classList.add('auth-form-block--hidden')
                    // Hide the register panel wrapper
                    gsap.set(formPanelRegisterRef.current, {
                        visibility: 'hidden',
                        opacity: 0,
                    })
                },
            })

            // Restore login panel visibility
            tl.set(formPanelLoginRef.current, {
                visibility: 'visible',
            })
            tl.set(loginFormRef.current, {
                className: '-=auth-form-block--hidden',
                opacity: 0,
                y: 20,
                visibility: 'visible',
            })
            tl.to(loginFormRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power3.out',
            })
        } else {
            // 1. Fade out register form
            tl.to(registerFormRef.current, {
                opacity: 0,
                x: 40,
                duration: 0.5,
                ease: 'power3.inOut',
            }, 0)

            // 2. Slide image panel back to right
            tl.to(imagePanelRef.current, {
                x: '0%',
                duration: 1.1,
                ease: 'power3.inOut',
            }, 0.1)

            // 3. Reveal login form
            tl.set(loginFormRef.current, {
                className: '-=auth-form-block--hidden',
                visibility: 'visible',
            }, 0.3)

            tl.fromTo(
                loginFormRef.current,
                { opacity: 0, x: -40 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                },
                0.5
            )

            // 4. Hide register panel
            tl.set(registerFormRef.current, {
                className: '+=auth-form-block--hidden',
            })
            tl.set(formPanelRegisterRef.current, {
                visibility: 'hidden',
                opacity: 0,
            })
        }
    }, [isRegister])

    return (
        <div className="auth-page" id="auth-page">
            {/* Brand mark */}


            <div className="auth-layout">
                {/* Left: Login Form Panel */}
                <div className="auth-form-panel" ref={formPanelLoginRef}>
                    <div className="auth-form-inner">
                        <div className="auth-form-container">
                            <LoginForm ref={loginFormRef} onToggle={showRegister} />
                        </div>
                    </div>
                </div>

                {/* Right (default): Image Panel */}
                <AuthImage ref={imagePanelRef} />

                {/* Register Form Panel (hidden, on right side behind image) */}
                <div
                    className="auth-form-panel auth-form-panel--register"
                    ref={formPanelRegisterRef}
                >
                    <div className="auth-form-inner">
                        <div className="auth-form-container">
                            <RegisterForm ref={registerFormRef} onToggle={showLogin} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuthPage
