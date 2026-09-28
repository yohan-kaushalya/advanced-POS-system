// Dexie Store
const db = new Dexie('YohanXSuperDB');

db.version(1).stores({
    products: '++id, barcode, &name, category, type, sellingPriceInRetail, sellingPriceInWholesale, stock, color, size',
    sales: '++id, timestamp, total, paymentMethod, customerId, type, items',
    customers: '++id, &name, phone, debt, totalPurchases',
    vendors: '++id, &name, contact, due, itemsSupplied',
    settings: 'key, value'
});

db.version(2).stores({
    products: '++id, barcode, &name, category, type, sellingPriceInRetail, sellingPriceInWholesale, stock, color, size, image',
    sales: '++id, timestamp, total, paymentMethod, customerId, type, items',
    customers: '++id, &name, phone, debt, totalPurchases',
    vendors: '++id, &name, contact, due, itemsSupplied',
    cards: '++id, &number, holder, expiry, type',
    heldCarts: '++id, timestamp, note, items, customerId',
    users: '++id, &email, password, name, role',
    settings: 'key, value'
});

// Seed data function
async function seedData() {
    const count = await db.products.count();
    if (count === 0) {
        await db.products.bulkAdd([
            { barcode: '1001', name: 'Cotton T-Shirt - M', category: 'Men', type: 'Manufactured', costPrice: 500, sellingPriceInRetail: 1200, sellingPriceInWholesale: 900, stock: 50, color: 'Black', size: 'M', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { barcode: '1002', name: 'Blue Jeans - 32', category: 'Men', type: 'Purchased', costPrice: 1500, sellingPriceInRetail: 2500, sellingPriceInWholesale: 2100, stock: 20, color: 'Blue', size: '32', image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { barcode: '2001', name: 'Summer Dress', category: 'Women', type: 'Manufactured', costPrice: 800, sellingPriceInRetail: 1800, sellingPriceInWholesale: 1400, stock: 35, color: 'Floral', size: 'S', image: 'https://images.unsplash.com/photo-1515347619252-60a6bf4fffce?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { barcode: '3001', name: 'Kids Shorts', category: 'Kids', type: 'Purchased', costPrice: 300, sellingPriceInRetail: 750, sellingPriceInWholesale: 600, stock: 100, color: 'Red', size: '4-5Y', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' },
            { barcode: '4001', name: 'Leather Belt', category: 'Accessories', type: 'Purchased', costPrice: 600, sellingPriceInRetail: 1500, sellingPriceInWholesale: 1100, stock: 15, color: 'Brown', size: 'L', image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' }
        ]);
        console.log("Seeded Products");

        await db.customers.bulkAdd([
            { name: 'Walk-in Customer', phone: '', debt: 0, totalPurchases: 0 },
            { name: 'Kamal Perera (Wholesale)', phone: '0771234567', debt: 15000, totalPurchases: 250000 },
            { name: 'Saman Stores', phone: '0112345678', debt: 0, totalPurchases: 50000 }
        ]);
        console.log("Seeded Customers");
    } else {
        // Migration: Add images to existing products if missing
        const products = await db.products.toArray();
        let updated = false;

        for (const p of products) {
            // Check for missing image OR broken 'source.unsplash.com' links (deprecated service)
            if (!p.image || p.image.includes('source.unsplash.com')) {
                let keyword = 'fashion';
                if (p.name.toLowerCase().includes('shirt')) keyword = 'shirt';
                else if (p.name.toLowerCase().includes('jean')) keyword = 'jeans';
                else if (p.name.toLowerCase().includes('dress')) keyword = 'dress';
                else if (p.category.toLowerCase().includes('kid')) keyword = 'kid';

                // Unique random image
                p.image = `https://images.unsplash.com/photo-${getUnsplashId(keyword)}?auto=format&fit=crop&w=500&q=60`;
                await db.products.put(p);
                updated = true;
            }
        }
        if (updated) console.log("Migrated: Added images to existing products");
    }
}

// Helper to get reliable unsplash IDs since source.unsplash is deprecated/unreliable
function getUnsplashId(keyword) {
    const map = {
        'shirt': '1521572163474-6864f9cf17ab',
        'jeans': '1542272454315-4c01d7abdf4a',
        'dress': '1515347619252-60a6bf4fffce',
        'kid': '1591195853828-11db59a44f6b',
        'fashion': '1483985988355-763728e1935b'
    };
    return map[keyword] || map['fashion'];
}

// Helper functions for DB
const DB = {
    getAllProducts: () => db.products.toArray(),
    getProductByBarcode: (barcode) => db.products.where('barcode').equals(barcode).first(),
    searchProducts: (query) => db.products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode.includes(query)).toArray(),
    addSale: async (saleData) => {
        return await db.transaction('rw', db.products, db.sales, db.customers, async () => {
            // Add sale record
            const saleId = await db.sales.add(saleData);

            // Update stock
            for (const item of saleData.items) {
                const product = await db.products.get(item.productId);
                if (product) {
                    await db.products.update(item.productId, { stock: product.stock - item.quantity });
                }
            }

            // Update customer if credit/record
            if (saleData.customerId) {
                const customer = await db.customers.get(saleData.customerId);
                if (customer) {
                    let newDebt = customer.debt;
                    // Assuming 'Credit' payment method adds to debt? Usually yes.
                    // But for simplification, let's just track total purchases.
                    // Only update debt if we specifically implement credit sales logic.
                    // For now just total purchases.
                    await db.customers.update(saleData.customerId, {
                        totalPurchases: customer.totalPurchases + saleData.total
                    });
                }
            }
            return saleId;
        });
    },
    getDailySales: async () => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return await db.sales.where('timestamp').aboveOrEqual(startOfDay.getTime()).toArray();
    }
};

seedData();
