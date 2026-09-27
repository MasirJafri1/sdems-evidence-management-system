import app from "../src/app";

// Vercel serverless entry point
// OpenSearch initialization is explicitly awaited during search/index operations via ensureOpenSearchInitialized()
export default app;
