const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const legacy=fs.readFileSync(path.join(root,'legacy-v05.html'),'utf8');
const photoJS=fs.readFileSync(path.join(root,'photos-complete-drive.js'),'utf8');
const fixedJS=fs.readFileSync(path.join(root,'photos-fixed-local.js'),'utf8');
function evalVar(source,name,following){
 const from=source.indexOf('const '+name+'=');
 if(from<0)throw Error('Missing '+name);
 let start=from+('const '+name+'=').length,depth=0,quote=null,escape=false,end=-1;
 for(let i=start;i<source.length;i++){
   const c=source[i];
   if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue;}
   if(c==='"'||c==="'"||c==='`'){quote=c;continue}
   if(c==='['||c==='{')depth++;
   if(c===']'||c==='}')depth--;
   if(depth===0&&c===';'){end=i;break}
 }
 if(end<0)throw Error('Unterminated '+name);
 return vm.runInNewContext('('+source.slice(start,end)+')',{}, {timeout:10000});
}
const days=evalVar(legacy,'days'),enhance=evalVar(html,'ENHANCE');
const context={window:{PHOTO_DATA:{},COMPLETE_DAY_PHOTOS:{}},console};
vm.createContext(context);
vm.runInContext(photoJS+'\n'+fixedJS,context,{timeout:15000});
const curated1=evalVar(html,'CURATED_DAY1_PHOTOS');
const curated12=evalVar(html,'CURATED_DAY12_PHOTOS');
const catalog=[];
for(const day of days){
 const e=enhance[day.d]||{};
 const captionRows=(day.d===1?curated1:day.d===12?curated12:context.window.COMPLETE_DAY_PHOTOS[day.d]||day.photos||[]);
 const photos=captionRows.map(p=>({id:p[0],title:e.photoCaptions?.[p[0]]?.[0]||p[1]||'',caption:e.photoCaptions?.[p[0]]?.[1]||p[2]||''}));
 catalog.push({day:day.d,route:day.route||'',hook:e.hook||day.hook||'',summary:e.summary||day.summary||'',context:e.context||day.context||'',story:e.story||day.story||[],practical:e.practical||day.practical||'',food:e.food||day.food||'',stops:e.stops||day.stops||[],photos});
}
if(catalog.length!==14)throw Error('Expected 14 days; got '+catalog.length);
fs.mkdirSync(path.join(root,'i18n'),{recursive:true});
fs.writeFileSync(path.join(root,'i18n','pt-BR.json'),JSON.stringify({version:1,days:catalog},null,2)+'\n');
console.log('Portuguese source generated:',catalog.length,'days',catalog.reduce((n,d)=>n+d.photos.length,0),'captions');

// Updating curated gallery sources triggers an automatic no-cost translation rebuild.
