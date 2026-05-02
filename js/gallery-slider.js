const gallery = document.querySelector('.design-gallery');
const dotsContainer = document.getElementById('gallery-dots');
const cards = document.querySelectorAll('.gallery-item');
const cardWidth = 324;
let isMouseOver = false;

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

function updateDots() {
    const scrollPosition = gallery.scrollLeft;
    const index = Math.round(scrollPosition / cardWidth);

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

gallery.addEventListener('scroll', updateDots);
gallery.addEventListener('mouseover', () => isMouseOver = true);
gallery.addEventListener('mouseout', () => isMouseOver = false);

function autoScroll() {
    if (!isMouseOver) {
        const maxScrollLeft = gallery.scrollWidth - gallery.clientWidth;
        if (gallery.scrollLeft >= maxScrollLeft - 1) {
            gallery.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            gallery.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
    }
}

setInterval(autoScroll, 3000);


// ================= LIGHTBOX LOGIC =================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const galleryImages = document.querySelectorAll('.img-wrapper img');

if (lightbox && lightboxImg) {
    // Buka Lightbox saat gambar di dalam galeri diklik
    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
            lightboxImg.src = img.src; 
            lightbox.classList.add('active'); 
            document.body.style.overflow = 'hidden'; 
        });
    });

    // Fungsi untuk menutup Lightbox
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto'; 
    }

    // Tutup saat tombol (X) diklik
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }

    // Tutup saat area luar gambar (background gelap) diklik
    lightbox.addEventListener('click', (e) => {
        if (e.target !== lightboxImg) {
            closeLightbox();
        }
    });

    // UX Tambahan: Tutup menggunakan tombol 'Escape' di keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}
