import { useState } from 'react';
import { uploadDocument } from '../services/documents.api';

export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    const form = event.currentTarget;
    setIsUploading(true);
    setError('');
    setMessage('');

    try {
      const document = await uploadDocument(file);
      onUpload(document);
      form.reset();
      setFile(null);
      setMessage('Documento enviado com sucesso.');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar documento</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="document-file">Arquivo</label>
        <div className="upload-controls">
          <input
            id="document-file"
            name="file"
            type="file"
            required
            disabled={isUploading}
            onChange={(event) => {
              setFile(event.target.files[0] || null);
              setError('');
              setMessage('');
            }}
          />
          <button type="submit" disabled={!file || isUploading}>
            {isUploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success" role="status">{message}</p>}
    </section>
  );
}