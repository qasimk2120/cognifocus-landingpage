var characterImg = null;
var messageBox = null;
var currentCharacter = "goblin";

/*
STRUCTURE:
character -> event -> { mood, messages[] }
*/

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
  characterImg = characterImg || document.getElementById("character-img");
  messageBox = messageBox || document.getElementById("message-box");

  if (!characterImg || !messageBox) return;

  const char = characters[currentCharacter];
  const config = char[event];

  const randomMessage =
    config.messages[Math.floor(Math.random() * config.messages.length)];

  characterImg.src = `${char.basePath}${config.mood}.png`;
  messageBox.innerText = randomMessage;
  // SHOW CHARACTER
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

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentIndex);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === currentIndex);
    });
  }

  prevBtn.addEventListener("click", () => {
    renderSlide(currentIndex - 1);
  });

  nextBtn.addEventListener("click", () => {
    renderSlide(currentIndex + 1);
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      renderSlide(index);
    });
  });

  renderSlide(0);
}

window.selectCharacter = selectCharacter;
window.trigger = trigger;
window.setActiveCard = setActiveCard;

window.addEventListener("DOMContentLoaded", () => {
  characterImg = document.getElementById("character-img");
  messageBox = document.getElementById("message-box");

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
const navbar = document.querySelector(".app-navbar");
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link-chip");

/* Sticky shadow */
window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

  updateActiveLink();
});

/* Active section tracking */
function updateActiveLink() {
  let scrollY = window.scrollY;

  sections.forEach((section) => {
    const top = section.offsetTop - 120;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");

    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach((link) => {
        link.classList.remove("active");

        if (link.getAttribute("href") === `#${id}`) {
          link.classList.add("active");
        }
      });
    }
  });
}
