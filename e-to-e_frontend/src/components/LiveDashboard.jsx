import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './LiveDashboard.css'

gsap.registerPlugin(ScrollTrigger)

/* Default fallback values shown while the API loads or if it fails */
const FALLBACK = {
    total_ngos: 70,
    total_donors: 150,
    total_food_kg: 12000,
    total_co2_tonnes: 8,
}

const CARD_META = [
    {
        id: 'ngos',
        fallbackKey: 'total_ngos',
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
        fallbackKey: 'total_donors',
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
        fallbackKey: 'total_food_kg',
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
        fallbackKey: 'total_co2_tonnes',
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const LiveDashboard = () => {
    const sectionRef = useRef(null)
    const cardsRef = useRef([])
    const [liveStats, setLiveStats] = useState(FALLBACK)

    /* Fetch real impact data from backend (public endpoint, no auth needed) */
    useEffect(() => {
        let cancelled = false
        async function fetchImpact() {
            try {
                const res = await fetch(`${API_URL}/impact/total`)
                if (!res.ok) return
                const data = await res.json()
                if (cancelled) return

                const m = data.metrics || data
                setLiveStats({
                    total_ngos: m.total_ngos ?? m.ngo_count ?? FALLBACK.total_ngos,
                    total_donors: m.total_donors ?? m.donor_count ?? FALLBACK.total_donors,
                    total_food_kg: Math.round(parseFloat(m.total_food_saved_kg ?? m.total_food_kg ?? FALLBACK.total_food_kg)),
                    total_co2_tonnes: parseFloat(((m.total_co2_reduced_kg ?? m.total_co2_kg ?? FALLBACK.total_co2_tonnes * 1000) / 1000).toFixed(1)),
                })
            } catch {
                /* keep fallback values */
            }
        }
        fetchImpact()
        return () => { cancelled = true }
    }, [])

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
            CARD_META.forEach((card, i) => {
                const valueEl = cardsRef.current[i]?.querySelector('.stat-card__value-num')
                if (!valueEl) return

                const targetVal = liveStats[card.fallbackKey] ?? 0
                const obj = { val: 0 }
                gsap.to(obj, {
                    val: targetVal,
                    duration: 2,
                    delay: i * 0.2,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 60%',
                        toggleActions: 'play none none reverse',
                    },
                    onUpdate: () => {
                        valueEl.textContent = targetVal >= 1000
                            ? Math.round(obj.val).toLocaleString()
                            : Math.round(obj.val * 10) / 10
                    },
                })
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [liveStats])

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
                    {CARD_META.map((card, i) => (
                        <div
                            key={card.id}
                            className="stat-card"
                            ref={(el) => (cardsRef.current[i] = el)}
                            id={`stat-${card.id}`}
                        >
                            <div className="stat-card__icon">{card.icon}</div>
                            <div className="stat-card__value">
                                <span className="stat-card__value-num">0</span>
                                <span className="stat-card__value-suffix">{card.suffix}</span>
                            </div>
                            <p className="stat-card__label">{card.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default LiveDashboard
