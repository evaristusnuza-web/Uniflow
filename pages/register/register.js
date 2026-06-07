import { api, setToken } from "../shared/api.js";

console.log("register.js loaded");

const form = document.querySelector("#registerForm");
const msg = document.querySelector("#msg");
const btn = document.querySelector(".btn1");

import { login } from "../shared/api.js";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.querySelector(".email").value.trim();
  const password = document.querySelector(".password").value;

  await login({ email, password }); // stores token
  window.location.href = "../dashboard/index.html";
});
form.addEventListener("submit", async (e) => {
  e.preventDefault(); // prevents page reload
  msg.textContent = "";

  const username = document.querySelector(".name").value.trim();
  const email = document.querySelector(".email").value.trim();
  const password = document.querySelector(".password").value;

  btn.disabled = true;
  btn.textContent = "creating...";

  try {
    const res = await api("/auth/register", {
      method: "POST",
      body: { username, email, password }
    });

    console.log("register response:", res);

    if (!res.token) throw new Error("No token returned from server.");
    setToken(res.token);

    window.location.href = "../dashboard/index.html";
  } catch (err) {
    console.error(err);
    msg.textContent = err.message || "Register failed";
  } finally {
    btn.disabled = false;
    btn.textContent = "sign up";
  }
});