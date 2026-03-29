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

// INIT
trigger("start");
