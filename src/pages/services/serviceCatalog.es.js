import { serviceGroups } from "./serviceCatalog.js";

const translations = {
  "tax-preparation": {
    title: "Preparación de impuestos",
    seoTitle: "Preparación de Impuestos Personales | Alchemize",
    seoDescription:
      "Preparación de impuestos para individuos con registros organizados, revisión documental y apoyo virtual donde los requisitos del servicio lo permitan.",
    hero: "Prepare su declaración con registros que ya estén organizados a su favor.",
    overview:
      "La preparación de impuestos se complica cuando los comprobantes de ingresos, gastos, datos de años anteriores y preguntas pendientes están dispersos. Alchemize organiza el proceso para que la declaración pueda prepararse desde un punto de partida más claro. Con sede en Carolina del Norte, el apoyo puede ofrecerse virtualmente donde lo permitan los requisitos del servicio.",
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
    checklist: ["Individual Tax Preparation Organizer", null],
  },
  "notary-document-services": {
    title: "Servicios notariales y apoyo documental administrativo",
    seoTitle: "Servicios de Notario en Carolina del Norte | Alchemize",
    seoDescription:
      "Servicios de notario en Carolina del Norte para documentos, firmas, reconocimientos y apoyo administrativo con citas claras y requisitos bien definidos.",
    hero: "Prepare el documento. Verifique los requisitos. Complete correctamente la cita.",
    overview:
      "El trabajo notarial y el apoyo documental administrativo son servicios relacionados, pero distintos. Alchemize ofrece servicios notariales en Carolina del Norte y ayuda a organizar paquetes no legales sin seleccionar formularios, redactar términos jurídicos ni interpretar consecuencias legales.",
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
      ["Consultation Preparation Workbook", null],
    ],
    cta: "¿Necesita organizar una cita notarial o un paquete documental no legal?",
  },
  "translation-services": {
    title: "Servicios de traducción",
    seoTitle: "Servicios de Traducción de Documentos | Alchemize",
    seoDescription:
      "Traducción profesional de documentos para individuos y negocios, con apoyo virtual y coordinación basada en Carolina del Norte cuando corresponde.",
    hero: "Apoyo profesional para traducción de documentos personales, administrativos y empresariales.",
    overview:
      "Las necesidades de traducción varían según el documento, el destino y el propósito. Con sede en Carolina del Norte, Alchemize ayuda a organizar materiales traducidos, aclarar el contenido y preparar un conjunto útil para revisión antes de confirmar el servicio, con apoyo virtual cuando corresponde.",
    statement:
      "Apoyo claro para documentos que necesitan ser entendibles, ordenados y listos para el siguiente paso.",
    capabilities: [
      "Apoyo para traducción de documentos personales",
      "Apoyo para traducción de documentos empresariales",
      "Organización de documentos administrativos",
      "Registros y correspondencia de apoyo",
    ],
    for: [
      "Personas que preparan documentos personales para otro idioma",
      "Negocios que traducen políticas, formularios o correspondencia",
      "Clientes que organizan documentos de apoyo para revisión",
      "Personas que preparan materiales para una agencia o institución",
    ],
    helps: [
      "Apoyo a la traducción de documentos personales",
      "Traducción de correspondencia y formularios empresariales",
      "Traducción de registros administrativos y documentos de apoyo",
      "Preparación y organización de paquetes de documentos",
      "Materiales traducidos listos para revisión antes del envío",
      "Conversión de idioma para registros internos o dirigidos a clientes",
      "Organización documental para agencias, instituciones o contenido empresarial",
    ],
    situations: [
      "Un documento personal o empresarial necesita traducción para revisión formal",
      "Un formulario, política o carta debe traducirse antes de usarse",
      "Los documentos de apoyo ya están listos pero requieren una versión consistente en otro idioma",
      "Un cliente desea un conjunto claro y organizado antes de presentarlo",
    ],
    process: [
      [
        "Revisar",
        "Confirme el documento, el destino previsto, el idioma de origen y lo que debe traducirse.",
      ],
      [
        "Organizar",
        "Agrupe los documentos de apoyo e identifique los materiales que deben formar parte del conjunto de traducción.",
      ],
      [
        "Traducir",
        "Prepare el trabajo solicitado en un formato claro y listo para revisión según el servicio seleccionado.",
      ],
      [
        "Confirmar",
        "Revise los materiales finales y determine si se requieren instrucciones adicionales o seguimiento.",
      ],
    ],
    prepare: [
      "Los documentos que requieren traducción",
      "El idioma de origen y el idioma de destino",
      "Cualquier instrucción de la entidad receptora u organización",
      "Documentos relacionados que deben acompañar al paquete traducido",
      "Materiales de referencia que aclaren terminología o contexto",
    ],
    boundary:
      "Los servicios de traducción son de apoyo documental y no garantizan aceptación, certificación, efecto legal ni resultado específico de una agencia. Algunas instituciones, cortes, asuntos de inmigración, gobiernos extranjeros u otras autoridades pueden exigir requisitos específicos de traducción o certificación, y conviene confirmarlos antes de iniciar el servicio.",
    related: [
      [
        "Servicios notariales y de documentos",
        "/services/individuals/notary-document-services",
      ],
      ["Servicios de apostilla", "/services/individuals/apostille-services"],
    ],
    resources: [
      ["Consultation Preparation Workbook", null],
      [
        "Cómo prepararse para una cita notarial",
        "/resources/preparing-for-a-notary-appointment",
      ],
    ],
    cta: "¿Necesita materiales traducidos con claridad y consistencia?",
    checklist: ["Consultation Preparation Workbook", null],
  },
  "apostille-services": {
    title: "Facilitación y apoyo para apostillas de Carolina del Norte",
    seoTitle: "Servicios de Apostilla en Carolina del Norte | Alchemize",
    seoDescription:
      "Apoyo para apostilla y autenticación de documentos en Carolina del Norte, con coordinación remota cuando los requisitos dependen del documento, la jurisdicción y el país de destino.",
    hero: "Prepare el conjunto de documentos para el destino que los recibirá.",
    overview:
      "Alchemize facilita y apoya el proceso de apostilla de Carolina del Norte mediante la organización del paquete documental y la coordinación de requisitos previos, envío y devolución. La apostilla la emite la autoridad gubernamental correspondiente, no Alchemize, y la disponibilidad permanece pendiente de preparación operativa.",
    statement:
      "Apoyo para preparar y coordinar documentos que podrían necesitar autenticación para su uso fuera de Estados Unidos.",
    capabilities: [
      "Revisión de destino y documento",
      "Organización documental",
      "Apoyo para notarialización o certificación",
      "Preparación para envío y manejo de devolución",
    ],
    for: [
      "Personas que preparan documentos personales para uso en el extranjero",
      "Familias que coordinan documentos autenticados para otro país",
      "Negocios que preparan registros corporativos para uso internacional",
      "Clientes que organizan documentos que podrían requerir autenticación",
    ],
    helps: [
      "Revisión del destino previsto y tipo de documento",
      "Evaluación de si antes se requiere notarialización o certificación",
      "Organización de documentos de apoyo e instrucciones del destinatario",
      "Preparación del paquete documental y manejo de registros",
      "Coordinación de requisitos de envío y detalles de devolución",
      "Apoyo administrativo para flujos de autenticación documental",
    ],
    situations: [
      "Un documento se usará en otro país o jurisdicción",
      "La autoridad receptora exige una apostilla o autenticación equivalente",
      "El documento puede necesitar notarialización o certificación antes del trámite de apostilla",
      "Un cliente necesita ayuda para organizar los registros de apoyo del proceso",
    ],
    process: [
      [
        "Revisar",
        "Aclare el país de destino, el tipo de documento y los requisitos de la autoridad emisora.",
      ],
      [
        "Confirmar",
        "Determine si se requiere notarialización, certificación u otro paso antes de la apostilla.",
      ],
      [
        "Organizar",
        "Prepare el conjunto documental, los registros de apoyo y los detalles de envío en un paquete ordenado.",
      ],
      [
        "Coordinar",
        "Apoye la devolución, el seguimiento y el manejo del documento según el servicio acordado.",
      ],
    ],
    prepare: [
      "El documento que podría requerir apostilla",
      "Cualquier registro de notarialización o certificación aplicable",
      "Instrucciones de la autoridad receptora o de la fuente del documento",
      "Una copia del conjunto final y cualquier registro complementario",
      "Detalles del país de destino o autoridad emisora cuando estén disponibles",
    ],
    boundary:
      "Alchemize brinda facilitación y coordinación administrativa; no emite apostillas. Las tarifas gubernamentales, de envío, mensajería y terceros son separadas. La autoridad emisora controla los plazos y la emisión. Alchemize no brinda asesoría legal o migratoria ni garantiza la emisión o aceptación por una autoridad extranjera.",
    related: [
      ["Servicios de traducción", "/services/individuals/translation-services"],
      [
        "Servicios notariales y de documentos",
        "/services/individuals/notary-document-services",
      ],
    ],
    resources: [
      ["Consultation Preparation Workbook", null],
      [
        "Cómo prepararse para una cita notarial",
        "/resources/preparing-for-a-notary-appointment",
      ],
    ],
    cta: "¿Necesita organizar un paquete documental para autenticación o uso en el extranjero?",
    checklist: ["Consultation Preparation Workbook", null],
  },
  "advisory-optimization": {
    title: "Asesoría y optimización empresarial",
    seoTitle: "Consultoría Empresarial para Pequeñas Empresas | Alchemize",
    seoDescription:
      "Consultoría empresarial para pequeñas empresas con apoyo en prioridades, mejora operativa y decisiones prácticas sobre qué cambiar o mejorar.",
    hero: "Convierta la fricción operativa en un plan práctico de acción.",
    overview:
      "Alchemize revisa la situación actual, identifica dónde fallan la información o las responsabilidades, distingue los síntomas de las causas y crea un plan ordenado de mejora. La consultoría diagnostica, recomienda y planifica; la implementación sustancial requiere un servicio separado salvo que esté expresamente incluida.",
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
        "Defina los próximos pasos e identifique la implementación que debe cotizarse por separado.",
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
      "La consultoría identifica problemas, aclara prioridades y desarrolla recomendaciones o planes de implementación. La implementación sustancial se cotiza por separado salvo que esté expresamente incluida. La asesoría no sustituye servicios legales, contables, tributarios, de inversiones u otros servicios regulados.",
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
    checklist: ["Consultation Preparation Workbook", null],
  },
  "operations-implementation": {
    title: "Operaciones e implementación empresarial",
    seoTitle: "Apoyo Operativo para Pequeñas Empresas | Alchemize",
    seoDescription:
      "Apoyo operativo para pequeñas empresas en procesos, flujos de trabajo, sistemas administrativos e implementación práctica para mejorar la operación del negocio.",
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
    checklist: ["Business Operations & Systems Workbook", null],
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
    checklist: ["Business Operations & Systems Workbook", null],
  },
  "readiness-growth": {
    title: "Preparación y crecimiento empresarial",
    seoTitle: "Apoyo para Iniciar un Pequeño Negocio | Alchemize",
    seoDescription:
      "Apoyo para iniciar un pequeño negocio y preparación para lanzamiento, con organización de registros, claridad de procesos y próximos pasos para emprendedores.",
    hero: "Construya los registros y la preparación que respaldan la oportunidad.",
    overview:
      "Este trabajo organiza información, registros, planes, fechas y documentos de respaldo para el lanzamiento, crecimiento, planificación estratégica y revisión externa. No incluye procurar financiamiento ni prometer una aprobación.",
    statement:
      "Prepare al negocio para su formación, operaciones organizadas, planificación estratégica y próxima etapa de crecimiento.",
    capabilities: [
      "Preparación para la formación",
      "Preparación financiera",
      "Preparación de materiales de planificación",
      "Infraestructura para el crecimiento",
    ],
    for: [
      "Emprendedores que se preparan para formar o lanzar un negocio",
      "Empresas que organizan materiales de preparación financiera",
      "Propietarios que se preparan para registros o certificaciones",
      "Compañías que se organizan para oportunidades gubernamentales o con proveedores",
    ],
    helps: [
      "Preparación administrativa para formación y lanzamiento",
      "Asistencia con EIN dentro del alcance permitido",
      "Listas de lanzamiento y registros fundamentales",
      "Evaluación de preparación para negocios y crecimiento",
      "Preparación financiera y organización de documentos de respaldo",
      "Apoyo con planes de negocio",
      "Preparación de declaraciones de capacidad",
      "Apoyo para certificaciones",
      "Preparación administrativa no legal para registros",
      "Registro de proveedores",
      "Calendario de cumplimiento y preparación documental",
    ],
    situations: [
      "La información de formación y los pasos de lanzamiento están dispersos",
      "Una revisión externa requiere mejores registros financieros y de planificación",
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
      "Los servicios de planificación y preparación financiera no incluyen procurar financiamiento, seleccionar o negociar con prestamistas, enviar solicitudes ni garantizar aprobación. Alchemize no garantiza resultados de formación, certificaciones, registros, aceptación de proveedores ni cumplimiento legal.",
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
        "Apoyo tributario para empresas",
        "/services/businesses/business-tax-support",
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
    checklist: ["Business Startup & Formation Workbook", null],
  },
  "bookkeeping-financial-reporting": {
    title: "Teneduría de libros y reportes financieros",
    seoTitle: "Teneduría de libros para Pequeños Negocios | Alchemize",
    seoDescription:
      "Teneduría de libros para pequeños negocios con conciliación, reportes financieros y apoyo virtual para empresas en crecimiento.",
    hero: "Una Teneduría de libros organizada le da al negocio un historial financiero confiable de lo que entra, sale, debe y en qué situación se encuentra.",
    overview:
      "La Teneduría de libros no es solo la captura de transacciones. Es un proceso de registros confiable que ayuda al negocio a entender su posición financiera y mantener información útil para reportes, revisión y preparación de fin de año. Con sede en Carolina del Norte, Alchemize puede ofrecer apoyo virtual de Teneduría de libros en Estados Unidos cuando el servicio lo permita, mientras estructura los registros, concilia los libros y organiza un proceso recurrente según el nivel de servicio seleccionado.",
    statement:
      "Una Teneduría de libros organizada le da al negocio un historial financiero confiable de lo que entra, sale, debe y en qué situación se encuentra.",
    capabilities: [
      "Categorización de transacciones",
      "Conciliación bancaria",
      "Conciliación de tarjetas de crédito",
      "Seguimiento de ingresos y gastos",
    ],
    for: [
      "Negocios que necesitan mejor visibilidad financiera",
      "Propietarios que requieren Teneduría de libros más clara antes de impuestos o revisión",
      "Empresas con recibos, facturas y estados dispersos",
      "Negocios que desean apoyo recurrente con reportes financieros",
    ],
    helps: [
      "Categorización y revisión de transacciones",
      "Conciliación bancaria y comparación de cuentas",
      "Conciliación de tarjeta de crédito y revisión de gastos",
      "Seguimiento de ingresos y gastos",
      "Seguimiento de cuentas por cobrar",
      "Seguimiento de cuentas por pagar",
      "Mantenimiento del libro mayor",
      "Reportes mensuales o periódicos",
      "Limpieza contable y organización histórica",
      "Organización de documentos para apoyo tributario",
      "Coordinación de registros para revisión de fin de año",
    ],
    situations: [
      "La empresa tiene demasiadas transacciones para categorizar sin un sistema claro",
      "Las cuentas bancarias y de tarjeta de crédito necesitan conciliación frente a la actividad registrada",
      "Los recibos, facturas y gastos están en distintos lugares",
      "El propietario necesita una vista más clara de la posición financiera de la empresa",
    ],
    process: [
      [
        "Reunir",
        "Reúna los registros legales, bancarios, de ingresos, gastos y la información relevante de nómina o contratistas necesarios para la Teneduría de libros.",
      ],
      [
        "Revisar",
        "Identifique elementos faltantes, inconsistencias y transacciones que necesiten clasificación o aclaración.",
      ],
      [
        "Conciliar",
        "Compare las transacciones registradas con los estados y organice el libro mayor para que refleje la actividad real del negocio.",
      ],
      [
        "Reportar",
        "Prepare los reportes y registros alineados con el nivel de servicio contable y el ritmo de trabajo acordado.",
      ],
    ],
    prepare: [
      "Documentos legales de constitución o registro y documentos comparables",
      "Registro de EIN y documentos de registro empresarial cuando correspondan",
      "Estados bancarios, de ahorros, préstamos y tarjetas de crédito",
      "Facturas de clientes, registros de ventas, facturas de proveedores, recibos y gastos",
      "Resumen de nómina, hojas de tiempo, facturas de contratistas y registros de nómina relevantes",
      "Registros de activos, financiamiento y compras con fechas y respaldos",
    ],
    boundary:
      "El apoyo contable cubre registros financieros organizados y reportes según el servicio seleccionado. No sustituye servicios de CPA, auditor, preparador de impuestos, procesamiento de nómina ni asesoría de inversiones. Los libros organizados pueden ayudar a preparar registros más claros para la preparación de impuestos de fin de año y la revisión profesional.",
    related: [
      ["Procesamiento de nómina", "/services/businesses/payroll-processing"],
      [
        "Apoyo tributario para empresas",
        "/services/businesses/business-tax-support",
      ],
    ],
    cta: "¿Necesita que el proceso de registros financieros sea más claro y confiable?",
    checklist: ["Business Tax Preparation Organizer", null],
  },
  "payroll-processing": {
    title: "Procesamiento de nómina",
    seoTitle: "Servicios de Nómina para Pequeñas Empresas | Alchemize",
    seoDescription:
      "Apoyo de nómina para pequeñas empresas con registros organizados, reportes recurrentes y administración virtual donde lo permite el flujo seleccionado.",
    hero: "Apoyo estructurado de nómina para negocios que necesitan pagos confiables a empleados y contratistas, registros organizados y reportes recurrentes.",
    overview:
      "El trabajo de nómina requiere información confiable, propiedad clara del proceso y un historial ordenado. Con sede en Carolina del Norte, Alchemize puede apoyar el procesamiento de nómina para pequeñas empresas y la administración de nómina con coordinación virtual en Estados Unidos donde la plataforma y el alcance lo permitan.",
    statement:
      "Apoyo estructurado de nómina para negocios que necesitan pagos confiables a empleados y contratistas, registros organizados y reportes recurrentes.",
    capabilities: [
      "Configuración de nómina",
      "Coordinación de nómina recurrente",
      "Registros de nómina de empleados",
      "Registros de pagos a contratistas",
    ],
    for: [
      "Negocios que gestionan pagos a empleados o contratistas",
      "Propietarios que necesitan registros de nómina más organizados",
      "Empresas con reportes recurrentes y documentación de nómina",
      "Equipos que coordinan información de nómina entre horarios y deducciones",
    ],
    helps: [
      "Configuración de empleados y recolección de datos de nómina",
      "Organización de horarios y periodos de pago",
      "Preparación de registros de sueldos y horas",
      "Seguimiento de deducciones y organización de resúmenes",
      "Mantenimiento de registros de pagos a contratistas",
      "Conciliación de nómina y preparación de reportes",
      "Mantenimiento y revisión de registros de nómina",
      "Coordinación de registros de nómina de fin de año",
      "Apoyo administrativo para limpieza de datos de nómina",
    ],
    situations: [
      "Los datos de nómina se están manejando en varios lugares",
      "Los registros de empleados o contratistas necesitan orden",
      "El negocio requiere resúmenes recurrentes de nómina y apoyo de conciliación",
      "Los registros de fin de año necesitan mejor coordinación y limpieza",
    ],
    process: [
      [
        "Evaluar",
        "Confirme el proceso de nómina, la información de empleados y contratistas, el calendario y la estructura de reportes requerida.",
      ],
      [
        "Organizar",
        "Reúna los registros de nómina, calendarios y detalles de apoyo en un formato listo para revisión.",
      ],
      [
        "Procesar",
        "Coordine la administración y los reportes de nómina a través de la plataforma o del proceso acordado.",
      ],
      [
        "Revisar",
        "Confirme los resúmenes, concilie excepciones y apoye el conjunto final antes del siguiente ciclo o cierre anual.",
      ],
    ],
    prepare: [
      "Información de empleados y contratistas",
      "Calendarios de pago y periodos relevantes",
      "Información de salarios, deducciones y reembolsos",
      "Hojas de tiempo, resúmenes de nómina y facturas de contratistas",
      "Información relacionada con W-9 y 1099 cuando corresponda",
      "Registros previos de nómina y documentos de fin de año",
    ],
    boundary:
      "El apoyo de nómina es administrativo y operativo. Alchemize no asume responsabilidad directa por remesas fiscales salvo que se establezca específicamente a través de la plataforma seleccionada y el flujo acordado. Las capacidades admitidas, los requisitos de la plataforma y las obligaciones legales deben confirmarse antes del compromiso.",
    related: [
      [
        "Teneduría de libros y reportes financieros",
        "/services/businesses/bookkeeping-financial-reporting",
      ],
      [
        "Apoyo tributario para empresas",
        "/services/businesses/business-tax-support",
      ],
    ],
    cta: "¿Necesita que los registros y la administración de nómina estén más organizados?",
    checklist: ["Business Tax Preparation Organizer", null],
  },
  "business-tax-support": {
    title: "Apoyo tributario para empresas",
    seoTitle: "Preparación de Impuestos para Pequeñas Empresas | Alchemize",
    seoDescription:
      "Preparación de impuestos para pequeñas empresas con organización documental, preparación de fin de año y apoyo virtual donde los requisitos del servicio lo permitan.",
    hero: "Las responsabilidades tributarias de la empresa son más fáciles de manejar cuando los registros, los plazos y los documentos requeridos están organizados antes de la temporada de declaraciones.",
    overview:
      "El trabajo tributario empresarial se vuelve más manejable cuando el propietario cuenta con un conjunto de registros más claro, un calendario práctico y una comprensión realista de lo que debe reunirse para la declaración. Con sede en Carolina del Norte, Alchemize puede ayudar a organizar la información necesaria para la preparación de impuestos para pequeñas empresas, la preparación de fin de año y el apoyo a impuestos estimados con coordinación virtual donde lo permitan los requisitos del servicio.",
    statement:
      "Las responsabilidades tributarias de la empresa son más fáciles de manejar cuando los registros, los plazos y los documentos requeridos están organizados antes de la temporada de declaraciones.",
    capabilities: [
      "Preparación de impuestos empresariales",
      "Organización de documentos tributarios",
      "Preparación tributaria de fin de año",
      "Apoyo para impuestos estimados",
    ],
    for: [
      "Dueños de pequeñas empresas que se preparan para la temporada de declaraciones",
      "Emprendedores que están organizando ingresos y gastos del negocio",
      "Empresas reuniendo información del año anterior para la preparación de impuestos",
      "Fundadores preparándose para impuestos estimados y revisión de fin de año",
    ],
    helps: [
      "Apoyo a la preparación de impuestos empresariales para tipos de declaraciones aplicables",
      "Organización de documentos tributarios y revisión de preparación para presentación",
      "Preparación de documentación de ingresos y gastos del negocio",
      "Reunión y organización de información del año anterior",
      "Apoyo para preparación de impuestos estimados y seguimiento",
      "Preparación de documentación tributaria de contratistas y nómina cuando corresponda",
      "Preparación tributaria de fin de año y conciencia de plazos",
      "Revisión de documentación antes de una declaración o entrega profesional",
    ],
    situations: [
      "Los registros del negocio están dispersos antes de la temporada de declaraciones",
      "El propietario necesita un conjunto de registros tributarios más ordenado para el próximo ciclo de declaración",
      "La empresa necesita ayuda para identificar documentos faltantes y registros listos para impuestos",
      "Se acercan las obligaciones de fin de año y el conjunto de registros necesita revisión",
    ],
    process: [
      [
        "Organizar",
        "Reúna los ingresos, gastos, nómina, contratistas y registros del año anterior necesarios para el proceso tributario.",
      ],
      [
        "Revisar",
        "Identifique lo que falta, lo que requiere aclaración y lo que debe prepararse antes de presentar la declaración.",
      ],
      [
        "Preparar",
        "Reúna los registros y la información de respaldo necesarios para el flujo de preparación tributaria del negocio.",
      ],
      [
        "Confirmar",
        "Establezca el próximo paso práctico, el calendario de presentación y la ruta de entrega para la siguiente etapa del servicio.",
      ],
    ],
    prepare: [
      "Registros de ingresos del negocio y comprobantes de respaldo",
      "Documentación de gastos y recibos",
      "Declaraciones empresariales del año anterior y registros relacionados",
      "Resúmenes de nómina y registros de pagos a contratistas cuando corresponda",
      "Registros de impuestos estimados y notas de respaldo",
      "Activos, compras e información sobre vehículos de uso comercial cuando corresponda",
      "Correspondencia tributaria, plazos y avisos relacionados con la presentación",
    ],
    boundary:
      "El apoyo tributario para empresas se centra en organización, preparación y disposición. Alchemize no brinda asesoría legal tributaria ni representación ni estrategia tributaria profesional más allá del alcance definido del servicio. Los tipos de declaraciones admitidas, las obligaciones tributarias y las jurisdicciones deben confirmarse antes del compromiso; el trabajo especializado puede requerir un CPA, abogado, agente registrado u otro profesional calificado.",
    related: [
      [
        "Teneduría de libros y reportes financieros",
        "/services/businesses/bookkeeping-financial-reporting",
      ],
      ["Procesamiento de nómina", "/services/businesses/payroll-processing"],
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
    cta: "¿Necesita que los registros tributarios de su empresa estén organizados antes de la temporada de declaraciones?",
    checklist: ["Business Tax Preparation Organizer", null],
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
