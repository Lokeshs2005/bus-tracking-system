/**
 * ==========================================================================
 * COGNITIVE FULL-STACK CLIENT ENGINE
 * Dynamic Asynchronous Cart, Auth Transitions, 3D Payment transforms, & Modals
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize standard features
    initCartDrawer();
    initAuthForms();
    initCheckoutFlow();
    initOrderHistory();
    refreshCartBadge(); // Load cart count on startup
    initFirebase();
    initGrokAi();
});

/* ==========================================================================
   1. Dynamic Cart Drawer & Badge Updates
   ========================================================================== */
function initCartDrawer() {
    const trigger = document.querySelector('.cart-trigger');
    const backdrop = document.querySelector('.cart-drawer-backdrop');
    const closeBtn = document.querySelector('.cart-close');

    if (!backdrop) return;

    // Toggle Drawer Open
    trigger?.addEventListener('click', () => {
        backdrop.classList.add('open');
        renderCartDrawer();
    });

    // Close Drawer
    closeBtn?.addEventListener('click', () => backdrop.classList.remove('open'));
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('open');
    });

    // Delegate product page "Add to Cart" button actions
    document.addEventListener('click', async (e) => {
        const addBtn = e.target.closest('.add-to-cart-btn');
        if (!addBtn) return;

        const productId = addBtn.dataset.productId;
        const qtySelect = document.getElementById(`qty-${productId}`);
        const quantity = qtySelect ? parseInt(qtySelect.value) : 1;

        try {
            addBtn.disabled = true;
            addBtn.innerHTML = 'Adding...';

            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Pulse Badge and open drawer
                triggerPulseBadge();
                refreshCartBadge();
                
                // Optional: slide open cart drawer immediately to show what was added
                setTimeout(() => {
                    backdrop.classList.add('open');
                    renderCartDrawer();
                }, 300);
            } else {
                alert(data.error || 'Failed to add item to cart');
            }
        } catch (err) {
            console.error('Add to Cart error:', err);
            alert('Something went wrong adding item to cart.');
        } finally {
            addBtn.disabled = false;
            addBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add To Cart';
        }
    });
}

// Function to refresh navbar badge count
async function refreshCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;

    try {
        const response = await fetch('/api/cart');
        const data = await response.json();
        
        if (response.ok) {
            badge.textContent = data.totalItems;
            badge.style.display = data.totalItems > 0 ? 'flex' : 'none';
        }
    } catch (err) {
        console.error('Error updating cart count badge:', err);
    }
}

// Visual pulsing animation on cart badge
function triggerPulseBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;
    badge.classList.remove('pulse');
    void badge.offsetWidth; // Trigger reflow
    badge.classList.add('pulse');
}

// Retrieve cart items and draw the cart list inside slide drawer
async function renderCartDrawer() {
    const container = document.querySelector('.cart-items-container');
    const subtotalText = document.getElementById('drawer-subtotal');
    const shippingText = document.getElementById('drawer-shipping');
    const totalText = document.getElementById('drawer-total');
    const checkoutBtn = document.getElementById('drawer-checkout-btn');

    if (!container) return;

    container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);"></i><p style="margin-top:1rem;color:var(--text-secondary);">Loading items...</p></div>';

    try {
        const response = await fetch('/api/cart');
        const data = await response.json();

        if (!response.ok) {
            container.innerHTML = `<div class="cart-empty-state"><p>Error loading cart. Please try again.</p></div>`;
            return;
        }

        const items = data.items;
        if (items.length === 0) {
            container.innerHTML = `
                <div class="cart-empty-state">
                    <div class="cart-empty-icon"><i class="fas fa-shopping-bag"></i></div>
                    <h3>Your cart is empty</h3>
                    <p>Browse our catalog and add items to your shopping list!</p>
                </div>
            `;
            subtotalText.textContent = '$0.00';
            shippingText.textContent = '$0.00';
            totalText.textContent = '$0.00';
            if (checkoutBtn) checkoutBtn.style.display = 'none';
            return;
        }

        if (checkoutBtn) checkoutBtn.style.display = 'inline-flex';

        // Render Cart Cards
        let html = '';
        items.forEach(item => {
            html += `
                <div class="cart-item-card" data-item-id="${item.id}">
                    <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                        <div class="cart-item-actions">
                            <div class="qty-selector">
                                <button class="qty-btn dec-qty-btn" data-item-id="${item.id}" data-current-qty="${item.quantity}">-</button>
                                <span class="qty-val">${item.quantity}</span>
                                <button class="qty-btn inc-qty-btn" data-item-id="${item.id}" data-current-qty="${item.quantity}" data-stock-qty="${item.stockQuantity}">+</button>
                            </div>
                            <button class="cart-item-remove" data-item-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        // Calculate checkout subtotal parameters
        const subtotal = data.subtotal;
        const shipping = data.shipping;
        const total = subtotal + shipping;

        subtotalText.textContent = `$${subtotal.toFixed(2)}`;
        shippingText.textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
        totalText.textContent = `$${total.toFixed(2)}`;

        // Wire Up Drawer Item Actions (Update & Delete listeners)
        wireDrawerActions();

    } catch (err) {
        console.error('Error drawing cart:', err);
        container.innerHTML = `<div class="cart-empty-state"><p>Something went wrong loading your shopping cart.</p></div>`;
    }
}

// Wire actions inside cart drawer
function wireDrawerActions() {
    // Delete Cart Item
    const removeBtns = document.querySelectorAll('.cart-item-remove');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemId = btn.dataset.itemId;
            const card = btn.closest('.cart-item-card');
            card.style.opacity = '0.5';

            const response = await fetch(`/api/cart/remove/${itemId}`, { method: 'DELETE' });
            if (response.ok) {
                renderCartDrawer();
                refreshCartBadge();
            } else {
                card.style.opacity = '1';
                alert('Could not remove item from cart.');
            }
        });
    });

    // Increment Quantity
    const incBtns = document.querySelectorAll('.inc-qty-btn');
    incBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemId = btn.dataset.itemId;
            const currentQty = parseInt(btn.dataset.currentQty);
            const stockQty = parseInt(btn.dataset.stockQty);
            const nextQty = currentQty + 1;

            if (nextQty > stockQty) {
                alert(`Cannot add more. Only ${stockQty} items are available in stock.`);
                return;
            }

            const response = await fetch(`/api/cart/update/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: nextQty })
            });

            if (response.ok) {
                renderCartDrawer();
                refreshCartBadge();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update item quantity');
            }
        });
    });

    // Decrement Quantity
    const decBtns = document.querySelectorAll('.dec-qty-btn');
    decBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const itemId = btn.dataset.itemId;
            const currentQty = parseInt(btn.dataset.currentQty);
            const nextQty = currentQty - 1;

            if (nextQty < 1) {
                // Remove item instead of setting to 0
                const response = await fetch(`/api/cart/remove/${itemId}`, { method: 'DELETE' });
                if (response.ok) {
                    renderCartDrawer();
                    refreshCartBadge();
                }
                return;
            }

            const response = await fetch(`/api/cart/update/${itemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: nextQty })
            });

            if (response.ok) {
                renderCartDrawer();
                refreshCartBadge();
            } else {
                alert('Failed to update item quantity');
            }
        });
    });
}

/* ==========================================================================
   2. Auth Portal Interactions & AJAX sign-in
   ========================================================================== */
function initAuthForms() {
    const tabs = document.querySelectorAll('.auth-tab');
    const panels = document.querySelectorAll('.auth-form-panel');
    const loginForm = document.getElementById('login-form-element');
    const registerForm = document.getElementById('register-form-element');
    const logoutBtn = document.getElementById('logout-btn');

    // Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const panelId = tab.dataset.tabPanel;
            document.getElementById(panelId)?.classList.add('active');
        });
    });

    // AJAX Login Handler
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('login-message');
        msgDiv.style.display = 'none';

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                msgDiv.className = 'form-message success';
                msgDiv.textContent = data.message;
                msgDiv.style.display = 'block';

                // Check for custom redirect URL in parameters
                const params = new URLSearchParams(window.location.search);
                const redirectUrl = params.get('redirect') || '/';
                
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                msgDiv.className = 'form-message error';
                msgDiv.textContent = data.error || 'Authentication failed';
                msgDiv.style.display = 'block';
            }
        } catch (err) {
            msgDiv.className = 'form-message error';
            msgDiv.textContent = 'Server unreachable. Please try again.';
            msgDiv.style.display = 'block';
        }
    });

    // AJAX Registration Handler
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgDiv = document.getElementById('register-message');
        msgDiv.style.display = 'none';

        const fullName = document.getElementById('reg-fullname').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirmpassword').value;

        if (password !== confirmPassword) {
            msgDiv.className = 'form-message error';
            msgDiv.textContent = 'Passwords do not match.';
            msgDiv.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                msgDiv.className = 'form-message success';
                msgDiv.textContent = data.message;
                msgDiv.style.display = 'block';

                const params = new URLSearchParams(window.location.search);
                const redirectUrl = params.get('redirect') || '/';

                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1000);
            } else {
                msgDiv.className = 'form-message error';
                msgDiv.textContent = data.error || 'Registration failed';
                msgDiv.style.display = 'block';
            }
        } catch (err) {
            msgDiv.className = 'form-message error';
            msgDiv.textContent = 'Server unreachable. Please try again.';
            msgDiv.style.display = 'block';
        }
    });

    // Logout Click Handler
    logoutBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (err) {
            console.error('Logout error:', err);
        }
    });
}

/* ==========================================================================
   3. Checkout Flow & 3D Payment flip transitions
   ========================================================================== */
function initCheckoutFlow() {
    const cardWidget = document.querySelector('.credit-card-3d');
    const inputCardNo = document.getElementById('pay-cardnumber');
    const inputCardHolder = document.getElementById('pay-cardholder');
    const inputCardExpiry = document.getElementById('pay-expiry');
    const inputCardCvv = document.getElementById('pay-cvv');
    
    // Front display targets
    const dNo = document.getElementById('display-card-number');
    const dHolder = document.getElementById('display-card-holder');
    const dExpiry = document.getElementById('display-card-expiry');
    const dCvv = document.getElementById('display-card-cvv');

    if (!inputCardNo) return; // Exit if not checkout page

    // 3D Flip Card: Flip to back when focusing CVV
    inputCardCvv.addEventListener('focus', () => cardWidget.classList.add('flipped'));
    inputCardCvv.addEventListener('blur', () => cardWidget.classList.remove('flipped'));

    // Dynamic Binding: Expiry & Card Holder
    inputCardHolder.addEventListener('input', (e) => {
        dHolder.textContent = e.target.value.trim() !== '' ? e.target.value.toUpperCase() : 'YOUR FULL NAME';
    });

    inputCardExpiry.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        e.target.value = val.substring(0, 5); // Limit MM/YY
        dExpiry.textContent = e.target.value !== '' ? e.target.value : 'MM/YY';
    });

    // Dynamic Binding: Card Number Formatter
    inputCardNo.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Numeric only
        let formatted = '';
        for (let i = 0; i < val.length && i < 16; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += val[i];
        }
        e.target.value = formatted;
        
        let digits = formatted.trim() !== '' ? formatted : '•••• •••• •••• ••••';
        dNo.textContent = digits;

        // Brand Identification (e.g. Visa starts with 4, Mastercard with 5)
        const brandTarget = document.getElementById('display-card-brand');
        if (val.startsWith('4')) {
            brandTarget.textContent = 'VISA';
        } else if (val.startsWith('5')) {
            brandTarget.textContent = 'MASTERCARD';
        } else if (val.startsWith('3')) {
            brandTarget.textContent = 'AMEX';
        } else {
            brandTarget.textContent = 'CREDIT CARD';
        }
    });

    inputCardCvv.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        e.target.value = val.substring(0, 3); // limit 3 digits
        dCvv.textContent = e.target.value !== '' ? e.target.value : '•••';
    });

    // Checkout Submit Form handler
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        // shipping parameters
        const shippingName = document.getElementById('ship-name').value;
        const shippingEmail = document.getElementById('ship-email').value;
        const shippingAddress = document.getElementById('ship-address').value;
        const shippingCity = document.getElementById('ship-city').value;
        const shippingZip = document.getElementById('ship-zip').value;

        const payButton = document.getElementById('checkout-submit-btn');
        payButton.disabled = true;
        payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Secure Payment...';

        try {
            const response = await fetch('/api/orders/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippingName,
                    shippingEmail,
                    shippingAddress,
                    shippingCity,
                    shippingZip
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Success: open glowing success modal
                showOrderSuccessModal(data.orderNumber);
            } else {
                alert(data.error || 'Payment or checkout failed. Please verify stock.');
                payButton.disabled = false;
                payButton.innerHTML = '<i class="fas fa-credit-card"></i> Pay & Place Order';
            }
        } catch (err) {
            console.error('Checkout submit error:', err);
            alert('Something went wrong. Server is unreachable.');
            payButton.disabled = false;
            payButton.innerHTML = '<i class="fas fa-credit-card"></i> Pay & Place Order';
        }
    });
}

// Show Checkout success receipt popup modal
function showOrderSuccessModal(orderNumber) {
    const backdrop = document.querySelector('.success-modal-backdrop');
    const orderCodeBox = document.getElementById('display-success-order-number');
    const homeBtn = document.getElementById('success-home-btn');

    if (!backdrop) return;

    orderCodeBox.textContent = orderNumber;
    backdrop.classList.add('open');

    homeBtn?.addEventListener('click', () => {
        window.location.href = '/';
    });
}

/* ==========================================================================
   4. Order History Tracking & Invoice Modals
   ========================================================================== */
function initOrderHistory() {
    const invoiceModalBackdrop = document.querySelector('.invoice-backdrop');
    const invoiceClose = document.querySelector('.invoice-modal-close');

    if (!invoiceModalBackdrop) return; // Exit if not on orders history page

    // Close invoice modal
    invoiceClose?.addEventListener('click', () => invoiceModalBackdrop.classList.remove('open'));
    invoiceModalBackdrop.addEventListener('click', (e) => {
        if (e.target === invoiceModalBackdrop) invoiceModalBackdrop.classList.remove('open');
    });

    // Delegate "View Invoice" triggers
    document.addEventListener('click', async (e) => {
        const viewBtn = e.target.closest('.view-invoice-btn');
        if (!viewBtn) return;

        const orderNumber = viewBtn.dataset.orderNumber;
        launchInvoiceModal(orderNumber);
    });

    // Populate trackbars dynamically on startup
    const orderCards = document.querySelectorAll('.order-card');
    orderCards.forEach(card => {
        const status = card.dataset.orderStatus;
        const trackbar = card.querySelector('.tracker-progress-bar');
        const steps = card.querySelectorAll('.tracker-step');

        if (!status || !trackbar) return;

        // Compute step widths
        let progressWidth = '0%';
        if (status === 'PROCESSING') {
            progressWidth = '33%';
            steps[0].classList.add('completed');
            steps[1].classList.add('active');
        } else if (status === 'SHIPPED') {
            progressWidth = '66%';
            steps[0].classList.add('completed');
            steps[1].classList.add('completed');
            steps[2].classList.add('active');
        } else if (status === 'DELIVERED') {
            progressWidth = '100%';
            steps[0].classList.add('completed');
            steps[1].classList.add('completed');
            steps[2].classList.add('completed');
        } else {
            progressWidth = '0%';
            steps[0].classList.add('active');
        }
        
        trackbar.style.width = progressWidth;
    });
}

// Fetch invoice specifications and render them inside the printable receipt modal
async function launchInvoiceModal(orderNumber) {
    const backdrop = document.querySelector('.invoice-backdrop');
    const printArea = document.querySelector('.invoice-print-area');

    if (!backdrop || !printArea) return;

    printArea.innerHTML = '<div style="text-align:center;padding:4rem;"><i class="fas fa-spinner fa-spin" style="font-size:3rem;color:var(--primary);"></i><p style="margin-top:1rem;color:var(--text-secondary);">Generating invoice...</p></div>';
    backdrop.classList.add('open');

    try {
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (!response.ok) {
            printArea.innerHTML = `<div style="text-align:center;padding:2rem;"><p>Error fetching invoice. Please close and try again.</p></div>`;
            return;
        }

        // Format dates
        const orderDate = new Date(data.createdAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // Compute subtotal dynamically
        let subtotal = 0;
        let itemsHtml = '';
        data.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            itemsHtml += `
                <tr>
                    <td>${item.name}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td style="text-align:right;font-weight:600;">$${itemTotal.toFixed(2)}</td>
                </tr>
            `;
        });

        printArea.innerHTML = `
            <div class="invoice-brand-row">
                <div>
                    <h1 style="font-size:2rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.25rem;">
                        <span style="color:#FFF;">ANTIGRAVITY</span> <span style="background:linear-gradient(135deg,var(--primary),var(--secondary));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">STORE</span>
                    </h1>
                    <p style="color:var(--text-muted);font-size:0.85rem;">Luxury Tech & Ambient Desk Setups</p>
                </div>
                <div style="text-align:right;">
                    <span class="order-code-box" style="margin-bottom:0.5rem;font-size:1.05rem;">${data.orderNumber}</span>
                    <p style="color:var(--text-secondary);font-size:0.9rem;">Date Placed: ${orderDate}</p>
                </div>
            </div>

            <div class="invoice-addresses">
                <div class="invoice-address-col">
                    <h4>Billing Details</h4>
                    <p style="font-weight:600;color:var(--text-primary);">${data.shippingName}</p>
                    <p>${data.shippingEmail}</p>
                </div>
                <div class="invoice-address-col" style="text-align:right;">
                    <h4>Delivery Location</h4>
                    <p>${data.shippingAddress}</p>
                    <p>${data.shippingCity}, ${data.shippingZip}</p>
                </div>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Product Item</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th style="text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <table class="invoice-totals-table">
                <tbody>
                    <tr>
                        <td style="color:var(--text-secondary);">Subtotal</td>
                        <td style="text-align:right;font-weight:500;">$${subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td style="color:var(--text-secondary);">Shipping Cost</td>
                        <td style="text-align:right;font-weight:500;">${data.shippingCost === 0 ? 'FREE' : `$${data.shippingCost.toFixed(2)}`}</td>
                    </tr>
                    <tr>
                        <td style="color:var(--text-secondary);">Estimated Tax (8%)</td>
                        <td style="text-align:right;font-weight:500;">$${data.taxAmount.toFixed(2)}</td>
                    </tr>
                    <tr class="grand-total">
                        <td>Total Amount Paid</td>
                        <td style="text-align:right;color:var(--secondary);">$${data.totalAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="text-align:center;margin-top:4rem;padding-top:2rem;border-top:1px solid var(--border-glass);">
                <p style="color:var(--text-muted);font-size:0.85rem;">Thank you for shopping with Ecommerce!</p>
                <p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.25rem;">For questions regarding this receipt, contact concierge@ecommerce.com</p>
                <button class="btn btn-secondary" onclick="window.print()" style="margin-top:1.5rem;padding:0.5rem 1rem;font-size:0.8rem;">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
            </div>
        `;

    } catch (err) {
        console.error('Invoice modal load error:', err);
        printArea.innerHTML = `<div style="text-align:center;padding:2rem;"><p>Failed to connect to backend api. Please close and retry.</p></div>`;
    }
}

/* ==========================================================================
   5. Firebase Authentication Console Integration
   ========================================================================== */
function initFirebase() {
    const googleBtn = document.getElementById('firebase-google-btn');
    if (!googleBtn) return; // Exit if not on login page

    const apiKeyInput = document.getElementById('fb-apikey');
    const authDomainInput = document.getElementById('fb-authdomain');
    const projectIdInput = document.getElementById('fb-projectid');
    const appIdInput = document.getElementById('fb-appid');
    const saveBtn = document.getElementById('save-fb-config');

    // Load saved Firebase config
    let config = null;
    const savedConfig = localStorage.getItem('fb_config');
    if (savedConfig) {
        try {
            config = JSON.parse(savedConfig);
            if (apiKeyInput) apiKeyInput.value = config.apiKey || '';
            if (authDomainInput) authDomainInput.value = config.authDomain || '';
            if (projectIdInput) projectIdInput.value = config.projectId || '';
            if (appIdInput) appIdInput.value = config.appId || '';
        } catch (e) {
            console.error('Error parsing fb_config', e);
        }
    } else {
        // PRESET DEFAULT USER FIREBASE CONFIG KEYS!
        config = {
            apiKey: "AIzaSyAqndMIuymgVu3pocwD75KK1tb9-U8yZ9A",
            authDomain: "e-commerce-ai-9528c.firebaseapp.com",
            projectId: "e-commerce-ai-9528c",
            appId: "1:1039815043896:web:cdd05ce516e4c32bfa2fcd"
        };
        if (apiKeyInput) apiKeyInput.value = config.apiKey;
        if (authDomainInput) authDomainInput.value = config.authDomain;
        if (projectIdInput) projectIdInput.value = config.projectId;
        if (appIdInput) appIdInput.value = config.appId;
    }

    // Save configuration
    saveBtn?.addEventListener('click', () => {
        const newConfig = {
            apiKey: apiKeyInput.value.trim(),
            authDomain: authDomainInput.value.trim(),
            projectId: projectIdInput.value.trim(),
            appId: appIdInput.value.trim()
        };
        localStorage.setItem('fb_config', JSON.stringify(newConfig));
        alert('Firebase Web configuration parameters saved locally! Click standard sign-in to reload.');
        window.location.reload();
    });

    // Handle Google Sign-in click
    googleBtn.addEventListener('click', async () => {
        // If user has provided a custom config, initialize Firebase
        if (config && config.apiKey && config.projectId) {
            try {
                if (!window.firebaseInitialized) {
                    firebase.initializeApp(config);
                    window.firebaseInitialized = true;
                }
                const provider = new firebase.auth.GoogleAuthProvider();
                googleBtn.disabled = true;
                googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Directing to Google Auth...';
                
                const result = await firebase.auth().signInWithPopup(provider);
                const user = result.user;
                
                // Submit to backend
                await bindFirebaseUser(user.email, user.uid, user.displayName);
            } catch (err) {
                console.error('Firebase live login failed:', err);
                alert('Firebase Login Error: ' + err.message + '\n\nEnsure your config credentials are correct and authorized redirect domains are configured in your console.');
                googleBtn.disabled = false;
                googleBtn.innerHTML = '<i class="fab fa-google" style="color: #EA4335;"></i> Sign In with Google (Firebase)';
            }
        } else {
            // Emulated / Sandbox Mode fallback
            const email = prompt('ECOMMERCE SANDBOX MODE\nNo custom Firebase Config keys detected.\n\nEnter a demo email address to emulate Firebase console authentication:', 'lokesh@ecommerce.com');
            if (email === null) return; // user cancelled
            if (!email.includes('@')) {
                alert('Invalid email format. Simulation aborted.');
                return;
            }
            const fullName = prompt('Enter your name for the Ecommerce registry:', 'Lokesh S');
            if (fullName === null) return;

            googleBtn.disabled = true;
            googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Emulating Console Auth...';

            setTimeout(async () => {
                const simulatedUid = 'simulated_' + Math.random().toString(36).substring(2, 15);
                await bindFirebaseUser(email, simulatedUid, fullName);
            }, 800);
        }
    });
}

async function bindFirebaseUser(email, uid, fullName) {
    const msgDiv = document.getElementById('login-message');
    try {
        const response = await fetch('/api/auth/firebase-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, uid, fullName })
        });

        const data = await response.json();

        if (response.ok) {
            if (msgDiv) {
                msgDiv.className = 'form-message success';
                msgDiv.textContent = 'Welcome, ' + (fullName || email) + '! Connecting secure session...';
                msgDiv.style.display = 'block';
            }
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect') || '/';
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        } else {
            alert(data.error || 'Failed to bind session with Spring backend.');
            resetGoogleBtn();
        }
    } catch (err) {
        console.error('Session bind error:', err);
        alert('Server unreachable. Could not sync session.');
        resetGoogleBtn();
    }
}

function resetGoogleBtn() {
    const googleBtn = document.getElementById('firebase-google-btn');
    if (googleBtn) {
        googleBtn.disabled = false;
        googleBtn.innerHTML = '<i class="fab fa-google" style="color: #EA4335;"></i> Sign In with Google (Firebase)';
    }
}

/* ==========================================================================
   6. Grok AI Product Recommendation Assistant
   ========================================================================== */
function initGrokAi() {
    const trigger = document.getElementById('grok-trigger');
    const chatContainer = document.querySelector('.grok-chat-container');
    const closeBtn = document.querySelector('.grok-chat-close');
    const sendBtn = document.getElementById('grok-send-btn');
    const input = document.getElementById('grok-chat-input');
    const messagesBox = document.querySelector('.grok-chat-messages');

    if (!trigger) return;

    // Toggle Chat window open/close
    trigger.addEventListener('click', () => {
        chatContainer.classList.add('open');
        trigger.style.display = 'none';
        
        // Add initial greeting if empty
        if (messagesBox.children.length === 0) {
            appendGrokMessage('assistant', "Greetings. I am **Grok AI**, your personal desk stylist. Ask me anything about creating the perfect luxury mechanical typing station, acoustic studio, or ambient setup.");
        }
    });

    closeBtn.addEventListener('click', () => {
        chatContainer.classList.remove('open');
        trigger.style.display = 'flex';
    });

    // Send Message triggers
    sendBtn?.addEventListener('click', sendUserMessage);
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendUserMessage();
    });

    // Handle suggestion chips
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('.grok-suggest-chip');
        if (!chip) return;
        input.value = chip.dataset.query;
        sendUserMessage();
    });

    async function sendUserMessage() {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        appendGrokMessage('user', text);

        // Add loading message
        const loadingId = appendGrokLoading();

        try {
            const response = await fetch('/api/grok/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data = await response.json();
            
            // Remove loading
            document.getElementById(loadingId)?.remove();

            if (response.ok) {
                appendGrokMessage('assistant', data.suggestion);
            } else {
                appendGrokMessage('assistant', "Apologies. I encountered an error communicating with the xAI completion service: " + (data.error || 'Server error'));
            }
        } catch (err) {
            console.error('Grok suggestions API error:', err);
            document.getElementById(loadingId)?.remove();
            appendGrokMessage('assistant', "Apologies. Ecommerce server appears offline. I could not parse setup parameters.");
        }
    }

    function appendGrokMessage(sender, content) {
        const msg = document.createElement('div');
        msg.className = `grok-msg grok-msg-${sender}`;
        
        // Format markdown text roughly
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');

        msg.innerHTML = `
            <div class="grok-msg-bubble">
                ${formatted}
            </div>
        `;
        messagesBox.appendChild(msg);
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    function appendGrokLoading() {
        const id = 'grok-loading-' + Date.now();
        const loader = document.createElement('div');
        loader.className = 'grok-msg grok-msg-assistant';
        loader.id = id;
        loader.innerHTML = `
            <div class="grok-msg-bubble grok-loading-bubble">
                <i class="fas fa-circle-notch fa-spin"></i> Thinking suggestion...
            </div>
        `;
        messagesBox.appendChild(loader);
        messagesBox.scrollTop = messagesBox.scrollHeight;
        return id;
    }
}
