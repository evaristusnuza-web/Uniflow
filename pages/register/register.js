import { register } from "../shared/api.js";

const form = document.querySelector("#registerForm");
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

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!message || !submitButton) return;
  message.textContent = "";

  const username = document.querySelector("#full_name")?.value.trim();
  const email = document.querySelector("#email")?.value.trim();
  const passwordValue = password?.value || "";
  const major = document.querySelector("#major")?.value.trim();
  if (!username || !email || passwordValue.length < 8) {
    message.textContent = "Enter your name and a valid email, and choose a password with at least 8 characters.";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Creating account…";
  try {
    await register({ username, email, password: passwordValue, major });
    window.location.replace("../dashboard/index.html");
  } catch (error) {
    message.textContent = error.message || "Account creation failed. Please try again.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Create account";
  }
});
