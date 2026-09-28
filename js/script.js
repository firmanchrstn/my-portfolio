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

        if (!themeToggle) return;

        const syncLabel = () => {
            const dark = docEl.getAttribute('data-theme') === 'dark';
            themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        };

        syncLabel();
        themeToggle.addEventListener('click', () => {
            const next = docEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            docEl.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
            syncLabel();
        });
    };

    // --- 2. NAVIGATION & SCROLLSPY MODULE ---
    const initNav = () => {
        const navMenu = document.getElementById('nav-menu');
        const navToggle = document.getElementById('nav-toggle');
        const navClose = document.getElementById('nav-close');
        const navLinks = document.querySelectorAll('.nav__link');
        const mqMobile = window.matchMedia('(max-width: 768px)');

        // Applies the visual/ARIA/scroll state of the menu without moving focus.
        const applyMenuState = (isOpen) => {
            if (!navMenu) return;
            navMenu.classList.toggle('show-menu', isOpen);
            if (navToggle) navToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';

            // Off-canvas menu: prevent tab/screen-reader reach while closed on mobile
            if (navMenu.inert !== undefined) {
                navMenu.inert = !isOpen && mqMobile.matches;
            }
        };

        const setMenu = (isOpen) => {
            if (!navMenu) return;
            applyMenuState(isOpen);

            if (isOpen) {
                const firstLink = navMenu.querySelector('.nav__link');
                if (firstLink) firstLink.focus();
            } else if (navToggle && mqMobile.matches) {
                navToggle.focus();
            }
        };

        // Initial state: without this the closed off-canvas menu keeps its links in
        // the tab order (invisible focus targets) until the first interaction.
        applyMenuState(false);

        if (navToggle) {
            navToggle.addEventListener('click', () => setMenu(true));
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

        // The open menu covers the viewport, so Tab must cycle inside it instead of
        // reaching the page content hidden behind it.
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab' || !navMenu || !navMenu.classList.contains('show-menu')) return;
            const focusables = navMenu.querySelectorAll('a[href], button:not([disabled])');
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && (active === first || !navMenu.contains(active))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && (active === last || !navMenu.contains(active))) {
                e.preventDefault();
                first.focus();
            }
        });

        // Resizing from mobile → desktop while the menu is open must release the
        // scroll lock and expose the inline (desktop) menu again.
        const handleBreakpoint = (e) => {
            if (e.matches === false) setMenu(false);
        };
        if (mqMobile.addEventListener) {
            mqMobile.addEventListener('change', handleBreakpoint);
        } else if (mqMobile.addListener) {
            mqMobile.addListener(handleBreakpoint);
        }

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
        if (!studyModal && !lightboxModal) return;

        // Reference-counted: a second dialog (e.g. a lightbox opened from inside the
        // study modal) must not unlock the page while the first one is still open.
        let openDialogCount = 0;
        const lockBodyScroll = (lock) => {
            openDialogCount = Math.max(0, openDialogCount + (lock ? 1 : -1));
            document.body.style.overflow = openDialogCount > 0 ? 'hidden' : '';
        };

        // Shared dialog plumbing: close button, backdrop dismissal, scroll unlock.
        const closeButtons = new Map();
        const wireDialog = (dialog) => {
            const closeBtn = dialog.querySelector('.native-modal__close');
            closeButtons.set(dialog, closeBtn);
            if (closeBtn) closeBtn.addEventListener('click', () => dialog.close());
            dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
            dialog.addEventListener('close', () => lockBodyScroll(false));
        };

        const openDialog = (dialog) => {
            dialog.showModal(); // Native API handles focus trap
            lockBodyScroll(true);
            const closeBtn = closeButtons.get(dialog);
            if (closeBtn) closeBtn.focus();
        };

        if (studyModal) wireDialog(studyModal);
        if (lightboxModal) wireDialog(lightboxModal);

        // Study detail modal populated from an HTML5 <template>
        const openStudyDetail = (trigger) => {
            const template = document.getElementById(`tpl-${trigger.getAttribute('data-target')}`);
            if (!template) return;
            const contentArea = document.getElementById('modal-content');
            contentArea.innerHTML = '';
            contentArea.appendChild(template.content.cloneNode(true));
            const wrapper = studyModal.querySelector('.native-modal__wrapper');
            if (wrapper) wrapper.scrollTop = 0;
            openDialog(studyModal);
        };

        // Image lightbox gallery
        const openLightbox = (wrap) => {
            const img = wrap.querySelector('img');
            if (!img) return;
            const lightboxImg = document.getElementById('lightbox-img');
            lightboxImg.src = img.currentSrc || img.src;
            lightboxImg.alt = img.alt || 'Enlarged design preview';
            openDialog(lightboxModal);
        };

        // One delegated pair serves both dialogs for mouse, touch and keyboard
        // (Enter / Space on the role="button" image wrapper).
        document.body.addEventListener('click', (e) => {
            const trigger = e.target.closest('.open-detail');
            if (trigger && studyModal) {
                openStudyDetail(trigger);
                return;
            }
            const wrap = e.target.closest('.img-wrapper');
            if (wrap && lightboxModal) openLightbox(wrap);
        });

        document.body.addEventListener('keydown', (e) => {
            if (!lightboxModal || (e.key !== 'Enter' && e.key !== ' ')) return;
            const target = e.target;
            if (target.classList && target.classList.contains('img-wrapper')) {
                e.preventDefault();
                openLightbox(target);
            }
        });
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

    // --- 6. TABS MODULE ---
    const initTabs = () => {
        const tablist = document.querySelector('[role="tablist"]');
        if (!tablist) return;
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const panels = tabs
            .map((t) => document.getElementById(t.getAttribute('aria-controls')))
            .filter(Boolean);
        if (!tabs.length) return;

        const switchTab = (btn) => {
            const target = btn.getAttribute('aria-controls');
            tabs.forEach((t) => {
                const active = t === btn;
                t.classList.toggle('is-active', active);
                t.setAttribute('aria-selected', String(active));
                t.tabIndex = active ? 0 : -1;
            });
            panels.forEach((p) => {
                const show = p.id === target;
                p.hidden = !show;
                if (show) {
                    p.querySelectorAll('.reveal').forEach((el) => el.classList.add('active'));
                }
            });
        };

        tabs.forEach((btn) => {
            btn.addEventListener('click', () => switchTab(btn));
            btn.addEventListener('keydown', (e) => {
                const idx = tabs.indexOf(btn);
                let next = null;
                if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
                if (e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
                if (next) {
                    e.preventDefault();
                    switchTab(next);
                    next.focus();
                }
            });
        });
    };

    // --- INIT ---
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initNav();
        initDialogs();
        initReveals();
        initForm();
        initTabs();
    });
})();