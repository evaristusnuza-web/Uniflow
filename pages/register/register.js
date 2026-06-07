
import { register } from "../shared/api.js";

console.log("register.js loaded");

const form = document.querySelector("#registerForm");
const msg = document.querySelector("#msg");
const btn = document.querySelector(".btn1");

if (!form) console.error("Missing #registerForm");
if (!msg) console.error("Missing #msg");
if (!btn) console.error("Missing .btn1");

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("Register submit fired");

  msg.textContent = "";

  const username = document.querySelector(".name")?.value?.trim();
  const email = document.querySelector(".email")?.value?.trim();
  const password = document.querySelector(".password")?.value;

  if (!username || !email || !password) {
    msg.textContent = "Please fill in all fields.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "creating...";

  try {
    await register({ username, email, password });
    window.location.href = "../dashboard/index.html";
  } catch (err) {
    console.error(err);
    msg.textContent = err.message || "Sign up failed";
  } finally {
    btn.disabled = false;
    btn.textContent = "sign up";
  }
});