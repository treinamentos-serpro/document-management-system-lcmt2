---
description: Audita um fluxo do DMS comparando a especificação, a implementação e os testes, sem editar arquivos.
name: validar-fluxo-dms
argument-hint: fluxo a verificar (upload, listagem ou download)
agent: agent
---

# Validar fluxo do DMS

Audite o fluxo `${input:fluxo:upload, listagem ou download}` sem alterar arquivos.

1. Consulte `docs/specs/dms-spec.md` e identifique requisitos, contratos e critérios de aceite relevantes.
2. Siga o fluxo pela implementação existente: rota e controller, service e repository, cliente de API e componentes afetados.
3. Compare o comportamento implementado e os testes com a especificação. Não considere um requisito implementado apenas por estar documentado, nem assuma que testes existentes cobrem todos os critérios.
4. Execute os testes existentes mais relevantes usando os comandos definidos nos pacotes. Não instale dependências nem altere arquivos.
5. Apresente achados priorizados com evidência e caminho do arquivo; diferencie falhas confirmadas, requisitos ausentes e cobertura de teste insuficiente.

Considere que `X-User-Id` é somente identificação lógica, não autenticação. Verifique também erros, respostas HTTP e proteção dos caminhos locais quando forem pertinentes ao fluxo.