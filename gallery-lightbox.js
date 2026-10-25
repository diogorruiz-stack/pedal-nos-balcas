/* Full-size gallery viewer — click any photo to see the uncropped original. */
(function(){
  'use strict';
  const style=document.createElement('style');
  style.textContent=`
    #photoLightbox{position:fixed;inset:0;z-index:10000;background:#0c1311;display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;padding:72px 74px 0}
    #photoLightbox.is-open{display:flex}
    #photoLightbox img{display:block;max-width:100%;max-height:calc(100dvh - 235px);width:auto;height:auto;object-fit:contain;user-select:none;min-height:0;flex:0 1 auto}
    #photoLightbox button{position:absolute;z-index:3;border:1px solid rgba(255,255,255,.32);background:rgba(15,24,22,.85);color:white;cursor:pointer;border-radius:50%;width:46px;height:46px;font-size:27px;display:grid;place-items:center;transition:background .18s}
    #photoLightbox button:hover{background:#263a33}
    #photoLightbox button:focus-visible{outline:3px solid #e5ad55;outline-offset:3px}
    #photoLightbox .lb-close{top:18px;right:24px}
    #photoLightbox .lb-prev{left:18px;top:46%;transform:translateY(-50%)}
    #photoLightbox .lb-next{right:18px;top:46%;transform:translateY(-50%)}
    #photoLightbox .lb-details{position:relative;flex:0 0 auto;align-self:stretch;margin-top:18px;padding:16px 0 20px;text-align:center;background:transparent;pointer-events:none;max-width:900px;margin-left:auto;margin-right:auto}
    #photoLightbox .lb-details strong{display:block;font:400 clamp(24px,3vw,36px)/1.14 Georgia,'Times New Roman',serif;letter-spacing:-.025em;color:#f5f0e6;margin:0 0 9px;text-wrap:balance}
    #photoLightbox .lb-details span{display:block;font:400 14px/1.65 Inter,system-ui,sans-serif;color:#d4d8d2;max-width:760px;margin:0 auto}
    #photoLightbox .lb-counter{font:700 11px/1.4 Inter,system-ui,sans-serif;letter-spacing:.16em;color:#e5ad55;margin-top:12px}
    .top-media,.photo-rail .rail-card{cursor:zoom-in}
    @media(max-width:640px){
      #photoLightbox{padding:62px 12px 0}
      #photoLightbox img{max-width:100%;max-height:calc(100dvh - 285px)}
      #photoLightbox .lb-close{top:10px;right:12px}
      #photoLightbox .lb-prev{left:8px;top:42%;transform:translateY(-50%)}
      #photoLightbox .lb-next{right:8px;top:42%;transform:translateY(-50%)}
      #photoLightbox .lb-details{margin-top:14px;padding:10px 12px 22px}
      #photoLightbox .lb-details strong{font-size:25px}
      #photoLightbox .lb-details span{font-size:12px;line-height:1.5}
    }
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
    const container=e.target.closest?.('.top-media, .photo-rail .rail-card');
    if(container && !e.target.closest('button, a')){
      const img=container.querySelector('img');
      if(img){open(img);return;}
    }
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