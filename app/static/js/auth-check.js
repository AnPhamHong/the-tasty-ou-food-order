document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");
    const email = localStorage.getItem("email");
    const userid = localStorage.getItem("userid");

    if (!username || !email || !userid) {
        window.location.href = "/login";
    }
});
