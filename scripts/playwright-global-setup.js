import { preview } from "vite";

export default async function startPreview() {
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
