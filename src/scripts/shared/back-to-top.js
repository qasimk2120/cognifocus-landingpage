export function initBackToTopArrow() {
  if (document.querySelector(".back-to-top-arrow")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top-arrow";
  button.setAttribute("aria-label", "Back to top");
  button.textContent = "\u2191";
  document.body.appendChild(button);

  function toggleVisibility() {
    const shouldShow = window.scrollY > 420;
    button.classList.toggle("is-visible", shouldShow);
  }

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();
}
