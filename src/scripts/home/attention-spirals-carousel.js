export function initAttentionSpiralsCarousel() {
  const carousel = document.querySelector("[data-attention-spirals-carousel]");
  if (!carousel) return;

  const cards = Array.from(carousel.querySelectorAll(".attention-spiral-card"));
  const dots = Array.from(carousel.querySelectorAll("[data-attention-spirals-dot]"));
  const previousButton = document.querySelector("[data-attention-spirals-prev]");
  const nextButton = document.querySelector("[data-attention-spirals-next]");

  if (!previousButton || !nextButton || cards.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const mobileCarouselQuery = window.matchMedia("(max-width: 767.98px)");
  const autoScrollDelay = 3400;
  let autoScrollTimer = null;
  let resumeAutoScrollTimer = null;
  let isPointerActive = false;

  function getActiveIndex() {
    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;

    return cards.reduce((closestIndex, card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const closestCard = cards[closestIndex];
      const closestCenter = closestCard.offsetLeft + closestCard.offsetWidth / 2;

      return Math.abs(cardCenter - carouselCenter) <
        Math.abs(closestCenter - carouselCenter)
        ? index
        : closestIndex;
    }, 0);
  }

  function scrollToCard(index) {
    const targetCard = cards[Math.max(0, Math.min(index, cards.length - 1))];
    if (!targetCard) return;

    const left =
      targetCard.offsetLeft -
      (carousel.clientWidth - targetCard.offsetWidth) / 2;

    carousel.scrollTo({
      left,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function syncCarouselState() {
    const activeIndex = getActiveIndex();

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === cards.length - 1;

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
      dot.setAttribute(
        "aria-label",
        `Show attention spiral ${index + 1}`,
      );
    });
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      window.clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  function startAutoScroll() {
    if (
      prefersReducedMotion ||
      !mobileCarouselQuery.matches ||
      autoScrollTimer ||
      cards.length < 2
    ) {
      return;
    }

    autoScrollTimer = window.setInterval(() => {
      if (isPointerActive) return;

      const nextIndex = (getActiveIndex() + 1) % cards.length;
      scrollToCard(nextIndex);
    }, autoScrollDelay);
  }

  function pauseAutoScrollForInteraction() {
    stopAutoScroll();

    if (resumeAutoScrollTimer) {
      window.clearTimeout(resumeAutoScrollTimer);
    }

    resumeAutoScrollTimer = window.setTimeout(() => {
      resumeAutoScrollTimer = null;
      startAutoScroll();
    }, autoScrollDelay);
  }

  previousButton.addEventListener("click", () => {
    pauseAutoScrollForInteraction();
    scrollToCard(getActiveIndex() - 1);
  });

  nextButton.addEventListener("click", () => {
    pauseAutoScrollForInteraction();
    scrollToCard(getActiveIndex() + 1);
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      pauseAutoScrollForInteraction();
      scrollToCard(Number(dot.dataset.attentionSpiralsDot || 0));
    });
  });

  carousel.addEventListener("pointerdown", () => {
    isPointerActive = true;
    pauseAutoScrollForInteraction();
  });

  carousel.addEventListener("pointerup", () => {
    isPointerActive = false;
  });

  carousel.addEventListener("pointercancel", () => {
    isPointerActive = false;
  });

  carousel.addEventListener("touchstart", pauseAutoScrollForInteraction, {
    passive: true,
  });

  carousel.addEventListener("focusin", pauseAutoScrollForInteraction);

  carousel.addEventListener("scroll", () => {
    window.requestAnimationFrame(syncCarouselState);
  });

  window.addEventListener("resize", syncCarouselState);
  mobileCarouselQuery.addEventListener("change", () => {
    stopAutoScroll();
    startAutoScroll();
  });

  syncCarouselState();
  startAutoScroll();
}