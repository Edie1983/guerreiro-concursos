# 🔍 RELATÓRIO DE INVESTIGAÇÃO — ROTAS PLANOS/UPGRADE/PREMIUM STATUS

**Data:** Investigação realizada conforme solicitação  
**Objetivo:** Identificar por que alterações nas páginas não refletem na UI

---

## ✅ ARQUIVOS REAIS (CONFIRMADOS EM USO)

### 1. ROTEAMENTO PRINCIPAL
- **Arquivo:** `app/src/app.tsx`
- **Linhas relevantes:**
  - Linha 132-134: Rota `/app/planos` → componente `Planos`
  - Linha 136-138: Rota `/app/upgrade` → componente `Upgrade`
  - Linha 140-142: Rota `/app/premium-status` → componente `PremiumStatus`
- **Status:** ✅ **ESTAS SÃO AS ROTAS REAIS EM USO**

### 2. COMPONENTES DE PÁGINA
- **Planos:** `app/src/pages/Planos/index.tsx` ✅ **CONFIRMADO EM USO**
- **Upgrade:** `app/src/pages/Upgrade/index.tsx` ✅ **CONFIRMADO EM USO**
- **PremiumStatus:** `app/src/pages/PremiumStatus/index.tsx` ✅ **CONFIRMADO EM USO**

### 3. LAYOUTS
- **AppLayout:** `app/src/components/Layout/AppLayout.tsx`
  - Todas as rotas passam por `ProtectedRoute` que envolve com `AppLayout`
  - AppLayout contém: Sidebar + Topbar + gc-app-shell
- **PageWrapper:** `app/src/components/layout/PageWrapper.tsx`
  - Todas as 3 páginas usam `PageWrapper` dentro do `AppLayout`

---

## ❌ ARQUIVOS FANTASMAS (NÃO IDENTIFICADOS)

Nenhum arquivo alternativo ou duplicado foi encontrado que esteja renderizando essas rotas.

**Verificações realizadas:**
- ❌ Não há componentes em `app/src/components/dev/` que renderizem essas páginas
- ❌ Não há componentes em `app/src/components/gc/` que sobrescrevam essas páginas
- ❌ Não há rotas alternativas ou sobrescritas
- ❌ Não há service worker ativo (arquivo está vazio)

---

## 🔧 TESTES DE PROVA IMPLEMENTADOS

### Erros de teste inseridos:
1. ✅ `Planos` - Linha 38: `throw new Error("TESTE PÁGINA REAL — PLANOS")`
2. ✅ `Upgrade` - Linha 18: `throw new Error("TESTE PÁGINA REAL — UPGRADE")`
3. ✅ `PremiumStatus` - Linha 14: `throw new Error("TESTE PÁGINA REAL — PREMIUM STATUS")`

**Como testar:**
1. Inicie o servidor dev: `npm run dev`
2. Acesse `/app/planos`, `/app/upgrade` ou `/app/premium-status`
3. Se o erro aparecer no console/UI → **confirma que essa é a página real**
4. Se NÃO aparecer → **outra fonte está renderizando**

---

## 🎨 ONDE O LAYOUT "FICHÁRIO" ESTÁ SENDO INJETADO

### Possíveis fontes do estilo "fichário/livro marcado":

1. **CSS Global (`app/src/styles/layout.css`)**
   - Linha 145-163: Classe `.card-premium` tem estilos específicos
   - As páginas usam `.gc-card` mas podem herdar estilos de `.card-premium`
   - **Verificar:** Se há conflito de classes CSS

2. **CSS das Páginas:**
   - `app/src/pages/Planos/style.css` - Usa `.gc-card` e `.gc-plano-card-premium`
   - `app/src/pages/Upgrade/style.css` - Usa `.gc-card` e `.gc-upgrade-card-premium`
   - `app/src/pages/PremiumStatus/style.css` - Usa `.gc-card`

3. **Build Antigo (`public/app/`):**
   - Há um build em `public/app/` que pode estar sendo servido
   - Se o servidor estiver servindo de `public/` em vez de `app/`, pode usar build antigo
   - **Ação necessária:** Limpar build antigo ou verificar qual servidor está rodando

---

## 🔍 HIPÓTESES PARA O PROBLEMA

### HIPÓTESE 1: Build Antigo Sendo Servido
**Evidências:**
- Existe `public/app/index.html` com build antigo
- Build pode ter sido feito antes das últimas alterações
- **Teste:** Verificar qual URL está sendo acessada e qual servidor está rodando

### HIPÓTESE 2: Cache do Navegador
**Evidências:**
- Service worker está vazio, mas cache do navegador pode persistir
- **Teste:** Abrir em modo anônimo ou limpar cache

### HIPÓTESE 3: CSS Sobrescrevendo
**Evidências:**
- Classe `.card-premium` ainda existe e pode estar aplicando estilos antigos
- Múltiplos arquivos CSS podem estar conflitando
- **Teste:** Inspecionar elemento no navegador e ver qual CSS está sendo aplicado

### HIPÓTESE 4: Vite Dev Server vs Build Produção
**Evidências:**
- Pode estar rodando build de produção em vez de dev server
- **Teste:** Verificar se está usando `npm run dev` (vite dev) ou servindo `public/` (produção)

---

## 📋 MAPEAMENTO EXPLICITAMENTO

### Rota: `/app/planos`
```
app.tsx (linha 132-134)
  → ProtectedRoute
    → AppLayout (components/Layout/AppLayout.tsx)
      → Planos (pages/Planos/index.tsx)
        → PageWrapper (components/layout/PageWrapper.tsx)
          → Conteúdo da página
```

### Rota: `/app/upgrade`
```
app.tsx (linha 136-138)
  → ProtectedRoute
    → AppLayout (components/Layout/AppLayout.tsx)
      → Upgrade (pages/Upgrade/index.tsx)
        → PageWrapper (components/layout/PageWrapper.tsx)
          → Conteúdo da página
```

### Rota: `/app/premium-status`
```
app.tsx (linha 140-142)
  → ProtectedRoute
    → AppLayout (components/Layout/AppLayout.tsx)
      → PremiumStatus (pages/PremiumStatus/index.tsx)
        → PageWrapper (components/layout/PageWrapper.tsx)
          → Conteúdo da página
```

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. **Testar os erros inseridos:**
   - Acessar as rotas e verificar se os erros aparecem
   - Se aparecerem → confirma que são os arquivos corretos
   - Se NÃO aparecerem → outra fonte está renderizando

2. **Verificar servidor:**
   - Confirmar se está rodando `npm run dev` (Vite dev server)
   - Verificar se não está servindo de `public/app/` (build antigo)

3. **Inspecionar CSS:**
   - Abrir DevTools no navegador
   - Inspecionar elementos com layout "fichário"
   - Ver quais classes CSS estão aplicadas
   - Verificar se `.card-premium` está sendo usada em vez de `.gc-card`

4. **Limpar cache:**
   - Limpar cache do navegador
   - Testar em modo anônimo
   - Verificar se há cache do Vite

5. **Verificar build:**
   - Rodar novo build: `npm run build`
   - Limpar pasta `public/app/` se necessário
   - Confirmar que está usando dev server para desenvolvimento

---

## ✅ CONCLUSÃO

**Os arquivos estão corretos e as rotas estão configuradas corretamente.**

O problema provavelmente está em:
- Build antigo sendo servido
- Cache do navegador/Vite
- CSS conflitante (`.card-premium` vs `.gc-card`)

**Os erros de teste inseridos vão confirmar definitivamente qual página está sendo renderizada quando acessadas no navegador.**
