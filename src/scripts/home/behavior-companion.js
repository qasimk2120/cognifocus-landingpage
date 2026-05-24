const companionMessages = {
  demo: ["this part matters", "watch the save happen"],
  testimonials: ["people notice the stare", "accountability, but tiny"],
  reactions: ["shield catches the scroll reflex", "tap one, admit nothing"],
  spirals: ["the quick check incident", "muscle memory got caught"],
  final: ["one protected session first", "clean run? tempting"],
  faq: ["permissions, but explained", "still scrolling huh"],
};

const companionAvatars = {
  demo: "/assets/characters/goblin/avatar/neutral.png",
  testimonials: "/assets/characters/goblin/avatar/cheerful.png",
  reactions: "/assets/characters/goblin/avatar/angry.png",
  spirals: "/assets/characters/goblin/avatar/annoyed.png",
  final: "/assets/characters/goblin/avatar/cheerful.png",
  faq: "/assets/characters/goblin/avatar/neutral.png",
};

const sectionBindings = [
  [".home-demo-section", "demo"],
  [".testimonials-strip", "testimonials"],
  ["#why", "reactions"],
  [".attention-spirals-section", "spirals"],
  [".final-focus-section", "final"],
  ["#faq", "faq"],
];

const ambientMessages = [
  "still scrolling huh",
  "this part matters",
  "the quick check incident",
  "shield catches the scroll reflex",
];

export function initBehaviorCompanion() {
  const companion = document.querySelector("[data-behavior-companion]");
  const bubble = companion?.querySelector("[data-companion-bubble]");
  const avatar = companion?.querySelector("[data-companion-avatar]");
  const hero = document.querySelector(".hero-section");

  if (
    !companion ||
    !bubble ||
    !avatar ||
    !hero ||
    !("IntersectionObserver" in window)
  ) {
    return;
  }

  const desktopQuery = window.matchMedia("(min-width: 1680px)");
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let isAwake = false;
  let activeKey = "demo";
  let messageIndex = 0;
  let speechTimeoutId = null;
  let bubbleSwapTimeoutId = null;
  let avatarSwapTimeoutId = null;
  let ambientIntervalId = null;

  function canRun() {
    return desktopQuery.matches && !reducedMotionQuery.matches;
  }

  function setAwake(nextValue) {
    isAwake = nextValue && canRun();
    companion.classList.toggle("is-awake", isAwake);
    companion.classList.toggle("is-speaking", false);
    companion.classList.toggle("is-bubble-changing", false);
  }

  function setAvatarForSection(key) {
    const nextAvatar = companionAvatars[key] || companionAvatars.demo;

    if (avatar.getAttribute("src") === nextAvatar) return;

    window.clearTimeout(avatarSwapTimeoutId);
    companion.classList.add("is-avatar-changing");

    avatarSwapTimeoutId = window.setTimeout(() => {
      avatar.setAttribute("src", nextAvatar);
      companion.classList.remove("is-avatar-changing");
      companion.classList.add("is-avatar-popping");

      window.setTimeout(() => {
        companion.classList.remove("is-avatar-popping");
      }, 260);
    }, 150);
  }

  function speak(message) {
    if (!isAwake || !canRun() || !message) return;

    window.clearTimeout(speechTimeoutId);
    window.clearTimeout(bubbleSwapTimeoutId);
    companion.classList.remove("is-speaking");
    companion.classList.add("is-bubble-changing");

    bubbleSwapTimeoutId = window.setTimeout(() => {
      bubble.textContent = message;
      companion.classList.remove("is-bubble-changing");
      companion.classList.add("is-speaking", "is-bubble-popping");

      window.setTimeout(() => {
        companion.classList.remove("is-bubble-popping");
      }, 280);
    }, 150);

    speechTimeoutId = window.setTimeout(() => {
      companion.classList.remove("is-speaking");
    }, 4850);
  }

  function speakForSection(key) {
    setAvatarForSection(key);

    const messages = companionMessages[key] || ambientMessages;
    const nextMessage = messages[messageIndex % messages.length];
    messageIndex += 1;
    speak(nextMessage);
  }

  function syncCapability() {
    if (canRun()) {
      const heroBottom = hero.getBoundingClientRect().bottom;
      setAwake(heroBottom < window.innerHeight * 0.72);
      return;
    }

    setAwake(false);
  }

  const heroObserver = new IntersectionObserver(
    ([entry]) => {
      const passedHero =
        !entry.isIntersecting && entry.boundingClientRect.top < 0;
      setAwake(passedHero);

      if (passedHero) {
        speakForSection(activeKey);
      }
    },
    {
      rootMargin: "0px 0px -28% 0px",
      threshold: 0,
    },
  );

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!activeEntry) return;

      activeKey = activeEntry.target.dataset.companionSection || activeKey;
      speakForSection(activeKey);
    },
    {
      rootMargin: "-32% 0px -44% 0px",
      threshold: [0.18, 0.34, 0.5],
    },
  );

  sectionBindings.forEach(([selector, key]) => {
    const section = document.querySelector(selector);
    if (!section) return;

    section.dataset.companionSection = key;
    sectionObserver.observe(section);
  });

  heroObserver.observe(hero);
  syncCapability();

  desktopQuery.addEventListener("change", syncCapability);
  reducedMotionQuery.addEventListener("change", syncCapability);

  ambientIntervalId = window.setInterval(() => {
    if (!isAwake || !canRun()) return;

    const messages = companionMessages[activeKey] || ambientMessages;
    const nextMessage =
      messages[messageIndex % messages.length] ||
      ambientMessages[messageIndex % ambientMessages.length];
    messageIndex += 1;
    speak(nextMessage);
  }, 11200);

  window.addEventListener("pagehide", () => {
    window.clearInterval(ambientIntervalId);
    window.clearTimeout(speechTimeoutId);
    window.clearTimeout(bubbleSwapTimeoutId);
    window.clearTimeout(avatarSwapTimeoutId);
  });
}
