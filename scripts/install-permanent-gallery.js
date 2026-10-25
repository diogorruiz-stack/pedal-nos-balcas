const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const zipCatalog=JSON.parse(fs.readFileSync(path.join(root,'dados','catalogo-definitivo.json'),'utf8'));
const expected={7:23,10:23,11:17};
const days=zipCatalog.dias.filter(d=>expected[d.dia]);
if(days.length!==3)throw Error('O catálogo deve conter os dias 7, 10 e 11');
let js='// Gerado automaticamente de galeria-recuperada.zip. Fotos locais imutáveis.\n';
js+='window.PHOTO_DATA=window.PHOTO_DATA||{}; window.COMPLETE_DAY_PHOTOS=window.COMPLETE_DAY_PHOTOS||{};\n';
for(const day of days){
 const photos=day.fotos;
 if(photos.length!==expected[day.dia])throw Error('Dia '+day.dia+': '+photos.length+' em vez de '+expected[day.dia]);
 const seen=new Set();const pairs=[];const rows=[];
 for(const p of photos){
  if(!/^\/imagens\/dia-(07|10|11)\/[\w-]+\.jpg$/.test(p.arquivo))throw Error('Path inválido: '+p.arquivo);
  if(seen.has(p.arquivo))throw Error('Repetido: '+p.arquivo);
  seen.add(p.arquivo);
  const full=path.join(root,'public',p.arquivo.replace(/^\//,''));
  if(!fs.existsSync(full))throw Error('Foto não existe: '+p.arquivo);
  const bytes=fs.readFileSync(full);
  if(bytes.length<100 || bytes[0]!==0xff || bytes[1]!==0xd8)throw Error('JPEG inválido: '+p.arquivo);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==p.sha256)throw Error('SHA256 não corresponde: '+p.arquivo);
  const stem=path.basename(p.arquivo,'.jpg');
  const key='d'+day.dia+'f_'+stem;
  pairs.push([key,p.arquivo]);
  rows.push([key,'Registro do dia '+day.dia,'Fotografia selecionada da viagem.']);
 }
 js+='(function(){const day='+day.dia+';const previous=window.COMPLETE_DAY_PHOTOS[day]||[]; const captions=new Map(previous.map(p=>[p[0],p]));\n';
 js+='const photos='+JSON.stringify(rows)+';const paths='+JSON.stringify(Object.fromEntries(pairs))+';\n';
 js+='Object.assign(window.PHOTO_DATA,paths);window.COMPLETE_DAY_PHOTOS[day]=photos.map(p=>captions.get(p[0])||p);})();\n';
}
fs.writeFileSync(path.join(root,'photos-fixed-local.js'),js);
console.log('Local catalog validado: '+days.map(x=>x.dia+': '+x.fotos.length).join(', '));
