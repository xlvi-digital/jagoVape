document.addEventListener('alpine:init', () => {
    Alpine.data('vapeStore', () => ({
        isCartOpen: false,
        searchQuery: '',
        activeCategory: 'All',
        showToast: false,
        cart: [],
        phoneWA: '6281313362467', // Format: Kode negara + Nomor (tanpa + / 0 di depan)

        products: [
            {
                id: 1,
                name: 'Vaporesso XROS 3 Pod Kit - Royal Gold',
                price: 320000,
                image: 'images/1.jpg',
                category: 'Devices',
                status: 'ready'
            },
            {
                id: 2,
                name: 'Caliburn G2 Pod System - Matte Black',
                price: 265000,
                image: 'images/2.jpg',
                category: 'Devices',
                status: 'ready'
            },
            {
                id: 3,
                name: 'Lost Vape Centaurus M200 Limited Edition',
                price: 780000,
                image: 'images/3.png',
                category: 'Devices',
                status: 'ready'
            },
            {
                id: 4,
                name: 'Oat Drips V1 Milk & Cereal 100ml 3mg',
                price: 185000,
                image: 'images/4.png',
                category: 'Liquids',
                status: 'ready'
            },
            {
                id: 5,
                name: 'American Fruity Strawberry 60ml 3mg',
                price: 135000,
                image: 'images/5.png',
                category: 'Liquids',
                status: 'kosong'
            },
            {
                id: 6,
                name: 'Tokyo Banana Premium Liquid 60ml',
                price: 210000,
                image: 'images/6.jpg',
                category: 'Liquids',
                status: 'ready'
            },
            {
                id: 7,
                name: 'Cartridge XROS Series (Isi 4 Pcs)',
                price: 140000,
                image: 'images/7.jpg',
                category: 'Accessories',
                status: 'ready'
            },
            {
                id: 8,
                name: 'Cotton Bacon V2 - Premium Cotton',
                price: 550000,
                image: 'images/8.jpg',
                category: 'Accessories',
                status: 'ready'
            }
        ],

        // Filtering Logic
        get filteredProducts() {
            return this.products.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const matchesCat = this.activeCategory === 'All' || p.category === this.activeCategory;
                return matchesSearch && matchesCat;
            });
        },

        // Cart Computeds
        get cartTotalItems() {
            return this.cart.reduce((sum, item) => sum + item.qty, 0);
        },

        get cartTotalAmount() {
            return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        },

        // Actions
        addToCart(product) {
            if (product.status !== 'ready') return;

            const existing = this.cart.find(i => i.id === product.id);
            if (existing) {
                existing.qty++;
            } else {
                this.cart.push({ ...product, qty: 1 });
            }

            // Silent Add: Show Toast, Not Modal
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
            return 'Rp' + num.toLocaleString('id-ID');
        },

        scrollToProducts() {
            const el = document.getElementById('products');
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

            let text = `Halo *JagoVape*, saya ingin memesan:%0A%0A`;

            this.cart.forEach((item, index) => {
                text += `${index + 1}. *${item.name}* (${item.qty}x)%0A`;
                text += `   Harga: ${this.formatRupiah(item.price * item.qty)}%0A`;
            });

            text += `%0A*Total: ${this.formatRupiah(this.cartTotalAmount)}*%0A%0A`;
            text += `Mohon info ketersediaan stoknya. Terima kasih!`;

            const url = `https://wa.me/6281313362467?text=${text}`;
            window.open(url, '_blank');
        }
    }));
});
