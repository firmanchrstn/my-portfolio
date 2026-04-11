/* ==================== SCRIPT UTAMA - FIRMAN PORTFOLIO ==================== */

// ===== DOM Elements =====
const header = document.getElementById('header');
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');
const navLinks = document.querySelectorAll('.nav__link');
const themeToggle = document.getElementById('theme-toggle');
const portfolioFilters = document.querySelectorAll('.portfolio__filter');
const portfolioCards = document.querySelectorAll('.portfolio__card');
const contactForm = document.getElementById('contact-form');

// ===== 1. Mobile Menu =====
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.add('show');
    });
}

if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('show');
    });
}

// Close menu when clicking on nav links
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('show');
    });
});

// ===== 2. Smooth Scroll with Negative Offset (Biar Konten Naik) =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const headerHeight = header ? header.offsetHeight : 0;

            // GUNAKAN OFFSET NEGATIF agar konten naik lebih tinggi dari batas navbar
            // Ganti -100 menjadi angka yang lebih besar jika kurang naik (misal -150)
            const offset = 0;

            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight + offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== 3. Active Navigation Link (Ganti Warna Teks Navbar) =====
const sections = document.querySelectorAll('section[id]');

function scrollActive() {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        // Berikan toleransi offset agar warna berubah sebelum section menyentuh navbar
        const sectionTop = section.offsetTop - 200;
        const sectionId = section.getAttribute('id');

        // Cari link yang href-nya sesuai ID
        const navLink = document.querySelector(`.nav__link[href*="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLink.classList.add('active'); // Harus sama dengan nama class di CSS
        } else {
            navLink.classList.remove('active');
        }
    });
}
window.addEventListener('scroll', scrollActive);

// ===== 4. Header Scroll Effect (Shadow on Scroll) =====
window.addEventListener('scroll', () => {
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
});

// ===== 5. Theme Toggle (Dark/Light Mode) =====
function getPreferredTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

if (themeToggle) {
    setTheme(getPreferredTheme());
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

// ===== 6. Portfolio Filter =====
portfolioFilters.forEach(filter => {
    filter.addEventListener('click', () => {
        portfolioFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');

        const category = filter.getAttribute('data-filter');

        portfolioCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// ===== 7. Scroll Reveal Animation =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.portfolio__card, .about__stat, .contact__box').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===== Console Welcome Message =====
console.log('%c Welcome to Firman Christian Purba Portfolio!', 'font-size: 20px; font-weight: bold; color: #9ACD32;');