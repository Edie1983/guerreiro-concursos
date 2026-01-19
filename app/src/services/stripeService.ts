// src/services/stripeService.ts
import { auth } from "./firebase";

// URLs públicas das Firebase Functions
const CHECKOUT_FUNCTION_URL = "https://us-central1-guerreiro-concursos-oficial.cloudfunctions.net/createCheckoutSession";
const BILLING_PORTAL_FUNCTION_URL = "https://us-central1-guerreiro-concursos-oficial.cloudfunctions.net/createBillingPortalSession";

/**
 * Cria sessão de checkout do Stripe
 * @param priceId - ID do preço do Stripe (mensal ou anual)
 */
export async function createCheckoutSession(priceId: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const res = await fetch(CHECKOUT_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          userId: user.uid,
          priceId: priceId,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro ao criar checkout:", errorText);
      throw new Error("Falha ao iniciar checkout.");
    }

    const result = await res.json();
    // Callable functions retornam { result: { data: ... } }
    const data = result.result?.data || result.data || result;
    
    if (!data || !data.url) {
      console.error("Resposta do servidor:", result);
      throw new Error("Resposta inválida do servidor: URL não encontrada");
    }

    return data.url;
  } catch (error: any) {
    console.error("Erro ao criar checkout session:", error);
    throw error instanceof Error ? error : new Error("Erro ao criar sessão de checkout");
  }
}

/**
 * Cria sessão do Customer Portal (gerenciar assinatura)
 */
export async function createBillingPortalSession(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    const res = await fetch(BILLING_PORTAL_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          userId: user.uid,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro ao criar billing portal:", errorText);
      throw new Error("Falha ao abrir portal de assinatura.");
    }

    const result = await res.json();
    // Callable functions retornam { result: { data: ... } }
    const data = result.result?.data || result.data || result;
    
    if (!data || !data.url) {
      console.error("Resposta do servidor:", result);
      throw new Error("Resposta inválida do servidor: URL não encontrada");
    }

    return data.url;
  } catch (error: any) {
    console.error("Erro ao criar billing portal session:", error);
    throw error instanceof Error ? error : new Error("Erro ao criar sessão do portal");
  }
}


