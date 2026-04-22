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

// expose globally
window.animateFaces = animateFaces;
window.initSharedNavMenu = initSharedNavMenu;

document.addEventListener("DOMContentLoaded", () => {
  initSharedNavMenu();
});
