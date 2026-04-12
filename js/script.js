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
            // Check system preference
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

    // --- 2. Navigation Menu (Mobile) ---
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    const navClose = document.getElementById('nav-close');
    const navLinks = document.querySelectorAll('.nav__link');

    if (navToggle) navToggle.addEventListener('click', () => navMenu.classList.add('show-menu'));
    if (navClose) navClose.addEventListener('click', () => navMenu.classList.remove('show-menu'));
    navLinks.forEach(link => link.addEventListener('click', () => navMenu.classList.remove('show-menu')));

    // --- 3. Header Scroll Effect & Active Link Observer ---
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        // Header Shadow
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');

        // Active Link Highlighting
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // 100 is offset tolerance for the header
            if (scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // --- 4. Portfolio Filtering ---
    const filters = document.querySelectorAll('.portfolio__filter');
    const cards = document.querySelectorAll('.portfolio__card');

    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Remove active class from all
            filters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            const target = filter.getAttribute('data-filter');

            cards.forEach(card => {
                if (target === 'all' || card.getAttribute('data-category') === target) {
                    card.style.display = 'block';
                    // Small timeout to allow display:block to apply before animating opacity
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

    // --- 5. Intersection Observer (Scroll Reveal Animations) ---
    // This replaces CSS transitions on load and makes the site feel alive
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOptions = {
        threshold: 0.15, // Trigger when 15% visible
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Only animate once
        });
    }, revealOptions);

    revealElements.forEach(el => revealOnScroll.observe(el));

    // Console signature
    console.log('%c Portfolio upgraded successfully.', 'color: #9ACD32; font-weight: bold; font-size: 14px;');
});