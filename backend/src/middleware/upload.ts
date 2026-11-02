import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure directories exist
const uploadDirs = [
  path.join(__dirname, '../../uploads/videos'),
  path.join(__dirname, '../../uploads/thumbnails'),
  path.join(__dirname, '../../uploads/assignments'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = (folder: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(__dirname, `../../uploads/${folder}`);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

export const uploadVideo = multer({
  storage: storage('videos'),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    const allowed = /mp4|mkv|webm|mov|avi/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Supported: mp4, mkv, webm, mov, avi'));
    }
  },
});

export const uploadThumbnail = multer({
  storage: storage('thumbnails'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|webp|svg/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Supported: jpg, jpeg, png, webp, svg'));
    }
  },
});

export const uploadAssignment = multer({
  storage: storage('assignments'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|zip|rar|doc|docx|txt|jpg|png/i;
    const ext = path.extname(file.originalname).slice(1);
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Supported: pdf, zip, doc, docx, txt, images'));
    }
  },
});
