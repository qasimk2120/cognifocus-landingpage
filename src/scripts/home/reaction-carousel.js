export function initReactionCarousel() {
  const carousel = document.querySelector("[data-reaction-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-reaction-track]");
  const viewport = carousel.querySelector(".reaction-carousel-viewport");
  const slides = Array.from(carousel.querySelectorAll("[data-reaction-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-reaction-dot]"));
  const previousButton = carousel.querySelector("[data-reaction-prev]");
  const nextButton = carousel.querySelector("[data-reaction-next]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!track || slides.length === 0) return;

  const desktopQuery = window.matchMedia("(min-width: 768px)");
  let slidesPerPage = desktopQuery.matches ? 2 : 1;
  let pageCount = Math.ceil(slides.length / slidesPerPage);
  let activeSlideIndex = Math.max(
    0,
    slides.findIndex((slide) => slide.classList.contains("is-active")),
  );
  let activePage = Math.floor(activeSlideIndex / slidesPerPage);
  let autoplayId = null;

  // On mobile use scroll-based navigation to avoid transform/overflow-clip conflicts.
  // On desktop use the existing transform approach.
  const isMobile = () => !desktopQuery.matches;

  function getSlidesPerPage() {
    return desktopQuery.matches ? 2 : 1;
  }

  function syncDots() {
    dots.forEach((dot, index) => {
      const isAvailable = index < pageCount;
      dot.hidden = !isAvailable;
      dot.disabled = !isAvailable;
      dot.setAttribute("aria-label", `Show reaction page ${index + 1}`);
    });
  }

  function setActivePage(nextPage) {
    activePage = (nextPage + pageCount) % pageCount;
    activeSlideIndex = activePage * slidesPerPage;

    if (isMobile()) {
      // Mobile: scroll the viewport to the target slide
      const targetSlide = slides[activeSlideIndex];
      if (targetSlide && viewport) {
        const left =
          targetSlide.offsetLeft -
          (viewport.clientWidth - targetSlide.offsetWidth) / 2;
        viewport.scrollTo({
          left: Math.max(0, left),
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    } else {
      // Desktop: translate the track.
      // offsetLeft is relative to offsetParent — with position:relative on the
      // track, slide.offsetLeft is now correctly relative to the track itself (0
      // for first slide, slideWidth+gap for second, etc.).
      const activeOffset = slides[activeSlideIndex]?.offsetLeft || 0;
      track.style.transform = `translateX(-${activeOffset}px)`;
    }

    slides.forEach((slide, index) => {
      const isActive =
        index >= activeSlideIndex && index < activeSlideIndex + slidesPerPage;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, index) => {
      const isActive = index === activePage;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function syncResponsiveState() {
    const firstVisibleSlide = activePage * slidesPerPage;

    slidesPerPage = getSlidesPerPage();
    pageCount = Math.ceil(slides.length / slidesPerPage);
    activePage = Math.min(
      Math.floor(firstVisibleSlide / slidesPerPage),
      pageCount - 1,
    );

    // Switch viewport overflow based on mode
    if (viewport) {
      viewport.style.overflowX = isMobile() ? "auto" : "hidden";
    }

    syncDots();
    setActivePage(activePage);
  }

  function startAutoplay() {
    if (prefersReducedMotion || autoplayId) return;
    autoplayId = window.setInterval(() => {
      setActivePage(activePage + 1);
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
      const nextPage = Number(dot.dataset.reactionDot || 0);
      setActivePage(nextPage);
      restartAutoplay();
    });
  });

  previousButton?.addEventListener("click", () => {
    setActivePage(activePage - 1);
    restartAutoplay();
  });

  nextButton?.addEventListener("click", () => {
    setActivePage(activePage + 1);
    restartAutoplay();
  });

  window.addEventListener("resize", syncResponsiveState);

  // Defer init until layout is settled — DOMContentLoaded fires before images
  // paint, so offsetLeft is 0 for all slides at that point.
  // Use requestAnimationFrame inside window.load to guarantee both resources
  // and a completed paint cycle before calculating positions.
  function deferredInit() {
    requestAnimationFrame(() => {
      syncResponsiveState();
      startAutoplay();
    });
  }

  if (document.readyState === "complete") {
    deferredInit();
  } else {
    window.addEventListener("load", deferredInit, { once: true });
  }
}
