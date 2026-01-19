==============================
⭐️ INSTRUÇÕES DE DNS OFICIAIS  
DOMÍNIO: guerreiroconcursos.com
==============================

## 📋 STATUS ATUAL

✅ **Site criado no Firebase Hosting:**
- Site ID: `guerreiroconcursos-com`
- URL padrão: `https://guerreiroconcursos-com.web.app`
- Projeto: `guerreiro-concursos-oficial`

⚠️ **IMPORTANTE:** O domínio customizado precisa ser adicionado pelo **Console Web do Firebase** para obter os registros DNS específicos.

---

## 1️⃣ Registros TXT necessários
(host, tipo, valor)

**Após adicionar o domínio no Console Web do Firebase, você receberá um registro TXT único para verificação de propriedade:**

- **Host:** `@` (ou raiz do domínio)
- **Tipo:** `TXT`
- **Valor:** `firebase=<valor-único-fornecido-pelo-firebase>`

**⚠️ NOTA:** Este valor é único e será fornecido quando você adicionar o domínio em:
`Firebase Console → Hosting → Domínios personalizados → Adicionar domínio`

---

## 2️⃣ Registros A ou CNAME obrigatórios
(host, tipo, valor)

**Para apontar o domínio para o Firebase Hosting, adicione os seguintes registros A:**

### Registro A para o domínio raiz:
- **Host:** `@` (ou raiz do domínio)
- **Tipo:** `A`
- **Valor:** `199.36.158.100`

### Registro A para o subdomínio www (opcional, mas recomendado):
- **Host:** `www`
- **Tipo:** `A`
- **Valor:** `199.36.158.100`

**Alternativa usando CNAME (se seu provedor não suportar A no domínio raiz):**
- **Host:** `www`
- **Tipo:** `CNAME`
- **Valor:** `guerreiroconcursos-com.web.app` (ou o domínio fornecido pelo Firebase)

---

## 3️⃣ Observações do Firebase
(propagação, validação etc.)

### ⏱️ Tempo de propagação:
- **DNS:** Pode levar de alguns minutos a **48 horas** para propagar completamente
- **Verificação:** O Firebase verifica automaticamente quando os registros estão corretos
- **SSL:** O certificado SSL é provisionado automaticamente e pode levar até **24 horas**

### 📊 Status no Console:
- **"Aguardando verificação"** → Registros DNS ainda não foram detectados
- **"Verificando"** → Firebase está validando os registros
- **"Ativo"** → Domínio configurado e funcionando

### ✅ Checklist:
1. ✅ Site `guerreiroconcursos-com` criado no Firebase Hosting
2. ⏳ Adicionar domínio no Console Web do Firebase
3. ⏳ Obter registro TXT específico do Firebase
4. ⏳ Adicionar registros DNS no provedor de domínio
5. ⏳ Aguardar verificação e provisionamento SSL

---

## 🚀 PRÓXIMOS PASSOS PARA TIAGO

### Passo 1: Adicionar domínio no Firebase Console
1. Acesse: https://console.firebase.google.com/project/guerreiro-concursos-oficial/hosting
2. Clique em **"Adicionar domínio personalizado"**
3. Digite: `guerreiroconcursos.com`
4. Selecione o site: `guerreiroconcursos-com`
5. **Copie o registro TXT específico** fornecido pelo Firebase

### Passo 2: Configurar DNS no provedor de domínio
1. Acesse o painel de DNS do seu provedor (Registro.br, GoDaddy, etc.)
2. Adicione o registro **TXT** fornecido pelo Firebase
3. Adicione os registros **A** conforme especificado acima
4. Salve as alterações

### Passo 3: Aguardar verificação
- O Firebase verificará automaticamente os registros
- Monitore o status em: `Hosting → Domínios personalizados`
- Quando aparecer como **"Ativo"**, o domínio estará funcionando

---

## 📝 NOTAS TÉCNICAS

- O Firebase Hosting usa múltiplos IPs, mas `199.36.158.100` é o principal
- Se seu provedor não permitir registro A no domínio raiz, use CNAME para `www`
- O registro TXT é obrigatório para verificação de propriedade
- Não é necessário fazer deploy novamente - o site já está publicado

==============================










