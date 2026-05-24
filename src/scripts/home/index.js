import { initHomeFaqAccordion } from "./faq-accordion.js";
import { initBehaviorCompanion } from "./behavior-companion.js";
import { initAttentionSpiralsCarousel } from "./attention-spirals-carousel.js";
import { initGoblinBehaviorCards } from "./goblin-cards.js";
import { initReactionCarousel } from "./reaction-carousel.js";
import { initRotatingHeroSubheadline } from "./rotating-subheadline.js";
import { initScrollReveal } from "./scroll-reveal.js";

export function initHomePage() {
  initScrollReveal();
  initRotatingHeroSubheadline();
  initReactionCarousel();
  initAttentionSpiralsCarousel();
  initGoblinBehaviorCards();
  initHomeFaqAccordion();
  initBehaviorCompanion();
}
