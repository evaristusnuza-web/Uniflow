import { api, initials, logout, me } from "../shared/api.js";
import { setupMobileMenu } from "../shared/menu.js";

setupMobileMenu();
const byId = (id) => document.getElementById(id);
let availableTasks = [];

function showError(message = "") {
  const element = byId("pageError");
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

function setHeader(user) {
  byId("username").textContent = user.username;
  byId("major").textContent = user.major || "Major not set";
  byId("avatar").textContent = initials(user.username);
  const adminLink = byId("adminLink");
  if (adminLink) adminLink.style.display = user.role === "ADMIN" ? "block" : "none";
}

function renderChoices(tasks, selectedIds) {
  const list = byId("tasksList");
  list.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement("p");
    empty.className = "muted empty-state";
    empty.textContent = "No tasks are available yet. An administrator can add tasks to the catalog.";
    list.append(empty);
    return;
  }
  for (const task of tasks) {
    const label = document.createElement("label");
    label.className = "item pick";
    label.dataset.search = `${task.title} ${task.course?.title || ""} ${task.description || ""}`.toLowerCase();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = task.id;
    checkbox.checked = selectedIds.has(task.id);
    checkbox.setAttribute("aria-label", `Select ${task.title}`);
    const copy = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = task.title;
    const description = document.createElement("small");
    description.className = "muted";
    description.textContent = task.course?.title || task.description || "General study task";
    copy.append(title, description);
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = task.isDefault ? "Suggested" : "Task";
    label.append(checkbox, copy, badge);
    list.append(label);
  }
}

function renderMine(summary) {
  const list = byId("mineList");
  list.replaceChildren();
  const tasks = summary.tasks || [];
  const doneCount = Number(summary.doneCount) || 0;
  byId("taskCount").textContent = `${doneCount} / ${tasks.length} complete`;

  if (!tasks.length) {
    const empty = document.createElement("p");
    empty.className = "muted empty-state";
    empty.textContent = "No tasks selected. Choose tasks above to create your checklist.";
    list.append(empty);
    return;
  }

  for (const task of tasks) {
    const label = document.createElement("label");
    label.className = "item mine-task";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.setAttribute("aria-label", `Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`);
    const copy = document.createElement("span");
    copy.className = "task-copy";
    const title = document.createElement("b");
    title.textContent = task.title;
    const course = document.createElement("small");
    course.textContent = task.courseTitle || "General study task";
    copy.append(title, course);
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = task.completed ? "Done" : "To do";
    label.append(checkbox, copy, badge);
    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;
      try {
        const updated = await api("/tasks/complete", {
          method: "POST",
          body: { taskId: task.id, completed: checkbox.checked },
        });
        renderMine(updated);
        showError();
      } catch (error) {
        checkbox.checked = !checkbox.checked;
        showError(error.message || "Could not update this task.");
        checkbox.disabled = false;
      }
    });
    list.append(label);
  }
}

async function load() {
  try {
    const { user } = await me();
    setHeader(user);
    const [catalog, mine] = await Promise.all([api("/tasks"), api("/tasks/mine")]);
    availableTasks = catalog.tasks || [];
    renderChoices(availableTasks, new Set((mine.tasks || []).map((task) => task.id)));
    renderMine(mine);

    byId("logoutBtn")?.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
      window.location.replace("../login/login.html");
    });

    byId("saveBtn").addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const output = byId("out");
      button.disabled = true;
      output.textContent = "";
      try {
        const taskIds = [...byId("tasksList").querySelectorAll('input[type="checkbox"]:checked')]
          .map((input) => input.value);
        const updated = await api("/tasks/select", {
          method: "POST",
          body: { taskIds },
        });
        renderChoices(availableTasks, new Set((updated.tasks || []).map((task) => task.id)));
        renderMine(updated);
        output.textContent = taskIds.length ? "Your task selection has been saved." : "Your checklist has been cleared.";
        showError();
      } catch (error) {
        showError(error.message || "Could not save your task selection.");
      } finally {
        button.disabled = false;
      }
    });

    byId("taskSearch").addEventListener("input", (event) => {
      const query = event.currentTarget.value.trim().toLowerCase();
      byId("tasksList").querySelectorAll("[data-search]").forEach((item) => {
        item.hidden = Boolean(query) && !item.dataset.search.includes(query);
      });
    });
  } catch (error) {
    showError(error.message || "Could not load tasks.");
    if (!localStorage.getItem("uniflow_token") && !sessionStorage.getItem("uniflow_token")) {
      window.location.replace("../login/login.html");
    }
  }
}

load();
