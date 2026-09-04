export const normalizeStatus = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.toLowerCase().replace(/[^a-z]+/g, " ").trim();
};

export const isActiveClient = (client) => {
  if (!client || typeof client !== "object") return false;
  const status = normalizeStatus(client.status ?? client.portalStatus ?? "");
  return status === "active";
};
