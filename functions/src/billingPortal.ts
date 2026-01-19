import * as logger from "firebase-functions/logger";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Inicializa Firebase Admin se ainda não foi inicializado
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

/**
 * Handler para criar sessão do Customer Portal (gerenciar assinatura)
 */
export const createBillingPortalSessionHandler = async (req: any, res: any) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId é obrigatório" });
      return;
    }

    // Verifica se o usuário existe
    try {
      await auth.getUser(userId);
    } catch (error) {
      logger.error("Usuário não encontrado", { userId, error });
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }

    // Busca Stripe Secret Key
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      logger.error("STRIPE_SECRET_KEY não configurada");
      res.status(500).json({ error: "Configuração do Stripe não encontrada" });
      return;
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-12-15.clover",
    });

    // Busca dados do usuário no Firestore
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      res.status(400).json({ error: "Usuário não possui assinatura Stripe" });
      return;
    }

    // Determina origin da requisição
    const origin = req.headers.origin || "http://localhost:5173";

    // Cria sessão do portal
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/planos`,
    });

    logger.info("Billing portal session criada", {
      userId,
      sessionId: session.id,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    logger.error("Erro ao criar billing portal session", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: `Erro ao criar sessão do portal: ${error.message}` });
  }
};

