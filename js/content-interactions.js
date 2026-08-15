function initFaqTools() {
  const search = document.querySelector("[data-faq-search]");
  const items = [...document.querySelectorAll("[data-faq-item]")];
  const count = document.querySelector("[data-faq-count]");
  if (!search || items.length === 0) return;

  const update = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const item of items) {
      const matches = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !matches;
      if (matches) visible += 1;
    }
    document.querySelectorAll("[data-faq-category]").forEach((category) => {
      category.hidden = !category.querySelector(
        "[data-faq-item]:not([hidden])",
      );
    });
    if (count)
      count.textContent = `${visible} ${visible === 1 ? "answer" : "answers"} shown`;
  };

  search.addEventListener("input", update);
  document.querySelector("[data-faq-expand]")?.addEventListener("click", () => {
    items.filter((item) => !item.hidden).forEach((item) => (item.open = true));
  });
  document
    .querySelector("[data-faq-collapse]")
    ?.addEventListener("click", () => {
      items.forEach((item) => (item.open = false));
    });
  update();
}

function initResourceFilters() {
  const controls = document.querySelector("[data-resource-filters]");
  const cards = [...document.querySelectorAll("[data-resource-card]")];
  if (!controls || cards.length === 0) return;

  controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    controls.querySelectorAll("button").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    cards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
}

function initEditorialMotion() {
  const page = document.querySelector(".home-page, .why-page, .about-page");
  const elements = [...document.querySelectorAll("[data-reveal]")];
  if (!page || elements.length === 0 || !("IntersectionObserver" in window))
    return;

  page.classList.add("motion-ready");
  const observer = new window.IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revealed");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );
  elements.forEach((element) => observer.observe(element));
}

function initServiceAudience() {
  const page = document.querySelector(".services-page");
  const panels = [...document.querySelectorAll("[data-audience-panel]")];
  const tabs = [...document.querySelectorAll("[data-audience-tab]")];
  if (!page || panels.length === 0) return;

  const valid = new Set(["individuals", "businesses"]);
  const render = ({ moveFocus = false } = {}) => {
    const audience = window.location.hash.slice(1);
    const selected = valid.has(audience) ? audience : null;
    page.classList.toggle("audience-selected", Boolean(selected));
    panels.forEach((panel) => {
      const active = panel.dataset.audiencePanel === selected;
      panel.hidden = !active;
      panel.setAttribute("aria-hidden", String(!active));
      if (active && moveFocus) {
        panel.setAttribute("tabindex", "-1");
        panel.focus({ preventScroll: true });
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    tabs.forEach((tab) => {
      const active = tab.dataset.audienceTab === selected;
      tab.classList.toggle("active", active);
      if (active) tab.setAttribute("aria-current", "true");
      else tab.removeAttribute("aria-current");
    });
  };

  page.classList.add("services-enhanced");
  window.addEventListener("hashchange", () => render({ moveFocus: true }));
  render();

  const initialAudience = window.location.hash.slice(1);
  if (valid.has(initialAudience)) {
    const alignInitialAudience = () => {
      document
        .querySelector(`[data-audience-panel="${initialAudience}"]`)
        ?.scrollIntoView({ behavior: "auto", block: "start" });
    };
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(alignInitialAudience),
    );
    window.setTimeout(alignInitialAudience, 150);
  }
}

function initLegalNavigation() {
  const page = document.querySelector(".legal-page");
  const links = [...document.querySelectorAll("[data-legal-toc] a")];
  if (!page || links.length === 0 || !("IntersectionObserver" in window))
    return;

  const sections = links
    .map((link) => document.querySelector(link.hash))
    .filter(Boolean);
  const setCurrent = (id) => {
    links.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  const observer = new window.IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setCurrent(visible[0].target.id);
    },
    { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
  );
  sections.forEach((section) => observer.observe(section));
}

export function initContentInteractions() {
  initFaqTools();
  initResourceFilters();
  initEditorialMotion();
  initServiceAudience();
  initLegalNavigation();
}
