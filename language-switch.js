(function(){
 const labels={
  pt:{route:'ROTEIRO',stories:'HISTÓRIAS',photos:'FOTOS',explore:'EXPLORAR A VIAGEM ↗',heading:'Pedal nos Bálcãs',intro:'Cidades antigas, estradas de montanha e planos que mudam no caminho. Uma viagem de bicicleta contada por quem esteve lá.',cta:'PERCORRER A ROTA',read:'LER AS HISTÓRIAS'},
  en:{route:'ROUTE',stories:'STORIES',photos:'PHOTOS',explore:'EXPLORE THE JOURNEY ↗',heading:'Cycling the Balkans',intro:'Ancient cities, mountain roads, and plans that change along the way. A cycling journey told by someone who was there.',cta:'EXPLORE THE ROUTE',read:'READ THE STORIES'},
  es:{route:'RUTA',stories:'HISTORIAS',photos:'FOTOS',explore:'EXPLORAR EL VIAJE ↗',heading:'Pedaleando por los Balcanes',intro:'Ciudades antiguas, carreteras de montaña y planes que cambian sobre la marcha. Un viaje en bicicleta contado por quien lo vivió.',cta:'RECORRER LA RUTA',read:'LEER LAS HISTORIAS'}
 };
 const key='pedal-language';let selected=localStorage.getItem(key);
 if(!labels[selected]){const lang=(navigator.language||'pt').toLowerCase();selected=lang.startsWith('es')?'es':lang.startsWith('pt')?'pt':'en';}
 const select=document.createElement('select');select.setAttribute('aria-label','Idioma / Language / Idioma');
 select.className='language-switch';select.innerHTML='<option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option>';select.value=selected;
 const style=document.createElement('style');style.textContent='.language-switch{background:transparent;color:var(--ink);border:1px solid rgba(23,49,41,.25);border-radius:4px;padding:7px 5px;font-size:11px;font-weight:800;cursor:pointer;margin-left:8px}';document.head.appendChild(style);
 document.querySelector('.navlinks')?.appendChild(select);
 function apply(code){
  const l=labels[code]||labels.pt;document.documentElement.lang=code==='pt'?'pt-BR':code;
  const set=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=value;};
  ['#roteiro','#historia','#fotosDia'].forEach((id,i)=>set('.navlinks a[href="'+id+'"]',[l.route,l.stories,l.photos][i]));
  set('.navlinks a.accent',l.explore);
  set('.hero p',l.intro);
  const cta=document.querySelector('.hero-actions .primary');if(cta)cta.innerHTML=l.cta+' <span>→</span>';
  const read=document.querySelector('.hero-actions .text-link');if(read)read.innerHTML=l.read+' <span>↓</span>';
  select.value=code;
 }
 const ui={
  en:{gallery:'More photos from this day',archive:'Personal archive',bridge:'YOU HAVE SEEN THE SUMMARY. NOW DIVE DEEPER.',full:'READ THE FULL STORY ↓',previous:'← PREVIOUS DAY',next:'NEXT DAY →',ask:'ASK ABOUT THE TRIP',day:'DAY',food:'Food',continue:'Continue Day {n}: the full story, places and decisions that changed the route.'},
  es:{gallery:'Más imágenes de este día',archive:'Archivo personal',bridge:'YA VISTE EL RESUMEN. AHORA DESCUBRE MÁS.',full:'LEER LA HISTORIA COMPLETA ↓',previous:'← DÍA ANTERIOR',next:'DÍA SIGUIENTE →',ask:'PREGUNTA SOBRE EL VIAJE',day:'DÍA',food:'Comida',continue:'Continúa el día {n}: la historia completa, los lugares y las decisiones que cambiaron la ruta.'},
  pt:{gallery:'Mais imagens deste dia',archive:'Arquivo pessoal',bridge:'VOCÊ VIU O RESUMO. AGORA DÁ PARA MERGULHAR.',full:'LER A HISTÓRIA COMPLETA ↓',previous:'← DIA ANTERIOR',next:'PRÓXIMO DIA →',ask:'PERGUNTE À VIAGEM',day:'DIA',food:'Comida',continue:'Continue o Dia {n}: a história completa, os lugares e as decisões que mudaram a rota.'}
 };
 function applyFixed(code){
  const t=ui[code]||ui.pt;
  const set=(selector,value)=>{const e=document.querySelector(selector);if(e&&e.textContent!==value)e.textContent=value};
  set('.photo-rail-wrap .section-kicker',t.archive);
  set('.photo-rail-wrap h3',t.gallery);
  set('.story-bridge small',t.bridge);
  set('#readFull',t.full);
  set('#prevDay',t.previous);set('#nextDay',t.next);
  const launch=document.querySelector('#chatLaunch');if(launch&&launch.textContent.trim()!=='◌ '+t.ask)launch.innerHTML='<span>◌</span> '+t.ask;
  if(typeof activeDay!=='undefined'){
    set('#bridgeText',t.continue.replace('{n}',activeDay));
    set('#dayDate',t.day+' '+activeDay);
    const food=document.querySelector('#dayFood');if(food)food.innerHTML='<b>'+t.food+':</b> '+food.textContent.replace(/^.*?:\s*/,'');
    document.querySelectorAll('.date-btn span').forEach(e=>e.textContent=t.day);
  }
 }
 let original=null,loadedLanguage='pt',generation=0;
 function ready(){try{return Array.isArray(days)&&days.length===14&&typeof selectDay==='function'}catch{return false}}
 function copy(obj){return JSON.parse(JSON.stringify(obj))}
 async function localize(code){
  const n=++generation;
  if(!ready()){setTimeout(()=>{if(n===generation)localize(code)},250);return}
  if(!original)original={days:copy(days),captions:copy(ENHANCE)};
  if(code==='pt'){
   days=copy(original.days);
   for(const [d,e] of Object.entries(original.captions)) ENHANCE[d]=copy(e);
   loadedLanguage=code;selectDay(activeDay||1);apply(code);applyFixed(code);return;
  }
  let translated;
  try{
   const response=await fetch('/i18n/'+code+'.json');
   if(!response.ok)throw Error('Missing catalog');
   translated=await response.json();
   if(!Array.isArray(translated.days)||translated.days.length!==14)throw Error('Incomplete catalog');
  }catch(error){console.error('Translation could not load',error);select.value=loadedLanguage;return}
  if(n!==generation)return;
  days=original.days.map(day=>{
   const t=translated.days.find(x=>x.day===day.d);
   if(!t)return copy(day);
   const result=copy(day);
   for(const field of ['route','hook','summary','context','story','practical','food','stops']){
    if(t[field]!==undefined&&t[field]!==null&&(!Array.isArray(t[field])||t[field].length))result[field]=t[field];
   }
   const photoMap=new Map((t.photos||[]).map(p=>[p.id,p]));
   result.photos=(result.photos||[]).map(photo=>{
    const p=photoMap.get(photo[0]);
    return p?[photo[0],p.title||photo[1],p.caption||photo[2]]:photo;
   });
   const originalEnhance=original.captions[day.d]||{};
   ENHANCE[day.d]={...copy(originalEnhance),photoCaptions:{...(originalEnhance.photoCaptions||{})}};
   for(const [id,p] of photoMap)ENHANCE[day.d].photoCaptions[id]=[p.title,p.caption];
   return result;
  });
  loadedLanguage=code;apply(code);selectDay(activeDay||1);applyFixed(code);
 }
 select.addEventListener('change',()=>{localStorage.setItem(key,select.value);localize(select.value);});
 apply(selected);localize(selected);
 const observer=new MutationObserver(()=>{if(loadedLanguage!=='pt')applyFixed(loadedLanguage)});
 const region=document.querySelector('.photo-rail-wrap');if(region)observer.observe(region,{childList:true,subtree:true});
})();
