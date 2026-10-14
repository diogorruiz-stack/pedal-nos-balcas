module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const question = String(body.question || '').trim().slice(0, 1200);
    const activeDay = Number(body.activeDay || 0);
    const context = Array.isArray(body.context) ? body.context.slice(0, 4) : [];
    const global = String(body.global || '').slice(0, 5000);

    if (!question) return res.status(400).json({ error: 'empty_question' });

    const contextText = JSON.stringify({ contexto_geral: global, dias_relevantes: context }, null, 2);
    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

    // A deterministic fallback keeps the chat useful even if the AI Gateway
    // is temporarily unavailable or the account has no AI credit.
    const fallback = () => {
      const d = context[0];
      if (!d) return {
        answer: 'Essa informação não está registrada no material da viagem que tenho aqui.',
        day: null,
        mode: 'fallback'
      };
      const clean = String(d.resumo || '').replace(/\s+/g, ' ').trim();
      return {
        answer: `Isso aparece principalmente no Dia ${d.dia} (${d.rota}). ${clean}`,
        day: d.dia || null,
        mode: 'fallback'
      };
    };

    if (!token) return res.status(200).json(fallback());

    const system = `Você é o guia interativo do site "Pedal nos Bálcãs", uma viagem real feita por Diogo Ruiz em setembro de 2026.

REGRAS:
- Responda para quem está visitando o site, não para Diogo.
- Use apenas os fatos fornecidos no CONTEXTO DA VIAGEM abaixo.
- Não invente locais, preços, datas, distâncias, restaurantes, acontecimentos ou opiniões.
- Se a resposta não estiver registrada, diga de forma natural: "Essa informação não está registrada no diário que tenho aqui."
- Não avise antecipadamente que você só sabe o que está no diário. Apenas responda.
- Quando houver diferença entre GPS bruto e distância curada, explique a diferença.
- Separe experiência pessoal de contexto histórico. Você pode dizer "na viagem, Diogo..." ou "neste dia...".
- Seja útil para alguém planejando a própria viagem.
- Responda em português do Brasil, em 2 a 5 parágrafos curtos, normalmente entre 70 e 180 palavras.
- Se a pergunta for sobre um lugar citado, explique rapidamente o que ele é antes de contar o que aconteceu ali.
- Não dê horários, preços ou condições atuais como se fossem válidos hoje; o relato é de setembro de 2026.

CONTEXTO DA VIAGEM:
${contextText}`;

    const gateway = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.4-mini',
        temperature: 0.2,
        max_tokens: 550,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: question }
        ]
      })
    });

    if (!gateway.ok) {
      const detail = await gateway.text().catch(() => '');
      console.error('AI Gateway', gateway.status, detail.slice(0, 500));
      return res.status(200).json(fallback());
    }

    const data = await gateway.json();
    const answer = data?.choices?.[0]?.message?.content?.trim();
    if (!answer) return res.status(200).json(fallback());

    // Offer a day deep-link only when one relevant day clearly dominates.
    let day = null;
    if (context.length === 1) day = context[0]?.dia || null;
    else {
      const q = question.toLowerCase();
      const explicit = q.match(/\bdia\s*(\d{1,2})\b/);
      if (explicit) day = Number(explicit[1]);
      else if (activeDay && context[0]?.dia === activeDay) day = activeDay;
    }

    return res.status(200).json({ answer, day, mode: 'ai' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'chat_failed' });
  }
};