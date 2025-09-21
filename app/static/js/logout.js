document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");
    const usernameEl = document.getElementById("username-display");

    if (username && usernameEl) {
        usernameEl.textContent = username;
        usernameEl.classList.remove("d-none");
    }

    const btnLogout = document.getElementById("logoutBtn");
    if (btnLogout) {

        btnLogout.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = "/login";
        });
    }

});
