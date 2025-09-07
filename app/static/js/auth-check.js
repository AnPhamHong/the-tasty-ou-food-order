document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");

    if (!username || !email) {
        window.location.href = "/login";
    }
});
