import { Response } from "express";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { s3 } from "../../lib/s3";
import { env } from "../../config/env";
import { calculateSha256 } from "../../utils/hash";
import { AuthenticatedRequest } from "../../middleware/auth";
import { createDocumentSchema } from "./document.schema";
import { anchorDocumentVersion } from "../blockchain/blockchain.service";
import { createAuditEvent } from "../audit/audit.service";

function hasPermission(membership: any, permissionName: string): boolean {
  return membership?.role?.permissions?.some(
    (rp: any) => rp.permission.name === permissionName
  );
}

async function getCaseMembership(userId: string, caseId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: {
      id: caseId
    }
  });

  if (!caseRecord) {
    return null;
  }

  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: caseRecord.organizationId
      }
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!membership) {
    return null;
  }

  const participant = await prisma.caseParticipant.findUnique({
    where: {
      caseId_userId: {
        caseId,
        userId
      }
    }
  });

  if (!participant || participant.status !== "ACTIVE") {
    return null;
  }

  return {
    caseRecord,
    membership,
    participant
  };
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

  const access = await getCaseMembership(userId, caseId);

  if (!access) {
    res.status(403).json({
      message: "You are not authorized to access this case"
    });
    return;
  }

  if (!hasPermission(access.membership, "DOCUMENT_CREATE")) {
    res.status(403).json({
      message: "Missing DOCUMENT_CREATE permission"
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

  const hash = calculateSha256(file.buffer);

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
        Body: file.buffer,
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
    await prisma.document.delete({
      where: {
        id: document.id
      }
    });

    throw error;
  }
}

/**
 * GET /api/cases/:caseId/documents
 */
export async function listDocuments(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId!;
  const caseId = req.params.caseId as string;

  const access = await getCaseMembership(userId, caseId);

  if (!access) {
    res.status(403).json({
      message: "You are not authorized to access this case"
    });
    return;
  }

  if (!hasPermission(access.membership, "DOCUMENT_READ")) {
    res.status(403).json({
      message: "Missing DOCUMENT_READ permission"
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

  const access = await getCaseMembership(userId, document.caseId);

  if (!access) {
    await createAuditEvent({
      caseId: document.caseId,
      actorId: userId,
      eventType: "ACCESS_DENIED",
      entityType: "Document",
      entityId: document.id,
      metadata: {
        reason: "User is not an active case participant",
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

  if (!hasPermission(access.membership, "DOCUMENT_READ")) {
    res.status(403).json({
      message: "Missing DOCUMENT_READ permission"
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

  const access = await getCaseMembership(userId, document.caseId);

  if (!access) {
    res.status(403).json({
      message: "You are not authorized to access this document"
    });
    return;
  }

  if (!hasPermission(access.membership, "DOCUMENT_DOWNLOAD")) {
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
    Key: version.storageKey
  });

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

  const access = await getCaseMembership(userId, document.caseId);

  if (!access) {
    res.status(403).json({
      message: "You are not authorized to modify this document"
    });
    return;
  }

  if (!hasPermission(access.membership, "DOCUMENT_VERSION_CREATE")) {
    res.status(403).json({
      message: "Missing DOCUMENT_VERSION_CREATE permission"
    });
    return;
  }

  const nextVersion = document.currentVersionNumber + 1;
  const hash = calculateSha256(file.buffer);
  const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

  const storageKey = [
    "cases",
    document.caseId,
    "documents",
    document.id,
    `v${nextVersion}`,
    safeFileName
  ].join("/");

  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: storageKey,
      Body: file.buffer,
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
}
