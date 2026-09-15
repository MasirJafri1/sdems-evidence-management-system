import { Response } from "express";
import fs from "fs";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { s3 } from "../../lib/s3";
import { env } from "../../config/env";
import { calculateSha256, calculateFileSha256 } from "../../utils/hash";
import { AuthenticatedRequest } from "../../middleware/auth";
import { createDocumentSchema } from "./document.schema";
import { anchorDocumentVersion } from "../blockchain/blockchain.service";
import { createAuditEvent } from "../audit/audit.service";
import { checkCasePermission } from "../authorization/authorization.service";
import { isSuperAdmin } from "../authorization/authorization.context";
import { indexDocumentById } from "../search/document-indexer.service";

async function verifyPermission(userId: string, caseId: string, permissionName: string): Promise<boolean> {
  const result = await checkCasePermission({ userId, caseId, permissionName });
  return result.allowed;
}

/**
 * POST /api/cases/:caseId/documents
 */
export async function createDocument(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;
  const file = req.file;

  if (!file) {
    res.status(400).json({
      message: "A file is required"
    });
    return;
  }

  if (!(await verifyPermission(userId, caseId, "DOCUMENT_CREATE"))) {
    res.status(403).json({
      message: "You are not authorized to create documents in this case"
    });
    return;
  }

  const parsed = createDocumentSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid document metadata",
      errors: z.treeifyError(parsed.error)
    });
    return;
  }

  let hash: string;
  let getFileStream: () => any;

  if (file.path && fs.existsSync(file.path)) {
    hash = await calculateFileSha256(file.path);
    getFileStream = () => fs.createReadStream(file.path);
  } else if (file.buffer) {
    hash = calculateSha256(file.buffer);
    getFileStream = () => file.buffer;
  } else {
    res.status(400).json({
      message: "Invalid file uploaded"
    });
    return;
  }

  const document = await prisma.document.create({
    data: {
      caseId,
      title: parsed.data.title,
      description: parsed.data.description,
      documentType: parsed.data.documentType,
      currentVersionNumber: 1
    }
  });

  const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

  const storageKey = [
    "cases",
    caseId,
    "documents",
    document.id,
    "v1",
    `${safeFileName}`
  ].join("/");

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: storageKey,
        Body: getFileStream(),
        ContentLength: file.size,
        ContentType: file.mimetype,
        ServerSideEncryption: "AES256",
        Metadata: {
          documentId: document.id,
          version: "1",
          sha256: hash
        }
      })
    );

    const version = await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        sha256Hash: hash,
        storageProvider: "s3",
        storageBucket: env.S3_BUCKET_NAME,
        storageKey,
        uploadedById: userId
      }
    });

    let blockchain;

    try {
      blockchain = await anchorDocumentVersion({
        documentVersionId: version.id,
        caseId,
        documentId: document.id,
        versionNumber: version.versionNumber,
        sha256Hash: version.sha256Hash
      });
    } catch (error) {
      console.error("Blockchain anchoring failed:", error);
    }

    // Index in Elasticsearch (non-blocking)
    indexDocumentById(document.id).catch((err) =>
      console.warn("[ES] Background indexing failed for new document:", err.message)
    );

    await createAuditEvent({
      caseId,
      actorId: userId,
      eventType: "DOCUMENT_CREATED",
      entityType: "Document",
      entityId: document.id,
      metadata: {
        title: document.title,
        documentType: document.documentType,
        versionNumber: 1,
        sha256Hash: hash
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null
    });

    res.status(201).json({
      document: {
        id: document.id,
        title: document.title,
        status: document.status,
        currentVersionNumber: 1
      },
      version: {
        id: version.id,
        versionNumber: version.versionNumber,
        originalFileName: version.originalFileName,
        mimeType: version.mimeType,
        fileSize: version.fileSize.toString(),
        sha256Hash: version.sha256Hash,
        storageProvider: version.storageProvider,
        uploadedAt: version.uploadedAt
      },
      blockchain
    });
  } catch (error) {
    console.error("🔥 CRITICAL UPLOAD ERROR CAUGHT IN CONTROLLER:", error);
    await prisma.document.delete({
      where: {
        id: document.id
      }
    }).catch(() => { });

    throw error;
  } finally {
    if (file.path && fs.existsSync(file.path)) {
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        console.warn("Failed to cleanup temp upload file:", file.path, err);
      }
    }
  }
}

/**
 * GET /api/cases/:caseId/documents
 */
export async function listDocuments(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;

  if (!(await verifyPermission(userId, caseId, "DOCUMENT_READ"))) {
    res.status(403).json({
      message: "You are not authorized to access this case"
    });
    return;
  }

  const documents = await prisma.document.findMany({
    where: {
      caseId,
      status: {
        not: "DELETED"
      }
    },
    include: {
      versions: {
        orderBy: {
          versionNumber: "desc"
        },
        take: 1,
        select: {
          id: true,
          versionNumber: true,
          originalFileName: true,
          mimeType: true,
          fileSize: true,
          sha256Hash: true,
          uploadedAt: true,
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  res.json(
    documents.map((document) => ({
      ...document,
      versions: document.versions.map((version) => ({
        ...version,
        fileSize: version.fileSize.toString()
      }))
    }))
  );
}

/**
 * GET /api/documents
 * List all documents accessible within user's organization for verification/audit
 */
export async function listOrganizationDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    
    // Execute superadmin check and membership lookup in parallel
    const [superAdmin, memberships] = await Promise.all([
      isSuperAdmin(userId),
      prisma.organizationMembership.findMany({
        where: { userId, status: "ACTIVE" },
        select: { organizationId: true }
      })
    ]);

    const memberOrgIds = memberships.map((m) => m.organizationId);

    const documents = await prisma.document.findMany({
      where: {
        ...(superAdmin
          ? {}
          : memberOrgIds.length > 0
            ? { case: { organizationId: { in: memberOrgIds } } }
            : { case: { participants: { some: { userId, status: "ACTIVE" } } } }),
        status: { not: "DELETED" }
      },
      include: {
        case: {
          select: {
            id: true,
            caseNumber: true,
            title: true
          }
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
          include: {
            blockchainAnchor: true,
            uploadedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(
      documents.map((d) => ({
        ...d,
        versions: d.versions.map((v) => ({
          ...v,
          fileSize: v.fileSize.toString(),
          blockchainAnchor: v.blockchainAnchor
            ? {
              ...v.blockchainAnchor,
              chainId: v.blockchainAnchor.chainId.toString(),
              blockNumber: v.blockchainAnchor.blockNumber?.toString() ?? null
            }
            : null
        }))
      }))
    );
  } catch (error: any) {
    res.status(500).json({ message: "Failed to list documents", error: error.message });
  }
}

/**
 * GET /api/documents/:documentId
 */
export async function getDocument(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const documentId = req.params.documentId as string;

  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    },
    include: {
      case: true,
      versions: {
        orderBy: {
          versionNumber: "asc"
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  if (!document) {
    res.status(404).json({
      message: "Document not found"
    });
    return;
  }

  if (!(await verifyPermission(userId, document.caseId, "DOCUMENT_READ"))) {
    await createAuditEvent({
      caseId: document.caseId,
      actorId: userId,
      eventType: "ACCESS_DENIED",
      entityType: "Document",
      entityId: document.id,
      metadata: {
        reason: "User does not have DOCUMENT_READ permission",
        endpoint: req.originalUrl,
        method: req.method
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null
    });

    res.status(403).json({
      message: "You are not authorized to access this document"
    });
    return;
  }

  await createAuditEvent({
    caseId: document.caseId,
    actorId: userId,
    eventType: "DOCUMENT_VIEWED",
    entityType: "Document",
    entityId: document.id,
    metadata: {
      currentVersion: document.currentVersionNumber
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null
  });

  res.json({
    ...document,
    versions: document.versions.map((version) => ({
      ...version,
      fileSize: version.fileSize.toString()
    }))
  });
}

/**
 * GET /api/documents/:documentId/versions/:versionNumber/download
 */
export async function downloadDocument(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const documentId = req.params.documentId as string;
  const versionNumber = Number(req.params.versionNumber);

  if (!Number.isInteger(versionNumber) || versionNumber < 1) {
    res.status(400).json({
      message: "Invalid version number"
    });
    return;
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    }
  });

  if (!document) {
    res.status(404).json({
      message: "Document not found"
    });
    return;
  }

  if (!(await verifyPermission(userId, document.caseId, "DOCUMENT_DOWNLOAD"))) {
    res.status(403).json({
      message: "Missing DOCUMENT_DOWNLOAD permission"
    });
    return;
  }

  const version = await prisma.documentVersion.findUnique({
    where: {
      documentId_versionNumber: {
        documentId,
        versionNumber
      }
    }
  });

  if (!version) {
    res.status(404).json({
      message: "Document version not found"
    });
    return;
  }

  const command = new GetObjectCommand({
    Bucket: version.storageBucket,
    Key: version.storageKey,
    ResponseContentDisposition: `attachment; filename="${version.originalFileName}"`
  });

  if (req.query.stream === 'true') {
    try {
      const s3Item = await s3.send(command);
      res.setHeader("Content-Disposition", `attachment; filename="${version.originalFileName}"`);
      res.setHeader("Content-Type", version.mimeType || "application/octet-stream");
      if (s3Item.ContentLength) {
        res.setHeader("Content-Length", s3Item.ContentLength.toString());
      }

      await createAuditEvent({
        caseId: document.caseId,
        actorId: userId,
        eventType: "DOCUMENT_DOWNLOADED",
        entityType: "DocumentVersion",
        entityId: version.id,
        metadata: {
          documentId: version.documentId,
          versionNumber: version.versionNumber,
          sha256Hash: version.sha256Hash,
          streamed: true
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent") ?? null
      });

      // s3Item.Body is a Readable stream in Node.js
      if (s3Item.Body) {
        (s3Item.Body as any).pipe(res);
      } else {
        res.status(500).json({ message: "Empty file body returned from storage" });
      }
      return;
    } catch (error) {
      console.error("Error streaming from S3:", error);
      res.status(500).json({ message: "Failed to stream file from storage" });
      return;
    }
  }

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 300
  });

  await createAuditEvent({
    caseId: document.caseId,
    actorId: userId,
    eventType: "DOCUMENT_DOWNLOADED",
    entityType: "DocumentVersion",
    entityId: version.id,
    metadata: {
      documentId: version.documentId,
      versionNumber: version.versionNumber,
      sha256Hash: version.sha256Hash
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? null
  });

  res.json({
    documentId,
    versionNumber,
    originalFileName: version.originalFileName,
    sha256Hash: version.sha256Hash,
    expiresInSeconds: 300,
    downloadUrl: signedUrl
  });
}

/**
 * POST /api/documents/:documentId/versions
 */
export async function createDocumentVersion(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.userId!;
  const documentId = req.params.documentId as string;
  const file = req.file;

  if (!file) {
    res.status(400).json({
      message: "A file is required"
    });
    return;
  }

  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    }
  });

  if (!document) {
    res.status(404).json({
      message: "Document not found"
    });
    return;
  }

  if (!(await verifyPermission(userId, document.caseId, "DOCUMENT_VERSION_CREATE"))) {
    res.status(403).json({
      message: "You are not authorized to modify this document"
    });
    return;
  }

  const nextVersion = document.currentVersionNumber + 1;
  let hash: string;
  let getFileStream: () => any;

  if (file.path && fs.existsSync(file.path)) {
    hash = await calculateFileSha256(file.path);
    getFileStream = () => fs.createReadStream(file.path);
  } else if (file.buffer) {
    hash = calculateSha256(file.buffer);
    getFileStream = () => file.buffer;
  } else {
    res.status(400).json({
      message: "Invalid file uploaded"
    });
    return;
  }

  const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

  const storageKey = [
    "cases",
    document.caseId,
    "documents",
    document.id,
    `v${nextVersion}`,
    safeFileName
  ].join("/");

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: storageKey,
        Body: getFileStream(),
        ContentLength: file.size,
        ContentType: file.mimetype,
        ServerSideEncryption: "AES256",
        Metadata: {
          documentId: document.id,
          version: String(nextVersion),
          sha256: hash
        }
      })
    );

    const result = await prisma.$transaction(async (tx) => {
      const version = await tx.documentVersion.create({
        data: {
          documentId,
          versionNumber: nextVersion,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: BigInt(file.size),
          sha256Hash: hash,
          storageProvider: "s3",
          storageBucket: env.S3_BUCKET_NAME,
          storageKey,
          uploadedById: userId
        }
      });

      const updatedDocument = await tx.document.update({
        where: {
          id: documentId
        },
        data: {
          currentVersionNumber: nextVersion
        }
      });

      return {
        version,
        updatedDocument
      };
    });

    let blockchain;

    try {
      blockchain = await anchorDocumentVersion({
        documentVersionId: result.version.id,
        caseId: document.caseId,
        documentId,
        versionNumber: result.version.versionNumber,
        sha256Hash: result.version.sha256Hash
      });
    } catch (error) {
      console.error("Blockchain anchoring failed:", error);
    }

    // Re-index in Elasticsearch with new version content (non-blocking)
    indexDocumentById(document.id).catch((err) =>
      console.warn("[ES] Background indexing failed for new version:", err.message)
    );

    await createAuditEvent({
      caseId: document.caseId,
      actorId: userId,
      eventType: "DOCUMENT_VERSION_CREATED",
      entityType: "DocumentVersion",
      entityId: result.version.id,
      metadata: {
        documentId: document.id,
        versionNumber: nextVersion,
        sha256Hash: hash,
        storageKey
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null
    });

    res.status(201).json({
      documentId,
      currentVersion: result.updatedDocument.currentVersionNumber,
      version: {
        id: result.version.id,
        versionNumber: result.version.versionNumber,
        originalFileName: result.version.originalFileName,
        mimeType: result.version.mimeType,
        fileSize: result.version.fileSize.toString(),
        sha256Hash: result.version.sha256Hash,
        storageProvider: result.version.storageProvider,
        uploadedAt: result.version.uploadedAt
      },
      blockchain
    });
  } finally {
    if (file.path && fs.existsSync(file.path)) {
      try {
        await fs.promises.unlink(file.path);
      } catch (err) {
        console.warn("Failed to cleanup temp upload file:", file.path, err);
      }
    }
  }
}
