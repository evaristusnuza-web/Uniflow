import { login } from "../shared/api.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const msg = document.querySelector("#msg");
  const btn = document.querySelector(".but");

  // Password toggle (matches your HTML: #pw and #pwToggle)
  const pw = document.getElementById("pw");
  const toggle = document.getElementById("pwToggle");
  if (pw && toggle) {
    toggle.addEventListener("click", () => {
      const show = pw.type === "password";
      pw.type = show ? "text" : "password";
      toggle.textContent = show ? "🙈" : "👁";
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  }

  // Forgot password placeholder
  const forgot = document.getElementById("forgotLink");
  if (forgot && msg) {
    forgot.addEventListener("click", (e) => {
      e.preventDefault();
      msg.textContent = "Forgot password not implemented yet.";
    });
  }

  if (!form || !msg || !btn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const email = document.querySelector(".email").value.trim();
    const password = document.querySelector(".password").value;

    if (!email || !password) {
      msg.textContent = "Please enter email and password.";
      return;
    }

    btn.disabled = true;
    btn.textContent = "signing in...";

    try {
      await login({ email, password }); // stores token in localStorage
      window.location.href = "../dashboard/index.html";
    } catch (err) {
      msg.textContent = err.message || "Login failed";
    } finally {
      btn.disabled = false;
      btn.textContent = "sign in";
    }
  });
});