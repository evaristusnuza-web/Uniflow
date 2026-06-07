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
  const list = document.querySelector("#coursesList");

  const [{ courses }, mine] = await Promise.all([
    api("/courses"),
    api("/courses/mine").catch(() => ({ courses: [] }))
  ]);

  const selected = new Set((mine.courses || []).map(c => c.id));

  list.innerHTML = courses.map(c => `
    <label class="item pick">
      <input type="checkbox" value="${c.id}" ${selected.has(c.id) ? "checked":""} />
      <div>
        <b>${escapeHTML(c.title)}</b>
        <small class="muted">${escapeHTML(c.slug)}</small>
      </div>
      <span class="badge">Course</span>
    </label>
  `).join("");

  document.querySelector("#saveBtn").addEventListener("click", async () => {
    out.textContent = "";
    const ids = [...list.querySelectorAll("input[type=checkbox]:checked")].map(i => i.value);
    if (!ids.length) return (out.textContent = "Select at least one course.");
    await api("/courses/select", { method:"POST", body: { courseIds: ids } });
    out.textContent = "Saved.";
    await refreshProgressSelector();
  });

  async function refreshProgressSelector() {
    const mine2 = await api("/courses/mine").catch(() => ({ courses: [] }));
    const sel = document.querySelector("#progressCourse");
    sel.innerHTML = (mine2.courses || []).map(c =>
      `<option value="${c.id}">${escapeHTML(c.title)} (${c.progressPct}%)</option>`
    ).join("") || `<option value="">No selected courses</option>`;
  }

  await refreshProgressSelector();

  // progress update
  const progressOut = document.querySelector("#progressOut");
  document.querySelector("#progressForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    progressOut.textContent = "";
    const courseId = document.querySelector("#progressCourse").value;
    const progressPct = Number(document.querySelector("#progressPct").value);

    if (!courseId) return (progressOut.textContent = "Select a course first.");
    await api("/courses/progress", { method:"POST", body: { courseId, progressPct } });
    progressOut.textContent = "Progress updated.";
    await refreshProgressSelector();
  });
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