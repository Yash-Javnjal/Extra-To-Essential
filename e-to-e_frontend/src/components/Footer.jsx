import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './Footer.css'

gsap.registerPlugin(ScrollTrigger)

const Footer = () => {
    const footerRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.footer__inner > *', {
                y: 30,
                opacity: 0,
                duration: 0.7,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: footerRef.current,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse',
                },
            })
        }, footerRef)

        return () => ctx.revert()
    }, [])

    return (
        <footer ref={footerRef} className="footer" id="footer">
            <div className="container footer__inner">
                <div className="footer__top">
                    <div className="footer__brand">
                        <div className="footer__logo">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M8 14L12 18L20 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="footer__logo-text">Extra-To-Essential</span>
                        </div>
                        <p className="footer__tagline">
                            Bridging surplus to sustenance. One meal, one community, one planet at a time.
                        </p>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Company</h4>
                        <ul className="footer__links">
                            <li><a href="#about" className="footer__link">About Us</a></li>
                            <li><a href="#impact" className="footer__link">Our Impact</a></li>
                            <li><a href="#blog" className="footer__link">Blog</a></li>
                            <li><a href="#" className="footer__link">Careers</a></li>
                        </ul>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Get Involved</h4>
                        <ul className="footer__links">
                            <li><a href="#" className="footer__link">Volunteer</a></li>
                            <li><a href="#" className="footer__link">Partner With Us</a></li>
                            <li><a href="#" className="footer__link">Donate</a></li>
                            <li><Link to="/contact" className="footer__link">Contact</Link></li>
                        </ul>
                    </div>

                    <div className="footer__links-group">
                        <h4 className="footer__links-title">Connect</h4>
                        <div className="footer__social">
                            {/* Twitter/X */}
                            <a href="#" className="footer__social-link" aria-label="Twitter" id="social-twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 4L10.5 13L4 20H6L11.5 14.5L16 20H20L13 10.5L19 4H17L12 9L8 4H4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                </svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="#" className="footer__social-link" aria-label="LinkedIn" id="social-linkedin">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M8 11V16M8 8V8.01M12 16V13C12 11.5 13 11 14 11C15 11 16 11.5 16 13V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                            {/* Instagram */}
                            <a href="#" className="footer__social-link" aria-label="Instagram" id="social-instagram">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
                                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                                </svg>
                            </a>
                            {/* GitHub */}
                            <a href="https://github.com/Yash-Javnjal/Extra-To-Essential.git" className="footer__social-link" aria-label="GitHub" id="social-github" target="_blank">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21V19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 17.99 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6.01 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C17.99 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26V21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer__divider"></div>

                <div className="footer__bottom">
                    <p className="footer__copyright">
                        © 2026 Extra-To-Essential. All rights reserved.
                    </p>
                    <p className="footer__credit">
                        By Yash Javanjal and Tanishq Shivasharan
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
