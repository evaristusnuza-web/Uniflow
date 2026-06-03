import { api, API_BASE, escapeHTML, initials } from "../../shared/api.js";

async function requireAdmin() {
  const me = await api("/me").catch(() => null);
  if (!me) { window.location.href = "../login/login.html"; throw new Error("Not logged in"); }
  if (me.user.role !== "ADMIN") {
    document.body.innerHTML = `<div style="padding:24px;font-family:system-ui">
      <h2>Forbidden</h2><p>You are not an admin.</p>
      <a href="../dashboard/index.html">Back</a>
    </div>`;
    throw new Error("Not admin");
  }
  return me.user;
}

async function loadCoursesInto(ids) {
  const { courses } = await api("/courses");
  for (const selId of ids) {
    const sel = document.querySelector(selId);
    sel.innerHTML = `<option value="">—</option>` + courses.map(c =>
      `<option value="${c.id}">${escapeHTML(c.title)}</option>`
    ).join("");
  }
}

async function refreshPreview() {
  const [{ papers }, { books }] = await Promise.all([api("/papers"), api("/books")]);

  const papersList = document.querySelector("#papersList");
  papersList.innerHTML = papers.length ? papers.map(p => `
    <div class="item">
      <div>
        <b>${escapeHTML(p.title)}</b>
        <small>${escapeHTML(p.course?.title || "—")} • ${p.year || "?"} • ${escapeHTML(p.language || "—")}</small>
      </div>
      ${p.fileUrl ? `<a class="badge" target="_blank" href="${API_BASE}${p.fileUrl}">⬇</a>` : `<span class="badge">—</span>`}
    </div>
  `).join("") : `<div class="muted">No papers yet.</div>`;

  const booksList = document.querySelector("#booksList");
  booksList.innerHTML = books.length ? books.map(b => `
    <div class="item">
      <div>
        <b>${escapeHTML(b.title)}</b>
        <small>${escapeHTML(b.author || "—")} • ${escapeHTML(b.course?.title || "—")}</small>
      </div>
      <span class="badge">${(b.priceCents/100).toFixed(2)} ${escapeHTML(b.currency)}</span>
    </div>
  `).join("") : `<div class="muted">No books yet.</div>`;
}

async function boot() {
  const user = await requireAdmin();

  document.querySelector("#username").textContent = user.username;
  document.querySelector("#major").textContent = user.major || "Admin";
  document.querySelector("#avatar").textContent = initials(user.username);

  // show admin nav item
  document.querySelector("#adminLink").style.display = "block";

  // logout
  document.querySelector("#logoutBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    await api("/auth/logout", { method:"POST" });
    window.location.href = "../login/login.html";
  });

  await loadCoursesInto(["#taskCourse", "#paperCourse", "#bookCourse"]);
  await refreshPreview();

  document.querySelector("#refreshBtn").onclick = refreshPreview;

  // create course
  courseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    courseOut.textContent = "";
    const body = Object.fromEntries(new FormData(e.target).entries());
    try {
      await api("/admin/courses", { method:"POST", body });
      courseOut.textContent = "Course created.";
      e.target.reset();
      await loadCoursesInto(["#taskCourse", "#paperCourse", "#bookCourse"]);
    } catch (err) { courseOut.textContent = err.message; }
  });

  // create task
  taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    taskOut.textContent = "";
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.isDefault = e.target.querySelector("[name=isDefault]").checked;
    if (!body.courseId) delete body.courseId;

    try {
      await api("/admin/tasks", { method:"POST", body });
      taskOut.textContent = "Task created.";
      e.target.reset();
    } catch (err) { taskOut.textContent = err.message; }
  });

  // upload paper
  paperForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    paperOut.textContent = "";

    const form = e.target;
    const file = form.querySelector("[name=file]").files[0];
    if (!file) return (paperOut.textContent = "Choose a PDF file.");

    const meta = {
      title: form.title.value,
      year: form.year.value ? Number(form.year.value) : undefined,
      language: form.language.value || undefined,
      courseId: form.courseId.value || undefined
    };

    const fd = new FormData();
    fd.append("file", file);
    fd.append("meta", JSON.stringify(meta));

    try {
      await api("/admin/papers/upload", { method:"POST", body: fd });
      paperOut.textContent = "Uploaded.";
      form.reset();
      await refreshPreview();
    } catch (err) { paperOut.textContent = err.message; }
  });

  // create book
  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    bookOut.textContent = "";
    const body = Object.fromEntries(new FormData(e.target).entries());
    body.priceCents = body.priceCents ? Number(body.priceCents) : 0;
    if (!body.courseId) delete body.courseId;
    if (!body.author) delete body.author;
    if (!body.coverUrl) delete body.coverUrl;

    try {
      await api("/admin/books", { method:"POST", body });
      bookOut.textContent = "Book created.";
      e.target.reset();
      await refreshPreview();
    } catch (err) { bookOut.textContent = err.message; }
  });
}

boot();