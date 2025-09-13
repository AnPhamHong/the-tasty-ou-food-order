// static/js/login.js
document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = this.email.value.trim();
    const password = this.password.value.trim();
    const msgDiv = document.getElementById("msg-login");
    const btnSignIn = document.getElementById("dlab-sign-in-btn");
    const loaderEl = btnSignIn.querySelector(".spinner-border");

    if (email === "" || password === "") {
        msgDiv.textContent = "Email and Password cannot be blank!";
        msgDiv.classList.remove("d-none");
        return;
    }
    btnSignIn.classList.add("disabled");
    loaderEl.classList.remove("d-none");
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data)
            localStorage.setItem("username", data.user.username); // giả sử backend trả về username
            localStorage.setItem("email", data.user.email);
            localStorage.setItem("userid", data.user.userid)
            if (data.success) {
                email.value = "";
                password.value = "";
                msgDiv.classList.add("d-none");
                window.location.href = "/index";
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
            loaderEl.classList.add("d-none");
        });
});