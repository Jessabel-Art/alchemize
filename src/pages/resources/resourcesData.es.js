import { resources } from "./resourcesData.js";

export const RESOURCE_CATEGORIES_ES = [
  ["All", "Todos"],
  ["Taxes", "Impuestos"],
  ["Web & Digital Solutions", "Web y soluciones digitales"],
  ["Starting a Business", "Cómo iniciar un negocio"],
  ["Business Operations", "Operaciones empresariales"],
  ["Records & Administration", "Registros y administración"],
  ["Guides & Checklists", "Guías y listas"],
];

const taxNotice =
  "Información educativa general. El tratamiento tributario depende de los hechos individuales y de las leyes federales y estatales aplicables.";
const businessNotice =
  "Información educativa y organizativa general. Los requisitos varían según la jurisdicción y las circunstancias. Este recurso no constituye asesoría legal, contable ni tributaria individualizada.";
const digitalNotice =
  "Información educativa general sobre sitios web y presencia digital. Las recomendaciones específicas dependen del negocio, la audiencia, los sistemas existentes y el alcance del proyecto. No se garantizan la visibilidad en buscadores, el tráfico ni los resultados comerciales.";

const es = {
  "preparing-for-tax-season": {
    title: "Cómo prepararse para la temporada de impuestos",
    excerpt:
      "Un marco práctico para organizar registros tributarios, identificar información faltante y reducir la búsqueda de documentos a última hora.",
    category: "Impuestos",
    audience: "Personas y propietarios de negocios",
    type: "Guía y lista",
    readTime: "9 min de lectura",
    disclaimer: taxNotice,
    sections: [
      {
        id: "expediente",
        title: "Comience con un expediente completo",
        paragraphs: [
          "Use la declaración del año anterior como referencia y cree una carpeta segura para el año actual. Reúna documentos a medida que lleguen en lugar de esperar hasta el momento de presentar.",
        ],
        items: [
          "Identificación e información del hogar",
          "Declaración del año anterior",
          "Comprobantes de ingresos",
          "Pagos estimados y correspondencia tributaria",
        ],
      },
      {
        id: "ingresos-gastos",
        title: "Organice ingresos y gastos",
        paragraphs: [
          "Separe la actividad personal de la empresarial y conserve el respaldo que explica cada cifra. Un total sin documentación puede no ser suficiente.",
        ],
        items: [
          "W-2, 1099 y otros comprobantes",
          "Recibos y registros de gastos aplicables",
          "Registros de trabajo por cuenta propia",
          "Documentos de deducciones o créditos aplicables",
        ],
      },
      {
        id: "faltantes",
        title: "Cree una lista de información faltante",
        paragraphs: [
          "Compare lo recibido con lo que esperaba y anote las preguntas antes de entregar información. No transmita documentos sensibles por canales no aprobados.",
        ],
        callout:
          "La organización no determina por sí sola el tratamiento tributario. Confirme sus preguntas con un profesional calificado.",
      },
    ],
    nextSteps: [
      "Cree una carpeta segura para el año de declaración.",
      "Enumere los documentos esperados y marque los faltantes.",
      "Separe los registros empresariales de los personales.",
      "Anote sus preguntas antes de compartir información de forma segura.",
    ],
  },
  "tax-records-what-to-keep": {
    title: "Registros tributarios: qué conservar y cómo organizarlos",
    excerpt:
      "Una estructura sencilla para conservar declaraciones, comprobantes y correspondencia sin depender de una bandeja de entrada o una caja de papeles.",
    category: "Impuestos",
    audience: "Personas y propietarios de negocios",
    type: "Guía",
    readTime: "8 min de lectura",
    disclaimer: taxNotice,
    sections: [
      {
        id: "estructura",
        title: "Organice por año y categoría",
        paragraphs: [
          "Cree un expediente por año con categorías consistentes para ingresos, gastos, pagos, declaraciones y correspondencia. La misma estructura facilita encontrar registros después.",
        ],
        items: [
          "Declaraciones y anexos presentados",
          "Ingresos y pagos",
          "Gastos y documentos de respaldo",
          "Avisos y respuestas",
        ],
      },
      {
        id: "negocio",
        title: "Mantenga separados los registros empresariales",
        paragraphs: [
          "Conserve estados de cuenta, facturas, recibos, nómina o contratistas y documentos de activos en el expediente del negocio. Registre quién puede acceder a información sensible.",
        ],
      },
      {
        id: "retencion",
        title: "Tome una decisión de conservación",
        paragraphs: [
          "No todos los registros tienen el mismo plazo. Consulte la guía oficial y confirme las reglas aplicables antes de destruir documentos.",
        ],
        callout:
          "La conservación depende del tipo de registro y de su situación. No use una sola fecha para todos los documentos.",
      },
    ],
    nextSteps: [
      "Cree la estructura del año actual.",
      "Mueva los registros fuera de correos y descargas.",
      "Identifique documentos que necesitan una decisión específica de conservación.",
      "Confirme los plazos con la autoridad o profesional correspondiente.",
    ],
  },
  "estimated-taxes-questions": {
    title: "Impuestos estimados: preguntas antes de ignorarlos",
    excerpt:
      "Comprenda cuándo los ingresos sin retención pueden crear pagos durante el año y qué registros ayudan a formular mejores preguntas.",
    category: "Impuestos",
    audience: "Personas y propietarios de negocios",
    type: "Explicación",
    readTime: "7 min de lectura",
    disclaimer: taxNotice,
    sections: [
      {
        id: "concepto",
        title: "Qué significan generalmente",
        paragraphs: [
          "Los impuestos estimados son pagos periódicos que pueden corresponder cuando la retención no cubre suficientemente la obligación esperada. Pueden ser relevantes para trabajo por cuenta propia, inversiones u otros ingresos sin retención.",
        ],
      },
      {
        id: "preguntas",
        title: "Preguntas que conviene responder",
        items: [
          "¿Qué ingresos no tienen retención?",
          "¿Cambió sustancialmente el ingreso desde el año anterior?",
          "¿Qué pagos ya se hicieron y cuándo?",
          "¿Existen requisitos estatales además de los federales?",
        ],
      },
      {
        id: "registro",
        title: "Conserve un registro de cada pago",
        paragraphs: [
          "Guarde la fecha, el importe, el período, la jurisdicción y la confirmación. Verifique las fechas actuales en fuentes oficiales.",
        ],
        callout:
          "No suponga que la obligación del año anterior será igual. Solicite orientación tributaria individualizada cuando corresponda.",
      },
    ],
    nextSteps: [
      "Enumere los ingresos sin retención.",
      "Reúna ingresos y pagos actuales.",
      "Revise la orientación y fechas vigentes del IRS.",
      "Consulte a un profesional tributario calificado sobre cómo se aplica a su situación.",
    ],
  },
  "professional-website-design-process": {
    title: "Qué esperar durante un proceso profesional de diseño web",
    excerpt:
      "Conozca las etapas prácticas de un proyecto web profesional, las decisiones que ayuda a definir el cliente y cómo avanza el trabajo desde el descubrimiento hasta el lanzamiento.",
    category: "Web y soluciones digitales",
    audience: "Pequeñas empresas y profesionales",
    type: "Guía práctica",
    readTime: "8 min de lectura",
    disclaimer: digitalNotice,
    sections: [
      {
        id: "descubrimiento",
        title: "Comience con el negocio, no con las páginas",
        paragraphs: [
          "Un proceso útil comienza por comprender el negocio, la audiencia, los servicios y la acción que las personas deben poder realizar. El descubrimiento puede incluir una revisión de la presencia actual, las metas y las limitaciones prácticas.",
          "La secuencia puede variar según el proyecto. Un sitio nuevo, una página enfocada y un rediseño no requieren exactamente el mismo trabajo.",
        ],
      },
      {
        id: "estructura",
        title: "Planifique la estructura y el contenido",
        paragraphs: [
          "Antes del diseño visual, el proyecto necesita un plan de contenido: páginas, grupos de información y llamadas a la acción.",
          "Conviene revisar temprano textos, fotografías, elementos de marca, políticas e información empresarial para identificar qué existe y quién preparará lo que falta.",
        ],
      },
      {
        id: "direccion",
        title: "Defina la dirección visual y de experiencia",
        paragraphs: [
          "La dirección visual traduce el negocio en tipografía, color, imágenes, espacio e interfaz. Las decisiones de experiencia consideran cómo las personas encuentran información y completan acciones importantes.",
          "Las referencias ayudan a comunicar preferencias, pero el objetivo es crear una solución adecuada para el negocio, no copiar otro sitio.",
        ],
      },
      {
        id: "desarrollo",
        title: "Desarrolle y pruebe el sitio",
        paragraphs: [
          "El desarrollo convierte la dirección aprobada en un sitio funcional. Se implementan páginas, navegación, formularios, comportamiento responsivo, metadatos e integraciones acordadas.",
          "Las pruebas deben incluir tamaños de pantalla comunes, exactitud del contenido, enlaces, formularios, teclado y recorridos importantes.",
        ],
      },
      {
        id: "lanzamiento",
        title: "Revise, publique y apoye lo que sigue",
        paragraphs: [
          "La revisión es más útil cuando los comentarios están organizados y relacionados con los objetivos acordados. Las comprobaciones finales cubren contenido, presentación responsiva, funciones y preparación para publicar.",
          "El apoyo posterior depende del acuerdo y puede incluir actualizaciones, contenido, integraciones seleccionadas o mejoras futuras.",
        ],
      },
    ],
    nextSteps: [
      "Aclare la meta principal del sitio.",
      "Identifique las audiencias y acciones importantes.",
      "Reúna contenido, elementos de marca e información de acceso.",
      "Programe una consulta para hablar sobre alcance y punto de partida.",
    ],
  },
  "digital-presence-audit": {
    title:
      "Qué puede revelar una auditoría de presencia digital sobre su negocio",
    excerpt:
      "Una revisión práctica puede mostrar dónde el sitio, los perfiles, las vías de contacto y los sistemas digitales son claros, inconsistentes, desactualizados o innecesariamente difíciles.",
    category: "Web y soluciones digitales",
    audience: "Pequeñas empresas y profesionales",
    type: "Guía de evaluación",
    readTime: "7 min de lectura",
    disclaimer: digitalNotice,
    sections: [
      {
        id: "proposito",
        title: "Vea la presencia digital como la ve un visitante",
        paragraphs: [
          "Una auditoría revisa cómo aparece y funciona el negocio en línea. Puede incluir el sitio, perfiles públicos, correo con dominio profesional y las vías de contacto.",
          "Su propósito es identificar brechas prácticas antes de invertir en un rediseño, contenido nuevo o herramientas adicionales.",
        ],
      },
      {
        id: "usabilidad",
        title: "Revise claridad y facilidad de uso",
        paragraphs: [
          "La revisión pregunta si el sitio explica qué hace el negocio, a quién sirve y qué debe hacer el visitante. La navegación, organización, llamadas a la acción, formularios y experiencia móvil influyen en la claridad.",
          "Servicios desactualizados, enlaces rotos, información inconsistente o próximos pasos poco claros pueden reducir la confianza.",
        ],
      },
      {
        id: "consistencia",
        title: "Compruebe la consistencia",
        paragraphs: [
          "El nombre, dirección, teléfono, servicios, horarios, logotipo y enlaces deben ser razonablemente consistentes donde aparece el negocio.",
          "Un dominio y correo profesional también pueden apoyar la credibilidad. La revisión debe observar cómo se conectan sin solicitar contraseñas.",
        ],
      },
      {
        id: "visibilidad",
        title: "Considere visibilidad y medición",
        paragraphs: [
          "Títulos, encabezados, contenido útil, relevancia local y limpieza técnica ayudan a los buscadores a comprender el sitio. También puede revisarse si las analíticas están configuradas de forma apropiada.",
          "Estos hallazgos no garantizan posiciones, tráfico ni ingresos. Ayudan a decidir qué base necesita atención.",
        ],
      },
      {
        id: "prioridades",
        title: "Convierta los hallazgos en prioridades",
        paragraphs: [
          "No todo problema requiere un rediseño completo. A veces se necesita contenido más claro, información corregida, mejor experiencia móvil o una vía de contacto más directa.",
          "Una auditoría útil separa las correcciones inmediatas de las mejoras mayores.",
        ],
      },
    ],
    nextSteps: [
      "Enumere cada sitio y perfil público del negocio.",
      "Verifique la información y las vías de contacto.",
      "Revise el sitio en computadora y móvil.",
      "Priorice correcciones antes de elegir herramientas o iniciar un rediseño.",
    ],
  },
  "seo-and-website-metadata": {
    title: "Por qué el SEO y los metadatos importan para su presencia en línea",
    excerpt:
      "Conozca cómo títulos, descripciones, encabezados, contenido, enlaces y calidad técnica ayudan a las personas y los buscadores a comprender un sitio.",
    category: "Web y soluciones digitales",
    audience: "Pequeñas empresas y profesionales",
    type: "Guía en lenguaje claro",
    readTime: "8 min de lectura",
    disclaimer: digitalNotice,
    sections: [
      {
        id: "base",
        title: "El SEO comienza con un sitio claro y útil",
        paragraphs: [
          "La optimización para buscadores, o SEO, es el trabajo continuo de hacer que un sitio sea comprensible, útil y técnicamente accesible. Comienza con páginas que explican claramente el negocio, sus servicios y su relevancia.",
          "Las palabras clave ayudan a describir un tema, pero repetirlas no garantiza una posición. La visibilidad depende de muchos factores.",
        ],
      },
      {
        id: "metadatos",
        title: "Los metadatos ofrecen contexto",
        paragraphs: [
          "El título identifica el tema de una página en pestañas y resultados de búsqueda. La descripción resume la página y puede aparecer en los resultados. Cada página importante necesita texto específico y preciso.",
          "Los metadatos no compensan contenido escaso, confuso o desactualizado, y los buscadores pueden elegir otro fragmento.",
        ],
      },
      {
        id: "estructura",
        title: "La estructura ayuda a personas y buscadores",
        paragraphs: [
          "Un encabezado principal claro, subtítulos descriptivos, párrafos útiles y enlaces internos facilitan la navegación. El texto alternativo debe explicar imágenes significativas para quienes no pueden verlas.",
          "Los enlaces internos ayudan a pasar entre servicios y recursos relacionados y muestran cómo se conectan las páginas.",
        ],
      },
      {
        id: "tecnico",
        title: "La limpieza técnica y la experiencia móvil importan",
        paragraphs: [
          "Enlaces rotos, títulos duplicados, controles inaccesibles, diseños móviles deficientes y direcciones confusas dificultan el uso y la comprensión.",
          "El SEO técnico y la experiencia de usuario comparten una misma base: contenido accesible y una estructura confiable en todos los dispositivos.",
        ],
      },
      {
        id: "local",
        title: "Mantenga precisa la relevancia del negocio",
        paragraphs: [
          "Para negocios que atienden lugares específicos, el contenido y los perfiles deben describir esas áreas con precisión. Nombres, direcciones, teléfonos, horarios y servicios deben mantenerse consistentes.",
          "El SEO y los metadatos apoyan una base más clara, pero no garantizan posiciones. Requieren contenido útil, mantenimiento y expectativas realistas.",
        ],
      },
    ],
    nextSteps: [
      "Revise el título y encabezado principal de cada página importante.",
      "Confirme que el contenido responde preguntas reales de los visitantes.",
      "Compruebe imágenes, enlaces internos y diseño móvil.",
      "Trate los metadatos como parte de una revisión más amplia.",
    ],
  },
  "starting-a-business-organization-checklist": {
    title: "Cómo iniciar un negocio: lista de organización",
    excerpt:
      "Organice decisiones, registros, inscripciones y fechas antes de que la información del nuevo negocio quede dispersa.",
    category: "Cómo iniciar un negocio",
    audience: "Emprendedores y pequeñas empresas",
    type: "Guía y lista",
    readTime: "10 min de lectura",
    disclaimer: businessNotice,
    sections: [
      {
        id: "definir",
        title: "Defina el negocio antes de presentar documentos",
        items: [
          "Actividad y clientes previstos",
          "Propietarios, funciones y porcentajes",
          "Ubicación y jurisdicciones",
          "Nombre comercial y alternativas",
          "Preguntas sobre estructura, impuestos y licencias",
        ],
      },
      {
        id: "separar",
        title: "Separe la actividad empresarial",
        paragraphs: [
          "Cree un expediente permanente, una dirección de contacto confiable y, cuando corresponda, cuentas financieras separadas. Registre todas las inscripciones y credenciales.",
        ],
      },
      {
        id: "calendario",
        title: "Construya el calendario desde el comienzo",
        items: [
          "Declaraciones e impuestos",
          "Licencias y renovaciones",
          "Informes anuales",
          "Seguros",
          "Contratos y obligaciones con proveedores",
        ],
      },
    ],
    nextSteps: [
      "Escriba una descripción sencilla del negocio.",
      "Enumere propietarios, funciones, ubicaciones y preguntas de estructura.",
      "Verifique requisitos estatales y locales en fuentes oficiales.",
      "Cree un registro para cada inscripción y fecha.",
    ],
  },
  "your-first-year-in-business": {
    title: "Su primer año en el negocio: qué debe mantenerse organizado",
    excerpt:
      "El primer año crea los registros, fechas y hábitos administrativos que el negocio utilizará después. Construya un sistema antes de que la información se disperse.",
    category: "Cómo iniciar un negocio",
    audience: "Emprendedores y pequeñas empresas",
    type: "Guía",
    readTime: "9 min de lectura",
    disclaimer: businessNotice,
    sections: [
      {
        id: "permanente",
        title: "Cree el expediente permanente de la empresa",
        items: [
          "Documentos de formación y propiedad",
          "EIN e inscripciones tributarias",
          "Licencias y permisos",
          "Acuerdos importantes",
          "Seguros y datos de cuentas",
        ],
      },
      {
        id: "dinero-fechas",
        title: "Separe el dinero y controle las fechas",
        paragraphs: [
          "Defina dónde viven los estados, facturas, recibos y pagos. Use un calendario con fecha de preparación, responsable y evidencia de cumplimiento.",
        ],
      },
      {
        id: "procesos",
        title: "Documente el trabajo que se repite",
        paragraphs: [
          "Registre pasos de admisión, facturación, seguimiento, archivo y renovaciones. Revise trimestralmente qué información sigue siendo difícil de encontrar.",
        ],
      },
    ],
    nextSteps: [
      "Cree la carpeta permanente de la empresa.",
      "Construya un solo calendario de fechas.",
      "Registre términos de proveedores y servicios.",
      "Elija un proceso recurrente para documentar este trimestre.",
    ],
  },
  "business-formation-information-to-gather": {
    title:
      "Formación empresarial: información que debe reunir antes de presentar",
    excerpt:
      "Reúna los datos fundamentales, separe los hechos de las preguntas profesionales y planifique el registro permanente antes de presentar documentos.",
    category: "Cómo iniciar un negocio",
    audience: "Emprendedores y pequeñas empresas",
    type: "Guía de preparación",
    readTime: "7 min de lectura",
    disclaimer: businessNotice,
    sections: [
      {
        id: "datos",
        title: "Construya el expediente de información",
        items: [
          "Nombre y alternativas",
          "Actividad y ubicación",
          "Propietarios y funciones",
          "Dirección y contacto",
          "Fecha prevista de inicio",
          "Licencias o registros conocidos",
        ],
      },
      {
        id: "preguntas",
        title: "Separe hechos de preguntas profesionales",
        paragraphs: [
          "La elección de entidad, el tratamiento tributario y determinados acuerdos pueden requerir asesoría legal o tributaria. Anote esas preguntas antes de presentar.",
        ],
      },
      {
        id: "despues",
        title: "Conserve lo presentado",
        items: [
          "Documentos aceptados",
          "Números y credenciales",
          "Recibos y confirmaciones",
          "Fechas de renovación",
          "Correspondencia de autoridades",
        ],
      },
    ],
    nextSteps: [
      "Reúna la información factual antes de abrir un portal.",
      "Anote preguntas de estructura e impuestos.",
      "Identifique las autoridades estatales y locales correctas.",
      "Planifique el expediente permanente antes de enviar.",
    ],
  },
  "business-needs-a-process": {
    title: "Cuándo su negocio necesita un proceso y no otra lista de tareas",
    excerpt:
      "Cuando el mismo problema vuelve, quizá se necesiten pasos repetibles, un responsable claro y un lugar confiable para la información.",
    category: "Operaciones empresariales",
    audience: "Empresas pequeñas y en crecimiento",
    type: "Marco práctico",
    readTime: "8 min de lectura",
    disclaimer:
      "Información general sobre organización empresarial. Cada proceso debe adaptarse al negocio, sus obligaciones y la sensibilidad de la información involucrada.",
    sections: [
      {
        id: "diferencia",
        title: "Tarea, proceso y sistema",
        terms: [
          ["Tarea", "Una acción individual."],
          [
            "Proceso",
            "Una secuencia repetible con un inicio, responsable y resultado.",
          ],
          [
            "Sistema",
            "Las personas, reglas, registros y herramientas que sostienen varios procesos.",
          ],
        ],
      },
      {
        id: "senales",
        title: "Señales de que falta un proceso",
        items: [
          "El mismo error se repite",
          "El trabajo depende de la memoria",
          "Nadie sabe quién continúa",
          "La información se vuelve a solicitar",
          "Las herramientas no coinciden con el trabajo",
        ],
      },
      {
        id: "construir",
        title: "Construya un camino repetible",
        ordered: [
          "Defina qué inicia el trabajo.",
          "Nombre el resultado esperado.",
          "Asigne un responsable.",
          "Documente pasos, decisiones y registros.",
          "Pruebe el proceso y ajústelo.",
        ],
      },
    ],
    nextSteps: [
      "Elija un problema recurrente.",
      "Defina su inicio y resultado.",
      "Trace los pasos y asigne un responsable.",
      "Pruebe el proceso en la próxima situación real.",
    ],
  },
  "simple-administrative-system": {
    title:
      "Cómo crear un sistema administrativo sencillo para una pequeña empresa",
    excerpt:
      "Organice documentos, dinero, fechas, contactos y procesos en una estructura que el negocio pueda mantener.",
    category: "Operaciones empresariales",
    audience: "Pequeñas empresas",
    type: "Guía",
    readTime: "9 min de lectura",
    disclaimer:
      "Información general sobre organización empresarial. El diseño del sistema debe reflejar las obligaciones, necesidades de seguridad y contexto operativo reales del negocio.",
    sections: [
      {
        id: "preguntas",
        title: "Comience con cuatro preguntas",
        items: [
          "¿Qué información debe conservarse?",
          "¿Dónde vive la versión oficial?",
          "¿Quién es responsable?",
          "¿Cuándo se revisa o actualiza?",
        ],
      },
      {
        id: "bases",
        title: "Cinco bases administrativas",
        terms: [
          ["Documentos", "Un hogar y una convención de nombres."],
          ["Dinero", "Registros separados y una rutina de revisión."],
          ["Fechas", "Un calendario con responsables y anticipación."],
          ["Contactos", "Proveedores, términos y renovaciones."],
          ["Procesos", "Pasos repetibles documentados."],
        ],
      },
      {
        id: "tecnologia",
        title: "Use la tecnología para apoyar el sistema",
        paragraphs: [
          "Seleccione herramientas después de definir el proceso. Una aplicación adicional no resuelve responsabilidades poco claras ni registros desorganizados.",
        ],
      },
    ],
    nextSteps: [
      "Evalúe las cinco bases.",
      "Elija el área que más búsqueda o demora produce.",
      "Defina su responsable y lugar oficial.",
      "Revise si el software ayuda o esconde el proceso.",
    ],
  },
  "business-records-what-needs-a-home": {
    title: "Registros empresariales: qué necesita un lugar confiable",
    excerpt:
      "Defina categorías, responsables, acceso y conservación para que los registros importantes puedan encontrarse cuando se necesiten.",
    category: "Registros y administración",
    audience: "Pequeñas empresas",
    type: "Guía de referencia",
    readTime: "8 min de lectura",
    disclaimer: businessNotice,
    sections: [
      {
        id: "categorias",
        title: "Categorías principales",
        items: [
          "Formación y propiedad",
          "Impuestos y finanzas",
          "Contratos y clientes",
          "Proveedores y seguros",
          "Empleados o contratistas",
          "Operaciones, licencias y tecnología",
        ],
      },
      {
        id: "acceso",
        title: "Ajuste el acceso a la sensibilidad",
        paragraphs: [
          "Defina quién puede ver, modificar y compartir cada categoría. Evite que una sola cuenta personal sea el único acceso a registros esenciales.",
        ],
      },
      {
        id: "retencion",
        title: "Decida conservación y pruebe la recuperación",
        paragraphs: [
          "Registre la fuente de cada plazo de conservación. Compruebe que otra persona autorizada pueda encontrar un documento actual sin depender de la memoria del propietario.",
        ],
      },
    ],
    nextSteps: [
      "Cree la estructura de categorías.",
      "Asigne responsable y nivel de acceso.",
      "Identifique registros sin decisión de conservación.",
      "Pruebe si otra persona autorizada puede recuperar un registro actual.",
    ],
  },
  "building-a-business-deadline-calendar": {
    title: "Cómo crear un calendario de fechas empresariales",
    excerpt:
      "Convierta obligaciones dispersas en un calendario con responsables, anticipación, documentación requerida y evidencia de cumplimiento.",
    category: "Registros y administración",
    audience: "Pequeñas empresas",
    type: "Guía y tabla imprimible",
    readTime: "8 min de lectura",
    disclaimer: businessNotice,
    sections: [
      {
        id: "fuentes",
        title: "Haga un inventario de las fuentes",
        items: [
          "Impuestos y reportes",
          "Licencias y permisos",
          "Seguros",
          "Contratos y proveedores",
          "Nómina o contratistas",
          "Dominios, software y renovaciones",
        ],
      },
      {
        id: "registro",
        title: "Use un registro completo",
        table: {
          headers: [
            "Obligación",
            "Fecha",
            "Preparación",
            "Responsable",
            "Estado",
          ],
          rows: [
            [
              "Ejemplo: renovación anual",
              "Fecha oficial",
              "30 días antes",
              "Nombre o función",
              "Pendiente",
            ],
          ],
        },
      },
      {
        id: "evidencia",
        title: "Añada anticipación y conserve evidencia",
        paragraphs: [
          "La fecha límite no es la fecha para comenzar. Defina cuándo reunir información y conserve confirmaciones, recibos o copias de lo presentado.",
        ],
      },
    ],
    nextSteps: [
      "Enumere todas las fuentes de fechas.",
      "Registre responsable y fecha de preparación.",
      "Añada documentos requeridos y estado.",
      "Defina dónde se guardará la evidencia de cumplimiento.",
    ],
  },
};

const officialTitles = {
  "How long should I keep records?":
    "¿Cuánto tiempo debo conservar los registros?",
  "Estimated taxes": "Impuestos estimados",
  "Register your business and find state resources":
    "Registre su empresa y encuentre recursos estatales",
  "Apply for an Employer Identification Number":
    "Solicite un Número de Identificación del Empleador",
  "Tax calendars": "Calendarios tributarios",
};

export const resourcesEs = resources.map((resource) => ({
  ...resource,
  updated: "18 de agosto de 2026",
  ...es[resource.slug],
  official: resource.official.map((item) => ({
    ...item,
    title: officialTitles[item.title] ?? item.title,
  })),
}));

export const resourceBySlugEs = new Map(
  resourcesEs.map((resource) => [resource.slug, resource]),
);
export function resourcesForCategoryEs(category) {
  return category === "All"
    ? resourcesEs
    : resourcesEs.filter(
        (resource) =>
          resource.category ===
          RESOURCE_CATEGORIES_ES.find(([key]) => key === category)?.[1],
      );
}
