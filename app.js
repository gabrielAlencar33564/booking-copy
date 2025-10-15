(function () {
  const c = window.HEAD;
  document.title = c.pageTitle;
  const bind = (k, v) => {
    const el = document.querySelector(`[data-bind="${k}"]`);
    if (el) el.textContent = v;
  };
  bind("pageTitle", c.pageTitle);
  bind("hotelName", c.hotelName);
  bind("address", c.address);

  // abas só marcam visualmente
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    });
  });
})();
