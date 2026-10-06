import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { listDocuments, uploadDocument, downloadDocument } from '../src/services/documents.api.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('lista documentos via /api e encaminha o sinal de cancelamento', async () => {
  const documents = [{ id: 'document-1', originalName: 'arquivo.txt' }];
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.signal, controller.signal);
    return Response.json(documents);
  };
  assert.deepEqual(await listDocuments(controller.signal), documents);
});

test('envia o arquivo como multipart sem definir Content-Type manualmente', async () => {
  const file = new File(['conteudo'], 'arquivo.txt', { type: 'text/plain' });
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers, undefined);
    assert.equal(options.body.get('file').name, file.name);
    assert.equal(await options.body.get('file').text(), 'conteudo');
    return Response.json({ id: 'document-1' }, { status: 201 });
  };
  assert.deepEqual(await uploadDocument(file), { id: 'document-1' });
});

test('baixa o conteúdo binário e codifica o id na URL', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, '/api/documents/id%2Fcom%20espaco/download');
    return new Response(new Uint8Array([0, 128, 255]));
  };
  const blob = await downloadDocument('id/com espaco');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array([0, 128, 255]));
});

test('preserva mensagens de erro do backend', async () => {
  globalThis.fetch = async () => Response.json({ error: 'Documento não encontrado.' }, { status: 404 });
  await assert.rejects(downloadDocument('inexistente'), { message: 'Documento não encontrado.' });
});

test('trata erros HTTP sem JSON e falhas de rede', async () => {
  globalThis.fetch = async () => new Response('Bad Gateway', { status: 502 });
  await assert.rejects(listDocuments(), { message: 'Não foi possível concluir a operação.' });
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(listDocuments(), { message: 'Não foi possível conectar ao servidor. Tente novamente.' });
});

test('preserva cancelamento da requisição', async () => {
  globalThis.fetch = async () => { throw new DOMException('Cancelado', 'AbortError'); };
  await assert.rejects(listDocuments(), { name: 'AbortError' });
});