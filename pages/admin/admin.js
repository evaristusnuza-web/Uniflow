import { api, downloadFile, initials, logout, me } from "../shared/api.js";
import { setupMobileMenu } from "../shared/menu.js";

setupMobileMenu();
const byId = (id) => document.getElementById(id);

function setMessage(id, message, state = "") {
  const element = byId(id);
  if (!element) return;
  element.textContent = message;
  element.dataset.state = state;
}

function showPageError(message = "") {
  const element = byId("pageError");
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

async function requireAdmin() {
  const { user } = await me();
  if (user.role !== "ADMIN") {
    document.body.innerHTML = "";
    const main = document.createElement("main");
    main.className = "forbidden card";
    const title = document.createElement("h1");
    title.textContent = "Administrator access required";
    const text = document.createElement("p");
    text.textContent = "Your account does not have permission to manage UniFlow content.";
    const link = document.createElement("a");
    link.href = "../dashboard/index.html";
    link.className = "btn primary";
    link.textContent = "Return to dashboard";
    main.append(title, text, link);
    document.body.append(main);
    throw new Error("Administrator access required.");
  }
  return user;
}

async function loadCoursesInto(selectorIds) {
  const { courses } = await api("/courses");
  for (const selectorId of selectorIds) {
    const select = byId(selectorId);
    const first = select.options[0];
    select.replaceChildren(first || new Option("No course", ""));
    for (const course of courses || []) {
      const option = document.createElement("option");
      option.value = course.id;
      option.textContent = course.title;
      select.append(option);
    }
  }
}

function renderPapers(papers) {
  const list = byId("papersList");
  list.replaceChildren();
  if (!papers.length) {
    const empty = document.createElement("p");
    empty.className = "muted empty-state";
    empty.textContent = "No papers have been uploaded yet.";
    list.append(empty);
    return;
  }
  for (const paper of papers) {
    const row = document.createElement("div");
    row.className = "item library-item";
    const details = document.createElement("div");
    const title = document.createElement("b");
    title.textContent = paper.title;
    const meta = document.createElement("small");
    meta.textContent = [paper.course?.title, paper.year, paper.language].filter(Boolean).join(" · ") || "PDF study paper";
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
        showPageError(error.message || "Could not download this paper.");
      } finally {
        link.removeAttribute("aria-busy");
      }
    });
    row.append(details, link);
    list.append(row);
  }
}

function renderBooks(books) {
  const list = byId("booksList");
  list.replaceChildren();
  if (!books.length) {
    const empty = document.createElement("p");
    empty.className = "muted empty-state";
    empty.textContent = "No book listings yet.";
    list.append(empty);
    return;
  }
  for (const book of books) {
    const row = document.createElement("div");
    row.className = "item library-item";
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
    list.append(row);
  }
}

async function refreshPreview() {
  const [paperResult, bookResult] = await Promise.all([api("/papers"), api("/books")]);
  renderPapers(paperResult.papers || []);
  renderBooks(bookResult.books || []);
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function bindForm(formId, outputId, submit) {
  byId(formId).addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setMessage(outputId, "Saving…");
    try {
      await submit(form);
      form.reset();
      setMessage(outputId, "Saved successfully.", "success");
      showPageError();
    } catch (error) {
      setMessage(outputId, "");
      showPageError(error.message || "The request could not be completed.");
    } finally {
      button.disabled = false;
    }
  });
}

async function boot() {
  try {
    const user = await requireAdmin();
    byId("username").textContent = user.username;
    byId("major").textContent = user.major || "Administrator";
    byId("avatar").textContent = initials(user.username);
    byId("adminLink").style.display = "block";

    byId("logoutBtn").addEventListener("click", (event) => {
      event.preventDefault();
      logout();
      window.location.replace("../login/login.html");
    });

    await loadCoursesInto(["taskCourse", "paperCourse", "bookCourse"]);
    await refreshPreview();
    byId("refreshBtn").addEventListener("click", async () => {
      try {
        await refreshPreview();
        showPageError();
      } catch (error) {
        showPageError(error.message || "Could not refresh the library.");
      }
    });

    bindForm("courseForm", "courseOut", async (form) => {
      const body = formObject(form);
      for (const key of ["description", "icon"]) if (!body[key]) delete body[key];
      await api("/admin/courses", { method: "POST", body });
      await loadCoursesInto(["taskCourse", "paperCourse", "bookCourse"]);
    });

    bindForm("taskForm", "taskOut", async (form) => {
      const body = formObject(form);
      body.isDefault = form.elements.namedItem("isDefault").checked;
      if (!body.courseId) delete body.courseId;
      if (!body.description) delete body.description;
      await api("/admin/tasks", { method: "POST", body });
    });

    bindForm("paperForm", "paperOut", async (form) => {
      const file = form.elements.namedItem("file").files[0];
      if (!file) throw new Error("Choose a PDF file to upload.");
      const metadata = {
        title: form.elements.namedItem("title").value.trim(),
        year: form.elements.namedItem("year").value
          ? Number(form.elements.namedItem("year").value)
          : undefined,
        language: form.elements.namedItem("language").value.trim() || undefined,
        courseId: form.elements.namedItem("courseId").value || undefined,
      };
      const body = new FormData();
      body.append("file", file);
      body.append("meta", JSON.stringify(metadata));
      await api("/admin/papers/upload", { method: "POST", body });
      await refreshPreview();
    });

    bindForm("bookForm", "bookOut", async (form) => {
      const body = formObject(form);
      body.priceCents = body.priceCents ? Number(body.priceCents) : 0;
      body.currency = (body.currency || "USD").trim().toUpperCase();
      for (const key of ["author", "coverUrl", "courseId"]) if (!body[key]) delete body[key];
      await api("/admin/books", { method: "POST", body });
      await refreshPreview();
    });
  } catch (error) {
    if (!localStorage.getItem("uniflow_token") && !sessionStorage.getItem("uniflow_token")) {
      window.location.replace("../login/login.html");
      return;
    }
    if (error.message !== "Administrator access required.") {
      showPageError(error.message || "Could not load the administration panel.");
    }
  }
}

boot();
