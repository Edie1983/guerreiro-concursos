# Ferramentas DEV - Guerreiro Concursos

Ferramentas de desenvolvimento para validação e testes.

## Suíte de Compatibilidade de PDFs

### Runner de PDFs (`runPdfSuite.ts`)

Runner DEV-only para testar compatibilidade de múltiplos PDFs e gerar relatório consolidado.

#### Como usar

1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Abra o console do navegador (F12)** em `http://localhost:5173`

3. **Execute o runner:**
   ```javascript
   // Opção 1: Seletor de arquivos
   const input = document.createElement('input');
   input.type = 'file';
   input.multiple = true;
   input.accept = '.pdf';
   input.onchange = (e) => {
     const files = Array.from((e.target as HTMLInputElement).files || []);
     window.runPdfSuite(files);
   };
   input.click();

   // Opção 2: Se já tiver File objects
   window.runPdfSuite([file1, file2, file3]);
   ```

#### Relatório gerado

O runner imprime uma tabela no console com:
- **Arquivo**: Nome do PDF
- **Tamanho Orig/Proc**: Tamanho antes/depois do pré-processamento
- **ANEXO II (Antes/Depois)**: Ocorrências detectadas
- **ANEXO II OK**: Se foi encontrado pelo parser
- **Disc. Detect**: Número de disciplinas detectadas
- **Tópicos**: Total de tópicos extraídos
- **Headings Quebrados**: Flag se ANEXO II ok mas disciplinas <= 1
- **Provável Escaneado**: Flag se texto muito pequeno sem ANEXO II

#### Exemplo de saída

```
========================================================================================================================
RELATÓRIO DE COMPATIBILIDADE - SUÍTE DE PDFs
========================================================================================================================
Arquivo                         | Tamanho Orig | Tamanho Proc | ANEXO II (Antes) | ANEXO II (Depois) | ANEXO II OK | Disc. Detect | Tópicos | Headings Quebrados | Provável Escaneado
------------------------------------------------------------------------------------------------------------------------
IBGE_APM_2025_04_Edital.pdf     |       45,234 |       44,890 |                1 |                  1 |          ✓ |            5 |     120 |                  — |                  —
BB_2022_01_Edital.pdf            |       52,100 |       51,800 |                1 |                  1 |          ✓ |            1 |      45 |                  ✓ |                  —
Petrobras_PSP_Edital.pdf         |          890 |          890 |                0 |                  0 |          — |            0 |       0 |                  — |                  ✓
========================================================================================================================

RESUMO:
  Total processado: 3
  ANEXO II encontrado: 2/3
  Disciplinas > 1: 1/3
  Headings quebrados: 1
  Provável escaneado: 1
```

### Fixtures de PDFs

PDFs de teste devem ser colocados em `src/dev/fixtures/pdfs/` (não commitado no git).

Veja `src/dev/fixtures/README.md` para mais detalhes.






