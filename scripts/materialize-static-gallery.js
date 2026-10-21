const fs=require('fs');
const path=require('path');
const convert=require('heic-convert');
const sharp=require('sharp');

const REPO='diogorruiz-stack/pedal-nos-balcas';
const BRANCH='gallery-transfer';
const target=JSON.parse(fs.readFileSync('gallery-materialize-target.json','utf8'));
const days=(target.days||[]).map(Number);

function safeStem(name,fallback){
  return String(name||'').replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_').replace(/^_+|_+$/g,'')||fallback;
}
async function getJson(url){
 const r=await fetch(url,{cache:'no-store'});
 if(!r.ok) throw new Error('GET '+url+' -> '+r.status);
 return r.json();
}
async function getBuffer(url){
 const r=await fetch(url,{cache:'no-store'});
 if(!r.ok) throw new Error('GET source -> '+r.status);
 return Buffer.from(await r.arrayBuffer());
}
(async()=>{
 const maps={};
 const fallback={};
 for(const day of days){
   const manifest=await getJson(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/transfer/day${day}/manifest.json?ts=${Date.now()}`);
   if(!manifest.photos?.length) throw new Error('empty day '+day);
   maps[day]={};
   fallback[day]=[];
   const dir=path.join('gallery','day'+day);
   fs.mkdirSync(dir,{recursive:true});
   for(let i=0;i<manifest.photos.length;i++){
     const p=manifest.photos[i];
     const raw=await getBuffer(p.sourceUrl);
     let input=raw;
     if(/heic|heif/i.test(p.name||'')) input=Buffer.from(await convert({buffer:raw,format:'JPEG',quality:0.9}));
     const jpg=await sharp(input).rotate().resize({width:1800,height:1800,fit:'inside',withoutEnlargement:true}).jpeg({quality:82,mozjpeg:true}).toBuffer();
     const stem=safeStem(p.stem||p.name,'photo_'+String(i+1).padStart(3,'0'));
     const filename=stem+'.jpg';
     fs.writeFileSync(path.join(dir,filename),jpg);
     const key=`d${day}f_${stem}`;
     maps[day][key]=`/gallery/day${day}/${filename}`;
     fallback[day].push([key,`Dia ${day} · arquivo pessoal`,'Registro fotográfico desta etapa da viagem.']);
     console.log(`day ${day} ${i+1}/${manifest.photos.length}: ${p.name}`);
   }
 }
 let js='window.COMPLETE_DAY_PHOTOS=window.COMPLETE_DAY_PHOTOS||{};\nwindow.PHOTO_DATA=window.PHOTO_DATA||{};\n';
 for(const day of days){
   js+='Object.assign(window.PHOTO_DATA,'+JSON.stringify(maps[day],null,2)+');\n';
   js+=`if(!Array.isArray(window.COMPLETE_DAY_PHOTOS[${day}])||!window.COMPLETE_DAY_PHOTOS[${day}].length) window.COMPLETE_DAY_PHOTOS[${day}]=`+JSON.stringify(fallback[day],null,2)+';\n';
 }
 fs.writeFileSync('photos-static-drive.js',js);
})().catch(e=>{console.error(e);process.exit(1)});