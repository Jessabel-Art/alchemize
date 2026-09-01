import { ArrowRight, Download } from "lucide-react";
import Reveal from "../ui/Reveal.jsx";
import LocalizedLink from "../../i18n/LocalizedLink.jsx";

const shared = {
  en: {
    services: "Services",
    context: "Why it matters",
    scope: "What we handle",
    approach: "Working method",
    preparation: "What to bring",
    boundary: "Scope and boundaries",
    related: "Related services",
    resources: "Useful resources",
    consultation: "Schedule a Consultation",
    information: "Request Information",
    download: "Download the preparation checklist",
    close: "Discuss the work",
    closeBody:
      "Share the current situation, timing, and desired outcome. Alchemize will confirm fit, scope, and the appropriate next step before work begins.",
  },
  es: {
    services: "Servicios",
    context: "Por qué importa",
    scope: "Lo que manejamos",
    approach: "Método de trabajo",
    preparation: "Qué traer",
    boundary: "Alcance y límites",
    related: "Servicios relacionados",
    resources: "Recursos útiles",
    consultation: "Programar una consulta",
    information: "Solicitar información",
    download: "Descargar la lista de preparación",
    close: "Conversemos sobre el trabajo",
    closeBody:
      "Comparta la situación actual, los plazos y el resultado deseado. Alchemize confirmará la compatibilidad, el alcance y el siguiente paso antes de comenzar.",
  },
};

const profiles = {
  "individual-tax": {
    type: "project",
    number: "01",
    motif: "document-stack",
    watermark: "Return",
    mark: ["Records", "Review", "Return"],
    hero: { en: "Prepare before filing.", es: "Prepárese antes de declarar." },
    contextTitle: {
      en: "A return begins with the record behind it.",
      es: "La declaración comienza con sus registros.",
    },
    second: {
      en: "The work is easier to review when income documents, deductions, prior-year information, and open questions are gathered before preparation begins.",
      es: "El trabajo se revisa mejor cuando los ingresos, deducciones, datos del año anterior y preguntas pendientes se reúnen antes de comenzar.",
    },
    scopeTitle: {
      en: "Return preparation",
      es: "Preparación de declaraciones",
    },
  },
  "individual-notary": {
    type: "project",
    number: "02",
    motif: "document-frame",
    watermark: "Witness",
    mark: ["Document", "Identity", "Act"],
    hero: {
      en: "Prepare the document first.",
      es: "Prepare primero el documento.",
    },
    contextTitle: {
      en: "The appointment is one part of the process.",
      es: "La cita es solo una parte del proceso.",
    },
    second: {
      en: "The document, signer, identification, receiving-party requirements, and requested notarial act all need to align. Alchemize handles the authorized notarial step without selecting forms or interpreting legal effect.",
      es: "El documento, el firmante, la identificación, los requisitos del destinatario y el acto notarial deben coincidir. Alchemize realiza el acto autorizado sin seleccionar formularios ni interpretar efectos legales.",
    },
    scopeTitle: { en: "Appointment support", es: "Apoyo para la cita" },
  },
  "individual-translation": {
    type: "project",
    number: "03",
    motif: "language-lines",
    watermark: "Clarity",
    mark: ["Source", "Meaning", "Delivery"],
    hero: { en: "Make the document clear.", es: "Haga claro el documento." },
    contextTitle: {
      en: "Meaning, format, and purpose travel together.",
      es: "El significado, el formato y el propósito van juntos.",
    },
    second: {
      en: "A useful translation preserves the source meaning while accounting for the document’s audience and intended use. The destination organization may still set its own certification, formatting, or acceptance requirements.",
      es: "Una traducción útil conserva el significado y considera la audiencia y el uso previsto. La organización receptora puede establecer requisitos propios de certificación, formato o aceptación.",
    },
    scopeTitle: { en: "Translation work", es: "Trabajo de traducción" },
  },
  "individual-apostille": {
    type: "project",
    number: "04",
    motif: "route-path",
    watermark: "Destination",
    mark: ["Document", "Authority", "Destination"],
    hero: {
      en: "Prepare it for its destination.",
      es: "Prepárelo para su destino.",
    },
    contextTitle: {
      en: "International use adds another layer of requirements.",
      es: "El uso internacional añade otra capa de requisitos.",
    },
    second: {
      en: "Alchemize facilitates the North Carolina process and helps organize the document path. The appropriate government authority—not Alchemize—controls processing, issuance, and timing.",
      es: "Alchemize facilita el proceso de Carolina del Norte y ayuda a organizar la ruta documental. La autoridad gubernamental correspondiente controla el trámite, la emisión y los plazos.",
    },
    scopeTitle: {
      en: "Facilitation and coordination",
      es: "Facilitación y coordinación",
    },
  },
  "business-advisory": {
    type: "advisory",
    number: "05",
    motif: "direction-nodes",
    watermark: "Direction",
    mark: ["Diagnose", "Prioritize", "Plan"],
    hero: {
      en: "Turn friction into direction.",
      es: "Convierta la fricción en dirección.",
    },
    contextTitle: {
      en: "The visible problem is not always the real constraint.",
      es: "El problema visible no siempre es la limitación real.",
    },
    second: {
      en: "Advisory work examines the decisions, systems, and operating conditions around an issue before recommending action. Analysis and planning are included within the engagement; substantial implementation is scoped separately unless expressly included.",
      es: "La asesoría examina las decisiones, los sistemas y las condiciones operativas antes de recomendar acciones. El análisis y la planificación forman parte del servicio; la implementación sustancial se define por separado salvo inclusión expresa.",
    },
    scopeTitle: { en: "Advisory focus", es: "Enfoque de asesoría" },
  },
  "business-operations": {
    type: "advisory",
    number: "06",
    motif: "workflow-map",
    watermark: "Systems",
    mark: ["Workflow", "System", "Adoption"],
    hero: {
      en: "Make the business easier to run.",
      es: "Facilite la operación del negocio.",
    },
    contextTitle: {
      en: "Operational drag usually lives between the steps.",
      es: "La fricción operativa suele vivir entre los pasos.",
    },
    second: {
      en: "The work connects recommendations to usable workflows, documents, systems, and handoffs. The objective is a change the business can maintain—not a report that sits apart from daily operations.",
      es: "El trabajo conecta las recomendaciones con flujos, documentos, sistemas y entregas utilizables. El objetivo es un cambio que el negocio pueda mantener, no un informe separado de la operación diaria.",
    },
    scopeTitle: {
      en: "Operational implementation",
      es: "Implementación operativa",
    },
  },
  "business-digital": {
    type: "project",
    number: "07",
    motif: "wireframe",
    watermark: "Structure",
    mark: ["Experience", "System", "Visibility"],
    hero: {
      en: "Put digital tools to work.",
      es: "Ponga las herramientas digitales a trabajar.",
    },
    contextTitle: {
      en: "A digital presence should serve an operating purpose.",
      es: "La presencia digital debe cumplir un propósito operativo.",
    },
    second: {
      en: "Websites, search visibility, maintenance, and automation are most useful when they support a defined customer or internal workflow. The right engagement depends on the existing platform, desired outcome, and level of implementation required.",
      es: "Los sitios, la visibilidad, el mantenimiento y la automatización funcionan mejor cuando apoyan un flujo definido. El servicio adecuado depende de la plataforma actual, el resultado deseado y la implementación requerida.",
    },
    scopeTitle: { en: "Digital work", es: "Trabajo digital" },
  },
  "business-readiness": {
    type: "advisory",
    number: "08",
    motif: "grid-foundation",
    watermark: "Foundation",
    mark: ["Foundation", "Readiness", "Opportunity"],
    hero: {
      en: "Build the foundation first.",
      es: "Construya primero la base.",
    },
    contextTitle: {
      en: "Opportunity exposes what the business has not organized.",
      es: "La oportunidad revela lo que falta organizar.",
    },
    second: {
      en: "Formation records, planning materials, financial assumptions, registrations, and supporting documents need to tell a consistent story. Readiness work organizes that foundation for growth and external review without promising financing, certification, or acceptance.",
      es: "Los registros, planes, supuestos financieros, inscripciones y documentos deben contar una historia coherente. El trabajo de preparación organiza esa base sin prometer financiamiento, certificación ni aceptación.",
    },
    scopeTitle: { en: "Readiness work", es: "Trabajo de preparación" },
  },
  "business-bookkeeping": {
    type: "managed",
    number: "09",
    motif: "ledger-grid",
    watermark: "Records",
    mark: ["Record", "Reconcile", "Report"],
    hero: {
      en: "Know where the business stands.",
      es: "Sepa dónde está el negocio.",
    },
    contextTitle: {
      en: "Reliable records make better decisions possible.",
      es: "Los registros confiables permiten mejores decisiones.",
    },
    second: {
      en: "A recurring rhythm keeps transactions categorized, accounts reconciled, and reporting current. It also makes year-end coordination easier because the supporting record has been maintained throughout the year.",
      es: "Un ritmo recurrente mantiene las transacciones categorizadas, las cuentas conciliadas y los reportes al día. También facilita el cierre anual porque el registro se mantiene durante todo el año.",
    },
    scopeTitle: { en: "Ongoing bookkeeping", es: "Contabilidad continua" },
  },
  "business-payroll": {
    type: "managed",
    number: "10",
    motif: "cycle-rhythm",
    watermark: "Cadence",
    mark: ["Input", "Process", "Record"],
    hero: {
      en: "Keep payroll moving reliably.",
      es: "Mantenga la nómina en movimiento.",
    },
    contextTitle: {
      en: "Payroll depends on disciplined inputs and timing.",
      es: "La nómina depende de datos y tiempos disciplinados.",
    },
    second: {
      en: "Employee information, hours, deductions, approvals, and platform records need a repeatable path each cycle. Alchemize administers that process through the applicable payroll platform while the platform retains its tax filing and deposit functions.",
      es: "La información del personal, las horas, deducciones, aprobaciones y registros necesitan una ruta repetible en cada ciclo. Alchemize administra el proceso mediante la plataforma correspondiente, que conserva las funciones de declaración y depósito.",
    },
    scopeTitle: {
      en: "Payroll administration",
      es: "Administración de nómina",
    },
  },
  "business-financial": {
    type: "project",
    number: "11",
    motif: "calendar-grid",
    watermark: "Deadline",
    mark: ["Records", "Deadline", "Filing"],
    hero: {
      en: "Prepare before filing season.",
      es: "Prepárese antes de la temporada fiscal.",
    },
    contextTitle: {
      en: "Tax work is easier when the business record is ready.",
      es: "El trabajo tributario mejora cuando los registros están listos.",
    },
    second: {
      en: "Entity records, income, expenses, payroll information, prior filings, and deadlines need to be reviewed together. Early organization makes missing information and matters requiring specialized advice easier to identify.",
      es: "Los registros de la entidad, ingresos, gastos, nómina, declaraciones anteriores y fechas deben revisarse en conjunto. La organización temprana ayuda a identificar faltantes y asuntos que requieren asesoría especializada.",
    },
    scopeTitle: {
      en: "Business tax preparation",
      es: "Preparación tributaria empresarial",
    },
  },
};

function LinkRows({ items }) {
  return (
    <div className="editorial-service-links">
      {items.slice(0, 2).map(([label, to]) => (
        <LocalizedLink key={label} to={to}>
          <span>{label}</span>
          <ArrowRight aria-hidden="true" />
        </LocalizedLink>
      ))}
    </div>
  );
}

function ServiceMotif({ profile, type = "default" }) {
  const motifs = {
    "ledger-grid": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--ledger"
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <path d="M72 118H446" opacity="0.32" />
          <path d="M72 156H446" opacity="0.2" />
          <path d="M72 194H446" opacity="0.2" />
          <path d="M72 232H446" opacity="0.2" />
          <path d="M168 70V290" opacity="0.22" />
          <path d="M260 70V290" opacity="0.22" />
          <path d="M352 70V290" opacity="0.22" />
        </g>
      </svg>
    ),
    "cycle-rhythm": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--cycle"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <circle cx="160" cy="180" r="74" opacity="0.25" />
          <circle cx="330" cy="180" r="76" opacity="0.25" />
          <path
            d="M160 106V54M160 254v52M330 104V52M330 256v52"
            opacity="0.35"
          />
          <path d="M234 180h52M268 144v72" opacity="0.35" />
        </g>
      </svg>
    ),
    "direction-nodes": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--direction"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <path d="M118 246L226 178L312 206L420 118" opacity="0.4" />
          <circle cx="118" cy="246" r="12" opacity="0.35" />
          <circle cx="226" cy="178" r="12" opacity="0.35" />
          <circle cx="312" cy="206" r="12" opacity="0.35" />
          <circle cx="420" cy="118" r="12" opacity="0.35" />
        </g>
      </svg>
    ),
    "workflow-map": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--workflow"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <rect x="94" y="88" width="104" height="76" rx="10" opacity="0.26" />
          <rect x="316" y="84" width="118" height="82" rx="10" opacity="0.26" />
          <rect
            x="188"
            y="206"
            width="150"
            height="72"
            rx="10"
            opacity="0.24"
          />
          <path d="M198 126h118M314 126l2 80M246 206V126" opacity="0.38" />
        </g>
      </svg>
    ),
    "grid-foundation": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--grid"
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <path
            d="M88 86H432M88 146H432M88 206H432M88 266H432"
            opacity="0.28"
          />
          <path
            d="M128 70V292M212 70V292M296 70V292M380 70V292"
            opacity="0.22"
          />
        </g>
      </svg>
    ),
    "language-lines": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--language"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <path d="M92 118H428M92 186H428M92 254H428" opacity="0.28" />
          <path d="M188 82v196M332 82v196" opacity="0.25" />
          <path
            d="M120 118l54 68M208 186l54-68M294 118l54 68M382 186l-54-68"
            opacity="0.4"
          />
        </g>
      </svg>
    ),
    "document-frame": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--document"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <rect
            x="132"
            y="74"
            width="250"
            height="210"
            rx="16"
            opacity="0.26"
          />
          <path
            d="M170 126h170M170 162h132M170 198h148M170 234h112"
            opacity="0.38"
          />
          <circle cx="336" cy="146" r="32" opacity="0.22" />
        </g>
      </svg>
    ),
    "document-stack": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--document-stack"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <path d="M148 90h194l36 40v118H148V90Z" opacity="0.18" />
          <path
            d="M176 122h184M176 156h134M176 190h148M176 224h146"
            opacity="0.38"
          />
          <path d="M118 220l30-16v98l-30 16z" opacity="0.18" />
          <path d="M366 112l30 18v114l-30-18z" opacity="0.18" />
        </g>
      </svg>
    ),
    "route-path": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--route"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <path
            d="M110 246c40-46 88-72 145-80 53-7 96 12 161 78"
            opacity="0.35"
          />
          <circle cx="110" cy="246" r="12" opacity="0.3" />
          <circle cx="254" cy="166" r="12" opacity="0.3" />
          <circle cx="415" cy="244" r="12" opacity="0.3" />
          <path d="M180 118h110M220 118v54" opacity="0.24" />
        </g>
      </svg>
    ),
    "calendar-grid": (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--calendar"
      >
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          <path d="M110 110h290M110 174h290M110 238h290" opacity="0.28" />
          <path
            d="M150 90V270M218 90V270M286 90V270M354 90V270"
            opacity="0.2"
          />
          <path d="M164 134h40M228 198h40M292 162h40" opacity="0.34" />
        </g>
      </svg>
    ),
    wireframe: (
      <svg
        viewBox="0 0 520 360"
        aria-hidden="true"
        className="service-motif service-motif--wireframe"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <rect x="94" y="82" width="332" height="192" rx="14" opacity="0.2" />
          <path
            d="M130 112h42M130 146h110M130 180h92M130 214h126"
            opacity="0.38"
          />
          <rect x="282" y="110" width="108" height="66" rx="8" opacity="0.18" />
          <rect x="282" y="190" width="108" height="50" rx="8" opacity="0.18" />
          <path d="M196 256h122" opacity="0.25" />
        </g>
      </svg>
    ),
  };

  return (
    <div className="service-motif-wrap">
      {motifs[profile.motif || type] || motifs["default"]}
    </div>
  );
}

function HeroMark({ profile, Icon }) {
  return (
    <Reveal className="editorial-service-mark" delay={100}>
      <span>{profile.number}</span>
      <Icon aria-hidden="true" strokeWidth={1.05} />
      <div>
        {profile.mark.map((word) => (
          <i key={word}>{word}</i>
        ))}
      </div>
      <ServiceMotif profile={profile} />
    </Reveal>
  );
}

function Scope({ service, profile, language, labels }) {
  const items = service.helps.slice(0, 6);
  const midpoint = Math.ceil(items.length / 2);
  const scopeBody = {
    advisory: {
      en: "The engagement is shaped around the issue at hand, with the maintained service scope defining where analysis, planning, and implementation can begin.",
      es: "El servicio se define alrededor del asunto principal, con el alcance vigente como punto de partida para el análisis, la planificación y la implementación.",
    },
    managed: {
      en: "Recurring work is established around the selected service level, the condition of the current records, and the operating cadence the business needs.",
      es: "El trabajo recurrente se establece según el nivel de servicio, el estado de los registros actuales y el ritmo operativo que necesita el negocio.",
    },
    project: {
      en: "The final scope follows the document or project requirements, the available source material, and the standards of the receiving party.",
      es: "El alcance final depende de los requisitos del documento o proyecto, el material disponible y las normas de la parte receptora.",
    },
  };
  return (
    <section className="editorial-service-scope">
      <div className="content-shell editorial-service-scope-grid">
        <Reveal>
          <span className="eyebrow eyebrow--gold">{labels.scope}</span>
          <h2>{profile.scopeTitle[language]}</h2>
          <p>{scopeBody[profile.type][language]}</p>
        </Reveal>
        <div className="editorial-service-scope-columns">
          {[items.slice(0, midpoint), items.slice(midpoint)].map(
            (group, index) => (
              <ul key={index}>
                {group.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function ServiceSpecific({ service, profile, language, labels }) {
  if (profile.type === "project") {
    return (
      <section className="editorial-service-specific editorial-service-specific--project">
        <div className="content-shell editorial-service-specific-grid">
          <Reveal>
            <span className="eyebrow">{labels.preparation}</span>
            <h2>
              {language === "es"
                ? "Prepare el material antes de comenzar."
                : "Prepare the material before work begins."}
            </h2>
            <p>
              {language === "es"
                ? "No necesita resolver cada pregunta antes de comunicarse. Los documentos disponibles ayudan a confirmar el alcance y detectar requisitos pendientes."
                : "You do not need to resolve every question before reaching out. The available documents help confirm scope and identify requirements that still need attention."}
            </p>
            <a
              className="text-link"
              href={service.checklist[1]}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download aria-hidden="true" /> {labels.download}
            </a>
          </Reveal>
          <div className="editorial-service-prepare-panel">
            <ServiceMotif profile={profile} />
            <ul>
              {service.prepare.slice(0, 5).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section
      className={`editorial-service-specific editorial-service-specific--${profile.type}`}
    >
      <div className="content-shell">
        <div className="editorial-service-specific-heading">
          <span className="eyebrow eyebrow--gold">
            {profile.type === "managed"
              ? language === "es"
                ? "Ritmo continuo"
                : "Ongoing cadence"
              : labels.approach}
          </span>
          <h2>
            {profile.type === "managed"
              ? language === "es"
                ? "Un proceso que se repite con disciplina."
                : "A process designed to repeat."
              : language === "es"
                ? "De la evaluación a la acción definida."
                : "From assessment to defined action."}
          </h2>
        </div>
        <ol className="editorial-service-process">
          {service.process.map(([name, description], index) => (
            <li key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{name}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function EditorialServicePage({ service, ui, language }) {
  const profile = profiles[service.serviceKey];
  const labels = shared[language] || shared.en;
  const { Icon } = service;
  return (
    <article
      className={`editorial-service editorial-service--${profile.type} editorial-service--${service.serviceKey}`}
    >
      <nav
        className="content-shell service-breadcrumb"
        aria-label={ui.breadcrumb}
      >
        <LocalizedLink to="/services">{labels.services}</LocalizedLink>
        <span aria-hidden="true">/</span>
        <LocalizedLink to={`/services/#${service.audience}`}>
          {service.audienceLabel}
        </LocalizedLink>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{service.title}</span>
      </nav>
      <section
        className={`editorial-service-hero editorial-service-hero--${profile.motif || "default"}`}
      >
        <div className="content-shell editorial-service-hero-grid">
          <Reveal>
            <span className="eyebrow eyebrow--gold">{service.title}</span>
            <h1>{profile.hero[language]}</h1>
            <p>{service.seoDescription || service.overview}</p>
            <div className="editorial-service-actions">
              <LocalizedLink
                className="button button-primary"
                to={`/contact?service=${service.serviceKey}`}
              >
                {labels.consultation}
              </LocalizedLink>
              <a
                href={service.checklist[1]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download aria-hidden="true" /> {service.checklist[0]}
              </a>
            </div>
          </Reveal>
          <HeroMark profile={profile} Icon={Icon} />
        </div>
      </section>
      <section className="editorial-service-context">
        <div className="content-shell editorial-service-context-grid">
          <Reveal>
            <span className="eyebrow">{labels.context}</span>
            <h2>{profile.contextTitle[language]}</h2>
          </Reveal>
          <Reveal className="editorial-service-context-copy" delay={80}>
            <p>{service.statement}</p>
            <p>{profile.second[language]}</p>
          </Reveal>
        </div>
      </section>
      <Scope
        service={service}
        profile={profile}
        language={language}
        labels={labels}
      />
      <ServiceSpecific
        service={service}
        profile={profile}
        language={language}
        labels={labels}
      />
      <section className="editorial-service-close">
        <div className="content-shell">
          <div className="editorial-service-boundary">
            <span className="eyebrow">{labels.boundary}</span>
            <p>
              <strong>{service.title}</strong> — {service.boundary}
            </p>
          </div>
          {service.status ? (
            <div className="editorial-service-status">
              <strong>{service.status.label}</strong>
              <span>{service.status.value}</span>
              <p>{service.status.text}</p>
            </div>
          ) : null}
          <div className="editorial-service-close-grid">
            <Reveal>
              <span className="eyebrow eyebrow--gold">{labels.close}</span>
              <h2>{service.cta}</h2>
              <p>{labels.closeBody}</p>
              <div>
                <LocalizedLink
                  className="button button-primary"
                  to={`/contact?service=${service.serviceKey}`}
                >
                  {labels.consultation}
                </LocalizedLink>
                <LocalizedLink className="text-link" to="/contact">
                  {labels.information}
                </LocalizedLink>
              </div>
            </Reveal>
            <div className="editorial-service-related">
              <section>
                <h3>{labels.related}</h3>
                <LinkRows items={service.related} />
              </section>
              <section>
                <h3>{labels.resources}</h3>
                <LinkRows items={service.resources} />
              </section>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
