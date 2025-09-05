// static/js/register.js
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = this.email.value.trim();
    const username = this.username.value.trim();
    const password = this.password.value.trim();

    const msgDiv = document.getElementById("msg-signup");
    const btnSignUp = document.getElementById("dlab-sign-up-btn");
    const loaderEl = btnSignUp.querySelector(".spinner-border");

    if (!email || !username || !password) {
      msgDiv.textContent = "Email, Username and Password cannot be blank!";
      msgDiv.classList.remove("d-none");
      return;
    }

    btnSignUp.classList.add("disabled");
    loaderEl.classList.remove("d-none");

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          username,
          password
        }),
      });

      const data = await res.json();

      if (data.success) {
        email.value = "";
        password.value = "";
        username.value = "";
        msgDiv.classList.add("d-none");
        window.location.href = "/";
      } else {
        msgDiv.textContent = data.message;
        msgDiv.classList.remove("d-none");
      }
    } catch (err) {
      msgDiv.textContent = "Server error. Please try again!";
      msgDiv.classList.remove("d-none");
    } finally {
      btnSignUp.classList.remove("disabled");
      loaderEl.classList.add("d-none");
    }
  });
}