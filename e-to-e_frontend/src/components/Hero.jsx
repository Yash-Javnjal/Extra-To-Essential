import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger)

const Hero = () => {
    const heroRef = useRef(null)
    const headingRef = useRef(null)
    const subRef = useRef(null)
    const btnsRef = useRef(null)
    const overlayRef = useRef(null)
    const [modalOpen, setModalOpen] = useState(false)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Split text animation for heading
            const heading = headingRef.current
            const text = heading.textContent
            heading.innerHTML = ''

            // Create word spans
            const words = text.split(' ')
            words.forEach((word, i) => {
                const wordSpan = document.createElement('span')
                wordSpan.className = 'hero__word'
                wordSpan.style.display = 'inline-block'
                wordSpan.style.overflow = 'hidden'
                wordSpan.style.verticalAlign = 'top'

                const innerSpan = document.createElement('span')
                innerSpan.className = 'hero__word-inner'
                innerSpan.style.display = 'inline-block'
                innerSpan.textContent = word

                wordSpan.appendChild(innerSpan)
                heading.appendChild(wordSpan)

                if (i < words.length - 1) {
                    heading.appendChild(document.createTextNode('\u00A0'))
                }
            })

            // Main timeline
            const tl = gsap.timeline({ delay: 0.5 })

            tl.from('.hero__word-inner', {
                y: '110%',
                rotateX: -80,
                opacity: 0,
                duration: 1.2,
                ease: 'power4.out',
                stagger: 0.08,
            })
                .from(subRef.current, {
                    y: 40,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out',
                }, '-=0.4')
                .from(btnsRef.current.children, {
                    y: 30,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    stagger: 0.15,
                }, '-=0.5')

            // Scroll parallax
            gsap.to('.hero__bg', {
                yPercent: 30,
                ease: 'none',
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.5,
                },
            })

            gsap.to('.hero__content', {
                yPercent: -15,
                opacity: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: '30% top',
                    end: 'bottom top',
                    scrub: 1,
                },
            })

            // Magnetic button effect
            const buttons = btnsRef.current.querySelectorAll('.btn')
            buttons.forEach(btn => {
                const handleMove = (e) => {
                    const rect = btn.getBoundingClientRect()
                    const x = e.clientX - rect.left - rect.width / 2
                    const y = e.clientY - rect.top - rect.height / 2

                    gsap.to(btn, {
                        x: x * 0.3,
                        y: y * 0.3,
                        duration: 0.4,
                        ease: 'power2.out',
                    })
                }

                const handleLeave = () => {
                    gsap.to(btn, {
                        x: 0,
                        y: 0,
                        duration: 0.7,
                        ease: 'elastic.out(1, 0.3)',
                    })
                }

                btn.addEventListener('mousemove', handleMove)
                btn.addEventListener('mouseleave', handleLeave)
            })

        }, heroRef)

        return () => ctx.revert()
    }, [])

    const openModal = () => setModalOpen(true)
    const closeModal = () => setModalOpen(false)

    return (
        <>
            <section ref={heroRef} className="hero" id="hero">
                <div className="hero__bg">
                    <img
                        src="https://i.pinimg.com/736x/95/e3/fd/95e3fd0c539f5ddfe698b1554c6644bb.jpg"
                        alt="Community food rescue"
                        className="hero__bg-img"
                    />
                </div>
                <div className="hero__overlay" ref={overlayRef}></div>

                <div className="hero__content container">
                    <div className="hero__text">
                        <h1 ref={headingRef} className="hero__heading">
                            Turning Surplus Into Sustenance
                        </h1>
                        <p ref={subRef} className="hero__subheading">
                            Where Food Rescue Meets Climate Responsibility
                        </p>
                        <div ref={btnsRef} className="hero__buttons">
                            <Link to="/login" className="btn btn--primary hero__btn">
                                <span>Get Started</span>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                            <button onClick={openModal} className="btn btn--outline hero__btn" id="watch-demo-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <polygon points="5,3 13,8 5,13" fill="currentColor" />
                                </svg>
                                <span>Watch Demo</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hero__scroll-indicator">
                    <div className="hero__scroll-line"></div>
                    <span className="hero__scroll-text">Scroll</span>
                </div>
            </section>

            {/* Video Modal */}
            <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={closeModal} id="video-modal">
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                        ✕
                    </button>
                    {modalOpen && (
                        <video controls autoPlay>
                            <source src="/etoe.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
            </div>
        </>
    )
}

export default Hero
