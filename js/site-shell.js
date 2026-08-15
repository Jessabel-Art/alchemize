import headerLogoUrl from "../assets/alchemize-logo-horizontal-dark-main-theme.png?url";

const primaryNavigation = [
  { label: "Home", href: "/", match: "/" },
  { label: "Services", href: "/services/", match: "/services/" },
  { label: "About", href: "/about/", match: "/about/" },
  { label: "Why Alchemize", href: "/why-alchemize/", match: "/why-alchemize/" },
  { label: "Resources", href: "/resources/", match: "/resources/" },
  { label: "FAQ", href: "/faq/", match: "/faq/" },
];

const footerGroups = [
  {
    title: "Individuals",
    links: [
      ["Tax Preparation", "/services/individuals/tax-preparation/"],
      ["Insurance Solutions", "/services/individuals/insurance/"],
      [
        "Notary & Document Services",
        "/services/individuals/notary-document-services/",
      ],
    ],
  },
  {
    title: "Businesses",
    links: [
      [
        "Business Formation & Startup",
        "/services/businesses/business-formation/",
      ],
      [
        "Administration & Operations",
        "/services/businesses/administration-operations/",
      ],
      ["Business Tax Services", "/services/businesses/business-tax/"],
      ["Business Advisory", "/services/businesses/business-advisory/"],
      [
        "Business Insurance Solutions",
        "/services/businesses/business-insurance/",
      ],
      [
        "Notary & Administrative Services",
        "/services/businesses/notary-administrative-services/",
      ],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Alchemize", "/about/"],
      ["Why Alchemize", "/why-alchemize/"],
      ["Resources", "/resources/"],
      ["Blog", "/blog/"],
      ["FAQ", "/faq/"],
      ["Contact", "/contact/"],
    ],
  },
  {
    title: "Access",
    links: [
      ["Client Portal", "/client-portal/"],
      ["Admin Access", "/admin/"],
      ["Privacy Policy", "/privacy/"],
      ["Terms of Service", "/terms/"],
    ],
  },
];

const logoMarkup = `
  <a class="site-logo" href="/" aria-label="Alchemize Business Services home">
    <img src="${headerLogoUrl}" alt="Alchemize Business Services">
  </a>`;

function normalizePath(pathname) {
  const path = pathname.replace(/\/index\.html$/, "/");
  return path === "" ? "/" : path.endsWith("/") ? path : `${path}/`;
}

function isActive(pathname, item) {
  return item.match === "/"
    ? pathname === "/"
    : pathname.startsWith(item.match);
}

function renderHeader(container) {
  const pathname = normalizePath(window.location.pathname);
  const links = primaryNavigation
    .map(({ label, href, match }) => {
      const current = isActive(pathname, { match })
        ? ' aria-current="page"'
        : "";
      return `<a href="${href}"${current}>${label}</a>`;
    })
    .join("");

  container.className = "site-header";
  container.innerHTML = `<div class="site-header-inner">
    ${logoMarkup}
    <button class="menu" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open navigation menu">
      <span></span><span></span><span></span>
    </button>
    <nav id="primary-navigation" aria-label="Primary navigation">
      ${links}
      <a class="button gold" href="/contact/">Schedule a Consultation</a>
    </nav>
  </div>`;
}

function renderFooter(container) {
  const groups = footerGroups
    .map(
      ({ title, links }) =>
        `<div class="footer-group"><h2>${title}</h2>${links
          .map(([label, href]) => `<a href="${href}">${label}</a>`)
          .join("")}</div>`,
    )
    .join("");

  container.className = "site-footer";
  container.innerHTML = `<div class="site-footer-inner">
    <div class="footer-brand">${logoMarkup}<p>Transforming complexity into opportunity.</p></div>
    ${groups}
    <div class="copyright">&copy; 2026 Alchemize Business Services LLC <span>getalchemize.com</span></div>
  </div>`;
}

function initMobileNavigation(header) {
  const menu = header.querySelector(".menu");
  const nav = header.querySelector("#primary-navigation");
  if (!menu || !nav) return;

  const closeMenu = ({ restoreFocus = false } = {}) => {
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation menu");
    nav.classList.remove("open");
    if (restoreFocus) menu.focus();
  };

  menu.addEventListener("click", () => {
    const willOpen = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(willOpen));
    menu.setAttribute(
      "aria-label",
      willOpen ? "Close navigation menu" : "Open navigation menu",
    );
    nav.classList.toggle("open", willOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open"))
      closeMenu({ restoreFocus: true });
  });
}

export function initSiteShell() {
  const header = document.querySelector("#site-header");
  const footer = document.querySelector("#site-footer");
  if (header) {
    renderHeader(header);
    initMobileNavigation(header);
  }
  if (footer) renderFooter(footer);
}
