import Stripe from "stripe";

export async function createCheckoutSessionHandler(req: any, res: any) {
  console.log("🔥 [CHECKOUT] Endpoint chamado");
  console.log("📥 Corpo recebido:", JSON.stringify(req.body, null, 2));

  try {
    const { userId, priceId } = req.body?.data || {};

    console.log("🔍 userId:", userId);
    console.log("🔍 priceId:", priceId);

    if (!userId) {
      console.error("❌ ERRO: userId ausente");
      return res.status(400).json({ error: "userId é obrigatório" });
    }

    if (!priceId) {
      console.error("❌ ERRO: priceId ausente");
      return res.status(400).json({ error: "priceId é obrigatório" });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecret) {
      console.error("❌ ERRO CRÍTICO: STRIPE_SECRET_KEY não encontrada");
      return res.status(500).json({ error: "Stripe não configurado" });
    }

    console.log("🔐 STRIPE_SECRET_KEY carregada com sucesso");

    const stripe = new Stripe(stripeSecret, { apiVersion: "2025-12-15.clover" });

    console.log("⚙️ Criando sessão de checkout no Stripe...");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      success_url: "https://guerreiroconcursos.com/sucesso",
      cancel_url: "https://guerreiroconcursos.com/erro",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { 
        uid: userId,  // Prioridade: usar uid
        userId: userId  // Mantém userId para compatibilidade
      },
    });

    console.log("✅ Sessão criada com sucesso!");
    console.log("➡️ URL:", session.url);

    return res.json({ url: session.url });
  } catch (err: any) {
    console.error("💥 ERRO INTERNO NO CHECKOUT:");
    console.error("Mensagem:", err.message);
    console.error("Stack:", err.stack);

    return res.status(500).json({
      error: "Erro ao criar checkout",
      details: err.message,
    });
  }
}
