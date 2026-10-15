module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const question = String(body.question || '').trim().slice(0, 1200);
    const activeDay = Number(body.activeDay || 0);
    const context = Array.isArray(body.context) ? body.context.slice(0, 14) : [];
    const hintDays = Array.isArray(body.hintDays) ? body.hintDays.slice(0, 4) : [];
    const global = String(body.global || '').slice(0, 6000);
    const history = Array.isArray(body.history) ? body.history.slice(-8).filter(m => m && ['user','assistant'].includes(m.role) && typeof m.content === 'string').map(m => ({ role: m.role, content: m.content.slice(0, 1400) })) : [];
    if (!question) return res.status(400).json({ error: 'empty_question' });

    const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const directAnswer=()=>{
      const s=norm(question);
      if(/(km|quilometr).*(media|medio)|(?:media|medio).*(km|quilometr)/.test(s))return {answer:'Na conta simples da viagem inteira, foram cerca de 50 km pedalados por dia: quase 700 km divididos por 14 dias. Mas a média não significa que todos os dias tenham sido só de bicicleta: houve também avião, trem, ônibus, ferry, barco e táxi.',day:null,mode:'direct'};
      if(/somente.*(pedal|bike|biciclet)|so.*(pedal|bike|biciclet)|tudo.*(pedal|bike|biciclet)|apenas.*(pedal|bike|biciclet)|foi.*so.*bike|foi.*tudo.*bike/.test(s))return {answer:'Não. A bicicleta foi o fio condutor, mas a viagem não foi feita somente pedalando. O roteiro combinou bicicleta com avião, trem, ônibus, ferry, barco e, no Dia 5, táxi porque Diogo ainda estava se recuperando de uma gastroenterite. Não havia carro de apoio.',day:null,mode:'direct'};
      if(/(quantos|quantas).*\b(pais|paises|territorio|territorios)\b|\b(paises|territorios).*\b(passou|percorreu|viagem)\b/.test(s))return {answer:'A viagem passou por 7 países/territórios: Sérvia, Bósnia e Herzegovina, Croácia, Montenegro, Albânia, Kosovo e Macedônia do Norte.',day:null,mode:'direct'};
      if(/(quantos|quanto).*\bkm\b|quilometr|distancia total|km.*pedal|pedalados/.test(s))return {answer:'Foram quase 700 km pedalados ao longo dos 14 dias. Esse é o total editorial; em alguns arquivos Garmin o registro bruto inclui barco ou ferry e por isso precisa de contexto.',day:null,mode:'direct'};
      if(/(quantos|quanto).*dias|durou.*dias|duracao/.test(s))return {answer:'A viagem durou 14 dias, em setembro de 2026.',day:null,mode:'direct'};
      if(/carro.*apoio|apoio.*carro/.test(s))return {answer:'Não houve carro de apoio. A viagem combinou bicicleta, trem, ônibus, ferry, barco e improviso.',day:null,mode:'direct'};
      if(/quem.*(viajou|foi)|quantas pessoas|grupo|companheir/.test(s))return {answer:'A viagem começou com Diogo, Giggio e Guillermo. Léo entrou de surpresa em Trebinje e, a partir dali, o grupo passou a ter quatro pessoas.',day:4,mode:'direct'};
      if(/maior.*pedal|maior.*distancia/.test(s))return {answer:'O maior pedal registrado foi no Dia 11: 94,4 km entre Shtime e Skopje, depois de um ônibus curto a partir de Prizren.',day:11,mode:'direct'};
      return null;
    };
    const direct=directAnswer();
    if(direct)return res.status(200).json(direct);

    const fallback=()=>{
      const s=norm(question);
      if(/(km|quilometr).*(media|medio)|(?:media|medio).*(km|quilometr)/.test(s))return {answer:'Na viagem inteira, a média simples foi de aproximadamente 50 km pedalados por dia: quase 700 km ao longo de 14 dias. Os dias efetivamente pedalados variaram bastante porque o roteiro também usou outros transportes.',day:null,mode:'fallback'};
      if(/somente.*(pedal|bike|biciclet)|so.*(pedal|bike|biciclet)|tudo.*(pedal|bike|biciclet)|apenas.*(pedal|bike|biciclet)|foi.*so.*bike|foi.*tudo.*bike/.test(s))return {answer:'Não. A viagem misturou bicicleta, avião, trem, ônibus, ferry, barco e um trecho de táxi por motivo de saúde. A bicicleta era o fio condutor, mas não havia a regra de fazer tudo pedalando.',day:null,mode:'fallback'};
      if(/(quantos|quantas).*\b(pais|paises|territorio|territorios)\b/.test(s))return {answer:'A viagem passou por 7 países/territórios: Sérvia, Bósnia e Herzegovina, Croácia, Montenegro, Albânia, Kosovo e Macedônia do Norte.',day:null,mode:'fallback'};
      if(/(quantos|quanto).*\bkm\b|quilometr|distancia total|km.*pedal|pedalados/.test(s))return {answer:'Foram quase 700 km pedalados ao longo dos 14 dias.',day:null,mode:'fallback'};
      if(/pior.*dia|dia.*pior/.test(s))return {answer:'Se “pior” significa maior perrengue, o Dia 3 (Mostar → Ravno) foi o mais caótico: 79 km, atalho errado, espinhos e seis furos, além de um resgate de carro no fim. Em esforço físico, o Dia 11 foi o maior pedal, com 94,4 km. Em saúde, o Dia 5 foi o mais comprometido, com gastroenterite e táxi até Dubrovnik.',day:3,mode:'fallback'};
      if(/mais dificil|trecho dificil|dia dificil|mais pesado/.test(s))return {answer:'Em distância, o maior pedal foi o Dia 11: 94,4 km entre Shtime e Skopje. Em perrengue mecânico, o Dia 3 foi pior: 79 km, espinhos e seis furos.',day:11,mode:'fallback'};
      if(/koman/.test(s))return {answer:'Sim. O ferry do Lago Koman foi um dos grandes acertos da viagem. O ponto de atenção é a logística: transfer até Koman, ferry e a conexão seguinte precisam estar combinados. Depois do ferry ainda houve pedal até Bajram Curri e, mais tarde, de Gjakovë a Prizren.',day:10,mode:'fallback'};
      if(/dubrovnik.*kotor|kotor.*dubrovnik|83.?4|68 km/.test(s))return {answer:'A distância útil é aproximadamente 68 km pedalados. O Garmin registrou 83,4 km brutos porque barco e ferry entraram no arquivo.',day:6,mode:'fallback'};
      if(/sebilj/.test(s))return {answer:'O Sebilj é a fonte em forma de quiosque no centro da Baščaršija, o antigo bazar otomano de Sarajevo. A fonte original da praça era do século XVIII e a estrutura atual é do fim do século XIX. Na viagem, ele marcou o começo do primeiro pedal por Sarajevo.',day:2,mode:'fallback'};
      if(/tunnel|tunel/.test(s))return {answer:'O Tunnel of Hope foi escavado em 1993 sob a pista do aeroporto durante o cerco de Sarajevo. Tinha cerca de 800 metros e serviu como ligação vital entre a cidade sitiada e o território livre, transportando pessoas e suprimentos.',day:2,mode:'fallback'};
      if(/imperio|imperios|historia.*balca/.test(s))return {answer:'Os Bálcãs foram moldados por várias potências. No roteiro aparecem especialmente heranças romana e bizantina, séculos de domínio otomano, forte presença veneziana na costa do Adriático e influência Habsburgo/Austro-Húngara. Sarajevo e Mostar mostram muito do período otomano; Kotor carrega uma marca veneziana evidente; Sarajevo também tem uma camada austro-húngara muito visível.',day:2,mode:'fallback'};
      if(/comida.*bosnia|tipic.*bosnia|bosnia.*comer/.test(s))return {answer:'Na Bósnia, a viagem encontrou ćevapi e sirnica. Ćevapi são pequenos rolos de carne grelhada, normalmente com pão e cebola. Sirnica é uma massa recheada de queijo; na tradição bósnia, “burek” costuma designar especificamente a versão com carne. Begova čorba, klepe e dolmas também são pratos tradicionais.',day:2,mode:'fallback'};
      const tokens=s.split(/\s+/).filter(x=>x.length>4);
      let best=null,score=0;
      for(const d of context){const blob=norm(JSON.stringify(d));let sc=0;for(const t of tokens)if(blob.includes(t))sc++;if(sc>score){score=sc;best=d}}
      if(best&&score>=2)return {answer:'Isso aparece no Dia '+best.dia+' ('+best.rota+'). '+String(best.resumo||'').replace(/\s+/g,' ').trim(),day:best.dia||null,mode:'fallback'};
      return {answer:'Essa informação não está registrada com segurança no material da viagem que tenho aqui.',day:null,mode:'fallback'};
    };

    const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
    if (!token) return res.status(200).json(fallback());

    const contextText = JSON.stringify({ contexto_geral: global, dias_relevantes: hintDays, viagem_completa: context }, null, 2);
    const system = `Você é o guia interativo do site "Pedal nos Bálcãs", uma viagem real feita por Diogo Ruiz em setembro de 2026.
REGRAS:
- Responda para quem está visitando o site, não para Diogo.
- Para relatos pessoais, decisões, distâncias, preços, restaurantes, hospedagens e acontecimentos da viagem, use o CONTEXTO DA VIAGEM como fonte de verdade.
- Para perguntas históricas, culturais, geográficas ou gastronômicas sobre os países e lugares atravessados, você pode usar seu conhecimento geral. Deixe claro quando estiver dando contexto geral e não algo vivido na viagem.
- Não invente experiências pessoais, lugares visitados, datas, preços, distâncias, restaurantes ou opiniões atribuídas ao viajante.
- Se a pergunta for sobre a viagem, raciocine sobre os 14 dias completos antes de concluir que algo não está registrado. Perguntas simples sobre o formato da viagem, meios de transporte, distâncias, pessoas, comidas ou lugares devem ser respondidas pela combinação do contexto geral com os dias.\n- Se a pergunta pedir algo específico da experiência e isso realmente não estiver registrado, diga isso naturalmente, sem avisar antes.
- Se a pergunta mencionar um lugar, primeiro explique em uma ou duas frases o que é o lugar e por que ele importa; depois conecte com o que aconteceu na viagem.
- Diferencie GPS bruto de distância curada quando houver essa diferença.
- Priorize o relato real da viagem. Use contexto histórico, cultural, geográfico e gastronômico para ajudar o visitante a entender melhor o que está vendo e a planejar uma viagem semelhante.
- Seja útil para alguém que pensa em repetir a rota.
- Responda em português do Brasil, normalmente em 2 a 5 parágrafos curtos.\n- Para perguntas comparativas (pior dia, melhor trecho, mais difícil, favorito), compare os 14 dias e explique o critério em vez de procurar apenas uma palavra exata.
- Não trate horários, preços ou condições atuais como se fossem válidos hoje; o relato é de setembro de 2026.
CONTEXTO DA VIAGEM:
${contextText}`;

    let answer='',usedModel='';
    for(const model of ['openai/gpt-5.4-mini','nvidia/nemotron-3.5-lightning-free']){
      const gateway = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
        method:'POST',
        headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({
          model,
          temperature:0.15,
          max_tokens:750,
          messages:[{role:'system',content:system},...history,{role:'user',content:question}]
        })
      });
      if(!gateway.ok){console.error('AI Gateway',model,gateway.status,(await gateway.text().catch(()=>'' )).slice(0,500));continue}
      const data=await gateway.json();
      answer=data?.choices?.[0]?.message?.content?.trim()||'';
      if(answer){usedModel=model;break}
    }
    if(!answer)return res.status(200).json(fallback());

    let day=null;
    const explicit=question.toLowerCase().match(/\bdia\s*(\d{1,2})\b/);
    if(explicit)day=Number(explicit[1]);
    else if(hintDays.length===1)day=hintDays[0]?.dia||null;
    else if(activeDay&&hintDays[0]?.dia===activeDay)day=activeDay;

    return res.status(200).json({answer,day,mode:'ai',model:usedModel});
  } catch(err) {
    console.error(err);
    return res.status(500).json({error:'chat_failed'});
  }
};