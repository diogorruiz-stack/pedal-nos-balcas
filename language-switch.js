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
 select.addEventListener('change',()=>{localStorage.setItem(key,select.value);apply(select.value);});
 apply(selected);
})();
