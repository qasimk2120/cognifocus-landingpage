const ROTATING_HERO_PHRASES = [
  "TikTok during a focus session.",
  "\u201cjust one quick scroll.\u201d",
  "doomscrolling spirals.",
  "fake \u201cquick checks.\u201d",
  "YouTube rabbit holes.",
  "opening Instagram mid-session.",
];

const ROTATION_INTERVAL_MS = 3800;
const FADE_DURATION_MS = 260;

export function initRotatingHeroSubheadline() {
  const ending = document.querySelector("[data-hero-subheadline-ending]");
  const endingText = ending?.querySelector(
    "[data-hero-subheadline-ending-text]",
  );

  if (!ending) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reduceMotion.matches) return;

  let currentIndex = 0;

  window.setInterval(() => {
    currentIndex = (currentIndex + 1) % ROTATING_HERO_PHRASES.length;
    ending.classList.add("is-changing");

    window.setTimeout(() => {
      (endingText || ending).textContent = ROTATING_HERO_PHRASES[currentIndex];
      window.requestAnimationFrame(() => {
        ending.classList.remove("is-changing");
      });
    }, FADE_DURATION_MS);
  }, ROTATION_INTERVAL_MS);
}
