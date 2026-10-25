const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const rpath=path.join(root,'dados','relatorio-recuperacao.json'),cpath=path.join(root,'dados','fotografias-recuperadas.json');
const report=JSON.parse(fs.readFileSync(rpath)),catalog=JSON.parse(fs.readFileSync(cpath));
const failed=[],recovered=[];let next=0;const jobs=report.missingRemote.filter(x=>x.source.startsWith('https://izelw0312hubtv8g.public.blob.vercel-storage.com/'));
async function worker(){
 while(next<jobs.length){
  const job=jobs[next++];try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
   let res;try{res=await fetch(job.source,{signal:controller.signal})}finally{clearTimeout(timer)}
   if(!res.ok)throw Error('HTTP '+res.status);
   const type=res.headers.get('content-type')||'';
   if(!type.startsWith('image/'))throw Error('Unexpected content-type '+type);
   const data=Buffer.from(await res.arrayBuffer());
   if(data.length<100||data.length>15000000)throw Error('Bad size '+data.length);
   const ext=/webp/i.test(type)?'webp':/png/i.test(type)?'png':'jpg';
   const folder='dia-'+String(job.dia).padStart(2,'0'),name=job.key.replace(/[^a-zA-Z0-9_-]/g,'_')+'.'+ext;
   const url='/imagens/'+folder+'/'+name,location=path.join(root,'public',url.slice(1));
   fs.mkdirSync(path.dirname(location),{recursive:true});fs.writeFileSync(location,data);
   const day=catalog.dias.find(d=>d.dia===job.dia);
   day.fotos.push({ordem:0,chave:job.key,arquivo:url,titulo:'',legenda:'',sha256:crypto.createHash('sha256').update(data).digest('hex')});
   recovered.push({dia:job.dia,key:job.key,url});
  }catch(e){failed.push({dia:job.dia,key:job.key,error:String(e.message)})}
 }
}
(async()=>{await Promise.all(Array.from({length:8},worker));
for(const day of catalog.dias){day.fotos.sort((a,b)=>a.chave.localeCompare(b.chave,'en',{numeric:true}));day.fotos.forEach((p,i)=>p.ordem=i+1)}
fs.writeFileSync(cpath,JSON.stringify(catalog,null,2));
report.remoteRecovered=recovered.length;report.remoteFailed=failed;
report.missingRemote=report.missingRemote.filter(x=>!recovered.some(y=>x.key===y.key&&x.dia===y.dia));
fs.writeFileSync(rpath,JSON.stringify(report,null,2));
console.log(JSON.stringify({attempted:jobs.length,recovered:recovered.length,failed:failed.length,examples:failed.slice(0,8)}));
})().catch(e=>{console.error(e);process.exit(1)});
