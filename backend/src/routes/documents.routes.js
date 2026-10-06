const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../storage'),
  filename: (req, file, callback) => {
    callback(null, `${randomUUID()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), documentsController.uploadDocument);
router.get('/documents', documentsController.listDocuments);
router.get('/documents/:id/download', documentsController.downloadDocument);

module.exports = router;