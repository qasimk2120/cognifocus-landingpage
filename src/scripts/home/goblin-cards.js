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

  const carousel = document.querySelector("[data-goblin-carousel]");
  const previousButton = document.querySelector("[data-goblin-carousel-prev]");
  const nextButton = document.querySelector("[data-goblin-carousel-next]");
  const dots = Array.from(document.querySelectorAll("[data-goblin-carousel-dot]"));

  if (!carousel || !previousButton || !nextButton) return;

  const cardList = Array.from(cards);
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const mobileCarouselQuery = window.matchMedia("(max-width: 767.98px)");
  const autoScrollDelay = 3200;
  let autoScrollTimer = null;
  let resumeAutoScrollTimer = null;
  let isPointerActive = false;
  let isCarouselVisible = false;

  const controls = previousButton.closest(".goblin-cards-carousel-controls");
  const section = carousel.closest("section") || carousel;
  controls?.style.setProperty(
    "--goblin-carousel-progress-duration",
    `${autoScrollDelay}ms`,
  );

  function getActiveIndex() {
    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;

    return cardList.reduce((closestIndex, card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const closestCard = cardList[closestIndex];
      const closestCenter =
        closestCard.offsetLeft + closestCard.offsetWidth / 2;

      return Math.abs(cardCenter - carouselCenter) <
        Math.abs(closestCenter - carouselCenter)
        ? index
        : closestIndex;
    }, 0);
  }

  function scrollToCard(index) {
    const targetCard =
      cardList[Math.max(0, Math.min(index, cardList.length - 1))];
    if (!targetCard) return;

    const left =
      targetCard.offsetLeft -
      (carousel.clientWidth - targetCard.offsetWidth) / 2;

    carousel.scrollTo({
      left,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
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
      cardList.length < 2
    ) {
      return;
    }

    autoScrollTimer = window.setInterval(() => {
      if (isPointerActive) return;

      const nextIndex = (getActiveIndex() + 1) % cardList.length;
      scrollToCard(nextIndex);
    }, autoScrollDelay);
    controls?.classList.add("is-autoplaying");
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

  function syncCarouselState() {
    const activeIndex = getActiveIndex();

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === cardList.length - 1;

    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
      dot.setAttribute("aria-label", `Show distraction reaction ${index + 1}`);
    });
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
      scrollToCard(Number(dot.dataset.goblinCarouselDot || 0));
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
      { rootMargin: "0px 0px -18% 0px", threshold: 0.28 },
    );

    visibilityObserver.observe(section);
  } else {
    isCarouselVisible = true;
    startAutoScroll();
  }
}
