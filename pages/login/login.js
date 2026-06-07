import { login } from "../shared/api.js";

document.addEventListener("DOMContentLoaded", () => {
  // ----- Password toggle -----
  const pw = document.getElementById("pw");
  const btn = document.getElementById("pwToggle");

 import { login } from "../shared/api.js";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector(".email").value.trim();
  const password = document.querySelector(".password").value;

  await login({ email, password }); // stores token
  window.location.href = "../dashboard/index.html";
});
  const forgot = document.getElementById("forgotLink");
  const msg = document.getElementById("msg");
  if (forgot && msg) {
    forgot.addEventListener("click", (e) => {
      e.preventDefault();
      msg.textContent = "Forgot password is not implemented yet.";
    });
  }

  // ----- Login submit -----
  const form = document.getElementById("loginForm");
  const btnSubmit = document.querySelector(".but");

  if (form && msg) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.textContent = "";

      const email = document.querySelector(".email").value.trim();
      const password = document.querySelector(".password").value;

      if (!email || !password) {
        msg.textContent = "Please enter email and password.";
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.textContent = "signing in...";

      try {
        await login({ email, password });
        window.location.href = "../dashboard/index.html";
      } catch (err) {
        msg.textContent = err.message;
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = "sign in";
      }
    });
  }
});