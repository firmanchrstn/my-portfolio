/**
 * PORTFOLIO SYSTEM ARCHITECTURE
 * Modular (IIFE), Event Delegation, Native Dialog API
 */
(() => {
    'use strict';

    // --- 1. THEME MODULE ---
    const initTheme = () => {
        const themeToggle = document.getElementById('theme-toggle');
        const docEl = document.documentElement;

        const applyTheme = (theme) => {
            docEl.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        };

        const savedTheme = localStorage.getItem('theme') ||
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(savedTheme);

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = docEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                applyTheme(newTheme);
            });
        }
    };

    // --- 2. NAVIGATION & SCROLLSPY MODULE ---
    const initNav = () => {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navClose = document.getElementById('nav-close');
        const navLinks = document.querySelectorAll('.nav__link');

        // Fitur 1: Mobile Menu Toggle
        const toggleMenu = (isOpen) => {
            if (!navMenu) return;
            if (isOpen) {
                navMenu.classList.add('show-menu');
                if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden'; // Kunci scroll layar belakang
            } else {
                navMenu.classList.remove('show-menu');
                if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        };

        if (navToggle) navToggle.addEventListener('click', () => toggleMenu(true));
        if (navClose) navClose.addEventListener('click', () => toggleMenu(false));

        // Tutup menu mobile otomatis saat link diklik
        if (navMenu) {
            navMenu.addEventListener('click', (e) => {
                if (e.target.closest('.nav__link')) toggleMenu(false);
            });
        }

        // Fitur 2: ScrollSpy Teroptimasi (Indikator Aktif Saat Scroll)
        const sections = document.querySelectorAll('section[id]');
        if (sections.length > 0) {
            // Observer akan mendeteksi saat section berada di tengah layar
            const scrollSpyOptions = {
                root: null,
                rootMargin: '-40% 0px -60% 0px',
                threshold: 0
            };

            const scrollSpyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const currentId = entry.target.getAttribute('id');

                        // Hapus class active dari semua link
                        navLinks.forEach(link => {
                            link.classList.remove('active');
                            // Tambahkan class active ke link yang URL-nya cocok dengan ID section
                            const href = link.getAttribute('href');
                            if (href === `#${currentId}` || href === `index.html#${currentId}`) {
                                link.classList.add('active');
                            }
                        });
                    }
                });
            }, scrollSpyOptions);

            sections.forEach(section => scrollSpyObserver.observe(section));
        }
    };

    // --- 3. NATIVE DIALOG (MODALS & LIGHTBOX) ---
    const initDialogs = () => {
        const studyModal = document.getElementById('study-modal');
        const lightboxModal = document.getElementById('lightbox-modal');

        // Modal for Case Study Details via HTML5 <template>
        if (studyModal) {
            const contentArea = document.getElementById('modal-content');
            const closeBtn = studyModal.querySelector('.native-modal__close');

            document.body.addEventListener('click', (e) => {
                const trigger = e.target.closest('.open-detail');
                if (trigger) {
                    const targetId = trigger.getAttribute('data-target');
                    const template = document.getElementById(`tpl-${targetId}`);

                    if (template) {
                        contentArea.innerHTML = ''; // Clean previous
                        contentArea.appendChild(template.content.cloneNode(true));
                        studyModal.showModal(); // Native API handles focus trap
                        document.body.style.overflow = 'hidden';
                        studyModal.querySelector('.native-modal__wrapper').scrollTop = 0;
                    }
                }
            });

            const closeStudy = () => { studyModal.close(); document.body.style.overflow = ''; };
            closeBtn.addEventListener('click', closeStudy);
            studyModal.addEventListener('click', (e) => { if (e.target === studyModal) closeStudy(); });
        }

        // Image Lightbox Gallery
        if (lightboxModal) {
            const lightboxImg = document.getElementById('lightbox-img');
            const closeBtn = lightboxModal.querySelector('.native-modal__close');

            document.body.addEventListener('click', (e) => {
                const imgWrap = e.target.closest('.img-wrapper');
                if (imgWrap) {
                    const img = imgWrap.querySelector('img');
                    if (img) {
                        lightboxImg.src = img.src;
                        lightboxImg.alt = img.alt || "Zoomed image";
                        lightboxModal.showModal();
                        document.body.style.overflow = 'hidden';
                    }
                }
            });

            const closeLightbox = () => { lightboxModal.close(); document.body.style.overflow = ''; };
            closeBtn.addEventListener('click', closeLightbox);
            lightboxModal.addEventListener('click', (e) => { if (e.target === lightboxModal) closeLightbox(); });
        }
    };

    // --- 4. SCROLL ANIMATION OBSERVER ---
    const initReveals = () => {
        const elements = document.querySelectorAll('.reveal');
        if (!elements.length) return;

        // Respect Accessibility Preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            elements.forEach(el => el.classList.add('active'));
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target); // Perf boost
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        elements.forEach(el => observer.observe(el));
    };

    // --- INIT ---
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initNav();
        initDialogs();
        initReveals();
    });
})();