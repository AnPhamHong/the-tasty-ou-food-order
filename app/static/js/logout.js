document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");
    const usernameEl = document.getElementById("username-display");

    if (username) {
        usernameEl.textContent = username;
        usernameEl.classList.remove("d-none");
    }
});

document.getElementById("logoutBtn").addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "/login";
});