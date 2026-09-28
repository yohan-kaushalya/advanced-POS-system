// State Management
let cart = [];
let currentTab = 'dashboard';
let isWholesale = false;
let currentCustomer = null;
let currentUser = null; // New user state

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth(); // Check auth first
});

function updateClock() {
    const now = new Date();
    // Logic to update a clock if present
}

// Auth Check
async function checkAuth() {
    // For specific session duration, we could check timestamps.
    // However, since Dexie is persistent, let's just use localStorage for session persistence id across reloads
    // or keep it simple: assume if 'currentUser' is in localStorage, they are logged in.
    const userId = localStorage.getItem('pos_user_id');
    if (userId) {
        const user = await db.users.get(parseInt(userId));
        if (user) {
            currentUser = user;
            updateUserUI();
            navigate('dashboard');
            updateClock();
            setInterval(updateClock, 1000); // 1s clock update
            document.getElementById('auth-container').classList.add('hidden'); // Hide Login
            return;
        }
    }

    // Not logged in or invalid user
    renderLogin();
}

function updateUserUI() {
    const nameEl = document.querySelector('aside .font-medium');
    const roleEl = document.querySelector('aside .text-xs.text-gray-400');
    const userIcon = document.querySelector('aside .rounded-full');

    if (nameEl && currentUser) nameEl.innerText = currentUser.name;
    if (roleEl && currentUser) roleEl.innerText = currentUser.role || 'Staff';
    if (userIcon && currentUser) {
        userIcon.innerText = currentUser.name.substring(0, 2).toUpperCase();
    }
}

// Navigation
function navigate(tab) {
    if (!currentUser) return; // Guard
    currentTab = tab;

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-gray-700', 'text-white', 'border-l-4', 'border-blue-500');
        el.classList.add('text-gray-300');
    });
    const activeNav = document.getElementById(`nav-${tab}`);
    if (activeNav) {
        activeNav.classList.add('bg-gray-700', 'text-white', 'border-l-4', 'border-blue-500');
        activeNav.classList.remove('text-gray-300');
    }

    // Render Content
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="flex items-center justify-center h-full"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>';

    setTimeout(() => {
        switch (tab) {
            case 'dashboard': renderDashboard(content); break;
            case 'pos': renderPOS(content); break;
            case 'inventory': renderInventory(content); break;
            case 'reports': renderReports(content); break;
        }
    }, 300); // Fake load for smooth feel
}

// ==========================================
// DASHBOARD
// ==========================================
async function renderDashboard(container) {
    const productsCount = await db.products.count();
    const sales = await DB.getDailySales();
    const todayTotal = sales.reduce((acc, sale) => acc + sale.total, 0);
    const lowStock = await db.products.where('stock').below(10).count();

    container.innerHTML = `
        <div class="header mb-6 animate-fade-in">
            <h2 class="text-3xl font-bold">Dashboard</h2>
            <p class="text-gray-400">Welcome back, Boss!</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <!-- Card 1 -->
            <div class="p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-blue-500 transition-all duration-300 group">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-gray-400 font-medium">Daily Sales</h3>
                    <div class="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition">
                        <i class="fa-solid fa-sack-dollar text-blue-400 text-xl"></i>
                    </div>
                </div>
                <p class="text-3xl font-bold">LKR ${todayTotal.toLocaleString()}</p>
                <div class="mt-4 flex items-center text-sm text-green-400">
                    <i class="fa-solid fa-arrow-trend-up mr-1"></i>
                    <span>+12% from yesterday</span>
                </div>
            </div>

            <!-- Card 2 -->
            <div class="p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-purple-500 transition-all duration-300 group">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-gray-400 font-medium">Low Stock Items</h3>
                    <div class="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition">
                        <i class="fa-solid fa-triangle-exclamation text-purple-400 text-xl"></i>
                    </div>
                </div>
                <p class="text-3xl font-bold">${lowStock}</p>
                <div class="mt-4 text-sm text-gray-400">
                    Needs attention
                </div>
            </div>

            <!-- Card 3 -->
            <div class="p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-green-500 transition-all duration-300 group">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-gray-400 font-medium">Total Products</h3>
                    <div class="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition">
                        <i class="fa-solid fa-shirt text-green-400 text-xl"></i>
                    </div>
                </div>
                <p class="text-3xl font-bold">${productsCount}</p>
                <div class="mt-4 text-sm text-gray-400">
                    Active Inventory
                </div>
            </div>
        </div>

        <!-- Recent Transactions -->
        <div class="mt-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6 animate-fade-in" style="animation-delay: 0.1s">
            <h3 class="text-xl font-bold mb-4">Recent Sales</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-gray-400">
                    <thead class="bg-gray-700/50 text-gray-200 uppercase">
                        <tr>
                            <th class="px-4 py-3">ID</th>
                            <th class="px-4 py-3">Total</th>
                            <th class="px-4 py-3">Payment</th>
                            <th class="px-4 py-3">Time</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                        ${sales.slice(-5).reverse().map(sale => `
                            <tr class="hover:bg-gray-700/30 transition">
                                <td class="px-4 py-3">#${sale.id}</td>
                                <td class="px-4 py-3 font-semibold text-white">LKR ${sale.total}</td>
                                <td class="px-4 py-3">
                                    <span class="px-2 py-1 rounded text-xs ${sale.paymentMethod === 'Cash' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}">
                                        ${sale.paymentMethod}
                                    </span>
                                </td>
                                <td class="px-4 py-3">${new Date(sale.timestamp).toLocaleTimeString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${sales.length === 0 ? '<p class="text-center py-4">No sales yet today.</p>' : ''}
            </div>
        </div>
    `;
}

// ==========================================
// POS SYSTEM
// ==========================================
async function renderPOS(container) {
    const products = await DB.getAllProducts();

    container.innerHTML = `
        <div class="flex h-full flex-col md:flex-row gap-6 animate-fade-in">
            <!-- Left: Product Grid -->
            <div class="flex-1 flex flex-col h-full overflow-hidden">
                <!-- Search & Filter -->
                <div class="bg-gray-800 p-4 rounded-lg shadow mb-4 flex gap-4 border border-gray-700">
                    <div class="relative flex-1">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-gray-400"></i>
                        <input type="text" id="pos-search" placeholder="Search item or scan barcode..." 
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                            onkeyup="filterProducts(this.value)">
                    </div>
                </div>

                <!-- Grid -->
                <div class="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar" id="product-grid">
                    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        ${products.map(p => createProductCard(p)).join('')}
                    </div>
                </div>
            </div>

            <!-- Right: Cart -->
            <div class="w-full md:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-xl flex flex-col h-full">
                <!-- Header -->
                <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
                    <h3 class="font-bold text-lg"><i class="fa-solid fa-cart-shopping mr-2 text-blue-400"></i>Current Cart</h3>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs text-gray-400">Wholesale</span>
                         <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="wholesale-toggle" class="sr-only peer" onchange="toggleWholesaleMode(this.checked)">
                            <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>

                <!-- Cart Items -->
                <div class="flex-1 overflow-y-auto p-4 space-y-3" id="cart-items">
                    <!-- Items go here -->
                    <div class="text-center text-gray-500 mt-10">
                        <i class="fa-solid fa-basket-shopping text-4xl mb-3 opacity-30"></i>
                        <p>Cart is empty</p>
                    </div>
                </div>

                <!-- Footer Total -->
                <div class="p-4 bg-gray-750 border-t border-gray-700">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-gray-400">Subtotal</span>
                        <span class="font-semibold" id="cart-subtotal">LKR 0.00</span>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-gray-400">Discount</span>
                        <span class="font-semibold text-green-400" id="cart-discount">LKR 0.00</span>
                    </div>
                    <div class="flex justify-between items-center mb-6">
                        <span class="text-xl font-bold">Total</span>
                        <span class="text-2xl font-bold text-blue-400" id="cart-total">LKR 0.00</span>
                    </div>
                    
                    <button onclick="showCheckoutModal()" class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transition transform hover:-translate-y-1 relative overflow-hidden group">
                        <span class="relative z-10 flex items-center justify-center">
                            Proces Payment <i class="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1 transition"></i>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    `;
    renderCart(); // Initial render if navigating back
}

function createProductCard(product) {
    const price = isWholesale ? product.sellingPriceInWholesale : product.sellingPriceInRetail;
    const badgeColor = product.type === 'Manufactured' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300';

    const imgDisplay = product.image
        ? `<img src="${product.image}" class="h-full w-full object-cover">`
        : `<div class="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-gray-500">
                <div class="text-center">
                    <i class="fa-solid fa-shirt text-4xl mb-2"></i>
                    <p class="text-[10px] uppercase tracking-wider">${product.category}</p>
                </div>
           </div>`;

    return `
        <div onclick="addToCart(${product.id})" class="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500 cursor-pointer transition-all duration-200 hover:shadow-lg group relative overflow-hidden">
            <div class="absolute top-2 right-2 z-10">
                <span class="text-xs px-2 py-0.5 rounded ${badgeColor}">${product.type}</span>
            </div>
            
            <div class="h-32 w-full bg-gray-900/50 rounded-lg mb-3 overflow-hidden">
                 ${imgDisplay}
            </div>
            
            <h4 class="font-bold text-gray-200 truncate">${product.name}</h4>
            <div class="flex justify-between items-center mt-2">
                <span class="text-gray-400 text-sm">${product.category}</span>
                <span class="font-bold text-blue-400">Rs ${price}</span>
            </div>
            <div class="mt-2 text-xs text-gray-500 flex justify-between">
                <span>Stock: ${product.stock}</span>
                <span>${product.size}</span>
            </div>
        </div>
    `;
}

function toggleWholesaleMode(checked) {
    isWholesale = checked;
    // Update cart items prices to match mode
    if (cart.length > 0) {
        showToast('Updating cart prices...', 'info');
        Promise.all(cart.map(async (item) => {
            const product = await db.products.get(item.productId);
            if (product) {
                item.price = isWholesale ? product.sellingPriceInWholesale : product.sellingPriceInRetail;
                item.isWholesale = isWholesale;
            }
            return item;
        })).then(() => {
            // Re-render POS to show updated cart and grid prices
            renderPOS(document.getElementById('content-area'));
        });
    } else {
        // Re-render POS to just update grid prices
        renderPOS(document.getElementById('content-area'));
    }
}

async function addToCart(productId) {
    const product = await db.products.get(productId);
    if (!product) return;

    // Calculate current quantity in cart for this product (across all line items)
    const currentQtyInCart = cart.reduce((acc, item) => item.productId === productId ? acc + item.quantity : acc, 0);

    if (product.stock <= currentQtyInCart) {
        showToast('Out of Stock!', 'error');
        return;
    }

    const existingItem = cart.find(item => item.productId === productId && item.isWholesale === isWholesale);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            productId: product.id,
            name: product.name,
            price: isWholesale ? product.sellingPriceInWholesale : product.sellingPriceInRetail,
            quantity: 1,
            isWholesale: isWholesale,
            maxStock: product.stock
        });
    }

    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function updateQuantity(index, delta) {
    const item = cart[index];
    const newQty = item.quantity + delta;
    if (newQty > 0 && newQty <= item.maxStock) {
        item.quantity = newQty;
    } else if (newQty > item.maxStock) {
        showToast('Max stock reached!', 'warning');
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 mt-10">
                <i class="fa-solid fa-basket-shopping text-4xl mb-3 opacity-30"></i>
                <p>Cart is empty</p>
            </div>`;
        updateCartTotals();
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg border border-gray-700 cart-item-enter">
            <div class="flex-1">
                <h4 class="font-medium text-sm text-gray-200">${item.name}</h4>
                <div class="text-xs text-gray-400 mt-1">Rs ${item.price} x ${item.quantity}</div>
            </div>
            <div class="flex items-center space-x-3">
                <div class="flex items-center bg-gray-900 rounded-lg border border-gray-700">
                    <button onclick="updateQuantity(${index}, -1)" class="px-2 py-1 text-gray-400 hover:text-white">-</button>
                    <span class="text-sm w-4 text-center">${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)" class="px-2 py-1 text-gray-400 hover:text-white">+</button>
                </div>
                <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-300">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');

    updateCartTotals();
}

function updateCartTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    // Determine discount logic (e.g. 5% if total > 5000 in retail)
    // For now simple 0
    const discount = 0;
    const total = subtotal - discount;

    document.getElementById('cart-subtotal').innerText = `LKR ${subtotal.toLocaleString()}`;
    document.getElementById('cart-discount').innerText = `LKR ${discount.toLocaleString()}`;
    document.getElementById('cart-total').innerText = `LKR ${total.toLocaleString()}`;
}

async function filterProducts(query) {
    const products = await DB.searchProducts(query);
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const wrapper = grid.querySelector('.grid');
    if (products.length === 0) {
        wrapper.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">No products found</div>';
    } else {
        wrapper.innerHTML = products.map(p => createProductCard(p)).join('');
    }
}

// ==========================================
// CHECKOUT & PAYMENT
// ==========================================
function showCheckoutModal() {
    if (cart.length === 0) {
        showToast('Cart is empty!', 'error');
        return;
    }
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    showModal(`
        <div class="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Payment Gateway</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div class="mb-6 text-center">
                    <p class="text-gray-400 text-sm uppercase tracking-wide mb-1">Total Amount</p>
                    <h2 class="text-4xl font-bold text-white">LKR ${total.toLocaleString()}</h2>
                </div>

                <div class="space-y-3 mb-8">
                    <button onclick="processPayment('Cash')" class="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-xl transition group">
                        <div class="flex items-center">
                            <i class="fa-solid fa-money-bill-wave text-green-400 text-xl mr-3"></i>
                            <span class="font-medium group-hover:text-white">Cash Payment</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-500 group-hover:text-white"></i>
                    </button>
                    
                    <button onclick="showCardInputModal()" class="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-xl transition group">
                        <div class="flex items-center">
                            <i class="fa-brands fa-cc-visa text-blue-400 text-xl mr-3"></i>
                            <span class="font-medium group-hover:text-white">Credit / Debit Card</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-500 group-hover:text-white"></i>
                    </button>
                    
                     <button onclick="showSavedCardsModal()" class="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-xl transition group">
                        <div class="flex items-center">
                            <i class="fa-solid fa-wallet text-yellow-400 text-xl mr-3"></i>
                            <span class="font-medium group-hover:text-white">Saved Cards / Wallet</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-500 group-hover:text-white"></i>
                    </button>

                    <button onclick="processPayment('Transfer')" class="w-full flex items-center justify-between p-4 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-xl transition group">
                        <div class="flex items-center">
                            <i class="fa-solid fa-building-columns text-purple-400 text-xl mr-3"></i>
                            <span class="font-medium group-hover:text-white">Bank Transfer</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-gray-500 group-hover:text-white"></i>
                    </button>
                </div>
            </div>
            
            <div class="bg-gray-900/50 p-4 text-center text-xs text-gray-500 border-t border-gray-800 flex justify-between px-6">
                <span><i class="fa-solid fa-lock mr-1"></i> Secure Payment</span>
                <div class="space-x-4">
                    <button onclick="holdCart()" class="text-yellow-500 hover:text-yellow-400 font-bold"><i class="fa-solid fa-pause mr-1"></i> Hold Order</button>
                    <button onclick="recallCartModal()" class="text-blue-500 hover:text-blue-400 font-bold"><i class="fa-solid fa-rotate-left mr-1"></i> Recall</button>
                </div>
            </div>
        </div>
    `);
}

async function showSavedCardsModal() {
    const cards = await db.cards.toArray();
    const modalContent = document.querySelector('#modal-container > div');

    let cardsHtml = cards.length > 0 ? cards.map(c => `
        <div onclick="processPayment('Saved Card: ${c.number.slice(-4)}')" class="p-4 border border-gray-600 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition mb-2">
            <div class="flex items-center">
                <i class="fa-brands fa-cc-visa text-2xl text-blue-400 mr-3"></i>
                <div>
                     <p class="font-bold text-white">•••• •••• •••• ${c.number.slice(-4)}</p>
                     <p class="text-xs text-gray-400">${c.holder} | Exp: ${c.expiry}</p>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-500"></i>
        </div>
    `).join('') : '<p class="text-center text-gray-400 py-4">No saved cards found.</p>';

    modalContent.innerHTML = `
        <div class="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
             <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">My Wallet</h3>
                    <button onclick="showCheckoutModal()" class="text-gray-400 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>
                </div>
                
                <div class="mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                    ${cardsHtml}
                </div>

                <button onclick="showAddCardForm()" class="w-full border-2 border-dashed border-gray-600 hover:border-blue-500 text-gray-400 hover:text-blue-400 font-bold py-3 rounded-lg transition">
                    <i class="fa-solid fa-plus mr-2"></i> Add New Card
                </button>
             </div>
        </div>
    `;
}

function showAddCardForm() {
    const modalContent = document.querySelector('#modal-container > div');
    modalContent.innerHTML = `
        <div class="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
             <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Add New Card</h3>
                    <button onclick="showSavedCardsModal()" class="text-gray-400 hover:text-white"><i class="fa-solid fa-arrow-left"></i></button>
                </div>

                <form onsubmit="handleSaveCard(event)">
                    <div class="mb-4">
                        <label class="block text-sm text-gray-400 mb-1">Card Number</label>
                        <input type="text" name="number" id="save-card-number" placeholder="0000 0000 0000 0000" maxlength="19" required
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm text-gray-400 mb-1">Card Holder Name</label>
                        <input type="text" name="holder" required class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                             <label class="block text-sm text-gray-400 mb-1">Expiry</label>
                             <input type="text" name="expiry" placeholder="MM/YY" maxlength="5" required
                                class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white text-center">
                        </div>
                        <div>
                             <label class="block text-sm text-gray-400 mb-1">Type</label>
                             <select name="type" class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                                <option>Visa</option>
                                <option>Master</option>
                             </select>
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg">Save Card</button>
                </form>
             </div>
        </div>
    `;

    // Format card input with spaces
    const input = document.getElementById('save-card-number');
    input.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        e.target.value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    });
}

async function handleSaveCard(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const card = {
        number: formData.get('number'),
        holder: formData.get('holder'),
        expiry: formData.get('expiry'),
        type: formData.get('type')
    };

    await db.cards.add(card);
    showToast('Card Saved!');
    showSavedCardsModal();
}

// Hold Cart Functionality
async function holdCart() {
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }
    const note = prompt("Enter a reference note for this order:");
    if (note) {
        await db.heldCarts.add({
            timestamp: Date.now(),
            note: note,
            items: [...cart],
            customerId: null
        });
        cart = [];
        renderPOS(document.getElementById('content-area'));
        closeModal();
        showToast('Order held successfully!');
    }
}

async function recallCartModal() {
    const carts = await db.heldCarts.toArray();
    let html = carts.length > 0 ? carts.map(c => `
        <div class="flex justify-between items-center bg-gray-700/50 p-3 rounded mb-2">
            <div>
                <p class="font-bold text-white">${c.note}</p>
                <p class="text-xs text-gray-400">${new Date(c.timestamp).toLocaleTimeString()} - ${c.items.length} Items</p>
            </div>
            <div>
                 <button onclick="restoreCart(${c.id})" class="text-blue-400 hover:text-blue-300 mr-3"><i class="fa-solid fa-box-open"></i> Restore</button>
                 <button onclick="deleteHeldCart(${c.id})" class="text-red-400 hover:text-red-300"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('') : '<p class="text-gray-500 text-center">No held orders.</p>';

    showModal(`
         <div class="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Held Orders</h3>
                <button onclick="closeModal()" class="text-gray-400"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="max-h-96 overflow-y-auto">
                ${html}
            </div>
         </div>
    `);
}

async function restoreCart(id) {
    const held = await db.heldCarts.get(id);
    if (held) {
        cart = held.items;
        await db.heldCarts.delete(id);
        closeModal();
        renderPOS(document.getElementById('content-area'));
        showToast('Order restored!');
    }
}

async function deleteHeldCart(id) {
    await db.heldCarts.delete(id);
    // Re-render modal? Ideally yes, but sticking to quick close for now to avoid complexity in one shot
    closeModal();
    showToast('Held order deleted');
}

function showCardInputModal() {
    const modalContent = document.querySelector('#modal-container > div');
    modalContent.innerHTML = `
        <div class="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
             <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Card Payment</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-white"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <form id="card-form" onsubmit="handleCardPayment(event)">
                    <div class="mb-4">
                        <label class="block text-sm text-gray-400 mb-1">Card Number</label>
                        <div class="relative">
                             <input type="text" id="card-number" placeholder="0000 0000 0000 0000" maxlength="19" required
                                class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition font-mono tracking-widest text-white">
                             <i class="fa-regular fa-credit-card absolute left-3 top-3.5 text-gray-500"></i>
                        </div>
                        <p id="card-error" class="text-red-500 text-xs mt-1 hidden"></p>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-6">
                        <div>
                             <label class="block text-sm text-gray-400 mb-1">Expiry</label>
                             <input type="text" placeholder="MM/YY" maxlength="5" required
                                class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white text-center">
                        </div>
                        <div>
                             <label class="block text-sm text-gray-400 mb-1">CVC</label>
                             <input type="password" placeholder="123" maxlength="3" required
                                class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white text-center">
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition transform active:scale-95">
                        Pay Now <span id="pay-amount"></span>
                    </button>
                </form>
             </div>
        </div>
    `;

    // Format card input with spaces
    const input = document.getElementById('card-number');
    input.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16); // Limit to 16 digits
        // Add space every 4 digits
        e.target.value = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    });

    // Update button amount
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    document.getElementById('pay-amount').innerText = `LKR ${total.toLocaleString()}`;
}

async function handleCardPayment(e) {
    e.preventDefault();
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, ''); // Remove spaces
    const errorMsg = document.getElementById('card-error');

    // Simple Luhn Algorithm for Basic Validation
    if (!luhnCheck(cardNumber)) {
        errorMsg.innerText = "Invalid Card Number. Please check again.";
        errorMsg.classList.remove('hidden');
        document.getElementById('card-number').classList.add('border-red-500');
        return;
    }

    // Proceed to Bank Simulation
    processPayment('Card (Validated)');
}

// Luhn Algorithm Implementation
function luhnCheck(val) {
    let checksum = 0; // running checksum total
    let j = 1; // takes value of 1 or 2

    // Process each digit one by one starting from the last
    for (let i = val.length - 1; i >= 0; i--) {
        let calc = 0;
        // Extract the next digit and multiply by 1 or 2 on alternative digits.
        calc = Number(val.charAt(i)) * j;

        // If the result is in two digits add 1 to the checksum total
        if (calc > 9) {
            checksum = checksum + 1;
            calc = calc - 10;
        }

        // Add the units element to the checksum total
        checksum = checksum + calc;

        // Switch the value of j
        if (j == 1) {
            j = 2;
        } else {
            j = 1;
        }
    }

    //Check if it is divisible by 10 or not.
    return (checksum % 10) == 0;
}

async function processPayment(method) {
    // Show spinner
    const modalContent = document.querySelector('#modal-container > div');
    modalContent.innerHTML = `
        <div class="p-10 flex flex-col items-center justify-center text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mb-4"></div>
            <h3 class="text-xl font-bold mb-2">Connecting to Bank...</h3>
            <p class="text-gray-400 text-sm">Verifying transaction details securely.</p>
        </div>
    `;

    // Simulate Bank Delay and Success
    setTimeout(async () => {
        // Save sale
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const saleData = {
            timestamp: Date.now(),
            items: [...cart], // clone
            total: total,
            paymentMethod: method,
            type: isWholesale ? 'Wholesale' : 'Retail',
            customerId: null // Simplified
        };

        const saleId = await DB.addSale(saleData);

        // Show Success
        modalContent.innerHTML = `
             <div class="p-10 flex flex-col items-center justify-center text-center">
                <div class="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                    <i class="fa-solid fa-check text-white text-3xl"></i>
                </div>
                <h3 class="text-xl font-bold mb-2 text-green-400">Transaction Approved!</h3>
                <p class="text-gray-400 text-sm mb-6">Bank Ref: ${Math.floor(Math.random() * 100000000)}</p>
                <div class="bg-gray-700/50 p-3 rounded-lg w-full mb-6">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-400">Total Paid</span>
                        <span class="font-bold text-white">LKR ${total.toLocaleString()}</span>
                    </div>
                </div>
                <button onclick="finishCheckout()" class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg">Close & Print Receipt</button>
            </div>
        `;
    }, 3000); // 3 second connection delay
}

function finishCheckout() {
    closeModal();
    // In a real app, trigger print here
    cart = [];
    renderPOS(document.getElementById('content-area'));
    showToast('Order completed!');
}

// ==========================================
// INVENTORY
// ==========================================
async function renderInventory(container) {
    const products = await DB.getAllProducts();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6 animate-fade-in">
            <div class="flex items-center space-x-4">
                <h2 class="text-2xl font-bold">Inventory Management</h2>
                <span class="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">${products.length} Items</span>
            </div>
            <button onclick="showAddProductModal()" class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
                <i class="fa-solid fa-plus mr-2"></i> Add Item
            </button>
        </div>
        
        <div class="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden animate-fade-in">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm text-gray-400">
                    <thead class="bg-gray-700/50 text-gray-200 uppercase text-xs">
                        <tr>
                            <th class="px-6 py-4">Item Name</th>
                            <th class="px-6 py-4">Category</th>
                            <th class="px-6 py-4">Type</th>
                            <th class="px-6 py-4">Stock</th>
                            <th class="px-6 py-4 text-right">Cost</th>
                            <th class="px-6 py-4 text-right">Retail</th>
                            <th class="px-6 py-4 text-right">Wholesale</th>
                            <th class="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                        ${products.map(p => `
                            <tr class="hover:bg-gray-700/30 transition">
                                <td class="px-6 py-4 font-medium text-white">${p.name} <div class="text-xs text-gray-500">${p.barcode}</div></td>
                                <td class="px-6 py-4">${p.category}</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 rounded-full text-xs ${p.type === 'Manufactured' ? 'bg-purple-500/10 text-purple-400' : 'bg-green-500/10 text-green-400'}">
                                        ${p.type}
                                    </span>
                                </td>
                                <td class="px-6 py-4 ${p.stock < 10 ? 'text-red-400 font-bold' : ''}">${p.stock}</td>
                                <td class="px-6 py-4 text-right">${p.costPrice}</td>
                                <td class="px-6 py-4 text-right text-gray-300">${p.sellingPriceInRetail}</td>
                                <td class="px-6 py-4 text-right text-gray-300">${p.sellingPriceInWholesale}</td>
                                <td class="px-6 py-4 text-center">
                                    <button class="text-blue-400 hover:text-blue-300 mx-1"><i class="fa-solid fa-pen"></i></button>
                                    <button onclick="deleteProduct(${p.id})" class="text-red-400 hover:text-red-300 mx-1"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function showAddProductModal() {
    showModal(`
        <div class="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
            <h3 class="text-xl font-bold mb-6">Add New Product</h3>
            <form id="addProductForm" onsubmit="handleProductSubmit(event)">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="col-span-2">
                        <label class="block text-sm text-gray-400 mb-1">Product Name</label>
                        <input type="text" name="name" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Barcode</label>
                        <input type="text" name="barcode" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                    </div>
                    <div>
                         <label class="block text-sm text-gray-400 mb-1">Category</label>
                        <select name="category" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                            <option>Men</option>
                            <option>Women</option>
                            <option>Kids</option>
                            <option>Accessories</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Type</label>
                        <select name="type" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                            <option value="Purchased">Purchased (Resell)</option>
                            <option value="Manufactured">Manufactured (In-house)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Stock</label>
                        <input type="number" name="stock" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                    </div>
                   <div>
                        <label class="block text-sm text-gray-400 mb-1">Cost Price</label>
                        <input type="number" name="costPrice" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Retail Price</label>
                        <input type="number" name="sellingPriceInRetail" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Wholesale Price</label>
                        <input type="number" name="sellingPriceInWholesale" required class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none">
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm text-gray-400 mb-1">Product Image</label>
                        <div class="flex items-center space-x-4">
                            <div class="h-20 w-20 bg-gray-700 rounded flex items-center justify-center overflow-hidden border border-gray-600 relative group" id="preview-img">
                                <i class="fa-solid fa-image text-gray-500 text-2xl"></i>
                                <input type="file" id="imageFile" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" onchange="handleImageUpload(this)">
                                <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs text-white text-center pointer-events-none">
                                    Click to Upload
                                </div>
                            </div>
                            <div class="flex-1 space-y-2">
                                <input type="url" name="imageUrl" id="imageUrl" placeholder="Or paste Image URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-blue-500 outline-none text-sm" onchange="updatePreview(this.value)">
                                <div class="flex justify-between items-center">
                                    <button type="button" onclick="generateRandomImage()" class="text-xs text-blue-400 hover:text-white flex items-center"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> Auto Generate</button>
                                    <span class="text-xs text-gray-500">Supports JPG, PNG, WEBP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-3 mt-6">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
                    <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg shadow-lg">Save Product</button>
                </div>
            </form>
        </div>
    `);
}

function updatePreview(url) {
    const preview = document.getElementById('preview-img');
    const existingImg = preview.querySelector('img');
    const icon = preview.querySelector('i');

    if (url) {
        if (existingImg) {
            existingImg.src = url;
            existingImg.classList.remove('hidden');
        } else {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'absolute inset-0 w-full h-full object-cover pointer-events-none';
            preview.appendChild(img);
        }
        if (icon) icon.classList.add('hidden');
    } else {
        if (existingImg) existingImg.classList.add('hidden');
        if (icon) icon.classList.remove('hidden');
    }
}

function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Size validation (e.g., 2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image too large (Max 2MB)', 'warning');
            input.value = ''; // clear input
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const url = e.target.result;
            document.getElementById('imageUrl').value = url;
            updatePreview(url);
        }
        reader.readAsDataURL(file);
    }
}

function generateRandomImage() {
    const id = Math.floor(Math.random() * 200);
    const url = `https://picsum.photos/id/${id}/200/200`;
    document.getElementById('imageUrl').value = url;
    updatePreview(url);
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const product = {
        name: formData.get('name'),
        barcode: formData.get('barcode'),
        category: formData.get('category'),
        type: formData.get('type'),
        stock: parseInt(formData.get('stock')),
        costPrice: parseFloat(formData.get('costPrice')),
        sellingPriceInRetail: parseFloat(formData.get('sellingPriceInRetail')),
        sellingPriceInWholesale: parseFloat(formData.get('sellingPriceInWholesale')),
        color: '',
        size: '',
        image: formData.get('imageUrl')
    };

    await db.products.add(product);
    closeModal();
    renderInventory(document.getElementById('content-area'));
    showToast('Product added successfully!');
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        await db.products.delete(id);
        renderInventory(document.getElementById('content-area'));
        showToast('Product deleted');
    }
}

// ==========================================
// UTILS (Modal, Toast)
// ==========================================
function showModal(contentHtml) {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = contentHtml;
    modal.classList.remove('hidden');
    modal.classList.add('flex'); // Ensure flex is on
}

function closeModal() {
    const modal = document.getElementById('modal-container');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-red-500' : (type === 'warning' ? 'bg-yellow-500' : 'bg-green-500');

    toast.className = `fixed bottom-5 right-5 ${bg} text-white px-6 py-3 rounded-lg shadow-xl z-[150] animate-fade-in flex items-center`;
    toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-check-circle'} mr-2"></i> ${message}`;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Dummy Reports
function renderReports(container) {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-gray-500">
            <i class="fa-solid fa-chart-pie text-6xl mb-4 opacity-50"></i>
            <h3 class="text-xl font-bold">Reports Module</h3>
            <p>Coming soon in the next update!</p>
        </div>
    `;
}

// Theme Toggle
function toggleTheme() {
    showToast('Dark Mode is best for coding, Machan!', 'success');
}

// ==========================================
// AUTHENTICATION
// ==========================================
function renderLogin() {
    const container = document.getElementById('auth-container');
    if (!container) return;

    container.innerHTML = `
        <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 animate-fade-in relative z-20">
            <div class="text-center mb-8">
                <i class="fa-solid fa-bolt text-5xl text-blue-500 mb-4"></i>
                <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">YohanX Super</h2>
                <p class="text-gray-400 mt-2">Sign in to access POS</p>
            </div>
            
            <form onsubmit="handleLogin(event)" class="space-y-4">
                <div>
                     <label class="block text-sm text-gray-400 mb-1">Email</label>
                     <div class="relative">
                        <i class="fa-solid fa-envelope absolute left-3 top-3.5 text-gray-500"></i>
                        <input type="email" name="email" required placeholder="admin@yohanx.com"
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                     </div>
                </div>
                
                 <div>
                     <label class="block text-sm text-gray-400 mb-1">Password</label>
                     <div class="relative">
                        <i class="fa-solid fa-lock absolute left-3 top-3.5 text-gray-500"></i>
                         <input type="password" name="password" required placeholder="••••••••"
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                     </div>
                </div>
                
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transition transform active:scale-95">
                    Sign In
                </button>
            </form>
            
            <div class="mt-6 text-center text-sm text-gray-400">
                Don't have an account? <a href="#" onclick="renderRegister()" class="text-blue-400 hover:text-white">Create one</a>
            </div>
        </div>
    `;
    container.classList.remove('hidden');
}

function renderRegister() {
    const container = document.getElementById('auth-container');
    container.innerHTML = `
        <div class="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 animate-fade-in relative z-20">
             <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-white">Create Account</h2>
                <p class="text-gray-400 mt-1">Join the team</p>
            </div>
            
            <form onsubmit="handleRegister(event)" class="space-y-4">
                 <div>
                     <label class="block text-sm text-gray-400 mb-1">Full Name</label>
                        <input type="text" name="name" required placeholder="John Doe"
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                </div>

                <div>
                     <label class="block text-sm text-gray-400 mb-1">Email</label>
                        <input type="email" name="email" required placeholder="user@example.com"
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                </div>
                
                 <div>
                     <label class="block text-sm text-gray-400 mb-1">Password</label>
                         <input type="password" name="password" required placeholder="Create a password"
                            class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                </div>

                <div>
                     <label class="block text-sm text-gray-400 mb-1">Role</label>
                     <select name="role" class="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-white">
                        <option value="Staff">Staff</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                     </select>
                </div>
                
                <button type="submit" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-green-500/30 transition transform active:scale-95">
                    Register
                </button>
            </form>
            
            <div class="mt-6 text-center text-sm text-gray-400">
                Already have an account? <a href="#" onclick="renderLogin()" class="text-blue-400 hover:text-white">Sign In</a>
            </div>
        </div>
    `;
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    // Simple check
    const user = await db.users.where('email').equals(email).first();

    if (user && user.password === password) {
        currentUser = user;
        localStorage.setItem('pos_user_id', user.id);

        showToast(`Welcome back, ${user.name}!`);
        document.getElementById('auth-container').classList.add('hidden');
        updateUserUI();
        navigate('dashboard');
    } else {
        showToast('Invalid email or password', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');

    const exists = await db.users.where('email').equals(email).first();
    if (exists) {
        showToast('Email already in use', 'error');
        return;
    }

    const user = {
        name: formData.get('name'),
        email: email,
        password: formData.get('password'), // In real app, hash this!
        role: formData.get('role')
    };

    await db.users.add(user);
    showToast('Account created! Please sign in.');
    renderLogin();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('pos_user_id');
    document.getElementById('auth-container').classList.remove('hidden');
    renderLogin();
}
