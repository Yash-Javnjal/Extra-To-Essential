import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher/LanguageSwitcher'
import './Navbar.css'

const Navbar = () => {
    const { t } = useTranslation('navigation')
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const navRef = useRef(null)
    const logoRef = useRef(null)
    const linksRef = useRef(null)
    const { isAuthenticated, user, getDashboardPath, logout } = useAuth()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        // Entrance animation
        const ctx = gsap.context(() => {
            // Set initial hidden state
            gsap.set(logoRef.current, { y: -30, opacity: 0 })
            gsap.set('.nav__link', { y: -20, opacity: 0 })
            gsap.set('.nav__cta', { y: -20, opacity: 0 })

            // Animate in
            gsap.to(logoRef.current, {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: 'power3.out',
                delay: 0.3,
            })

            gsap.to('.nav__link', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                stagger: 0.1,
                delay: 0.5,
            })

            gsap.to('.nav__cta', {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
                delay: 0.9,
            })
        }, navRef)

        return () => ctx.revert()
    }, [])

    const navLinks = [
        { label: t('home'), href: '/#home' },
        { label: t('about'), href: '/#about' },
        { label: t('impact'), href: '/#impact' },
        { label: t('blog'), href: '/#blog' },
        { label: t('howItWorks'), href: '/#workflow' },
    ]

    return (
        <nav ref={navRef} className={`nav ${scrolled ? 'nav--scrolled' : ''}`} id="navbar">
            <div className="nav__container container">
                <Link to="/" className="nav__logo" ref={logoRef}>
                    <span className="nav__logo-icon">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 14L12 18L20 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                    <span className="nav__logo-text">Extra-To-Essential</span>
                </Link>

                <div className={`nav__links ${menuOpen ? 'nav__links--open' : ''}`} ref={linksRef}>
                    {navLinks.map((link, i) => (
                        <a key={i} href={link.href} className="nav__link" onClick={() => setMenuOpen(false)}>
                            {link.label}
                        </a>
                    ))}

                </div>

                <div className="nav__actions">
                    {isAuthenticated && user ? (
                        <>
                            <Link to={getDashboardPath(user.role)} className="nav__cta btn btn--primary">
                                {t('dashboard')}
                            </Link>
                            <button
                                onClick={() => {
                                    logout();
                                    setMenuOpen(false);
                                }}
                                className="nav__cta btn btn--secondary"
                                style={{ marginLeft: '0.5rem' }}
                            >
                                {t('logout')}
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="nav__cta btn btn--primary">
                            {t('joinUs')}
                        </Link>
                    )}
                    
                    <LanguageSwitcher variant="dropdown" showLabels={true} />
                </div>

                <button
                    className={`nav__hamburger ${menuOpen ? 'nav__hamburger--active' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                    id="nav-toggle"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    )
}

export default Navbar
