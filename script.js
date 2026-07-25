const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

menuToggle?.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".main-nav a, .footer-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const track = document.querySelector(".carousel-track");
const slides = Array.from(document.querySelectorAll(".carousel-track figure"));
const prevButton = document.querySelector(".carousel-button.prev");
const nextButton = document.querySelector(".carousel-button.next");
const dotsContainer = document.querySelector(".carousel-dots");
let currentSlide = 0;
let autoPlay;

function renderDots() {
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show photo ${index + 1}`);
    dot.addEventListener("click", () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });
}

function goToSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  document
    .querySelectorAll(".carousel-dots button")
    .forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === currentSlide);
    });
  restartAutoPlay();
}

function restartAutoPlay() {
  clearInterval(autoPlay);
  autoPlay = setInterval(() => goToSlide(currentSlide + 1), 800);
}

if (slides.length) {
  renderDots();
  goToSlide(0);
  prevButton.addEventListener("click", () => goToSlide(currentSlide - 1));
  nextButton.addEventListener("click", () => goToSlide(currentSlide + 1));

  let touchStartX = 0;
  track.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true },
  );
  track.addEventListener(
    "touchend",
    (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 45)
        goToSlide(currentSlide + (distance < 0 ? 1 : -1));
    },
    { passive: true },
  );
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document
  .querySelectorAll(".reveal")
  .forEach((element) => observer.observe(element));
