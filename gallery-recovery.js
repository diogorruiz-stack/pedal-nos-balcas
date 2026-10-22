/* Gallery image recovery. Does not change photo order, captions or cover. */
(function(){
  const failed=new Set();
  document.addEventListener('error',function(event){
    const img=event.target;
    if(!(img instanceof HTMLImageElement)||img.dataset.recovered==='yes')return;
    const source=img.getAttribute('src')||'';
    if(!source.includes('blob.vercel-storage.com/curated/day'))return;
    const match=source.match(/\/day(\d+)\/([^/?]+)\.(?:jpg|jpeg|png|webp)/i);
    if(!match)return;
    const day=Number(match[1]),stem=match[2].replace(/\.[^.]+$/,'');
    img.dataset.recovered='yes';
    const dict=window.PHOTO_DATA||{};
    const exact=Object.entries(dict).find(([key,val])=>
      (key.startsWith('d'+day+'_')||key.startsWith('d'+day+'x_')||key.startsWith('d'+day+'f_')) &&
      (key.toLowerCase().endsWith('_'+stem.toLowerCase()) || key.toLowerCase().endsWith('_'+stem.replace(/^IMG_/i,'').toLowerCase())) &&
      typeof val==='string' && val.startsWith('data:image/'));
    if(exact){
      img.src=exact[1];
      console.info('[gallery recovery]',day,stem,'embedded original');
      return;
    }
    const label='Imagem indisponível no armazenamento: '+stem;
    failed.add(day+'/'+stem);
    img.removeAttribute('src');
    img.alt=label;
    img.style.background='#eee7dc';
    img.style.objectFit='contain';
    img.style.minHeight='120px';
    console.warn('[gallery missing]',label,'Total:',failed.size);
  },true);
})();
