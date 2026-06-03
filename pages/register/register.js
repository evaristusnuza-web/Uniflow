import { api } from "../shared/api.js";

const form = document.querySelector("#registerForm");
const msg = document.querySelector("#msg");
const btn = document.querySelector(".btn1");

function goDashboard() {
  window.location.href = "../dashboard/index.html";
}


(async () => {
  try { await api("/me"); goDashboard(); } catch {}
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const username = document.querySelector(".name").value.trim();
  const email = document.querySelector(".email").value.trim();
  const password = document.querySelector(".password").value;

  if (!username || !email || !password) {
    msg.textContent = "Please fill in all fields.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "creating...";

  try {
    await api("/auth/register", { method: "POST", body: { email, username, password } });
    goDashboard();
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "sign up";
  }
});