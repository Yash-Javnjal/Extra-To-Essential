import { useEffect, useRef, useState, useCallback } from 'react'
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
    const videoRef = useRef(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)

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

            // Set initial hidden state explicitly
            gsap.set('.hero__word-inner', { y: '110%', opacity: 0 })
            gsap.set(subRef.current, { y: 40, opacity: 0 })
            gsap.set(btnsRef.current.children, { y: 30, opacity: 0 })

            // Main timeline
            const tl = gsap.timeline({ delay: 0.5 })

            tl.to('.hero__word-inner', {
                y: '0%',
                opacity: 1,
                duration: 1.2,
                ease: 'power4.out',
                stagger: 0.08,
            })
                .to(subRef.current, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power3.out',
                }, '-=0.4')
                .to(btnsRef.current.children, {
                    y: 0,
                    opacity: 1,
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

    const openModal = () => {
        setModalOpen(true)
        setIsPlaying(false)
    }

    const closeModal = () => {
        setModalOpen(false)
        setIsPlaying(false)
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.currentTime = 0
        }
    }

    const handlePlayClick = useCallback(() => {
        const video = videoRef.current
        if (video) {
            const playPromise = video.play()
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true)
                }).catch((err) => {
                    console.warn('Video play failed:', err)
                    // Fallback: show controls so user can play manually
                    video.controls = true
                    setIsPlaying(true)
                })
            }
        }
    }, [])

    // Callback ref for video element to ensure ref is assigned
    const setVideoRef = useCallback((node) => {
        videoRef.current = node
    }, [])

    return (
        <>
            <section ref={heroRef} className="hero" id="home">
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
                            <Link to="/login" className="btn btn--primary hero__btn" id="login-register-btn">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                <span>Login / Register</span>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

                    {/* Motivational Text */}
                    <div className="modal-header">
                        <p className="modal-quote">
                            "Every meal rescued is a life touched and a planet healed."
                        </p>
                        <span className="modal-quote-author">— Extra-To-Essential</span>
                    </div>

                    {/* Video Container with Curvy Edges */}
                    <div className="modal-video-container">
                        {modalOpen && (
                            <video
                                ref={setVideoRef}
                                controls={isPlaying}
                                muted
                                playsInline
                                preload="metadata"
                                onEnded={() => setIsPlaying(false)}
                                onPause={() => setIsPlaying(false)}
                                onPlay={() => setIsPlaying(true)}
                            >
                                <source src="/etoe.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}

                        {/* Play Button Overlay */}
                        {modalOpen && !isPlaying && (
                            <button
                                className="modal-play-btn"
                                onClick={handlePlayClick}
                                aria-label="Play video"
                                id="modal-play-btn"
                            >
                                <div className="modal-play-btn__ring"></div>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <polygon points="10,5 24,14 10,23" fill="currentColor" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Hero
