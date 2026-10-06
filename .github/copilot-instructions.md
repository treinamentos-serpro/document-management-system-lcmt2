# Instruções do projeto - Document Management System (DMS)

Estas instruções são aplicadas automaticamente pelo GitHub Copilot em todas as
interações neste repositório. Use-as como contexto de engenharia para gerar
código consistente com a arquitetura e as convenções do projeto.

## Visão geral

Sistema web para gestão de documentos com:

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário

## Referência de comportamento

- Consulte [docs/specs/dms-spec.md](../docs/specs/dms-spec.md) para requisitos, contratos HTTP e critérios de aceite.
- A especificação é o comportamento-alvo; confira o código e os testes antes de assumir que um requisito já está implementado.
- Se especificação, implementação e testes divergirem, descreva a divergência e mantenha a mudança solicitada dentro do escopo.
- `X-User-Id` identifica o escopo lógico do usuário, mas não é autenticação nem uma fronteira de segurança.

- O backend usa `backend/src/app.js` para compor a aplicação e `backend/test/` para testes HTTP e de integração.
- Gere nomes físicos no servidor e não exponha caminhos locais nas respostas públicas.
- Use a especificação para requisitos de isolamento por usuário, limite de upload e tratamento de falhas; não presuma que já estejam cobertos pelos testes atuais.

## Stack

- Backend: Node.js + Express (CommonJS)
- Frontend: React + Vite (ESM)
- Testes backend: runner nativo do Node (`node:test`)
- Sem TypeScript nesta fase (JavaScript puro)

## Princípios obrigatórios

- SOLID, DRY, KISS, YAGNI
- 12-Factor App (configuração via variáveis de ambiente)
- Código legível tem prioridade sobre código complexo
- Sem overengineering e sem abstrações desnecessárias

## Arquitetura do backend (Clean Architecture simples)

Separe responsabilidades em quatro camadas dentro de `backend/src`:

- `routes/`: definem os endpoints e delegam para os controllers
- `controllers/`: tratam entrada/saída HTTP e validação básica
- `services/`: concentram as regras de negócio
- `repositories/`: cuidam da persistência

Fluxo de dependência: `routes -> controllers -> services -> repositories`.
Camadas internas não conhecem camadas externas.

## Endpoints previstos

- `POST /upload` - envia um documento
- `GET /documents` - lista os documentos
- `GET /documents/:id/download` - baixa um documento

## Armazenamento (restrição importante)

- Os arquivos enviados são gravados no filesystem local da aplicação, na pasta
  `backend/storage`, utilizando `multer` com `diskStorage`.
- Os metadados dos documentos (id, nome original, tamanho, data, dono) ficam em
  memória nesta fase inicial.
- Não utilize provedores de armazenamento externos ou serviços de upload de
  terceiros. O armazenamento é estritamente local à aplicação.

## Convenções do frontend

- Componentes funcionais com React Hooks
- Organização baseada em componentes: `components/`, `pages/`, `services/`
- A comunicação com o backend é feita via `fetch`, através do prefixo `/api`
  (proxy configurado no Vite)
- Reutilize componentes e evite duplicação
- Os testes de API do frontend ficam em `frontend/test/`; preserve `AbortSignal`, trate respostas HTTP não-2xx e não defina manualmente `Content-Type` ao enviar `FormData`.

## Comandos

Não há scripts na raiz; execute os comandos no pacote correspondente.

- Backend: em `backend/`, `npm install`, `npm test` ou `npm run dev`.
- Frontend: em `frontend/`, `npm install`, `node --test`, `npm run build` ou `npm run dev`.
- O frontend exige Node.js 24 ou superior. Atualmente, seu `package.json` não define um script `test`.

## Estilo de código

- Nomes descritivos em inglês para símbolos de código
- Mensagens ao usuário e comentários em português
- Funções pequenas e com responsabilidade única
- Trate erros nos limites do sistema (entrada HTTP, leitura/escrita de arquivos)

## Restrições gerais

- Não quebrar funcionalidades existentes
- Manter o seed simples e evolutivo
- Preferir dependências já presentes no `package.json`
