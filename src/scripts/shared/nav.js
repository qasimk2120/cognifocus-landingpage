export function initNav() {
  const nav = document.getElementById("cf-nav");
  const hamburger = document.querySelector(".cf-nav__hamburger");
  const mobileMenu = document.getElementById("cf-mobile-menu");
  const desktopNav = document.querySelector(".cf-nav__links");
  const mobileNav = mobileMenu
    ? mobileMenu.querySelector(".cf-mobile-menu__links")
    : null;

  if (!nav) return;

  function updateScrollClass() {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  }

  window.addEventListener("scroll", updateScrollClass, { passive: true });
  updateScrollClass();

  if (hamburger && mobileMenu) {
    const setMenuState = (isOpen) => {
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
      mobileMenu.classList.toggle("open", isOpen);
      mobileMenu.setAttribute("aria-hidden", String(!isOpen));
      if (desktopNav) {
        desktopNav.setAttribute("aria-hidden", String(isOpen));
      }
      if (mobileNav) {
        mobileNav.setAttribute("aria-hidden", String(!isOpen));
      }
    };

    hamburger.addEventListener("click", () => {
      setMenuState(!hamburger.classList.contains("open"));
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    setMenuState(false);
  }
}
