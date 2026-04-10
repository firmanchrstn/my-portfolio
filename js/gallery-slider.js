const gallery = document.querySelector('.design-gallery');
const dotsContainer = document.getElementById('gallery-dots');
const cards = document.querySelectorAll('.gallery-item');
const cardWidth = 324; // Lebar card 300px + gap 24px
let isMouseOver = false;

// 1. Buat dots secara dinamis berdasarkan jumlah card yang ada di HTML
if (dotsContainer) {
    cards.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            gallery.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
        });
        dotsContainer.appendChild(dot);
    });
}

const dots = document.querySelectorAll('.dot');

// 2. Fungsi untuk update dot aktif berdasarkan posisi scroll
function updateDots() {
    const scrollPosition = gallery.scrollLeft;
    const index = Math.round(scrollPosition / cardWidth);

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

// Event Listeners
gallery.addEventListener('scroll', updateDots);
gallery.addEventListener('mouseover', () => isMouseOver = true);
gallery.addEventListener('mouseout', () => isMouseOver = false);

// 3. Fungsi Auto Scroll Loop
function autoScroll() {
    if (!isMouseOver) {
        const maxScrollLeft = gallery.scrollWidth - gallery.clientWidth;

        // Jika sudah di ujung, balik ke awal, jika belum geser satu card
        if (gallery.scrollLeft >= maxScrollLeft - 1) {
            gallery.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            gallery.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
    }
}

// Jalankan auto scroll setiap 3 detik
setInterval(autoScroll, 3000);