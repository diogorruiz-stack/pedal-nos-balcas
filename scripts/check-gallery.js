const fs=require('fs');
const target=JSON.parse(fs.readFileSync('migration-target.json','utf8'));
const base='https://izelw0312hubtv8g.public.blob.vercel-storage.com/curated';

async function main(){
  for(const day of target.days||[]){
    const url=`https://raw.githubusercontent.com/diogorruiz-stack/pedal-nos-balcas/gallery-transfer/transfer/day${day}/manifest.json?ts=${Date.now()}`;
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok) throw new Error(`manifest day ${day} -> ${r.status}`);
    const m=await r.json();
    for(const p of m.photos||[]){
      const stem=String(p.stem||p.name||'').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_').replace(/^_+|_+$/g,'');
      const img=`${base}/day${day}/${stem}.jpg`;
      const h=await fetch(img,{method:'HEAD',cache:'no-store'});
      if(!h.ok) throw new Error(`missing day ${day} ${stem}: ${h.status}`);
    }
    console.log(`verified day ${day}: ${(m.photos||[]).length} photos`);
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
