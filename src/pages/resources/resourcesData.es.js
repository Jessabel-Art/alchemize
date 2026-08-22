import { resources } from "./resourcesData.js";

export const RESOURCE_CATEGORIES_ES = [
  ["All", "Todos"],
  ["Taxes", "Impuestos"],
  ["Medicare & Insurance", "Medicare y seguros"],
  ["Starting a Business", "Cómo iniciar un negocio"],
  ["Business Operations", "Operaciones empresariales"],
  ["Records & Administration", "Registros y administración"],
  ["Guides & Checklists", "Guías y listas"],
];

const taxNotice =
  "Información educativa general. El tratamiento tributario depende de los hechos individuales y de las leyes federales y estatales aplicables.";
const businessNotice =
  "Información educativa y organizativa general. Los requisitos varían según la jurisdicción y las circunstancias. Este recurso no constituye asesoría legal, contable ni tributaria individualizada.";
const medicareNotice =
  "La información sobre Medicare se ofrece con fines educativos generales. Las reglas, costos, beneficios, planes disponibles y requisitos de inscripción pueden cambiar. Para obtener información oficial vigente, visite Medicare.gov o llame al 1-800-MEDICARE. Este aviso educativo no sustituye ningún aviso de mercadeo que pueda ser exigido según el futuro estado de Alchemize como agente, aseguradora representada, FMO o TPMO.";

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
  "medicare-basics-coverage-choices": {
    title: "Conceptos básicos de Medicare: cómo entender sus opciones",
    excerpt:
      "Un punto de partida claro para comprender las Partes A, B, C y D, las diferencias entre Medicare Original y Medicare Advantage y las preguntas importantes al comparar cobertura.",
    category: "Medicare y seguros",
    audience: "Personas",
    type: "Guía educativa",
    readTime: "10 min de lectura",
    disclaimer: medicareNotice,
    sections: [
      {
        id: "partes",
        title: "Las partes básicas",
        terms: [
          [
            "Parte A",
            "Generalmente ayuda a cubrir hospitalización y determinados servicios de enfermería, hospicio y atención domiciliaria.",
          ],
          [
            "Parte B",
            "Generalmente ayuda a cubrir servicios médicos, atención ambulatoria, equipo médico y prevención.",
          ],
          [
            "Parte C",
            "Medicare Advantage es una alternativa privada aprobada por Medicare para recibir beneficios de las Partes A y B.",
          ],
          [
            "Parte D",
            "Ayuda a cubrir medicamentos recetados mediante planes privados aprobados.",
          ],
        ],
      },
      {
        id: "caminos",
        title: "Dos caminos principales de cobertura",
        comparison: [
          {
            title: "Medicare Original",
            items: [
              "Partes A y B administradas por Medicare",
              "Puede combinarse con una póliza Medigap y un plan de medicamentos por separado",
            ],
          },
          {
            title: "Medicare Advantage",
            items: [
              "Plan privado aprobado que ofrece los beneficios de A y B",
              "Puede incluir medicamentos y beneficios adicionales con reglas de red",
            ],
          },
        ],
      },
      {
        id: "comparar",
        title: "Antes de comparar",
        items: [
          "Médicos y hospitales preferidos",
          "Medicamentos, dosis y farmacias",
          "Cobertura actual o de empleador",
          "Costos totales, no solo la prima",
          "Viajes, residencias múltiples y necesidades de atención",
        ],
      },
    ],
    nextSteps: [
      "Prepare una lista de proveedores, medicamentos, farmacias y otra cobertura.",
      "Revise los dos caminos en Medicare.gov.",
      "Use Medicare Plan Finder para ver opciones actuales en su área.",
      "Anote las preguntas que dependan de su elegibilidad o circunstancias.",
    ],
  },
  "medicare-enrollment-periods": {
    title: "Períodos de inscripción de Medicare: cuándo puede hacer cambios",
    excerpt:
      "Una guía educativa sobre los períodos principales de inscripción y por qué el momento y la acción permitida deben confirmarse en fuentes oficiales.",
    category: "Medicare y seguros",
    audience: "Personas",
    type: "Guía educativa",
    readTime: "8 min de lectura",
    disclaimer: medicareNotice,
    sections: [
      {
        id: "inicial",
        title: "Período de inscripción inicial",
        paragraphs: [
          "Generalmente rodea el mes en que una persona cumple 65 años, pero la elegibilidad y las fechas exactas dependen de sus circunstancias. Confirme su ventana individual.",
        ],
      },
      {
        id: "periodos",
        title: "Otros períodos importantes",
        terms: [
          [
            "Inscripción general",
            "Puede permitir inscribirse en las Partes A o B cuando no se utilizó el período inicial.",
          ],
          [
            "Inscripción abierta",
            "Cada otoño permite determinadas revisiones y cambios de cobertura.",
          ],
          [
            "Inscripción abierta de Medicare Advantage",
            "Permite ciertas acciones para quienes ya están inscritos en Medicare Advantage.",
          ],
          [
            "Períodos especiales",
            "Pueden estar disponibles después de ciertos cambios de empleo, cobertura o circunstancias.",
          ],
        ],
      },
      {
        id: "confirmar",
        title: "Confirme antes de actuar",
        paragraphs: [
          "La acción permitida y la fecha de vigencia varían. No cancele una cobertura existente hasta comprender el inicio de la nueva.",
        ],
        callout:
          "Use Medicare.gov o 1-800-MEDICARE para confirmar información vigente y aplicable a su situación.",
      },
    ],
    nextSteps: [
      "Identifique el cambio de cobertura que considera.",
      "Confirme el período y la acción permitida en Medicare.gov.",
      "Reúna datos del plan, proveedores, medicamentos y otra cobertura.",
      "No cancele cobertura existente hasta comprender las fechas de reemplazo.",
    ],
  },
  "comparing-medicare-coverage": {
    title: "Cómo comparar la cobertura de Medicare más allá de la prima",
    excerpt:
      "Compare proveedores, medicamentos, costos y reglas del plan para formar una visión más completa de la cobertura.",
    category: "Medicare y seguros",
    audience: "Personas",
    type: "Guía comparativa",
    readTime: "9 min de lectura",
    disclaimer: medicareNotice,
    sections: [
      {
        id: "proveedores",
        title: "Comience con proveedores y medicamentos",
        paragraphs: [
          "Confirme directamente la red de médicos, hospitales y farmacias y revise cada medicamento, dosis y restricción. Las redes y formularios pueden cambiar.",
        ],
      },
      {
        id: "costos",
        title: "Mire más allá de la prima",
        items: [
          "Deducible",
          "Copagos y coseguro",
          "Máximo de gastos de bolsillo cuando corresponda",
          "Costos de medicamentos por nivel",
          "Servicios fuera de la red y autorizaciones",
        ],
      },
      {
        id: "uso",
        title: "Considere cómo utiliza la atención",
        paragraphs: [
          "Incluya viajes, condiciones crónicas, frecuencia de especialistas, equipo médico y otra cobertura. Revise nuevamente cada año porque las necesidades y los planes cambian.",
        ],
      },
    ],
    nextSteps: [
      "Cree una lista de proveedores y medicamentos.",
      "Compare los costos totales esperados y las reglas, no solo la prima.",
      "Verifique la red y el formulario vigentes.",
      "Revise cualquier otra cobertura antes de hacer cambios.",
    ],
  },
  "understanding-insurance-coverage": {
    title:
      "Cómo entender la cobertura de seguros y los términos que afectan su costo",
    excerpt:
      "Una explicación práctica de los términos que influyen en lo que paga, lo que cubre una póliza y las preguntas que debe hacer.",
    category: "Medicare y seguros",
    audience: "Personas y propietarios de negocios",
    type: "Explicación",
    readTime: "8 min de lectura",
    disclaimer:
      "Información educativa general. La disponibilidad, terminología, idoneidad y requisitos de los seguros dependen del producto y de la situación individual.",
    sections: [
      {
        id: "terminos",
        title: "Términos que afectan el costo y la cobertura",
        terms: [
          ["Prima", "Importe que paga para mantener la cobertura."],
          [
            "Deducible",
            "Importe que puede pagar antes de que el plan comience a cubrir determinados servicios.",
          ],
          ["Copago", "Cantidad fija por un servicio cubierto."],
          ["Coseguro", "Porcentaje del costo que puede corresponderle."],
          ["Exclusión", "Situación o servicio que la póliza no cubre."],
        ],
      },
      {
        id: "preguntas",
        title: "Preguntas para revisar la cobertura",
        items: [
          "¿Qué documento rige la cobertura?",
          "¿Qué límites y exclusiones se aplican?",
          "¿Qué proveedores o servicios requieren autorización?",
          "¿Qué cambia en una emergencia o fuera del área?",
        ],
      },
      {
        id: "documento",
        title: "El documento contractual es el que cuenta",
        paragraphs: [
          "Los resúmenes ayudan, pero la póliza, el certificado o la evidencia de cobertura contienen los términos aplicables. Solicite aclaración antes de decidir.",
        ],
      },
    ],
    nextSteps: [
      "Reúna los documentos que rigen la cobertura.",
      "Marque términos, exclusiones y límites desconocidos.",
      "Enumere situaciones reales en las que podría usarla.",
      "Solicite aclaraciones antes de tomar una decisión.",
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
  "Your Medicare coverage options": "Sus opciones de cobertura de Medicare",
  "Compare Medicare coverage options":
    "Compare opciones de cobertura de Medicare",
  "Medicare & You 2026 handbook": "Manual Medicare y Usted 2026",
  "Medicare educational resources": "Recursos educativos de Medicare",
  "Joining a Medicare health or drug plan":
    "Inscripción en un plan de salud o medicamentos de Medicare",
  "Special Enrollment Periods": "Períodos especiales de inscripción",
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
