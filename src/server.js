const { createApp } = require("./app");
const { initializeTracing, shutdownTracing } = require("./tracing");

const port = Number(process.env.PORT || 3000);

async function startServer() {
  await initializeTracing();

  const app = createApp();
  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`FreshCart API listening on port ${port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await shutdownTracing();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start FreshCart API", error);
  process.exit(1);
});

