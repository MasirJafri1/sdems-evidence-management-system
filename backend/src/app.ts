import express from "express";
import cors from "cors";

import authRoutes from "./modules/auth/auth.routes";
import organizationRoutes from "./modules/organizations/organization.routes";
import caseRoutes from "./modules/cases/case.routes";
import documentRoutes from "./modules/documents/document.routes";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "10mb"
  })
);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "secure-evidence-backend",
    phase: 2
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api", caseRoutes);
app.use("/api", documentRoutes);

app.use(errorHandler);

export default app;
