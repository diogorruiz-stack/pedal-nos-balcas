const fs=require('fs'),path=require('path');
const dir=path.resolve(__dirname,'../i18n');
const pt=JSON.parse(fs.readFileSync(path.join(dir,'pt-BR.json'),'utf8'));
function ensure(v,label){if(typeof v!=='string'||!v.trim())throw Error(label+' empty')}
for(const lang of ['en','es']){
 const data=JSON.parse(fs.readFileSync(path.join(dir,lang+'.json'),'utf8'));
 if(data.days.length!==pt.days.length||data.days.length!==14)throw Error(lang+' day count');
 for(let i=0;i<14;i++){
  const a=pt.days[i],b=data.days[i];if(a.day!==b.day)throw Error(lang+' day mismatch '+i);
  for(const k of ['route','hook','summary','context','practical','food']){
   if(a[k]&&typeof a[k]==='string')ensure(b[k],lang+' day '+a.day+' '+k);
  }
  for(const k of ['story','stops','photos']){
   if(!Array.isArray(b[k])||b[k].length!==a[k].length)throw Error(lang+' day '+a.day+' '+k+' count');
  }
  for(let j=0;j<a.photos.length;j++){
   if(b.photos[j].id!==a.photos[j].id)throw Error(lang+' day '+a.day+' photo ID changed');
   for(const k of ['title','caption'])if(a.photos[j][k])ensure(b.photos[j][k],lang+' photo '+j+' '+k);
  }
  for(let j=0;j<a.story.length;j++)if(a.story[j])ensure(b.story[j],lang+' story '+j);
 }
 console.log(lang+': 14 days and all photo IDs validated');
}
