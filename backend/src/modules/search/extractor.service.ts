import fs from "fs";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";

// pdf-parse is required dynamically inside extractTextFromFile to prevent serverless DOMMatrix crash

/**
 * Sanitizes raw extracted text by stripping out raw PDF operators, structural object keywords, and font coordinate streams
 */
function sanitizeExtractedText(text: string): string {
  if (!text) return "";

  let cleaned = text
    // Remove PDF structural object tags & headers (PDF-1.3, 1 0 R, 4 0 obj, MediaBox, endobj, endstream, etc.)
    .replace(/PDF-\d+\.\d+/gi, " ")
    .replace(/\b\d+\s+\d+\s+(R|obj)\b/gi, " ")
    .replace(/\b(endobj|endstream|MediaBox|CropBox|Resources|Parent|Type|Page|Pages|Length|Catalog|Outlines)\b/gi, " ")
    .replace(/\/Type\s*\/[A-Za-z0-9]+/gi, " ")
    // Remove font reference identifiers (e.g. /F1, /F2, /F15, /Helvetica)
    .replace(/\/[A-Za-z0-9_\-]+/g, " ")
    // Remove signed/unsigned floating point coordinates (e.g. 722.8348818897637784, 595.2799999999999727, -5.6692913385826778)
    .replace(/-?\b\d+\.\d+\b/g, " ")
    // Remove PDF text/graphics operators and font parameters (BT, ET, Tf, TL, Td, TD, Tm, T*, rg, RG, re, cm, Tj, TJ, re f, etc.)
    .replace(/\b(BT|ET|Tf|TL|Td|TD|Tm|T\*|rg|RG|re|cm|Tj|TJ|re\s+f)\b/gi, " ")
    // Remove single character vector drawing operators (m, l, c, v, y, h, W, n, q, Q) when isolated by space/start/end
    .replace(/(?:^|\s)[a-z]\b/gi, " ")
    // Remove standalone single character or repeating character noise
    .replace(/(?:\b[A-Za-z0-9]\b\s*){3,}/g, " ")
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

/**
 * Robust Text Extractor for In-File Document Search & Indexing
 * Supports:
 * - Plain text, Markdown, CSV, JSON, Log files (.txt, .md, .csv, .json, .log, .xml, .html)
 * - PDF documents (via pdf-parse + PDF stream sanitizer)
 * - Word documents (.docx, .doc via mammoth)
 * - Images (.jpg, .jpeg, .png, .bmp, .tiff via tesseract.js OCR)
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
      return sanitizeExtractedText(buffer.toString("utf8")).slice(0, 100000);
    }

    // 2. PDF Documents via pdf-parse
    if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
      try {
        if (typeof (globalThis as any).DOMMatrix === "undefined") {
          (globalThis as any).DOMMatrix = class DOMMatrix {};
        }
        const pdfModule = require("pdf-parse");
        const parseFn = typeof pdfModule === "function" ? pdfModule : pdfModule.default || pdfModule.PDFParse;
        if (typeof parseFn === "function") {
          const parsed = await parseFn(buffer);
          if (parsed && parsed.text && parsed.text.trim().length > 0) {
            const sanitized = sanitizeExtractedText(parsed.text);
            if (sanitized.length > 0) {
              return sanitized.slice(0, 100000);
            }
          }
        }
      } catch (err: any) {
        console.warn("[TextExtractor] pdf-parse failed, falling back to raw extractor:", err.message);
      }
      return extractPrintableStrings(buffer);
    }

    // 3. Word Documents (.docx, .doc) via mammoth
    if (
      lowerMime.includes("wordprocessingml") ||
      lowerMime.includes("msword") ||
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc")
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        if (result && result.value && result.value.trim().length > 0) {
          return sanitizeExtractedText(result.value).slice(0, 100000);
        }
      } catch (err: any) {
        console.warn("[TextExtractor] mammoth failed for docx:", err.message);
      }
      return extractPrintableStrings(buffer);
    }

    // 4. Images (.png, .jpg, .jpeg, .bmp, .tiff, .webp) via Tesseract OCR
    if (
      lowerMime.includes("image") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".bmp") ||
      lowerName.endsWith(".webp")
    ) {
      try {
        const worker = await createWorker("eng");
        const ret = await worker.recognize(buffer);
        await worker.terminate();
        if (ret && ret.data && ret.data.text) {
          return sanitizeExtractedText(ret.data.text).slice(0, 100000);
        }
      } catch (err: any) {
        console.warn("[TextExtractor] Tesseract OCR failed:", err.message);
      }
      return extractPrintableStrings(buffer);
    }

    // 5. Fallback: Extract readable ASCII/UTF-8 strings from binary file
    return extractPrintableStrings(buffer);
  } catch (err: any) {
    console.warn("[TextExtractor] Failed to extract text from file:", err.message);
    return "";
  }
}

/**
 * Extracts readable string words from raw binary buffers, filtering out PDF code operators
 */
function extractPrintableStrings(buffer: Buffer): string {
  const str = buffer.toString("utf8");
  const matches = str.match(/[A-Za-z][A-Za-z0-9\s.,!?:;@_#\-\/'"]{3,}/g) || [];
  
  const rawClean = matches
    .filter((w) => {
      const tr = w.trim();
      if (tr.includes("/F") || tr.includes("Tf") || tr.includes("TL") || tr.includes("Td") || tr.includes("re f") || tr.includes("endobj")) return false;
      return tr.length > 3 && /[A-Za-z]/.test(tr);
    })
    .slice(0, 1000)
    .join(" ");

  return sanitizeExtractedText(rawClean).slice(0, 40000);
}
