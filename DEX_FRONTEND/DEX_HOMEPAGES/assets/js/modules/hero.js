// =====================================================
// PAGE LOAD + HERO + PRELOADER
// =====================================================
export function cyclePreloadImages() {
  const imgs = document.querySelectorAll(".preload-gallery img");
  let i = 0;
  setInterval(() => {
    imgs.forEach((img) => img.classList.remove("active"));
    imgs[i].classList.add("active");
    i = (i + 1) % imgs.length;
  }, 1200);
}

export function initHero() {
  // Preloader fade out
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.style.opacity = "0";
    setTimeout(() => preloader.remove(), 800);
  }

  // Hero content + category cards animation
  document.querySelector(".hero-content").classList.add("show");
  document.querySelectorAll(".category-card").forEach((c, i) => {
    setTimeout(() => c.classList.add("show"), 400 + i * 180);
  });

  // Hero slideshow
  const slides = document.querySelectorAll(".hero-slide");
  const dotsContainer = document.querySelector(".hero-dots");
  let currentSlide = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  document.querySelectorAll(".hero-dots span")[0]?.classList.add("active");

  function goToSlide(n) {
    slides[currentSlide].classList.remove("active");
    document
      .querySelectorAll(".hero-dots span")
      [currentSlide]?.classList.remove("active");
    currentSlide = n;
    slides[currentSlide].classList.add("active");
    document
      .querySelectorAll(".hero-dots span")
      [currentSlide].classList.add("active");
  }

  let slideInterval = setInterval(
    () => goToSlide((currentSlide + 1) % slides.length),
    4500
  );

  const hero = document.getElementById("hero");
  hero.addEventListener("mouseenter", () => clearInterval(slideInterval));
  hero.addEventListener("mouseleave", () => {
    slideInterval = setInterval(
      () => goToSlide((currentSlide + 1) % slides.length),
      4500
    );
  });

  // Shop Now button
  document.getElementById("shopNowBtn")?.addEventListener("click", () => {
    document.documentElement.classList.add("has-scrolled");
    document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
  });
}
