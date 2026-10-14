module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const oidc=Boolean(process.env.VERCEL_OIDC_TOKEN);
  const apiKey=Boolean(process.env.AI_GATEWAY_API_KEY);
  const token=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
  if(!token)return res.status(200).json({ok:false,oidc,apiKey,error:'no_token'});
  try{
    const r=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({model:'anthropic/claude-sonnet-5',max_tokens:24,messages:[{role:'user',content:'Responda somente: ok'}]})
    });
    const txt=await r.text();
    let body;try{body=JSON.parse(txt)}catch{body={raw:txt.slice(0,500)}}
    return res.status(200).json({ok:r.ok,status:r.status,oidc,apiKey,model:'anthropic/claude-sonnet-5',sample:body?.choices?.[0]?.message?.content||body?.error||body?.raw||null});
  }catch(e){return res.status(200).json({ok:false,oidc,apiKey,error:String(e).slice(0,500)})}
};