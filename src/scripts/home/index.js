import { initHomeFaqAccordion } from "./faq-accordion.js";
import { initGoblinBehaviorCards } from "./goblin-cards.js";
import { initReactionCarousel } from "./reaction-carousel.js";
import { initRotatingHeroSubheadline } from "./rotating-subheadline.js";

export function initHomePage() {
  initRotatingHeroSubheadline();
  initReactionCarousel();
  initGoblinBehaviorCards();
  initHomeFaqAccordion();
}
