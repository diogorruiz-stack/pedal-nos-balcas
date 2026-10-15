module.exports=function handler(req,res){
  const country=String(req.headers['x-vercel-ip-country']||'').toUpperCase().slice(0,2)||null;
  const language=country==='BR'?'pt-BR':'en';
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.status(200).json({country,language});
};