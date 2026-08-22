import { serviceGroups } from "./serviceCatalog.js";

const translations = {
  "tax-preparation": {
    title: "Preparación de impuestos",
    hero: "Prepare su declaración con registros que ya estén organizados a su favor.",
    overview:
      "La preparación de impuestos se complica cuando los comprobantes de ingresos, gastos, datos de años anteriores y preguntas pendientes están dispersos. Alchemize organiza el proceso para que la declaración pueda prepararse desde un punto de partida más claro.",
    statement:
      "Una preparación de impuestos organizada comienza con registros completos, preguntas claras y un proceso que no dependa de buscar documentos a última hora.",
    capabilities: [
      "Preparación de declaraciones federales",
      "Organización de documentos tributarios",
      "Revisión de años anteriores",
      "Registros preparados durante todo el año",
    ],
    for: [
      "Personas asalariadas",
      "Hogares con varias fuentes de ingresos",
      "Trabajadores por cuenta propia",
      "Contribuyentes con cambios desde el año anterior",
      "Clientes que organizan sus registros antes de declarar",
    ],
    helps: [
      "Preparación de declaraciones federales individuales",
      "Preparación de declaraciones estatales donde se ofrezca",
      "Preparación de declaraciones de años anteriores donde se ofrezca",
      "Organización de registros de ingresos y gastos",
      "Organización de pagos estimados",
      "Organización de registros de trabajo por cuenta propia dentro del alcance admitido",
      "Identificación de documentos faltantes",
      "Organización tributaria durante todo el año",
    ],
    situations: [
      "Los comprobantes de ingresos llegan de varias fuentes",
      "Un cambio personal o laboral afectó la declaración",
      "Es necesario revisar información de años anteriores",
      "La falta de documentos está retrasando la preparación",
    ],
    process: [
      [
        "Reunir",
        "Reúna ingresos, gastos, pagos y registros de años anteriores en un solo expediente.",
      ],
      [
        "Revisar",
        "Identifique cambios, documentos faltantes, correcciones y preguntas antes de preparar la declaración.",
      ],
      [
        "Preparar",
        "Prepare la declaración admitida con información organizada y datos confirmados.",
      ],
      [
        "Finalizar",
        "Revise el paquete, resuelva los asuntos pendientes y confirme el siguiente paso.",
      ],
    ],
    prepare: [
      "Comprobantes de ingresos y otras fuentes",
      "Declaraciones federales y estatales del año anterior",
      "Confirmaciones de pagos estimados",
      "Respaldo de gastos y deducciones aplicables",
      "Registros de cambios personales o empresariales importantes",
      "Una lista de documentos faltantes y preguntas",
    ],
    boundary:
      "El tratamiento tributario depende de las circunstancias de cada persona. Alchemize no brinda asesoría legal ni servicios de representación. Los tipos de declaraciones y las jurisdicciones admitidas deben confirmarse antes de contratar el servicio; algunos asuntos pueden requerir un CPA, abogado, agente registrado u otro profesional calificado.",
    related: [
      ["Soluciones de seguros", "/services/individuals/insurance"],
      [
        "Servicios notariales y de documentos",
        "/services/individuals/notary-document-services",
      ],
    ],
    resources: [
      [
        "Cómo prepararse para la temporada de impuestos",
        "/resources/preparing-for-tax-season",
      ],
      [
        "Registros tributarios: qué conservar",
        "/resources/tax-records-what-to-keep",
      ],
      [
        "Impuestos estimados: preguntas importantes",
        "/resources/estimated-taxes-questions",
      ],
    ],
    cta: "¿Listo para organizar el proceso de declaración?",
    checklist: [
      "Lista de preparación de impuestos (PDF en inglés)",
      "/assets/downloads/individual-tax-preparation-checklist.pdf",
    ],
  },
  insurance: {
    title: "Soluciones de seguros",
    hero: "Comprenda la decisión de protección antes de elegir el producto.",
    overview:
      "Las decisiones sobre seguros son más fáciles de evaluar cuando se comprenden en conjunto la necesidad, la estructura de cobertura, el costo, las exclusiones y las opciones disponibles.",
    statement:
      "Comprenda la decisión de protección antes de elegir el producto.",
    capabilities: [
      "Seguro de vida",
      "Seguro de salud",
      "Seguro contra accidentes",
      "Organización de cobertura",
    ],
    for: [
      "Familias con nuevas responsabilidades de protección",
      "Personas que evalúan su cobertura actual",
      "Clientes ante cambios laborales o de beneficios",
      "Personas próximas a ser elegibles para Medicare que necesitan orientación educativa",
    ],
    helps: [
      "Conversación sobre necesidades de cobertura",
      "Revisión de cobertura existente",
      "Explicación de términos de seguros",
      "Opciones de seguro de vida",
      "Opciones de seguro de salud",
      "Cobertura contra accidentes",
      "Organización de beneficiarios y documentos",
      "Apoyo con solicitudes o inscripciones cuando esté autorizado",
    ],
    situations: [
      "Una nueva responsabilidad familiar o de ingresos cambia las necesidades de protección",
      "La cobertura actual es difícil de entender",
      "Es necesario aclarar primas, deducibles o beneficiarios",
      "Las opciones de Medicare requieren una revisión educativa",
    ],
    process: [
      [
        "Identificar",
        "Aclare las personas, responsabilidades y exposición financiera que la cobertura debe atender.",
      ],
      [
        "Organizar",
        "Reúna la cobertura actual, el contexto del hogar, las metas y las preguntas.",
      ],
      [
        "Explorar",
        "Revise estructuras de productos y terminología disponibles cuando existan las licencias y autorizaciones necesarias.",
      ],
      [
        "Decidir",
        "Compare los factores pertinentes y determine el siguiente paso sin presión.",
      ],
    ],
    prepare: [
      "Información de pólizas actuales",
      "Contexto familiar y laboral",
      "Metas de protección",
      "Consideraciones de presupuesto",
      "Proveedores y medicamentos preferidos cuando corresponda",
      "Próximos cambios personales o de cobertura",
      "Preguntas sobre términos o exclusiones",
    ],
    status: {
      label: "Medicare",
      value: "planificado",
      text: "La biblioteca de recursos ofrece educación sobre Medicare. La comparación de planes y la asistencia de inscripción solo se ofrecerán cuando estén vigentes las certificaciones y autorizaciones requeridas de la agencia o las aseguradoras.",
    },
    boundary:
      "La disponibilidad, el precio, la elegibilidad, la evaluación de riesgo, los planes, la participación de aseguradoras y las reglas de inscripción dependen del producto, la aseguradora, la jurisdicción, las autorizaciones y las circunstancias del cliente. Alchemize no está afiliada ni respaldada por el gobierno de Estados Unidos ni por Medicare.",
    related: [
      [
        "Servicios notariales y de documentos",
        "/services/individuals/notary-document-services",
      ],
      ["Preparación de impuestos", "/services/individuals/tax-preparation"],
    ],
    resources: [
      [
        "Conceptos básicos de Medicare",
        "/resources/medicare-basics-coverage-choices",
      ],
      [
        "Períodos de inscripción de Medicare",
        "/resources/medicare-enrollment-periods",
      ],
      [
        "Cómo entender la cobertura de seguros",
        "/resources/understanding-insurance-coverage",
      ],
    ],
    cta: "¿Listo para comprender la decisión de cobertura?",
    checklist: [
      "Lista para la consulta de seguros (PDF en inglés)",
      "/assets/downloads/insurance-consultation-checklist.pdf",
    ],
  },
  "notary-document-services": {
    title: "Servicios notariales y de documentos",
    hero: "Prepare el documento. Verifique los requisitos. Complete correctamente la cita.",
    overview:
      "El trabajo notarial y el apoyo documental son servicios relacionados, pero distintos. Alchemize puede realizar actos notariales autorizados y ayudar a organizar documentos administrativos no legales, sin seleccionar formularios ni interpretar consecuencias legales.",
    statement:
      "Prepare el documento. Verifique los requisitos. Complete correctamente la cita.",
    capabilities: [
      "Notarización tradicional",
      "Preparación documental",
      "Impresión y escaneo",
      "Organización de paquetes",
    ],
    for: [
      "Personas que se preparan para una cita notarial",
      "Clientes que coordinan firmas o testigos",
      "Personas que organizan paquetes de documentos",
      "Empresas que necesitan apoyo administrativo con documentos",
    ],
    helps: [
      "Notarización tradicional donde esté permitida",
      "Preparación de identidad y firma",
      "Impresión, escaneo y copias",
      "Conversión y organización digital de archivos",
      "Preparación de paquetes de documentos",
      "Apoyo con formularios administrativos usando información del cliente",
      "Preparación de paquetes para envío",
      "Revisión administrativa de integridad o formato",
    ],
    situations: [
      "La entidad receptora exige una firma notarizada",
      "Es necesario confirmar requisitos de identificación o testigos",
      "Un paquete requiere impresión, escaneo, conversión o ensamblaje",
      "Los archivos necesitan una estructura confiable de nombres y entrega",
    ],
    process: [
      [
        "Preparar",
        "Confirme el documento, las instrucciones, los firmantes, los testigos y los detalles de la cita.",
      ],
      [
        "Verificar",
        "Complete la identificación y verificación notarial requeridas para el acto permitido.",
      ],
      [
        "Formalizar",
        "Complete firmas, reconocimientos o juramentos en la secuencia requerida.",
      ],
      [
        "Completar",
        "Gestione copias, instrucciones de entrega y registros administrativos según lo acordado.",
      ],
    ],
    prepare: [
      "El documento completo sin firmar, salvo indicación contraria",
      "Identificación aceptable",
      "Todos los firmantes requeridos",
      "Testigos requeridos, si corresponde",
      "Instrucciones de la entidad receptora",
      "Detalles de la cita, ubicación y devolución",
    ],
    status: {
      label: "Servicios notariales electrónicos",
      value: "planificado",
      text: "Se planifican después de completar los requisitos aplicables de certificación y autorización de Carolina del Norte. No se ofrecen citas notariales electrónicas mientras este estado no esté activo.",
    },
    boundary:
      "Alchemize no determina si un documento es legalmente suficiente, no selecciona formularios legales, no redacta lenguaje jurídico, no interpreta consecuencias legales ni brinda asesoría legal. Los requisitos dependen del documento, la entidad receptora, la ley aplicable y la autoridad de la comisión notarial.",
    related: [
      ["Preparación de impuestos", "/services/individuals/tax-preparation"],
      [
        "Preparación y crecimiento empresarial",
        "/services/businesses/readiness-growth",
      ],
    ],
    resources: [
      [
        "Cómo prepararse para una cita notarial",
        "/resources/preparing-for-a-notary-appointment",
      ],
      [
        "Documentos para una consulta (PDF en inglés)",
        "/assets/downloads/alchemize-consultation-document-checklist.pdf",
      ],
    ],
    cta: "¿Necesita preparar correctamente un documento o una notarización?",
    checklist: [
      "Lista de preparación notarial y documental (PDF en inglés)",
      "/assets/downloads/notary-appointment-checklist.pdf",
    ],
  },
  "advisory-optimization": {
    title: "Asesoría y optimización empresarial",
    hero: "Convierta la fricción operativa en un plan práctico de acción.",
    overview:
      "Alchemize revisa la situación actual, identifica dónde fallan la información o las responsabilidades, distingue los síntomas de las causas y crea un plan ordenado de mejora. Cuando la implementación está dentro del alcance, el trabajo puede continuar más allá de las recomendaciones.",
    statement:
      "Identifique qué no funciona, qué está retrasando al negocio y qué debe suceder después.",
    capabilities: [
      "Evaluación operativa",
      "Identificación de brechas de procesos",
      "Definición de prioridades",
      "Planificación de implementación",
    ],
    for: [
      "Emprendedores que saben que algo no funciona",
      "Propietarios que enfrentan fricción operativa recurrente",
      "Empresas en crecimiento que necesitan prioridades más claras",
      "Profesionales independientes que desean formalizar la manera de trabajar",
    ],
    helps: [
      "Evaluación de necesidades y operaciones",
      "Revisión de eficiencia administrativa",
      "Análisis de flujos y brechas de procesos",
      "Evaluación de organización empresarial",
      "Priorización y planes de acción",
      "Revisión de proveedores",
      "Investigación para apoyar decisiones",
      "Planificación de implementación",
      "Asesoría continua cuando se defina en el alcance",
    ],
    situations: [
      "El mismo problema sigue apareciendo",
      "El negocio tiene demasiadas prioridades en competencia",
      "Una decisión necesita investigación y contexto operativo",
      "Existen recomendaciones, pero no un plan de implementación",
    ],
    process: [
      [
        "Evaluar",
        "Documente la situación actual, el resultado deseado, las limitaciones y los puntos de fricción.",
      ],
      [
        "Diagnosticar",
        "Identifique el problema de proceso, información, responsabilidad o herramienta detrás del síntoma.",
      ],
      [
        "Priorizar",
        "Ordene el trabajo según impacto, dependencia, urgencia y capacidad práctica.",
      ],
      [
        "Actuar",
        "Defina los próximos pasos e implemente los cambios admitidos donde Alchemize pueda ayudar.",
      ],
    ],
    prepare: [
      "Descripción del problema y resultado deseado",
      "Flujos, herramientas y proveedores actuales",
      "Ejemplos de errores o demoras recurrentes",
      "Plazos y limitaciones conocidas",
      "Personas responsables del trabajo",
      "Recomendaciones previas o soluciones intentadas",
    ],
    boundary:
      "La asesoría empresarial no sustituye la asesoría legal, contable, tributaria, de inversiones u otra asesoría profesional regulada. Las recomendaciones y el alcance de implementación dependen de la información disponible y del servicio acordado.",
    related: [
      [
        "Operaciones e implementación",
        "/services/businesses/operations-implementation",
      ],
      [
        "Negocios digitales y tecnología",
        "/services/businesses/digital-business-technology",
      ],
    ],
    resources: [
      [
        "Cuándo su negocio necesita un proceso",
        "/resources/business-needs-a-process",
      ],
      [
        "Cómo crear un calendario de fechas empresariales",
        "/resources/building-a-business-deadline-calendar",
      ],
    ],
    cta: "¿No sabe qué está causando la fricción?",
    checklist: [
      "Guía de preparación para asesoría empresarial (PDF en inglés)",
      "/assets/downloads/business-advisory-preparation-guide.pdf",
    ],
  },
  "operations-implementation": {
    title: "Operaciones e implementación empresarial",
    hero: "Una recomendación solo es útil si después el negocio puede operar de otra manera.",
    overview:
      "Alchemize traza el flujo actual, identifica dónde fallan la información o las responsabilidades, documenta los pasos requeridos, asigna responsables y ayuda a poner en práctica el proceso revisado.",
    statement:
      "Construya los sistemas y la estructura administrativa detrás del trabajo.",
    capabilities: [
      "Diseño de flujos",
      "Desarrollo de procedimientos",
      "Sistemas administrativos",
      "Implementación práctica",
    ],
    for: [
      "Propietarios que conservan los procesos en la memoria",
      "Equipos con admisión o seguimiento inconsistentes",
      "Negocios con registros dispersos",
      "Operaciones en crecimiento que necesitan sistemas repetibles",
    ],
    helps: [
      "Configuración de sistemas administrativos",
      "Desarrollo de procedimientos operativos estándar",
      "Diseño e implementación de flujos",
      "Procesos de admisión de clientes",
      "Gestión de registros y estructura documental",
      "Seguimiento de plazos y renovaciones",
      "Formularios y plantillas internas",
      "Flujos de programación y correspondencia",
      "Configuración y organización de CRM",
      "Organización operativa",
      "Apoyo administrativo recurrente cuando se defina",
    ],
    situations: [
      "La información de clientes vive en correos, mensajes y memoria",
      "Las tareas recurrentes no tienen un responsable claro",
      "Los archivos y registros no tienen un lugar confiable",
      "Es necesario implementar un sistema de CRM, admisión, programación o tareas",
    ],
    process: [
      [
        "Trazar",
        "Registre cómo se mueve el trabajo hoy, incluidos traspasos, herramientas, registros y demoras.",
      ],
      [
        "Estructurar",
        "Defina pasos, responsables, estándares e información requerida en cada etapa.",
      ],
      [
        "Implementar",
        "Configure el flujo, las plantillas, los registros y las herramientas de apoyo.",
      ],
      [
        "Mantener",
        "Documente el proceso, establezca un ritmo de revisión y ajústelo cuando cambie el negocio.",
      ],
    ],
    prepare: [
      "Ejemplos del trabajo actual y problemas recurrentes",
      "Formularios, plantillas y procedimientos existentes",
      "Herramientas actuales y propietarios de cuentas",
      "Funciones y responsabilidades",
      "Plazos, renovaciones y traspasos",
      "Resultado o estándar de servicio deseado",
    ],
    boundary:
      "El apoyo operativo se limita al alcance administrativo y de implementación acordado. Los asuntos legales, laborales, contables, de ciberseguridad u otras especialidades pueden requerir otro proveedor calificado.",
    related: [
      [
        "Asesoría y optimización empresarial",
        "/services/businesses/advisory-optimization",
      ],
      [
        "Negocios digitales y tecnología",
        "/services/businesses/digital-business-technology",
      ],
      [
        "Servicios notariales y de documentos",
        "/services/individuals/notary-document-services",
      ],
    ],
    resources: [
      [
        "Un sistema administrativo sencillo",
        "/resources/simple-administrative-system",
      ],
      [
        "Registros empresariales: qué necesita un lugar",
        "/resources/business-records-what-needs-a-home",
      ],
    ],
    cta: "¿Listo para poner el proceso en práctica?",
    checklist: [
      "Lista de organización de operaciones empresariales (PDF en inglés)",
      "/assets/downloads/business-operations-organization-checklist.pdf",
    ],
  },
  "digital-business-technology": {
    title: "Negocios digitales y tecnología",
    hero: "Haga que las herramientas respalden la manera en que el negocio necesita funcionar.",
    overview:
      "La implementación tecnológica comienza con el proceso empresarial. Alchemize ayuda a seleccionar, configurar, conectar y documentar infraestructura digital práctica para que cada herramienta tenga un propósito, un responsable y un lugar claro en el flujo de trabajo.",
    statement:
      "Use la tecnología para apoyar el proceso empresarial, no para complicarlo.",
    capabilities: [
      "Configuración de sitio web y dominio",
      "CRM y admisión",
      "Automatización de flujos",
      "Organización del espacio digital",
    ],
    for: [
      "Empresas que construyen su base digital",
      "Propietarios que reemplazan pasos manuales desconectados",
      "Equipos que implementan sistemas de reservas, admisión, CRM o documentos",
      "Negocios que necesitan definir responsables de sus cuentas digitales",
    ],
    helps: [
      "Configuración o mejora del sitio web empresarial",
      "Configuración de dominio y correo profesional",
      "Sistemas de reservas y programación",
      "Implementación de CRM",
      "Formularios digitales de admisión",
      "Configuración de portales para clientes",
      "Selección y configuración de software empresarial",
      "Automatización e integración de herramientas",
      "Organización de archivos y espacios en la nube",
      "Configuración básica de informes",
      "Inventario de cuentas digitales y proveedores",
    ],
    situations: [
      "El sitio web o correo empresarial no está configurado profesionalmente",
      "La misma información se ingresa en varias herramientas",
      "La programación, admisión y seguimiento no están conectados",
      "Nadie sabe quién administra las cuentas, accesos o proveedores",
    ],
    process: [
      [
        "Evaluar",
        "Defina el proceso, las herramientas actuales, los puntos débiles, los responsables y el resultado deseado.",
      ],
      [
        "Seleccionar",
        "Elija una herramienta adecuada o determine si conviene conservar la actual.",
      ],
      [
        "Configurar",
        "Prepare la estructura, los campos, los permisos, las plantillas y el flujo principal.",
      ],
      [
        "Conectar",
        "Integre los pasos admitidos, documente responsables y muestre al equipo cómo funciona el sistema.",
      ],
    ],
    prepare: [
      "Inventario actual de herramientas y proveedores",
      "Responsables y accesos a cuentas, compartidos de forma segura solo cuando se indique",
      "Descripción del proceso actual",
      "Ejemplos de formularios, correos y registros",
      "Integraciones requeridas",
      "Presupuesto, plazo y usuarios responsables",
    ],
    boundary:
      "Este servicio consiste en implementación de tecnología empresarial; no es TI administrada, desarrollo de software empresarial, pruebas de penetración ni consultoría de ciberseguridad. El trabajo sensible y las integraciones no admitidas pueden requerir un proveedor especializado.",
    related: [
      [
        "Operaciones e implementación",
        "/services/businesses/operations-implementation",
      ],
      [
        "Asesoría y optimización empresarial",
        "/services/businesses/advisory-optimization",
      ],
    ],
    resources: [
      [
        "Cuándo su negocio necesita un proceso",
        "/resources/business-needs-a-process",
      ],
      [
        "Un sistema administrativo sencillo",
        "/resources/simple-administrative-system",
      ],
    ],
    cta: "¿Necesita que sus herramientas trabajen en conjunto?",
    checklist: [
      "Lista de evaluación de sistemas digitales (PDF en inglés)",
      "/assets/downloads/digital-business-systems-assessment-checklist.pdf",
    ],
  },
  "readiness-growth": {
    title: "Preparación y crecimiento empresarial",
    hero: "Construya los registros y la preparación que respaldan la oportunidad.",
    overview:
      "Este trabajo organiza la información, los registros, los planes, las fechas y los documentos de respaldo que una oportunidad puede exigir. La meta es fortalecer el proceso de solicitud o decisión, no prometer una aprobación o adjudicación.",
    statement:
      "Prepare al negocio para su formación, oportunidades, financiamiento, certificaciones y próxima etapa de crecimiento.",
    capabilities: [
      "Preparación para la formación",
      "Preparación para financiamiento",
      "Preparación para contrataciones",
      "Infraestructura para el crecimiento",
    ],
    for: [
      "Emprendedores que se preparan para formar o lanzar un negocio",
      "Empresas que evalúan su preparación para financiamiento",
      "Propietarios que se preparan para registros o certificaciones",
      "Compañías que se organizan para oportunidades gubernamentales o con proveedores",
    ],
    helps: [
      "Preparación administrativa para formación y lanzamiento",
      "Asistencia con EIN dentro del alcance permitido",
      "Listas de lanzamiento y registros fundamentales",
      "Evaluación de preparación para negocios y crecimiento",
      "Preparación para financiamiento y seguimiento de oportunidades",
      "Apoyo con planes de negocio",
      "Preparación de declaraciones de capacidad",
      "Apoyo para certificaciones",
      "Preparación para contratación gubernamental y SAM.gov",
      "Registro de proveedores",
      "Calendario de cumplimiento y preparación documental",
    ],
    situations: [
      "La información de formación y los pasos de lanzamiento están dispersos",
      "Una conversación de financiamiento requiere mejores registros",
      "La preparación para SAM.gov o registros de proveedores necesita coordinación",
      "Una declaración de capacidad o paquete de oportunidad necesita fuentes organizadas",
    ],
    process: [
      [
        "Preparar",
        "Aclare la oportunidad, los requisitos, los datos del negocio y las decisiones que necesitan orientación calificada.",
      ],
      [
        "Organizar",
        "Cree un conjunto confiable de registros e identifique documentos, inscripciones o fechas faltantes.",
      ],
      [
        "Posicionar",
        "Prepare el plan, material de capacidad o paquete de preparación admitido para su audiencia.",
      ],
      [
        "Dar seguimiento",
        "Registre envíos, responsabilidades, renovaciones y trabajo futuro de preparación.",
      ],
    ],
    prepare: [
      "Identidad y propiedad del negocio",
      "Registros de formación e impuestos",
      "Plan de negocio o resumen operativo",
      "Información financiera y de desempeño cuando corresponda",
      "Requisitos de la oportunidad o programa",
      "Plazos, registros y contactos responsables",
    ],
    boundary:
      "Alchemize no garantiza resultados de formación, financiamiento, aprobación de préstamos, subvenciones, certificaciones, validación de SAM.gov, contratos gubernamentales, aceptación de proveedores ni cumplimiento legal. Las decisiones legales, tributarias, crediticias y de contratación pueden requerir terceros calificados.",
    related: [
      [
        "Operaciones e implementación",
        "/services/businesses/operations-implementation",
      ],
      [
        "Negocios digitales y tecnología",
        "/services/businesses/digital-business-technology",
      ],
      [
        "Apoyo financiero y tributario",
        "/services/businesses/financial-tax-support",
      ],
    ],
    resources: [
      ["Su primer año en el negocio", "/resources/your-first-year-in-business"],
      [
        "Información para reunir al formar un negocio",
        "/resources/business-formation-information-to-gather",
      ],
    ],
    cta: "¿Está preparando al negocio para lo que sigue?",
    checklist: [
      "Lista de formación y preparación empresarial (PDF en inglés)",
      "/assets/downloads/business-formation-startup-checklist.pdf",
    ],
  },
  "financial-tax-support": {
    title: "Apoyo financiero y tributario",
    hero: "Cree un proceso confiable de registros antes de que lleguen las fechas de declaración e informes.",
    overview:
      "Alchemize ayuda a organizar registros, movimientos, fechas y pasos de preparación que respaldan la contabilidad y la preparación tributaria. QuickBooks u otra plataforma puede seguir siendo el sistema oficial mientras Alchemize ayuda a que la información sea útil y sostenible.",
    statement:
      "Mantenga organizadas las responsabilidades financieras y tributarias antes de que se vuelvan reactivas.",
    capabilities: [
      "Preparación de impuestos empresariales",
      "Organización contable",
      "Flujos financieros",
      "Preparación de fin de año",
    ],
    for: [
      "Empresas que preparan declaraciones admitidas",
      "Propietarios que ordenan registros contables",
      "Compañías que mejoran flujos de facturas o recibos",
      "Empresas que preparan registros para un CPA o contador",
    ],
    helps: [
      "Preparación de impuestos empresariales para declaraciones admitidas",
      "Organización de documentos tributarios",
      "Organización de pagos estimados",
      "Apoyo y ordenamiento contable",
      "Apoyo con categorización de transacciones",
      "Organización de gastos y recibos",
      "Configuración de cuentas por cobrar y facturación",
      "Seguimiento de fechas financieras",
      "Configuración o apoyo de QuickBooks cuando corresponda",
      "Preparación para un contador o CPA",
      "Preparación de registros de fin de año",
    ],
    situations: [
      "Los registros personales y empresariales no están separados consistentemente",
      "Las transacciones o recibos necesitan organización",
      "Los registros mensuales no están listos para revisión",
      "La temporada de impuestos revela brechas que deben resolverse durante todo el año",
    ],
    process: [
      [
        "Organizar",
        "Reúna cuentas, documentos, recibos, plazos y responsabilidades en un sistema definido.",
      ],
      [
        "Conciliar",
        "Identifique inconsistencias, respaldo faltante y asuntos que requieran confirmación o revisión calificada.",
      ],
      [
        "Preparar",
        "Reúna el expediente admitido para contabilidad, informes o preparación tributaria.",
      ],
      [
        "Mantener",
        "Establezca un ritmo práctico y recurrente para registros, revisión y entrega.",
      ],
    ],
    prepare: [
      "Estados de cuentas bancarias y tarjetas empresariales",
      "Acceso al sistema contable cuando se comparta de forma segura",
      "Registros de ingresos, facturas, gastos y recibos",
      "Declaraciones empresariales del año anterior",
      "Registros de pagos estimados",
      "Resúmenes de nómina o contratistas cuando corresponda",
      "Avisos y fechas de presentación",
    ],
    boundary:
      "Alchemize no es una firma de CPA, auditoría, procesamiento de nómina ni asesoría de inversiones. Los tipos de declaraciones, el nivel de contabilidad, el software admitido y las jurisdicciones deben confirmarse antes de contratar; el trabajo especializado puede requerir un CPA u otro profesional calificado.",
    related: [
      [
        "Operaciones e implementación",
        "/services/businesses/operations-implementation",
      ],
      [
        "Preparación y crecimiento empresarial",
        "/services/businesses/readiness-growth",
      ],
    ],
    resources: [
      [
        "Registros empresariales: qué necesita un lugar",
        "/resources/business-records-what-needs-a-home",
      ],
      [
        "Cómo crear un calendario de fechas empresariales",
        "/resources/building-a-business-deadline-calendar",
      ],
    ],
    cta: "¿Necesita organizar los registros y el proceso financiero?",
    checklist: [
      "Lista de preparación financiera y tributaria (PDF en inglés)",
      "/assets/downloads/business-tax-preparation-checklist.pdf",
    ],
  },
};

function translateService(service) {
  return {
    ...service,
    audienceLabel:
      service.audience === "individuals"
        ? "Servicios individuales"
        : "Servicios empresariales",
    ...translations[service.slug],
  };
}

export const serviceGroupsEs = Object.fromEntries(
  Object.entries(serviceGroups).map(([audience, services]) => [
    audience,
    services.map(translateService),
  ]),
);

export function findServiceEs(audience, slug) {
  return serviceGroupsEs[audience]?.find((service) => service.slug === slug);
}
