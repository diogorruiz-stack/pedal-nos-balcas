const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'i18n');
const source=JSON.parse(fs.readFileSync(path.join(dir,'pt-BR.json'),'utf8'));
const token=process.env.OPENAI_API_KEY;
if(!token)throw Error('OPENAI_API_KEY GitHub secret missing. Add it before running this workflow.');
async function translate(items,lang){
 const payload=items.map(({day,data})=>({day,data}));
 const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({
 model:'gpt-4.1-mini',temperature:0.2,response_format:{type:'json_object'},messages:[
 {role:'system',content:'You are a precise professional travel-diary translator. Translate Portuguese into '+(lang==='en'?'English':'Spanish')+'. Preserve ALL information, chronology, names, distances, numbers, humor and meaning. Keep HTML tags unchanged. Never summarize. Return a JSON object with key days, an array of objects with exactly the input structure. Keep day numbers and photo IDs unchanged. Do not alter text that is a path or identifier.'},
 {role:'user',content:JSON.stringify({days:payload})}
 ]})});
 if(!response.ok)throw Error('OpenAI request failed: '+response.status+' '+(await response.text()).slice(0,400));
 const value=JSON.parse((await response.json()).choices[0].message.content);
 if(!Array.isArray(value.days)||value.days.length!==items.length)throw Error('Unexpected translation response shape');
 return value.days;
}
(async()=>{
 for(const lang of ['en','es']){
  const days=[];
  for(const d of source.days){
   const payload={route:d.route,hook:d.hook,summary:d.summary,context:d.context,story:d.story,practical:d.practical,food:d.food,stops:d.stops,photos:d.photos};
   const result=await translate([{day:d.day,data:payload}],lang);
   const one=result[0],v=one.data;
   if(one.day!==d.day||!v)throw Error('Day '+d.day+' malformed');
   days.push({day:d.day,...v});console.log(lang,'day',d.day,'translated');
  }
  fs.writeFileSync(path.join(dir,lang+'.json'),JSON.stringify({version:1,days},null,2)+'\n');
 }
})().catch(e=>{console.error(e);process.exit(1)});
