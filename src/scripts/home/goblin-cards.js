export function initGoblinBehaviorCards() {
  const cards = document.querySelectorAll(".goblin-card");
  if (cards.length === 0) return;

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const isExpanded = card.getAttribute("aria-expanded") === "true";
      card.setAttribute("aria-expanded", String(!isExpanded));
    });

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const isExpanded = card.getAttribute("aria-expanded") === "true";
        card.setAttribute("aria-expanded", String(!isExpanded));
      }
    });
  });
}
