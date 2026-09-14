import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { initElasticsearch } from "./modules/search/elastic.client";
import { reindexAllInElasticsearch } from "./modules/search/document-indexer.service";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected");

    // Initialize Elasticsearch and sync existing records in background
    initElasticsearch()
      .then(async (res) => {
        if (res.connected) {
          try {
            await reindexAllInElasticsearch();
          } catch (syncErr: any) {
            console.warn("[Elasticsearch] Auto-sync on boot warning:", syncErr.message);
          }
        }
      })
      .catch((err: any) => {
        console.warn("[Elasticsearch] Background bootstrap warning:", err.message);
      });

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
}

startServer();
