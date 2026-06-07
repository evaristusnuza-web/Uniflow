export function setupMobileMenu() {
  const btn = document.getElementById("menuBtn");
  const overlay = document.getElementById("overlay");
  const sidebar = document.querySelector(".sidebar");

  if (!btn || !overlay || !sidebar) return;

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

  // Close when clicking a nav link
  document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", close));

  // Close on ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}