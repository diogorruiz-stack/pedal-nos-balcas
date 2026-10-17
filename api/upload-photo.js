const { put } = require('@vercel/blob');
module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'});
  if(req.headers['x-upload-secret']!=='gallery-20261017-migrate') return res.status(403).json({error:'forbidden'});
  const rawName=String(req.headers['x-filename']||'').trim();
  const filename=rawName.replace(/[^a-zA-Z0-9._\/-]/g,'_').replace(/^\/+/, '');
  if(!filename || filename.includes('..')) return res.status(400).json({error:'bad_filename'});
  const chunks=[]; let total=0;
  for await (const chunk of req){ total+=chunk.length; if(total>6_000_000) return res.status(413).json({error:'too_large'}); chunks.push(chunk); }
  if(!total) return res.status(400).json({error:'empty'});
  const body=Buffer.concat(chunks);
  const blob=await put('curated/'+filename,body,{access:'public',addRandomSuffix:false,contentType:'image/jpeg',cacheControlMaxAge:31536000});
  return res.status(200).json({ok:true,url:blob.url,pathname:blob.pathname,size:body.length});
};