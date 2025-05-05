const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const importController = require('../ImportScenario/scenarioImportController');

const router = express.Router();

const uploadsPath = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (req, file, cb) => {
  const isValid = path.extname(file.originalname).toLowerCase() === '.yaml';
  cb(null, isValid);
};

const upload = multer({ storage, fileFilter });

router.post('/import-scenario', upload.single('scenario'), importController.importScenario);

module.exports = router;
