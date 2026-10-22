const { put } = require('@vercel/blob');
const convert = require('heic-convert');
const sharp = require('sharp');

const REPO='diogorruiz-stack/pedal-nos-balcas';
const BRANCH='gallery-transfer';
const SECRET='gallery-20261017-migrate';

function safeStem(name, fallback){
  return String(name||'').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_').replace(/^_+|_+$/g,'')||fallback;
}
module.exports=async function handler(req,res){
  try{
    if(req.method!=='GET') return res.status(405).json({error:'method_not_allowed'});
    if(String(req.query.key||'')!==SECRET) return res.status(403).json({error:'forbidden'});
    const day=Number(req.query.day||0),start=Math.max(0,Number(req.query.start||0));
    const count=Math.max(1,Math.min(2,Number(req.query.count||2)));
    if(![7,10,11,13].includes(day)) return res.status(400).json({error:'bad_day'});
    const root=`https://raw.githubusercontent.com/${REPO}/${BRANCH}/transfer/day${day}`;
    const mr=await fetch(root+'/manifest.json?ts='+Date.now(),{cache:'no-store'});
    if(!mr.ok) return res.status(502).json({error:'manifest_fetch_failed',status:mr.status});
    const manifest=await mr.json();
    const slice=(manifest.photos||[]).slice(start,start+count);
    const out=[];
    for(let i=0;i<slice.length;i++){
      const photo=slice[i];
      const rr=await fetch(photo.sourceUrl,{cache:'no-store'});
      if(!rr.ok) throw new Error(`source ${start+i} ${photo.name} -> ${rr.status}`);
      const raw=Buffer.from(await rr.arrayBuffer());
      let input=raw;
      if(/heic|heif/i.test(photo.name||'')) input=Buffer.from(await convert({buffer:raw,format:'JPEG',quality:0.9}));
      const optimized=await sharp(input).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).jpeg({quality:84,mozjpeg:true}).toBuffer();
      const stem=safeStem(photo.stem||photo.name,`photo_${start+i+1}`);
      const pathname=`curated/day${day}/${stem}.jpg`;
      const blob=await put(pathname,optimized,{access:'public',addRandomSuffix:false,allowOverwrite:true,contentType:'image/jpeg',cacheControlMaxAge:31536000});
      out.push({index:start+i,name:photo.name,url:blob.url,size:optimized.length});
    }
    return res.status(200).json({ok:true,day,start,count:out.length,total:(manifest.photos||[]).length,photos:out});
  }catch(err){
    return res.status(500).json({error:'migration_failed',detail:String(err&&err.message||err)});
  }
};