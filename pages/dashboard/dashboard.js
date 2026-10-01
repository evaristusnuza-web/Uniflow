import { api, downloadFile, initials, logout, me } from "../shared/api.js";
import { setupMobileMenu } from "../shared/menu.js";

setupMobileMenu();

const byId = (id) => document.getElementById(id);
const dashboardError = byId("dashboardError");

function setRing(progress) {
  const value = Math.min(100, Math.max(0, Math.round(Number(progress) || 0)));
  const ring = byId("ring");
  const label = byId("ringText");
  if (!ring || !label) return;
  ring.style.setProperty("--p", String(value));
  label.textContent = `${value}%`;
  ring.setAttribute("aria-label", `Overall course progress: ${value}%`);
}

function addMessage(role, text) {
  const log = byId("chatLog");
  if (!log) return;
  const item = document.createElement("div");
  item.className = `msg ${role}`;
  item.textContent = text;
  log.append(item);
  log.scrollTop = log.scrollHeight;
}

function setPageError(message = "") {
  if (!dashboardError) return;
  dashboardError.textContent = message;
  dashboardError.hidden = !message;
}

function renderCourses(courses) {
  const grid = byId("courseGrid");
  if (!grid) return;
  grid.replaceChildren();
  if (!courses.length) {
    const empty = document.createElement("p");
    empty.className = "muted empty-state";
    empty.textContent = "You have not selected any courses yet.";
    const link = document.createElement("a");
    link.className = "btn ghost";
    link.href = "../courses/courses.html";
    link.textContent = "Browse courses";
    grid.append(empty, link);
    return;
  }

  for (const course of courses.slice(0, 4)) {
    const progress = Math.min(100, Math.max(0, Number(course.progressPct) || 0));
    const card = document.createElement("article");
    card.className = "course";
    card.dataset.search = `${course.title} ${course.slug || ""}`.toLowerCase();

    const icon = document.createElement("span");
    icon.className = "cIcon";
    icon.textContent = course.icon || "▦";

    const content = document.createElement("div");
    content.className = "cName";
    const title = document.createElement("b");
    title.textContent = course.title;
    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("i");
    fill.style.width = `${progress}%`;
    fill.setAttribute("aria-hidden", "true");
    bar.append(fill);
    content.append(title, bar);

    const percent = document.createElement("span");
    percent.className = "pct";
    percent.textContent = `${progress}%`;
    card.append(icon, content, percent);
    grid.append(card);
  }
}

function renderTasks(tasks) {
  const list = byId("taskList");
  if (!list) return;
  list.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement("p");
    empty.className = "muted empty-state";
    empty.textContent = "Your checklist is empty. Choose a few tasks to get started.";
    list.append(empty);
    return;
  }

  for (const task of tasks.slice(0, 5)) {
    const row = document.createElement("label");
    row.className = "item dashboard-task";
    row.dataset.search = `${task.title} ${task.courseTitle || ""}`.toLowerCase();

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute("aria-label", `Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`);
    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      try {
        const updated = await api("/tasks/complete", {
          method: "POST",
          body: { taskId: task.id, completed: checkbox.checked },
        });
        updateTaskSummary(updated);
      } catch (error) {
        checkbox.checked = !checkbox.checked;
        setPageError(error.message);
      } finally {
        checkbox.disabled = false;
      }
    });

    const content = document.createElement("span");
    content.className = "dashboard-task-copy";
    const title = document.createElement("b");
    title.textContent = task.title;
    const subtitle = document.createElement("small");
    subtitle.textContent = task.courseTitle || "General study task";
    content.append(title, subtitle);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = task.completed ? "Done" : "To do";
    row.append(checkbox, content, badge);
    list.append(row);
  }
}

function updateTaskSummary(summary) {
  const tasks = summary.tasks || [];
  const done = Number(summary.doneCount) || 0;
  const total = Number(summary.totalCount) || tasks.length;
  const badge = byId("tasksSummary");
  const subtitle = byId("tasksSubtitle");
  if (badge) badge.textContent = `${done} / ${total}`;
  if (subtitle) subtitle.textContent = total
    ? `${total - done} task${total - done === 1 ? "" : "s"} left to complete.`
    : "Choose tasks to get started.";
  renderTasks(tasks);
}

function renderLibrary(papers, books) {
  const papersWrap = byId("papersWrap");
  if (papersWrap) {
    papersWrap.replaceChildren();
    if (!papers.length) {
      const empty = document.createElement("p");
      empty.className = "muted empty-state";
      empty.textContent = "No papers have been added yet.";
      papersWrap.append(empty);
    }
    for (const paper of papers.slice(0, 4)) {
      const row = document.createElement("div");
      row.className = "item library-item";
      row.dataset.search = `${paper.title} ${paper.course?.title || ""}`.toLowerCase();
      const details = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = paper.title;
      const meta = document.createElement("small");
      meta.textContent = [paper.course?.title, paper.year, paper.language].filter(Boolean).join(" · ") || "Study paper";
      details.append(title, meta);
      const link = document.createElement("a");
      link.className = "badge";
      link.href = "#";
      link.textContent = "Download PDF";
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        link.setAttribute("aria-busy", "true");
        try {
          const fileName = `${paper.title}.pdf`;
          await downloadFile(paper.fileUrl, fileName);
        } catch (error) {
          setPageError(error.message || "Could not download this paper.");
        } finally {
          link.removeAttribute("aria-busy");
        }
      });
      row.append(details, link);
      papersWrap.append(row);
    }
  }

  const booksWrap = byId("booksWrap");
  if (booksWrap) {
    booksWrap.replaceChildren();
    if (!books.length) {
      const empty = document.createElement("p");
      empty.className = "muted empty-state";
      empty.textContent = "No books have been listed yet.";
      booksWrap.append(empty);
    }
    for (const book of books.slice(0, 4)) {
      const row = document.createElement("div");
      row.className = "item library-item";
      row.dataset.search = `${book.title} ${book.author || ""} ${book.course?.title || ""}`.toLowerCase();
      const details = document.createElement("div");
      const title = document.createElement("b");
      title.textContent = book.title;
      const meta = document.createElement("small");
      meta.textContent = [book.author, book.course?.title].filter(Boolean).join(" · ") || "Book";
      details.append(title, meta);
      const price = document.createElement("span");
      price.className = "badge";
      price.textContent = `${((Number(book.priceCents) || 0) / 100).toFixed(2)} ${book.currency || "USD"}`;
      row.append(details, price);
      booksWrap.append(row);
    }
  }
}

function setupSearch() {
  const input = byId("dashboardSearch");
  if (!input) return;
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    document.querySelectorAll("#courseGrid [data-search], #taskList [data-search], #papersWrap [data-search], #booksWrap [data-search]")
      .forEach((item) => {
        item.hidden = Boolean(query) && !item.dataset.search.includes(query);
      });
  });
}

async function sendAssistantMessage(question) {
  const value = question.trim();
  if (!value) return;
  setPageError();
  addMessage("user", value);
  try {
    const result = await api("/assistant/chat", {
      method: "POST",
      body: { question: value },
    });
    addMessage("assistant", result.answer || "I could not prepare a study hint just now.");
    if (result.notice && byId("aiHint")) byId("aiHint").textContent = result.notice;
  } catch (error) {
    addMessage("assistant", error.message || "The study assistant is unavailable right now.");
  }
}

async function loadDashboard() {
  try {
    const { user } = await me();
    byId("username").textContent = user.username;
    byId("major").textContent = user.major || "Major not set";
    byId("avatar").textContent = initials(user.username);
    byId("welcome").textContent = `Welcome, ${user.username}`;

    const adminLink = byId("adminLink");
    if (adminLink) adminLink.style.display = user.role === "ADMIN" ? "block" : "none";

    const [courseSummary, taskSummary, papersResult, booksResult] = await Promise.all([
      api("/courses/mine"),
      api("/tasks/mine"),
      api("/papers"),
      api("/books"),
    ]);

    const globalProgress = Number(courseSummary.globalProgress) || 0;
    setRing(globalProgress);
    byId("level").textContent = `Level ${Math.floor(globalProgress / 20)}`;
    byId("levelSubtitle").textContent = user.major || "Choose a course to build your path";
    renderCourses(courseSummary.courses || []);
    updateTaskSummary(taskSummary);
    renderLibrary(papersResult.papers || [], booksResult.books || []);

    const logoutButton = byId("logoutBtn");
    logoutButton?.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
      window.location.replace("../login/login.html");
    });

    const chatForm = byId("chatForm");
    const chatInput = byId("chatInput");
    chatForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = chatForm.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      await sendAssistantMessage(chatInput?.value || "");
      if (chatInput) chatInput.value = "";
      if (submit) submit.disabled = false;
    });
    document.querySelectorAll("[data-quick]").forEach((button) => {
      button.addEventListener("click", () => {
        const question = button.getAttribute("data-quick") || "";
        if (chatInput) chatInput.value = question;
        void sendAssistantMessage(question);
      });
    });
    if (byId("aiHint")) {
      byId("aiHint").textContent = "Guided study prompts are generated locally; this is not a live AI service.";
    }
    addMessage("assistant", `Hi ${user.username}. Tell me what you are studying and I will suggest a practice approach.`);
    setupSearch();
  } catch (error) {
    if (!localStorage.getItem("uniflow_token") && !sessionStorage.getItem("uniflow_token")) {
      window.location.replace("../login/login.html");
      return;
    }
    setPageError(error.message || "Could not load the dashboard. Please try again.");
  }
}

loadDashboard();
