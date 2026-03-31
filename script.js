// --- Animated background faces ---
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

window.addEventListener("DOMContentLoaded", animateFaces);
const characterImg = document.getElementById("character-img");
const messageBox = document.getElementById("message-box");

let currentCharacter = "goblin";

/*
STRUCTURE:
character → event → { mood, messages[] }
*/

const characters = {
  goblin: {
    basePath: "assets/characters/goblin/avatar/",

    start: {
      mood: "neutral",
      messages: [
        "Starting session… try not to mess this up.",
        "Alright… let’s see how long you last.",
      ],
    },

    distraction: {
      mood: "angry",
      messages: [
        "BRO?? already distracted??",
        "That was fast. Impressive… in a bad way.",
      ],
    },

    complete: {
      mood: "cheerful",
      messages: [
        "Okay… that was actually decent.",
        "You didn’t fail for once. Nice.",
      ],
    },
  },

  monk: {
    basePath: "assets/characters/monk/avatar/",

    start: {
      mood: "neutral",
      messages: ["Begin calmly.", "Focus starts with intention."],
    },

    distraction: {
      mood: "annoyed",
      messages: ["Return to your task.", "Your mind is wandering."],
    },

    complete: {
      mood: "cheerful",
      messages: ["Well done.", "You stayed disciplined."],
    },
  },
};

function selectCharacter(char) {
  currentCharacter = char;
  trigger("start");
}

function trigger(event) {
  const char = characters[currentCharacter];
  const config = char[event];

  const mood = config.mood;
  const messages = config.messages;

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  const imgPath = `${char.basePath}${mood}.png`;

  characterImg.src = imgPath;
  messageBox.innerText = randomMessage;
}
function setActiveCard(selected) {
  document.querySelectorAll(".character-card").forEach((card) => {
    card.classList.remove("active-card");
  });

  selected.classList.add("active-card");
}
window.addEventListener("DOMContentLoaded", () => {
  let lastScrollY = window.scrollY;
  const socials = document.getElementById("floatingSocials");

  window.addEventListener("scroll", () => {
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
// INIT
trigger("start");
document
  .querySelector(".waitlist-form")
  .addEventListener("submit", function (e) {
    e.preventDefault(); // 🚨 THIS IS THE FIX

    const form = this;
    const formData = new FormData(form);

    fetch(form.action, {
      method: "POST",
      body: formData,
      mode: "no-cors", // important for Brevo
    })
      .then(() => {
        const success = document.getElementById("waitlist-success");
        success.classList.remove("d-none");

        form.reset(); // optional clean UX
      })
      .catch(() => {
        alert("Something went wrong 😅");
      });
  });
