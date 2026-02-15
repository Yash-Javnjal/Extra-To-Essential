import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './LiveDashboard.css'
import EssenceLine from './EssenceLine'

gsap.registerPlugin(ScrollTrigger)

/* Default fallback values — will be replaced by real data */
const FALLBACK = {
    total_ngos: 0,
    total_donors: 0,
    total_food_kg: 0,
    total_co2_tonnes: 0,
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

    /* Fetch real data from backend (public endpoints, no auth needed) */
    useEffect(() => {
        let cancelled = false
        async function fetchLiveData() {
            try {
                // Fetch only impact metrics which uses the optimized admin queries
                const res = await fetch(`${API_URL}/impact/total`)
                if (!res.ok) return
                const data = await res.json()

                if (cancelled) return

                const m = data.metrics || {}

                const foodKg = Math.round(parseFloat(m.total_food_saved_kg ?? m.total_food_kg ?? 0))

                setLiveStats({
                    total_ngos: m.total_ngos ?? m.ngo_count ?? m.active_ngos ?? 0,
                    total_donors: m.total_donors ?? m.donor_count ?? m.active_donors ?? 0,
                    total_food_kg: foodKg,
                    // For 10 kg food: roughly 25kg CO2 saved
                    total_co2_tonnes: parseFloat(((foodKg * 2.5) / 1000).toFixed(2)),
                })
            } catch (err) {
                console.warn('Failed to fetch live stats', err)
                /* keep fallback values/zeros on network error */
            }
        }
        fetchLiveData()
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const ctx = gsap.context(() => {
            // 1. Essence Line expands
            gsap.fromTo('.dashboard-essence-line',
                { scaleX: 0, opacity: 0 },
                {
                    scaleX: 1,
                    opacity: 1,
                    duration: 1.8,
                    ease: 'expo.inOut',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                    }
                }
            )

            // 2. Text Reveal (Staggered)
            gsap.fromTo('.dashboard__label, .dashboard__title, .dashboard__subtitle',
                { y: 50, autoAlpha: 0 },
                {
                    y: 0,
                    autoAlpha: 1,
                    duration: 1.2,
                    stagger: 0.2,
                    ease: 'power4.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 75%',
                    },
                }
            )

            // 3. Cards Materialize (Upward drift + Fade)
            cardsRef.current.forEach((card, i) => {
                gsap.fromTo(card,
                    { y: 80, autoAlpha: 0, scale: 0.95 },
                    {
                        y: 0,
                        autoAlpha: 1,
                        scale: 1,
                        duration: 1.4,
                        delay: i * 0.15, // Cinematic stagger
                        ease: 'power4.out',
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: 'top 70%',
                        },
                    }
                )
            })

            // 4. Numbers Count Up (Slow, authoritative)
            CARD_META.forEach((card, i) => {
                const valueEl = cardsRef.current[i]?.querySelector('.stat-card__value-num')
                if (!valueEl) return

                const targetVal = liveStats[card.fallbackKey] ?? 0
                const obj = { val: 0 }

                gsap.to(obj, {
                    val: targetVal,
                    duration: 3.5, // Slow build-up
                    delay: 0.5 + (i * 0.2),
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                    },
                    onUpdate: () => {
                        if (targetVal >= 1000) {
                            valueEl.textContent = Math.round(obj.val).toLocaleString()
                        } else if (card.id === 'co2') {
                            valueEl.textContent = parseFloat(obj.val.toFixed(2))
                        } else {
                            valueEl.textContent = Math.round(obj.val * 10) / 10
                        }
                    },
                })
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [liveStats])

    return (
        <section ref={sectionRef} className="dashboard section section--coffee" id="about">
            <div className="container">
                {/* Signature Essence Line */}
                <EssenceLine className="dashboard-essence-line" width="60px" color="var(--tundora)" delay={0.2} />

                <div className="text-center">
                    <span className="section__label dashboard__label">Live Impact</span>
                    <h2 className="section__title dashboard__title">Our Dashboard</h2>
                    <p className="section__subtitle dashboard__subtitle mx-auto">
                        Real numbers, real impact. Every donation creates a ripple effect across communities and the climate.
                    </p>
                </div>

                <div className="dashboard__grid" style={{ marginTop: '4rem' }}>
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
