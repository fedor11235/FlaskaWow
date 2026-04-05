const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const counter = document.querySelector("[data-counter]");
const signupForm = document.querySelector("[data-signup-form]");
const formStatus = document.querySelector("[data-form-status]");

if (counter) {
  const targetValue = Number(counter.dataset.counter) || 0;
  const duration = 1800;
  const startTime = performance.now();

  const animateCounter = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = String(Math.round(targetValue * eased));

    if (progress < 1) {
      requestAnimationFrame(animateCounter);
    }
  };

  requestAnimationFrame(animateCounter);
}

if ("IntersectionObserver" in window && sections.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        navLinks.forEach((link) => {
          const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", isCurrent);
        });
      });
    },
    {
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.1,
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

if (signupForm && formStatus) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = signupForm.querySelector('button[type="submit"]');
    const formData = new FormData(signupForm);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    formStatus.textContent = "Отправляем заявку...";
    formStatus.classList.remove("is-success", "is-error");

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Не удалось отправить заявку.");
      }

      signupForm.reset();
      formStatus.textContent = "Заявка отправлена. Мы получили письмо с данными.";
      formStatus.classList.add("is-success");
    } catch (error) {
      formStatus.textContent =
        error instanceof Error ? error.message : "Произошла ошибка при отправке.";
      formStatus.classList.add("is-error");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });
}
