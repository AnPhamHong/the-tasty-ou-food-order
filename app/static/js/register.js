const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = registerForm.email.value.trim();
    const username = registerForm.username.value.trim();
    const password = registerForm.password.value.trim();

    const msgDiv = document.getElementById("msg-signup");
    const btnSignUp = document.getElementById("dlab-sign-up-btn");
    const loaderEl = btnSignUp ? btnSignUp.querySelector(".spinner-border") : null;

    if (!email || !username || !password) {
      if (msgDiv) {
        msgDiv.textContent = "Email, Username and Password cannot be blank!";
        msgDiv.classList.remove("d-none");
      }
      return;
    }

    if (btnSignUp) btnSignUp.classList.add("disabled");
    if (loaderEl) loaderEl.classList.remove("d-none");

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
        registerForm.reset();
        if (msgDiv) msgDiv.classList.add("d-none");
        // Redirect after short delay
        setTimeout(() => { window.location.href = "/"; }, 800);
      } else {
        if (msgDiv) {
          msgDiv.textContent = data.message;
          msgDiv.classList.remove("d-none");
        }
      }
    } catch (err) {
      if (msgDiv) {
        msgDiv.textContent = "Server error. Please try again!";
        msgDiv.classList.remove("d-none");
      }
    } finally {
      if (btnSignUp) btnSignUp.classList.remove("disabled");
      if (loaderEl) loaderEl.classList.add("d-none");
    }
  });
}