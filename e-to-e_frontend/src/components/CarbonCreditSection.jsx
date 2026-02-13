import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './CarbonCreditSection.css'

gsap.registerPlugin(ScrollTrigger)

const features = [
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        text: 'Prevent methane emissions from food decomposition',
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        text: 'Track CO₂ reduction with verified methodologies',
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        text: 'Generate measurable, auditable climate impact',
    },
]

const CarbonCreditSection = () => {
    const sectionRef = useRef(null)
    const imageRef = useRef(null)
    const contentRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Image floating animation
            gsap.to(imageRef.current, {
                y: -15,
                duration: 3,
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
            })

            // Content reveal
            gsap.from(contentRef.current.children, {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 65%',
                    toggleActions: 'play none none reverse',
                },
            })

            // Image reveal
            gsap.from(imageRef.current, {
                x: -80,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 70%',
                    toggleActions: 'play none none reverse',
                },
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={sectionRef} className="carbon section section--white" id="carbon">
            <div className="container">
                <div className="carbon__grid">
                    <div className="carbon__image-col">
                        <div className="carbon__image-wrapper" ref={imageRef}>
                            <img
                                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=700&h=900&fit=crop"
                                alt="Sustainable forest ecosystem"
                                className="carbon__image"
                                loading="lazy"
                            />
                            <div className="carbon__image-badge">
                                <span className="carbon__badge-value">8T+</span>
                                <span className="carbon__badge-label">CO₂ Prevented</span>
                            </div>
                        </div>
                    </div>

                    <div className="carbon__content-col" ref={contentRef}>
                        <span className="section__label">Sustainability</span>
                        <h2 className="section__title">Turning Food Rescue Into Carbon Credits</h2>
                        <p className="carbon__description">
                            Every kilogram of food rescued is a kilogram diverted from landfills — preventing the
                            release of methane, one of the most potent greenhouse gases. Our platform quantifies
                            this impact, turning everyday food rescue into verified carbon credits.
                        </p>

                        <div className="carbon__features">
                            {features.map((feature, i) => (
                                <div key={i} className="carbon__feature">
                                    <div className="carbon__feature-icon">{feature.icon}</div>
                                    <p className="carbon__feature-text">{feature.text}</p>
                                </div>
                            ))}
                        </div>

                        <button className="btn btn--primary carbon__cta" id="learn-more-carbon">
                            Learn More
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default CarbonCreditSection
