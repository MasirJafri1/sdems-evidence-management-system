import fs from "fs";
import path from "path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../../lib/prisma";
import { s3 } from "../../lib/s3";
import { extractTextFromFile } from "./extractor.service";
import { indexEntityInElasticsearch } from "./search.service";

/**
 * Indexes a single Document (and its latest version) into Elasticsearch.
 * Asynchronously extracts full text content from local storage or S3, computes embeddings, and updates ES.
 */
export async function indexDocumentById(documentId: string, directFileInput?: Buffer | string): Promise<void> {
  try {
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
      return;
    }

    const latestVersion = doc.versions[0];
    let extractedText = "";

    if (directFileInput) {
      extractedText = await extractTextFromFile(
        directFileInput,
        latestVersion.mimeType,
        latestVersion.originalFileName
      );
    } else {
      // 1. Try local file path first
      const fileCandidates = [
        latestVersion.storageKey,
        path.join(process.cwd(), "uploads", latestVersion.storageKey),
        path.join(process.cwd(), latestVersion.storageKey)
      ];

      let foundPath = fileCandidates.find((p) => fs.existsSync(p));
      if (foundPath) {
        extractedText = await extractTextFromFile(
          foundPath,
          latestVersion.mimeType,
          latestVersion.originalFileName
        );
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
            extractedText = await extractTextFromFile(
              buffer,
              latestVersion.mimeType,
              latestVersion.originalFileName
            );
          }
        } catch (s3Err: any) {
          console.warn(`[DocumentIndexer] Could not fetch file from S3 for doc ${doc.id}:`, s3Err.message);
        }
      }
    }

    const fullContent = [doc.title, doc.description || "", extractedText].filter(Boolean).join("\n\n");

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
  } catch (err: any) {
    console.warn(`[DocumentIndexer] Error indexing document ${documentId}:`, err.message);
  }
}

/**
 * Indexes a single Evidence item into Elasticsearch.
 */
export async function indexEvidenceById(evidenceId: string): Promise<void> {
  try {
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
        extractedText = await extractTextFromFile(
          foundPath,
          evidence.documentVersion.mimeType,
          evidence.documentVersion.originalFileName
        );
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
            extractedText = await extractTextFromFile(
              buffer,
              evidence.documentVersion.mimeType,
              evidence.documentVersion.originalFileName
            );
          }
        } catch (s3Err: any) {
          console.warn(`[DocumentIndexer] S3 fetch warning for evidence ${evidence.id}:`, s3Err.message);
        }
      }
    }

    const fullContent = [evidence.title, evidence.description || "", `Serial: ${evidence.evidenceNumber}`, extractedText].filter(Boolean).join("\n\n");

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
  } catch (err: any) {
    console.warn(`[DocumentIndexer] Error indexing evidence ${evidenceId}:`, err.message);
  }
}

import { initElasticsearch } from "./elastic.client";

/**
 * Centralized full reindexing of all active documents and evidence items.
 * Clears and recreates past index schema before populating fresh extracted content.
 */
export async function reindexAllInElasticsearch(): Promise<{ documentsIndexed: number; evidenceIndexed: number }> {
  console.log("[DocumentIndexer] Wiping past index and initializing fresh index...");
  await initElasticsearch(true);
  console.log("[DocumentIndexer] Starting full reindex into Elasticsearch/OpenSearch...");
  
  const documents = await prisma.document.findMany({
    where: { status: "ACTIVE" },
    select: { id: true }
  });

  let documentsIndexed = 0;
  for (const doc of documents) {
    await indexDocumentById(doc.id);
    documentsIndexed++;
  }

  const evidenceItems = await prisma.evidence.findMany({
    select: { id: true }
  });

  let evidenceIndexed = 0;
  for (const ev of evidenceItems) {
    await indexEvidenceById(ev.id);
    evidenceIndexed++;
  }

  console.log(`[DocumentIndexer] Reindex complete: ${documentsIndexed} documents and ${evidenceIndexed} evidence items indexed.`);
  return { documentsIndexed, evidenceIndexed };
}
