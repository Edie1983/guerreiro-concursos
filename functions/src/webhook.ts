import * as logger from "firebase-functions/logger";
import Stripe from "stripe";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// Inicializa Firebase Admin se ainda não foi inicializado
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

/**
 * Calcula o nível baseado nos pontos
 */
function calcularNivel(pontos: number): { nivel: number; progressaoNivel: number } {
  if (pontos < 100) {
    return { nivel: 1, progressaoNivel: Math.min(100, (pontos / 100) * 100) };
  } else if (pontos < 250) {
    const progresso = ((pontos - 100) / 150) * 100;
    return { nivel: 2, progressaoNivel: Math.min(100, progresso) };
  } else if (pontos < 500) {
    const progresso = ((pontos - 250) / 250) * 100;
    return { nivel: 3, progressaoNivel: Math.min(100, progresso) };
  } else if (pontos < 1000) {
    const progresso = ((pontos - 500) / 500) * 100;
    return { nivel: 4, progressaoNivel: Math.min(100, progresso) };
  } else {
    return { nivel: 5, progressaoNivel: 100 };
  }
}

/**
 * Adiciona pontos ao usuário (usando Firestore Admin SDK)
 */
async function addPontosAdmin(uid: string, quantidade: number): Promise<void> {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    logger.warn(`[GC/Gamificacao] Usuário ${uid} não encontrado ao adicionar pontos`);
    return;
  }

  const data = userSnap.data();
  const pontosAtuais = data?.pontos || 0;
  const novosPontos = pontosAtuais + quantidade;

  // Calcula novo nível e progressão
  const { nivel, progressaoNivel } = calcularNivel(novosPontos);

  await userRef.set(
    {
      pontos: novosPontos,
      nivel: nivel,
      progressaoNivel: progressaoNivel,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  logger.info(`[GC/Gamificacao] ${quantidade} pontos adicionados para ${uid}. Total: ${novosPontos}, Nível: ${nivel}`);
}

/**
 * Adiciona uma medalha ao usuário (usando Firestore Admin SDK)
 */
async function addMedalhaAdmin(uid: string, medalhaId: string): Promise<boolean> {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    logger.warn(`[GC/Gamificacao] Usuário ${uid} não encontrado ao adicionar medalha`);
    return false;
  }

  const data = userSnap.data();
  const medalhasAtuais = data?.medalhas || [];

  // Se já tem a medalha, não adiciona novamente
  if (medalhasAtuais.includes(medalhaId)) {
    return false;
  }

  const novasMedalhas = [...medalhasAtuais, medalhaId];

  await userRef.set(
    {
      medalhas: novasMedalhas,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  logger.info(`[GC/Gamificacao] Medalha "${medalhaId}" adicionada para ${uid}`);
  return true;
}

/**
 * Registra evento do webhook na collection logs_stripe
 */
async function logStripeEvent(event: Stripe.Event, status: "success" | "error", details?: any): Promise<void> {
  try {
    await db.collection("logs_stripe").add({
      eventId: event.id,
      eventType: event.type,
      status,
      details: details || {},
      receivedAt: Timestamp.now(),
      processedAt: Timestamp.now(),
    });
    logger.info(`[GC/Stripe] Evento ${event.type} (${event.id}) registrado em logs_stripe com status: ${status}`);
  } catch (error: any) {
    logger.error(`[GC/Stripe] Erro ao registrar log do evento ${event.id}:`, error.message);
  }
}

/**
 * Handler do Webhook do Stripe para processar eventos de assinatura
 */
export const stripeWebhookHandler = async (req: any, res: any) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      logger.error("[GC/Stripe] Webhook sem assinatura");
      res.status(400).send("Webhook sem assinatura");
      return;
    }

    // Busca Stripe Secret Key e Webhook Secret
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecret || !webhookSecret) {
      logger.error("[GC/Stripe] Configuração do Stripe não encontrada - STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET ausentes");
      res.status(500).send("Configuração do Stripe não encontrada");
      return;
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-12-15.clover",
    });

    let event: Stripe.Event;

    try {
      // Verifica assinatura do webhook
      // No Firebase Functions v2, o body vem como string ou Buffer
      const rawBody = typeof req.rawBody === 'string' 
        ? Buffer.from(req.rawBody)
        : req.rawBody instanceof Buffer
        ? req.rawBody
        : Buffer.from(JSON.stringify(req.body) || "");
      
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      logger.error("[GC/Stripe] Erro ao verificar webhook", { error: err.message });
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    logger.info(`[GC/Stripe] Webhook recebido: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          logger.info(`[GC/Stripe] Processando checkout.session.completed - Session ID: ${session.id}`);

          if (session.mode === "subscription" && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );

            const customerId = subscription.customer as string;
            const subscriptionId = subscription.id;

            // Busca userId do metadata da sessão (prioridade: uid > userId)
            let userId = session.metadata?.uid || session.metadata?.userId;

            logger.info(`[GC/Stripe] Metadata da sessão:`, { metadata: session.metadata, userId });

            // Se não tiver no metadata, tenta buscar pelo customerId
            if (!userId) {
              logger.warn(`[GC/Stripe] metadata.uid não encontrado, buscando por customerId: ${customerId}`);
              const usersSnapshot = await db
                .collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

              if (usersSnapshot.empty) {
                logger.error(`[GC/Stripe] Usuário não encontrado para customerId ${customerId} e metadata não contém uid/userId`);
                await logStripeEvent(event, "error", { 
                  error: "Usuário não encontrado",
                  customerId,
                  subscriptionId 
                });
                break;
              }

              userId = usersSnapshot.docs[0].id;
              logger.info(`[GC/Stripe] Usuário encontrado por customerId: ${userId}`);
            }

            const userRef = db.collection("users").doc(userId);

            // Determina premiumUntil baseado no intervalo da assinatura
            const subscriptionData = subscription as any;
            const currentPeriodEnd = subscriptionData.current_period_end 
              ? new Date(subscriptionData.current_period_end * 1000)
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 dias
            const premiumUntil = Timestamp.fromDate(currentPeriodEnd);

            // Calcula dias de premium baseado no intervalo
            const interval = subscription.items.data[0]?.price?.recurring?.interval || "month";
            const intervalCount = subscription.items.data[0]?.price?.recurring?.interval_count || 1;
            const daysToAdd = interval === "year" ? 365 * intervalCount : 30 * intervalCount;

            logger.info(`[GC/Stripe] Atualizando usuário ${userId} para Premium`, {
              customerId,
              subscriptionId,
              subscriptionStatus: subscription.status,
              premiumUntil: currentPeriodEnd.toISOString(),
              interval,
              intervalCount,
              daysToAdd,
            });

            // Atualiza documento do usuário
            await userRef.set(
              {
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: subscription.status === "active" ? "active" : "incomplete",
                premiumUntil: premiumUntil,
                plan: "premium",
                updatedAt: Timestamp.now(),
              },
              { merge: true }
            );

            logger.info(`[GC/Stripe] ✅ Usuário ${userId} atualizado para Premium`, {
              userId,
              customerId,
              subscriptionId,
              premiumUntil: currentPeriodEnd.toISOString(),
              subscriptionStatus: subscription.status,
            });

            // Registra log de sucesso
            await logStripeEvent(event, "success", {
              userId,
              customerId,
              subscriptionId,
              premiumUntil: currentPeriodEnd.toISOString(),
              subscriptionStatus: subscription.status,
            });

            // Trigger: Premium ativado (pontos + medalhas)
            if (subscription.status === "active") {
              try {
                await addPontosAdmin(userId, 50);
                await addMedalhaAdmin(userId, "premium_primeira_vez");
                logger.info(`[GC/Stripe] Pontos e medalha concedidos para ${userId}`);
              } catch (error: any) {
                logger.error(`[GC/Stripe] Erro ao conceder pontos por premium para ${userId}:`, error.message);
              }
            }
          } else {
            logger.warn(`[GC/Stripe] checkout.session.completed não é subscription mode ou não tem subscription ID`);
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const subscriptionId = subscription.id;

          logger.info(`[GC/Stripe] Processando customer.subscription.updated - Subscription ID: ${subscriptionId}, Status: ${subscription.status}`);

          // Busca userId pelo customerId
          const usersSnapshot = await db
                .collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

          if (usersSnapshot.empty) {
            logger.error(`[GC/Stripe] Usuário não encontrado para customerId: ${customerId}`);
            await logStripeEvent(event, "error", { 
              error: "Usuário não encontrado",
              customerId,
              subscriptionId 
            });
            break;
          }

          const userId = usersSnapshot.docs[0].id;
          const userRef = db.collection("users").doc(userId);
          const userDataBefore = (await userRef.get()).data();
          const planAnterior = userDataBefore?.plan || "free";
          const statusAnterior = userDataBefore?.subscriptionStatus || "unknown";

          // Atualiza premiumUntil baseado em current_period_end
          const subscriptionData = subscription as any;
          const currentPeriodEnd = subscriptionData.current_period_end 
            ? new Date(subscriptionData.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 dias
          const premiumUntil = Timestamp.fromDate(currentPeriodEnd);

          // Mapeia status do Stripe para nosso formato
          let subscriptionStatus: "active" | "canceled" | "past_due" | "incomplete" | "trialing" | "unpaid" | "unknown" = "unknown";
          if (subscription.status === "active") {
            subscriptionStatus = "active";
          } else if (subscription.status === "canceled") {
            subscriptionStatus = "canceled";
          } else if (subscription.status === "past_due") {
            subscriptionStatus = "past_due";
          } else if (subscription.status === "incomplete") {
            subscriptionStatus = "incomplete";
          } else if (subscription.status === "trialing") {
            subscriptionStatus = "trialing";
          } else if (subscription.status === "unpaid") {
            subscriptionStatus = "unpaid";
          }

          logger.info(`[GC/Stripe] Atualizando subscription do usuário ${userId}`, {
            userId,
            subscriptionId,
            statusAnterior,
            statusNovo: subscriptionStatus,
            planAnterior,
            planNovo: subscriptionStatus === "active" ? "premium" : "free",
            premiumUntil: currentPeriodEnd.toISOString(),
          });

          // Atualiza documento do usuário
          await userRef.set(
            {
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: subscriptionStatus,
              premiumUntil: subscriptionStatus === "active" ? premiumUntil : null,
              plan: subscriptionStatus === "active" ? "premium" : "free",
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );

          logger.info(`[GC/Stripe] ✅ Subscription atualizada para usuário ${userId}`, {
            userId,
            subscriptionId,
            status: subscriptionStatus,
            premiumUntil: currentPeriodEnd.toISOString(),
            mudouDeFree: planAnterior === "free" && subscriptionStatus === "active",
          });

          // Registra log de sucesso
          await logStripeEvent(event, "success", {
            userId,
            customerId,
            subscriptionId,
            statusAnterior,
            statusNovo: subscriptionStatus,
            planAnterior,
            planNovo: subscriptionStatus === "active" ? "premium" : "free",
            premiumUntil: currentPeriodEnd.toISOString(),
          });

          // Trigger: Premium ativado (se mudou de free para active)
          if (subscriptionStatus === "active" && planAnterior === "free") {
            try {
              await addPontosAdmin(userId, 50);
              await addMedalhaAdmin(userId, "premium_primeira_vez");
              logger.info(`[GC/Stripe] Pontos e medalha concedidos para ${userId} (mudou de free para premium)`);
            } catch (error: any) {
              logger.error(`[GC/Stripe] Erro ao conceder pontos por premium para ${userId}:`, error.message);
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const subscriptionId = subscription.id;

          logger.info(`[GC/Stripe] Processando customer.subscription.deleted - Subscription ID: ${subscriptionId}`);

          // Busca userId pelo customerId
          const usersSnapshot = await db
                .collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

          if (usersSnapshot.empty) {
            logger.error(`[GC/Stripe] Usuário não encontrado para customerId: ${customerId}`);
            await logStripeEvent(event, "error", { 
              error: "Usuário não encontrado",
              customerId,
              subscriptionId 
            });
            break;
          }

          const userId = usersSnapshot.docs[0].id;
          const userRef = db.collection("users").doc(userId);
          const userDataBefore = (await userRef.get()).data();
          const planAnterior = userDataBefore?.plan || "free";

          logger.info(`[GC/Stripe] Cancelando subscription do usuário ${userId}`, {
            userId,
            customerId,
            subscriptionId,
            planAnterior,
          });

          // Atualiza documento do usuário
          await userRef.set(
            {
              subscriptionStatus: "canceled",
              premiumUntil: null,
              plan: "free",
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );

          logger.info(`[GC/Stripe] ✅ Subscription cancelada para usuário ${userId}`, {
            userId,
            customerId,
            subscriptionId,
            mudouDePremium: planAnterior === "premium",
          });

          // Registra log de sucesso
          await logStripeEvent(event, "success", {
            userId,
            customerId,
            subscriptionId,
            planAnterior,
            planNovo: "free",
          });

          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          const subscriptionId = invoice.subscription as string | null;

          logger.info(`[GC/Stripe] Processando invoice.payment_succeeded - Invoice ID: ${invoice.id}`);

          if (!subscriptionId) {
            logger.warn(`[GC/Stripe] Invoice ${invoice.id} não possui subscription ID`);
            await logStripeEvent(event, "error", { 
              error: "Invoice sem subscription ID",
              invoiceId: invoice.id,
              customerId 
            });
            break;
          }

          // Busca userId pelo customerId
          const usersSnapshot = await db
                .collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

          if (usersSnapshot.empty) {
            logger.error(`[GC/Stripe] Usuário não encontrado para customerId: ${customerId}`);
            await logStripeEvent(event, "error", { 
              error: "Usuário não encontrado",
              customerId,
              invoiceId: invoice.id 
            });
            break;
          }

          const userId = usersSnapshot.docs[0].id;
          const userRef = db.collection("users").doc(userId);

          // Busca subscription para obter current_period_end
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subscriptionData = subscription as any;
          const currentPeriodEnd = subscriptionData.current_period_end 
            ? new Date(subscriptionData.current_period_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          const premiumUntil = Timestamp.fromDate(currentPeriodEnd);

          logger.info(`[GC/Stripe] Pagamento confirmado para usuário ${userId}`, {
            userId,
            customerId,
            subscriptionId,
            invoiceId: invoice.id,
            premiumUntil: currentPeriodEnd.toISOString(),
          });

          // Atualiza premiumUntil quando pagamento é confirmado
          await userRef.set(
            {
              subscriptionStatus: subscription.status === "active" ? "active" : "incomplete",
              premiumUntil: premiumUntil,
              plan: subscription.status === "active" ? "premium" : "free",
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );

          logger.info(`[GC/Stripe] ✅ PremiumUntil atualizado para usuário ${userId} após pagamento`, {
            userId,
            subscriptionId,
            premiumUntil: currentPeriodEnd.toISOString(),
          });

          // Registra log de sucesso
          await logStripeEvent(event, "success", {
            userId,
            customerId,
            subscriptionId,
            invoiceId: invoice.id,
            premiumUntil: currentPeriodEnd.toISOString(),
            subscriptionStatus: subscription.status,
          });

          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;

          logger.info(`[GC/Stripe] Processando invoice.payment_failed - Invoice ID: ${invoice.id}`);

          // Busca userId pelo customerId
          const usersSnapshot = await db
                .collection("users")
                .where("stripeCustomerId", "==", customerId)
                .limit(1)
                .get();

          if (usersSnapshot.empty) {
            logger.error(`[GC/Stripe] Usuário não encontrado para customerId: ${customerId}`);
            await logStripeEvent(event, "error", { 
              error: "Usuário não encontrado",
              customerId,
              invoiceId: invoice.id 
            });
            break;
          }

          const userId = usersSnapshot.docs[0].id;
          const userRef = db.collection("users").doc(userId);

          logger.info(`[GC/Stripe] Pagamento falhou para usuário ${userId}`, {
            userId,
            customerId,
            invoiceId: invoice.id,
          });

          // Atualiza status para past_due
          await userRef.set(
            {
              subscriptionStatus: "past_due",
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          );

          logger.info(`[GC/Stripe] ✅ Status atualizado para past_due para usuário ${userId}`);

          // Registra log de sucesso
          await logStripeEvent(event, "success", {
            userId,
            customerId,
            invoiceId: invoice.id,
            subscriptionStatus: "past_due",
          });

          break;
        }

        default:
          logger.info(`[GC/Stripe] Evento não tratado: ${event.type}`, { type: event.type, id: event.id });
          await logStripeEvent(event, "success", { 
            note: "Evento não tratado, mas recebido com sucesso" 
          });
      }

      res.json({ received: true });
    } catch (error: any) {
      logger.error(`[GC/Stripe] Erro ao processar webhook ${event.type} (${event.id}):`, {
        error: error.message,
        stack: error.stack,
        type: event.type,
        eventId: event.id,
      });
      
      // Registra log de erro
      await logStripeEvent(event, "error", {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).send(`Erro ao processar webhook: ${error.message}`);
    }
};

