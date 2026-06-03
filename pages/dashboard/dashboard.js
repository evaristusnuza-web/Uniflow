import { api, escapeHTML, initials, API_BASE } from "../../shared/api.js";
window.location.href = "../login/login.html";

function setRing(pct) {
  const ring = document.querySelector("#ring");
  const ringText = document.querySelector("#ringText");
  ring.style.setProperty("--p", String(pct));
  ringText.textContent = `${pct}%`;
}

function levelFromProgress(pct) {
  return Math.floor((pct || 0) / 20);
}

function addMsg(role, text) {
  const log = document.querySelector("#chatLog");
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

async function load() {
  const { user } = await requireLogin();

  // header + welcome
  document.querySelector("#username").textContent = user.username;
  document.querySelector("#major").textContent = user.major || "Major not set";
  document.querySelector("#avatar").textContent = initials(user.username);
  document.querySelector("#welcome").textContent = `Welcome, ${user.username} 👋`;

  // admin link
  if (user.role === "ADMIN") document.querySelector("#adminLink").style.display = "block";

  // courses + global progress
  let mine = { courses: [], globalProgress: 0 };
  try { mine = await api("/courses/mine"); } catch {}

  const global = mine.globalProgress || 0;
  setRing(global);
  document.querySelector("#level").textContent = `Level ${levelFromProgress(global)}`;
  document.querySelector("#levelSubtitle").textContent = user.major ? user.major : "(Major not set)";

  // courses card
  const fallbackCourses = [
    { title: "Algorithms", progressPct: 0, icon: "</>" },
    { title: "Databases", progressPct: 0, icon: "⛁" },
    { title: "Web Development", progressPct: 0, icon: "⌘" },
    { title: "Networks", progressPct: 0, icon: "◎" }
  ];

  const showCourses = (mine.courses?.length ? mine.courses.slice(0, 4) : fallbackCourses)
    .map((c, i) => ({ ...c, icon: c.icon || fallbackCourses[i]?.icon || "▦" }));

  const grid = document.querySelector("#courseGrid");
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

  // tasks
  let taskMine = { tasks: [], doneCount: 0, totalCount: 0 };
  try { taskMine = await api("/tasks/mine"); } catch {}

  document.querySelector("#tasksSummary").textContent = `${taskMine.doneCount || 0} / ${taskMine.totalCount || 0}`;
  document.querySelector("#tasksSubtitle").textContent = taskMine.totalCount ? "Your tasks are ready." : "Choose tasks to get started.";

  const fallbackTasks = [
    { id:"f1", title:"Welcome Guide: Explore the Platform", courseTitle:"Algorithms", completed:false, fallback:true },
    { id:"f2", title:"Set up your profile and preferences", courseTitle:"Algorithms", completed:false, fallback:true },
    { id:"f3", title:"Explore and add your first course", courseTitle:"Databases", completed:false, fallback:true },
    { id:"f4", title:"Getting Started", courseTitle:"Databases", completed:false, fallback:true }
  ];
  const showTasks = taskMine.tasks?.length ? taskMine.tasks : fallbackTasks;

  const taskList = document.querySelector("#taskList");
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

    if (!t.fallback) {
      el.querySelector("input").addEventListener("change", async (e) => {
        await api("/tasks/complete", { method:"POST", body: { taskId: t.id, completed: e.target.checked } });
        const updated = await api("/tasks/mine");
        document.querySelector("#tasksSummary").textContent = `${updated.doneCount} / ${updated.totalCount}`;
      });
    }
    taskList.appendChild(el);
  }

  // papers + books
  const [papersRes, booksRes] = await Promise.all([api("/papers"), api("/books")]);

  const papersWrap = document.querySelector("#papersWrap");
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

  const booksWrap = document.querySelector("#booksWrap");
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

  // logout
  document.querySelector("#logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await api("/auth/logout", { method:"POST" });
    window.location.href = "../login/login.html";
  });

  // AI
  addMsg("assistant", `Hello ${user.username}! How can I help you today?`);

  document.querySelectorAll("[data-quick]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const prompt = btn.getAttribute("data-quick");
      addMsg("user", prompt);
      const { reply } = await api("/ai/chat", { method:"POST", body: { message: prompt } });
      addMsg("assistant", reply);
    });
  });

  document.querySelector("#chatForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.querySelector("#chatInput");
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";

    addMsg("user", msg);
    try {
      const { reply } = await api("/ai/chat", { method:"POST", body: { message: msg } });
      addMsg("assistant", reply);
      document.querySelector("#aiHint").textContent = "";
    } catch (err) {
      addMsg("assistant", `Error: ${err.message}`);
      document.querySelector("#aiHint").textContent = "If AI fails: set OPENAI_API_KEY on the server.";
    }
  });
}

load();