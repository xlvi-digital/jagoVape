document.addEventListener('alpine:init', () => {
    Alpine.data('vapeStore', () => ({
        // Apps Script Web App URL (PENTING: Gunakan URL dari Deployment terbaru)
        scriptURL: 'https://script.google.com/macros/s/AKfycbxr2ZJm6cHKU4U89Pj5vSi-sGBspkHPQNDkjRdA-A5wkzJJGbMJgHLtQg5LxV7th1kDuA/exec',

        isLoading: true,
        isCartOpen: false,
        searchQuery: '',
        activeCategory: 'All',
        showToast: false,
        cart: [],
        phoneWA: '6281313362467',
        products: [],
        scrolled: false,

        async init() {
            try {
                const response = await fetch(this.scriptURL, { mode: 'cors' });
                const result = await response.json();

                // Debugging: Lihat data yang benar-benar sampai di browser
                console.log('📦 JagoVape Data Received:', result);

                // Handle both raw array and wrapper {status, data}
                const rawData = result.data || result;

                // Proteksi: Filter data yang tidak valid (Nama kosong atau Harga bukan angka)
                this.products = rawData.filter(p => {
                    const validNama = p.nama && p.nama.trim() !== "";
                    const validHarga = p.harga !== null && !isNaN(p.harga) && p.harga > 0;
                    return validNama && validHarga;
                });

                console.log('✅ Filtered Products:', this.products);
            } catch (error) {
                console.error('❌ Gagal mengambil data:', error);
            } finally {
                this.isLoading = false;
            }

            // Scroll Listener for Navbar
            window.addEventListener('scroll', () => {
                this.scrolled = window.scrollY > 50;
            });
        },

        get filteredProducts() {
            return this.products.filter(p => {
                const matchesSearch = p.nama.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesCat = this.activeCategory === 'All' || p.kategori === this.activeCategory;
                return matchesSearch && matchesCat;
            });
        },

        // Cart Computeds
        get cartTotalItems() {
            return this.cart.reduce((sum, item) => sum + item.qty, 0);
        },

        get cartTotalAmount() {
            return this.cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
        },

        // Actions
        addToCart(product) {
            if (product.status_stock !== 'ready') return;

            const existing = this.cart.find(i => i.id === product.id);
            if (existing) {
                existing.qty++;
            } else {
                this.cart.push({ ...product, qty: 1 });
            }

            this.triggerToast();
        },

        updateQty(id, delta) {
            const item = this.cart.find(i => i.id === id);
            if (item) {
                item.qty += delta;
                if (item.qty < 1) {
                    this.removeFromCart(id);
                }
            }
        },

        removeFromCart(id) {
            this.cart = this.cart.filter(i => i.id !== id);
        },

        triggerToast() {
            this.showToast = true;
            setTimeout(() => {
                this.showToast = false;
            }, 2500);
        },

        formatRupiah(num) {
            // Proteksi: Jika data bukan angka, return Rp0
            const value = Number(num);
            if (isNaN(value)) return 'Rp0';
            return 'Rp' + value.toLocaleString('id-ID');
        },

        scrollToProducts() {
            const el = document.getElementById('products');
            if (!el) return;
            const offset = 80;
            const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        },

        checkoutWA(singleProduct = null) {
            let text = "";
            let totalPrice = 0;

            if (singleProduct) {
                // Direct Checkout via Product Card
                text = `Halo *jagoVape*, saya ingin memesan:%0A%0A`;
                text += `1. *${singleProduct.nama}* (1x)%0A`;
                text += `   Harga: ${this.formatRupiah(singleProduct.harga)}%0A`;
                totalPrice = singleProduct.harga;
            } else {
                // Checkout via Cart Modal
                if (this.cart.length === 0) return;
                text = `Halo *jagoVape*, saya ingin memesan dari keranjang:%0A%0A`;
                this.cart.forEach((item, index) => {
                    text += `${index + 1}. *${item.nama}* (${item.qty}x)%0A`;
                    text += `   Harga: ${this.formatRupiah(item.harga * item.qty)}%0A`;
                });
                totalPrice = this.cartTotalAmount;
            }

            text += `%0A*Total: ${this.formatRupiah(totalPrice)}*%0A%0A`;
            text += `Mohon info ketersediaan stoknya. Terima kasih!`;

            const url = `https://wa.me/${this.phoneWA}?text=${text}`;
            window.open(url, '_blank');
        }
    }));
});

// --- GLOBAL UTILITIES ---

// Solusi Masalah 1: Fallback Image menggunakan SVG Inline (No Connection required)
function handleImageError(img) {
    img.onerror = null; // Menghindari looping terus menerus
    const svg = `
        <svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1f1f1f"/>
            <text x="50%" y="45%" font-family="Plus Jakarta Sans, sans-serif" font-weight="700" font-size="24" fill="#333" text-anchor="middle">jagoVape</text>
            <text x="50%" y="55%" font-family="Plus Jakarta Sans, sans-serif" font-weight="500" font-size="16" fill="#444" text-anchor="middle">No Image Available</text>
            <path d="M180 200 L220 200 M200 180 L200 220" stroke="#333" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;
    img.src = `data:image/svg+xml;base64,${btoa(svg)}`;
}
