document.addEventListener("DOMContentLoaded", () => {
    const loginEl = document.getElementById("loginForm");
    if (loginEl) {
        loginEl.addEventListener("submit", function (e) {
            e.preventDefault();

            const email = this.email.value.trim();
            const password = this.password.value.trim();
            const isSellerAdmin = this.is_seller_admin.checked;
            const msgDiv = document.getElementById("msg-login");
            const btnSignIn = document.getElementById("dlab-sign-in-btn");

            if (email === "" || password === "") {
                msgDiv.textContent = "Email and Password cannot be blank!";
                msgDiv.classList.remove("d-none");
                return;
            }

            btnSignIn.classList.add("disabled");

            fetch("/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, is_seller_admin: isSellerAdmin })
            })
                .then(res => res.json())
                .then(data => {
                    console.log(data)
                    if (data.success) {
                        localStorage.setItem("username", data.user.username);
                        localStorage.setItem("email", data.user.email);
                        localStorage.setItem("userid", data.user.userid);
                        localStorage.setItem("is_seller_admin", data.user.is_seller_admin);
                        localStorage.setItem("restaurantId", data.user.restaurant_id);

                        if (data.user.is_seller_admin && data.user.restaurant_id) {
                            window.location.href = "/seller-admin";
                        } else {
                            window.location.href = "/";
                        }

                    } else {
                        msgDiv.textContent = data.message;
                        msgDiv.classList.remove("d-none");
                    }
                })
                .catch(err => {
                    msgDiv.textContent = "Server error. Please try again!";
                    msgDiv.classList.remove("d-none");
                })
                .finally(() => {
                    btnSignIn.classList.remove("disabled");
                });
        });
    }
});
