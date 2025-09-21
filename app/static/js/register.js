document.addEventListener("DOMContentLoaded", () => {

  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = registerForm.email.value.trim();
      const username = registerForm.username.value.trim();
      const password = registerForm.password.value.trim();
      const address = registerForm.address.value.trim();

      const msgDiv = document.getElementById("msg-signup");
      const btnSignUp = document.getElementById("dlab-sign-up-btn");
      let loadingBtnSignUp;
      if (loadingBtnSignUp) {
        loadingBtnSignUp = document.querySelector(".spinner-border");
      }


      if (!email || !username || !password || !address) {
        if (msgDiv) {
          msgDiv.textContent = "Email, Username, Password and Address cannot be blank!";
          msgDiv.classList.remove("d-none");
        }
        return;
      }

      if (btnSignUp) {
        btnSignUp.classList.add("disabled");
      }
      if (loadingBtnSignUp) {
        loadingBtnSignUp.classList.add("d-block");
      }
      try {
        const res = await fetch("/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            username,
            password,
            address
          }),
        });

        const data = await res.json();

        if (data.success) {
          registerForm.reset();
          if (msgDiv) msgDiv.classList.add("d-none");
          // Redirect after short delay
          alert("Register successfully!");
          setTimeout(() => { window.location.href = "/login"; }, 1000);
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
        if (loadingBtnSignUp) loadingBtnSignUp.classList.add("d-none");
        if (btnSignUp) btnSignUp.classList.remove("disabled");
      }
    });
  }

});

