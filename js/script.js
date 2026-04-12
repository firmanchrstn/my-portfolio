/**
 * FIRMAN PORTFOLIO SCRIPT
 * Architecture: Modular, ES6+, Performance Optimized
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Theme Management (Dark/Light Mode) ---
    const themeToggle = document.getElementById('theme-toggle');
    
    const getCurrentTheme = () => document.documentElement.getAttribute('data-theme');
    const setSavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    };

    setSavedTheme();

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // --- 2. Navigation & Header Effect ---
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navLinks = document.querySelectorAll('.nav__link');
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('section[id]');

    // Mobile Menu
    if (navToggle) navToggle.addEventListener('click', () => navMenu.classList.add('show-menu'));
    if (navClose) navClose.addEventListener('click', () => navMenu.classList.remove('show-menu'));
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('show-menu');
        });
    });

    // Scroll Events: Header Shadow & Active Link
    window.addEventListener('scroll', () => {
        // Shadow Header
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }

        // Active Link Highlighting
        let scrollY = window.pageYOffset;
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 100;
            const sectionId = current.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector('.nav__menu a[href*=' + sectionId + ']')?.classList.add('active');
            } else {
                document.querySelector('.nav__menu a[href*=' + sectionId + ']')?.classList.remove('active');
            }
        });
    });

    // --- 3. Portfolio Filtering ---
    const filters = document.querySelectorAll('.portfolio__filter');
    const cards = document.querySelectorAll('.portfolio__card');

    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            const target = filter.getAttribute('data-filter');

            cards.forEach(card => {
                card.style.transition = 'all 0.3s ease';
                if (target === 'all' || card.getAttribute('data-category') === target) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => card.style.display = 'none', 300);
                }
            });
        });
    });

    // --- 4. Intersection Observer (Modern Reveal Animation) ---
    // Cara ini jauh lebih ringan daripada window.addEventListener('scroll')
    const revealElements = document.querySelectorAll('.reveal');

    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Animasi hanya jalan sekali
            }
        });
    }, revealOptions);

    revealElements.forEach(el => revealOnScroll.observe(el));

    console.log('%c Portfolio upgraded successfully.', 'color: #9ACD32; font-weight: bold; font-size: 14px;');
});