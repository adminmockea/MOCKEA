import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure destination directories exist safely (Vercel serverless filesystem is read-only except /tmp)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const baseUploadDir = isServerless ? "/tmp/uploads" : path.join(process.cwd(), "uploads");

const uploadDir = baseUploadDir;
const resourcesDir = path.join(uploadDir, "resources");
const coversDir = path.join(uploadDir, "covers");

[uploadDir, resourcesDir, coversDir].forEach((dir) => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn(`[upload] Could not create directory ${dir}:`, err.message);
  }
});

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover") {
      cb(null, coversDir);
    } else {
      cb(null, resourcesDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

// File filter validation
const fileFilter = (req, file, cb) => {
  const allowedDocExts = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|epub|mp3|mp4)$/i;
  const allowedImgExts = /\.(png|jpg|jpeg|webp|gif|svg)$/i;

  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "cover") {
    if (allowedImgExts.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (.png, .jpg, .jpeg, .webp, .gif, .svg) are allowed for cover images!"));
    }
  } else {
    if (allowedDocExts.test(ext) || allowedImgExts.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Allowed formats: PDF, DOCX, XLSX, PPTX, TXT, ZIP, EPUB, MP3, MP4, images."));
    }
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max limit
  },
});

export default upload;
