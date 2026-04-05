// --- Animated background faces (shared) ---
const faceImages = [
  "assets/characters/goblin/face/angry.png",
  "assets/characters/goblin/face/annoyed.png",
  "assets/characters/goblin/face/cheerful.png",
  "assets/characters/goblin/face/neutral.png",
  "assets/characters/monk/face/angry.png",
  "assets/characters/monk/face/annoyed.png",
  "assets/characters/monk/face/cheerful.png",
  "assets/characters/monk/face/neutral.png",
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

// expose globally
window.animateFaces = animateFaces;
