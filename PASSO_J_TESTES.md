# PASSO J — Checklist de Testes Guiados (Runtime da Política de UX)

## Objetivo
Validar que o PASSO I (Runtime da Política de UX) funciona corretamente para cada nível de severidade (ALTA, MEDIA, BAIXA).

## Pré-requisitos
- Servidor DEV rodando: `npm run dev`
- Navegador aberto no ambiente de desenvolvimento
- Ter um PDF qualquer para upload (não precisa ser específico, pois usaremos modo de teste)

---

## Checklist de Testes Manual

### Teste A: ALTA — textoInsuficiente (Modal BLOCK)

**Cenário:** PDF com texto insuficiente deve bloquear o fluxo e exibir modal bloqueante.

**Como reproduzir:**
1. Faça upload de qualquer PDF na página `/upload`
2. Quando redirecionar para `/processamento`, adicione `?gc_test=alta` na URL
   - URL completa: `http://localhost:5173/processamento?gc_test=alta`
3. Aguarde o processamento completar

**Resultado esperado:**
- ✅ Modal bloqueante aparece (overlay escuro)
- ✅ Título: "Conteúdo insuficiente para extração"
- ✅ Mensagem contém: "Não deu para extrair o Anexo II com segurança"
- ✅ Botão primário: "Enviar outro PDF"
- ✅ Botão secundário: "Tentar novamente"
- ✅ Seção "Como resolver" presente com 3 dicas
- ✅ **NÃO salva** o edital (permanece na tela de processamento)
- ✅ Console do navegador mostra: `[PASSO J] Modo de teste ativado: ALTA`

**Ações de validação:**
- Clicar em "Enviar outro PDF" → deve redirecionar para `/upload`
- Clicar em "Tentar novamente" → deve recarregar a página
- Verificar que edital não foi salvo no store

---

### Teste B: MEDIA — densidadeBaixa (Modal CONFIRM)

**Cenário:** PDF com densidade baixa deve pedir confirmação e permitir continuar.

**Como reproduzir:**
1. Faça upload de qualquer PDF na página `/upload`
2. Quando redirecionar para `/processamento`, adicione `?gc_test=media` na URL
   - URL completa: `http://localhost:5173/processamento?gc_test=media`
3. Aguarde o processamento completar

**Resultado esperado:**
- ✅ Modal de confirmação aparece (overlay escuro)
- ✅ Título: "Qualidade do texto está ruim"
- ✅ Mensagem contém: "Posso continuar, mas o resultado pode ficar incompleto"
- ✅ Botão primário: "Continuar mesmo assim"
- ✅ Botão secundário: "Trocar PDF"
- ✅ **NÃO salva** o edital até confirmação do usuário
- ✅ Console do navegador mostra: `[PASSO J] Modo de teste ativado: MEDIA`

**Ações de validação:**
- Clicar em "Continuar mesmo assim" → deve salvar edital e redirecionar para `/edital/:id`
- Clicar em "Trocar PDF" → deve redirecionar para `/upload`
- Verificar que edital só é salvo após clicar em "Continuar mesmo assim"

---

### Teste C: BAIXA — ruidoRepetitivo (Banner INFO)

**Cenário:** PDF com ruído repetitivo deve apenas informar com banner leve.

**Como reproduzir:**
1. Faça upload de qualquer PDF na página `/upload`
2. Quando redirecionar para `/processamento`, adicione `?gc_test=baixa` na URL
   - URL completa: `http://localhost:5173/processamento?gc_test=baixa`
3. Aguarde o processamento completar

**Resultado esperado:**
- ✅ Banner aparece no topo da página (não é modal)
- ✅ Ícone: ℹ️
- ✅ Título: "Encontrei pequenas inconsistências"
- ✅ Mensagem contém: "Encontrei pequenas inconsistências no texto, mas nada que impeça continuar"
- ✅ Botão: "Entendi"
- ✅ **NÃO salva** o edital até clicar em "Entendi"
- ✅ Console do navegador mostra: `[PASSO J] Modo de teste ativado: BAIXA`

**Ações de validação:**
- Clicar em "Entendi" → deve salvar edital e redirecionar para `/edital/:id`
- Banner não deve bloquear a visualização (é leve, no topo)
- Verificar que edital só é salvo após clicar em "Entendi"

---

## Validações Adicionais

### ✅ Produção não foi afetada
- Modo de teste só funciona em `import.meta.env.DEV === true`
- Querystring `?gc_test=*` é ignorado em produção
- Sem querystring, comportamento normal (usa diagnóstico real do PDF)

### ✅ Logs DEV-only
- Console mostra `[PASSO J] Modo de teste ativado: [NIVEL]` quando modo de teste está ativo
- Logs aparecem apenas em desenvolvimento

### ✅ Integração com PASSO I
- Todos os testes usam `buildGcUxDecision()` da política de UX
- Mensagens seguem tabela oficial do PASSO H (H4)
- Comportamento segue regras de severidade do PASSO H (H2, H3)

---

## URLs de Teste Rápido

Copie e cole após fazer upload:

- **ALTA:** `http://localhost:5173/processamento?gc_test=alta`
- **MEDIA:** `http://localhost:5173/processamento?gc_test=media`
- **BAIXA:** `http://localhost:5173/processamento?gc_test=baixa`

---

## Observações

- O modo de teste sobrescreve apenas o `diagnosticoPdf` no `debugInfo`
- O PDF real ainda é processado normalmente (parser, pipeline, etc)
- O modo de teste não afeta a persistência ou stores
- Ideal para testar UI sem depender de PDFs específicos com problemas reais












