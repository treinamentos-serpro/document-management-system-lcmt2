# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para que usuários enviem, consultem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um arquivo por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de um documento pelo identificador, limitado ao usuário associado.
- Interface web para upload, listagem, estado vazio, erros e download.
- Identificação simples do usuário por `X-User-Id`, sem autenticação nesta fase.
- Arquivos armazenados localmente em `backend/storage`, usando Multer com `diskStorage`.
- Metadados mantidos em memória durante a execução do processo.

### Fora do escopo

- Banco de dados, persistência durável de metadados ou recuperação destes após reinício.
- Provedores de armazenamento externos, nuvem ou serviços de upload de terceiros.
- Autenticação, autorização robusta, cadastro de usuários ou gerenciamento de credenciais.
- Versionamento, edição, exclusão, busca, compartilhamento ou organização em pastas.
- Upload múltiplo e processamento ou pré-visualização do conteúdo dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário pode enviar um documento por vez. | A API recebe `multipart/form-data` no campo `file`, armazena o conteúdo localmente e retorna os metadados criados. |
| RF-02 | Cada documento é associado a um usuário. | O backend exige `X-User-Id` não vazio e registra seu valor como `owner`; o cliente não pode definir o dono pelo corpo do upload. |
| RF-03 | O usuário pode listar seus documentos. | A listagem retorna somente documentos cujo `owner` corresponda ao `X-User-Id` da requisição. |
| RF-04 | O usuário pode baixar um documento pelo identificador. | O download entrega o arquivo como anexo somente se o documento existir e pertencer ao usuário informado. |
| RF-05 | O usuário recebe retorno claro para operações inválidas. | A API responde com status HTTP e corpo de erro padronizados para entrada inválida, arquivo ausente, documento inexistente e falha interna. |
| RF-06 | A interface permite enviar, listar e baixar documentos. | A interface apresenta estado de carregamento, lista ou estado vazio, confirmação/erro de upload e ação de download. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local em `backend/storage`, com `multer` e `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória e podem ser perdidos quando o processo reiniciar. |
| RNF-03 | A aplicação deve obter configurações operacionais de variáveis de ambiente, mantendo valores padrão locais quando apropriado (12-Factor). |
| RNF-04 | O nome físico do arquivo deve ser gerado pelo sistema, sem confiar em caminhos ou nomes de arquivo fornecidos pelo cliente. O nome original deve ser preservado apenas como metadado e usado com segurança no cabeçalho de download. |
| RNF-05 | O limite de tamanho de upload deve ser configurável por ambiente e aplicado pelo Multer. O valor padrão inicial é 10 MiB. |
| RNF-06 | A camada HTTP deve tratar erros de leitura e gravação sem expor caminhos locais, stack traces ou detalhes internos ao cliente. |
| RNF-07 | O backend deve usar Node.js, Express e CommonJS; o frontend deve usar React, Vite e módulos ES, sem TypeScript nesta fase. |
| RNF-08 | Testes de backend devem usar o runner nativo `node:test`. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único, gerado pelo servidor (UUID). |
| `originalName` | string | Sim | Nome original informado no upload; não é usado como caminho físico. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data/hora de recebimento em ISO 8601. |
| `owner` | string | Sim | Valor de `X-User-Id` usado para associar o documento ao usuário. |
| `mimeType` | string | Sim | Tipo MIME informado/detectado pelo middleware de upload. |

### Dados internos de armazenamento

O repositório mantém, além dos metadados públicos, o nome físico gerado para o arquivo (por exemplo, `storageName`) ou a referência necessária para localizá-lo dentro do diretório configurado. Caminhos físicos não devem ser enviados nas respostas da API. A associação entre metadados e arquivo é feita pelo `id` gerado no servidor.

Os metadados são mantidos em uma estrutura em memória no repositório. Após reinicialização, os arquivos existentes podem permanecer em `backend/storage`, mas não estarão listáveis ou baixáveis sem metadados; limpeza/recuperação de arquivos órfãos não faz parte desta versão.

## 6. Contratos de API

### Convenções

- Rotas do Express: `/upload`, `/documents` e `/documents/:id/download`.
- O frontend chama essas rotas pelo prefixo `/api`; o proxy do Vite remove `/api` antes de encaminhar ao backend.
- Todas as rotas de documentos exigem o cabeçalho `X-User-Id` com valor não vazio. Esse valor identifica o escopo lógico dos documentos, mas não comprova a identidade do solicitante.
- Respostas JSON usam `Content-Type: application/json; charset=utf-8`. Downloads usam `Content-Disposition: attachment` e o tipo MIME do documento.
- Formato de erro: `{ "error": { "code": "CODIGO", "message": "Descrição" } }`.

### `POST /upload`

- Cabeçalho: `X-User-Id: <identificador>`.
- Entrada: `multipart/form-data`, campo obrigatório `file`, contendo um único arquivo.
- O tamanho máximo padrão é 10 MiB; o limite é configurável. Não há lista de extensões permitidas nesta versão, mas o servidor não deve executar nem interpretar o conteúdo enviado.
- Sucesso: `201 Created`, com o objeto de metadados públicos do documento em JSON.
- Erros: `400` para campo de arquivo ausente ou requisição inválida; `413` para arquivo acima do limite; `400` para ausência de `X-User-Id`; `500` para falha inesperada de armazenamento. Se o registro dos metadados falhar após gravar o arquivo, o fluxo deve tentar remover o arquivo recém-criado.

### `GET /documents`

- Cabeçalho: `X-User-Id: <identificador>`.
- Saída de sucesso: `200 OK`, array JSON de metadados públicos pertencentes ao usuário. Retorna `[]` quando não houver documentos.
- Erros: `400` para ausência ou valor vazio de `X-User-Id`; `500` para falha inesperada.

### `GET /documents/:id/download`

- Cabeçalho: `X-User-Id: <identificador>`.
- Saída de sucesso: `200 OK`, conteúdo binário do arquivo, `Content-Type` apropriado e `Content-Disposition: attachment` com o nome original tratado com segurança.
- Erros: `400` para ausência ou valor vazio de `X-User-Id`; `404` se o documento não existir, não pertencer ao usuário ou se o arquivo não estiver disponível. A resposta não deve revelar qual dessas condições ocorreu; `500` para falha inesperada de leitura.

## 7. Decisões arquiteturais

### Backend

O fluxo de dependência deve permanecer `routes -> controllers -> services -> repositories`:

- `routes/`: declara endpoints e conecta middleware e controllers. O middleware Multer configura `diskStorage`, limite de tamanho e os campos de upload.
- `controllers/`: lê parâmetros, cabeçalhos e arquivo recebido; valida a entrada HTTP; chama o service e traduz resultados para status, cabeçalhos e respostas HTTP.
- `services/`: implementa regras de negócio, incluindo associação ao usuário, listagem por dono e autorização lógica do download.
- `repositories/`: mantém os metadados em memória e fornece operações para localizar/ler arquivos dentro do diretório local.
- Camadas internas não devem depender de Express ou de detalhes de transporte HTTP. A configuração de diretório, porta e limite deve vir de variáveis de ambiente com padrões documentados.

### Frontend

- Componentes funcionais com React Hooks, organizados em `components/`, `pages/` e `services/`.
- Serviço de API usa `fetch` com caminhos iniciados em `/api` e trata status não-2xx.
- A interface envia o cabeçalho `X-User-Id` configurado para a sessão simples local. Como não há autenticação nesta versão, isso é apenas identificação de conveniência e não uma fronteira de segurança.
- Mensagens visíveis ao usuário e comentários devem ser escritos em português; nomes de símbolos de código devem permanecer em inglês.

### Identidade e segurança

`X-User-Id` é uma decisão explícita para viabilizar o requisito de associação por usuário sem introduzir autenticação. Qualquer cliente pode escolher esse valor; portanto, a filtragem por dono evita acesso acidental entre usuários de interface, mas não constitui autorização segura. A adoção de autenticação deverá substituir a origem desse identificador antes de uso multiusuário em produção.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro. Nesta entrega, executar somente a criação deste documento; não implementar arquivos de backend ou frontend.

1. **Fundação do backend:** definir configuração por ambiente, diretório local, limite de upload, middleware Multer com `diskStorage` e repositório em memória; cobrir operações básicas com testes unitários.
2. **API e regras de negócio:** implementar services, controllers e routes para upload, listagem por `owner` e download; padronizar erros e adicionar testes HTTP para sucesso, validação, isolamento entre usuários e arquivo ausente.
3. **Interface React:** criar serviço `fetch`, componentes de upload, lista e download, estados de carregamento/vazio/erro e identificação simples por usuário.
4. **Integração e validação:** validar o fluxo pelo proxy `/api`, executar a suíte `node --test` e o build do frontend; conferir limite de tamanho, persistência local de arquivos e perda esperada dos metadados após reinício.

## 9. Critérios gerais de aceite

- O único artefato desta etapa é `docs/specs/dms-spec.md`.
- A especificação descreve de forma consistente os requisitos, os dados, os contratos HTTP, as decisões de arquitetura e as etapas de implementação.
- Nenhum requisito permite armazenamento fora do filesystem local ou persistência durável de metadados nesta fase.
- Nenhum arquivo de aplicação do backend ou frontend é criado ou alterado nesta etapa.