import { me } from "../shared/api.js";
import { setupMobileMenu } from "../shared/menu.js";
setupMobileMenu();
async function init() {
  try {
    const { user } = await me();
    // call your existing render/load function and pass user
    await loadDashboard(user);
  } catch {
    window.location.replace("../login/login.html");
  }
}

init();
import { api, escapeHTML, initials, API_BASE, logout } from "../shared/api.js";

function setRing(pct) {
  const ring = document.querySelector("#ring");
  const ringText = document.querySelector("#ringText");
  if (!ring || !ringText) return;
  ring.style.setProperty("--p", String(pct));
  ringText.textContent = `${pct}%`;
}

function levelFromProgress(pct) {
  return Math.floor((pct || 0) / 20);
}

function addMsg(role, text) {
  const log = document.querySelector("#chatLog");
  if (!log) return;
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function requireLogin() {
  try {
    return await api("/me");
  } catch {
    window.location.href = "../login/login.html";
    throw new Error("Not logged in");
  }
}

async function safeGet(path, fallback) {
  try {
    return await api(path);
  } catch {
    return fallback;
  }
}

async function load() {
  const { user } = await requireLogin();

  // header + welcome
  document.querySelector("#username").textContent = user.username;
  document.querySelector("#major").textContent = user.major || "Major not set";
  document.querySelector("#avatar").textContent = initials(user.username);
  document.querySelector("#welcome").textContent = `Welcome, ${user.username} 👋`;

  // admin link
  const adminLink = document.querySelector("#adminLink");
  if (adminLink) adminLink.style.display = (user.role === "ADMIN") ? "block" : "none";

  // ---- Courses (fallback if endpoint not implemented yet) ----
  const mine = await safeGet("/courses/mine", { courses: [], globalProgress: 0 });
  const global = mine.globalProgress || 0;

  setRing(global);
  const levelEl = document.querySelector("#level");
  const levelSubEl = document.querySelector("#levelSubtitle");
  if (levelEl) levelEl.textContent = `Level ${levelFromProgress(global)}`;
  if (levelSubEl) levelSubEl.textContent = user.major ? user.major : "(Major not set)";

  const fallbackCourses = [
    { title: "Algorithms", progressPct: 0, icon: "</>" },
    { title: "Databases", progressPct: 0, icon: "⛁" },
    { title: "Web Development", progressPct: 0, icon: "⌘" },
    { title: "Networks", progressPct: 0, icon: "◎" }
  ];

  const showCourses = (mine.courses?.length ? mine.courses.slice(0, 4) : fallbackCourses)
    .map((c, i) => ({ ...c, icon: c.icon || fallbackCourses[i]?.icon || "▦" }));

  const grid = document.querySelector("#courseGrid");
  if (grid) {
    grid.innerHTML = "";
    for (const c of showCourses) {
      const pct = c.progressPct ?? 0;
      const el = document.createElement("div");
      el.className = "course";
      el.innerHTML = `
        <div class="cIcon">${c.icon}</div>
        <div class="cName">
          <b>${escapeHTML(c.title)}</b>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>
        <div class="pct">${pct}%</div>
      `;
      grid.appendChild(el);
    }
  }

  // ---- Tasks (fallback if endpoint not implemented yet) ----
  const taskMine = await safeGet("/tasks/mine", { tasks: [], doneCount: 0, totalCount: 0 });

  const tasksSummary = document.querySelector("#tasksSummary");
  const tasksSubtitle = document.querySelector("#tasksSubtitle");
  if (tasksSummary) tasksSummary.textContent = `${taskMine.doneCount || 0} / ${taskMine.totalCount || 0}`;
  if (tasksSubtitle) tasksSubtitle.textContent = taskMine.totalCount ? "Your tasks are ready." : "Choose tasks to get started.";

  const fallbackTasks = [
    { id:"f1", title:"Welcome Guide: Explore the Platform", courseTitle:"Algorithms", completed:false, fallback:true },
    { id:"f2", title:"Set up your profile and preferences", courseTitle:"Algorithms", completed:false, fallback:true },
    { id:"f3", title:"Explore and add your first course", courseTitle:"Databases", completed:false, fallback:true },
    { id:"f4", title:"Getting Started", courseTitle:"Databases", completed:false, fallback:true }
  ];
  const showTasks = taskMine.tasks?.length ? taskMine.tasks : fallbackTasks;

  const taskList = document.querySelector("#taskList");
  if (taskList) {
    taskList.innerHTML = "";
    for (const t of showTasks) {
      const el = document.createElement("div");
      el.className = "item";
      el.innerHTML = `
        <input type="checkbox" ${t.completed ? "checked":""} ${t.fallback ? "disabled":""}/>
        <div>
          <b>${escapeHTML(t.title)}</b>
          <small>Cours : ${escapeHTML(t.courseTitle || "—")}</small>
        </div>
        <span class="badge">${t.fallback ? "New" : (t.completed ? "Done" : "Task")}</span>
      `;
      taskList.appendChild(el);
    }
  }

  // ---- Papers + Books (fallback if endpoints not implemented yet) ----
  const papersRes = await safeGet("/papers", { papers: [] });
  const booksRes  = await safeGet("/books", { books: [] });

  const papersWrap = document.querySelector("#papersWrap");
  if (papersWrap) {
    papersWrap.innerHTML = "";
    if (!papersRes.papers.length) {
      papersWrap.innerHTML = `<div class="muted">No papers uploaded yet.</div>`;
    } else {
      papersRes.papers.slice(0, 4).forEach(p => {
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `
          <div>
            <b>${escapeHTML(p.title)}</b>
            <small>${escapeHTML(p.course?.title || "—")} • ${p.year || "?"} • ${escapeHTML(p.language || "—")}</small>
          </div>
          ${p.fileUrl ? `<a class="badge" target="_blank" href="${API_BASE}${p.fileUrl}">⬇</a>` : `<span class="badge">—</span>`}
        `;
        papersWrap.appendChild(el);
      });
    }
  }

  const booksWrap = document.querySelector("#booksWrap");
  if (booksWrap) {
    booksWrap.innerHTML = "";
    if (!booksRes.books.length) {
      booksWrap.innerHTML = `<div class="muted">No books listed yet.</div>`;
    } else {
      booksRes.books.slice(0, 4).forEach(b => {
        const price = `${(b.priceCents/100).toFixed(2)} ${b.currency}`;
        const el = document.createElement("div");
        el.className = "item";
        el.innerHTML = `
          <div>
            <b>${escapeHTML(b.title)}</b>
            <small>${escapeHTML(b.author || "—")} • ${escapeHTML(b.course?.title || "—")}</small>
          </div>
          <span class="badge">${escapeHTML(price)}</span>
        `;
        booksWrap.appendChild(el);
      });
    }
  }

  // ---- Logout (JWT = client-side) ----
  const logoutBtn = document.querySelector("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
      window.location.href = "../login/login.html";
    });
  }

  // ---- AI assistant (fallback if endpoint not implemented yet) ----
  addMsg("assistant", `Hello ${user.username}! How can I help you today?`);

  document.querySelectorAll("[data-quick]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const prompt = btn.getAttribute("data-quick");
      addMsg("user", prompt);

      try {
        const { reply } = await api("/ai/chat", { method:"POST", body: { message: prompt } });
        addMsg("assistant", reply);
      } catch {
        addMsg("assistant", "AI endpoint not available yet on the server.");
      }
    });
  });

  const chatForm = document.querySelector("#chatForm");
  if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.querySelector("#chatInput");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";

      addMsg("user", text);
      try {
        const { reply } = await api("/ai/chat", { method:"POST", body: { message: text } });
        addMsg("assistant", reply);
      } catch {
        addMsg("assistant", "AI endpoint not available yet on the server.");
      }
    });
  }
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