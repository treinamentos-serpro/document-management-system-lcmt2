import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documents.api';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    async function loadDocuments() {
      try {
        const documents = await listDocuments(controller.signal);
        if (!controller.signal.aborted) setDocuments(documents);
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [refreshKey]);

  function handleUpload() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <main className="app">
      <header className="app-header">
        <p className="app-brand">DMS</p>
        <h1>Gestão de documentos</h1>
      </header>
      <UploadComponent onUpload={handleUpload} />
      <DocumentList
        documents={documents}
        isLoading={isLoading}
        error={error}
        onRetry={handleUpload}
      />
    </main>
  );
}
