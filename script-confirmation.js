window.addEventListener("DOMContentLoaded", () => {
  // background animation
  if (typeof window.animateFaces === "function") {
    window.animateFaces();
  }

  const characterImg = document.getElementById("character-img");
  const messageBox = document.getElementById("message-box");

  if (!characterImg || !messageBox) return;

  // 🔥 goblin personality (ON BRAND)
  const messages = [
    "You made it in. Don't waste this chance 😏",
    "Early access?? Damn… you might actually be serious.",
    "Most people don’t even get this far. Don’t ruin it.",
    "You signed up… now let’s see if you actually show up.",
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  // 🎭 goblin appears
  characterImg.src = "assets/characters/goblin/avatar/cheerful.png";

  setTimeout(() => {
    characterImg.classList.remove("character-hidden");
    characterImg.classList.add("character-enter");
  }, 200);

  // ✍️ typing effect (THIS is what makes it feel alive)
  let i = 0;
  function typeText() {
    if (i < randomMessage.length) {
      messageBox.innerHTML += randomMessage.charAt(i);
      i++;
      setTimeout(typeText, 20);
    }
  }

  setTimeout(typeText, 500);
});
