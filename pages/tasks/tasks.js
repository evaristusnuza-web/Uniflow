import { api, initials, escapeHTML } from "../../shared/api.js";
import { me, clearToken } from "../shared/api.js";

try {
  await me();
} catch {
  clearToken();
  window.location.replace("../login/login.html");
}
async function requireLogin() {
  try { return await api("/me"); }
  catch { window.location.href = "../login/login.html"; throw new Error("Not logged in"); }
}

function setHeader(user) {
  document.querySelector("#username").textContent = user.username;
  document.querySelector("#major").textContent = user.major || "Major not set";
  document.querySelector("#avatar").textContent = initials(user.username);
  if (user.role === "ADMIN") document.querySelector("#adminLink").style.display = "block";
}

async function load() {
  const { user } = await requireLogin();
  setHeader(user);

  // logout
  document.querySelector("#logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await api("/auth/logout", { method:"POST" });
    window.location.href = "../login/login.html";
  });

  const out = document.querySelector("#out");
  const list = document.querySelector("#tasksList");

  const [{ tasks }, mine] = await Promise.all([
    api("/tasks"),
    api("/tasks/mine").catch(() => ({ tasks: [] }))
  ]);

  const selected = new Set((mine.tasks || []).map(t => t.id));

  list.innerHTML = tasks.map(t => `
    <label class="item pick">
      <input type="checkbox" value="${t.id}" ${selected.has(t.id) ? "checked":""} />
      <div>
        <b>${escapeHTML(t.title)}</b>
        <small class="muted">Cours: ${escapeHTML(t.course?.title || "—")}</small>
      </div>
      <span class="badge">${t.isDefault ? "Default" : "Task"}</span>
    </label>
  `).join("");

  document.querySelector("#saveBtn").addEventListener("click", async () => {
    out.textContent = "";
    const ids = [...list.querySelectorAll("input[type=checkbox]:checked")].map(i => i.value);
    if (!ids.length) return (out.textContent = "Select at least one task.");
    await api("/tasks/select", { method:"POST", body: { taskIds: ids } });
    out.textContent = "Saved.";
    await renderMine();
  });

  async function renderMine() {
    const mine2 = await api("/tasks/mine").catch(() => ({ tasks: [] }));
    const mineList = document.querySelector("#mineList");
    const mineOut = document.querySelector("#mineOut");
    mineOut.textContent = "";

    if (!mine2.tasks.length) {
      mineList.innerHTML = `<div class="muted">No selected tasks.</div>`;
      return;
    }

    mineList.innerHTML = "";
    for (const t of mine2.tasks) {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <input type="checkbox" ${t.completed ? "checked":""} />
        <div>
          <b>${escapeHTML(t.title)}</b>
          <small>Cours: ${escapeHTML(t.courseTitle || "—")}</small>
        </div>
        <span class="badge">${t.completed ? "Done" : "Todo"}</span>
      `;
      el.querySelector("input").addEventListener("change", async (e) => {
        await api("/tasks/complete", { method:"POST", body: { taskId: t.id, completed: e.target.checked } });
        await renderMine();
      });
      mineList.appendChild(el);
    }
  }

  await renderMine();
}
function setupMobileMenu() {
  const btn = document.getElementById("menuBtn");
  const overlay = document.getElementById("overlay");
  if (!btn || !overlay) return;

  const open = () => {
    document.body.classList.add("menu-open");
    overlay.hidden = false;
    btn.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    document.body.classList.remove("menu-open");
    overlay.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", () => {
    document.body.classList.contains("menu-open") ? close() : open();
  });

  overlay.addEventListener("click", close);

  // Close menu when clicking a nav link
  document.querySelectorAll(".nav a").forEach(a => {
    a.addEventListener("click", close);
  });

  // Close on ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

setupMobileMenu();
load();