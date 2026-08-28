import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// បម្រើ Static Files ចេញពី folder dist (Vite Build)
app.use(express.static(path.join(__dirname, 'dist')));

// បង្កើត និងបម្រើ Folder រូបភាព uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// រៀបចំ Multer សម្រាប់ Upload រូបភាពទំនិញ
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// API Endpoint សម្រាប់ទទួលការបញ្ចូលទំនិញ និងរូបភាព
app.post('/api/products', upload.single('image'), (req, res) => {
  try {
    const body = req.body || {};
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    return res.status(200).json({
      success: true,
      message: 'រក្សាទុកជោគជ័យ',
      data: { ...body, image: imageUrl }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// SPA Fallback: ឱ្យរាល់ Route រត់ទៅ index.html ក្នុង dist (ការពារកុំឱ្យ 404 ពេល Refresh)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`POS Server is running on port ${PORT}`);
});
