export function initHomeFaqAccordion() {
  const items = document.querySelectorAll(".cf-faq-item");
  items.forEach((item) => {
    const body = item.querySelector(".cf-faq-body");
    const toggle = item.querySelector(".cf-faq-toggle");
    if (body) body.style.maxHeight = "0";
    item.addEventListener("toggle", () => {
      if (item.open) {
        item.classList.add("open");
        body.style.maxHeight = body.scrollHeight + "px";
        if (toggle) toggle.textContent = "-";
      } else {
        body.style.maxHeight = body.scrollHeight + "px";
        requestAnimationFrame(() => {
          body.style.maxHeight = "0";
        });
        item.classList.remove("open");
        if (toggle) toggle.textContent = "+";
      }
    });
  });
}
