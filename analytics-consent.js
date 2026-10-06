(function () {
  "use strict";

  const measurementId = "G-CN9MWX6ST1";
  const storageKey = "tianze_analytics_consent_v1";
  let analyticsLoaded = false;
  let banner;

  function readChoice() {
    try {
      const choice = localStorage.getItem(storageKey);
      return choice === "granted" || choice === "denied" ? choice : null;
    } catch {
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(storageKey, choice);
    } catch {
      // The banner can still control analytics for the current page when storage is unavailable.
    }
  }

  function deleteAnalyticsCookies() {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.novelpolymer.cn; SameSite=Lax`;
    });
  }

  function loadAnalytics() {
    if (analyticsLoaded || document.querySelector(`script[data-tianze-analytics="${measurementId}"]`)) return;
    analyticsLoaded = true;
    window[`ga-disable-${measurementId}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      ads_data_redaction: true,
      page_location: `${location.origin}${location.pathname}`,
      page_title: document.title,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.tianzeAnalytics = measurementId;
    document.head.appendChild(script);
  }

  function withdrawAnalytics() {
    window[`ga-disable-${measurementId}`] = true;
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    deleteAnalyticsCookies();
  }

  function closeBanner() {
    if (!banner) return;
    banner.hidden = true;
    document.documentElement.classList.remove("analytics-consent-open");
  }

  function choose(choice) {
    saveChoice(choice);
    if (choice === "granted") loadAnalytics();
    else withdrawAnalytics();
    closeBanner();
  }

  function createBanner() {
    banner = document.createElement("section");
    banner.className = "analytics-consent";
    banner.hidden = true;
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "analytics-consent-title");
    banner.innerHTML = `
      <div class="analytics-consent__inner">
        <div class="analytics-consent__copy">
          <strong id="analytics-consent-title">Analytics cookies <span lang="zh-CN">/ 分析型 Cookie</span></strong>
          <p>With your permission, we use Google Analytics to understand page visits, resource downloads and enquiry-entry clicks. We do not send form fields, copied checklist text or email content. <span lang="zh-CN">经您同意后，我们使用 Google Analytics 了解页面访问、资料下载及咨询入口点击情况，不会发送表单内容、复制的清单文字或邮件正文。</span></p>
          <a href="/privacy/">Privacy &amp; cookie notice <span lang="zh-CN">/ 隐私与 Cookie 说明</span></a>
        </div>
        <div class="analytics-consent__actions">
          <button class="analytics-consent__accept" type="button" data-consent-choice="granted">Accept analytics <span lang="zh-CN">/ 接受分析</span></button>
          <button class="analytics-consent__necessary" type="button" data-consent-choice="denied">Necessary only <span lang="zh-CN">/ 仅必要功能</span></button>
        </div>
      </div>`;
    document.body.appendChild(banner);
    banner.addEventListener("click", (event) => {
      const button = event.target.closest("[data-consent-choice]");
      if (button) choose(button.dataset.consentChoice);
    });
  }

  function openBanner() {
    if (!banner) createBanner();
    banner.hidden = false;
    document.documentElement.classList.add("analytics-consent-open");
    banner.querySelector("button")?.focus({ preventScroll: true });
  }

  function trackSiteActions() {
    let sentScrollEvent = false;
    document.addEventListener("click", (event) => {
      if (readChoice() !== "granted" || typeof window.gtag !== "function") return;
      const checklistButton = event.target.closest("[data-copy-checklist]");
      if (checklistButton) {
        window.gtag("event", "checklist_copy", { page_path: location.pathname });
        return;
      }
      const link = event.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (link.hasAttribute("download") && /\.pdf(?:$|[?#])/i.test(href)) {
        window.gtag("event", "resource_download", {
          resource_name: href.split("/").pop().split(/[?#]/)[0],
          page_path: location.pathname,
        });
        return;
      }
      if (href.startsWith("mailto:")) {
        window.gtag("event", "enquiry_entry_click", { page_path: location.pathname });
        return;
      }
      try {
        const target = new URL(link.href, location.href);
        if (/^https?:$/.test(target.protocol) && target.hostname !== location.hostname) {
          window.gtag("event", "outbound_link_click", {
            destination_hostname: target.hostname,
            page_path: location.pathname,
          });
        }
      } catch {
        // Ignore invalid or browser-handled link formats.
      }
    });
    window.addEventListener("scroll", () => {
      if (sentScrollEvent || readChoice() !== "granted" || typeof window.gtag !== "function") return;
      const available = document.documentElement.scrollHeight - window.innerHeight;
      if (available > 0 && window.scrollY / available >= 0.9) {
        sentScrollEvent = true;
        window.gtag("event", "scroll_depth_90", { page_path: location.pathname });
      }
    }, { passive: true });
  }

  function init() {
    createBanner();
    trackSiteActions();
    const choice = readChoice();
    if (choice === "granted") loadAnalytics();
    else if (choice === "denied") withdrawAnalytics();
    else openBanner();
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-analytics-settings]")) {
        event.preventDefault();
        openBanner();
      }
    });
  }

  window.TianzeAnalyticsConsent = {
    open: openBanner,
    choice: readChoice,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
}());
