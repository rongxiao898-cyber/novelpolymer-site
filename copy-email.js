const email = "mike@novelpolymer.cn";
const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const campaignValuePattern = /^[a-zA-Z0-9._~+\- ]{1,100}$/;

function campaignReference() {
  const current = new URL(window.location.href);
  return campaignKeys.flatMap((key) => {
    const value = current.searchParams.get(key)?.trim();
    if (!value || !campaignValuePattern.test(value)) return [];
    return [[key.replace("utm_", ""), value]];
  });
}

function appendCampaignReferenceToEnquiryLinks() {
  const campaign = campaignReference();
  if (!campaign.length) return;
  const marker = "Campaign reference:";
  const details = campaign.map(([key, value]) => `${key}: ${value}`).join("\n");
  for (const link of document.querySelectorAll('a[href^="mailto:mike@novelpolymer.cn"]')) {
    const target = new URL(link.href);
    const body = target.searchParams.get("body");
    if (!body || body.includes(marker)) continue;
    target.searchParams.set("body", `${body}\n\n${marker}\n${details}`);
    link.setAttribute("href", target.toString());
  }
}

appendCampaignReferenceToEnquiryLinks();

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  let copied = false;
  try {
    input.select();
    copied = document.execCommand("copy");
  } finally {
    input.remove();
  }
  if (!copied) throw new Error("Browser copy command failed");
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

function copyEmail() {
  return copyText(email);
}

for (const button of document.querySelectorAll("[data-copy-checklist]")) {
  button.addEventListener("click", async () => {
    const status = button.parentElement?.querySelector("[data-checklist-status]");
    try {
      await copyText(button.dataset.checklist || "");
      if (status) status.textContent = "Checklist copied.";
    } catch {
      if (status) status.textContent = "Copy failed. Select the checklist above.";
    }
  });
}

for (const button of document.querySelectorAll("[data-copy-page-link]")) {
  button.addEventListener("click", async () => {
    const status = button.parentElement?.querySelector("[data-copy-page-status]");
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href;
    const pageUrl = button.dataset.copyPageLink || canonicalUrl;
    try {
      if (!pageUrl) throw new Error("Canonical URL is unavailable");
      await copyText(pageUrl);
      if (status) status.textContent = "Link copied.";
    } catch {
      if (status) status.textContent = "Copy failed. Copy the URL from your browser.";
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

for (const menu of document.querySelectorAll(".mobile-nav")) {
  const summary = menu.querySelector("summary");
  if (!summary) continue;

  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !menu.open) return;
    event.preventDefault();
    menu.open = false;
    summary.focus();
  });

  document.addEventListener("pointerdown", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
}
