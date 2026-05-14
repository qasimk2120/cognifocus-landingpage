function initLoopTimerDemo() {
  const timerValue = document.getElementById("loopTimerValue");
  const timerRing = document.querySelector(".timer-ring");
  const liveBadge = document.querySelector(".session-live");
  const controlButtons = Array.from(
    document.querySelectorAll("[data-timer-action]"),
  );

  if (!timerValue || !timerRing) return;

  const totalSeconds = 25 * 60;
  let elapsed = 2;
  let isPaused = false;

  function renderTimer() {
    const remaining = Math.max(totalSeconds - elapsed, 0);
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");
    const progress = Math.max(8, (remaining / totalSeconds) * 100);

    timerValue.textContent = `${minutes}:${seconds}`;
    timerRing.style.setProperty("--timer-progress", `${progress}%`);
  }

  function tickTimer() {
    if (!isPaused) {
      elapsed = (elapsed + 1) % totalSeconds;
      renderTimer();
    }
  }

  function setPaused(nextPaused) {
    isPaused = nextPaused;

    if (liveBadge) {
      liveBadge.textContent = isPaused ? "Paused" : "Live";
      liveBadge.classList.toggle("is-paused", isPaused);
    }

    controlButtons.forEach((button) => {
      if (button.dataset.timerAction !== "toggle") return;

      button.textContent = isPaused ? "Resume" : "Pause";
      button.setAttribute("aria-pressed", String(isPaused));
      button.setAttribute(
        "aria-label",
        isPaused ? "Resume demo timer" : "Pause demo timer",
      );
      button.classList.toggle("is-active", !isPaused);
    });
  }

  controlButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.timerAction;

      if (action === "toggle") {
        setPaused(!isPaused);
        return;
      }

      if (action === "minus") {
        elapsed = Math.min(totalSeconds - 1, elapsed + 5 * 60);
      }

      if (action === "plus") {
        elapsed = Math.max(0, elapsed - 5 * 60);
      }

      renderTimer();
    });
  });

  renderTimer();
  window.setInterval(tickTimer, 1000);
}

function initProofGoblinFaceCycle() {
  const face = document.getElementById("proofGoblinFace");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!face || prefersReducedMotion) return;

  const faces = [
    {
      src: "assets/characters/goblin/face/annoyed.png",
      alt: "Annoyed Goblin companion reacting to distraction",
    },
    {
      src: "assets/characters/goblin/face/cheerful.png",
      alt: "Cheerful Goblin companion celebrating clean focus",
    },
    {
      src: "assets/characters/goblin/face/neutral.png",
      alt: "Neutral Goblin companion watching the session",
    },
    {
      src: "assets/characters/goblin/face/angry.png",
      alt: "Angry Goblin companion warning about distraction",
    },
  ];
  let index = 0;

  window.setInterval(() => {
    index = (index + 1) % faces.length;
    face.classList.add("is-switching");

    window.setTimeout(() => {
      face.src = faces[index].src;
      face.alt = faces[index].alt;
      face.classList.remove("is-switching");
    }, 280);
  }, 2400);
}

function initLaunchCountdown() {
  const el = document.getElementById("cf-countdown");
  if (!el) return;
  if (el.dataset.launchCountdownInitialized === "true") return;
  el.dataset.launchCountdownInitialized = "true";

  const banner = document.getElementById("cf-launch-banner");
  const launchDate = new Date("2026-06-01T00:00:00");

  function update() {
    const now = new Date();
    const diff = launchDate - now;

    if (diff <= 0) {
      el.textContent = "\u2014 live now!";
      if (banner) {
        banner.style.display = "none";
        document.documentElement.classList.add("cf-launch-ended");
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      el.textContent = `\u2014 ${days}d ${hours}h left`;
    } else {
      el.textContent = `\u2014 ${hours}h ${minutes}m left`;
    }
  }

  update();
  setInterval(update, 60000);
}

window.addEventListener("DOMContentLoaded", () => {
  initLaunchCountdown();
  initLoopTimerDemo();
  initProofGoblinFaceCycle();

  // 🔥 SAFE navbar logic
  const navbar = document.querySelector(".app-navbar");

  if (navbar) {
    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }

      lastScrollY = window.scrollY;
    });
  }

  // floating socials
  let lastScrollY = window.scrollY;
  const socials = document.getElementById("floatingSocials");

  window.addEventListener("scroll", () => {
    if (!socials) return;

    if (window.scrollY > lastScrollY) {
      socials.style.opacity = "0";
      socials.style.transform = "translateY(-50%) translateX(-20px)";
    } else {
      socials.style.opacity = "1";
      socials.style.transform = "translateY(-50%) translateX(0)";
    }

    lastScrollY = window.scrollY;
  });
});
