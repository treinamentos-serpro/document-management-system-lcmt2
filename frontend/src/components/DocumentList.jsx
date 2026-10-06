import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${sizeFormatter.format(size / 1024)} KB`;
  return `${sizeFormatter.format(size / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title" aria-busy={isLoading}>
      <div className="section-heading">
        <h2 id="documents-title">Documentos</h2>
        <span className="document-count">{documents.length}</span>
      </div>
      {isLoading && <p role="status">Carregando documentos...</p>}
      {error && (
        <div className="list-error">
          <p className="error" role="alert">{error}</p>
          <button className="secondary-button" type="button" onClick={onRetry} disabled={isLoading}>
            Tentar novamente
          </button>
        </div>
      )}
      {!isLoading && !error && documents.length === 0 && (
        <p className="empty-state">Nenhum documento encontrado.</p>
      )}
      {documents.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Enviado em</th>
                <th scope="col">Proprietário</th>
                <th scope="col">Download</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <th scope="row" className="document-name">{document.originalName}</th>
                  <td>{formatSize(document.size)}</td>
                  <td><time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time></td>
                  <td className="document-owner">{document.owner}</td>
                  <td><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}