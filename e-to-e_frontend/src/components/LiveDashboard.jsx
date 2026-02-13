import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './LiveDashboard.css'

gsap.registerPlugin(ScrollTrigger)

const stats = [
    {
        id: 'ngos',
        value: 70,
        suffix: '+',
        label: 'Partner NGOs',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 3L17 9L24 10L19 15L20 22L14 19L8 22L9 15L4 10L11 9L14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'donors',
        value: 150,
        suffix: '+',
        label: 'Active Donors',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 24C14 24 4 18 4 11C4 8 6.5 5 10 5C12 5 13.5 6 14 7.5C14.5 6 16 5 18 5C21.5 5 24 8 24 11C24 18 14 24 14 24Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'food',
        value: 12000,
        suffix: ' KG',
        label: 'Food Donated',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 14H24M4 14C4 20 8 24 14 24C20 24 24 20 24 14M4 14C4 8 8 4 14 4C20 4 24 8 24 14" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 4V24" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
    {
        id: 'co2',
        value: 8,
        suffix: ' Tonnes',
        label: 'CO₂ Reduced',
        icon: (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M7 20C5 20 3 18 3 16C3 14 4.5 12.5 6.5 12C6.5 8 10 5 14 5C17.5 5 20.5 7.5 21 11C23.5 11.5 25 13.5 25 16C25 18.5 23 20 21 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 14V22M14 14L11 17M14 14L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
]

const LiveDashboard = () => {
    const sectionRef = useRef(null)
    const cardsRef = useRef([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Section title animation
            gsap.from('.dashboard__label, .dashboard__title, .dashboard__subtitle', {
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                },
            })

            // Animate cards
            cardsRef.current.forEach((card, i) => {
                gsap.from(card, {
                    y: 60,
                    opacity: 0,
                    duration: 0.8,
                    delay: i * 0.15,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                        toggleActions: 'play none none reverse',
                    },
                })
            })

            // Counter animation
            stats.forEach((stat, i) => {
                const valueEl = cardsRef.current[i]?.querySelector('.stat-card__value-num')
                if (!valueEl) return

                const obj = { val: 0 }
                gsap.to(obj, {
                    val: stat.value,
                    duration: 2,
                    delay: i * 0.2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 60%',
                        toggleActions: 'play none none reverse',
                    },
                    onUpdate: () => {
                        valueEl.textContent = stat.value >= 1000
                            ? Math.round(obj.val).toLocaleString()
                            : Math.round(obj.val)
                    },
                })
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={sectionRef} className="dashboard section section--coffee" id="about">
            <div className="container">
                <div className="text-center">
                    <span className="section__label dashboard__label">Live Impact</span>
                    <h2 className="section__title dashboard__title">Our Dashboard</h2>
                    <p className="section__subtitle dashboard__subtitle mx-auto">
                        Real numbers, real impact. Every donation creates a ripple effect across communities and the climate.
                    </p>
                </div>

                <div className="dashboard__grid">
                    {stats.map((stat, i) => (
                        <div
                            key={stat.id}
                            className="stat-card"
                            ref={(el) => (cardsRef.current[i] = el)}
                            id={`stat-${stat.id}`}
                        >
                            <div className="stat-card__icon">{stat.icon}</div>
                            <div className="stat-card__value">
                                <span className="stat-card__value-num">0</span>
                                <span className="stat-card__value-suffix">{stat.suffix}</span>
                            </div>
                            <p className="stat-card__label">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default LiveDashboard
