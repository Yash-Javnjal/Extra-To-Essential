import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ImpactSection.css'

gsap.registerPlugin(ScrollTrigger)

const images = [
    {
        src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&h=600&fit=crop',
        alt: 'Children receiving meals',
        size: 'tall',
    },
    {
        src: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=500&h=350&fit=crop',
        alt: 'Volunteers packing food',
        size: 'normal',
    },
    {
        src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=500&h=350&fit=crop',
        alt: 'Community gathering',
        size: 'normal',
    },
    {
        src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=500&h=350&fit=crop',
        alt: 'Food donation drive',
        size: 'normal',
    },
    {
        src: 'https://images.unsplash.com/photo-1504159506876-f8338247a14a?w=500&h=600&fit=crop',
        alt: 'Sustainability initiative',
        size: 'tall',
    },
    {
        src: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=500&h=350&fit=crop',
        alt: 'Last mile delivery',
        size: 'normal',
    },
]

const ImpactSection = () => {
    const sectionRef = useRef(null)
    const itemsRef = useRef([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.impact__label, .impact__title, .impact__subtitle', {
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

            itemsRef.current.forEach((item, i) => {
                if (!item) return
                gsap.from(item, {
                    y: 60,
                    opacity: 0,
                    scale: 0.95,
                    duration: 0.8,
                    delay: i * 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 55%',
                        toggleActions: 'play none none reverse',
                    },
                })
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={sectionRef} className="impact section section--coffee" id="impact">
            <div className="container container--wide">
                <div className="text-center">
                    <span className="section__label impact__label">Gallery</span>
                    <h2 className="section__title impact__title">Impact in Action</h2>
                    <p className="section__subtitle impact__subtitle mx-auto">
                        A glimpse into the lives touched by the Extra-To-Essential movement.
                    </p>
                </div>

                <div className="impact__masonry">
                    {images.map((img, i) => (
                        <div
                            key={i}
                            className={`impact__item impact__item--${img.size}`}
                            ref={(el) => (itemsRef.current[i] = el)}
                        >
                            <div className="impact__image-wrapper">
                                <img
                                    src={img.src}
                                    alt={img.alt}
                                    className="impact__image"
                                    loading="lazy"
                                />
                                <div className="impact__image-overlay">
                                    <span className="impact__image-label">{img.alt}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default ImpactSection
