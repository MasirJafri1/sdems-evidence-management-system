import multer from "multer";
import os from "os";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB limit for evidence files

export const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      cb(null, `sih-upload-${uniqueSuffix}-${safeName}`);
    }
  }),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (_req, _file, callback) => {
    // Allow all file types (video, audio, text, pdf, image, zip, tar, raw forensic images, etc.)
    callback(null, true);
  }
});
