import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Trust + differentiation + conversion refinement:
//  - 15+ years belongs to Jessy's professional experience, never to the company;
//  - prior work is described with conservative verbs and no invented results;
//  - no portfolio / case-study / testimonial system exists;
//  - CTAs say what they do (a request for review, not a booking);
//  - the founder story, Web & Digital origin, resources routing and contact
//    expectations are present in both languages.

const languages = [
  { code: "en", prefix: "" },
  { code: "es", prefix: "/es" },
];

const publicPaths = [
  "/",
  "/why-alchemize",
  "/resources/meet-the-founder",
  "/services",
  "/web-digital",
  "/contact",
];
const servicePaths = [
  "/services/individuals/tax-preparation",
  "/services/individuals/notary-document-services",
  "/services/individuals/translation-services",
  "/services/individuals/apostille-services",
  "/services/businesses/advisory-optimization",
  "/services/businesses/operations-implementation",
  "/services/businesses/readiness-growth",
  "/services/businesses/bookkeeping-financial-reporting",
  "/services/businesses/payroll-processing",
  "/services/businesses/business-tax-support",
];

const text = (page) =>
  page.evaluate(
    () => document.querySelector("main, article")?.textContent ?? "",
  );

for (const { code, prefix } of languages) {
  test(`${code}: 15+ years is attributed to Jessy's experience, never to the company`, async ({
    page,
  }) => {
    for (const path of [...publicPaths, ...servicePaths]) {
      await page.goto(`${prefix}${path}`);
      const body = await text(page);
      if (/15\+|más de 15|more than 15/i.test(body)) {
        expect(body, path).toMatch(/Jessy/);
      }
      // the company is never said to have 15 years of operation, clients, or history
      expect(body, path).not.toMatch(
        /(Alchemize|our company|la empresa|nuestra empresa)[^.]{0,50}(has|have|ha|han)\s+(been\s+)?(operat|in business|served|working|trabaj|opera)[^.]{0,60}15/i,
      );
      expect(body, path).not.toMatch(
        /15\+?\s*(years|años)\s+(of\s+|de\s+)?(client|service to|serving|history|in business|de servicio|de historia)/i,
      );
      expect(body, path).not.toMatch(
        /since\s+20\d\d|desde\s+20\d\d|founded in|fundada en/i,
      );
    }
  });

  test(`${code}: prior work is described conservatively, with no invented results`, async ({
    page,
  }) => {
    for (const path of [...publicPaths, ...servicePaths]) {
      await page.goto(`${prefix}${path}`);
      const body = await text(page);
      expect(body, path).not.toMatch(
        /architected|architecting|arquitectó|enterprise[- ](level|grade|crm|system|software|commerce|transformation)|led (the |a |an )?(team|transformation|migration|rollout)|spearhead|oversaw|empresarial a gran escala|lideró/i,
      );
      // no metrics, ROI, savings, client counts, or transaction volumes
      expect(body, path).not.toMatch(
        /\bROI\b|\d+\s?%\s+(increase|improvement|faster|growth|more)|saved\b|increased (revenue|sales|conversion)|clients? served|\d[\d,]+\+? (clients|customers|users|transactions)|awards?\b|certified (as|by)\b/i,
      );
    }
  });

  test(`${code}: no portfolio, case-study, testimonial, review or client-logo system exists`, async ({
    page,
  }) => {
    for (const path of [...publicPaths, ...servicePaths]) {
      await page.goto(`${prefix}${path}`);
      let body = await text(page);
      // the Founder page already links to Jessy's own art portfolio; that link is unchanged
      body = body.replace(/View Jessy's Portfolio/g, "");
      expect(body, path).not.toMatch(
        /case stud|testimonial|selected work|client logos?|success stor|5[- ]star|estudios? de caso|testimonios|trabajos seleccionados|logotipos de clientes|historias de éxito/i,
      );
    }
    for (const bad of [
      "portfolio",
      "case-studies",
      "testimonials",
      "selected-work",
      "reviews",
    ]) {
      await page.goto(`${prefix}/`);
      await expect(page.locator(`a[href*="/${bad}"]`), bad).toHaveCount(0);
    }
  });

  test(`${code}: no public page promises direct scheduling for an inquiry or a 24-hour response`, async ({
    page,
  }) => {
    const banned =
      /Schedule a Consultation|schedule the consultation|within 24 hours|Programar una consulta|programar la consulta|dentro de 24 horas/i;
    for (const path of [...publicPaths, ...servicePaths, "/resources"]) {
      await page.goto(`${prefix}${path}`);
      await expect(page.locator("body"), path).not.toContainText(banned);
    }
  });

  test(`${code}: the homepage credibility section replaces the generic trust copy`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/`);
    const section = page.locator(".home-trust");
    await expect(section.locator("h2")).toHaveText(
      code === "en"
        ? "Built on experience doing the work."
        : "Basada en la experiencia de hacer el trabajo.",
    );
    await expect(section.locator(".home-trust-signals div")).toHaveCount(4);
    await expect(section.locator(".home-trust-signals dt")).toHaveText(
      code === "en"
        ? ["15+ years", "MBA", "Systems & workflow", "Digital & e-commerce"]
        : [
            "Más de 15 años",
            "MBA",
            "Sistemas y flujos de trabajo",
            "Digital y comercio electrónico",
          ],
    );
    // the company is newer; the experience is Jessy's
    await expect(section).toContainText(
      code === "en"
        ? "The company is newer; the experience behind it is not."
        : "La empresa es nueva; la experiencia que la respalda, no.",
    );
    await expect(section).toContainText("Jessy Santos");
    await expect(
      section.getByRole("link", {
        name: code === "en" ? "Meet the Founder" : "Conozca a la fundadora",
      }),
    ).toHaveAttribute("href", `${prefix}/resources/meet-the-founder`);
    // the weaker generic copy is gone; the implementation positioning is kept
    await expect(page.locator("body")).not.toContainText(
      /Professional does not have to mean impersonal|Ser profesional no significa ser impersonal/,
    );
    await expect(page.locator(".home-capabilities h2")).toHaveText(
      code === "en"
        ? "More than recommendations. Support for putting the work into place."
        : "Más que recomendaciones. Apoyo para poner el trabajo en práctica.",
    );
  });

  test(`${code}: CTA labels say what they do, and destinations are unchanged`, async ({
    page,
  }) => {
    const general =
      code === "en" ? "Tell Us What You Need" : "Cuéntenos qué necesita";
    await page.goto(`${prefix}/`);
    await expect(
      page.locator(".home-hero").getByRole("link", { name: general }),
    ).toHaveAttribute("href", `${prefix}/contact`);
    await expect(
      page.locator(".home-final").getByRole("link", { name: general }),
    ).toHaveAttribute("href", `${prefix}/contact`);
    await expect(page.locator(".site-header a.header-cta")).toHaveText(general);
    await expect(page.locator(".site-header a.header-cta")).toHaveAttribute(
      "href",
      `${prefix}/contact`,
    );

    // service-specific labels, each preselecting its own service
    const expected = {
      en: {
        "individuals/tax-preparation": [
          "Request Tax Preparation",
          "individual-tax",
        ],
        "individuals/notary-document-services": [
          "Request a Notary Appointment",
          "individual-notary",
        ],
        "individuals/translation-services": [
          "Request a Translation",
          "individual-translation",
        ],
        "individuals/apostille-services": [
          "Request Apostille Support",
          "individual-apostille",
        ],
        "businesses/advisory-optimization": [
          "Start a Conversation",
          "business-advisory",
        ],
        "businesses/operations-implementation": [
          "Request Operations Support",
          "business-operations",
        ],
        "businesses/readiness-growth": [
          "Request Business Foundation Support",
          "business-readiness",
        ],
        "businesses/bookkeeping-financial-reporting": [
          "Request Bookkeeping Support",
          "business-bookkeeping",
        ],
        "businesses/payroll-processing": [
          "Request Payroll Support",
          "business-payroll",
        ],
        "businesses/business-tax-support": [
          "Request Business Tax Support",
          "business-financial",
        ],
      },
      es: {
        "individuals/tax-preparation": [
          "Solicitar preparación de impuestos",
          "individual-tax",
        ],
        "individuals/notary-document-services": [
          "Solicitar una cita notarial",
          "individual-notary",
        ],
        "individuals/translation-services": [
          "Solicitar una traducción",
          "individual-translation",
        ],
        "individuals/apostille-services": [
          "Solicitar apoyo para apostilla",
          "individual-apostille",
        ],
        "businesses/advisory-optimization": [
          "Iniciar una conversación",
          "business-advisory",
        ],
        "businesses/operations-implementation": [
          "Solicitar apoyo de operaciones",
          "business-operations",
        ],
        "businesses/readiness-growth": [
          "Solicitar apoyo para las bases del negocio",
          "business-readiness",
        ],
        "businesses/bookkeeping-financial-reporting": [
          "Solicitar apoyo de teneduría de libros",
          "business-bookkeeping",
        ],
        "businesses/payroll-processing": [
          "Solicitar apoyo de nómina",
          "business-payroll",
        ],
        "businesses/business-tax-support": [
          "Solicitar apoyo tributario empresarial",
          "business-financial",
        ],
      },
    }[code];
    for (const [slug, [label, key]] of Object.entries(expected)) {
      await page.goto(`${prefix}/services/${slug}`);
      const hero = page.locator(".editorial-service-actions a.button").first();
      await expect(hero, slug).toHaveText(label);
      await expect(hero, slug).toHaveAttribute(
        "href",
        `${prefix}/contact?service=${key}`,
      );
    }
    await page.goto(`${prefix}/web-digital`);
    await expect(page.locator(".webx-actions a.button")).toHaveText(
      code === "en" ? "Discuss Your Project" : "Converse sobre su proyecto",
    );
  });

  test(`${code}: Why Alchemize gives the five reasons and keeps connected support`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/why-alchemize`);
    const hero = page.locator(".why-hero");
    await expect(hero).toContainText(
      code === "en"
        ? "A newer company backed by established experience."
        : "Una empresa nueva respaldada por experiencia establecida.",
    );
    await expect(
      hero.getByRole("link", {
        name: code === "en" ? "Meet the Founder" : "Conozca a la fundadora",
      }),
    ).toHaveAttribute("href", `${prefix}/resources/meet-the-founder`);
    // connected support (examples), advice + implementation (four roles), capability + scope
    await expect(page.locator(".why-problem h2")).toHaveText(
      code === "en"
        ? "Business problems rarely stay in one lane."
        : "Los problemas empresariales rara vez se quedan en un solo carril.",
    );
    await expect(page.locator(".why-problem .eyebrow")).toHaveText(
      code === "en" ? "Connected support" : "Apoyo conectado",
    );
    await expect(page.locator(".why-sequence li")).toHaveCount(3);
    await expect(page.locator(".why-approach-steps article")).toHaveCount(4);
    await expect(page.locator(".why-approach-role")).toHaveText(
      code === "en"
        ? [
            "Diagnose + advise",
            "Build + improve",
            "Do defined work",
            "Build + connect",
          ]
        : [
            "Diagnosticar + asesorar",
            "Construir + mejorar",
            "Hacer trabajo definido",
            "Construir + conectar",
          ],
    );
    await expect(page.locator(".why-principle-list article")).toHaveCount(2);
    // the generic principles were replaced, not stacked underneath
    await expect(page.locator("body")).not.toContainText(
      /Practical solutions|Professional care|Professional continuity|Soluciones prácticas|Atención profesional|Continuidad profesional/,
    );
    // implementation is never assumed inside advisory
    await expect(page.locator(".why-approach-note")).toContainText(
      code === "en"
        ? "never assumed inside an advisory engagement"
        : "nunca se da por incluida",
    );
  });

  test(`${code}: Founder page keeps MBA + 15+ years + business/digital and makes the experience specific`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/resources/meet-the-founder`);
    await expect(page.locator(".founder-credential-line")).toHaveText(
      code === "en"
        ? "MBA · 15+ Years of Professional Experience · Business & Digital"
        : "MBA · Más de 15 años de experiencia profesional · Negocios y digital",
    );
    await expect(page.locator(".founder-capability")).toHaveCount(4);
    const body = await text(page);
    for (const term of code === "en"
      ? ["CRM", "automation", "intranet", "e-commerce", "workflow"]
      : [
          "CRM",
          "automatización",
          "intranet",
          "comercio electrónico",
          "flujos de trabajo",
        ]) {
      expect(body.toLowerCase()).toContain(term.toLowerCase());
    }
    // chronology: experience, then business education, then technical study, then Alchemize
    expect(body).toContain(
      code === "en"
        ? "Alchemize is the newer company; that experience was developed before and alongside it."
        : "Alchemize es la empresa nueva; esa experiencia se desarrolló antes y durante su creación.",
    );
    expect(body).toContain(
      code === "en"
        ? "predates her formal UX and web-development study"
        : "es anterior a sus estudios formales de UX y desarrollo web",
    );
    expect(body).toContain(
      code === "en"
        ? "built on the professional background already in place"
        : "se apoyaron en la trayectoria profesional que ya tenía",
    );
    // the story of why Alchemize exists is present
    await expect(page.locator(".founder-approach h2")).toHaveText(
      code === "en"
        ? "Business problems rarely stay in one lane."
        : "Los problemas empresariales rara vez se quedan en un solo carril.",
    );
    await expect(page.locator(".founder-cta-actions a.button")).toHaveText(
      code === "en" ? "Tell Us What You Need" : "Cuéntenos qué necesita",
    );
  });

  test(`${code}: Web & Digital connects the offering to prior business-systems experience`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/web-digital`);
    const origin = page.locator(".webx-positioning");
    await expect(origin.locator("h2")).toHaveText(
      code === "en"
        ? "Built through real business use."
        : "Desarrollada en el uso empresarial real.",
    );
    const body = await origin.textContent();
    for (const term of code === "en"
      ? ["CRM", "intranet", "e-commerce", "Jessy Santos"]
      : ["CRM", "intranet", "comercio electrónico", "Jessy Santos"])
      expect(body.toLowerCase()).toContain(term.toLowerCase());
    // prior experience is business-systems understanding; technical execution is current capability
    await expect(page.locator(".webx-solutions")).toContainText(
      code === "en"
        ? "Business-systems experience informs the scoping; technical execution relies on current development capability."
        : "La experiencia en sistemas empresariales orienta la definición del alcance; la ejecución técnica se apoya en la capacidad de desarrollo actual.",
    );
    // the lifecycle and the six capability panels are intact
    await expect(page.locator(".webx-lifecycle-stages li")).toHaveCount(4);
    await expect(page.locator(".webx-panel")).toHaveCount(6);
  });

  test(`${code}: Services overview is a routing interface with problem-oriented cards`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/services`);
    await expect(page.locator(".services-hero h1, h1").first()).toHaveText(
      code === "en"
        ? "Start with what you need."
        : "Comience con lo que necesita.",
    );
    const individual = await page
      .locator("#individuals-panel a.service-row > .service-row-copy > p")
      .allTextContents();
    expect(individual.length).toBeGreaterThanOrEqual(3);
    await page.goto(`${prefix}/services#businesses`);
    const biz = await page
      .locator(
        "#businesses-panel a.service-row > .service-row-copy > p, #businesses-panel .service-group-descriptor",
      )
      .allTextContents();
    expect(biz.length).toBeGreaterThanOrEqual(5);
    // each card leads with the visitor's need (a question or "when ...") and stays short
    for (const line of [...individual, ...biz]) {
      expect(line.split(/\s+/).length, line).toBeLessThanOrEqual(34);
      expect(line, line).toMatch(
        code === "en" ? /\?|^When /i : /[?¿]|^Cuando /i,
      );
    }
    await expect(page.locator("body")).not.toContainText(/\$\s?\d/);
  });

  test(`${code}: Contact sets expectations without a response-time promise`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/contact`);
    await expect(page.locator("h1")).toHaveText(
      code === "en"
        ? "Start with the problem, not the service."
        : "Comience con el problema, no con el servicio.",
    );
    await expect(page.locator(".contact-aside ol li")).toHaveCount(3);
    await expect(page.locator(".contact-aside ol li strong")).toHaveText(
      code === "en"
        ? [
            "Tell us what's going on",
            "We review the request",
            "We identify the next step",
          ]
        : [
            "Cuéntenos qué está pasando",
            "Revisamos la solicitud",
            "Identificamos el siguiente paso",
          ],
    );
    await expect(page.locator(".contact-aside-note")).toHaveText(
      code === "en"
        ? "Alchemize will review your request and follow up using the contact information provided."
        : "Alchemize revisará su solicitud y se comunicará con usted usando la información de contacto que proporcionó.",
    );
    await expect(page.locator("body")).not.toContainText(/24 (hours|horas)/i);
  });

  test(`${code}: Advisory, Foundation, Operations and Bookkeeping carry one line of experience proof; others do not`, async ({
    page,
  }) => {
    const withProof = [
      "businesses/advisory-optimization",
      "businesses/readiness-growth",
      "businesses/operations-implementation",
      "businesses/bookkeeping-financial-reporting",
    ];
    for (const slug of withProof) {
      await page.goto(`${prefix}/services/${slug}`);
      const proof = page.locator(".editorial-service-proof");
      await expect(proof, slug).toHaveCount(1);
      await expect(proof, slug).toContainText("Jessy Santos");
      await expect(proof.getByRole("link"), slug).toHaveAttribute(
        "href",
        `${prefix}/resources/meet-the-founder`,
      );
      // no credentials that are not held
      await expect(proof, slug).not.toContainText(
        /CPA|licens|licencia|certified|certificad/i,
      );
    }
    // document and regulated services get process-based trust, not corporate credentials
    for (const slug of [
      "individuals/notary-document-services",
      "individuals/translation-services",
      "individuals/apostille-services",
      "individuals/tax-preparation",
      "businesses/business-tax-support",
      "businesses/payroll-processing",
    ]) {
      await page.goto(`${prefix}/services/${slug}`);
      await expect(page.locator(".editorial-service-proof"), slug).toHaveCount(
        0,
      );
      await expect(page.locator("article").first(), slug).not.toContainText(
        /\bMBA\b/,
      );
    }
  });

  test(`${code}: footer states what Alchemize does, without credentials or sales claims`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/`);
    const footer = page.getByRole("contentinfo");
    await expect(footer.locator(".footer-descriptor")).toHaveText(
      code === "en"
        ? "Business operations · financial organization · documents · digital solutions"
        : "Operaciones empresariales · organización financiera · documentos · soluciones digitales",
    );
    await expect(footer).not.toContainText(
      /\bMBA\b|15\+|más de 15|testimonial|award/i,
    );
  });
}

test("each resource ends with one contextual path to the matching service, in both languages", async ({
  page,
}) => {
  const expected = {
    "preparing-for-tax-season": [
      "Explore Tax Preparation",
      "/services/individuals/tax-preparation",
    ],
    "tax-records-what-to-keep": [
      "Explore Tax Preparation",
      "/services/individuals/tax-preparation",
    ],
    "estimated-taxes-questions": [
      "Explore Tax Preparation",
      "/services/individuals/tax-preparation",
    ],
    "professional-website-design-process": [
      "Explore Web & Digital Solutions",
      "/web-digital",
    ],
    "digital-presence-audit": [
      "Explore Web & Digital Solutions",
      "/web-digital",
    ],
    "seo-and-website-metadata": [
      "Explore Web & Digital Solutions",
      "/web-digital",
    ],
    "hostinger-for-small-business-websites": [
      "Explore Web & Digital Solutions",
      "/web-digital",
    ],
    "api-integrations-for-small-business": [
      "Explore Web & Digital Solutions",
      "/web-digital",
    ],
    "starting-a-business-organization-checklist": [
      "Explore Business Foundation",
      "/services/businesses/readiness-growth",
    ],
    "your-first-year-in-business": [
      "Explore Business Foundation",
      "/services/businesses/readiness-growth",
    ],
    "business-formation-information-to-gather": [
      "Explore Business Foundation",
      "/services/businesses/readiness-growth",
    ],
    "business-needs-a-process": [
      "Explore Operations & Administration",
      "/services/businesses/operations-implementation",
    ],
    "simple-administrative-system": [
      "Explore Operations & Administration",
      "/services/businesses/operations-implementation",
    ],
    "building-a-business-deadline-calendar": [
      "Explore Operations & Administration",
      "/services/businesses/operations-implementation",
    ],
    "business-records-what-needs-a-home": [
      "Explore Bookkeeping",
      "/services/businesses/bookkeeping-financial-reporting",
    ],
  };
  for (const [slug, [label, route]] of Object.entries(expected)) {
    await page.goto(`/resources/${slug}`);
    const path = page.locator(".resource-service-path");
    await expect(path, slug).toHaveCount(1);
    await expect(path, slug).toContainText(
      "Need help putting this into practice?",
    );
    await expect(path.getByRole("link"), slug).toHaveText(label);
    await expect(path.getByRole("link"), slug).toHaveAttribute("href", route);
    // one restrained path: nothing else in the article body sells
    await expect(
      page.locator(".resource-article-body .button-primary"),
    ).toHaveCount(0);
  }
  await page.goto("/es/resources/preparing-for-tax-season");
  const es = page.locator(".resource-service-path");
  await expect(es).toContainText("¿Necesita ayuda para ponerlo en práctica?");
  await expect(es.getByRole("link")).toHaveAttribute(
    "href",
    "/es/services/individuals/tax-preparation",
  );
});

test("materially changed pages have no serious accessibility violations and no overflow", async ({
  page,
}) => {
  // nine pages at three widths, with axe at the widest: allow for a loaded runner
  test.setTimeout(120_000);
  const paths = [
    "/",
    "/why-alchemize",
    "/resources/meet-the-founder",
    "/services",
    "/web-digital",
    "/contact",
    "/es",
    "/es/why-alchemize",
    "/es/resources/meet-the-founder",
  ];
  for (const width of [390, 834, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of paths) {
      await page.goto(path);
      await page.addStyleTag({
        content:
          ".reveal{transition:none!important;opacity:1!important;transform:none!important}",
      });
      await page.waitForTimeout(150);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
        `${path} @${width}`,
      ).toBe(false);
      if (width === 1440) {
        const results = await new AxeBuilder({ page }).analyze();
        expect(
          results.violations
            .filter(
              ({ impact }) => impact === "serious" || impact === "critical",
            )
            .map(({ id }) => id),
          path,
        ).toEqual([]);
      }
    }
  }
});
