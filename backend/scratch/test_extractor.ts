import { extractTextFromFile } from "../src/modules/search/extractor.service";
import path from "path";

async function main() {
  const pdfPath = `C:\\Users\\sarim\\.gemini\\antigravity-ide\\brain\\fc62a8d6-c66c-47b3-8647-a46c889647b7\\.user_uploaded\\media_1790440723092.pdf`;
  const result = await extractTextFromFile(pdfPath, "application/pdf", "media_1790440723092.pdf");
  console.log("=== EXTRACTED TEXT RESULT ===");
  console.log("Length:", result.length);
  console.log("Preview:", result.slice(0, 500));
}

main().catch(console.error);
