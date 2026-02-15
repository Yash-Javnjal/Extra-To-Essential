import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import './EssenceLine.css'

export default function EssenceLine({
    color = "var(--tundora)",
    height = "1px",
    width = "100%",
    className = "",
    delay = 0
}) {
    const lineRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(lineRef.current,
                { scaleX: 0, opacity: 0 },
                {
                    scaleX: 1,
                    opacity: 0.6,
                    duration: 1.5,
                    ease: "power3.out",
                    delay: delay,
                    scrollTrigger: {
                        trigger: lineRef.current,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            )
        })
        return () => ctx.revert()
    }, [delay])

    return (
        <div
            ref={lineRef}
            className={`essence-line ${className}`}
            style={{
                backgroundColor: color,
                height,
                width,
                transformOrigin: "center"
            }}
        />
    )
}
