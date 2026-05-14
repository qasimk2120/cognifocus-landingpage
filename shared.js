// --- Animated background faces (shared) ---
const faceImages = [
  "assets/characters/goblin/face/angry.png",
  "assets/characters/goblin/face/annoyed.png",
  "assets/characters/goblin/face/cheerful.png",
  "assets/characters/goblin/face/neutral.png",
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnFace() {
  const img = document.createElement("img");
  img.src = faceImages[Math.floor(Math.random() * faceImages.length)];
  img.className = "bg-face-anim";

  img.style.left = randomBetween(2, 90) + "vw";
  img.style.top = randomBetween(5, 80) + "vh";
  img.style.width = randomBetween(48, 80) + "px";
  img.style.animationDuration = randomBetween(3, 7) + "s";

  document.body.appendChild(img);

  setTimeout(
    () => {
      img.classList.add("fade-out");
      setTimeout(() => img.remove(), 1200);
    },
    randomBetween(2200, 4000),
  );
}

function animateFaces() {
  spawnFace();
  if (Math.random() > 0.5) setTimeout(spawnFace, 800);
  setTimeout(animateFaces, randomBetween(1800, 3500));
}

function initSharedNavMenu() {
  const navbars = Array.from(document.querySelectorAll(".app-navbar"));
  if (navbars.length === 0) return;

  navbars.forEach((navbar) => {
    const toggle = navbar.querySelector(".nav-toggle");
    const actions = navbar.querySelector(".nav-actions");

    if (!toggle || !actions) return;

    function setOpen(isOpen) {
      navbar.classList.toggle("menu-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    }

    toggle.addEventListener("click", () => {
      setOpen(!navbar.classList.contains("menu-open"));
    });

    actions.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("click", (event) => {
      if (!navbar.contains(event.target)) {
        setOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 991.98) {
        setOpen(false);
      }
    });
  });
}

function initNav() {
  const nav = document.getElementById("cf-nav");
  const hamburger = document.querySelector(".cf-nav__hamburger");
  const mobileMenu = document.getElementById("cf-mobile-menu");

  if (!nav) return;

  function updateScrollClass() {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  }

  window.addEventListener("scroll", updateScrollClass, { passive: true });
  updateScrollClass();

  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => {
      const isOpen = hamburger.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(isOpen));
      mobileMenu.classList.toggle("open", isOpen);
      mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("open");
        mobileMenu.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
      });
    });
  }
}

function upgradeDownloadCtas() {
  const downloadCtas = document.querySelectorAll(
    'a.primary-cta[href*="download.html"]',
  );

  downloadCtas.forEach((cta) => {
    if (cta.closest(".app-navbar")) return;
    if (cta.dataset.keepLabel === "true") return;
    if (cta.dataset.playStoreEnhanced === "true") return;

    cta.dataset.playStoreEnhanced = "true";
    cta.classList.add("download-store-cta");
    cta.setAttribute("aria-label", "Start CogniFocus free on Android");
    cta.innerHTML = `
      <span class="download-store-cta__icon-wrap" aria-hidden="true">
        <span class="download-store-cta__icon">
          <svg viewBox="0 0 24 24" focusable="false" role="img">
            <path fill="#34A853" d="M3.4 3.2c-.4.3-.6.8-.6 1.4v14.8c0 .6.2 1.1.6 1.4l10-8.8z"/>
            <path fill="#EA4335" d="M15.4 10.9 18.5 9c1.4.8 2.2 1.5 2.2 3s-.8 2.2-2.2 3l-3.1-1.9z"/>
            <path fill="#FBBC05" d="M4 21c.5.4 1.2.5 1.9.1l11.5-6.6-4-2.5z"/>
            <path fill="#4285F4" d="M4 3l9.4 8.1 4-2.5L5.9 2.9C5.2 2.5 4.5 2.6 4 3z"/>
          </svg>
        </span>
      </span>
      <span class="download-store-cta__label">Start Free on Android</span>
    `;
  });
}

function initBackToTopArrow() {
  if (document.querySelector(".back-to-top-arrow")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top-arrow";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML = "↑";
  document.body.appendChild(button);

  function toggleVisibility() {
    const shouldShow = window.scrollY > 420;
    button.classList.toggle("is-visible", shouldShow);
  }

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();
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
    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor(
      (diff % (1000 * 60 * 60)) / (1000 * 60),
    );

    if (days > 0) {
      el.textContent = `\u2014 ${days}d ${hours}h left`;
    } else {
      el.textContent = `\u2014 ${hours}h ${minutes}m left`;
    }
  }

  update();
  setInterval(update, 60000);
}

// expose globally
window.animateFaces = animateFaces;
window.initSharedNavMenu = initSharedNavMenu;
window.initNav = initNav;
window.initLaunchCountdown = initLaunchCountdown;

document.addEventListener("DOMContentLoaded", () => {
  initLaunchCountdown();
  initNav();
  initSharedNavMenu();
  upgradeDownloadCtas();
  initBackToTopArrow();
});
