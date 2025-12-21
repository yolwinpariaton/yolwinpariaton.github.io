(function () {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("navMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", function (e) {
      const id = this.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (menu && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
})();
