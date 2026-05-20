export function initNav() {
  const nav = document.getElementById("cf-nav");
  const hamburger = document.querySelector(".cf-nav__hamburger");
  const mobileMenu = document.getElementById("cf-mobile-menu");
  const desktopNav = document.querySelector(".cf-nav__links");
  const mobileNav = mobileMenu
    ? mobileMenu.querySelector(".cf-mobile-menu__links")
    : null;
  const closeButtons = mobileMenu
    ? mobileMenu.querySelectorAll("[data-mobile-menu-close]")
    : [];
  if (!nav) return;

  function updateScrollClass() {
    nav.classList.toggle("scrolled", window.scrollY > 20);
  }

  window.addEventListener("scroll", updateScrollClass, { passive: true });
  updateScrollClass();

  if (hamburger && mobileMenu) {
    if (hamburger.dataset.mobileMenuBound === "true") {
      return;
    }
    hamburger.dataset.mobileMenuBound = "true";

    const updateMenuState = (isOpen) => {
      hamburger.classList.toggle("open", isOpen);
      hamburger.setAttribute("aria-expanded", String(isOpen));
      hamburger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      mobileMenu.classList.toggle("open", isOpen);
      mobileMenu.setAttribute("aria-hidden", String(!isOpen));
      document.body.classList.toggle("cf-menu-open", isOpen);
      if (desktopNav) {
        desktopNav.setAttribute("aria-hidden", String(isOpen));
      }
      if (mobileNav) {
        mobileNav.setAttribute("aria-hidden", String(!isOpen));
      }
    };

    const isMenuOpen = () => mobileMenu.classList.contains("open");

    const setMenuState = (isOpen, options = {}) => {
      const { restoreFocus = false } = options;

      updateMenuState(isOpen);
      if (!isOpen && restoreFocus) {
        hamburger.focus();
      }
    };

    hamburger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMenuState(!isMenuOpen());
    });

    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    mobileMenu.addEventListener("click", (event) => {
      if (event.target === mobileMenu) {
        setMenuState(false);
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isMenuOpen()) {
        setMenuState(false, { restoreFocus: true });
      }
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        setMenuState(false);
      });
    });

    updateMenuState(false);
  }
}
