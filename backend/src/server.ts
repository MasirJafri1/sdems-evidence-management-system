import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";
import { initElasticsearch } from "./modules/search/elastic.client";
import { indexEntityInElasticsearch } from "./modules/search/search.service";

async function startServer() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected");

    // Initialize Elasticsearch and sync existing records in background
    initElasticsearch()
      .then(async (res) => {
        if (res.connected) {
          // Sync existing records to Elasticsearch so everything is searchable from day 1
          try {
            const docs = await prisma.document.findMany({
              include: {
                case: true,
                versions: {
                  orderBy: { versionNumber: "desc" },
                  take: 1,
                  include: { uploadedBy: { select: { name: true } } }
                }
              }
            });

            for (const doc of docs) {
              const latestVer = doc.versions[0];
              let inDocText = "";

              if (latestVer?.storageBucket && latestVer?.storageKey) {
                try {
                  const { s3 } = await import("./lib/s3.js");
                  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
                  const { extractTextFromFile } = await import("./modules/search/extractor.service.js");
                  const s3Obj = await s3.send(
                    new GetObjectCommand({
                      Bucket: latestVer.storageBucket,
                      Key: latestVer.storageKey
                    })
                  );
                  if (s3Obj.Body) {
                    const byteArray = await s3Obj.Body.transformToByteArray();
                    inDocText = await extractTextFromFile(Buffer.from(byteArray), latestVer.mimeType, latestVer.originalFileName);
                  }
                } catch (s3Err: any) {
                  // Non-fatal if storage file is unavailable
                }
              }

              const fullSearchableContent = [doc.title, doc.description || "", inDocText].filter(Boolean).join("\n\n");
              console.log(`[Elasticsearch Boot Sync] Doc "${doc.title}" has ${inDocText.length} extracted characters.`);

              await indexEntityInElasticsearch({
                id: doc.id,
                entityType: "DOCUMENT",
                title: doc.title,
                content: fullSearchableContent,
                summary: doc.description || undefined,
                caseId: doc.caseId,
                caseNumber: doc.case?.caseNumber || "CASE-REF",
                organizationId: doc.case?.organizationId || "",
                documentType: doc.documentType || undefined,
                versionNumber: latestVer?.versionNumber || 1,
                sha256Hash: latestVer?.sha256Hash || undefined,
                status: doc.status,
                uploadedBy: latestVer?.uploadedBy?.name || "Officer",
                createdAt: doc.createdAt
              });
            }

            const evidences = await prisma.evidence.findMany({
              include: {
                case: true,
                documentVersion: { select: { sha256Hash: true } },
                currentCustodian: { select: { name: true } }
              }
            });

            for (const ev of evidences) {
              await indexEntityInElasticsearch({
                id: ev.id,
                entityType: "EVIDENCE",
                title: ev.title,
                content: `${ev.title} ${ev.description || ""} Evidence ID: ${ev.evidenceNumber}`,
                caseId: ev.caseId,
                caseNumber: ev.case?.caseNumber || "CASE-REF",
                organizationId: ev.case?.organizationId || "",
                serialNumber: ev.evidenceNumber || undefined,
                evidenceType: "EXHIBIT",
                sha256Hash: ev.documentVersion?.sha256Hash || undefined,
                status: ev.status,
                uploadedBy: ev.currentCustodian?.name || "Custodian",
                createdAt: ev.createdAt
              });
            }
            console.log(`[Elasticsearch] Auto-indexed ${docs.length} documents and ${evidences.length} evidence items on boot.`);
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
