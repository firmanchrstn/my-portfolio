/**
 * PORTFOLIO SYSTEM ARCHITECTURE
 * Modular (IIFE), Event Delegation, Native Dialog API
 */
(() => {
    'use strict';

    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 1. THEME MODULE ---
    const initTheme = () => {
        const themeToggle = document.getElementById('theme-toggle');
        const docEl = document.documentElement;

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const next = docEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                docEl.setAttribute('data-theme', next);
                try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
            });
        }
    };

    // --- 2. NAVIGATION & SCROLLSPY MODULE ---
    const initNav = () => {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navClose = document.getElementById('nav-close');
        const navLinks = document.querySelectorAll('.nav__link');

        const setMenu = (isOpen) => {
            if (!navMenu) return;
            navMenu.classList.toggle('show-menu', isOpen);
            if (navToggle) navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';

            if (isOpen) {
                const firstLink = navMenu.querySelector('.nav__link');
                if (firstLink) firstLink.focus();
            } else if (navToggle) {
                navToggle.focus();
            }
        };

        if (navToggle) {
            navToggle.addEventListener('click', () => setMenu(true));
            navToggle.setAttribute('aria-controls', 'nav-menu');
        }
        if (navClose) navClose.addEventListener('click', () => setMenu(false));
        if (navMenu) {
            navMenu.addEventListener('click', (e) => {
                if (e.target.closest('.nav__link')) setMenu(false);
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setMenu(false);
        });

        // ScrollSpy (only relevant on pages with in-page sections)
        const sections = document.querySelectorAll('section[id]');
        if (sections.length > 0 && navLinks.length > 0) {
            const scrollSpyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const currentId = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        link.classList.toggle('active',
                            href === `#${currentId}` || href === `index.html#${currentId}`);
                    });
                });
            }, { rootMargin: '-40% 0px -60% 0px', threshold: 0 });

            sections.forEach(section => scrollSpyObserver.observe(section));
        }
    };

    // --- 3. NATIVE DIALOG (MODALS & LIGHTBOX) ---
    const initDialogs = () => {
        const studyModal = document.getElementById('study-modal');
        const lightboxModal = document.getElementById('lightbox-modal');

        const lockBodyScroll = (lock) => { document.body.style.overflow = lock ? 'hidden' : ''; };

        // Study detail modal via HTML5 <template>
        if (studyModal) {
            const contentArea = document.getElementById('modal-content');
            const closeBtn = studyModal.querySelector('.native-modal__close');

            document.body.addEventListener('click', (e) => {
                const trigger = e.target.closest('.open-detail');
                if (!trigger) return;
                const template = document.getElementById(`tpl-${trigger.getAttribute('data-target')}`);
                if (!template) return;
                contentArea.innerHTML = '';
                contentArea.appendChild(template.content.cloneNode(true));
                const wrapper = studyModal.querySelector('.native-modal__wrapper');
                if (wrapper) wrapper.scrollTop = 0;
                studyModal.showModal(); // Native API handles focus trap
                lockBodyScroll(true);
                if (closeBtn) closeBtn.focus();
            });

            const closeStudy = () => { studyModal.close(); };
            if (closeBtn) closeBtn.addEventListener('click', closeStudy);
            studyModal.addEventListener('click', (e) => { if (e.target === studyModal) closeStudy(); });
            studyModal.addEventListener('close', () => lockBodyScroll(false));
        }

        // Image lightbox gallery
        if (lightboxModal) {
            const lightboxImg = document.getElementById('lightbox-img');
            const closeBtn = lightboxModal.querySelector('.native-modal__close');

            const openLightbox = (wrap) => {
                const img = wrap.querySelector('img');
                if (!img) return;
                lightboxImg.src = img.currentSrc || img.src;
                lightboxImg.alt = img.alt || 'Enlarged design preview';
                lightboxModal.showModal();
                lockBodyScroll(true);
                if (closeBtn) closeBtn.focus();
            };

            // Mouse / touch
            document.body.addEventListener('click', (e) => {
                const wrap = e.target.closest('.img-wrapper');
                if (wrap) openLightbox(wrap);
            });

            // Keyboard (Enter / Space on the role="button" wrapper)
            document.body.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                const target = e.target;
                if (target.classList && target.classList.contains('img-wrapper')) {
                    e.preventDefault();
                    openLightbox(target);
                }
            });

            const closeLightbox = () => { lightboxModal.close(); };
            if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
            lightboxModal.addEventListener('click', (e) => { if (e.target === lightboxModal) closeLightbox(); });
            lightboxModal.addEventListener('close', () => lockBodyScroll(false));
        }
    };

    // --- 4. SCROLL ANIMATION OBSERVER ---
    const initReveals = () => {
        const elements = document.querySelectorAll('.reveal');
        if (!elements.length) return;

        // Respect accessibility preference
        if (prefersReducedMotion()) {
            elements.forEach(el => el.classList.add('active'));
            return;
        }

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        elements.forEach(el => observer.observe(el));
    };

    // --- 5. CONTACT FORM (dependency-free mailto delivery) ---
    const initForm = () => {
        const form = document.querySelector('.contact__form');
        const status = document.getElementById('form-status');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const data = new FormData(form);
            const name = data.get('name') || '';
            const email = data.get('email') || '';
            const subject = data.get('subject') || 'Portfolio Inquiry';
            const message = data.get('message') || '';

            const body = encodeURIComponent(`Hi Firman,\n\n${message}\n\n— ${name}\n${email}`);
            window.location.href =
                `mailto:firmanchristianp@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;

            if (status) {
                status.hidden = false;
                status.textContent = 'Your email app has been opened with your message ready to send. Thank you!';
            }
        });
    };

    // --- INIT ---
    document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.classList.add('js');
        initTheme();
        initNav();
        initDialogs();
        initReveals();
        initForm();
    });
})();