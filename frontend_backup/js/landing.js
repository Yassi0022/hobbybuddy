document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // 2. GSAP ScrollTrigger Animations
    gsap.registerPlugin(ScrollTrigger);

    // Hero Vibe Card Parallax
    const vibeCard = document.querySelector('.vibe-card-3d');
    if (vibeCard) {
        gsap.to(vibeCard, {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1,
            },
            rotateX: 0,
            rotateY: 0,
            y: -100,
            scale: 1.1,
            boxShadow: '0 80px 160px rgba(255, 107, 53, 0.3)',
            duration: 1
        });
    }

    // Reveal Animations for Sections
    const reveals = document.querySelectorAll('.glass-card, .section-title, .hero h1, .hero p, .hero .btn-primary');
    reveals.forEach((el, i) => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: 'top 90%',
                toggleActions: 'play none none none'
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            delay: i % 3 * 0.1
        });
    });

    // 3. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

});
