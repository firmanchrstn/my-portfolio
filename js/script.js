/**
 * GLOBAL PORTFOLIO SYSTEM
 * Architecture: Modular (IIFE), Event Delegation, Scroll Optimized
 */

(() => {
    'use strict';

    // --- UTILITIES ---
    // Optimasi performa untuk event scroll/resize
    const throttle = (func, limit) => {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // --- 1. THEME MODULE ---
    const initTheme = () => {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

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

        themeToggle.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    };

    // --- 2. NAVIGATION MODULE ---
    const initNavigation = () => {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navClose = document.getElementById('nav-close');
        const body = document.body;

        const toggleMenu = (show) => {
            if (!navMenu) return;
            if (show) {
                navMenu.classList.add('show-menu');
                body.style.overflow = 'hidden';
            } else {
                navMenu.classList.remove('show-menu');
                body.style.overflow = '';
            }
        };

        if (navToggle) navToggle.addEventListener('click', () => toggleMenu(true));
        if (navClose) navClose.addEventListener('click', () => toggleMenu(false));

        // Menutup menu saat link diklik (Event Delegation)
        if (navMenu) {
            navMenu.addEventListener('click', (e) => {
                if (e.target.closest('.nav__link')) toggleMenu(false);
            });
        }

        // Active Routing & Scrollspy (Dioptimalkan dengan Throttling)
        const isWorkPage = window.location.pathname.includes('/work/');

        if (isWorkPage) {
            const workLink = document.querySelector('.nav__menu a[href*="#portfolio"]');
            if (workLink) workLink.classList.add('active');
        } else {
            const sections = document.querySelectorAll('section[id]');
            const scrollSpy = throttle(() => {
                let scrollY = window.scrollY;
                sections.forEach(current => {
                    const sectionHeight = current.offsetHeight;
                    const sectionTop = current.offsetTop - 150;
                    const sectionId = current.getAttribute('id');
                    const navLink = document.querySelector(`.nav__menu a[href*="#${sectionId}"]`);

                    if (navLink) {
                        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                            navLink.classList.add('active');
                        } else {
                            navLink.classList.remove('active');
                        }
                    }
                });
            }, 100); // Eksekusi maksimal tiap 100ms

            window.addEventListener('scroll', scrollSpy, { passive: true });
        }
    };

    // --- 3. PORTFOLIO FILTER MODULE ---
    const initPortfolioFilter = () => {
        const filterContainer = document.querySelector('.portfolio__filters');
        const projectCards = document.querySelectorAll('.portfolio__card');

        // Menggunakan Event Delegation pada container filter
        if (filterContainer && projectCards.length > 0) {
            filterContainer.addEventListener('click', (e) => {
                const button = e.target.closest('.portfolio__filter');
                if (!button) return;

                // Update UI state
                document.querySelectorAll('.portfolio__filter').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filterValue = button.getAttribute('data-filter');

                projectCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (filterValue === 'all' || filterValue === cardCategory) {
                        card.style.display = 'flex';
                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1) translateY(0)';
                        });
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95) translateY(10px)';
                        setTimeout(() => {
                            if (card.style.opacity === '0') card.style.display = 'none';
                        }, 400);
                    }
                });
            });
        }
    };

    // --- 4. LIGHTBOX & MODAL MODULE ---
    const initUIInteractions = () => {
        // Lightbox
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const body = document.body;

        if (lightbox && lightboxImg) {
            const closeLightbox = () => {
                lightbox.classList.remove('active');
                body.style.overflow = '';
            };

            // Event Delegation untuk semua gambar gallery
            document.body.addEventListener('click', (e) => {
                const img = e.target.closest('.img-wrapper img, .details__main-img');
                if (img) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('active');
                    body.style.overflow = 'hidden';
                }
            });

            lightbox.addEventListener('click', (e) => {
                if (e.target.closest('#lightbox-close') || e.target === lightbox) {
                    closeLightbox();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
            });
        }

        // Modal Study (Work Pages)
        const modalBackdrop = document.getElementById('study-modal');
        const modalContentArea = document.getElementById('modal-content');

        if (modalBackdrop && modalContentArea) {
            const closeModal = () => {
                modalBackdrop.classList.remove('active');
                body.style.overflow = '';
            };

            // Event delegation untuk tombol "Read Full Story"
            document.body.addEventListener('click', (e) => {
                const btn = e.target.closest('.open-detail');
                if (btn) {
                    const targetId = btn.getAttribute('data-target');
                    const sourceData = document.querySelector(`[data-id="${targetId}"]`);

                    if (sourceData) {
                        modalContentArea.innerHTML = sourceData.innerHTML;
                        modalBackdrop.classList.add('active');
                        body.style.overflow = 'hidden';

                        const modalCard = document.querySelector('.modal-card');
                        if (modalCard) modalCard.scrollTop = 0;
                    }
                }
            });

            modalBackdrop.addEventListener('click', (e) => {
                if (e.target.closest('#modal-close') || e.target === modalBackdrop) {
                    closeModal();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) closeModal();
            });
        }
    };

    // --- 5. ANIMATION OBSERVER ---
    const initReveals = () => {
        const revealElements = document.querySelectorAll('.reveal');
        if (revealElements.length === 0) return;

        const revealOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const revealOnScroll = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Lepas observer setelah animasi selesai (Memory optimization)
                }
            });
        }, revealOptions);

        revealElements.forEach(el => revealOnScroll.observe(el));
    };

    // --- INITIALIZATION ---
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initNavigation();
        initPortfolioFilter();
        initUIInteractions();
        initReveals();
    });

})();