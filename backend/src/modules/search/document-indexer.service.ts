import fs from "fs";
import path from "path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../../lib/prisma";
import { s3 } from "../../lib/s3";
import { extractTextWithMetadata } from "./extractor.service";
import { indexEntityInElasticsearch } from "./search.service";
import { ensureOpenSearchInitialized, SDEMS_SEARCH_INDEX } from "./elastic.client";

/**
 * Indexes a single Document (and its latest version) into OpenSearch.
 * Extracts full text content from local storage or S3, computes embeddings, and updates OpenSearch.
 * Rethrows any errors so caller can handle failure explicitly.
 */
export async function indexDocumentById(documentId: string, directFileInput?: Buffer | string): Promise<void> {
  const init = await ensureOpenSearchInitialized();
  if (!init.connected) {
    console.warn(`[DocumentIndexer] OpenSearch offline. Skipping indexing for document ${documentId}`);
    throw new Error(`OpenSearch connection unavailable: ${init.error || "Ping failed"}`);
  }

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      case: {
        select: {
          id: true,
          caseNumber: true,
          organizationId: true
        }
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          blockchainAnchor: { select: { transactionHash: true, anchorId: true } }
        }
      }
    }
  });

  if (!doc || doc.status !== "ACTIVE" || doc.versions.length === 0) {
    console.warn(`[DocumentIndexer] Document ${documentId} not found, inactive, or has no versions.`);
    return;
  }

  const latestVersion = doc.versions[0];
  let extractedText = "";

  try {
    if (directFileInput) {
      const extraction = await extractTextWithMetadata(
        directFileInput,
        latestVersion.mimeType,
        latestVersion.originalFileName
      );
      extractedText = extraction.text;
    } else {
      // 1. Try local file path first
      const fileCandidates = [
        latestVersion.storageKey,
        path.join(process.cwd(), "uploads", latestVersion.storageKey),
        path.join(process.cwd(), latestVersion.storageKey)
      ];

      let foundPath = fileCandidates.find((p) => fs.existsSync(p));
      if (foundPath) {
        const extraction = await extractTextWithMetadata(
          foundPath,
          latestVersion.mimeType,
          latestVersion.originalFileName
        );
        extractedText = extraction.text;
      } else if (latestVersion.storageBucket && latestVersion.storageKey) {
        // 2. Fetch from AWS S3 storage
        try {
          const s3Obj = await s3.send(
            new GetObjectCommand({
              Bucket: latestVersion.storageBucket,
              Key: latestVersion.storageKey
            })
          );
          if (s3Obj.Body) {
            const byteArray = await s3Obj.Body.transformToByteArray();
            const buffer = Buffer.from(byteArray);
            const extraction = await extractTextWithMetadata(
              buffer,
              latestVersion.mimeType,
              latestVersion.originalFileName
            );
            extractedText = extraction.text;
          }
        } catch (s3Err: any) {
          console.warn(`[DocumentIndexer] S3 fetch failed for document ${doc.id}:`, s3Err.message);
        }
      }
    }

    const fullContent = [
      doc.title,
      doc.description || "",
      `File: ${latestVersion.originalFileName}`,
      `Hash: ${latestVersion.sha256Hash}`,
      extractedText
    ].filter(Boolean).join("\n\n");

    await indexEntityInElasticsearch({
      id: doc.id,
      entityType: "DOCUMENT",
      title: doc.title,
      content: fullContent,
      summary: doc.description || "",
      caseId: doc.caseId,
      caseNumber: doc.case.caseNumber,
      organizationId: doc.case.organizationId,
      documentType: doc.documentType || undefined,
      versionNumber: latestVersion.versionNumber,
      sha256Hash: latestVersion.sha256Hash,
      blockchainAnchorId: latestVersion.blockchainAnchor?.transactionHash || latestVersion.blockchainAnchor?.anchorId || undefined,
      status: doc.status,
      uploadedBy: latestVersion.uploadedBy?.name || latestVersion.uploadedBy?.email || undefined,
      createdAt: doc.createdAt
    });

    console.log(`[DocumentIndexer] Successfully indexed Document "${doc.title}" (${doc.id})`);
  } catch (err: any) {
    console.error(`[DocumentIndexer] Failed indexing document ID="${documentId}" in index="${SDEMS_SEARCH_INDEX}":`, err);
    throw err;
  }
}

/**
 * Indexes a single Evidence item into OpenSearch.
 * Rethrows any errors so caller can handle failure explicitly.
 */
export async function indexEvidenceById(evidenceId: string): Promise<void> {
  const init = await ensureOpenSearchInitialized();
  if (!init.connected) {
    console.warn(`[DocumentIndexer] OpenSearch offline. Skipping indexing for evidence ${evidenceId}`);
    throw new Error(`OpenSearch connection unavailable: ${init.error || "Ping failed"}`);
  }

  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: {
      case: {
        select: {
          id: true,
          caseNumber: true,
          organizationId: true
        }
      },
      documentVersion: true,
      createdBy: { select: { id: true, name: true, email: true } },
      currentCustodian: { select: { id: true, name: true, email: true } }
    }
  });

  if (!evidence) {
    console.warn(`[DocumentIndexer] Evidence ${evidenceId} not found.`);
    return;
  }

  let extractedText = "";
  if (evidence.documentVersion) {
    const fileCandidates = [
      evidence.documentVersion.storageKey,
      path.join(process.cwd(), "uploads", evidence.documentVersion.storageKey),
      path.join(process.cwd(), evidence.documentVersion.storageKey)
    ];
    let foundPath = fileCandidates.find((p) => fs.existsSync(p));
    if (foundPath) {
      const extraction = await extractTextWithMetadata(
        foundPath,
        evidence.documentVersion.mimeType,
        evidence.documentVersion.originalFileName
      );
      extractedText = extraction.text;
    } else if (evidence.documentVersion.storageBucket && evidence.documentVersion.storageKey) {
      try {
        const s3Obj = await s3.send(
          new GetObjectCommand({
            Bucket: evidence.documentVersion.storageBucket,
            Key: evidence.documentVersion.storageKey
          })
        );
        if (s3Obj.Body) {
          const byteArray = await s3Obj.Body.transformToByteArray();
          const buffer = Buffer.from(byteArray);
          const extraction = await extractTextWithMetadata(
            buffer,
            evidence.documentVersion.mimeType,
            evidence.documentVersion.originalFileName
          );
          extractedText = extraction.text;
        }
      } catch (s3Err: any) {
        console.warn(`[DocumentIndexer] S3 fetch warning for evidence ${evidence.id}:`, s3Err.message);
      }
    }
  }

  const fullContent = [
    evidence.title,
    evidence.description || "",
    `Serial: ${evidence.evidenceNumber}`,
    evidence.documentVersion?.sha256Hash ? `Hash: ${evidence.documentVersion.sha256Hash}` : "",
    extractedText
  ].filter(Boolean).join("\n\n");

  try {
    await indexEntityInElasticsearch({
      id: evidence.id,
      entityType: "EVIDENCE",
      title: evidence.title,
      content: fullContent,
      summary: evidence.description || "",
      caseId: evidence.caseId,
      caseNumber: evidence.case.caseNumber,
      organizationId: evidence.case.organizationId,
      serialNumber: evidence.evidenceNumber,
      evidenceType: "EXHIBIT",
      sha256Hash: evidence.documentVersion?.sha256Hash || undefined,
      status: evidence.status,
      uploadedBy: evidence.createdBy?.name || evidence.createdBy?.email || evidence.currentCustodian?.name || undefined,
      createdAt: evidence.createdAt
    });

    console.log(`[DocumentIndexer] Successfully indexed Evidence "${evidence.title}" (${evidence.id})`);
  } catch (err: any) {
    console.error(`[DocumentIndexer] Failed indexing evidence ID="${evidenceId}" in index="${SDEMS_SEARCH_INDEX}":`, err);
    throw err;
  }
}

export interface ReindexReport {
  attempted: number;
  successful: number;
  failed: number;
  documentsIndexed: number;
  evidenceIndexed: number;
  durationMs: number;
  errors: Array<{ id: string; type: string; error: string }>;
}

/**
 * Centralized full reindexing of all active documents and evidence items into OpenSearch.
 * Connects, recreates index schema, loads records from Postgres, indexes them, and reports results.
 */
export async function reindexAllInElasticsearch(): Promise<ReindexReport> {
  const startTime = Date.now();
  console.log("[DocumentIndexer] Initializing fresh OpenSearch index for reindex...");
  await ensureOpenSearchInitialized(true);

  const documents = await prisma.document.findMany({
    where: { status: "ACTIVE" },
    select: { id: true }
  });

  const evidenceItems = await prisma.evidence.findMany({
    select: { id: true }
  });

  let attempted = 0;
  let successful = 0;
  let failed = 0;
  let documentsIndexed = 0;
  let evidenceIndexed = 0;
  const errors: Array<{ id: string; type: string; error: string }> = [];

  for (const doc of documents) {
    attempted++;
    try {
      await indexDocumentById(doc.id);
      successful++;
      documentsIndexed++;
    } catch (err: any) {
      failed++;
      errors.push({ id: doc.id, type: "DOCUMENT", error: err.message });
      console.error(`[DocumentIndexer] Reindex error on document ${doc.id}:`, err.message);
    }
  }

  for (const ev of evidenceItems) {
    attempted++;
    try {
      await indexEvidenceById(ev.id);
      successful++;
      evidenceIndexed++;
    } catch (err: any) {
      failed++;
      errors.push({ id: ev.id, type: "EVIDENCE", error: err.message });
      console.error(`[DocumentIndexer] Reindex error on evidence ${ev.id}:`, err.message);
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[DocumentIndexer] Reindex finished in ${durationMs}ms: attempted=${attempted}, successful=${successful}, failed=${failed}`);

  return {
    attempted,
    successful,
    failed,
    documentsIndexed,
    evidenceIndexed,
    durationMs,
    errors
  };
}
