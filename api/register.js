module.exports = async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const name=String(body.name||'').trim().slice(0,120);
    const email=String(body.email||'').trim().toLowerCase().slice(0,254);
    const interests=Array.isArray(body.interests)?body.interests.map(x=>String(x).trim()).filter(Boolean).slice(0,12):[];
    const consent=body.consent===true;
    if(name.length<2) return res.status(400).json({error:'name_required'});
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:'email_required'});
    if(!interests.length) return res.status(400).json({error:'interests_required'});
    if(!consent) return res.status(400).json({error:'consent_required'});
    const country=String(req.headers['x-vercel-ip-country']||'').toUpperCase().slice(0,2)||null;
    const language=String(body.language||((country==='BR')?'pt-BR':'en')).slice(0,12);
    const url='https://c--4d9fd686-63de-4678-8736-b8bff3775ef5-prod.lovable.cloud/rest/v1/site_visitors';
    const key='sb_publishable_Dl9TgbrJ7x_Qn0QDK_RInQ_tQPTgxeg';
    const r=await fetch(url,{
      method:'POST',
      headers:{'apikey':key,'Content-Type':'application/json','Prefer':'return=minimal'},
      body:JSON.stringify({name,email,interests,language,country_code:country,source:'pedal-nos-balcas.vercel.app',consent:true})
    });
    if(!r.ok){
      const t=await r.text().catch(()=> '');
      console.error('visitor insert',r.status,t.slice(0,500));
      return res.status(502).json({error:'save_failed'});
    }
    return res.status(200).json({ok:true,country,language});
  }catch(e){
    console.error(e);
    return res.status(500).json({error:'register_failed'});
  }
};