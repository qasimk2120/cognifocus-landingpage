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

function upgradeDownloadCtas() {
  const downloadCtas = document.querySelectorAll(
    'a.primary-cta[href*="download.html"]',
  );

  downloadCtas.forEach((cta) => {
    if (cta.closest(".app-navbar")) return;
    if (cta.dataset.playStoreEnhanced === "true") return;

    cta.dataset.playStoreEnhanced = "true";
    cta.classList.add("download-store-cta");
    cta.setAttribute("aria-label", "Download on Google Play Store");
    cta.innerHTML = `
      <span class="download-store-cta__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" role="img">
          <path fill="#34A853" d="M3.6 3.2c-.3.3-.5.7-.5 1.2v15.2c0 .5.2.9.5 1.2l9.2-9.3z"/>
          <path fill="#EA4335" d="M15.9 12 19 8.9c.9.5 1.4 1 1.4 1.9 0 .9-.5 1.4-1.4 1.9z"/>
          <path fill="#FBBC05" d="M4.1 20.8c.4.4 1 .6 1.6.2l11-6.3-3.6-2.7z"/>
          <path fill="#4285F4" d="M4.1 3.2 13.1 12l3.6-2.7-11-6.3c-.6-.3-1.2-.2-1.6.2z"/>
        </svg>
      </span>
      <span class="download-store-cta__label">Download on Google Play Store</span>
    `;
  });
}

// expose globally
window.animateFaces = animateFaces;
window.initSharedNavMenu = initSharedNavMenu;

document.addEventListener("DOMContentLoaded", () => {
  initSharedNavMenu();
  upgradeDownloadCtas();
});
