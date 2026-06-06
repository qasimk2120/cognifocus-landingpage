export function initAttentionSpiralsCarousel() {
  const carousel = document.querySelector("[data-attention-spirals-carousel]");
  if (!carousel) return;

  const cards = Array.from(carousel.querySelectorAll(".attention-spiral-card"));
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
  let scrollRafId = null;
  let programmaticScrollTimer = null;
  let activeIndex = 0;
  let isCarouselVisible = false;

  const controls = previousButton.closest(".attention-spirals-carousel-controls");
  const dots = Array.from(
    controls?.querySelectorAll("[data-attention-spirals-dot]") ??
      document.querySelectorAll("[data-attention-spirals-dot]"),
  );
  const section = carousel.closest("section") || carousel;
  controls?.style.setProperty(
    "--attention-spirals-progress-duration",
    `${autoScrollDelay}ms`,
  );

  function restartActiveProgressFill() {
    const activeDot = dots[activeIndex];
    if (!activeDot || !controls?.classList.contains("is-autoplaying")) return;

    activeDot.classList.remove("is-progressing");
    activeDot.offsetWidth;
    activeDot.classList.add("is-progressing");
  }

  function getActiveIndex() {
    // Use offsetLeft relative to the scroll container by subtracting carousel.offsetLeft
    const carouselOrigin = carousel.offsetLeft;
    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;

    return cards.reduce((closestIndex, card, index) => {
      const cardCenter = (card.offsetLeft - carouselOrigin) + card.offsetWidth / 2;
      const closestCard = cards[closestIndex];
      const closestCenter = (closestCard.offsetLeft - carouselOrigin) + closestCard.offsetWidth / 2;

      return Math.abs(cardCenter - carouselCenter) <
        Math.abs(closestCenter - carouselCenter)
        ? index
        : closestIndex;
    }, 0);
  }

  function setActiveIndex(index) {
    const nextActiveIndex = Math.max(0, Math.min(index, cards.length - 1));
    const didChange = nextActiveIndex !== activeIndex;
    activeIndex = nextActiveIndex;

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === cards.length - 1;

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle("is-active", isActive);
      if (!isActive) dot.classList.remove("is-progressing");
      dot.setAttribute("aria-current", isActive ? "true" : "false");
      dot.setAttribute(
        "aria-label",
        `Show attention spiral ${dotIndex + 1}`,
      );
    });

    if (didChange) restartActiveProgressFill();
  }

  function scrollToCard(index) {
    const targetIndex = Math.max(0, Math.min(index, cards.length - 1));
    const targetCard = cards[targetIndex];
    if (!targetCard) return;

    // offsetLeft is relative to offsetParent (may be higher than carousel).
    // Subtract carousel.offsetLeft so the value is relative to the scroll container.
    const left =
      targetCard.offsetLeft -
      carousel.offsetLeft -
      (carousel.clientWidth - targetCard.offsetWidth) / 2;

    setActiveIndex(targetIndex);

    if (programmaticScrollTimer) {
      window.clearTimeout(programmaticScrollTimer);
    }
    programmaticScrollTimer = window.setTimeout(() => {
      programmaticScrollTimer = null;
      setActiveIndex(getActiveIndex());
    }, 720);

    carousel.scrollTo({
      left,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function syncCarouselState() {
    setActiveIndex(getActiveIndex());
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      window.clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
    controls?.classList.remove("is-autoplaying");
  }

  function startAutoScroll() {
    if (
      prefersReducedMotion ||
      !mobileCarouselQuery.matches ||
      !isCarouselVisible ||
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
    controls?.classList.add("is-autoplaying");
    restartActiveProgressFill();
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

  // Safety reset — prevents isPointerActive sticking true if pointerup missed
  carousel.addEventListener("pointerleave", () => {
    isPointerActive = false;
  });

  carousel.addEventListener("touchstart", pauseAutoScrollForInteraction, {
    passive: true,
  });

  carousel.addEventListener("focusin", pauseAutoScrollForInteraction);

  carousel.addEventListener("scroll", () => {
    if (programmaticScrollTimer || scrollRafId) return;

    scrollRafId = window.requestAnimationFrame(() => {
      scrollRafId = null;
      syncCarouselState();
    });
  });

  window.addEventListener("resize", syncCarouselState);
  mobileCarouselQuery.addEventListener("change", () => {
    stopAutoScroll();
    startAutoScroll();
  });

  syncCarouselState();

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isCarouselVisible = entry.isIntersecting;
        if (isCarouselVisible) {
          syncCarouselState();
          startAutoScroll();
        } else {
          stopAutoScroll();
        }
      },
      { rootMargin: "0px", threshold: 0.1 },
    );

    visibilityObserver.observe(section);
  } else {
    isCarouselVisible = true;
    startAutoScroll();
  }
}
