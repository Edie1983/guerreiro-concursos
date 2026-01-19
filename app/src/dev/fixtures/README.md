# Fixtures de PDFs para Testes DEV

Esta pasta contém PDFs de teste para validação de compatibilidade do parser.

## Estrutura

```
src/dev/fixtures/pdfs/
  ├── ibge_apm_2025_04_APM_Edital.pdf  (controle - deve funcionar)
  ├── bb_2022_01_Edital-banco-do-Brasil.pdf
  └── petrobras_psp_Ed_1_Petrobras_PSP_23_2_abertura.pdf
```

## Convenção de Nomes

- `{orgao}_{ano}_{descricao}.pdf`
- Exemplos:
  - `ibge_apm_2025_04_APM_Edital.pdf`
  - `bb_2022_01_Edital-banco-do-Brasil.pdf`
  - `petrobras_psp_Ed_1_Petrobras_PSP_23_2_abertura.pdf`

## Uso

Os PDFs nesta pasta são usados pelo runner DEV (`src/dev/runPdfSuite.ts`) para:
- Validar zero regressão (IBGE)
- Testar melhorias de compatibilidade (BB)
- Diagnosticar PDFs escaneados (Petrobras)

## Nota

Esta pasta não é commitada no git (deve estar no `.gitignore`).






