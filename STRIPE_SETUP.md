# Setup Stripe Subscription - Guerreiro Concursos

Este documento descreve como configurar e fazer deploy do sistema de assinaturas Stripe no GC.

## Pré-requisitos

1. Conta Stripe (test mode para desenvolvimento)
2. Firebase CLI instalado: `npm install -g firebase-tools`
3. Projeto Firebase inicializado

## Passo 1: Configurar Firebase Functions

### 1.1 Instalar dependências

```bash
cd functions
npm install
```

### 1.2 Configurar projeto Firebase

Edite `.firebaserc` e defina o `project-id` correto:

```json
{
  "projects": {
    "default": "seu-projeto-id"
  }
}
```

## Passo 2: Configurar Secrets/Variáveis de Ambiente

### 2.1 Obter chaves do Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Vá em **Developers → API keys**
3. Copie:
   - **Secret key** (test mode: começa com `sk_test_`)
   - **Publishable key** (não usado nas functions, mas útil para referência)

### 2.2 Criar Price ID (assinatura mensal)

1. No Stripe Dashboard, vá em **Products**
2. Crie um novo produto (ex: "Premium Mensal")
3. Configure:
   - Tipo: **Recurring** (Recorrente)
   - Preço: **R$ 29,00**
   - Intervalo: **Monthly** (Mensal)
4. Copie o **Price ID** (começa com `price_`)

### 2.3 Configurar Webhook Secret (após criar endpoint)

1. No Stripe Dashboard, vá em **Developers → Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://us-central1-SEU-PROJECT-ID.cloudfunctions.net/stripeWebhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed` (opcional)
5. Copie o **Signing secret** (começa com `whsec_`)

### 2.4 Definir secrets no Firebase

**Opção A: Usando Firebase CLI (recomendado para produção)**

```bash
# Login no Firebase
firebase login

# Definir secrets
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_PRICE_ID_MONTHLY
firebase functions:secrets:set APP_URL
```

Quando solicitado, cole o valor correspondente:
- `STRIPE_SECRET_KEY`: Secret key do Stripe (sk_test_...)
- `STRIPE_WEBHOOK_SECRET`: Signing secret do webhook (whsec_...)
- `STRIPE_PRICE_ID_MONTHLY`: Price ID criado (price_...)
- `APP_URL`: URL do app (ex: `https://seu-dominio.com` ou `http://localhost:5173` para DEV)

**Opção B: Usando variáveis de ambiente locais (apenas para emuladores)**

Crie `functions/.env` (não commitar no git):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
APP_URL=http://localhost:5173
```

**Importante**: `.env` está no `.gitignore` e não deve ser commitado.

## Passo 3: Testar Localmente (Emuladores)

### 3.1 Iniciar emuladores

```bash
# Na raiz do projeto
firebase emulators:start --only functions
```

### 3.2 Testar webhook localmente (usando Stripe CLI)

1. Instale Stripe CLI: https://stripe.com/docs/stripe-cli
2. Autentique: `stripe login`
3. Forward webhooks para emulador local:

```bash
stripe listen --forward-to localhost:5001/SEU-PROJECT-ID/us-central1/stripeWebhook
```

4. Copie o **webhook signing secret** exibido (começa com `whsec_`)
5. Use esse secret no `.env` local (ou configure no emulador)

### 3.3 Testar checkout

1. Inicie o app frontend: `npm run dev`
2. Acesse `/planos`
3. Clique em "Assinar Premium" (em PROD) ou use ativação manual (em DEV)
4. Complete o checkout no Stripe (use cartão de teste: `4242 4242 4242 4242`)
5. Verifique no Firestore que `users/{uid}` foi atualizado com:
   - `plan: "premium"`
   - `premiumUntil: Timestamp`
   - `stripeCustomerId: "cus_..."`
   - `stripeSubscriptionId: "sub_..."`

## Passo 4: Deploy para Produção

### 4.1 Build e deploy das functions

```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 4.2 Configurar webhook no Stripe (produção)

1. No Stripe Dashboard → **Developers → Webhooks**
2. Adicione endpoint:
   - URL: `https://us-central1-SEU-PROJECT-ID.cloudfunctions.net/stripeWebhook`
   - Eventos: (mesmos do passo 2.3)
3. Copie o **Signing secret** e atualize o secret no Firebase:

```bash
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

4. Faça redeploy da função:

```bash
firebase deploy --only functions:stripeWebhook
```

### 4.3 Atualizar APP_URL

Se necessário, atualize `APP_URL` para o domínio de produção:

```bash
firebase functions:secrets:set APP_URL
# Digite: https://seu-dominio.com
firebase deploy --only functions
```

## Passo 5: Verificação e Smoke Tests

### 5.1 Fluxo completo (teste manual)

1. **Usuário free → Checkout → Premium**
   - Login como usuário free
   - Acesse `/planos`
   - Clique "Assinar Premium"
   - Complete checkout (cartão teste: `4242 4242 4242 4242`)
   - Aguarde redirecionamento
   - Verifique que `plan === "premium"` sem reload
   - Verifique Firestore: campos Stripe preenchidos

2. **Cancelar assinatura → Volta para free**
   - Login como usuário premium
   - Acesse `/planos`
   - Clique "Gerenciar assinatura"
   - Cancele assinatura no portal
   - Aguarde webhook processar (pode levar alguns segundos)
   - Chame `refreshPlan()` manualmente ou aguarde
   - Verifique que `plan === "free"`

### 5.2 Verificar logs

```bash
# Logs das functions
firebase functions:log

# Logs do webhook (Stripe Dashboard)
# Developers → Webhooks → [seu endpoint] → Recent events
```

### 5.3 Verificar Firestore Rules

Confirme que as regras bloqueiam updates de `plan/premiumUntil` pelo cliente:

```javascript
// firestore.rules (já implementado)
allow update: if ...
  && request.resource.data.plan == resource.data.plan
  && (premiumUntil não mudou)
  && request.resource.data.diff(resource.data).changedKeys().hasOnly(["email", "updatedAt"]);
```

## Troubleshooting

### Webhook não está sendo chamado

1. Verifique URL do endpoint no Stripe Dashboard
2. Verifique logs: `firebase functions:log`
3. Teste manualmente com Stripe CLI: `stripe trigger checkout.session.completed`

### Erro "Missing stripe-signature header"

- Webhook não está configurado corretamente no Stripe
- Verifique se a URL está correta

### Erro "Webhook Error: No signatures found"

- `STRIPE_WEBHOOK_SECRET` está incorreto
- Verifique se está usando o secret correto (test vs production)

### Usuário não vira premium após checkout

1. Verifique logs do webhook no Stripe Dashboard
2. Verifique logs das functions: `firebase functions:log`
3. Confirme que `metadata.uid` está sendo enviado no checkout
4. Verifique Firestore: `users/{uid}` deve ter `stripeCustomerId` e `stripeSubscriptionId`

### "STRIPE_PRICE_ID_MONTHLY não configurado"

- Secret não foi definido corretamente
- Verifique: `firebase functions:secrets:access STRIPE_PRICE_ID_MONTHLY`

## Estrutura de Dados (Firestore)

### users/{uid}

```typescript
{
  uid: string;
  email?: string;
  plan: "free" | "premium";
  premiumUntil?: Timestamp | null;
  stripeCustomerId?: string;        // ID do customer no Stripe
  stripeSubscriptionId?: string;     // ID da subscription no Stripe
  subscriptionStatus?: "active" | "canceled" | "past_due" | ...;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Regras de segurança:**
- Cliente **NUNCA** pode atualizar `plan`, `premiumUntil`, `stripeCustomerId`, `stripeSubscriptionId`
- Apenas Cloud Functions (via webhook) podem atualizar esses campos

## Referências

- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

