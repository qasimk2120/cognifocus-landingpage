export function hydrateReleaseToggle(card) {
  const toggleBtn = card.querySelector(".release-toggle-btn");
  const details = card.querySelector(".release-details");

  if (!toggleBtn || !details || toggleBtn.dataset.hydrated === "true") return;

  toggleBtn.dataset.hydrated = "true";
  toggleBtn.addEventListener("click", () => {
    const willOpen = details.hasAttribute("hidden");
    details.toggleAttribute("hidden", !willOpen);
    details.classList.toggle("is-open", willOpen);
    toggleBtn.classList.toggle("is-open", willOpen);
    toggleBtn.setAttribute("aria-expanded", String(willOpen));
    toggleBtn.textContent = willOpen
      ? "Hide detailed notes"
      : "Read detailed notes";
  });
}

export function hydrateStaticReleaseCards() {
  document
    .querySelectorAll(".release-card, .release-card-compact")
    .forEach(hydrateReleaseToggle);
}
