import { api } from "../shared/api.js";

const form = document.querySelector("#loginForm");
const msg = document.querySelector("#msg");
const btn = document.querySelector(".but");

function goDashboard() {
  window.location.href = "../dashboard/index.html";
}

// If already logged in, go dashboard
(async () => {
  try { await api("/me"); goDashboard(); } catch {}
})();

document.querySelector("#forgotLink").addEventListener("click", (e) => {
  e.preventDefault();
  msg.textContent = "Forgot password flow not implemented yet.";
});

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
    await api("/auth/login", { method: "POST", body: { email, password } });
    goDashboard();
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "sign in";
  }
});