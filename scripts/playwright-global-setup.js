import { preview } from "vite";

export default async function startPreview() {
  try {
    const response = await fetch("http://127.0.0.1:4173/");
    if (response.ok) return async () => {};
  } catch {
    // No reusable preview is running; start one below.
  }
  const server = await preview({
    preview: {
      host: "127.0.0.1",
      port: 4173,
      strictPort: true,
    },
  });

  return async () => {
    server.httpServer?.closeAllConnections?.();
    await new Promise((resolve, reject) => {
      server.httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  };
}
