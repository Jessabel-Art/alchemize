import { clientPortalDemoData } from "./client-demo-data.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

export async function getCurrentClient() {
  return clone(clientPortalDemoData.client);
}

export async function getClientEngagements() {
  return clone(clientPortalDemoData.serviceEngagements);
}

export async function getClientTasks() {
  return clone(clientPortalDemoData.tasks);
}

export async function getClientDocuments() {
  return clone(clientPortalDemoData.documents);
}

export async function getClientAppointments() {
  return clone(clientPortalDemoData.appointments);
}

export async function getClientMessages() {
  return clone(clientPortalDemoData.messages);
}

export async function getClientInvoices() {
  return clone(clientPortalDemoData.invoices);
}

export async function getClientPayments() {
  return clone(clientPortalDemoData.payments);
}

export async function getClientNotifications() {
  return clone(clientPortalDemoData.notifications);
}

export async function getClientActivity() {
  return clone(clientPortalDemoData.activity);
}

export async function getPortalSnapshot() {
  const [
    client,
    engagements,
    tasks,
    documents,
    appointments,
    messages,
    invoices,
    payments,
    notifications,
    activity,
  ] = await Promise.all([
    getCurrentClient(),
    getClientEngagements(),
    getClientTasks(),
    getClientDocuments(),
    getClientAppointments(),
    getClientMessages(),
    getClientInvoices(),
    getClientPayments(),
    getClientNotifications(),
    getClientActivity(),
  ]);

  return {
    client,
    engagements,
    tasks,
    documents,
    appointments,
    messages,
    invoices,
    payments,
    notifications,
    activity,
  };
}
