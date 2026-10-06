const documentsService = require('../services/documents.service');

function uploadDocument(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'O arquivo é obrigatório.' });
  }

  try {
    const owner = req.get('x-user-id') || 'anonymous';
    const document = documentsService.saveUploadedFile(req.file, owner);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function listDocuments(req, res, next) {
  try {
    return res.json(documentsService.listDocuments());
  } catch (error) {
    return next(error);
  }
}

function downloadDocument(req, res, next) {
  try {
    const document = documentsService.findDocumentForDownload(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    return res.download(document.filePath, document.originalName, (error) => {
      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { uploadDocument, listDocuments, downloadDocument };