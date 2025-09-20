document.addEventListener("DOMContentLoaded", () => {
    const cartContainer = document.getElementById("cart-items-container");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    console.log(cart)

    if (cart.length === 0 && cartContainer) {
        cartContainer.innerHTML = `<p>Your cart is empty</p>`;
        return;
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const formatted = now.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const cartChecked = cart.filter(item => !!item.checked);

    if (cartContainer) {
        cartContainer.innerHTML = `
    <div class="">
        <div class="d-flex justify-content-center align-items-center mb-2 flex-column gap-2">
            <h4 class="mb-0"><i class="fa-solid fa-snowflake fa-lg" style="color: #F37335; padding-right: .5rem;"></i>Restaurant: ${cartChecked.length && cartChecked[0].restaurant_name ? cartChecked[0].restaurant_name : "-"}</h4>
            <p class="mb-2 text-muted">Estimated delivery time: ${formatted}</p>
        </div>
        <div class="mb-2">
        ${cartChecked.map(item => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div class="d-flex justify-content-start gap-3 align-items-center">
                <img src="${item.img}" alt="${item.name}" style="width: 60px; height: 60px; border-radius: .5rem;">
                <div class="text-truncate" style="padding-right: .5rem;">
                ${item.name} - 
                <span style="padding-left: .5rem; font-size: .8rem; font-style: italic;">
                    ${item.price} x${item.qty}
                </span>
                </div>
            </div>
            <div style="text-align:right; font-size: .8rem;">
                $${(item.price * item.qty).toFixed(2)}
            </div>
            </div>
        `).join('')}
        </div>
    </div>
    `;
    }

    const elCartSummary = document.querySelector("#cart-summary-container");
    if (elCartSummary) {
        const elSubtotal = elCartSummary.querySelector(".summary-subtotal");
        const elSaving = elCartSummary.querySelector(".summary-saving");
        const elPickup = elCartSummary.querySelector(".summary-pickup");
        const elTax = elCartSummary.querySelector(".summary-tax");
        const elTotal = elCartSummary.querySelector(".summary-total");

        // Hàm format tiền tệ
        const formatCurrency = (value) =>
            `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Lấy giá trị subtotal từ text (chuyển về số)
        let subtotal = cartChecked.reduce((sum, item) => sum + item.price * item.qty, 0);

        // Lấy data-value từ attr
        let saving = parseFloat(elSaving.dataset.value) || 0;
        let pickup = parseFloat(elPickup.dataset.value) || 0;
        let taxPercent = parseFloat(elTax.dataset.value) || 0;

        // Tính toán
        let taxValue = (subtotal - saving + pickup) * (taxPercent / 100);
        let total = subtotal - saving + pickup + taxValue;

        // Update data-value (raw values)
        elSubtotal.dataset.value = subtotal;
        elSaving.dataset.value = saving;
        elPickup.dataset.value = pickup;
        elTax.dataset.value = taxPercent;
        elTotal.dataset.value = total;

        // Update UI (formatted values)
        elSubtotal.textContent = formatCurrency(subtotal);
        elSaving.textContent = formatCurrency(saving);
        elPickup.textContent = formatCurrency(pickup);
        elTax.textContent = formatCurrency(taxValue); // show actual tax $
        elTotal.textContent = formatCurrency(total);
    }



    const btnPlaceOrder = document.getElementById("btnPlaceOrder");
    if (btnPlaceOrder) {

        btnPlaceOrder.addEventListener("click", function (e) {
            e.preventDefault();
            const form = document.getElementById("checkoutForm");

            // Kiểm tra form hợp lệ
            if (!form.checkValidity()) {
                form.reportValidity(); // highlight missing fields
                return;
            }

            const payment_method = document.querySelector('select[name="payment_method"]').value;

            // map lại nếu muốn gửi đúng ENUM
            let pm = payment_method;
            if (pm === 'cod') pm = 'COD';
            if (pm === 'credit_card') pm = 'CreditCard';
            if (pm === 'paypal') pm = 'Paypal';

            // Lấy thông tin người nhận
            const recipientInfo = {
                user_id: localStorage.getItem("userid"), // demo user id
                name: document.getElementById("recipientName").value,
                phone: document.getElementById("phoneNumber").value,
                email: document.getElementById("email").value,
                address: document.getElementById("address").value,
                payment_method: pm
            };

            // Lấy cart từ localStorage
            const baseCart = JSON.parse(localStorage.getItem("cart")) || [];
            const cart = baseCart.filter(item => !!item.checked);


            const remainingCart = baseCart.filter(item => !item.checked);
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            // Tính subtotal, savings, pickup, tax, total
            // const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            // const savings = 0; // demo tự bịa
            // const storePickup = 0; // demo tự bịa
            // const tax = Math.round(subtotal * 0.08); // ví dụ 8% tax
            // const total = subtotal + savings + storePickup + tax;

            const subtotal = parseFloat(document.querySelector(".summary-subtotal").dataset.value || 0);
            const savings = parseFloat(document.querySelector(".summary-saving").dataset.value || 0);
            const storePickup = parseFloat(document.querySelector(".summary-pickup").dataset.value || 0);
            const tax = parseFloat(document.querySelector(".summary-tax").dataset.value || 0);
            const total = parseFloat(document.querySelector(".summary-total").dataset.value || 0);


            const payload = {
                user_id: recipientInfo.user_id,
                restaurant_id: cart[0].restaurant_id,
                restaurant_name: cart[0].restaurant_name,
                recipient_name: recipientInfo.name,
                phone_number: recipientInfo.phone,
                email: recipientInfo.email,
                address: recipientInfo.address,
                payment_method: recipientInfo.payment_method,
                subtotal,
                savings,
                store_pickup: storePickup,
                tax,
                total,
                items: cart.map(item => ({
                    food_id: item.id,
                    food_name: item.name,
                    quantity: item.qty,
                    price: item.price,
                    image_url: item.img
                }))
            };

            const toastEl = document.getElementById("orderToast");
            const createOrder = async () => {
                try {
                    const response = await fetch("/orders/create", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const data = await response.json();

                    if (response.ok) {
                        localStorage.setItem("cart", JSON.stringify(remainingCart));
                        toastEl.querySelector(".toast-body").textContent =
                            "Order created successfully! Transaction ID: " + data.transaction_id;

                        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
                        toast.show();
                        setTimeout(() => {
                            window.location.href = "/";
                        }, 3000);
                    } else {
                        alert("Error creating order: " + data.message);
                    }
                } catch (error) {
                    toastEl.querySelector(".toast-body").textContent = "Error creating order: " + data.message;
                    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
                    toast.show();
                }
            };
            createOrder();

        });
    }

});