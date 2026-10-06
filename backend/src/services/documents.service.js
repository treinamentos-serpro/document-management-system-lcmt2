const { randomUUID } = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

function toPublicDocument(document) {
  const { storagePath, ...publicDocument } = document;
  return publicDocument;
}

function saveUploadedFile(file, owner) {
  const document = documentsRepository.save({
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  });

  return toPublicDocument(document);
}

function listDocuments() {
  return documentsRepository.findAll().map(toPublicDocument);
}

function findDocumentForDownload(id) {
  const document = documentsRepository.findById(id);

  if (!document) {
    return null;
  }

  return {
    filePath: document.storagePath,
    originalName: document.originalName,
  };
}

module.exports = { saveUploadedFile, listDocuments, findDocumentForDownload };