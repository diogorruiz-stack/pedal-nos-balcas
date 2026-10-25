#!/usr/bin/env node
/**
 * One-time migration: assets/originals/dia-01 ... dia-14 -> public/imagens/dia-01 ... dia-14
 * Never fetches expiring URLs or uses remote storage.
 * Requires: npm install (sharp already in package.json).
 * Existing titles/captions are read from photos-complete-drive.js where available.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const sharp=require('sharp');
const convert=require('heic-convert');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'assets','originals'),dest=path.join(root,'public','imagens');
const supported=/\.(jpe?g|png|webp|heic|heif)$/i;
const natural=(a,b)=>a.localeCompare(b,'en',{numeric:true,sensitivity:'base'});
function originalName(f){return path.parse(f).name.toUpperCase().replace(/[^A-Z0-9]/g,'')}
function loadCaptions(){
 const ctx={window:{PHOTO_DATA:{},COMPLETE_DAY_PHOTOS:{}}};
 vm.createContext(ctx);
 const file=path.join(root,'photos-complete-drive.js');
 if(fs.existsSync(file))vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{timeout:1000});
 return ctx.window.COMPLETE_DAY_PHOTOS||{};
}
async function main(){
 const descriptions=loadCaptions(),days=[],errors=[];
 for(let day=1;day<=14;day++){
  const dayFolder='dia-'+String(day).padStart(2,'0');
  const input=path.join(source,dayFolder);
  if(!fs.existsSync(input)){errors.push('Pasta original ausente: '+input);continue}
  const files=fs.readdirSync(input).filter(f=>supported.test(f)).sort(natural);
  if(!files.length){errors.push('Nenhuma foto em '+input);continue}
  const rows=descriptions[day]||[];
  const captionMap=new Map(rows.map(row=>[originalName(row[0].replace(/^d\d+[a-z]*_/i,'')),row]));
  const known=new Set(),photos=[];
  for(let i=0;i<files.length;i++){
   const file=files[i],stem=originalName(file);
   if(known.has(stem)){errors.push('Nome duplicado no Dia '+day+': '+file);continue}
   known.add(stem);
   const matched=captionMap.get(stem),title=matched?.[1]||'',caption=matched?.[2]||'';
   const name=String(i+1).padStart(3,'0')+'.webp';
   const output=path.join(dest,dayFolder,name);
   fs.mkdirSync(path.dirname(output),{recursive:true});
   const raw=fs.readFileSync(path.join(input,file));
   const decoded=/\.hei[cf]$/i.test(file)?Buffer.from(await convert({buffer:raw,format:'JPEG',quality:0.92})):raw;
   await sharp(decoded).rotate().resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true}).webp({quality:84,effort:4}).toFile(output);
   const bytes=fs.readFileSync(output);
   photos.push({ordem:i+1,arquivo:'/imagens/'+dayFolder+'/'+name,original:file,titulo:title,legenda:caption,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
  days.push({dia:day,fotos:photos});
 }
 if(errors.length){console.error(errors.join('\n'));process.exitCode=1;return}
 fs.mkdirSync(path.join(root,'dados'),{recursive:true});
 fs.writeFileSync(path.join(root,'dados','fotografias.json'),JSON.stringify({versao:1,dias:days},null,2)+'\n');
 console.log('Catálogo estático gerado:',days.reduce((s,d)=>s+d.fotos.length,0),'imagens, 14 dias');
}
main().catch(err=>{console.error(err);process.exitCode=1});
