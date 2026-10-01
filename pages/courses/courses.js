import { api, initials, logout, me } from "../shared/api.js";
import { setupMobileMenu } from "../shared/menu.js";

setupMobileMenu();
const byId = (id) => document.getElementById(id);
let allCourses = [];

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

function renderCourseChoices(courses, selectedIds) {
  const list = byId("coursesList");
  list.replaceChildren();
  if (!courses.length) {
    const empty = document.createElement("p");
    empty.className = "muted empty-state";
    empty.textContent = "No courses are available yet. Please check back later.";
    list.append(empty);
    return;
  }

  for (const course of courses) {
    const label = document.createElement("label");
    label.className = "item pick";
    label.dataset.search = `${course.title} ${course.slug} ${course.description || ""}`.toLowerCase();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = course.id;
    checkbox.checked = selectedIds.has(course.id);
    checkbox.setAttribute("aria-label", `Select ${course.title}`);
    const text = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = course.title;
    const description = document.createElement("small");
    description.className = "muted";
    description.textContent = course.description || course.slug;
    text.append(title, description);
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = course.icon || "Course";
    label.append(checkbox, text, badge);
    list.append(label);
  }
}

async function refreshProgressSelector(courses = null) {
  const currentCourses = courses || (await api("/courses/mine")).courses || [];
  const select = byId("progressCourse");
  select.replaceChildren();
  if (!currentCourses.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Select a course first";
    select.append(option);
    byId("progressPct").value = "0";
    return;
  }

  for (const course of currentCourses) {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.title} (${course.progressPct}%)`;
    option.dataset.progress = String(course.progressPct);
    select.append(option);
  }
  byId("progressPct").value = select.selectedOptions[0]?.dataset.progress || "0";
}

async function load() {
  try {
    const { user } = await me();
    setHeader(user);
    const [catalog, mine] = await Promise.all([api("/courses"), api("/courses/mine")]);
    allCourses = catalog.courses || [];
    const selectedIds = new Set((mine.courses || []).map((course) => course.id));
    renderCourseChoices(allCourses, selectedIds);
    await refreshProgressSelector(mine.courses || []);

    byId("logoutBtn")?.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
      window.location.replace("../login/login.html");
    });

    byId("saveBtn").addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const output = byId("out");
      output.textContent = "";
      button.disabled = true;
      try {
        const courseIds = [...byId("coursesList").querySelectorAll('input[type="checkbox"]:checked')]
          .map((input) => input.value);
        const updated = await api("/courses/select", {
          method: "POST",
          body: { courseIds },
        });
        renderCourseChoices(allCourses, new Set((updated.courses || []).map((course) => course.id)));
        await refreshProgressSelector(updated.courses || []);
        output.textContent = courseIds.length ? "Your course selection has been saved." : "All courses were removed from your learning plan.";
        showError();
      } catch (error) {
        output.textContent = "";
        showError(error.message || "Could not save your course selection.");
      } finally {
        button.disabled = false;
      }
    });

    byId("progressCourse").addEventListener("change", (event) => {
      byId("progressPct").value = event.currentTarget.selectedOptions[0]?.dataset.progress || "0";
    });
    byId("progressForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const output = byId("progressOut");
      output.textContent = "";
      const courseId = byId("progressCourse").value;
      const progressPct = Number(byId("progressPct").value);
      if (!courseId || !Number.isInteger(progressPct) || progressPct < 0 || progressPct > 100) {
        output.textContent = "Choose a selected course and a progress value from 0 to 100.";
        return;
      }
      const button = event.currentTarget.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const updated = await api("/courses/progress", {
          method: "POST",
          body: { courseId, progressPct },
        });
        await refreshProgressSelector(updated.courses || []);
        output.textContent = "Progress updated.";
        showError();
      } catch (error) {
        showError(error.message || "Could not update course progress.");
      } finally {
        button.disabled = false;
      }
    });

    byId("courseSearch").addEventListener("input", (event) => {
      const query = event.currentTarget.value.trim().toLowerCase();
      byId("coursesList").querySelectorAll("[data-search]").forEach((item) => {
        item.hidden = Boolean(query) && !item.dataset.search.includes(query);
      });
    });
  } catch (error) {
    showError(error.message || "Could not load courses.");
    if (!localStorage.getItem("uniflow_token") && !sessionStorage.getItem("uniflow_token")) {
      window.location.replace("../login/login.html");
    }
  }
}

load();
