document.addEventListener('alpine:init', () => {
    Alpine.data('vapeStore', () => ({
        // Apps Script Web App URL (PENTING: Gunakan URL dari Deployment terbaru)
        scriptURL: 'https://script.google.com/macros/s/AKfycbzETqo3vc65WQ0FNOb1tlRV1S7cu-Eh3S-2v-yKQqqGRapHmDhZdKIpxEbYB-by7cdT/exec',

        isLoading: true,
        isCartOpen: false,
        searchQuery: '',
        activeCategory: 'All',
        showToast: false,
        cart: [],
        phoneWA: '6281313362467',
        products: [],

        async init() {
            try {
                const response = await fetch(this.scriptURL);
                const data = await response.json();
                this.products = data;
            } catch (error) {
                console.error('Gagal mengambil data:', error);
            } finally {
                this.isLoading = false;
            }
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
            if (!num) return 'Rp0';
            return 'Rp' + num.toLocaleString('id-ID');
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

        checkoutWA() {
            if (this.cart.length === 0) return;

            let text = `Halo *jagoVape*, saya ingin memesan:%0A%0A`;

            this.cart.forEach((item, index) => {
                text += `${index + 1}. *${item.nama}* (${item.qty}x)%0A`;
                text += `   Harga: ${this.formatRupiah(item.harga * item.qty)}%0A`;
            });

            text += `%0A*Total: ${this.formatRupiah(this.cartTotalAmount)}*%0A%0A`;
            text += `Mohon info ketersediaan stoknya. Terima kasih!`;

            const url = `https://wa.me/${this.phoneWA}?text=${text}`;
            window.open(url, '_blank');
        }
    }));
});
