import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import './CinematicFooter.css'

export default function CinematicFooter() {
    const footerRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(footerRef.current,
                { opacity: 0, y: 20 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.5,
                    scrollTrigger: {
                        trigger: footerRef.current,
                        start: "top bottom-=20", // When element enters viewport
                        toggleActions: 'play none none reverse'
                    }
                }
            )
        }, footerRef)
        return () => ctx.revert()
    }, [])

    return (
        <div ref={footerRef} className="cinematic-footer">
            <span className="cf-text">Crafted with intent</span>
            <div className="cf-dot"></div>
            <span className="cf-names">Yash Javanjal & Tanishq Shivasharan</span>
            <div className="cf-dot"></div>
            <span className="cf-team">Team MealMitra</span>
        </div>
    )
}
