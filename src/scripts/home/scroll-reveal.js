const revealItemSelectors = [
  ".home-demo-showcase",
  ".reaction-carousel-heading",
  ".reaction-slide",
  ".why-heading",
  ".reaction-utility-chip",
  ".goblin-card",
  ".attention-spirals-heading",
  ".attention-spiral-card",
  ".final-focus-panel",
  ".cf-faq-item",
  ".cf-faq-view-all",
];

function setRevealDelay(element, index) {
  const delay = Math.min(index, 6) * 92;
  element.style.setProperty("--cf-reveal-delay", `${delay}ms`);
}

function collectRevealElements(section) {
  const children = revealItemSelectors
    .flatMap((selector) => Array.from(section.querySelectorAll(selector)));

  children.forEach((child, index) => {
    child.classList.add("cf-reveal", "cf-reveal-stagger");
    setRevealDelay(child, index);
  });

  section.classList.add("cf-reveal", "cf-reveal-section");
  return [section, ...children];
}

export function initScrollReveal() {
  const sections = Array.from(
    document.querySelectorAll(
      "body.cf-home #main-content > section:not(.hero-section), body.cf-home #faq",
    ),
  );

  if (sections.length === 0) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const revealElements = sections.flatMap(collectRevealElements);

  document.documentElement.classList.add("cf-motion-ready");

  function showElement(element) {
    element.classList.add("is-visible");
  }

  function revealHashTarget() {
    if (!window.location.hash) return;

    const target = document.querySelector(window.location.hash);
    const section = target?.closest("section");
    if (!section) return;

    revealElements
      .filter((element) => element === section || section.contains(element))
      .forEach(showElement);
  }

  revealHashTarget();
  window.addEventListener("hashchange", revealHashTarget);

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(showElement);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        showElement(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    },
  );

  revealElements.forEach((element) => observer.observe(element));
}
