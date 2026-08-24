const clone = (value) => JSON.parse(JSON.stringify(value));

const emptyAdminData = {
  leads: [],
  clients: [],
  services: [],
  engagements: [],
  tasks: [],
  documents: [],
  appointments: [],
  messages: [],
  invoices: [],
  payments: [],
  activity: [],
  contentInventory: [],
  notes: [],
};

export const serviceStageCatalog = {
  "Business Formation & Startup": [
    "Clarify",
    "Prepare",
    "Establish",
    "Organize",
  ],
  "Business Advisory": ["Understand", "Evaluate", "Prioritize", "Act"],
  "Individual Tax Preparation": ["Gather", "Review", "Prepare", "Finalize"],
  "Insurance Review": ["Identify", "Organize", "Explore", "Decide"],
  "Business Insurance": ["Profile", "Assess", "Explore", "Proceed"],
  "Business Tax": ["Assemble", "Reconcile", "Prepare", "Close"],
  "Notary Document Services": ["Prepare", "Verify", "Execute", "Complete"],
  "Operations Support": ["Map", "Structure", "Document", "Maintain"],
};

export const staffOptions = [
  "Owner / Administrator",
  "Jordan Martin",
  "Taylor Nguyen",
  "Alex Rosen",
  "Ruben Shaw",
  "Support",
  "Staff",
];

export function createAdminStore(initialData = emptyAdminData) {
  let state = clone(initialData);

  const ensureState = () => {
    state = {
      ...clone(initialData),
      leads: clone(state.leads || initialData.leads || []),
      clients: clone(state.clients || initialData.clients || []),
      services: clone(state.services || initialData.services || []),
      messages: clone(state.messages || initialData.messages || []),
      invoices: clone(state.invoices || initialData.invoices || []),
      payments: clone(state.payments || initialData.payments || []),
      activity: clone(state.activity || initialData.activity || []),
      contentInventory: clone(
        state.contentInventory || initialData.contentInventory || [],
      ),
      notes: clone(state.notes || initialData.notes || []),
    };
  };

  const addActivity = ({
    type,
    actorType = "admin",
    actorName = "Admin",
    clientId = null,
    engagementId = null,
    summary,
    visibility = "admin",
  }) => {
    const entry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      actorType,
      actorName,
      clientId,
      engagementId,
      timestamp: new Date().toISOString(),
      summary,
      visibility,
    };
    state.activity = [entry, ...state.activity];
    return entry;
  };

  const getSnapshot = () => ({
    leads: clone(state.leads),
    clients: clone(state.clients),
    services: clone(state.services),
    engagements: clone(state.engagements),
    tasks: clone(state.tasks),
    documents: clone(state.documents),
    appointments: clone(state.appointments),
    messages: clone(state.messages),
    invoices: clone(state.invoices),
    payments: clone(state.payments),
    activity: clone(state.activity),
    contentInventory: clone(state.contentInventory),
    notes: clone(state.notes),
  });

  const findLeadById = (id) =>
    state.leads.find((lead) => lead.id === id) || null;
  const findClientById = (id) =>
    state.clients.find((client) => client.id === id) || null;
  const findEngagementById = (id) =>
    state.engagements.find((engagement) => engagement.id === id) || null;
  const findServiceById = (id) =>
    state.services.find((service) => service.id === id) || null;
  const findServiceByCode = (serviceCode) =>
    state.services.find((service) => service.serviceCode === serviceCode) ||
    null;

  const normalizeServiceRecord = (service = {}) => {
    const trimmedCode = String(service.serviceCode || "").trim();
    const name = String(service.serviceName || "").trim();
    const billingType = service.billingType || "Fixed Fee";
    const defaultPrice =
      service.defaultPrice == null ||
      service.defaultPrice === "" ||
      service.defaultPrice === "Custom"
        ? null
        : Number(service.defaultPrice);

    return {
      ...service,
      id: service.id || `svc-${Date.now().toString().slice(-6)}`,
      serviceCode: trimmedCode,
      serviceName: name,
      audience: service.audience || "Individual",
      category: service.category || "General",
      status: service.status || "Active",
      defaultDuration: Number(service.defaultDuration || 60),
      defaultOwner: service.defaultOwner || "Owner / Administrator",
      defaultTaskTemplate: service.defaultTaskTemplate || "",
      defaultPreparationRequirements:
        service.defaultPreparationRequirements || "",
      billingType,
      defaultPrice,
      currency: service.currency || "USD",
      taxable: Boolean(service.taxable),
      depositRequired: Boolean(service.depositRequired),
      defaultDepositAmount:
        service.defaultDepositAmount == null ||
        service.defaultDepositAmount === ""
          ? null
          : Number(service.defaultDepositAmount),
      minimumCharge:
        service.minimumCharge == null || service.minimumCharge === ""
          ? null
          : Number(service.minimumCharge),
      defaultBillingDescription: service.defaultBillingDescription || "",
      internalPricingNotes: service.internalPricingNotes || "",
      addOns: Array.isArray(service.addOns)
        ? service.addOns.map((addOn) => ({
            id:
              addOn.id ||
              `addon-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`,
            addOnCode: String(addOn.addOnCode || "").trim(),
            addOnName: String(addOn.addOnName || "").trim(),
            description: addOn.description || "",
            defaultPrice:
              addOn.defaultPrice == null || addOn.defaultPrice === ""
                ? null
                : Number(addOn.defaultPrice),
            billingType: addOn.billingType || billingType,
            active: addOn.active !== false,
            required: Boolean(addOn.required),
            optional: addOn.optional !== false,
            internalNotes: addOn.internalNotes || "",
          }))
        : [],
    };
  };

  const createClient = ({
    clientType,
    displayName,
    businessName,
    email,
    phone,
    preferredContactMethod = "Email",
    status = "Prospect",
    portalStatus = "Active",
    representative = "",
    authorizedUsers = [],
    legalBusinessName,
    dbaName,
    businessEmail,
    businessPhone,
    businessAddress,
    notes,
  } = {}) => {
    const trimmedName = String(displayName || "").trim();
    const trimmedBusinessName = String(
      businessName || legalBusinessName || "",
    ).trim();
    const requiredName = trimmedName || trimmedBusinessName;

    if (!clientType) throw new Error("Client type is required.");
    if (!requiredName)
      throw new Error("Client name or business name is required.");
    if (!email && !phone)
      throw new Error("Provide either an email or a phone number.");
    if (!status) throw new Error("Client status is required.");

    const normalizedAuthorizedUsers = Array.isArray(authorizedUsers)
      ? authorizedUsers.map((entry) => String(entry).trim()).filter(Boolean)
      : String(authorizedUsers || "")
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);

    const primaryRepresentative = String(
      representative || trimmedName || trimmedBusinessName || "",
    ).trim();
    const client = {
      id: `client-${Date.now().toString().slice(-6)}`,
      displayName: trimmedName || trimmedBusinessName,
      clientType,
      businessName: trimmedBusinessName || null,
      dbaName: dbaName || null,
      legalBusinessName: legalBusinessName || trimmedBusinessName || null,
      email: String(email || businessEmail || "").trim(),
      phone: String(phone || businessPhone || "").trim(),
      businessEmail: String(businessEmail || email || "").trim(),
      businessPhone: String(businessPhone || phone || "").trim(),
      businessAddress: businessAddress || "",
      preferredContactMethod: preferredContactMethod || "Email",
      status,
      portalStatus,
      activeServices: 0,
      lastActivity: new Date().toISOString().slice(0, 10),
      nextAction: "Complete intake and assign service scope",
      authorizedUsers: normalizedAuthorizedUsers.length
        ? normalizedAuthorizedUsers
        : [primaryRepresentative || trimmedName || trimmedBusinessName],
      representative:
        primaryRepresentative || trimmedName || trimmedBusinessName,
      notes: notes || "",
    };

    state.clients.unshift(client);
    addActivity({
      type: "client_created",
      actorType: "admin",
      actorName: "Admin",
      clientId: client.id,
      summary: `${client.displayName} was added to the client roster`,
      visibility: "admin",
    });

    return client;
  };

  const createService = (service = {}) => {
    const normalized = normalizeServiceRecord(service);
    if (!normalized.serviceCode) throw new Error("Service code is required.");
    if (!normalized.serviceName) throw new Error("Service name is required.");
    if (!normalized.audience) throw new Error("Service audience is required.");
    if (!normalized.status) throw new Error("Service status is required.");
    if (!normalized.billingType) throw new Error("Billing type is required.");
    if (
      normalized.billingType !== "Custom / Scope of Work" &&
      (normalized.defaultPrice == null || Number.isNaN(normalized.defaultPrice))
    ) {
      throw new Error("Default price is required for standard billing types.");
    }
    if (normalized.defaultDuration <= 0)
      throw new Error("Default duration must be greater than zero.");
    if (findServiceByCode(normalized.serviceCode)) {
      throw new Error(
        `Service code ${normalized.serviceCode} is already in use.`,
      );
    }

    const created = { ...normalized, addOns: normalized.addOns || [] };
    state.services.unshift(created);
    addActivity({
      type: "service_created",
      actorType: "admin",
      actorName: "Admin",
      summary: `${created.serviceName} (${created.serviceCode}) was added to the service catalog`,
      visibility: "admin",
    });
    return created;
  };

  const updateService = (serviceId, updates = {}) => {
    const service = findServiceById(serviceId);
    if (!service) return null;
    const merged = normalizeServiceRecord({ ...service, ...updates });
    Object.assign(service, merged);
    addActivity({
      type: "service_updated",
      actorType: "admin",
      actorName: "Admin",
      summary: `${service.serviceName} was updated in the service catalog`,
      visibility: "admin",
    });
    return service;
  };

  const addServiceAddOn = (serviceId, addOn = {}) => {
    const service = findServiceById(serviceId);
    if (!service) return null;

    const nextAddOn = {
      id: addOn.id || `addon-${Date.now().toString().slice(-6)}`,
      addOnCode: String(addOn.addOnCode || "").trim(),
      addOnName: String(addOn.addOnName || "").trim(),
      description: addOn.description || "",
      defaultPrice:
        addOn.defaultPrice == null || addOn.defaultPrice === ""
          ? null
          : Number(addOn.defaultPrice),
      billingType: addOn.billingType || service.billingType || "Fixed Fee",
      active: addOn.active !== false,
      required: Boolean(addOn.required),
      optional: addOn.optional !== false,
      internalNotes: addOn.internalNotes || "",
    };

    if (!nextAddOn.addOnCode || !nextAddOn.addOnName) return null;
    service.addOns = [...(service.addOns || []), nextAddOn];
    addActivity({
      type: "service_addon_added",
      actorType: "admin",
      actorName: "Admin",
      summary: `${nextAddOn.addOnName} was added to ${service.serviceName}`,
      visibility: "admin",
    });
    return nextAddOn;
  };

  const updateServiceAddOn = (serviceId, addOnId, updates = {}) => {
    const service = findServiceById(serviceId);
    if (!service) return null;
    const index = (service.addOns || []).findIndex(
      (addOn) => addOn.id === addOnId,
    );
    if (index === -1) return null;

    service.addOns[index] = {
      ...service.addOns[index],
      ...updates,
      id: addOnId,
      defaultPrice:
        updates.defaultPrice == null || updates.defaultPrice === ""
          ? null
          : Number(updates.defaultPrice),
      active:
        updates.active !== undefined
          ? Boolean(updates.active)
          : service.addOns[index].active,
      required:
        updates.required !== undefined
          ? Boolean(updates.required)
          : service.addOns[index].required,
      optional:
        updates.optional !== undefined
          ? Boolean(updates.optional)
          : service.addOns[index].optional,
    };

    return service.addOns[index];
  };

  const updateClientProfile = (clientId, updates = {}) => {
    const client = findClientById(clientId);
    if (!client) return null;

    const nextProfile = {
      ...updates,
      ...(updates.authorizedUsers && typeof updates.authorizedUsers === "string"
        ? {
            authorizedUsers: updates.authorizedUsers
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean),
          }
        : {}),
    };

    Object.assign(client, nextProfile);
    client.lastActivity =
      client.lastActivity || new Date().toISOString().slice(0, 10);
    client.representative = client.representative || client.displayName;

    addActivity({
      type: "client_profile_updated",
      actorType: "admin",
      actorName: "Admin",
      clientId: client.id,
      summary: `${client.displayName}'s client record was updated`,
      visibility: "admin",
    });

    return client;
  };

  const getNeedsAttention = () => {
    const leadQueue = state.leads.filter((lead) =>
      ["New", "Contacted", "Consultation Requested"].includes(lead.status),
    );

    const overdueTasks = state.tasks.filter(
      (task) =>
        task.status !== "Completed" && new Date(task.dueDate) < new Date(),
    );

    const engagementQueue = state.engagements.filter((engagement) =>
      [
        "Waiting on Client",
        "Waiting on Alchemize",
        "Preparing",
        "Review",
      ].includes(engagement.status),
    );

    const documentQueue = state.documents.filter((document) =>
      ["Received", "Under Review", "Requested", "Awaiting Upload"].includes(
        document.status,
      ),
    );

    const upcomingAppointments = state.appointments.filter((appointment) =>
      ["Requested", "Scheduled", "Confirmed"].includes(appointment.status),
    );

    const unreadMessages = state.messages.filter((message) =>
      ["Unread", "Needs Response"].includes(message.status),
    );

    const invoiceQueue = state.invoices.filter(
      (invoice) => invoice.status === "Past Due",
    );

    return {
      leads: leadQueue,
      tasks: overdueTasks,
      engagements: engagementQueue,
      documents: documentQueue,
      appointments: upcomingAppointments,
      messages: unreadMessages,
      invoices: invoiceQueue,
    };
  };

  const normalizeLeadInput = (leadInput = {}) => {
    const firstName = String(
      leadInput.firstName || leadInput.first_name || "",
    ).trim();
    const lastName = String(
      leadInput.lastName || leadInput.last_name || "",
    ).trim();
    const name = String(
      leadInput.name ||
        [firstName, lastName].filter(Boolean).join(" ") ||
        "Unassigned lead",
    ).trim();
    const email = String(leadInput.email || "")
      .trim()
      .toLowerCase();
    const phone = String(leadInput.phone || leadInput.phoneNumber || "").trim();
    const audience =
      leadInput.audience === "business" ? "Business" : "Individual";
    const source = String(
      leadInput.source || leadInput.leadSource || "Website Contact Form",
    ).trim();
    const requestedService = String(
      leadInput.serviceInterest ||
        leadInput.serviceName ||
        leadInput.requestedService ||
        "General consultation",
    ).trim();
    const description = String(
      leadInput.message || leadInput.inquiry || leadInput.description || "",
    ).trim();

    return {
      id:
        leadInput.id ||
        leadInput.leadId ||
        `lead-${Date.now().toString().slice(-6)}`,
      name,
      firstName,
      lastName,
      email,
      phone,
      businessName: String(
        leadInput.businessName || leadInput.business_name || "",
      ).trim(),
      audience,
      source,
      serviceInterest: requestedService,
      message: description,
      preferredContact: String(
        leadInput.preferredContact || leadInput.preferred_contact || "",
      ).trim(),
      status: leadInput.status || "New",
      assignedTo:
        leadInput.assignedTo || leadInput.owner || "Owner / Administrator",
      nextAction:
        leadInput.nextAction || leadInput.next_action || "Review inquiry",
      receivedAt:
        leadInput.receivedAt ||
        leadInput.createdAt ||
        leadInput.dateReceived ||
        new Date().toISOString(),
      lastActivityAt:
        leadInput.lastActivityAt ||
        leadInput.lastContact ||
        leadInput.receivedAt ||
        leadInput.createdAt ||
        new Date().toISOString(),
      interests: Array.isArray(leadInput.interests) ? leadInput.interests : [],
      internalNotes: String(
        leadInput.internalNotes || leadInput.notes || "",
      ).trim(),
      contactAttempts: Array.isArray(leadInput.contactAttempts)
        ? leadInput.contactAttempts
        : [],
      statusHistory: Array.isArray(leadInput.statusHistory)
        ? leadInput.statusHistory
        : [],
    };
  };

  const findMatchingLead = (leadInput = {}) => {
    const normalized = normalizeLeadInput(leadInput);
    const emailKey = normalized.email ? normalized.email.toLowerCase() : "";
    const phoneKey = normalized.phone
      ? normalized.phone.replace(/\D+/g, "")
      : "";

    return (
      state.leads.find((lead) => {
        const current = normalizeLeadInput(lead);
        const currentEmail = current.email ? current.email.toLowerCase() : "";
        const currentPhone = current.phone
          ? current.phone.replace(/\D+/g, "")
          : "";
        const sameEmail = emailKey && currentEmail && emailKey === currentEmail;
        const samePhone = phoneKey && currentPhone && phoneKey === currentPhone;
        const sameBusiness =
          normalized.businessName &&
          current.businessName &&
          normalized.businessName.toLowerCase() ===
            current.businessName.toLowerCase();

        if (sameEmail || samePhone) return true;
        if (
          sameBusiness &&
          normalized.name &&
          current.name &&
          normalized.name.toLowerCase() === current.name.toLowerCase()
        )
          return true;
        return false;
      }) || null
    );
  };

  const createLeadFromContact = (leadInput = {}) => {
    const normalized = normalizeLeadInput(leadInput);
    const existing = findMatchingLead(normalized);

    if (existing) {
      const merged = normalizeLeadInput({
        ...existing,
        ...normalized,
        id: existing.id,
        lastActivityAt: new Date().toISOString(),
        lastContact: new Date().toISOString(),
        status: existing.status || normalized.status || "New",
        internalNotes:
          [existing.internalNotes, normalized.internalNotes]
            .filter(Boolean)
            .join("\n")
            .trim() ||
          existing.internalNotes ||
          "",
        message: existing.message || normalized.message || "",
        source: existing.source || normalized.source || "Website Contact Form",
      });

      if (!merged.contactAttempts?.length && existing.contactAttempts) {
        merged.contactAttempts = existing.contactAttempts;
      }

      Object.assign(existing, merged);
      existing.lastActivityAt = new Date().toISOString();
      existing.lastContact = new Date().toISOString();
      existing.status = existing.status || "New";
      addActivity({
        type: "lead_updated",
        actorType: "public",
        actorName: "Website",
        summary: `Matching lead updated from contact form: ${existing.name}`,
        visibility: "admin",
      });
      return existing;
    }

    const lead = {
      ...normalized,
      id: normalized.id || `lead-${Date.now().toString().slice(-6)}`,
      status: normalized.status || "New",
      receivedAt: normalized.receivedAt || new Date().toISOString(),
      lastActivityAt:
        normalized.lastActivityAt ||
        normalized.receivedAt ||
        new Date().toISOString(),
      lastContact:
        normalized.lastActivityAt ||
        normalized.receivedAt ||
        new Date().toISOString(),
      source: normalized.source || "Website Contact Form",
      internalNotes: normalized.internalNotes || "",
      interests: Array.isArray(normalized.interests)
        ? normalized.interests
        : [],
      contactAttempts: [],
      statusHistory: [
        {
          status: normalized.status || "New",
          timestamp: new Date().toISOString(),
          summary: "Lead created from website inquiry",
        },
      ],
    };

    state.leads.unshift(lead);
    addActivity({
      type: "lead_created",
      actorType: "public",
      actorName: "Website",
      summary: `${lead.name} created from the website contact form`,
      visibility: "admin",
    });
    return lead;
  };

  const setLeadStatus = (leadId, status) => {
    const lead = findLeadById(leadId);
    if (!lead) return null;

    const nextStatus = status || "New";
    lead.status = nextStatus;
    lead.lastActivityAt = new Date().toISOString();
    lead.statusHistory = [
      {
        status: nextStatus,
        timestamp: new Date().toISOString(),
        summary: `Status changed to ${nextStatus}`,
      },
      ...(lead.statusHistory || []),
    ];
    addActivity({
      type: "lead_status_changed",
      actorType: "admin",
      actorName: "Admin",
      clientId: null,
      engagementId: null,
      summary: `${lead.name} moved to ${nextStatus}`,
      visibility: "admin",
    });
    return lead;
  };

  const addInternalNote = ({
    relatedType,
    relatedId,
    author = "Owner / Administrator",
    content,
  }) => {
    if (!content || !content.trim()) return null;

    const note = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author,
      relatedType,
      relatedId,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    state.notes = [note, ...(state.notes || [])];
    addActivity({
      type: "internal_note_added",
      actorType: "admin",
      actorName: author,
      clientId: relatedType === "client" ? relatedId : null,
      engagementId: relatedType === "engagement" ? relatedId : null,
      summary: `${relatedType === "client" ? "Client note" : "Internal note"} added`,
      visibility: "admin",
    });

    return note;
  };

  const addLeadNote = (leadId, content, author = "Owner / Administrator") => {
    const lead = findLeadById(leadId);
    if (!lead) return null;
    lead.internalNotes = `${lead.internalNotes || ""}\n${content}`.trim();
    lead.lastActivityAt = new Date().toISOString();
    addInternalNote({
      relatedType: "lead",
      relatedId: leadId,
      author,
      content,
    });
    return lead;
  };

  const addLeadContactAttempt = (leadId, attempt = {}) => {
    const lead = findLeadById(leadId);
    if (!lead) return null;

    const entry = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: attempt.date || new Date().toISOString().slice(0, 10),
      time: attempt.time || "09:00",
      method: attempt.method || "Phone Call",
      outcome: attempt.outcome || "Follow-Up Needed",
      note: attempt.note || "",
      actor: attempt.actor || "Owner / Administrator",
      createdAt: new Date().toISOString(),
    };

    lead.contactAttempts = [entry, ...(lead.contactAttempts || [])];
    lead.lastContact = entry.date;
    lead.lastActivityAt = new Date().toISOString();
    lead.nextAction =
      attempt.nextAction || lead.nextAction || "Review follow-up results";
    addActivity({
      type: "lead_contact_attempted",
      actorType: "admin",
      actorName: entry.actor,
      summary: `${lead.name} contact attempt logged: ${entry.method} / ${entry.outcome}`,
      visibility: "admin",
    });
    return entry;
  };

  const scheduleConsultation = ({
    leadId,
    appointmentDate,
    time = "10:00 AM",
  }) => {
    const lead = findLeadById(leadId);
    if (!lead) return null;

    const appointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      clientId: lead.email ? `lead-${lead.id}` : null,
      engagementId: null,
      title: `${lead.name} consultation`,
      type: "Consultation",
      serviceName: lead.serviceInterest,
      date: appointmentDate,
      time,
      duration: 60,
      status: "Requested",
      deliveryMethod: "Video call",
      notes: `Consultation placeholder for ${lead.name}.`,
    };

    state.appointments.unshift(appointment);
    lead.status = "Consultation Scheduled";
    lead.nextAction = `Consultation scheduled for ${appointmentDate}`;
    addActivity({
      type: "consultation_scheduled",
      actorType: "admin",
      actorName: "Admin",
      summary: `Consultation scheduled for ${lead.name}`,
      visibility: "both",
    });

    return appointment;
  };

  const convertLeadToClient = ({
    leadId,
    clientType,
    email,
    phone,
    businessName,
    intendedService,
    initialClientStatus = "Active",
    createEngagement = true,
  }) => {
    const lead = findLeadById(leadId);
    if (!lead) return null;

    const clientId = `client-${Date.now().toString().slice(-6)}`;
    const client = {
      id: clientId,
      displayName: lead.name,
      clientType,
      businessName: businessName || null,
      email: email || lead.email,
      phone: phone || lead.phone,
      preferredContactMethod: "Email",
      status: initialClientStatus,
      portalStatus: "Active",
      activeServices: createEngagement ? 1 : 0,
      lastActivity: new Date().toISOString().slice(0, 10),
      nextAction: createEngagement
        ? "Start service engagement"
        : "Finalize onboarding step",
      authorizedUsers: [lead.name],
      representative: lead.name,
      originLeadId: lead.id,
    };

    state.clients.unshift(client);
    lead.status = "Converted";
    lead.nextAction = "Converted to client";
    lead.clientId = client.id;
    lead.convertedAt = new Date().toISOString();
    lead.lastActivityAt = new Date().toISOString();
    lead.statusHistory = [
      {
        status: "Converted",
        timestamp: new Date().toISOString(),
        summary: `Converted from lead to client record ${client.displayName}`,
      },
      ...(lead.statusHistory || []),
    ];

    addActivity({
      type: "lead_converted",
      actorType: "admin",
      actorName: "Admin",
      clientId: client.id,
      summary: `${lead.name} converted to client and added to the active roster`,
      visibility: "admin",
    });

    if (createEngagement && intendedService) {
      const engagement = startServiceEngagement({
        clientId: client.id,
        serviceName: intendedService,
        audience: clientType === "Business" ? "Business" : "Individual",
        initialStatus: "Preparing",
        currentStage:
          serviceStageCatalog[intendedService]?.[0] || "Initial intake",
        assignedChecklist: `${intendedService} checklist`,
        targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21)
          .toISOString()
          .slice(0, 10),
        nextAction: "Begin onboarding and confirm required details",
        assignedTo: "Owner / Administrator",
      });

      if (engagement) {
        addActivity({
          type: "engagement_started",
          actorType: "admin",
          actorName: "Admin",
          clientId: client.id,
          engagementId: engagement.id,
          summary: `${intendedService} engagement started for ${lead.name}`,
          visibility: "both",
        });
      }
    }

    return { client, lead };
  };

  const startServiceEngagement = ({
    clientId,
    serviceName,
    serviceId = null,
    serviceCode = null,
    audience,
    initialStatus = "Preparing",
    currentStage,
    assignedChecklist,
    targetDate,
    nextAction,
    assignedTo = "Owner / Administrator",
    selectedServices = [],
    lineItems = [],
  }) => {
    const client = findClientById(clientId);
    if (!client) return null;

    const catalogService = serviceId ? findServiceById(serviceId) : null;
    const resolvedServiceName =
      serviceName ||
      (catalogService ? catalogService.serviceName : "General admin support");
    const resolvedServiceCode =
      serviceCode || (catalogService ? catalogService.serviceCode : null);
    const resolvedSelectedServices =
      Array.isArray(selectedServices) && selectedServices.length
        ? selectedServices
        : [
            {
              serviceId: serviceId || catalogService?.id || null,
              serviceCode: resolvedServiceCode,
              serviceName: resolvedServiceName,
              billingType: catalogService?.billingType || "Fixed Fee",
              defaultPrice: catalogService?.defaultPrice ?? null,
              chosenPrice: catalogService?.defaultPrice ?? null,
              quantity: 1,
              addOns:
                catalogService?.addOns
                  ?.filter((addOn) => addOn.active && addOn.required)
                  .map((addOn) => ({
                    addOnId: addOn.id,
                    addOnCode: addOn.addOnCode,
                    addOnName: addOn.addOnName,
                    defaultPrice: addOn.defaultPrice,
                    chosenPrice: addOn.defaultPrice,
                  })) || [],
            },
          ];

    const engagement = {
      id: `eng-${Date.now().toString().slice(-6)}`,
      clientId,
      serviceId: serviceId || catalogService?.id || null,
      serviceCode: resolvedServiceCode,
      serviceKey: (resolvedServiceName || "general-support")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      serviceName: resolvedServiceName,
      audience: audience || client.clientType,
      status: initialStatus,
      currentStage:
        currentStage ||
        serviceStageCatalog[resolvedServiceName]?.[0] ||
        "Initial intake",
      startedAt: new Date().toISOString().slice(0, 10),
      targetDate:
        targetDate ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
          .toISOString()
          .slice(0, 10),
      nextAction: nextAction || "Confirm intake details",
      assignedTo,
      checklist: assignedChecklist || `${resolvedServiceName} checklist`,
      tasks: 0,
      documents: 0,
      appointments: 0,
      summary: `${client.displayName} is now beginning the ${resolvedServiceName} workflow.`,
      notes: `Admin-only note: ${resolvedServiceName} onboarding is beginning in the prototype workflow.`,
      selectedServices: resolvedSelectedServices,
      lineItems:
        Array.isArray(lineItems) && lineItems.length
          ? lineItems
          : resolvedSelectedServices,
      pricingOverrides: [],
    };

    state.engagements.unshift(engagement);
    client.activeServices = Math.max(client.activeServices || 0, 1);

    return engagement;
  };

  const updateEngagementStatus = (engagementId, status, nextAction = null) => {
    const engagement = findEngagementById(engagementId);
    if (!engagement) return null;

    engagement.status = status;
    if (nextAction) {
      engagement.nextAction = nextAction;
    }

    addActivity({
      type: "engagement_status_changed",
      actorType: "admin",
      actorName: "Admin",
      clientId: engagement.clientId,
      engagementId: engagement.id,
      summary: `${engagement.serviceName} moved to ${status}`,
      visibility: "both",
    });

    return engagement;
  };

  const createTask = ({
    title,
    clientId,
    engagementId,
    assignedTo,
    status = "Not Started",
    priority = "Medium",
    dueDate,
    description,
    serviceName,
  }) => {
    const task = {
      id: `task-${Date.now().toString().slice(-6)}`,
      clientId,
      engagementId: engagementId || null,
      title,
      description: description || "",
      assignedTo: assignedTo || "Owner / Administrator",
      status,
      priority,
      dueDate:
        dueDate ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
          .toISOString()
          .slice(0, 10),
      category: serviceName || "Operational",
      serviceName: serviceName || "General admin support",
    };

    state.tasks.unshift(task);
    addActivity({
      type: "task_created",
      actorType: "admin",
      actorName: "Admin",
      clientId: task.clientId,
      engagementId: task.engagementId,
      summary: `Task created: ${title}`,
      visibility: "both",
    });

    return task;
  };

  const completeTask = (taskId) => {
    const task = state.tasks.find((item) => item.id === taskId);
    if (!task) return null;
    task.status = "Completed";
    addActivity({
      type: "task_completed",
      actorType: "admin",
      actorName: "Admin",
      clientId: task.clientId,
      engagementId: task.engagementId,
      summary: `Task completed: ${task.title}`,
      visibility: "both",
    });
    return task;
  };

  const createDocumentRequest = ({
    clientId,
    engagementId,
    name,
    category = "Requested",
    status = "Requested",
    serviceName,
    instructions,
    dueDate,
    reviewer = "Owner / Administrator",
  }) => {
    const document = {
      id: `doc-${Date.now().toString().slice(-6)}`,
      clientId,
      engagementId: engagementId || null,
      name,
      category,
      status,
      requestedAt: new Date().toISOString().slice(0, 10),
      receivedAt: null,
      reviewedAt: null,
      sharedAt: null,
      assignedReviewer: reviewer,
      serviceName: serviceName || "General admin support",
      instructions: instructions || "",
      dueDate: dueDate || null,
    };

    state.documents.unshift(document);
    addActivity({
      type: "document_requested",
      actorType: "admin",
      actorName: "Admin",
      clientId: document.clientId,
      engagementId: document.engagementId,
      summary: `${name} requested for ${document.serviceName}`,
      visibility: "both",
    });

    return document;
  };

  const updateDocumentStatus = (documentId, status) => {
    const document = state.documents.find((item) => item.id === documentId);
    if (!document) return null;

    document.status = status;
    if (status === "Received") {
      document.receivedAt = new Date().toISOString().slice(0, 10);
    }
    if (status === "Under Review") {
      document.reviewedAt = new Date().toISOString().slice(0, 10);
    }

    addActivity({
      type: "document_status_changed",
      actorType: "admin",
      actorName: "Admin",
      clientId: document.clientId,
      engagementId: document.engagementId,
      summary: `${document.name} moved to ${status}`,
      visibility: "admin",
    });

    return document;
  };

  const createAppointment = ({
    clientId,
    engagementId,
    title,
    type = "Consultation",
    serviceName,
    date,
    time,
    duration = 60,
    deliveryMethod = "Video call",
    notes,
  }) => {
    const appointment = {
      id: `appt-${Date.now().toString().slice(-6)}`,
      clientId,
      engagementId: engagementId || null,
      title,
      type,
      serviceName: serviceName || "General admin support",
      date,
      time,
      duration,
      status: "Scheduled",
      deliveryMethod,
      notes: notes || "",
    };

    state.appointments.unshift(appointment);
    addActivity({
      type: "appointment_scheduled",
      actorType: "admin",
      actorName: "Admin",
      clientId: appointment.clientId,
      engagementId: appointment.engagementId,
      summary: `${title} scheduled for ${date}`,
      visibility: "both",
    });

    return appointment;
  };

  const changeMessageStatus = (messageId, status) => {
    const message = state.messages.find((item) => item.id === messageId);
    if (!message) return null;
    message.status = status;
    addActivity({
      type: "message_status_changed",
      actorType: "admin",
      actorName: "Admin",
      clientId: message.clientId,
      engagementId: message.engagementId,
      summary: `Message marked as ${status}`,
      visibility: "admin",
    });
    return message;
  };

  const archiveRecord = ({ collection, id }) => {
    const list = state[collection];
    if (!Array.isArray(list)) return null;
    const item = list.find((entry) => entry.id === id);
    if (!item) return null;

    if (collection === "clients") item.status = "Archived";
    if (collection === "engagements") item.status = "Archived";
    if (collection === "tasks") item.status = "Archived";
    if (collection === "documents") item.status = "Archived";
    if (collection === "leads") item.status = "Closed";

    addActivity({
      type: "record_archived",
      actorType: "admin",
      actorName: "Admin",
      summary: `${collection.replace(/s$/, "")} archived`,
      visibility: "admin",
    });

    return item;
  };

  const parseMoney = (value) => {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const getInvoiceNumberSeed = (invoiceNumber = "") => {
    const match = String(invoiceNumber || "").match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  };

  const generateInvoiceNumber = (existing = []) => {
    const year = new Date().getFullYear();
    const numbers = existing
      .map((invoice) =>
        getInvoiceNumberSeed(invoice.invoiceNumber || invoice.id),
      )
      .filter((value) => Number.isFinite(value));

    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
    return `INV-${year}-${String(nextNumber).padStart(4, "0")}`;
  };

  const deriveInvoiceStatus = (invoice, paymentList = []) => {
    const outstanding = paymentList.reduce(
      (sum, payment) => sum + parseMoney(payment.amount),
      0,
    );
    const baseline = parseMoney(invoice.subtotal || invoice.amount || 0);
    const invoiceTotal =
      baseline +
      parseMoney(invoice.adjustments || 0) -
      parseMoney(invoice.creditsApplied || 0);
    const paidAmount = Math.min(
      parseMoney(invoice.paidAmount || outstanding),
      invoiceTotal,
    );
    const remaining = Math.max(invoiceTotal - paidAmount, 0);
    const today = new Date();
    const due = invoice.dueAt ? new Date(`${invoice.dueAt}T23:59:59`) : null;

    if (invoice.status === "Void") return "Void";
    if (invoice.status === "Draft") return "Draft";
    if (paidAmount >= invoiceTotal && invoiceTotal > 0) return "Paid";
    if (remaining > 0 && paidAmount > 0 && paidAmount < invoiceTotal)
      return "Partially Paid";
    if (due && today > due && remaining > 0) return "Past Due";
    if (invoice.status === "Issued" || invoice.status === "Open")
      return "Issued";
    if (!invoice.status) return remaining > 0 ? "Issued" : "Paid";
    return invoice.status;
  };

  const normalizeInvoiceLineItem = (lineItem = {}, index = 0) => {
    const quantity = Number(lineItem.quantity || 1);
    const unitPrice = parseMoney(
      lineItem.unitPrice ?? lineItem.rate ?? lineItem.amount ?? 0,
    );
    const amount = parseMoney(lineItem.amount ?? quantity * unitPrice);

    return {
      id: lineItem.id || `line-${Date.now()}-${index}`,
      serviceCode: String(lineItem.serviceCode || "").trim(),
      description: String(
        lineItem.description || lineItem.serviceName || "Custom line item",
      ).trim(),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unitPrice,
      amount,
      billingType: lineItem.billingType || "Custom",
      referenceType: lineItem.referenceType || "custom",
      relatedServiceId: lineItem.relatedServiceId || null,
      relatedEngagementId: lineItem.relatedEngagementId || null,
      isAddOn: Boolean(lineItem.isAddOn),
    };
  };

  const createInvoiceDraft = ({
    clientId,
    engagementId = null,
    amount,
    dueDate,
    status = "Draft",
    lineItems = [],
    invoiceNumber,
    invoiceDate,
    notes = "",
    internalMemo = "",
    paymentTerms = "",
    adjustments = 0,
    creditsApplied = 0,
    serviceName,
    businessName,
    relatedClientName,
    issueType = "manual",
  }) => {
    const normalizedLines = Array.isArray(lineItems)
      ? lineItems.map((lineItem, index) =>
          normalizeInvoiceLineItem(lineItem, index),
        )
      : [];

    const subtotal = normalizedLines.reduce(
      (sum, lineItem) => sum + parseMoney(lineItem.amount),
      0,
    );
    const requestedAmount = parseMoney(amount);
    const totalAmount = Math.max(
      subtotal + parseMoney(adjustments) - parseMoney(creditsApplied),
      requestedAmount,
      0,
    );
    const invoiceId = `inv-${Date.now().toString().slice(-6)}`;
    const number = invoiceNumber || generateInvoiceNumber(state.invoices);
    const dueDateValue =
      dueDate ||
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
        .toISOString()
        .slice(0, 10);

    const invoice = {
      id: invoiceId,
      invoiceNumber: number,
      clientId,
      engagementId,
      amount: totalAmount,
      subtotal,
      adjustments: parseMoney(adjustments),
      creditsApplied: parseMoney(creditsApplied),
      payments: 0,
      paidAmount: 0,
      status,
      issuedAt: invoiceDate || new Date().toISOString().slice(0, 10),
      dueAt: dueDateValue,
      lineItems: normalizedLines,
      notes,
      internalMemo,
      paymentTerms,
      serviceName: serviceName || normalizedLines[0]?.description || "General",
      businessName: businessName || relatedClientName || "",
      issueType,
      createdAt: new Date().toISOString(),
    };

    if (invoice.status === "Issued" || invoice.status === "Open") {
      invoice.status = "Issued";
    }

    state.invoices.unshift(invoice);
    addActivity({
      type: "invoice_created",
      actorType: "admin",
      actorName: "Admin",
      clientId,
      engagementId,
      summary: `Invoice ${invoice.invoiceNumber} created with ${normalizedLines.length} line item(s)`,
      visibility: "admin",
    });

    return invoice;
  };

  const recordPayment = (invoiceId, payment = {}) => {
    const invoice = state.invoices.find(
      (item) => item.id === invoiceId || item.invoiceNumber === invoiceId,
    );
    if (!invoice) return null;

    const amount = parseMoney(payment.amount);
    if (!amount || amount <= 0)
      throw new Error("Payment amount must be greater than zero.");

    const existingPayments = state.payments.filter(
      (entry) => entry.invoiceId === invoice.id,
    );
    const paidAlready = existingPayments.reduce(
      (sum, entry) => sum + parseMoney(entry.amount),
      0,
    );
    const invoiceTotal = parseMoney(invoice.amount || invoice.subtotal || 0);
    const totalRemaining = Math.max(invoiceTotal - paidAlready, 0);

    if (amount > totalRemaining + 0.01) {
      throw new Error("Payment exceeds the remaining balance on this invoice.");
    }

    const entry = {
      id: `pay-${Date.now().toString().slice(-6)}`,
      invoiceId: invoice.id,
      amount,
      date: payment.date || new Date().toISOString().slice(0, 10),
      methodLabel:
        payment.methodLabel || payment.paymentMethod || "Manual payment",
      reference: payment.reference || "",
      note: payment.note || "",
      createdAt: new Date().toISOString(),
    };

    state.payments.unshift(entry);
    invoice.paidAmount = paidAlready + amount;
    invoice.payments = invoice.paidAmount;
    invoice.status = deriveInvoiceStatus(
      invoice,
      state.payments.filter(
        (paymentEntry) => paymentEntry.invoiceId === invoice.id,
      ),
    );

    addActivity({
      type: "payment_recorded",
      actorType: "admin",
      actorName: "Admin",
      clientId: invoice.clientId,
      engagementId: invoice.engagementId,
      summary: `Payment recorded for ${invoice.invoiceNumber}: ${amount.toFixed(2)}`,
      visibility: "admin",
    });

    return entry;
  };

  const setInvoiceStatus = (invoiceId, status) => {
    const invoice = state.invoices.find(
      (item) => item.id === invoiceId || item.invoiceNumber === invoiceId,
    );
    if (!invoice) return null;
    invoice.status = status;
    addActivity({
      type: "invoice_status_changed",
      actorType: "admin",
      actorName: "Admin",
      clientId: invoice.clientId,
      engagementId: invoice.engagementId,
      summary: `Invoice ${invoice.invoiceNumber || invoice.id} marked ${status}`,
      visibility: "admin",
    });
    return invoice;
  };

  const getFilteredRows = (collection, filters = {}) => {
    const dataset = clone(state[collection] || []);
    const term = (filters.search || "").trim().toLowerCase();

    return dataset.filter((item) => {
      if (term) {
        const source = JSON.stringify(item).toLowerCase();
        if (!source.includes(term)) return false;
      }

      if (filters.status && item.status && item.status !== filters.status)
        return false;
      if (filters.client && item.clientId && item.clientId !== filters.client)
        return false;
      if (
        filters.service &&
        item.serviceName &&
        item.serviceName !== filters.service
      )
        return false;
      if (
        filters.serviceInterest &&
        item.serviceInterest &&
        item.serviceInterest !== filters.serviceInterest
      )
        return false;
      if (filters.type && item.clientType && item.clientType !== filters.type)
        return false;
      if (
        filters.audience &&
        item.audience &&
        item.audience !== filters.audience
      )
        return false;
      if (
        filters.priority &&
        item.priority &&
        item.priority !== filters.priority
      )
        return false;
      return true;
    });
  };

  const reset = () => {
    state = clone(initialData);
    return getSnapshot();
  };

  ensureState();

  return {
    getSnapshot,
    reset,
    addActivity,
    addInternalNote,
    addLeadNote,
    normalizeLeadInput,
    findMatchingLead,
    createLeadFromContact,
    addLeadContactAttempt,
    setLeadStatus,
    scheduleConsultation,
    convertLeadToClient,
    startServiceEngagement,
    updateEngagementStatus,
    createTask,
    completeTask,
    createDocumentRequest,
    updateDocumentStatus,
    createAppointment,
    changeMessageStatus,
    archiveRecord,
    createInvoiceDraft,
    recordPayment,
    setInvoiceStatus,
    generateInvoiceNumber,
    deriveInvoiceStatus,
    getNeedsAttention,
    getFilteredRows,
    updateClientProfile,
    createClient,
    createService,
    updateService,
    addServiceAddOn,
    updateServiceAddOn,
    state,
    findLeadById,
    findClientById,
    findEngagementById,
    findServiceById,
    findServiceByCode,
  };
}

export const adminStore = createAdminStore();
