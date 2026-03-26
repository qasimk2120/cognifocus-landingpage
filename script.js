const characterImg = document.getElementById("character-img");
const messageBox = document.getElementById("message-box");

const sequence = [
  {
    img: "assets/characters/goblin/avatar/neutral.png",
    text: "Starting session...",
  },
  {
    img: "assets/characters/goblin/avatar/annoyed.png",
    text: "Already distracted??",
  },
  {
    img: "assets/characters/goblin/avatar/angry.png",
    text: "BRO??",
  },
  {
    img: "assets/characters/goblin/avatar/cheerful.png",
    text: "Okay fine, locked in.",
  },
];

let index = 0;

function runSequence() {
  characterImg.src = sequence[index].img;
  messageBox.innerText = sequence[index].text;

  index = (index + 1) % sequence.length;
}

setInterval(runSequence, 2500);
