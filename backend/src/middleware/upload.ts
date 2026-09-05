import multer from "multer";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB limit for evidence files

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (_req, _file, callback) => {
    // Allow all file types (video, audio, text, pdf, image, zip, tar, raw forensic images, etc.)
    callback(null, true);
  }
});
