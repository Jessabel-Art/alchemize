// CONTENIDO DE DETALLE DE SERVICIO (español)
//
// Mismos módulos, mismas claves de servicio y misma estructura que
// serviceDetail.en.js. El español no es una versión reducida: cada módulo del
// inglés existe aquí, redactado en español natural.
//
// Los montos en dólares de Traducción y Apostilla provienen de
// src/data/publicServicePricing.js. Ningún otro servicio muestra precios.

const R = {
  tax: "/services/individuals/tax-preparation",
  notary: "/services/individuals/notary-document-services",
  translation: "/services/individuals/translation-services",
  apostille: "/services/individuals/apostille-services",
  advisory: "/services/businesses/advisory-optimization",
  operations: "/services/businesses/operations-implementation",
  foundation: "/services/businesses/readiness-growth",
  bookkeeping: "/services/businesses/bookkeeping-financial-reporting",
  payroll: "/services/businesses/payroll-processing",
  businessTax: "/services/businesses/business-tax-support",
  web: "/web-digital",
};

export const serviceDetailEs = {
  "individual-translation": {
    cta: {
      hero: "Solicitar una traducción",
      close: "Solicitar una traducción",
      info: "Consultar sobre su documento",
      title: "Envíenos los datos del documento.",
      body: "Cuéntenos qué documento es, el sentido del idioma y quién lo recibirá. Alchemize confirma el tipo de traducción, el alcance y el precio antes de comenzar.",
    },
    summary:
      "Traducción de documentos escritos entre inglés y español, desde registros personales breves hasta traducciones certificadas para uso oficial. Los precios se publican abajo; el material complejo o especializado se revisa y se cotiza primero.",
    fit: {
      title: "Solicitudes frecuentes",
      items: [
        "Registros personales para una escuela, un empleador, una agencia u otra institución",
        "Formularios, políticas, correspondencia y materiales para clientes de una empresa",
        "Documentos breves que se necesitan en ambos idiomas",
        "Documentos que deben certificarse para uso oficial",
        "Traducciones que además requerirán notarización o una apostilla",
      ],
    },
    pricing: {
      title: "Elija el tipo de traducción.",
      intro:
        "De inglés a español y de español a inglés se aplican las mismas tarifas. Las tarifas se muestran antes de cualquier recargo por urgencia, servicios separados o costos de terceros.",
      tiers: [
        {
          id: "standard",
          name: "Documento breve estándar",
          text: "Para documentos breves que no requieren certificación.",
          points: [
            "Inglés ↔ español",
            "Formato básico",
            "Una ronda de corrección por errores de traducción",
          ],
        },
        {
          id: "general",
          name: "Traducción general y empresarial",
          text: "Para cartas, formularios, políticas y otro contenido general o empresarial que se cobra según su extensión.",
          points: [
            "Inglés ↔ español",
            "Se cobra por palabra de origen, con un mínimo",
            "El material legal, médico o técnico especializado se revisa y se cotiza",
          ],
        },
        {
          id: "certified",
          name: "Certificada y de uso oficial",
          text: "Para documentos que una institución exige certificados.",
          points: [
            "Traducción completa",
            "Sellos, estampillas y anotaciones pertinentes",
            "Conservación razonable del diseño y revisión de pruebas",
            "Certificado de exactitud de la traducción firmado",
            "PDF digital y una ronda de corrección por errores de traducción",
          ],
        },
      ],
      extras: [
        {
          label: "Servicio urgente",
          text: "+{rush} sobre el precio correspondiente, según disponibilidad.",
        },
        {
          label: "Material complejo",
          text: "Los documentos con formato o diseño complejo, y los materiales legales, médicos o técnicos especializados, se revisan y se cotizan.",
        },
        {
          label: "Plazo de entrega",
          text: "Depende de la extensión del documento, su complejidad, el formato, los requisitos de certificación y la carga de trabajo actual. El plazo se conversa al confirmar el alcance.",
        },
      ],
      separate: {
        title: "Se cobra o se gestiona por separado",
        items: [
          "La notarización, cuando la parte receptora la exige",
          "La facilitación de apostilla, cuando el documento se usará en el extranjero",
        ],
      },
      cta: "Solicitar una traducción",
    },
    does: {
      title: "Cómo se realiza el trabajo",
      intro:
        "El tipo que elija determina el nivel de revisión, certificación y entrega. Alchemize lo confirma antes de traducir cualquier cosa.",
      groups: [
        {
          title: "Antes de comenzar la traducción",
          items: [
            "Confirmar el documento, el sentido del idioma y su finalidad",
            "Identificar qué exige la institución receptora para trabajos de uso oficial",
            "Señalar el formato complejo o el contenido especializado para su revisión y cotización",
            "Confirmar el tipo, el alcance y el precio",
          ],
        },
        {
          title: "La traducción",
          items: [
            "De inglés a español y de español a inglés",
            "Documentos personales, administrativos y empresariales",
            "Revisión de pruebas antes de la entrega en los trabajos certificados",
            "Una ronda de corrección por errores de traducción",
          ],
        },
      ],
    },
    process: [
      [
        "Envíe el documento",
        "Indíquenos el documento, los idiomas, su finalidad y quién lo recibirá.",
      ],
      [
        "Confirme el tipo",
        "Alchemize confirma si es trabajo estándar, general o certificado y qué revisión hace falta.",
      ],
      [
        "Traducción",
        "El documento se traduce y se revisa según el alcance acordado.",
      ],
      [
        "Entrega",
        "Usted recibe la traducción en PDF digital, con el certificado firmado cuando es certificada.",
      ],
    ],
    prepare: [
      "El documento, o un escaneo o una foto clara del mismo",
      "El idioma de origen y el idioma de destino",
      "Quién recibirá la traducción y las instrucciones que haya dado",
      "Nombres, grafías o términos que deban mantenerse uniformes",
      "Su fecha límite",
    ],
    compare: {
      title:
        "La traducción, la notarización y la apostilla son pasos distintos.",
      intro:
        "Algunos documentos solo necesitan traducción. Otros requieren uno o varios de estos pasos, en un orden específico. Cada uno se define por separado.",
      rows: [
        {
          label: "Traducción",
          text: "Convierte un documento escrito entre inglés y español. El tipo que elija determina la revisión, la certificación y la entrega.",
          current: true,
        },
        {
          label: "Notarización",
          text: "Verifica la identidad de quien firma y realiza un acto notarial. Solo hace falta cuando la parte receptora lo exige.",
          to: R.notary,
        },
        {
          label: "Facilitación de apostilla",
          text: "Coordina la autenticación de un documento de Carolina del Norte para su uso en otro país. No es una traducción.",
          to: R.apostille,
        },
        {
          label: "Aceptación",
          text: "Las agencias, tribunales, consulados y autoridades extranjeras fijan sus propias reglas. Alchemize pregunta qué exige la parte receptora antes de aceptar trabajos de uso oficial, pero no puede garantizar la aceptación.",
        },
      ],
    },
    faq: {
      title: "Preguntas sobre traducción",
      items: [
        {
          q: "¿Qué tipo de traducción necesito?",
          a: "Depende de lo que pida la parte receptora. Si una agencia, escuela o institución exige una traducción certificada, elija la certificada y de uso oficial. El contenido cotidiano y empresarial suele encajar en la traducción estándar o general. Si no está seguro, dígannos quién la recibirá y le ayudaremos a identificar el tipo adecuado.",
        },
        {
          q: "¿Qué significa «hasta 250 palabras de origen»?",
          a: "La tarifa por página se aplica a páginas de hasta 250 palabras en el documento de origen. Las páginas más extensas o densas se revisan para confirmar el precio antes de comenzar.",
        },
        {
          q: "¿Aceptarán mi traducción?",
          a: "Alchemize no puede garantizar la aceptación. Las agencias, instituciones, tribunales, consulados y autoridades extranjeras fijan sus propios requisitos. En los trabajos de uso oficial preguntamos qué exige la parte receptora antes de aceptar el trabajo.",
        },
        {
          q: "¿Necesito también notarización o una apostilla?",
          a: "Solo si la parte receptora lo exige. Ambos son servicios separados, definidos y cobrados por su cuenta, y la parte receptora puede indicarle qué pasos aplican.",
        },
        {
          q: "¿Cuánto tardará?",
          a: "El plazo depende de la extensión del documento, su complejidad, el formato, los requisitos de certificación y la carga de trabajo actual. El servicio urgente está sujeto a disponibilidad. El plazo se conversa al confirmar el alcance.",
        },
        {
          q: "¿Qué pasa si hay un error?",
          a: "Las traducciones estándar y las certificadas incluyen una ronda de corrección por errores de traducción.",
        },
        {
          q: "¿Pueden traducir documentos legales, médicos o técnicos?",
          a: "El material especializado y los documentos con formato o diseño complejo se revisan primero y se cotizan de forma individual.",
        },
      ],
    },
    related: [
      [
        R.apostille,
        "Si el documento se usará en el extranjero, la autenticación es un paso aparte.",
      ],
      [
        R.notary,
        "Si una firma o una declaración jurada debe notarizarse, se solicita por separado.",
      ],
    ],
  },

  "individual-apostille": {
    cta: {
      hero: "Iniciar una solicitud de apostilla",
      close: "Iniciar una solicitud de apostilla",
      info: "Consultar sobre su documento",
      title: "Cuéntenos sobre el documento y su destino.",
      body: "Indíquenos el tipo de documento y el país de destino. Alchemize revisa lo que el documento necesita y confirma el alcance y los siguientes pasos antes de iniciar el servicio.",
    },
    summary:
      "Alchemize facilita el proceso de apostilla de Carolina del Norte para documentos de Carolina del Norte: revisa el documento, determina qué preparación necesita y coordina la presentación y la devolución. Los precios se publican abajo; las tarifas del gobierno y de terceros se cobran aparte.",
    fit: {
      title: "Situaciones frecuentes",
      items: [
        "Un documento de Carolina del Norte que se usará en otro país",
        "Una institución o autoridad extranjera pidió una apostilla",
        "No sabe si el documento necesita notarización o traducción primero",
        "Varios documentos deben avanzar juntos por el proceso",
      ],
    },
    pricing: {
      title: "Precios de facilitación transparentes.",
      intro:
        "Esta es la tarifa de facilitación de Alchemize. Los costos del gobierno y de terceros se cobran aparte y dependen de sus documentos y del destino.",
      tiers: [
        {
          id: "first",
          name: "Primer documento",
          text: "Revisión, coordinación de la preparación y facilitación de un documento de Carolina del Norte.",
          points: [
            "Revisión del documento y del destino",
            "Requisitos de preparación identificados",
            "Presentación y devolución coordinadas",
          ],
        },
        {
          id: "additional",
          name: "Documentos adicionales",
          text: "Cada documento adicional que se facilite dentro del mismo servicio.",
          points: [
            "Se suma a la misma solicitud",
            "Mismo proceso de Carolina del Norte",
          ],
        },
      ],
      extras: [
        {
          label: "Modelo de servicio actual",
          text: "Solo documentos de Carolina del Norte.",
        },
        {
          label: "Solicitudes",
          text: "Cada solicitud se revisa antes de confirmar el servicio.",
        },
      ],
      separate: {
        title: "No incluido en la tarifa de facilitación",
        items: [
          "Tarifas del gobierno",
          "Costos de envío y mensajería",
          "Costos de envío urgente e internacional",
          "Otros costos de terceros",
          "Notarización o traducción certificada, cuando el documento los necesite",
        ],
      },
      cta: "Iniciar una solicitud de apostilla",
    },
    does: {
      title: "Lo que hace Alchemize y lo que no.",
      intro:
        "Alchemize facilita el proceso. La apostilla la emite la autoridad gubernamental correspondiente.",
      groups: [
        {
          title: "Alchemize facilita",
          items: [
            "Revisa el documento y el lugar donde se usará",
            "Identifica si primero hace falta notarización, traducción u otra preparación",
            "Organiza el paquete de documentos",
            "Facilita el proceso de apostilla de Carolina del Norte que corresponda",
            "Coordina la devolución de los documentos terminados",
          ],
        },
        {
          title: "Fuera del control de Alchemize",
          items: [
            "Emitir la apostilla",
            "Los plazos de procesamiento del gobierno",
            "Que una autoridad extranjera acepte el documento",
            "Asesoría legal o migratoria",
          ],
        },
      ],
    },
    process: [
      [
        "Revisar el documento",
        "Tipo de documento, origen, país de destino y requisitos de la parte receptora.",
      ],
      [
        "Determinar la preparación",
        "Si primero hace falta notarización, traducción u otros pasos, según el documento y el destino.",
      ],
      [
        "Facilitar el proceso",
        "Organizar el paquete y facilitar el proceso de apostilla de Carolina del Norte que corresponda.",
      ],
      [
        "Devolver los documentos",
        "Coordinar la devolución de los documentos terminados según lo acordado.",
      ],
    ],
    prepare: [
      "El documento, o una copia clara del mismo",
      "El país de destino y la autoridad receptora",
      "Las instrucciones de la parte receptora",
      "Registros de notarización o certificación existentes, si los hay",
      "Cómo y dónde deben devolverse los documentos terminados",
    ],
    compare: {
      title: "¿Qué servicios podría necesitar su documento?",
      intro:
        "Según el documento y el destino, puede que necesite una combinación de estos servicios. Alchemize los mantiene separados para que cada paso se defina por su cuenta.",
      rows: [
        {
          label: "Facilitación de apostilla",
          text: "Coordina el proceso de apostilla de Carolina del Norte para su documento. Alchemize no emite apostillas.",
          current: true,
        },
        {
          label: "Preparación del documento",
          text: "Asegurarse de que el documento esté completo, bien firmado y organizado antes de presentarlo.",
        },
        {
          label: "Notarización",
          text: "Algunos documentos deben notarizarse antes de solicitar una apostilla. Si el suyo lo requiere depende del documento.",
          to: R.notary,
        },
        {
          label: "Traducción certificada",
          text: "Si el país receptor necesita el documento en otro idioma, la traducción es un servicio aparte.",
          to: R.translation,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre apostilla",
      items: [
        {
          q: "¿Alchemize emite la apostilla?",
          a: "No. Las apostillas las emite la autoridad gubernamental correspondiente. Alchemize facilita el proceso y coordina los documentos.",
        },
        {
          q: "¿Necesito una traducción antes de la apostilla?",
          a: "Depende del destino y de la autoridad receptora. La traducción es un servicio aparte. Identificamos lo que su situación necesita durante la revisión del documento.",
        },
        {
          q: "¿Hay que notarizar el documento primero?",
          a: "Algunos documentos sí y otros no. La respuesta depende del tipo de documento, por lo que se determina en la revisión y no se da por supuesta.",
        },
        {
          q: "¿Con qué documentos pueden ayudar?",
          a: "El modelo de servicio actual abarca documentos de Carolina del Norte. Cuéntenos qué tiene y confirmaremos si encaja.",
        },
        {
          q: "¿Qué cubre la tarifa de facilitación?",
          a: "La facilitación de Alchemize para el primer documento, con cada documento adicional del mismo servicio sumado aparte. Las tarifas del gobierno, el envío y la mensajería, los costos urgentes o internacionales y otros costos de terceros se cobran por separado.",
        },
        {
          q: "¿Cuánto tardará?",
          a: "El tiempo de procesamiento lo controla la autoridad gubernamental, por lo que Alchemize no puede garantizarlo. Le explicamos qué esperar para su documento al confirmar el alcance.",
        },
        {
          q: "¿Lo aceptará el país extranjero?",
          a: "Alchemize no puede garantizar la aceptación por parte de una autoridad extranjera. Consulte los requisitos de la parte receptora y compártalos con nosotros para que la preparación coincida.",
        },
      ],
    },
    related: [
      [
        R.translation,
        "Servicio aparte, necesario cuando el país receptor exige otro idioma.",
      ],
      [
        R.notary,
        "Algunos documentos deben notarizarse antes de solicitar una apostilla.",
      ],
    ],
  },

  "individual-notary": {
    cta: {
      hero: "Solicitar una cita notarial",
      close: "Solicitar una cita notarial",
      info: "Consultar antes de reservar",
      title: "Cuéntenos qué necesita notarizar.",
      body: "Indíquenos el documento, quién debe firmar, y dónde y cuándo. Alchemize revisa la solicitud y coordina la cita con usted.",
    },
    summary:
      "Solicite una cita con un notario de Carolina del Norte. Cuéntele a Alchemize qué necesita notarizar y dónde; la solicitud se revisa y la cita se coordina con un notario autorizado.",
    fit: {
      title: "Necesidades notariales frecuentes",
      items: [
        "Reconocimiento de la firma en un documento",
        "Declaraciones juradas y verificaciones bajo juramento",
        "Juramentos y afirmaciones",
        "Documentos que la parte receptora exige notarizados",
        "Firmantes y testigos que deben coordinarse para una sola cita",
      ],
    },
    does: {
      title: "Lo que respalda el servicio.",
      intro:
        "La notarización es un paso para dejar un documento listo. Alchemize ayuda con las solicitudes y con la preparación que la rodea.",
      groups: [
        {
          title: "Solicitudes notariales",
          items: [
            "Revisión de la solicitud y del acto que se pide",
            "Coordinación de la cita con un notario autorizado",
            "Confirmación de firmantes, identificación y testigos",
            "Realización del acto notarial solicitado",
          ],
        },
        {
          title: "Apoyo documental alrededor de la cita",
          items: [
            "Impresión, escaneo y copias",
            "Conversión de archivos y organización digital",
            "Armado de paquetes de documentos",
            "Revisión de que esté completo y en el formato correcto antes de presentarlo",
          ],
        },
      ],
    },
    process: [
      [
        "Solicitud",
        "Indíquenos el documento, quién debe firmar, el lugar y su fecha límite.",
      ],
      [
        "Revisión",
        "Alchemize confirma el acto que se solicita y las instrucciones de la parte receptora.",
      ],
      [
        "Coordinación",
        "Se programa la cita y se confirman sus detalles con todas las personas involucradas.",
      ],
      [
        "Cita",
        "Se verifica la identificación y un notario autorizado realiza el acto notarial.",
      ],
    ],
    prepare: [
      "El documento completo, sin firmar salvo que se indique lo contrario",
      "Identificación aceptable de cada firmante",
      "Todos los firmantes presentes y testigos, si se requieren",
      "Las instrucciones de la parte receptora",
      "Lugar y hora de la cita, y datos de devolución",
    ],
    compare: {
      title: "Dónde encaja la notarización con otros servicios.",
      intro:
        "Un notario verifica la identidad y realiza un acto notarial. No decide qué debe decir un documento ni si es legalmente suficiente.",
      rows: [
        {
          label: "Notarización",
          text: "Verificación de identidad y realización del acto notarial solicitado.",
          current: true,
        },
        {
          label: "Apoyo documental",
          text: "Impresión, escaneo, organización de paquetes y revisión administrativa. No incluye formularios legales, redacción ni asesoría legal.",
        },
        {
          label: "Traducción",
          text: "Si el documento también debe estar en inglés o en español, la traducción es un servicio aparte.",
          to: R.translation,
        },
        {
          label: "Facilitación de apostilla",
          text: "Para su uso en el extranjero, una apostilla puede seguir a la notarización. Es un servicio aparte.",
          to: R.apostille,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre notaría",
      items: [
        {
          q: "¿Qué pasa después de enviar una solicitud?",
          a: "Alchemize la revisa, confirma los detalles con usted y coordina la cita. Según la solicitud, la cita puede coordinarse con otro notario apropiado.",
        },
        {
          q: "¿Qué debo llevar?",
          a: "El documento completo (sin firmar salvo que se indique lo contrario), identificación aceptable de cada firmante, todos los firmantes y testigos requeridos, y las instrucciones de la parte receptora.",
        },
        {
          q: "¿Pueden decirme qué acto notarial necesita mi documento?",
          a: "Eso debe especificarlo la parte receptora o un abogado. Un notario no elige formularios, no redacta textos ni da asesoría legal, pero Alchemize puede revisar con usted las instrucciones de la parte receptora.",
        },
        {
          q: "¿Pueden notarizar un documento que se usará en el extranjero?",
          a: "La notarización puede ser un primer paso. La autenticación para su uso en otro país, la apostilla, es un servicio aparte.",
        },
        {
          q: "¿Cuánto cuesta?",
          a: "Las tarifas se confirman con usted cuando se revisa su solicitud.",
        },
      ],
    },
    related: [
      [
        R.apostille,
        "Para documentos que irán al extranjero, la apostilla puede ser el siguiente paso.",
      ],
      [
        R.translation,
        "Servicio aparte para documentos que necesitan otro idioma.",
      ],
    ],
  },

  "individual-tax": {
    cta: {
      hero: "Iniciar una consulta de impuestos",
      close: "Iniciar una consulta de impuestos",
      info: "Preguntar si su declaración encaja",
      title: "Cuéntenos su situación tributaria.",
      body: "No necesita saber qué formularios aplican. Describa sus ingresos y los cambios que hubo; Alchemize confirma la compatibilidad y el alcance antes de preparar la declaración.",
    },
    summary:
      "Preparación de impuestos individuales para declaraciones sencillas y más complejas, incluidos el trabajo por cuenta propia, las propiedades de alquiler y las declaraciones de años anteriores o enmendadas, organizada en torno a sus registros para que pueda empezar sin saber qué formularios aplican.",
    fit: {
      title: "Situaciones frecuentes",
      items: [
        "Ingresos con formulario W-2 y deducción estándar o detallada",
        "Trabajo por cuenta propia o ingresos adicionales",
        "Propiedades de alquiler",
        "Venta de inversiones, jubilación, HSA, educación, desempleo o seguro del mercado",
        "Ingresos con Schedule K-1",
        "Una declaración que debe enmendarse o años anteriores pendientes",
      ],
    },
    does: {
      title: "Declaraciones que Alchemize está estructurada para apoyar.",
      intro:
        "Cada declaración se revisa para confirmar que encaja antes de aceptar el servicio. Que un caso esté dentro del alcance no significa que toda situación se acepte automáticamente.",
      groups: [
        {
          title: "Declaraciones individuales",
          items: [
            "Declaraciones sencillas del Formulario 1040",
            "Declaraciones individuales más complejas, con anexos adicionales",
            "Trabajadores por cuenta propia, incluido el Schedule C",
            "Situaciones de propiedades de alquiler",
            "Actividad de inversión ordinaria",
            "Conceptos de jubilación, HSA, educación, desempleo y seguro del mercado, donde apliquen",
            "Situaciones con Schedule K-1, según su complejidad",
          ],
        },
        {
          title: "Correcciones y años anteriores",
          items: [
            "Declaraciones enmendadas, incluidas las preparadas por otro preparador",
            "Declaraciones de años anteriores, con cada año fiscal como un servicio independiente",
          ],
        },
        {
          title: "Lo que puede cambiar el alcance",
          items: [
            "La cantidad de negocios o entidades involucradas",
            "Los estados involucrados",
            "Inversiones y asuntos de base fiscal",
            "El estado de sus registros",
            "Asuntos extranjeros o especializados",
          ],
        },
      ],
    },
    process: [
      [
        "Describa su situación",
        "Fuentes de ingresos, cambios recientes y declaraciones anteriores. No necesita formularios.",
      ],
      [
        "Confirme compatibilidad y alcance",
        "Alchemize confirma el tipo de declaración, los estados y la complejidad antes de preparar.",
      ],
      [
        "Reúna y revise",
        "Se reúnen los registros y se identifican los documentos que faltan.",
      ],
      [
        "Prepare y finalice",
        "Se prepara la declaración, se revisa con usted y se confirma el siguiente paso.",
      ],
    ],
    compare: {
      title: "La preparación de impuestos es un servicio entre varios.",
      intro:
        "Preparar una declaración no incluye automáticamente el trabajo que la rodea. Cada uno de estos servicios es aparte.",
      rows: [
        {
          label: "Preparación de impuestos",
          text: "Preparar su declaración a partir de sus registros, dentro del alcance confirmado para su situación.",
          current: true,
        },
        {
          label: "Teneduría de libros y depuración",
          text: "Organizar y conciliar registros financieros. Los registros desordenados de un trabajador por cuenta propia o de un negocio pueden necesitarlo primero.",
          to: R.bookkeeping,
        },
        {
          label: "Planificación y asesoría tributaria",
          text: "La estrategia a futuro es un servicio aparte y no se incluye automáticamente.",
        },
        {
          label: "Representación ante el IRS y el estado",
          text: "Los avisos, auditorías y trámites de resolución son aparte y no forman parte de la preparación de impuestos. Algunos asuntos requieren un CPA, un agente registrado o un abogado.",
        },
        {
          label: "Declaraciones empresariales",
          text: "Las declaraciones de sociedades (1065), de corporaciones S (1120-S) y de corporaciones C (1120) se preparan en el apoyo tributario empresarial.",
          to: R.businessTax,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre preparación de impuestos",
      items: [
        {
          q: "¿Necesito saber qué formularios necesito?",
          a: "No. Describa sus ingresos y los cambios que hubo, y Alchemize identifica lo que aplica al confirmar el alcance.",
        },
        {
          q: "¿Pueden preparar mi declaración si soy trabajador por cuenta propia o tengo una propiedad de alquiler?",
          a: "Alchemize está estructurada para apoyar a los trabajadores por cuenta propia, incluido el Schedule C, y las situaciones de propiedades de alquiler. La cantidad de negocios o propiedades, y los estados involucrados, pueden afectar el alcance.",
        },
        {
          q: "¿Pueden ayudar con años anteriores o con una declaración enmendada?",
          a: "Sí, ambos están dentro de la estructura del servicio. Cada año anterior es un servicio independiente, y las declaraciones enmendadas se revisan antes de aceptar el trabajo.",
        },
        {
          q: "¿La preparación incluye planificación o representación ante el IRS?",
          a: "No. La planificación y asesoría tributaria, y la representación o resolución ante el IRS o el estado, son servicios aparte y no se incluyen automáticamente.",
        },
        {
          q: "¿Qué pasa si mis registros están desordenados?",
          a: "La complejidad y el estado de los registros afectan el alcance. Los registros que necesiten organizarse o conciliarse primero pueden requerir una depuración de teneduría de libros antes de preparar la declaración.",
        },
        {
          q: "¿Cómo sé si mi situación encaja?",
          a: "Envíe una consulta. Alchemize la revisa y le dice si encaja en el servicio. Algunos asuntos requieren un CPA, un agente registrado o un abogado.",
        },
        {
          q: "¿Cuánto cuesta?",
          a: "El costo se confirma después de revisar su situación, según el tipo de declaración y su complejidad.",
        },
      ],
    },
    related: [
      [
        R.businessTax,
        "Para declaraciones de sociedades y de corporaciones S y C.",
      ],
      [
        R.bookkeeping,
        "Los registros organizados facilitan preparar y revisar una declaración.",
      ],
      [R.notary, "Para documentos que además deben notarizarse."],
    ],
  },

  "business-advisory": {
    cta: {
      hero: "Hablar sobre su reto empresarial",
      close: "Hablar sobre su reto empresarial",
      info: "Preguntar qué servicio encaja",
      title: "Empiece por el problema que necesita resolver.",
      body: "Describa el reto, la decisión o la fricción. Alchemize recomienda el servicio adecuado antes de comenzar cualquier trabajo.",
    },
    summary:
      "La asesoría es donde empieza el trabajo: diagnosticar la situación actual, encontrar la verdadera limitación, priorizar y salir con recomendaciones y una hoja de ruta que pueda ejecutar. La ejecución sustancial es un servicio aparte.",
    fit: {
      title: "Cuándo encaja la asesoría",
      items: [
        "Un problema recurrente cuya causa no ha podido rastrear",
        "Una decisión que necesita análisis antes de comprometerse",
        "Demasiadas prioridades y ningún orden claro",
        "Sistemas u organización que ya no acompañan al negocio",
        "Existen recomendaciones, pero no un plan para llevarlas a cabo",
      ],
    },
    does: {
      title: "Primero diagnosticar, luego asesorar.",
      intro:
        "La asesoría define qué debe cambiar y por qué. Poner el cambio en marcha corresponde a Operaciones.",
      groups: [
        {
          title: "Diagnosticar",
          items: [
            "Entender la situación actual del negocio",
            "Identificar brechas en flujos de trabajo, información, responsables y herramientas",
            "Analizar un reto empresarial definido",
            "Evaluar procesos, sistemas y organización",
          ],
        },
        {
          title: "Asesorar",
          items: [
            "Priorizar según impacto, dependencias, urgencia y capacidad",
            "Elaborar recomendaciones claras",
            "Crear una hoja de ruta que se pueda ejecutar",
            "Respaldar decisiones con investigación, incluida la revisión de proveedores",
          ],
        },
      ],
    },
    options: {
      title: "Los servicios crecen con la pregunta.",
      intro:
        "Empiece con el servicio más pequeño que responda su pregunta. Cada uno se apoya en el anterior.",
      items: [
        {
          tag: "Un reto definido",
          name: "Estrategia enfocada",
          text: "Una sesión de trabajo sobre un reto o una decisión, que termina con próximos pasos documentados.",
        },
        {
          tag: "El panorama completo",
          name: "Evaluación de las bases del negocio",
          text: "Descubrimiento, revisión de brechas en todo el negocio, recomendaciones priorizadas y un plan de acción por escrito.",
        },
        {
          tag: "Trabajo más profundo",
          name: "Jornada intensiva empresarial",
          text: "Medio día o día completo de trabajo sobre asuntos conectados: análisis de procesos, flujos y sistemas, con planificación de la implementación y un resumen por escrito.",
        },
        {
          tag: "Negocios nuevos",
          name: "Puesta en marcha y preparación",
          text: "Evaluación de las bases más una hoja de ruta de arranque, descritas en Bases del negocio.",
          to: R.foundation,
        },
      ],
      note: "¿No está seguro de cuál encaja? Describa la situación y Alchemize le recomendará un punto de partida.",
    },
    compare: {
      title:
        "Asesoría, operaciones y apoyo administrativo son trabajos distintos.",
      intro:
        "La asesoría determina qué debe cambiar y por qué. Operaciones implementa cómo cambia. El apoyo administrativo realiza tareas definidas.",
      rows: [
        {
          label: "Asesoría empresarial",
          text: "Diagnosticar y asesorar: evaluar, priorizar, recomendar y planificar.",
          current: true,
        },
        {
          label: "Implementación de operaciones",
          text: "Construir y mejorar: rediseñar flujos de trabajo, redactar procedimientos, configurar sistemas y capacitar al equipo.",
          to: R.operations,
        },
        {
          label: "Apoyo administrativo",
          text: "Hacer: realizar tareas recurrentes definidas, según se necesite o de forma mensual.",
          to: R.operations,
        },
        {
          label: "Bases del negocio",
          text: "Para negocios que se están estableciendo o preparando para su siguiente etapa.",
          to: R.foundation,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre asesoría",
      items: [
        {
          q: "¿Cuál es la diferencia entre asesoría e implementación?",
          a: "La asesoría diagnostica el problema y recomienda qué hacer. La implementación, que es Operaciones, construye y configura el cambio. Son servicios separados para que usted pueda actuar sobre las recomendaciones como prefiera.",
        },
        {
          q: "¿Con qué servicio debo empezar?",
          a: "Si tiene un reto o una decisión claros, empiece con una sesión enfocada. Si no sabe dónde está la fricción, empiece con la evaluación más amplia. Alchemize le recomendará una al describir la situación.",
        },
        {
          q: "¿Qué recibo al final?",
          a: "Recomendaciones y próximos pasos documentados. Los formatos más amplios incluyen un plan de acción por escrito.",
        },
        {
          q: "¿Puede Alchemize llevar a cabo las recomendaciones?",
          a: "Sí, a través de Operaciones u otros servicios, definidos por separado. También puede ejecutarlas por su cuenta o con otro proveedor.",
        },
        {
          q: "¿La asesoría reemplaza la asesoría legal, contable o tributaria?",
          a: "No. La asesoría empresarial no reemplaza la asesoría legal, contable, tributaria, de inversión ni otra asesoría profesional regulada.",
        },
      ],
    },
    related: [
      [
        R.operations,
        "Donde las recomendaciones se convierten en flujos y sistemas que funcionan.",
      ],
      [R.foundation, "Para la preparación de arranque y el plan de negocios."],
      [R.web, "Para sitios web, visibilidad en búsquedas y automatización."],
    ],
  },

  "business-operations": {
    cta: {
      hero: "Hablar sobre su proyecto de operaciones",
      close: "Hablar sobre su proyecto de operaciones",
      info: "Preguntar qué alcance encaja",
      title: "Cuéntenos qué flujo de trabajo debe funcionar mejor.",
      body: "Describa el proceso, las herramientas involucradas y qué debería ser distinto. Alchemize recomienda un alcance antes de comenzar.",
    },
    summary:
      "Operaciones es donde las recomendaciones se convierten en sistemas que funcionan. Alchemize rediseña los flujos de trabajo, construye los procedimientos, plantillas y configuraciones de herramientas que los respaldan, capacita a su equipo y entrega algo que el negocio pueda mantener.",
    fit: {
      title: "Cuándo encaja operaciones",
      items: [
        "La información de los clientes vive en correos, mensajes y en la memoria de alguien",
        "Las tareas recurrentes no tienen un responsable claro",
        "Los archivos y registros no tienen un lugar confiable",
        "Hace falta configurar un CRM o un sistema de admisión, de citas o de tareas",
        "Necesita ayuda administrativa recurrente con tareas definidas",
      ],
    },
    does: {
      title: "Construir y mejorar cómo funciona el trabajo.",
      intro:
        "Operaciones rediseña y construye cómo funciona el trabajo en sí. El apoyo administrativo realiza tareas definidas dentro de un proceso que ya existe.",
      groups: [
        {
          title: "Flujos de trabajo",
          items: [
            "Revisión y rediseño de flujos de trabajo",
            "Mapeo de procesos",
            "Procedimientos operativos estándar",
            "Listas de verificación y plantillas",
          ],
        },
        {
          title: "Sistemas y herramientas",
          items: [
            "Configuración de sistemas del negocio",
            "Instalación de herramientas y plataformas",
            "Integraciones sencillas",
            "Organización e importación de datos, donde corresponda",
          ],
        },
        {
          title: "Adopción y crecimiento",
          items: [
            "Capacitación y entrega",
            "Mejora de varios flujos de trabajo conectados",
            "Transformación operativa de mayor escala, definida como trabajo a la medida",
          ],
        },
        {
          title: "Apoyo administrativo",
          items: [
            "Organización de documentos, hojas de cálculo y archivos",
            "Agenda y correspondencia rutinaria",
            "Captura de datos en CRM y administración de la admisión de clientes",
            "Preparación de facturas y seguimiento",
            "Investigación en línea y preparación de reuniones",
          ],
        },
      ],
    },
    options: {
      title: "Definido según el tamaño del cambio.",
      intro:
        "El trabajo se define por entregables, no por horas. El tamaño adecuado depende de cuántos flujos de trabajo y sistemas intervienen.",
      items: [
        {
          tag: "Un flujo de trabajo",
          name: "Implementación de proceso y flujo de trabajo",
          text: "Revisar, rediseñar e implementar un flujo de trabajo claramente definido, con una lista de verificación o plantilla de apoyo, instrucciones de operación y capacitación.",
        },
        {
          tag: "Herramientas y sistemas",
          name: "Configuración de sistemas del negocio",
          text: "Requisitos, una recomendación de herramienta, configuración, una integración sencilla, importación básica de datos y capacitación.",
        },
        {
          tag: "Flujos conectados",
          name: "Sprint de mejora operativa",
          text: "Un servicio definido de varias semanas sobre varios flujos de trabajo conectados: mapeo, rediseño, implementación, procedimientos y capacitación.",
        },
        {
          tag: "Grande o complejo",
          name: "Transformación operativa",
          text: "Varios departamentos, bibliotecas extensas de procedimientos, implementaciones grandes de sistemas o migraciones importantes, definidos tras el descubrimiento.",
        },
      ],
      note: "El apoyo administrativo se ofrece según se necesite o como apoyo mensual recurrente para tareas definidas.",
    },
    compare: {
      title:
        "Operaciones, asesoría y apoyo administrativo son trabajos distintos.",
      intro:
        "La asesoría determina qué debe cambiar y por qué. Operaciones implementa cómo cambia. El apoyo administrativo realiza el trabajo definido.",
      rows: [
        {
          label: "Implementación de operaciones",
          text: "Construir y mejorar: rediseñar el flujo, documentarlo, configurar las herramientas y capacitar al equipo.",
          current: true,
        },
        {
          label: "Asesoría empresarial",
          text: "Diagnosticar y asesorar: evaluar el negocio y decidir qué debe cambiar primero.",
          to: R.advisory,
        },
        {
          label: "Apoyo administrativo",
          text: "Hacer: realizar tareas recurrentes definidas. No rediseña el proceso ni implementa sistemas.",
          current: true,
        },
        {
          label: "Automatización digital",
          text: "Cuando un flujo de trabajo necesita software conectado entre aplicaciones, corresponde a Web y soluciones digitales.",
          to: R.web,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre operaciones",
      items: [
        {
          q: "¿Cuál es la diferencia entre operaciones y asesoría?",
          a: "La asesoría decide qué debe cambiar y por qué. Operaciones construye el cambio: el flujo de trabajo, los documentos, las herramientas y la capacitación. Si el problema y el flujo objetivo ya están claros, la implementación puede comenzar directamente.",
        },
        {
          q: "¿Cuál es la diferencia entre operaciones y apoyo administrativo?",
          a: "Operaciones diseña y construye cómo funciona el trabajo. El apoyo administrativo realiza tareas definidas, como agenda, captura de datos, correspondencia y organización de archivos. El apoyo administrativo no incluye rediseño de procesos ni implementación de sistemas.",
        },
        {
          q: "¿Pueden configurar un CRM o un sistema de admisión?",
          a: "Sí, incluida la configuración básica y las integraciones sencillas. El trabajo avanzado de CRM, las migraciones complejas y la automatización a la medida se definen por separado, y la automatización se atiende en Web y soluciones digitales.",
        },
        {
          q: "¿Se capacitará a mi equipo?",
          a: "La capacitación y la entrega forman parte de la implementación, para que el proceso pueda funcionar sin Alchemize.",
        },
        {
          q: "¿El apoyo administrativo está disponible de forma recurrente?",
          a: "Sí, según se necesite o como apoyo mensual recurrente para tareas definidas.",
        },
      ],
    },
    related: [
      [R.advisory, "Decida qué debe cambiar y por qué antes de construirlo."],
      [R.web, "Para automatización y sistemas digitales conectados."],
      [
        R.bookkeeping,
        "La teneduría de libros, la nómina y los impuestos son servicios aparte.",
      ],
    ],
  },

  "business-readiness": {
    cta: {
      hero: "Planificar las bases de su negocio",
      close: "Planificar las bases de su negocio",
      info: "Preguntar qué punto de partida encaja",
      title: "Cuéntenos desde dónde parte el negocio.",
      body: "Describa el negocio, su etapa y para qué se está preparando. Alchemize recomienda un punto de partida antes de comenzar cualquier trabajo.",
    },
    summary:
      "Para negocios que se están estableciendo o preparando para su siguiente etapa: una lectura clara de cómo están las bases, una hoja de ruta de arranque y trabajo de plan de negocios y preparación financiera, sin prometer financiamiento, certificación ni aprobación.",
    fit: {
      title: "Cuándo encaja",
      items: [
        "Un negocio nuevo que necesita un camino de arranque claro",
        "Los datos de constitución y los pasos de arranque están dispersos",
        "Se necesita un plan o proyecciones financieras para planificar o para una revisión externa",
        "Inscripciones, certificaciones u oportunidades como proveedor necesitan registros organizados",
        "Un negocio existente que se prepara para su siguiente etapa",
      ],
    },
    does: {
      title: "Evaluar, planificar y organizar.",
      intro:
        "El objetivo es un mejor proceso de planificación y decisión, no gestionar financiamiento ni prometer una aprobación.",
      groups: [
        {
          title: "Evaluar",
          items: [
            "Evaluación de las bases: descubrimiento, revisión de brechas y recomendaciones priorizadas",
            "Un plan de acción por escrito",
            "Revisión de la preparación del negocio y del crecimiento",
          ],
        },
        {
          title: "Planificar",
          items: [
            "Hoja de ruta de arranque y lista de verificación de preparación",
            "Elaboración del plan de negocios",
            "Materiales de preparación financiera: proyecciones, flujo de efectivo, punto de equilibrio y marco del uso de fondos, donde corresponda",
          ],
        },
        {
          title: "Organizar",
          items: [
            "Preparación administrativa de constitución y arranque",
            "Ayuda con el EIN dentro del alcance permitido",
            "Preparación de inscripciones, registros de proveedor y declaración de capacidades",
            "Bases de la presencia local, incluida la configuración de Google Business Profile",
          ],
        },
      ],
    },
    options: {
      title: "Empiece desde donde está el negocio.",
      intro:
        "Estos servicios se construyen uno sobre otro. El sitio web, la teneduría de libros, la nómina, los impuestos y la implementación sustancial son servicios aparte.",
      items: [
        {
          tag: "Entender el punto de partida",
          name: "Evaluación de las bases",
          text: "Descubrimiento, revisión de brechas, recomendaciones priorizadas y un plan de acción por escrito.",
        },
        {
          tag: "Negocios nuevos",
          name: "Paquete de arranque",
          text: "Evaluación, hoja de ruta de arranque, consulta de operaciones, configuración de Google Business Profile, una lista de verificación de preparación y reuniones de trabajo sobre los primeros pasos.",
        },
        {
          tag: "Planificar el negocio",
          name: "Plan de negocios",
          text: "Descubrimiento, resumen ejecutivo, bases de mercado y competencia, operaciones, gestión y enfoque de mercadeo, en un plan con formato y rondas de revisión.",
        },
        {
          tag: "Plan y preparación financiera",
          name: "Plan de negocios con preparación financiera",
          text: "El plan más un trabajo de mercado más profundo, supuestos documentados, estado de resultados proyectado, flujo de efectivo, análisis del punto de equilibrio y una lista de verificación de documentos de respaldo. Los planes más grandes o con mucha investigación se definen de forma individual.",
        },
      ],
      note: "La planificación de negocios no es gestión de préstamos. Alchemize no empareja prestamistas, no negocia con ellos, no presenta solicitudes ni garantiza financiamiento.",
    },
    compare: {
      title: "El trabajo de bases frente a los servicios que lo rodean.",
      intro:
        "El trabajo de bases establece y planifica un negocio. Estos servicios cercanos cumplen otras funciones.",
      rows: [
        {
          label: "Bases del negocio",
          text: "Establecer, planificar y preparar el negocio, incluida la preparación financiera.",
          current: true,
        },
        {
          label: "Asesoría empresarial",
          text: "Diagnosticar un reto o una decisión concretos en un negocio que ya está funcionando.",
          to: R.advisory,
        },
        {
          label: "Teneduría de libros",
          text: "Registros financieros continuos, aparte de la planificación y las proyecciones.",
          to: R.bookkeeping,
        },
        {
          label: "Web y soluciones digitales",
          text: "Sitios web, trabajo continuo de Google Business Profile y de búsqueda, y automatización.",
          to: R.web,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre las bases del negocio",
      items: [
        {
          q: "¿Me ayudarán a conseguir un préstamo?",
          a: "No. Alchemize ofrece servicios de planificación de negocios y preparación financiera. No empareja prestamistas, no negocia con ellos, no presenta solicitudes ni garantiza elegibilidad, aprobación o fondos.",
        },
        {
          q: "¿Se encargan de la constitución legal?",
          a: "Alchemize ofrece preparación administrativa no legal para la constitución y el arranque. Las decisiones que requieran criterio legal o tributario deben revisarse con un abogado o un CPA.",
        },
        {
          q: "¿Cuál es la diferencia entre una evaluación y un plan de negocios?",
          a: "Una evaluación revisa cómo está el negocio y qué hacer primero. Un plan de negocios documenta el negocio, el mercado y las operaciones, y puede incluir proyecciones financieras.",
        },
        {
          q: "¿Qué no incluye el paquete de arranque?",
          a: "Un sitio web, la teneduría de libros, la nómina, los impuestos y la implementación sustancial son servicios aparte.",
        },
        {
          q: "¿Por dónde empiezo si no estoy seguro?",
          a: "Empiece con la evaluación de las bases. Muestra qué hacer primero y qué puede esperar.",
        },
      ],
    },
    related: [
      [
        R.advisory,
        "Para un reto concreto en un negocio que ya está funcionando.",
      ],
      [
        R.bookkeeping,
        "Para el registro financiero continuo después del arranque.",
      ],
      [R.web, "Para el sitio web y la presencia local."],
    ],
  },

  "business-bookkeeping": {
    cta: {
      hero: "Hablar sobre su teneduría de libros",
      close: "Hablar sobre su teneduría de libros",
      info: "Preguntar qué nivel encaja",
      title: "Cuéntenos cómo están hoy sus libros.",
      body: "Describa sus cuentas, su volumen y el estado de sus registros. Alchemize recomienda el nivel de apoyo adecuado y si primero hace falta una depuración.",
    },
    summary:
      "Teneduría de libros recurrente que mantiene las transacciones categorizadas, las cuentas conciliadas y los reportes al día, con una depuración aparte cuando los registros históricos deben ponerse al corriente primero.",
    fit: {
      title: "Cuándo encaja la teneduría de libros",
      items: [
        "Tiene libros, pero no confía en ellos",
        "Actividad creciente en varias cuentas bancarias o de crédito",
        "Necesita reportes periódicos para decidir, no solo en la temporada de impuestos",
        "Los registros están atrasados, incompletos o desordenados",
        "Necesita libros ordenados antes de una declaración de impuestos",
      ],
    },
    does: {
      title: "Lo que hace Alchemize cada mes.",
      intro:
        "El ritmo es lo importante: las transacciones se mantienen categorizadas, las cuentas conciliadas y los reportes al día.",
      groups: [
        {
          title: "En cada ciclo",
          items: [
            "Categorizar las transacciones",
            "Conciliar las cuentas bancarias y de crédito",
            "Registrar ingresos y gastos",
            "Mantener el libro mayor",
            "Preparar los reportes financieros recurrentes que correspondan a su nivel de servicio",
          ],
        },
        {
          title: "Reportes y revisión",
          items: [
            "Estado de resultados, balance general y resumen de flujo de efectivo",
            "Comparaciones con períodos anteriores, con tendencias y variaciones explicadas en lenguaje claro",
            "Conversaciones de revisión periódicas, según el nivel de apoyo",
          ],
        },
        {
          title: "Reportes más profundos, cuando los registros lo permiten",
          items: [
            "Revisiones financieras trimestrales",
            "Proyecciones básicas de flujo de efectivo a 12 meses",
            "Se definen por separado como trabajo de reportes",
          ],
        },
      ],
    },
    options: {
      title: "Cómo se elige el nivel de apoyo adecuado.",
      intro:
        "No tiene que adivinar un plan. Estos son los factores que Alchemize revisa con usted, y luego recomienda un nivel.",
      items: [
        {
          tag: "Volumen",
          name: "Volumen de transacciones",
          text: "Más transacciones significan más categorización y revisión cada mes.",
        },
        {
          tag: "Cuentas",
          name: "Cuentas bancarias y de crédito",
          text: "Cada cuenta se concilia, así que la cantidad de cuentas define el trabajo mensual.",
        },
        {
          tag: "Reportes",
          name: "Necesidades de reportes",
          text: "Desde reportes mensuales estándar hasta revisiones periódicas más profundas.",
        },
        {
          tag: "Registros",
          name: "Estado de los registros",
          text: "Los registros al día y ordenados pueden iniciar la teneduría recurrente. Los registros atrasados o sin conciliar pueden requerir una depuración primero.",
        },
        {
          tag: "Apoyo",
          name: "Nivel de revisión y apoyo",
          text: "Cuánta conversación, revisión y capacidad de respuesta quiere el negocio junto con los libros.",
        },
      ],
      note: "Los volúmenes muy altos o los libros especialmente complejos se definen de forma individual.",
    },
    process: [
      [
        "Reunir",
        "Recopilar registros de constitución, de bancos y tarjetas, respaldos de ingresos y gastos, e información de nómina o contratistas que corresponda.",
      ],
      [
        "Revisar",
        "Identificar faltantes, inconsistencias y transacciones que necesitan aclaración, y decidir si primero hace falta una depuración.",
      ],
      [
        "Conciliar",
        "Cotejar las transacciones registradas con los estados de cuenta y organizar el libro mayor para que refleje la actividad real del negocio.",
      ],
      [
        "Reportar",
        "Entregar los reportes y la revisión recurrentes que correspondan al nivel de servicio, con un ritmo que se repite.",
      ],
    ],
    prepare: [
      "Datos de la entidad y del EIN",
      "Acceso al software de contabilidad, si ya usa uno",
      "Estados de cuenta bancarios, de tarjetas y de préstamos",
      "Reportes de procesadores de pago y resúmenes de nómina",
      "Facturas, recibos y respaldos de ingresos y gastos",
      "Registros históricos, cuando hace falta una depuración",
    ],
    compare: {
      title: "Teneduría continua, depuración y los servicios de al lado.",
      intro:
        "Un negocio con registros históricos, incompletos o sin conciliar suele necesitar una depuración antes de poder iniciar la teneduría recurrente.",
      rows: [
        {
          label: "Teneduría de libros continua",
          text: "Un ritmo mensual recurrente una vez que los registros están al día.",
          current: true,
        },
        {
          label: "Depuración de libros",
          text: "Pone al día registros históricos, incompletos o sin conciliar para poder iniciar la teneduría recurrente. Los registros graves o que requieren reconstrucción se revisan y se definen por separado.",
        },
        {
          label: "Reportes financieros",
          text: "Son reportes de gestión, no estados financieros auditados, revisados, compilados, certificados ni atestiguados.",
        },
        {
          label: "Preparación de impuestos",
          text: "Es aparte. Los libros ordenados la facilitan, pero la teneduría no incluye preparar declaraciones.",
          to: R.businessTax,
        },
        {
          label: "Nómina",
          text: "La administración de nómina es un servicio propio.",
          to: R.payroll,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre teneduría de libros",
      items: [
        {
          q: "¿Qué hace Alchemize exactamente cada mes?",
          a: "Categoriza las transacciones, concilia sus cuentas, registra ingresos y gastos, mantiene el libro mayor y prepara los reportes recurrentes de su nivel de apoyo, con conversaciones de revisión cuando el nivel de servicio las incluye.",
        },
        {
          q: "¿Cómo sé qué nivel de apoyo necesito?",
          a: "Depende del volumen de transacciones, la cantidad de cuentas bancarias y de crédito, sus necesidades de reportes, el estado de sus registros y la revisión y el apoyo que desea. Alchemize revisa esto con usted y recomienda un nivel.",
        },
        {
          q: "¿Está incluida la depuración?",
          a: "No. La depuración es aparte y va primero cuando los registros están atrasados o sin conciliar. Las situaciones graves o que requieren reconstrucción se revisan y se definen de forma individual.",
        },
        {
          q: "¿La teneduría de libros incluye la preparación de impuestos?",
          a: "No. La preparación de impuestos es un servicio aparte. Los libros ordenados la facilitan.",
        },
        {
          q: "¿Qué debo proporcionar?",
          a: "Datos de la entidad y del EIN, acceso al software de contabilidad si tiene uno, estados de cuenta de bancos, tarjetas y préstamos, reportes de procesadores y de nómina, y respaldos de sus registros.",
        },
        {
          q: "¿Son estados financieros auditados?",
          a: "No. Son reportes financieros de gestión, no estados auditados, revisados, compilados, certificados ni atestiguados.",
        },
      ],
    },
    related: [
      [
        R.payroll,
        "Las corridas de nómina alimentan los libros y se administran por separado.",
      ],
      [
        R.businessTax,
        "Los libros listos para impuestos son la base de una declaración empresarial.",
      ],
      [
        R.advisory,
        "Para las preguntas que las cifras plantean sobre cómo funciona el negocio.",
      ],
    ],
  },

  "business-payroll": {
    cta: {
      hero: "Hablar sobre apoyo de nómina",
      close: "Hablar sobre apoyo de nómina",
      info: "Preguntar sobre la configuración",
      title: "Cuéntenos cómo funciona hoy su nómina.",
      body: "Indíquenos su número de empleados, su calendario de pagos y su plataforma, si tiene una. Alchemize confirma el alcance y si hace falta elegir y configurar una plataforma.",
    },
    summary:
      "Configuración y administración recurrente de nómina mediante la plataforma de nómina que usted elija. Alchemize administra su proceso de nómina; la plataforma sigue siendo quien procesa la nómina.",
    fit: {
      title: "Cuándo encaja el apoyo de nómina",
      items: [
        "Un empleador nuevo que necesita elegir y configurar una plataforma",
        "Un propietario cansado de encargarse personalmente de la nómina",
        "Un equipo en crecimiento que necesita una rutina de nómina repetible",
        "La información de nómina está dispersa en varios lugares",
      ],
    },
    does: {
      title: "Lo que Alchemize administra.",
      intro:
        "Alchemize realiza el trabajo administrativo de la nómina dentro de la plataforma. No es quien procesa la nómina.",
      groups: [
        {
          title: "Configuración, cuando hace falta",
          items: [
            "Ayuda para elegir y configurar la plataforma de nómina",
            "Alta administrativa de empleados",
            "Captura de la información del Formulario W-4 proporcionada por el cliente o el empleado",
          ],
        },
        {
          title: "En cada ciclo de pago",
          items: [
            "Administración recurrente de la nómina mediante la plataforma elegida",
            "Registros de nómina y de pagos",
            "Reportes de nómina",
            "Coordinación de problemas rutinarios de la plataforma y del depósito directo",
          ],
        },
      ],
    },
    options: {
      title: "Cómo se define el alcance.",
      intro:
        "El alcance sigue el tamaño y el punto de partida de su nómina. Los equipos más grandes se definen de forma individual.",
      items: [
        {
          tag: "Punto de partida",
          name: "Si ya hay una plataforma",
          text: "Si hay que elegir y configurar una plataforma de nómina, la configuración va primero.",
        },
        {
          tag: "Tamaño del equipo",
          name: "Número de empleados",
          text: "La cantidad de empleados define la administración recurrente.",
        },
        {
          tag: "Ritmo",
          name: "Calendario de pagos",
          text: "Los ciclos semanales, quincenales o mensuales definen con qué frecuencia se repite el trabajo.",
        },
      ],
    },
    compare: {
      title: "Quién hace qué.",
      intro:
        "En la nómina intervienen varias partes. El alcance de cada una queda claro desde el inicio.",
      rows: [
        {
          label: "Alchemize",
          text: "Administra la nómina mediante la plataforma elegida y mantiene los registros y los reportes.",
          current: true,
        },
        {
          label: "La plataforma de nómina",
          text: "Procesa la nómina y realiza las funciones de declaración y depósito de impuestos que ofrezca. Los cargos de la plataforma y del software se cobran aparte.",
        },
        {
          label: "Usted y sus empleados",
          text: "Usted proporciona información correcta. Cada empleado completa su propio W-4; Alchemize lo captura tal como se le proporciona y no asesora al respecto.",
        },
        {
          label: "Teneduría de libros",
          text: "La nómina y la teneduría de libros son líneas de servicio separadas.",
          to: R.bookkeeping,
        },
        {
          label: "Impuestos empresariales",
          text: "La preparación de impuestos empresariales es un servicio aparte.",
          to: R.businessTax,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre nómina",
      items: [
        {
          q: "¿Ustedes proporcionan el software de nómina?",
          a: "No. La nómina se procesa en la plataforma que usted elija. Alchemize puede ayudar a elegirla y configurarla, y los cargos de la plataforma y del software se cobran aparte.",
        },
        {
          q: "¿Alchemize presenta mis impuestos de nómina?",
          a: "Alchemize no asume automáticamente las responsabilidades de declaración o depósito de impuestos que realiza la plataforma de nómina. Confirme qué declaraciones y depósitos maneja su plataforma durante la configuración.",
        },
        {
          q: "¿Pueden ayudar a mis empleados a llenar su W-4?",
          a: "No. Alchemize captura la información del W-4 tal como se le proporciona y no asesora a los empleados sobre cómo completarlo.",
        },
        {
          q: "¿Y si ya uso una plataforma de nómina?",
          a: "Alchemize puede administrar la nómina en ella cuando la plataforma y el alcance lo permitan.",
        },
        {
          q: "¿La nómina está incluida con la teneduría de libros?",
          a: "No. La nómina, la teneduría de libros y los impuestos son líneas de servicio separadas, aunque se usen juntas.",
        },
        {
          q: "¿Cuántos empleados pueden atender?",
          a: "El alcance crece con el número de empleados, y los equipos más grandes se definen de forma individual.",
        },
      ],
    },
    related: [
      [R.bookkeeping, "Los registros de nómina alimentan los libros."],
      [
        R.businessTax,
        "Documentación de impuestos de nómina y declaraciones empresariales.",
      ],
    ],
  },

  "business-financial": {
    cta: {
      hero: "Hablar sobre apoyo tributario empresarial",
      close: "Hablar sobre apoyo tributario empresarial",
      info: "Preguntar si su declaración encaja",
      title: "Cuéntenos sobre el negocio y sus libros.",
      body: "Indíquenos el tipo de entidad, los estados y el estado de sus registros. Alchemize confirma la compatibilidad y el alcance antes de preparar la declaración.",
    },
    summary:
      "Preparación de impuestos empresariales y preparación para el cierre del año: declaraciones de sociedades y de corporaciones S y C para negocios con libros listos para impuestos, además de la organización que hace manejable la temporada de declaraciones.",
    fit: {
      title: "Cuándo encaja",
      items: [
        "Una sociedad, una corporación S o una corporación C que se prepara para declarar",
        "Libros conciliados y listos para una declaración",
        "Preparación para el cierre del año y apoyo en la planificación de impuestos estimados",
        "Declaraciones empresariales de años anteriores o enmendadas",
        "Registros que necesitan organizarse antes de una declaración o de un traspaso",
      ],
    },
    does: {
      title:
        "Declaraciones y preparación que Alchemize está estructurada para apoyar.",
      intro:
        "Cada declaración se revisa primero para confirmar que encaja. Que un caso esté dentro del alcance no significa que toda situación empresarial se acepte automáticamente.",
      groups: [
        {
          title: "Declaraciones empresariales",
          items: [
            "Declaraciones de sociedades (Formulario 1065)",
            "Declaraciones de corporaciones S (Formulario 1120-S)",
            "Declaraciones de corporaciones C (Formulario 1120)",
            "Declaraciones enmendadas y de años anteriores",
          ],
        },
        {
          title: "Preparación para declarar",
          items: [
            "Organización de documentos tributarios",
            "Preparación para el cierre del año y atención a las fechas límite",
            "Apoyo y seguimiento de la planificación de impuestos estimados",
            "Preparación de documentación de contratistas y de nómina",
          ],
        },
        {
          title: "Lo que puede cambiar el alcance",
          items: [
            "La cantidad de propietarios o de Schedule K-1",
            "Varios estados",
            "Activos fijos y préstamos de los propietarios",
            "Cambios de propiedad y distribuciones",
            "Libros sin conciliar y transacciones inusuales",
          ],
        },
      ],
    },
    process: [
      [
        "Organizar",
        "Recopilar los registros de ingresos, gastos, nómina, contratistas y años anteriores que se necesitan para la declaración.",
      ],
      [
        "Confirmar compatibilidad",
        "Confirmar el tipo de entidad, los estados y la complejidad, y si los libros están listos para impuestos.",
      ],
      [
        "Preparar",
        "Preparar la declaración a partir de libros listos para impuestos y hechos confirmados.",
      ],
      [
        "Finalizar",
        "Revisar la declaración, resolver los asuntos pendientes y confirmar el siguiente paso y el calendario.",
      ],
    ],
    compare: {
      title: "La preparación de impuestos y los servicios que la rodean.",
      intro:
        "Preparar una declaración empresarial es un servicio. Estos otros son aparte.",
      rows: [
        {
          label: "Preparación de impuestos empresariales",
          text: "Preparar la declaración a partir de libros listos para impuestos, dentro del alcance confirmado para el negocio.",
          current: true,
        },
        {
          label: "Teneduría de libros y depuración",
          text: "Las declaraciones empresariales se preparan a partir de libros listos para impuestos. Los libros sin conciliar necesitan primero una depuración.",
          to: R.bookkeeping,
        },
        {
          label: "Planificación y asesoría tributaria",
          text: "La estrategia a futuro es aparte y no se incluye automáticamente.",
        },
        {
          label: "Representación ante el IRS y el estado",
          text: "Los avisos, auditorías y trámites de resolución son aparte. Algunos requieren un CPA, un agente registrado o un abogado.",
        },
        {
          label: "Declaraciones individuales",
          text: "Las declaraciones personales, incluido el Schedule C de un propietario único, están en la preparación de impuestos individuales.",
          to: R.tax,
        },
      ],
    },
    faq: {
      title: "Preguntas sobre impuestos empresariales",
      items: [
        {
          q: "¿Necesito tener mis libros en orden primero?",
          a: "Sí. Las declaraciones empresariales se preparan a partir de libros listos para impuestos. Si sus libros no están conciliados, primero va una depuración de teneduría de libros.",
        },
        {
          q: "¿Qué declaraciones empresariales preparan?",
          a: "Alchemize está estructurada para apoyar declaraciones de sociedades (1065), de corporaciones S (1120-S) y de corporaciones C (1120), incluidas las enmendadas y las de años anteriores.",
        },
        {
          q: "Soy propietario único. ¿Es esta la página correcta?",
          a: "Los propietarios únicos que declaran con el Schedule C se atienden en la preparación de impuestos individuales.",
        },
        {
          q: "¿Y si mi negocio declara en más de un estado?",
          a: "Los estados adicionales afectan el alcance y se confirman antes de comenzar.",
        },
        {
          q: "¿Esto incluye planificación de impuestos o representación ante el IRS?",
          a: "No. La planificación y asesoría tributaria, y la representación o resolución ante el IRS o el estado, son servicios aparte y no se incluyen automáticamente.",
        },
      ],
    },
    related: [
      [
        R.bookkeeping,
        "Los libros listos para impuestos son la base de una declaración empresarial.",
      ],
      [R.payroll, "La administración de nómina es un servicio aparte."],
      [R.tax, "Para declaraciones individuales, incluido el Schedule C."],
    ],
  },
};
