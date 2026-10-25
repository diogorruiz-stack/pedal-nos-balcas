#!/usr/bin/env node
/** Strict offline consistency checks. Fail build on missing, extra, unreadable or mismatched assets. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..');
async function main(){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'dados','fotografias.json'),'utf8'));
 const errors=[],seen=new Set();
 if(manifest.dias.length!==14)errors.push('São obrigatórios 14 dias');
 for(let day=1;day<=14;day++){
  const d=manifest.dias.find(x=>x.dia===day);
  if(!d||!Array.isArray(d.fotos)||!d.fotos.length){errors.push('Dia sem fotos: '+day);continue}
  for(let n=0;n<d.fotos.length;n++){
   const photo=d.fotos[n],url=photo.arquivo;
   if(photo.ordem!==n+1)errors.push('Ordem inválida no Dia '+day);
   if(!/^\/imagens\/dia-\d{2}\/\d{3}\.webp$/.test(url)){errors.push('URL não estática: '+url);continue}
   if(seen.has(url))errors.push('Arquivo duplicado: '+url);
   seen.add(url);
   const loc=path.join(root,'public',url.slice(1));
   if(!fs.existsSync(loc)){errors.push('Arquivo ausente: '+url);continue}
   const data=fs.readFileSync(loc),hash=crypto.createHash('sha256').update(data).digest('hex');
   if(hash!==photo.sha256)errors.push('Hash divergente: '+url);
   try{const meta=await sharp(data).metadata();if(!meta.width||!meta.height)errors.push('Imagem sem dimensões: '+url)}
   catch{errors.push('Imagem ilegível: '+url)}
  }
 }
 const base=path.join(root,'public','imagens');
 if(fs.existsSync(base)){
  for(let d of fs.readdirSync(base,{withFileTypes:true}).filter(x=>x.isDirectory())){
   for(let f of fs.readdirSync(path.join(base,d.name))){
    const url='/imagens/'+d.name+'/'+f;if(!seen.has(url))errors.push('Arquivo não catalogado: '+url);
   }
  }
 }
 if(errors.length){console.error('REPROVADO: '+errors.length+' erro(s)\n'+errors.join('\n'));process.exit(1)}
 console.log('APROVADO: '+seen.size+' arquivos íntegros em 14 dias; nenhuma URL temporária.');
}
main().catch(err=>{console.error(err);process.exit(1)});
