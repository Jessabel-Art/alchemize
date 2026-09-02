const url = (route, params = {}) => {
  const query = new globalThis.URLSearchParams(params);
  query.set("route", route);
  return `/alchemize-api.php?${query.toString()}`;
};

async function request(route, options = {}, params = {}) {
  const response = await fetch(url(route, params), {
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload?.error?.message || "Scheduling is temporarily unavailable.",
    );
    error.code = payload?.error?.code || "SCHEDULING_ERROR";
    throw error;
  }
  return payload.data;
}

export const publicSchedulingApi = {
  context: (token) => request(`appointments/scheduling-links/${token}`),
  availability: (token, date) =>
    request(
      `appointments/scheduling-links/${token}/availability`,
      {},
      { date },
    ),
  book: (token, payload) =>
    request(`appointments/scheduling-links/${token}/book`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
