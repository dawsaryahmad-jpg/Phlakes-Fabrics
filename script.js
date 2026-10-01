const MERCHANT_GATE = "2348090300600";
const CURR_SYMBOL = "₦";
const INC_MODE = "float";
let cart = [];
let items = [];

document.addEventListener("DOMContentLoaded", async () => {
    const cartDrawer = document.getElementById("cart-drawer");
    const cartToggle = document.getElementById("floating-cart-badge");
    const closeCart = document.getElementById("close-cart");
    const cartContainer = document.getElementById("cart-items-container");
    const cartTotalEl = document.getElementById("cart-total-price");
    const cartCountEl = document.getElementById("cart-count");
    const checkoutBtn = document.getElementById("whatsapp-checkout-btn");
    const searchInput = document.getElementById("catalog-search");
    const fallback = document.getElementById("search-fallback");
    const resetBtn = document.getElementById("reset-catalog-btn");
    const tabBtns = document.querySelectorAll(".tab-btn");

    if (cartToggle && cartDrawer && closeCart) {
        cartToggle.addEventListener("click", () => cartDrawer.classList.add("open"));
        closeCart.addEventListener("click", () => cartDrawer.classList.remove("open"));
    }

    try {
        const response = await fetch('products.json');
        items = await response.json();
        console.log('TexFlow Database Sync Successful. Auto-generating UI components...');
        generateHTMLCards();
        setupCardInteractions();
        setupNavigationFilters();
    } catch (err) {
        console.error('JSON sync error. Live server environments bypass this entirely.', err);
    }

    function generateHTMLCards() {
        if (!items || items.length === 0) return;
        items.forEach(item => {
            const gridContainer = document.getElementById('grid-' + item.cat);
            if (!gridContainer) return;

            const isService = (item.cat === 'services');
            const buttonText = isService ? 'Book Service' : 'Add to Basket';
            const stepperStyle = isService ? 'display:none !important;' : '';
            const defaultValue = (INC_MODE === 'float') ? '1.0' : '1';
            const stepValue = (INC_MODE === 'float') ? '0.5' : '1';
            const minValue = (INC_MODE === 'float') ? '0.5' : '1';
            const unitLabel = (INC_MODE === 'float') ? 'yards / units' : 'items';

            const card = document.createElement('div');
            card.className = 'food-card';
            card.setAttribute('data-name', item.name);
            card.setAttribute('data-price', item.price);
            card.setAttribute('data-category', item.cat);

            card.innerHTML = `
                <div class="image-wrapper"><img src="${item.image}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover; display:block;"></div>
                <div class="food-info">
                    <h3>${item.name}</h3>
                    <p class="description">Premium asset optimized for instant dynamic catalog updates and manifests.</p>
                    <div class="quantity-control-wrapper" style="${stepperStyle}">
                        <button class="step-btn minus-btn">&minus;</button>
                        <input type="number" class="quantity-input" value="${defaultValue}" step="${stepValue}" min="${minValue}">
                        <span class="unit-label">&nbsp;${unitLabel}</span>
                        <button class="step-btn plus-btn">&plus;</button>
                    </div>
                    <div class="price-row">
                        <span class="price">${CURR_SYMBOL}${parseFloat(item.price).toLocaleString()}</span>
                        <button class="add-to-cart-btn" data-type="${item.cat}">${buttonText}</button>
                    </div>
                </div>
            `;
            gridContainer.appendChild(card);
        });
    }

    function setupCardInteractions() {
        const productCards = document.querySelectorAll(".food-card");
        if (productCards.length === 0) return;

        productCards.forEach(card => {
            const minus = card.querySelector(".minus-btn"), plus = card.querySelector(".plus-btn");
            const qty = card.querySelector(".quantity-input"), add = card.querySelector(".add-to-cart-btn");
            const name = card.getAttribute("data-name"), price = parseFloat(card.getAttribute("data-price"));

            if (plus && qty) plus.addEventListener("click", () => {
                const currentVal = parseFloat(qty.value);
                qty.value = (INC_MODE === "float") ? (currentVal + 0.5).toFixed(1) : (parseInt(qty.value, 10) + 1);
            });
            if (minus && qty) minus.addEventListener("click", () => {
                const currentVal = parseFloat(qty.value);
                const limit = (INC_MODE === "float") ? 0.5 : 1;
                if (currentVal > limit) {
                    qty.value = (INC_MODE === "float") ? (currentVal - 0.5).toFixed(1) : (parseInt(qty.value, 10) - 1);
                }
            });
            if (add) {
                add.addEventListener("click", () => {
                    let units = qty ? parseFloat(qty.value) : 1;
                    const limit = (INC_MODE === "float") ? 0.5 : 1;
                    if (qty && (isNaN(units) || units < limit)) { alert("Please enter a valid amount parameter."); return; }
                    const catType = add.getAttribute('data-type');
                    const isService = (catType === 'services');
                    if (isService) units = 1;

                    const exist = cart.find(i => i.name === name);
                    if (exist) exist.quantity += units; else cart.push({ name, price, quantity: units, isService });
                    render();
                    if (qty) qty.value = (INC_MODE === "float") ? "1.0" : "1";
                });
            }
        });
    }

    function render() {
        if (!cartContainer) return; cartContainer.innerHTML = "";
        if (cart.length === 0) {
            cartContainer.innerHTML = "<p class='empty-cart-msg'>Your selection basket matrix is completely empty.</p>";
            if (cartTotalEl) cartTotalEl.innerText = CURR_SYMBOL + "0"; if (cartCountEl) cartCountEl.innerText = "0"; checkoutBtn.disabled = true; return;
        }
        let total = 0, count = 0;
        cart.forEach(item => {
            const sub = item.price * item.quantity; total += sub; count += (item.isService ? 1 : item.quantity);
            const r = document.createElement("div"); r.className = "cart-item-row";
            const displayQty = (INC_MODE === "float") ? item.quantity.toFixed(1) : item.quantity;
            const displayLabel = item.isService ? "Appointment Booking" : displayQty + " units";
            r.innerHTML = "<div class='cart-item-details'><h4>" + item.name + "</h4><span>" + displayLabel + " @ " + CURR_SYMBOL + item.price.toLocaleString() + "</span></div><div><span style='font-weight:600;margin-right:10px;'>" + CURR_SYMBOL + sub.toLocaleString() + "</span><button class='remove-btn' data-name='" + item.name + "'>&times;</button></div>";
            cartContainer.appendChild(r);
        });
        if (cartTotalEl) cartTotalEl.innerText = CURR_SYMBOL + total.toLocaleString();
        if (cartCountEl) cartCountEl.innerText = (INC_MODE === "float") ? count.toFixed(1) : count;
        checkoutBtn.disabled = false;
        cartContainer.querySelectorAll(".remove-btn").forEach(b => {
            b.addEventListener("click", (e) => { cart = cart.filter(i => i.name !== e.target.getAttribute("data-name")); render(); });
        });
    }

    function setupNavigationFilters() {
        const menuCategories = document.querySelectorAll(".menu-category");
        if (searchInput && menuCategories.length > 0) {
            let activeCat = "all", query = "";
            function filter() {
                let totalVis = 0;
                menuCategories.forEach(sec => {
                    let visInSec = 0;
                    const sectionCat = sec.getAttribute("data-section-category");
                    sec.querySelectorAll(".food-card").forEach(card => {
                        const name = card.getAttribute("data-name").toLowerCase();
                        const cat = card.getAttribute("data-category");
                        if (name.includes(query) && (activeCat === "all" || cat === activeCat)) {
                            card.style.display = "block"; visInSec++; totalVis++;
                        } else card.style.display = "none";
                    });
                    if (visInSec > 0 && (activeCat === "all" || sectionCat === activeCat)) {
                        sec.style.display = "block";
                    } else {
                    sec.style.display = "none";
                    }
                });
                if (fallback) fallback.style.display = totalVis === 0 ? "block" : "none";
            }
            searchInput.addEventListener("keyup", (e) => { query = e.target.value.toLowerCase().trim(); filter(); });
            tabBtns.forEach(btn => {
                btn.addEventListener("click", (e) => {
                    tabBtns.forEach(b => b.classList.remove("active")); e.target.classList.add("active");
                    activeCat = e.target.getAttribute("data-category"); filter();
                });
            });
            if (resetBtn) {
                resetBtn.addEventListener("click", () => {
                    searchInput.value = ""; query = ""; activeCat = "all";
                    tabBtns.forEach(b => b.classList.remove("active")); if (tabBtns.length > 0) tabBtns.classList.add("active"); filter();
                });
            }
        }
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", () => {
            let msg = "📦 NEW PLATFORM MANIFEST ORDER\n\n"; let tot = 0;
            cart.forEach((item, idx) => {
                const s = item.price * item.quantity; tot += s;
                const formattedQty = (INC_MODE === "float") ? item.quantity.toFixed(1) : item.quantity;
                const modeLabel = item.isService ? "[Appointment Booking]" : "(" + formattedQty + " units)";
                msg += (idx+1) + ". *" + item.name + "* " + modeLabel + " - " + CURR_SYMBOL + s.toLocaleString() + "\n";
            });
            msg += "\n💰 *Total Invoice Balance:* " + CURR_SYMBOL + tot.toLocaleString();
            const whatsappURL = "https://wa.me" + MERCHANT_GATE + "?text=" + encodeURIComponent(msg);
            window.location.href = whatsappURL;
        });
    }
    
    const reveals = document.querySelectorAll('.food-card, .menu-category');
    if (reveals.length > 0) {
        reveals.forEach(el => el.classList.add('scroll-reveal'));
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
        }, { threshold: 0.01, rootMargin: "0px 0px 40px 0px" });
        reveals.forEach(el => obs.observe(el));
    }
});";
