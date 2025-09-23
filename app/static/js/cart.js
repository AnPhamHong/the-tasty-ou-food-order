// Lấy cart từ localStorage hoặc tạo mới
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Lưu cart vào localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Cập nhật badge cart mini
function updateCartBadge() {
    const cart = getCart();
    const cartNumber = document.getElementById('cart-number');
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartNumber.textContent = totalQty > 99 ? '99+' : totalQty;
}

// Thêm sản phẩm vào cart
function addToCart(product) {
    let cart = getCart();

    const existing = cart.find(item => item.id === product.id && item.restaurant_id === product.restaurant_id);

    if (existing) {
        existing.qty += 1; // tăng quantity
    } else {
        cart.push({
            ...product,
            qty: 1
        });
    }

    // Chỉ check nhà hàng hiện tại, uncheck các nhà hàng khác
    cart = cart.map(item => ({
        ...item,
        checked: item.restaurant_id === product.restaurant_id
    }));

    saveCart(cart);
    updateCartBadge();
    renderCart();
    updateTextMsgWarning();
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    document.getElementById('overlay-modal-cart').style.display = 'flex';
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    cartItems.innerHTML = '';
    // Group theo restaurant
    const grouped = cart.reduce((acc, item) => {
        if (!acc[item.restaurant_id]) acc[item.restaurant_id] = [];
        acc[item.restaurant_id].push(item);
        return acc;
    }, {});

    let total = 0;
    const restaurantIds = Object.keys(grouped).reverse();
    restaurantIds.forEach(restaurantId => {
        const products = grouped[restaurantId];
        const restaurantName = products[0].restaurant_name || `Restaurant ${restaurantId}`;

        const isChecked = products.some(item => item.checked) ? 'checked' : '';
        // Header restaurant
        cartItems.innerHTML += `
            <div class="fw-bold bg-light rounded d-flex align-items-center gap-2 justify-content-between" style="background: linear-gradient(to right, #fff7f0, #fff3e6) !important; border-radius: 0 !important; padding: .5rem .8rem">
                <span style="color: #F37335;font-weight: 600;">${restaurantName}</span>
                <div class="form-check mb-0">
                    <input class="form-check-input restaurant-check custom-checkbox" type="checkbox" data-restaurant-id="${restaurantId}" ${isChecked}>
                </div>
            </div>
        `;
        // Products
        let tempStringList = '';
        products.forEach((item, index) => {
            const isLast = index === products.length - 1; // kiểm tra item cuối
            let priceHtml = '';
            if (item.discount_price && item.discount_price < item.price) {
                priceHtml = `
                    <span style="text-decoration: line-through; color: #6b7280; font-size: .75rem;">$${item.price.toFixed(2)}</span>
                `;
            }

            tempStringList += `
            <div class="card mb-2 p-2 flex-row align-items-start gap-3 border-0 ${isLast ? '' : 'border-bottom'} rounded-0">
                    <img src="${item.img || 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/iphone-light.svg'}" 
                         alt="${item.name}" class="rounded" style="width:100px;h;height: 100px;object-fit: cover;">

                <div class="flex-grow-1 d-flex gap-1 flex-column">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong style="color: #111827;">${item.name}</strong>
                        ${priceHtml}
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <form class="d-flex align-items-center gap-2">
                            <div class="input-group input-group-sm" style="width: 90px;">
                                <button class="btn btn-outline-secondary btn-left-rounded change-qty" type="button" data-delta="-1" data-product-id="${item.id}" data-restaurant-id="${item.restaurant_id}" ${item.qty === 1 ? 'disabled' : ''}>
                                <i class="fa-solid fa-minus" data-delta="-1" data-product-id="${item.id}" data-restaurant-id="${item.restaurant_id}" ></i>
                                </button>
                                <input name="quantity" type="text" class="quantity-input-cart form-control text-center" value="${item.qty}" required>
                                <button class="btn btn-outline-secondary btn-right-rounded change-qty" type="button"  data-delta="1" data-product-id="${item.id}" data-restaurant-id="${item.restaurant_id}">
                                <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </form>
                        <span style="color: #198754;font-weight: 600;font-size: .75rem;">$${(item.discount_price * item.qty).toFixed(2)}</span>
                    </div>
                    <div class="mt-2 d-flex gap-4">
                        <span class="remove-item" data-product-id="${item.id}" data-restaurant-id="${item.restaurant_id}"><i class="fa-solid fa-trash me-1"></i> Remove</span>
                    </div>
                </div>
            </div>`;
            total += item.discount_price * item.qty;
        });
        cartItems.innerHTML += `<div style="padding: .5rem .8rem;">${tempStringList}</div>`
    })


    updateTotalCart();
    bindRestaurantCheckboxes();
    // Event delegation cho remove / change-qty
    cartItems.querySelectorAll('.remove-item').forEach(el => {
        el.addEventListener('click', () => removeFromCart(parseInt(el.dataset.productId), parseInt(el.dataset.restaurantId)));
    });
    cartItems.querySelectorAll('.change-qty').forEach(el => {
        el.addEventListener('click', () => changeQty(parseInt(el.dataset.productId), parseInt(el.dataset.delta), parseInt(el.dataset.restaurantId)));
    });

    setTimeout(() =>
        document.getElementById('overlay-modal-cart').style.display = 'none', 500)
}

// Xóa sản phẩm khỏi cart
function removeFromCart(productId, restaurantId) {
    let cart = getCart();

    // Lọc ra các item không phải sản phẩm cần xóa
    cart = cart.filter(item => !(item.id === productId && item.restaurant_id === restaurantId));

    saveCart(cart);
    updateCartBadge();
    renderCart();
}

// Tính tổng chỉ cho nhà hàng đang được check, trả về dạng $xx.xx
function calculateCheckedTotal() {
    const cart = getCart();
    const checkedItems = cart.filter(item => item.checked);
    const total = checkedItems.reduce((sum, item) => sum + item.discount_price * item.qty, 0);
    return `$${total.toFixed(2)}`;
}

function updateTotalCart() {
    document.getElementById('cart-total').textContent = calculateCheckedTotal();
}

function updateTextMsgWarning(initCart) {
    let cart = initCart ?? getCart();
    const elWarningEmptyCheck = document.querySelector("#cartOffcanvas .offcanvas-footer .text-warning-empty");
    const elBtnCheckout = document.querySelector("#cartOffcanvas .offcanvas-footer #btn-process-checkout");
    let isCheck = cart.find(v => !!v.checked) ? true : false;
    elWarningEmptyCheck.classList.toggle("d-none", isCheck);
    elBtnCheckout.setAttribute("disabled", !isCheck);
    !isCheck ? elBtnCheckout.setAttribute("disabled", true) : elBtnCheckout.removeAttribute("disabled")
}


// Thay đổi quantity theo restaurant_id
function changeQty(productId, delta, restaurantId) {
    const cart = getCart();
    console.log(cart)
    const index = cart.findIndex(item => item.id === productId && item.restaurant_id === restaurantId);
    if (index >= 0) {
        cart[index].qty += delta;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart(cart);
        updateCartBadge();
        renderCart();
    }
}

function bindRestaurantCheckboxes() {
    document.querySelectorAll('.restaurant-check').forEach(cb => {
        cb.addEventListener('change', () => {
            const selectedRestaurantId = parseInt(cb.dataset.restaurantId);
            let cart = getCart();

            // Chỉ giữ checked cho nhà hàng đang tick
            cart = cart.map(item => ({
                ...item,
                checked: item.restaurant_id === selectedRestaurantId && cb.checked
            }));

            saveCart(cart);
            updateTextMsgWarning(cart);
            renderCart(); // rerender cart
            bindRestaurantCheckboxes(); // gắn lại listener cho checkbox mới
        });
    });
}


// Khi load trang
document.addEventListener('DOMContentLoaded', () => {
    console.log('123')
    updateCartBadge();
    renderCart();

    bindRestaurantCheckboxes();
    updateTextMsgWarning()

    document.querySelectorAll('#menu-restaurant #menu-items [data-action="add-to-cart"]').forEach(icon => {
        icon.addEventListener('click', () => {
            const product = {
                id: parseInt(icon.dataset.productId),
                restaurant_id: parseInt(icon.dataset.restaurantId),
                restaurant_name: icon.dataset.restaurantName,
                name: icon.dataset.productName,
                img: icon.dataset.productImg,
                price: parseFloat(icon.dataset.productPrice),
                discount_price: parseFloat(icon.dataset.productDiscountPrice)
            };
            addToCart(product);
        });
    });

    document.getElementById("btn-process-checkout").addEventListener("click", () => {
        window.location.href = "/shopping-bag";
    });

});