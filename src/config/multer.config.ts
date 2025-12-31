import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

const uploadRoot = join(process.cwd(), 'uploads');
const imageDir = join(uploadRoot, 'images');
const fileDir = join(uploadRoot, 'files');

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(imageDir);
ensureDir(fileDir);

export const mailMulterConfig = {
  storage: diskStorage({
    destination: (_req, file, cb) => {
      const isImage = file.mimetype.startsWith('image/');
      cb(null, isImage ? imageDir : fileDir);
    },
    filename: (_req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB
  },
};
