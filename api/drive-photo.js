const MAP={d1_shop:'1joPtH33vFqG4VNipm8eRDnXxAWelPeea'};
module.exports=async function handler(req,res){
  const key=String(req.query?.key||'');
  const id=MAP[key];
  if(!id)return res.status(404).end('not found');
  try{
    const url='https://drive.google.com/uc?export=download&id='+encodeURIComponent(id);
    const r=await fetch(url,{redirect:'follow'});
    if(!r.ok)return res.status(502).end('drive error');
    const ct=r.headers.get('content-type')||'image/jpeg';
    if(!ct.startsWith('image/'))return res.status(502).end('not image');
    const buf=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type',ct);
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    return res.status(200).end(buf);
  }catch(e){console.error(e);return res.status(500).end('photo error')}
};