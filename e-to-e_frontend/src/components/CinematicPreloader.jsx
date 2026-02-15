import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import './CinematicPreloader.css'

export default function CinematicPreloader({ onComplete }) {
    const containerRef = useRef(null)
    const logoRef = useRef(null)
    const textRef = useRef(null)
    const lineRef = useRef(null)
    const shutterTopRef = useRef(null)
    const shutterBottomRef = useRef(null)
    const checkRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    if (onComplete) onComplete()
                }
            })

            // Initial state
            gsap.set([shutterTopRef.current, shutterBottomRef.current], { y: 0 })
            gsap.set(lineRef.current, { scaleX: 0 })
            gsap.set(textRef.current, { autoAlpha: 0, y: 20 })

            // 1. Logo Draw (Circle + simplified check/leaf)
            tl.to(logoRef.current, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" })
                .to(checkRef.current, { strokeDashoffset: 0, duration: 0.8, ease: "power2.out" }, "-=0.5")

            // 2. Text Reveal
            tl.to(textRef.current, {
                autoAlpha: 1,
                y: 0,
                duration: 1.2,
                ease: "power3.out"
            }, "-=0.2")

            // 3. The Line Expands (The Portal)
            tl.to(lineRef.current, {
                scaleX: 1,
                duration: 1.2,
                ease: "expo.inOut",
                delay: 0.3
            })

            // 4. Shutter open (The Reveal)
            tl.to(shutterTopRef.current, {
                yPercent: -100,
                duration: 1.5,
                ease: "power4.inOut"
            }, "open")
                .to(shutterBottomRef.current, {
                    yPercent: 100,
                    duration: 1.5,
                    ease: "power4.inOut"
                }, "open")
                .to([logoRef.current, textRef.current], {
                    autoAlpha: 0,
                    scale: 1.1,
                    duration: 0.8,
                    ease: "power2.in"
                }, "open-=1.2")

            // 5. Hide line
            tl.to(lineRef.current, {
                opacity: 0,
                duration: 0.5
            }, "open+=0.5")

            // 6. Remove container from flow (handled by onComplete, but fade it just in case)
            tl.to(containerRef.current, {
                autoAlpha: 0,
                duration: 0.1,
                delay: 0.1 // wait for shuters
            })

        }, containerRef)

        return () => ctx.revert()
    }, [onComplete])

    return (
        <div ref={containerRef} className="cinematic-preloader">
            {/* Shutters */}
            <div ref={shutterTopRef} className="cp-shutter cp-shutter-top" />
            <div ref={shutterBottomRef} className="cp-shutter cp-shutter-bottom" />

            {/* Center Content */}
            <div className="cp-content">
                {/* SVG Logo */}
                <svg width="80" height="80" viewBox="0 0 100 100" className="cp-logo">
                    {/* Circle Outline */}
                    <circle
                        ref={logoRef}
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="2"
                        strokeDasharray="283"
                        strokeDashoffset="283"
                        transform="rotate(-90 50 50)"
                    />
                    {/* Abstract Check/Leaf */}
                    <path
                        ref={checkRef}
                        d="M30 50 L45 65 L70 35"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="100"
                        strokeDashoffset="100"
                    />
                </svg>

                <div ref={textRef} className="cp-text-group">
                    <h1 className="cp-title">Extra-To-Essential</h1>
                    <div className="cp-subtitle">by Team MealMitra</div>
                </div>
            </div>

            {/* The Essence Line that becomes portal */}
            <div ref={lineRef} className="cp-essence-line" />
        </div>
    )
}
