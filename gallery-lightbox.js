/* Full-size gallery viewer — click any photo to see the uncropped original. */
(function(){
  'use strict';
  const style=document.createElement('style');
  style.textContent=`
    #photoLightbox{position:fixed;inset:0;z-index:10000;background:rgba(4,10,9,.96);display:none;align-items:center;justify-content:center;color:#fff}
    #photoLightbox.is-open{display:flex}
    #photoLightbox img{display:block;max-width:calc(100vw - 110px);max-height:calc(100dvh - 125px);width:auto;height:auto;object-fit:contain;user-select:none}
    #photoLightbox button{position:absolute;z-index:3;border:1px solid rgba(255,255,255,.35);background:rgba(15,24,22,.72);color:white;cursor:pointer;border-radius:50%;width:45px;height:45px;font-size:26px;display:grid;place-items:center}
    #photoLightbox button:focus-visible{outline:3px solid #e5ad55;outline-offset:3px}
    #photoLightbox .lb-close{top:20px;right:20px}
    #photoLightbox .lb-prev{left:20px;top:50%;transform:translateY(-50%)}
    #photoLightbox .lb-next{right:20px;top:50%;transform:translateY(-50%)}
    #photoLightbox .lb-details{position:absolute;bottom:0;left:0;right:0;text-align:center;background:linear-gradient(transparent,rgba(0,0,0,.65));padding:20px 45px 16px;pointer-events:none;font:13px/1.5 system-ui,sans-serif}
    #photoLightbox .lb-details strong{display:block;font-size:14px}
    #photoLightbox .lb-counter{font-size:11px;opacity:.8;margin-top:4px}
    .top-media>img,.photo-rail .rail-card>img{cursor:zoom-in}
    @media(max-width:640px){#photoLightbox img{max-width:100vw;max-height:calc(100dvh - 160px)}#photoLightbox .lb-prev{left:8px;top:auto;bottom:72px;transform:none}#photoLightbox .lb-next{right:8px;top:auto;bottom:72px;transform:none}#photoLightbox .lb-close{top:12px;right:12px}#photoLightbox .lb-details{padding:12px 60px 18px}}
  `;
  document.head.appendChild(style);
  const overlay=document.createElement('div');
  overlay.id='photoLightbox'; overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Foto ampliada');
  overlay.innerHTML='<button class="lb-close" aria-label="Fechar foto ampliada">×</button><button class="lb-prev" aria-label="Foto anterior">‹</button><img alt=""><button class="lb-next" aria-label="Próxima foto">›</button><div class="lb-details"><strong></strong><span></span><div class="lb-counter"></div></div>';
  document.body.appendChild(overlay);
  const image=overlay.querySelector('img'),title=overlay.querySelector('.lb-details strong'),caption=overlay.querySelector('.lb-details span'),counter=overlay.querySelector('.lb-counter');
  let sequence=[],index=0,returnFocus=null,oldOverflow='',touchX=null;
  function update(){
    if(!sequence.length)return;
    const p=sequence[index];
    image.src=p.src;image.alt=p.title||'Fotografia ampliada';
    title.textContent=p.title||'';caption.textContent=p.caption||'';
    counter.textContent=(index+1)+' / '+sequence.length;
    overlay.querySelector('.lb-prev').disabled=sequence.length<2;
    overlay.querySelector('.lb-next').disabled=sequence.length<2;
  }
  function close(){
    if(!overlay.classList.contains('is-open'))return;
    overlay.classList.remove('is-open');image.removeAttribute('src');
    document.body.style.overflow=oldOverflow;
    if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});
  }
  function move(delta){index=(index+delta+sequence.length)%sequence.length;update();}
  function open(clicked){
    const d=typeof current==='function'?current():null;
    if(!d)return;
    const items=(typeof completePhotoList==='function'?completePhotoList(d):null) || (typeof allPhotoList==='function'?allPhotoList(d):[]);
    sequence=items.map(p=>({src:(window.PHOTO_DATA||{})[p.key],title:p.title,caption:p.caption})).filter(p=>p.src);
    if(!sequence.length)return;
    const clickedUrl=new URL(clicked.currentSrc||clicked.src,document.baseURI).href;
    index=sequence.findIndex(p=>new URL(p.src,document.baseURI).href===clickedUrl);
    if(index<0)index=0;
    returnFocus=clicked;oldOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';overlay.classList.add('is-open');update();
    overlay.querySelector('.lb-close').focus();
  }
  document.addEventListener('click',function(e){
    const img=e.target.closest?.('.top-media > img, .photo-rail .rail-card > img');
    if(img){open(img);return;}
  });
  overlay.querySelector('.lb-close').addEventListener('click',close);
  overlay.querySelector('.lb-prev').addEventListener('click',()=>move(-1));
  overlay.querySelector('.lb-next').addEventListener('click',()=>move(1));
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{
    if(!overlay.classList.contains('is-open'))return;
    if(e.key==='Escape'){e.preventDefault();close();}
    if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}
    if(e.key==='ArrowRight'){e.preventDefault();move(1);}
    if(e.key==='Tab'){
      const buttons=[...overlay.querySelectorAll('button:not(:disabled)')];
      const i=buttons.indexOf(document.activeElement);
      if(e.shiftKey&&i===0){e.preventDefault();buttons.at(-1).focus();}
      else if(!e.shiftKey&&i===buttons.length-1){e.preventDefault();buttons[0].focus();}
    }
  });
  overlay.addEventListener('touchstart',e=>{if(e.touches.length===1)touchX=e.touches[0].clientX;},{passive:true});
  overlay.addEventListener('touchend',e=>{if(touchX===null)return;const diff=e.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(diff)>55)move(diff<0?1:-1);},{passive:true});
})();