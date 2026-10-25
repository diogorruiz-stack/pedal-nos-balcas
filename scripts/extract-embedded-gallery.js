const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const context={window:{PHOTO_DATA:{},COMPLETE_DAY_PHOTOS:{}},console};
vm.createContext(context);
const js=fs.readdirSync(root).filter(p=>/^(photos-v05-\d+|photos-extra-[\w-]+|photos-complete-drive)\.js$/.test(p)).sort();
for(const f of js){try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{timeout:15000,filename:f})}catch(e){console.warn('WARN',f,e.message)}}
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=context.window.PHOTO_DATA;
const complete=context.window.COMPLETE_DAY_PHOTOS;
const entries=[];
const rx=/^(?:d(\d+)[a-z]*_)/i;
for(const [key,value] of Object.entries(source)){
 const m=key.match(rx);if(!m)continue;
 const day=Number(m[1]);if(day<1||day>14)continue;
 entries.push({day,key,value});
}
const catalog={versao:1,dias:[]};const report={days:{},missingRemote:[],embedded:0};
for(let day=1;day<=14;day++){
 const candidates=entries.filter(e=>e.day===day);
 const info=(complete[day]||[]).map((p,i)=>({key:p[0],title:p[1]||'',caption:p[2]||'',rank:i}));
 const lookup=new Map(info.map(o=>[o.key,o]));
 const sorted=candidates.sort((a,b)=>{
  const ai=lookup.get(a.key)?.rank,bi=lookup.get(b.key)?.rank;
  if(ai!==undefined&&bi!==undefined)return ai-bi;
  if(ai!==undefined)return -1;if(bi!==undefined)return 1;
  return a.key.localeCompare(b.key,'en',{numeric:true});
 });
 const photos=[];
 for(const e of sorted){
  const match=typeof e.value==='string'&&e.value.match(/^data:image\/(webp|jpeg|jpg|png);base64,([a-zA-Z0-9+/=]+)$/);
  if(!match){report.missingRemote.push({dia:day,key:e.key,source:typeof e.value==='string'?e.value.slice(0,130):''});continue}
  const ext=match[1]==='jpeg'?'jpg':match[1];const bytes=Buffer.from(match[2],'base64');
  const folder='dia-'+String(day).padStart(2,'0');
  const name=e.key.replace(/[^a-zA-Z0-9_-]/g,'_')+'.'+ext;
  const url='/imagens/'+folder+'/'+name;
  const dst=path.join(root,'public',url.slice(1));
  fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,bytes);
  const details=lookup.get(e.key)||{};
  photos.push({ordem:photos.length+1,chave:e.key,arquivo:url,titulo:details.title||'',legenda:details.caption||'',sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  report.embedded++;
 }
 catalog.dias.push({dia:day,fotos:photos});
 report.days[day]={available:candidates.length,embedded:photos.length,remote:candidates.length-photos.length};
}
fs.mkdirSync(path.join(root,'dados'),{recursive:true});
fs.writeFileSync(path.join(root,'dados','fotografias-recuperadas.json'),JSON.stringify(catalog,null,2));
fs.writeFileSync(path.join(root,'dados','relatorio-recuperacao.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({embedded:report.embedded,remote:report.missingRemote.length,days:report.days}));
