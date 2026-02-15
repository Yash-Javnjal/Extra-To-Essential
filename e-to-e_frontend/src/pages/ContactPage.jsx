import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './ContactPage.css'

gsap.registerPlugin(ScrollTrigger)

const ContactPage = () => {
    const sectionRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.contact-intro__label, .contact-intro__title, .contact-intro__subtitle', {
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
                delay: 0.3,
            })

            gsap.from('.contact-card', {
                y: 60,
                opacity: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: 'power3.out',
                delay: 0.6,
            })

            gsap.from('.contact-info__item', {
                y: 30,
                opacity: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power3.out',
                delay: 0.9,
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <>
            <Navbar />
            <main ref={sectionRef}>
                {/* ── Intro Section ── */}
                <section className="contact-intro section--white">
                    <div className="container">
                        <span className="contact-intro__label">Get In Touch</span>
                        <h1 className="contact-intro__title">
                            We'd Love to<br />Hear From You
                        </h1>
                        <p className="contact-intro__subtitle">
                            Whether you're a donor, an NGO, a volunteer, or simply curious about our mission —
                            reach out and let's bridge the gap together.
                        </p>
                        <hr className="contact-intro__divider" />
                    </div>
                </section>

                {/* ── Contact Cards ── */}
                <section className="contact-details section section--coffee" id="contact-details">
                    <div className="container">
                        <div className="contact-grid">
                            {/* Office */}
                            <div className="contact-card">
                                <div className="contact-card__icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                </div>
                                <h3 className="contact-card__title">Head Office</h3>
                                <p className="contact-card__text">
                                    4th Floor, Innovation Tower<br />
                                    Bandra-Kurla Complex<br />
                                    Mumbai, Maharashtra 400051<br />
                                    India
                                </p>
                            </div>

                            {/* Email */}
                            <div className="contact-card">
                                <div className="contact-card__icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" />
                                        <path d="M22 7l-10 7L2 7" />
                                    </svg>
                                </div>
                                <h3 className="contact-card__title">Email Us</h3>
                                <p className="contact-card__text">
                                    General Inquiries<br />
                                    <a href="mailto:hello@extratoessential.org" className="contact-card__link">hello@extratoessential.org</a>
                                </p>
                                <p className="contact-card__text">
                                    Partnerships<br />
                                    <a href="mailto:partners@extratoessential.org" className="contact-card__link">partners@extratoessential.org</a>
                                </p>
                            </div>

                            {/* Phone */}
                            <div className="contact-card">
                                <div className="contact-card__icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                </div>
                                <h3 className="contact-card__title">Call Us</h3>
                                <p className="contact-card__text">
                                    Main Line<br />
                                    <a href="tel:+912269001234" className="contact-card__link">+91 22 6900 1234</a>
                                </p>
                                <p className="contact-card__text">
                                    Donor Helpline<br />
                                    <a href="tel:+918001234567" className="contact-card__link">+91 800 123 4567</a>
                                </p>
                            </div>
                        </div>

                        {/* ── Additional Info ── */}
                        <div className="contact-info">
                            <div className="contact-info__item">
                                <h4 className="contact-info__title">Working Hours</h4>
                                <p className="contact-info__text">
                                    Monday — Friday: 9:00 AM — 6:00 PM IST<br />
                                    Saturday: 10:00 AM — 2:00 PM IST<br />
                                    Sunday: Closed
                                </p>
                            </div>
                            <div className="contact-info__item">
                                <h4 className="contact-info__title">Emergency Hotline</h4>
                                <p className="contact-info__text">
                                    For urgent food rescue operations, our emergency hotline
                                    operates 24/7:<br />
                                    <a href="tel:+911800123000" className="contact-card__link" style={{ fontWeight: 600 }}>
                                        +91 1800 123 000
                                    </a>
                                </p>
                            </div>
                            <div className="contact-info__item">
                                <h4 className="contact-info__title">Regional Offices</h4>
                                <p className="contact-info__text">
                                    Delhi NCR — Connaught Place<br />
                                    Bengaluru — Koramangala<br />
                                    Ahmedabad — SG Highway
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="contact-cta">
                            <p className="contact-cta__text">
                                Ready to make a difference? Join our mission today.
                            </p>
                            <Link to="/login" className="btn btn--primary">
                                Join Us
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}

export default ContactPage
