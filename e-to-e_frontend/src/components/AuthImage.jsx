import { useEffect, useRef, forwardRef } from 'react'
import { gsap } from 'gsap'

const IMAGE_URL =
    'https://i.pinimg.com/1200x/26/dd/0f/26dd0fde01abadefe730930ca4d59514.jpg'

const AuthImage = forwardRef(function AuthImage({ onLoad }, ref) {
    const imgRef = useRef(null)
    const textRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Slow cinematic zoom: scale 1.15 → 1
            gsap.fromTo(
                imgRef.current,
                { scale: 1.15, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 2.4,
                    ease: 'power2.out',
                    delay: 0.2,
                }
            )

            // Tagline text fade-in
            gsap.fromTo(
                textRef.current,
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    ease: 'power3.out',
                    delay: 1,
                }
            )
        })

        return () => ctx.revert()
    }, [])

    return (
        <div className="auth-image-panel" ref={ref}>
            <div className="auth-brand">
                <span className="auth-brand__name">Extra-To-Essential</span>
                <span className="auth-brand__since">Since 2026</span>
            </div>

            <img
                ref={imgRef}
                className="auth-image-panel__img"
                src={IMAGE_URL}
                alt="Climate-conscious food redistribution — Extra-To-Essential"
                onLoad={onLoad}
            />
            <div className="auth-image-panel__overlay" />
            <div className="auth-image-panel__text" ref={textRef}>
                <p className="auth-image-panel__tagline">
                    Saving surplus. Feeding futures.
                </p>
                <span className="auth-image-panel__caption">
                    Turning food waste into meaningful impact, one meal at a time.
                </span>
            </div>
        </div>
    )
})

export default AuthImage
