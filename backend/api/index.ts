import app from "../src/app";
import { initElasticsearch } from "../src/modules/search/elastic.client";

// Vercel serverless cold-start initialization
// server.ts does NOT run on Vercel — this is the only entry point
let initialized = false;

if (!initialized) {
  initialized = true;
  initElasticsearch()
    .then((res) => {
      console.log("[Vercel] OpenSearch init result:", res);
    })
    .catch((err) => {
      console.warn("[Vercel] OpenSearch init warning:", err.message);
    });
}

export default app;
