/**
 * animations.js
 * Menangani logika animasi scroll dan Toast Notification untuk UI Storefront.
 */

// --- 1. INTERSECTION OBSERVER (Scroll Animations) ---
document.addEventListener('DOMContentLoaded', () => {
    // Cari semua elemen dengan class .reveal
    const revealElements = document.querySelectorAll('.reveal');

    // Konfigurasi Observer
    const revealOptions = {
        threshold: 0.1, // Terpicu ketika 10% elemen masuk ke viewport
        rootMargin: "0px 0px -50px 0px" // Sedikit menunda trigger
    };

    const revealObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('active');
                // Hentikan observasi pada elemen ini setelah animasi berjalan sekali
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
});

// Mengekspos fungsi observe secara global agar elemen dinamis (seperti kartu produk) bisa di-observe
window.observeElement = function(element) {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    observer.observe(element);
};

// --- 2. TOAST NOTIFICATION SYSTEM ---
/**
 * Menampilkan Toast Notification
 * @param {string} message Pesan yang ingin ditampilkan
 * @param {string} type Jenis toast ('success', 'error', 'info')
 */
window.showStoreToast = function(message, type = 'success') {
    const container = document.getElementById('storeToastContainer');
    if (!container) return;

    // Buat elemen toast
    const toast = document.createElement('div');
    toast.className = `store-toast store-toast-${type}`;
    
    // Set icon berdasarkan tipe
    let iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    if (type === 'info') iconName = 'info';

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;

    // Tambahkan ke container
    container.appendChild(toast);
    
    // Inisialisasi ikon Lucide pada toast baru
    if (window.lucide) {
        lucide.createIcons({ root: toast });
    }

    // Tampilkan dengan sedikit penundaan untuk memastikan transisi CSS berjalan
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Hapus otomatis setelah 3 detik
    setTimeout(() => {
        toast.classList.remove('show');
        // Tunggu animasi fade out selesai sebelum menghapus dari DOM
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300); // Sesuaikan dengan durasi transisi CSS
    }, 3000);
};
