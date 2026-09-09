const title = (value = "") =>
  String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
export const adminAppointmentStatuses = [
  "Requested",
  "Scheduled",
  "Confirmed",
  "Completed",
  "Cancelled",
];
const methods = {
  phone: "Phone Call",
  phone_call: "Phone Call",
  google_meet: "Google Meet",
  microsoft_teams: "Microsoft Teams",
  in_person: "In Person",
};
export function mapAdminAppointment(row) {
  const start = String(row.scheduled_at || "").replace(" ", "T");
  return {
    id: String(row.id),
    clientId: row.client_id == null ? "" : String(row.client_id),
    leadId: row.lead_id == null ? "" : String(row.lead_id),
    engagementId: row.engagement_id == null ? "" : String(row.engagement_id),
    serviceId: row.service_id == null ? "" : String(row.service_id),
    ownerUserId: row.owner_user_id == null ? "" : String(row.owner_user_id),
    type: title(row.appointment_type),
    title: title(row.appointment_type),
    serviceName: row.service_name || "",
    date: start.slice(0, 10),
    time: start
      ? new Date(start).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })
      : "",
    timezone: row.timezone || "America/New_York",
    status: title(row.status),
    deliveryMethod: title(row.location_type || "virtual"),
    location: row.location || "",
    duration: Number(row.duration_minutes || 60),
    notes: row.internal_notes || "",
    meetingMethod:
      methods[row.meeting_method] || title(row.meeting_method || "phone"),
    meetingUrl: row.meeting_url || "",
    clientInstructions: row.client_instructions || "",
    needsPreparation: Boolean(Number(row.preparation_required)),
    followUpRequired: Boolean(Number(row.follow_up_required)),
    calendarSyncStatus: title(row.calendar_sync_status || "not_configured"),
  };
}
export function appointmentPayload(draft) {
  const key = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  const status = key(draft.status);
  if (!adminAppointmentStatuses.some((label) => key(label) === status))
    throw new Error("Choose a supported appointment status.");
  return {
    client_id: draft.recipientType === "client" ? Number(draft.clientId) : null,
    lead_id: draft.recipientType === "lead" ? Number(draft.leadId) : null,
    engagement_id: draft.engagementId ? Number(draft.engagementId) : null,
    service_id: draft.serviceId ? Number(draft.serviceId) : null,
    owner_user_id: draft.ownerUserId ? Number(draft.ownerUserId) : null,
    appointment_type: key(draft.type),
    scheduled_at: `${draft.date} ${draft.startTime}:00`,
    timezone:
      draft.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    duration_minutes: Number(draft.duration) || 60,
    location_type: key(draft.location),
    meeting_method:
      key(draft.meetingMethod) === "phone_call"
        ? "phone"
        : key(draft.meetingMethod),
    meeting_url: draft.meetingUrl || null,
    location: draft.locationDetails || draft.location,
    status,
    preparation_required: draft.needsPreparation,
    follow_up_required: draft.followUpRequired,
    internal_notes: draft.notes,
    client_instructions: draft.clientInstructions || null,
  };
}
