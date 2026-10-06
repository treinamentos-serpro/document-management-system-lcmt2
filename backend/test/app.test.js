const { test } = require('node:test');
const assert = require('node:assert');
const { once } = require('node:events');
const { readdir, unlink } = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('permite enviar, listar e baixar documentos', async () => {
  const storagePath = path.resolve(__dirname, '../storage');
  const filesBefore = new Set(await readdir(storagePath));
  const server = app.listen(0);
  await once(server, 'listening');

  try {
    const form = new FormData();
    form.append('file', new Blob(['arquivo de teste']), 'documento.txt');

    const uploadResponse = await fetch(`http://localhost:${server.address().port}/upload`, {
      method: 'POST',
      headers: { 'x-user-id': 'usuario-teste' },
      body: form,
    });
    assert.strictEqual(uploadResponse.status, 201);
    const document = await uploadResponse.json();
    assert.strictEqual(document.originalName, 'documento.txt');
    assert.strictEqual(document.owner, 'usuario-teste');
    assert.strictEqual('storagePath' in document, false);

    const listResponse = await fetch(`http://localhost:${server.address().port}/documents`);
    const listedDocuments = await listResponse.json();
    assert.ok(listedDocuments.some((item) => item.id === document.id));

    const downloadResponse = await fetch(
      `http://localhost:${server.address().port}/documents/${document.id}/download`,
    );
    assert.strictEqual(downloadResponse.status, 200);
    assert.strictEqual(await downloadResponse.text(), 'arquivo de teste');
  } finally {
    const filesAfter = await readdir(storagePath);
    const createdFiles = filesAfter.filter((file) => !filesBefore.has(file));
    await Promise.all(createdFiles.map((file) => unlink(path.join(storagePath, file))));
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
