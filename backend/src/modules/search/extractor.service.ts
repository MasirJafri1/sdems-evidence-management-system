import fs from "fs";

/**
 * Robust Text Extractor for In-File Document Search
 * Supports:
 * - Plain text, Markdown, CSV, JSON, Log files (.txt, .md, .csv, .json, .log)
 * - PDF documents (extracts embedded textual streams)
 * - HTML and XML documents
 */
export async function extractTextFromFile(
  filePathOrBuffer: string | Buffer,
  mimeType?: string,
  fileName?: string
): Promise<string> {
  try {
    let buffer: Buffer;

    if (typeof filePathOrBuffer === "string") {
      if (!fs.existsSync(filePathOrBuffer)) {
        return "";
      }
      buffer = await fs.promises.readFile(filePathOrBuffer);
    } else {
      buffer = filePathOrBuffer;
    }

    const lowerName = (fileName || "").toLowerCase();
    const lowerMime = (mimeType || "").toLowerCase();

    // 1. Plain text formats (.txt, .json, .csv, .md, .log, .xml, .html)
    if (
      lowerMime.includes("text") ||
      lowerMime.includes("json") ||
      lowerMime.includes("csv") ||
      lowerMime.includes("xml") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".json") ||
      lowerName.endsWith(".csv") ||
      lowerName.endsWith(".md") ||
      lowerName.endsWith(".log")
    ) {
      return buffer.toString("utf8").slice(0, 100000); // Index up to first 100k chars
    }

    // 2. PDF Documents: Native fast stream parser
    if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
      return extractTextFromPdfBuffer(buffer);
    }

    // 3. Fallback: Extract readable ASCII/UTF-8 strings from binary file
    return extractPrintableStrings(buffer);
  } catch (err: any) {
    console.warn("[TextExtractor] Failed to extract text from file:", err.message);
    return "";
  }
}

import zlib from "zlib";

/**
 * Extracts plain-text chunks from PDF format:
 * 1. Handles compressed FlateDecode streams via zlib
 * 2. Parses PDF text operators (/BT ... /ET, Tj, TJ)
 * 3. Falls back to ASCII printable strings
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const content = buffer.toString("latin1");
  const textBlocks: string[] = [];

  // Helper to parse text operators from an uncompressed string
  function parsePdfTextOps(str: string) {
    // Parenthesized literals: (Some text) Tj
    const regexLiteral = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = regexLiteral.exec(str)) !== null) {
      const text = match[1].replace(/\\([()\\])/g, "$1").trim();
      if (text.length > 1) {
        textBlocks.push(text);
      }
      if (textBlocks.length > 5000) return;
    }

    // Array-based text: [ (Part 1) -10 (Part 2) ] TJ
    const regexArray = /\[([^\]]+)\]\s*TJ/g;
    while ((match = regexArray.exec(str)) !== null) {
      const rawArray = match[1];
      const subLiterals = rawArray.match(/\(([^)]+)\)/g) || [];
      const joined = subLiterals
        .map((s) => s.slice(1, -1).replace(/\\([()\\])/g, "$1"))
        .join(" ")
        .trim();
      if (joined.length > 1) {
        textBlocks.push(joined);
      }
      if (textBlocks.length > 5000) return;
    }
  }

  // 1. First parse uncompressed text operators
  parsePdfTextOps(content);

  // 2. Decompress all FlateDecode streams in the PDF (ReportLab, Adobe, LibreOffice)
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let streamMatch;
  while ((streamMatch = streamRegex.exec(content)) !== null) {
    const rawStream = Buffer.from(streamMatch[1], "latin1");
    try {
      const decompressed = zlib.inflateSync(rawStream);
      const decompressedText = decompressed.toString("latin1");
      parsePdfTextOps(decompressedText);
      // Also extract printable sentences directly from decompressed text
      const cleanMatches = decompressedText.match(/[A-Za-z0-9\s.,!?:;@_#\-\/]{4,}/g) || [];
      for (const m of cleanMatches) {
        const tr = m.trim();
        if (tr.length > 3 && !tr.includes("obj") && !tr.includes("endobj")) {
          textBlocks.push(tr);
        }
      }
    } catch {
      // Stream is not zlib or is an image/font stream; continue
    }
    if (textBlocks.length > 5000) break;
  }

  const extracted = Array.from(new Set(textBlocks)).join(" ").replace(/\s+/g, " ").trim();
  return extracted.length > 20 ? extracted.slice(0, 80000) : extractPrintableStrings(buffer);
}

/**
 * Extracts readable string words from raw binary buffers
 */
function extractPrintableStrings(buffer: Buffer): string {
  const str = buffer.toString("latin1");
  const matches = str.match(/[A-Za-z0-9\s.,!?:;@_#\-\/]{4,}/g) || [];
  return matches
    .filter((w) => w.trim().length > 3)
    .slice(0, 1000)
    .join(" ")
    .slice(0, 40000);
}
