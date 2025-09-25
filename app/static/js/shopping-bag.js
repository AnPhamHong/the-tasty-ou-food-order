document.addEventListener("DOMContentLoaded", () => {
    const cartContainer = document.getElementById("cart-items-container");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
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

    console.log(cartChecked);

    if (cartContainer) {
        cartContainer.innerHTML = `
    <div class="">
        <div class="d-flex justify-content-center align-items-center mb-2 flex-column gap-2">
            <h4 class="mb-0"><i class="fa-solid fa-snowflake fa-lg" style="color: #F37335; padding-right: .5rem;"></i>Restaurant: ${cartChecked.length && cartChecked[0].restaurant_name ? cartChecked[0].restaurant_name : "-"}</h4>
            <p class="mb-2 text-muted">Estimated delivery time: ${formatted}</p>
        </div>
        <div class="mb-2">
        ${cartChecked.map(item => `
            <div class="d-flex justify-content-between align-items-start py-2 border-bottom">
            <div class="d-flex justify-content-start gap-3 align-items-center">
                <img src="${item.img}" alt="${item.name}" style="width: 100px; height: 100px; border-radius: .5rem; object-fit: cover;">
                <div class="d-flex flex-column gap-1">
                    <div class="text-truncate" style="padding-right: .5rem;">
                    <span>${item.name}</span>
                    <span class="small" style="display: flex; gap: 0.5rem; font-size: 0.85rem; font-style: italic;">
                        ${item.discount_price && item.discount_price !== item.price
                ? `<span class="small" style="color: #777; text-decoration: line-through;">
                                    $${parseFloat(item.price).toFixed(2)} x${item.qty}
                            </span>
                            <span class="small" style="color: #e63946; font-weight: 500;">
                                    $${parseFloat(item.discount_price).toFixed(2)} x${item.qty}
                            </span>`
                : `<span class="small" style="color: #333;">
                                    $${parseFloat(item.price).toFixed(2)} x${item.qty}
                            </span>`}
                    </span>
                    </div>
                    <div class="mt-2">
                        <input 
                            name="note"
                            type="text" 
                            style="border-radius: .5rem;line-height: 2;min-width: 300px;"
                            class="form-control form-control-sm note-input" 
                            placeholder="Note for this item (e.g., less spicy, no onion)" 
                            data-id="${item.id}" 
                            value="${item.note || ''}">
                    </div>
                </div>
            </div>
            <div style="text-align:right; font-size: .8rem;">
                $${(item.discount_price * item.qty).toFixed(2)}
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

        const formatCurrency = (value) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        let subtotal = cartChecked.reduce((sum, item) => sum + item.price * item.qty, 0);
        let discountTotal = cartChecked.reduce((sum, item) => sum + item.discount_price * item.qty, 0);
        let totalSaving = subtotal - discountTotal;
        elSaving.dataset.value = totalSaving.toFixed(2);

        let saving = parseFloat(elSaving.dataset.value) || 0;
        let pickup = parseFloat(elPickup.dataset.value) || 0;
        let taxPercent = parseFloat(elTax.dataset.value) || 0;

        let taxValue = (subtotal - saving + pickup) * (taxPercent / 100);
        let total = subtotal - saving + pickup + taxValue;

        elSubtotal.dataset.value = subtotal;
        elSaving.dataset.value = saving;
        elPickup.dataset.value = pickup;
        elTax.dataset.value = taxPercent;
        elTotal.dataset.value = total;

        elSubtotal.textContent = formatCurrency(subtotal);
        elSaving.textContent = formatCurrency(saving);
        elPickup.textContent = formatCurrency(pickup);
        elTax.textContent = formatCurrency(taxValue); // show actual tax $
        elTotal.textContent = formatCurrency(total);
    }

    const emailInput = document.getElementById("email");
    const sendEmailBtn = document.getElementById("sendEmailOtpBtn");
    const emailVerifiedEl = document.getElementById("emailVerified");

    let lastVerifiedEmail = "";
    emailInput.addEventListener("input", () => {
        const emailVal = emailInput.value.trim();
        sendEmailBtn.disabled = emailVal === "";
        if (emailVal !== lastVerifiedEmail) {
            emailVerifiedEl.classList.add("d-none");
            lastVerifiedEmail = ""; // reset
        }
    });

    function handleEmailVerified() {
        lastVerifiedEmail = emailInput.value.trim();
        emailVerifiedEl.classList.remove("d-none");
    }

    document.getElementById("btnContinueShopping").addEventListener("click", () => {
        if (cartChecked.length === 0) return;
        const restaurantId = cartChecked[0].restaurant_id;
        window.location.href = `/restaurant/${restaurantId}/menu`;
    });

    const btnPlaceOrder = document.getElementById("btnPlaceOrder");
    if (btnPlaceOrder) {

        const spinner = btnPlaceOrder.querySelector(".spinner-border");
        const btnText = btnPlaceOrder.querySelector(".btn-text");

        btnPlaceOrder.addEventListener("click", function (e) {
            e.preventDefault();
            const form = document.getElementById("checkoutForm");

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const emailVerified = !document.getElementById("emailVerified").classList.contains("d-none");

            if (!emailVerified) {
                return alert("You must verify phone and email first!");
            }


            btnPlaceOrder.disabled = true;
            spinner.classList.remove("d-none");
            btnText.textContent = "Processing...";

            const payment_method = document.querySelector('select[name="payment_method"]').value;

            let pm = payment_method;
            if (pm === 'cod') pm = 'COD';
            if (pm === 'credit_card') pm = 'CreditCard';
            if (pm === 'paypal') pm = 'Paypal';

            const recipientInfo = {
                user_id: localStorage.getItem("userid"), // demo user id
                name: document.getElementById("recipientName").value,
                phone: document.getElementById("phoneNumber").value,
                email: document.getElementById("email").value,
                address: document.getElementById("address").value,
                payment_method: pm
            };

            const baseCart = JSON.parse(localStorage.getItem("cart")) || [];
            const cart = baseCart.filter(item => !!item.checked);

            cart.forEach(item => {
                const noteInput = document.querySelector(`.note-input[data-id="${item.id}"]`);
                if (noteInput) {
                    item.note = noteInput.value.trim();
                } else {
                    item.note = "";
                }
            });

            const remainingCart = baseCart.filter(item => !item.checked);
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

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
                    image_url: item.img,
                    note: item.note || ""
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
                        }, 1000);
                    } else {
                        alert("Error creating order: " + data.message);
                    }
                } catch (error) {
                    toastEl.querySelector(".toast-body").textContent = "Error creating order: " + data.message;
                    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
                    toast.show();
                } finally {
                    btnPlaceOrder.disabled = false;
                    spinner.classList.add("d-none");
                    btnText.textContent = "Proceed to Checkout";
                }
            };
            createOrder();

        });


        let currentVerifyType = null; // "phone" or "email"
        let tempValue = "";

        const otpModalEl = document.getElementById("otpModal");
        const otpModal = new bootstrap.Modal(otpModalEl, {
            backdrop: 'static',
            keyboard: false
        });

        document.getElementById("sendEmailOtpBtn").addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            if (!email) return alert("Enter email first");
            tempValue = email;
            currentVerifyType = "email";

            await fetch("/verify/email/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            otpModal.show();
        });

        document.getElementById("confirmOtpBtn").addEventListener("click", async () => {
            const otp = document.getElementById("otpInput").value;
            if (!otp) return alert("Enter OTP");

            const url = currentVerifyType === "phone"
                ? "/verify/phone/confirm"
                : "/verify/email/confirm";
            const payload = currentVerifyType === "phone"
                ? { phone: tempValue, otp }
                : { email: tempValue, otp };

            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    if (currentVerifyType === "phone") {
                        document.getElementById("phoneVerified").classList.remove("d-none");
                    } else {
                        document.getElementById("emailVerified").classList.remove("d-none");
                        handleEmailVerified();
                    }

                    otpModal.hide();

                    const backdropEl = document.querySelector(".modal-backdrop");
                    if (backdropEl) backdropEl.remove();
                    document.getElementById("otpInput").value = "";
                } else {
                    alert("Invalid OTP");
                }
            } catch (err) {
                console.error(err);
                alert("Error verifying OTP");
            }
        });

        document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            if (document.getElementById("emailVerified").classList.contains("d-none")) {
                return alert("You must verify phone and email first!");
            }

            const payload = {
                recipient_name: document.getElementById("recipientName").value,
                phone_number: document.getElementById("phoneNumber").value,
                email: document.getElementById("email").value,
                note: document.getElementById("note").value
            };

            const res = await fetch("/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Order placed successfully!");
            } else {
                alert("Failed to place order");
            }
        });
    }

});