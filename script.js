var characterImg = null;
var messageBox = null;
var currentCharacter = "goblin";

const characters = {
  goblin: {
    basePath: "assets/characters/goblin/avatar/",
    start: {
      mood: "neutral",
      messages: [
        "Starting session... try not to mess this up.",
        "Alright... let's see how long you last.",
      ],
    },
    distraction: {
      mood: "angry",
      messages: [
        "BRO?? already distracted??",
        "That was fast. Impressive... in a bad way.",
      ],
    },
    complete: {
      mood: "cheerful",
      messages: [
        "Okay... that was actually decent.",
        "You didn't fail for once. Nice.",
      ],
    },
  },
};

function selectCharacter(char) {
  currentCharacter = char;
  trigger("start");
}

function trigger(event) {
  characterImg = characterImg || document.getElementById("character-img");
  messageBox = messageBox || document.getElementById("message-box");

  if (!characterImg || !messageBox) return;

  const char = characters[currentCharacter];
  const config = char[event];

  const randomMessage =
    config.messages[Math.floor(Math.random() * config.messages.length)];

  characterImg.src = `${char.basePath}${config.mood}.png`;
  messageBox.innerText = randomMessage;
  characterImg.classList.remove("character-hidden");
}

function setActiveCard(selected) {
  document.querySelectorAll(".character-card").forEach((card) => {
    card.classList.remove("active-card");
  });

  selected.classList.add("active-card");
}

function initShieldCarousel() {
  const track = document.getElementById("shieldTrack");
  const prevBtn = document.getElementById("shieldPrev");
  const nextBtn = document.getElementById("shieldNext");
  const dots = Array.from(document.querySelectorAll(".shield-dot"));

  if (!track || !prevBtn || !nextBtn || dots.length === 0) return;

  const slides = Array.from(track.querySelectorAll(".shield-card"));
  let currentIndex = 0;

  function renderSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === currentIndex);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle("is-active", i === currentIndex);
    });
  }

  prevBtn.addEventListener("click", () => renderSlide(currentIndex - 1));
  nextBtn.addEventListener("click", () => renderSlide(currentIndex + 1));

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => renderSlide(i));
  });

  renderSlide(0);
}

// expose globally
window.selectCharacter = selectCharacter;
window.trigger = trigger;
window.setActiveCard = setActiveCard;

window.addEventListener("DOMContentLoaded", () => {
  characterImg = document.getElementById("character-img");
  messageBox = document.getElementById("message-box");

  // background animation
  if (typeof window.animateFaces === "function") {
    window.animateFaces();
  }

  initShieldCarousel();

  const defaultCard = document.querySelector(
    '.character-card[onclick*="goblin"]',
  );
  if (defaultCard) {
    setActiveCard(defaultCard);
  }

  trigger("start");

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
