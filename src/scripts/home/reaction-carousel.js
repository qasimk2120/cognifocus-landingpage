export function initReactionCarousel() {
  const carousel = document.querySelector("[data-reaction-carousel]");
  if (!carousel) return;

  const slides = Array.from(carousel.querySelectorAll("[data-reaction-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-reaction-dot]"));
  const previousButton = carousel.querySelector("[data-reaction-prev]");
  const nextButton = carousel.querySelector("[data-reaction-next]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (slides.length === 0) return;

  let activeIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.classList.contains("is-active")),
  );
  let autoplayId = null;

  function setActiveSlide(nextIndex) {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function startAutoplay() {
    if (prefersReducedMotion || autoplayId) return;
    autoplayId = window.setInterval(() => {
      setActiveSlide(activeIndex + 1);
    }, 4500);
  }

  function restartAutoplay() {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
    startAutoplay();
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const nextIndex = Number(dot.dataset.reactionDot || 0);
      setActiveSlide(nextIndex);
      restartAutoplay();
    });
  });

  previousButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex - 1);
    restartAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    setActiveSlide(activeIndex + 1);
    restartAutoplay();
  });

  setActiveSlide(activeIndex);
  startAutoplay();
}
