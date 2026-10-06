const email = "mike@novelpolymer.cn";

async function copyEmail() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(email);
    return;
  }

  const input = document.createElement("textarea");
  input.value = email;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

for (const button of document.querySelectorAll("[data-copy-email]")) {
  button.addEventListener("click", async () => {
    const status = button.parentElement?.querySelector("[data-copy-status]");
    try {
      await copyEmail();
      if (status) status.textContent = "Email address copied.";
    } catch {
      if (status) status.textContent = `Copy failed. Use ${email}.`;
    }
  });
}

const mobileEnquiry = document.querySelector(".mobile-enquiry");
const hero = document.querySelector(".hero");
if (mobileEnquiry && hero) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      mobileEnquiry.classList.toggle("is-visible", !entry.isIntersecting);
    }, { threshold: 0.08 });
    observer.observe(hero);
  } else {
    const updateMobileEnquiry = () => mobileEnquiry.classList.toggle("is-visible", window.scrollY > 320);
    window.addEventListener("scroll", updateMobileEnquiry, { passive: true });
    updateMobileEnquiry();
  }
}
