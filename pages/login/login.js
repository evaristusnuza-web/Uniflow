import { login } from "../shared/api.js";

const form = document.querySelector("#loginForm");
const message = document.querySelector("#msg");
const submitButton = form?.querySelector('button[type="submit"]');
const password = document.querySelector("#pw");
const toggle = document.querySelector("#pwToggle");

if (toggle && password) {
  toggle.addEventListener("click", () => {
    const showing = password.type === "password";
    password.type = showing ? "text" : "password";
    toggle.textContent = showing ? "Hide" : "Show";
    toggle.setAttribute("aria-label", showing ? "Hide password" : "Show password");
    toggle.setAttribute("aria-pressed", String(showing));
  });
}

document.querySelector("#forgotLink")?.addEventListener("click", () => {
  if (message) message.textContent = "Password reset email is not configured yet. Please contact your UniFlow administrator.";
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!message || !submitButton) return;
  message.textContent = "";

  const email = document.querySelector("#email")?.value.trim();
  const passwordValue = password?.value || "";
  if (!email || !passwordValue) {
    message.textContent = "Enter your email and password to continue.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Signing in…";
  try {
    await login({
      email,
      password: passwordValue,
      remember: document.querySelector("#remember")?.checked ?? true,
    });
    window.location.replace("../dashboard/index.html");
  } catch (error) {
    message.textContent = error.message || "Sign-in failed. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign in";
  }
});
