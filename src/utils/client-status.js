export const normalizeStatus = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "";

  return text
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const isActiveClient = (client) => {
  if (!client || typeof client !== "object") return false;

  const candidates = [
    client.status,
    client.portalStatus,
    client.lifecycleStatus,
    client.clientStatus,
    client.state,
  ].filter((value) => value != null && String(value).trim() !== "");

  return candidates.some((value) => {
    const status = normalizeStatus(value);
    return (
      status === "active" ||
      status === "active client" ||
      status === "client active"
    );
  });
};
