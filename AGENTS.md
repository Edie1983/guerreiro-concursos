# GUERREIRO CONCURSOS — AGENT DIRECTIVES  
## Versão Atualizada — 100% Alinhada ao Projeto

## 1. REGRAS ABSOLUTAS
- Nunca restaurar, reintroduzir ou reutilizar a antiga landing page.
- Nunca mover, alterar ou importar CSS da landing para dentro do app.
- O app e a landing são totalmente independentes (isolamento completo).
- Nunca alterar estilos globais do app sem ordem explícita.
- Nunca substituir componentes do app sem comando direto.
- Não criar efeitos visuais não solicitados.
- Não inventar classes ou estruturas além do que for pedido.
- Obedecer exatamente o que o usuário solicitar, sem interpretação artística.

---

## 2. ESTRUTURA OFICIAL DO PROJETO

### 🔷 LANDING PAGE (PÚBLICA)
Diretório:
- `/landing/`  → arquivos-fonte da landing
- `/public/index.html`  → arquivo final servido
- `/public/landing-assets/` → CSS e mockups

Arquivos obrigatórios:
- `/landing/index.html`
- `/landing/style.css`
- `/landing/assets/logo.svg`
- `/landing/assets/mockups/*.png`

Mockups obrigatórios:
- mockup_hero_onboarding.png
- mockup_home_editais.png
- mockup_detalhes_edital.png
- mockup_mapa_tatico.png
- mockup_questoes_ia.png
- mockup_flashcards.png

A landing usa apenas:
- HTML puro
- CSS puro (style.css)
- Zero JavaScript
- Zero frameworks

O design deve seguir:
- Fundo azul profundo (#013455)
- Neon azul suave (text-shadow e box-shadow)
- Mockups SEM bordas, SEM caixas, SEM sombras retangulares
- Headline com neon
- Mockups próximos das headlines (sem grandes espaços)

---

## 3. APLICAÇÃO (APP)
Diretório:
- `/app/src/...`
Build:
- Gera saída em `/public/app/` via Vite.

Regra Visual do App:
- Usar o padrão oficial: gc-home, gc-card, gc-grid-3
- Página de planos SEMPRE usa 3 cards assim:
  [ PRO MENSAL ] [ FREE (CENTRO) ] [ PRO ANUAL ]
- Manter isolamento total da landing.

---

## 4. BUILD SYSTEM

Comandos oficiais:
- `npm run build:landing`
- `npm run build:app`
- `npm run build` (executa os dois)

Firebase:
- `/` → landing
- `/app/**` → SPA do app

---

## 5. QUANDO O USUÁRIO SOLICITAR ALTERAÇÕES

### 5.1 Alterações na landing  
O agente deve:
1. Modificar apenas `/landing/index.html` e `/landing/style.css`
2. Gerar nova versão em `/public/…`
3. Nunca tocar no app.

### 5.2 Alterações no app  
O agente deve:
1. Modificar apenas arquivos dentro de `/app/src/`
2. Nunca tocar na landing.

---

## 6. PADRÃO DE EXECUÇÃO DO AGENTE

Sempre seguir esta ordem:

1. Analisar o pedido do usuário com precisão textual.
2. Localizar o(s) arquivo(s) exato(s) a serem alterados.
3. Fazer diffs mínimos, cirúrgicos, claros.
4. Nunca modificar arquivos não envolvidos.
5. Explicar passo a passo o que foi feito.
6. Nunca ignorar mockups, classes ou estrutura informada.

---

## 7. OBJETIVO DO PROJETO

Entregar:

- Uma landing moderna, limpa, forte, com neon azul suave.
- Um app profissional, premium, consistente, sem bugs visuais.
- Navegação clara entre landing → login → app.

---

## 8. FRASE CHAVE DO PROJETO (para evitar interpretações erradas)

> “Simples, direto, fiel ao design, zero invenções.”

---

FIM DO DOCUMENTO
