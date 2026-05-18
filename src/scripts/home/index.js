import { initHomeFaqAccordion } from "./faq-accordion.js";
import { initGoblinBehaviorCards } from "./goblin-cards.js";
import { initReactionCarousel } from "./reaction-carousel.js";

export function initHomePage() {
  initReactionCarousel();
  initGoblinBehaviorCards();
  initHomeFaqAccordion();
}
