import { adminDemoData } from "./admin-demo-data.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

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

export function createAdminStore(initialData = adminDemoData) {
  let state = clone(initialData);

  const ensureState = () => {
    state = {
      ...clone(initialData),
      leads: clone(state.leads || initialData.leads || []),
      clients: clone(state.clients || initialData.clients || []),
      engagements: clone(state.engagements || initialData.engagements || []),
      tasks: clone(state.tasks || initialData.tasks || []),
      documents: clone(state.documents || initialData.documents || []),
      appointments: clone(state.appointments || initialData.appointments || []),
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

  const setLeadStatus = (leadId, status) => {
    const lead = findLeadById(leadId);
    if (!lead) return null;

    lead.status = status;
    addActivity({
      type: "lead_status_changed",
      actorType: "admin",
      actorName: "Admin",
      clientId: null,
      engagementId: null,
      summary: `${lead.name} moved to ${status}`,
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
    addInternalNote({
      relatedType: "lead",
      relatedId: leadId,
      author,
      content,
    });
    return lead;
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
    };

    state.clients.unshift(client);
    lead.status = "Converted";
    lead.nextAction = "Converted to client";

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
    audience,
    initialStatus = "Preparing",
    currentStage,
    assignedChecklist,
    targetDate,
    nextAction,
    assignedTo = "Owner / Administrator",
  }) => {
    const client = findClientById(clientId);
    if (!client) return null;

    const engagement = {
      id: `eng-${Date.now().toString().slice(-6)}`,
      clientId,
      serviceKey: serviceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      serviceName,
      audience: audience || client.clientType,
      status: initialStatus,
      currentStage:
        currentStage ||
        serviceStageCatalog[serviceName]?.[0] ||
        "Initial intake",
      startedAt: new Date().toISOString().slice(0, 10),
      targetDate:
        targetDate ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
          .toISOString()
          .slice(0, 10),
      nextAction: nextAction || "Confirm intake details",
      assignedTo,
      checklist: assignedChecklist || `${serviceName} checklist`,
      tasks: 0,
      documents: 0,
      appointments: 0,
      summary: `${client.displayName} is now beginning the ${serviceName} workflow.`,
      notes: `Admin-only note: ${serviceName} onboarding is beginning in the prototype workflow.`,
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

  const createInvoiceDraft = ({
    clientId,
    engagementId,
    amount,
    dueDate,
    status = "Open",
  }) => {
    const invoice = {
      id: `inv-${Date.now().toString().slice(-6)}`,
      clientId,
      engagementId,
      amount,
      status,
      issuedAt: new Date().toISOString().slice(0, 10),
      dueAt:
        dueDate ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 14)
          .toISOString()
          .slice(0, 10),
    };

    state.invoices.unshift(invoice);
    addActivity({
      type: "invoice_draft_created",
      actorType: "admin",
      actorName: "Admin",
      clientId,
      engagementId,
      summary: `Draft invoice created for ${amount}`,
      visibility: "admin",
    });

    return invoice;
  };

  const setInvoiceStatus = (invoiceId, status) => {
    const invoice = state.invoices.find((item) => item.id === invoiceId);
    if (!invoice) return null;
    invoice.status = status;
    addActivity({
      type: "invoice_status_changed",
      actorType: "admin",
      actorName: "Admin",
      clientId: invoice.clientId,
      engagementId: invoice.engagementId,
      summary: `Invoice ${invoice.id} marked ${status}`,
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
    setInvoiceStatus,
    getNeedsAttention,
    getFilteredRows,
    state,
    findLeadById,
    findClientById,
    findEngagementById,
  };
}

export const adminStore = createAdminStore(adminDemoData);
