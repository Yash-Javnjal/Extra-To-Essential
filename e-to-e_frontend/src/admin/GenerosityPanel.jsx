import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Heart, TrendingUp, Sparkles } from 'lucide-react'

export default function GenerosityPanel({ stats }) {
    const cardRef = useRef(null)

    useEffect(() => {
        if (!cardRef.current) return
        gsap.from(cardRef.current, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay: 0.5
        })
    }, [])

    const generosity = stats?.totalGenerosity || 0

    return (
        <div className="admin-section" ref={cardRef}>
            <div className="admin-section__header">
                <div>
                    <h2 className="admin-section__title">Generosity Impact</h2>
                    <p className="admin-section__subtitle">Monetary value of contributions</p>
                </div>
            </div>

            <div className="admin-generosity-card">
                <div className="admin-generosity-card__main">
                    <div className="admin-generosity-card__icon">
                        <Heart size={32} fill="var(--tundora)" stroke="var(--tundora)" />
                    </div>
                    <div className="admin-generosity-card__info">
                        <div className="admin-generosity-card__label">Total Generosity</div>
                        <div className="admin-generosity-card__value">
                            ₹ {generosity.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="admin-generosity-card__stats">
                    <div className="admin-generosity-stat">
                        <TrendingUp size={16} />
                        <span>Estimated Impact Value</span>
                    </div>
                    <div className="admin-generosity-stat">
                        <Sparkles size={16} />
                        <span>Empowering Communities</span>
                    </div>
                </div>

                <div className="admin-generosity-card__footer">
                    * Calculated based on food volume and community reach.
                </div>
            </div>
        </div>
    )
}
