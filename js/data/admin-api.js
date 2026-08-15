import { adminStore } from "./admin-store.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

export { adminStore };

export function resetAdminPrototype() {
  adminStore.reset();
}

export async function getAdminDashboard() {
  return clone(adminStore.getSnapshot());
}

export async function getLeads() {
  return clone(adminStore.state.leads);
}

export async function getLeadById(id) {
  return clone(adminStore.findLeadById(id));
}

export async function getClients() {
  return clone(adminStore.state.clients);
}

export async function getClientById(id) {
  return clone(adminStore.findClientById(id));
}

export async function getEngagements() {
  return clone(adminStore.state.engagements);
}

export async function getEngagementById(id) {
  return clone(adminStore.findEngagementById(id));
}

export async function getTasks() {
  return clone(adminStore.state.tasks);
}

export async function getDocuments() {
  return clone(adminStore.state.documents);
}

export async function getAppointments() {
  return clone(adminStore.state.appointments);
}

export async function getMessages() {
  return clone(adminStore.state.messages);
}

export async function getInvoices() {
  return clone(adminStore.state.invoices);
}

export async function getActivity() {
  return clone(adminStore.state.activity);
}

export async function getContentInventory() {
  return clone(adminStore.state.contentInventory);
}

export async function getAdminSnapshot() {
  return clone(adminStore.getSnapshot());
}
