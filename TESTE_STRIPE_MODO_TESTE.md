# Roteiro de Teste Manual - Stripe em Modo Teste

## Pré-requisitos

1. **Stripe em modo Teste configurado:**
   - Conta Stripe criada
   - Modo Teste ativado no Stripe Dashboard
   - Secret Key de teste (`sk_test_...`)
   - Price ID criado para assinatura mensal (`price_...`)
   - Webhook configurado (após deploy das functions)

2. **Firebase configurado:**
   - Projeto Firebase criado
   - Firebase CLI instalado e logado
   - Secrets configurados (ou .env local para emuladores)

3. **App rodando:**
   - Frontend: `npm run dev` (http://localhost:5173)
   - Functions: deployadas OU emuladores rodando

---

## PASSO 1: Configuração Inicial do Stripe (Modo Teste)

### 1.1 Obter chaves do Stripe

1. Acesse https://dashboard.stripe.com/test/apikeys
2. Copie a **Secret key** (começa com `sk_test_...`)
3. Guarde para usar nas variáveis de ambiente

### 1.2 Criar Price ID

1. No Stripe Dashboard, vá em **Products** → **Add product**
2. Configure:
   - Nome: "Premium Mensal"
   - Tipo: **Recurring** (Recorrente)
   - Preço: **R$ 29,00** (ou valor de teste)
   - Intervalo: **Monthly** (Mensal)
3. Clique em **Save product**
4. Copie o **Price ID** (começa com `price_...`)

### 1.3 Configurar variáveis de ambiente

**Opção A: Emuladores locais (recomendado para primeiro teste)**

Crie `functions/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_MONTHLY=price_...
APP_URL=http://localhost:5173
STRIPE_WEBHOOK_SECRET=whsec_...  # (obtido após configurar webhook)
```

**Opção B: Secrets do Firebase (produção/teste real)**

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
# Cole: sk_test_...

firebase functions:secrets:set STRIPE_PRICE_ID_MONTHLY
# Cole: price_...

firebase functions:secrets:set APP_URL
# Cole: http://localhost:5173 (ou URL de produção)
```

### 1.4 Deploy das Functions (ou rodar emuladores)

**Se usar emuladores:**

```bash
# Terminal 1: Emuladores
cd functions
npm install
cd ..
firebase emulators:start --only functions

# Terminal 2: Frontend
npm run dev
```

**Se usar deploy:**

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 1.5 Configurar Webhook no Stripe

1. No Stripe Dashboard, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL do endpoint:
   - **Emuladores locais**: use Stripe CLI (veja seção abaixo)
   - **Deploy**: `https://us-central1-SEU-PROJECT-ID.cloudfunctions.net/stripeWebhook`
4. Selecione eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed` (opcional)
5. Clique em **Add endpoint**
6. Copie o **Signing secret** (começa com `whsec_...`)
7. Configure no `.env` ou secrets do Firebase

**Para emuladores locais (Stripe CLI):**

```bash
# Instale Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5001/SEU-PROJECT-ID/us-central1/stripeWebhook
# Copie o webhook signing secret exibido (whsec_...)
```

---

## PASSO 2: Teste do Fluxo Completo

### 2.1 Criar conta nova (usuário FREE)

1. Abra o app em http://localhost:5173
2. Clique em **Registrar** ou **Login**
3. Crie uma conta nova (email/senha) ou faça login com Google
4. ✅ Confirmar que você está logado e vê a Home

### 2.2 Testar bloqueio do PremiumGate

1. Tente acessar **Upload de Edital** (`/upload`)
   - ✅ Se tiver 2+ editais: deve mostrar paywall "Limite atingido"
   - ✅ Se tiver < 2 editais: deve permitir upload (limite FREE)

2. Tente acessar **Mapa Tático** (`/edital/:id/mapa`) de um edital existente
   - ✅ Deve mostrar paywall "Recurso Premium - Mapa Tático está disponível apenas no plano Premium"
   - ✅ Botão "Ver Planos" deve redirecionar para `/planos`

3. Tente acessar **Cronograma** (`/edital/:id/cronograma`) de um edital existente
   - ✅ Deve mostrar paywall "Recurso Premium - Cronograma Inteligente está disponível apenas no plano Premium"
   - ✅ Botão "Ver Planos" deve redirecionar para `/planos`

### 2.3 Assinar Premium (Stripe Checkout)

1. Vá para `/planos`
2. ✅ Confirmar que você vê os planos Free e Premium
3. ✅ Confirmar que o plano Free está marcado como "Plano Atual"
4. Clique em **"Assinar Premium"** no card Premium
5. ✅ Deve abrir a página de checkout do Stripe
6. Preencha os dados de teste:
   - **Email**: seu email de teste
   - **Cartão**: `4242 4242 4242 4242`
   - **Data**: qualquer data futura (ex: `12/25`)
   - **CVC**: qualquer 3 dígitos (ex: `123`)
   - **Nome**: qualquer nome
   - **CEP**: qualquer CEP (ex: `12345-678`)
7. Clique em **"Assinar"** ou **"Subscribe"**

### 2.4 Verificar atualização após checkout

1. ✅ Você deve ser redirecionado para `/planos?status=success`
2. ✅ Deve aparecer Toast verde: "Assinatura ativada com sucesso!"
3. Aguarde ~2 segundos (para webhook processar)
4. ✅ A URL deve ser limpa (sem query params)
5. ✅ O card Premium deve mostrar "Plano Atual"
6. ✅ Botão deve mudar para "Gerenciar assinatura"

### 2.5 Verificar no Firestore

1. Abra Firebase Console → Firestore
2. Vá em `users/{seu-uid}`
3. ✅ Verificar que os campos foram atualizados:
   - `plan`: `"premium"`
   - `premiumUntil`: Timestamp (data futura)
   - `stripeCustomerId`: `"cus_..."`
   - `stripeSubscriptionId`: `"sub_..."`
   - `subscriptionStatus`: `"active"` ou `"trialing"`

### 2.6 Testar acesso às rotas Premium

1. **Recarregue a página** (F5) para garantir que o estado foi atualizado
2. Tente acessar **Mapa Tático** (`/edital/:id/mapa`)
   - ✅ Deve abrir normalmente (sem paywall)
   - ✅ Deve mostrar o mapa tático

3. Tente acessar **Cronograma** (`/edital/:id/cronograma`)
   - ✅ Deve abrir normalmente (sem paywall)
   - ✅ Deve mostrar o cronograma

4. Tente fazer **Upload de Edital** (`/upload`)
   - ✅ Deve permitir upload (sem limite)

### 2.7 Testar cancelamento (opcional)

1. Vá para `/planos`
2. Clique em **"Gerenciar assinatura"**
3. ✅ Deve abrir o Stripe Customer Portal
4. No portal, cancele a assinatura
5. Aguarde alguns segundos (webhook processar)
6. ✅ Volte para `/planos` e recarregue a página
7. ✅ Deve voltar a mostrar "Assinar Premium" (não "Gerenciar")
8. ✅ No Firestore: `plan` deve ser `"free"`, `subscriptionStatus` deve ser `"canceled"`

---

## PASSO 3: Verificar Logs (se algo der errado)

### 3.1 Logs das Cloud Functions

```bash
# Se usando emuladores
# Veja o terminal onde rodou firebase emulators:start

# Se usando deploy
firebase functions:log
```

**O que procurar:**
- ✅ `[Webhook] Usuário {uid} atualizado: plan=premium`
- ❌ Erros de validação de webhook
- ❌ Erros de atualização do Firestore

### 3.2 Logs do Stripe Dashboard

1. Acesse https://dashboard.stripe.com/test/logs
2. Veja eventos de webhook:
   - ✅ `checkout.session.completed` (status: succeeded)
   - ✅ `customer.subscription.created` (status: succeeded)
   - ❌ Se algum evento falhar, veja os detalhes

### 3.3 Console do navegador

1. Abra DevTools (F12)
2. Aba **Console**
3. ❌ Não deve haver erros de JavaScript
4. ✅ Se houver logs, devem ser informativos (não erros)

---

## Checklist Final

- [ ] Conta FREE criada e logada
- [ ] PremiumGate bloqueia Mapa Tático e Cronograma
- [ ] Página Planos mostra planos corretos
- [ ] Checkout do Stripe abre corretamente
- [ ] Pagamento de teste funciona (cartão 4242...)
- [ ] Redirecionamento após checkout funciona
- [ ] Toast de sucesso aparece
- [ ] Firestore atualizado corretamente (plan, premiumUntil, stripeCustomerId, stripeSubscriptionId, subscriptionStatus)
- [ ] Após recarregar, usuário consegue acessar rotas Premium
- [ ] PremiumGate não bloqueia mais (usuário é premium)
- [ ] Cancelamento funciona (opcional)

---

## Problemas Comuns e Soluções

### "STRIPE_PRICE_ID_MONTHLY não configurado"

- **Causa**: Variável de ambiente não configurada
- **Solução**: Configure no `.env` ou secrets do Firebase

### "Missing stripe-signature header"

- **Causa**: Webhook não configurado no Stripe
- **Solução**: Configure o endpoint no Stripe Dashboard

### "Webhook Error: No signatures found"

- **Causa**: `STRIPE_WEBHOOK_SECRET` incorreto
- **Solução**: Use o signing secret correto do Stripe Dashboard

### Usuário não vira premium após checkout

1. Verifique logs do webhook no Stripe Dashboard
2. Verifique logs das functions: `firebase functions:log`
3. Confirme que `metadata.uid` está sendo enviado no checkout
4. Verifique Firestore: `users/{uid}` deve ter `stripeCustomerId`

### PremiumGate ainda bloqueia após checkout

1. Recarregue a página (F5)
2. Verifique no console se `isPremium` está `true`
3. Verifique Firestore: `plan` deve ser `"premium"` e `subscriptionStatus` deve ser `"active"` ou `"trialing"`

---

## Campos do Firestore para Conferir

No documento `users/{uid}`, verifique:

```typescript
{
  uid: string;                          // Seu UID
  email: string;                        // Seu email
  plan: "free" | "premium";             // ✅ Deve ser "premium" após assinatura
  premiumUntil: Timestamp | null;       // ✅ Deve ser Timestamp futuro após assinatura
  stripeCustomerId: string | undefined; // ✅ Deve ser "cus_..." após checkout
  stripeSubscriptionId: string | undefined; // ✅ Deve ser "sub_..." após checkout
  subscriptionStatus: "active" | "canceled" | ... | undefined; // ✅ Deve ser "active" ou "trialing" após checkout
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Regra importante**: Cliente NUNCA pode alterar `plan`, `premiumUntil`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`. Apenas Cloud Functions (webhook) podem.












