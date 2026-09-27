import fs from "fs";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";

/**
 * Validates if extracted text is genuine non-empty text content.
 * Does NOT reject forensic identifiers (hashes, serial numbers, IP addresses, logs).
 */
export function isQualityText(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  const printable = trimmed.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  return printable.length >= 2;
}

/**
 * Sanitizes extracted text by normalizing control characters and excessive whitespace.
 * Preserves all forensic tokens: hashes, serial numbers, IP addresses, paths, timestamps, CVEs.
 */
export function sanitizeExtractedText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Helper to parse PDF buffer using pdf-parse with DOMMatrix polyfill
 */
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  if (typeof (globalThis as any).DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      multiply() { return this; }
      translate() { return this; }
      scale() { return this; }
      rotate() { return this; }
      inverse() { return this; }
      transformPoint(p: any) { return p; }
    };
  }

  const pdfModule = require("pdf-parse");

  // 1. pdf-parse v2 (Class constructor PDFParse)
  const PDFParseClass = pdfModule.PDFParse || (pdfModule.default && pdfModule.default.PDFParse);
  if (typeof PDFParseClass === "function" && PDFParseClass.prototype && typeof PDFParseClass.prototype.getText === "function") {
    const parser = new PDFParseClass({ data: buffer });
    try {
      const result = await parser.getText();
      if (parser.destroy && typeof parser.destroy === "function") {
        await parser.destroy().catch(() => {});
      }
      if (result && typeof result.text === "string" && result.text.trim().length > 0) {
        return result.text;
      }
    } catch (err: any) {
      console.warn("[TextExtractor] PDFParse v2 getText error:", err.message);
    }
  }

  // 2. pdf-parse v1 (Function export)
  const parseFn = typeof pdfModule === "function" ? pdfModule : (pdfModule.default && typeof pdfModule.default === "function" ? pdfModule.default : null);
  if (parseFn) {
    const parsed = await parseFn(buffer);
    if (parsed && typeof parsed.text === "string" && parsed.text.trim().length > 0) {
      return parsed.text;
    }
  }

  return "";
}

export interface ExtractionResult {
  text: string;
  method: string;
  charCount: number;
  wordCount: number;
  success: boolean;
}

/**
 * Text Extractor supporting: PDF, DOCX, TXT/Logs/JSON/CSV, and Images via OCR
 */
export async function extractTextFromFile(
  filePathOrBuffer: string | Buffer,
  mimeType?: string,
  fileName?: string
): Promise<string> {
  const result = await extractTextWithMetadata(filePathOrBuffer, mimeType, fileName);
  return result.text;
}

export async function extractTextWithMetadata(
  filePathOrBuffer: string | Buffer,
  mimeType?: string,
  fileName?: string
): Promise<ExtractionResult> {
  try {
    let buffer: Buffer;

    if (typeof filePathOrBuffer === "string") {
      if (!fs.existsSync(filePathOrBuffer)) {
        console.warn(`[TextExtractor] File not found at path: ${filePathOrBuffer}`);
        return { text: "", method: "file_not_found", charCount: 0, wordCount: 0, success: false };
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
      lowerName.endsWith(".log") ||
      lowerName.endsWith(".xml") ||
      lowerName.endsWith(".html")
    ) {
      const rawText = buffer.toString("utf8");
      const cleaned = sanitizeExtractedText(rawText).slice(0, 150000);
      const wordCount = cleaned ? cleaned.split(/\s+/).filter(Boolean).length : 0;
      console.log(`[TextExtractor] Plain text extraction: ${cleaned.length} chars, ${wordCount} words from "${fileName || "file"}"`);
      return {
        text: cleaned,
        method: "plain_text",
        charCount: cleaned.length,
        wordCount,
        success: isQualityText(cleaned)
      };
    }

    // 2. PDF Documents via pdf-parse
    if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
      try {
        const text = await parsePdfBuffer(buffer);
        if (text && text.trim().length > 0) {
          const cleaned = sanitizeExtractedText(text).slice(0, 150000);
          if (isQualityText(cleaned)) {
            const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
            console.log(`[TextExtractor] PDF pdf-parse extraction: ${cleaned.length} chars, ${wordCount} words from "${fileName || "file"}"`);
            return {
              text: cleaned,
              method: "pdf-parse",
              charCount: cleaned.length,
              wordCount,
              success: true
            };
          }
        }
      } catch (err: any) {
        console.warn("[TextExtractor] pdf-parse failed, attempting printable strings fallback:", err.message);
      }

      const fallbackText = extractPrintableStrings(buffer);
      const wordCount = fallbackText ? fallbackText.split(/\s+/).filter(Boolean).length : 0;
      console.log(`[TextExtractor] PDF fallback extraction: ${fallbackText.length} chars, ${wordCount} words`);
      return {
        text: fallbackText,
        method: "pdf-binary-fallback",
        charCount: fallbackText.length,
        wordCount,
        success: isQualityText(fallbackText)
      };
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
          const cleaned = sanitizeExtractedText(result.value).slice(0, 150000);
          if (isQualityText(cleaned)) {
            const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
            console.log(`[TextExtractor] DOCX mammoth extraction: ${cleaned.length} chars, ${wordCount} words from "${fileName || "file"}"`);
            return {
              text: cleaned,
              method: "docx-mammoth",
              charCount: cleaned.length,
              wordCount,
              success: true
            };
          }
        }
      } catch (err: any) {
        console.warn("[TextExtractor] mammoth failed for docx:", err.message);
      }

      const fallbackText = extractPrintableStrings(buffer);
      const wordCount = fallbackText ? fallbackText.split(/\s+/).filter(Boolean).length : 0;
      return {
        text: fallbackText,
        method: "docx-fallback",
        charCount: fallbackText.length,
        wordCount,
        success: isQualityText(fallbackText)
      };
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
          const cleaned = sanitizeExtractedText(ret.data.text).slice(0, 150000);
          if (isQualityText(cleaned)) {
            const wordCount = cleaned.split(/\s+/).filter(Boolean).length;
            console.log(`[TextExtractor] OCR Tesseract extraction: ${cleaned.length} chars, ${wordCount} words from "${fileName || "file"}"`);
            return {
              text: cleaned,
              method: "tesseract-ocr",
              charCount: cleaned.length,
              wordCount,
              success: true
            };
          }
        }
      } catch (err: any) {
        console.warn("[TextExtractor] Tesseract OCR failed:", err.message);
      }

      const fallbackText = extractPrintableStrings(buffer);
      const wordCount = fallbackText ? fallbackText.split(/\s+/).filter(Boolean).length : 0;
      return {
        text: fallbackText,
        method: "image-ocr-fallback",
        charCount: fallbackText.length,
        wordCount,
        success: isQualityText(fallbackText)
      };
    }

    // 5. Default Fallback
    const fallbackText = extractPrintableStrings(buffer);
    const wordCount = fallbackText ? fallbackText.split(/\s+/).filter(Boolean).length : 0;
    return {
      text: fallbackText,
      method: "binary-printable-strings",
      charCount: fallbackText.length,
      wordCount,
      success: isQualityText(fallbackText)
    };
  } catch (err: any) {
    console.warn("[TextExtractor] Extraction error:", err.message);
    return { text: "", method: "error", charCount: 0, wordCount: 0, success: false };
  }
}

function extractPrintableStrings(buffer: Buffer): string {
  let str = buffer.toString("utf8");
  str = str.replace(/stream[\s\S]*?endstream/g, " ");
  const matches = str.match(/[A-Za-z0-9\s.,!?:;@_#\-\/'"]{3,}/g) || [];
  const rawClean = matches.join(" ");
  return sanitizeExtractedText(rawClean).slice(0, 40000);
}
