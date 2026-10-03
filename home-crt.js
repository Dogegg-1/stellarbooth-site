(()=>{
 const screen=document.querySelector('.galaxy-hero'),toggle=document.querySelector('#crtToggle');
 if(!screen||!toggle)return;
 let enabled=true;try{enabled=localStorage.getItem('stellar-crt')!=='off';}catch{}
 function paint(){screen.classList.toggle('crt-off',!enabled);toggle.setAttribute('aria-pressed',String(enabled));toggle.title=enabled?'关闭 CRT 滤镜':'开启 CRT 滤镜';}
 toggle.addEventListener('click',()=>{enabled=!enabled;paint();try{localStorage.setItem('stellar-crt',enabled?'on':'off');}catch{}});
 paint();
 const power=document.querySelector('#tvPower'),content=screen.querySelector('.screen-content'),gate=screen.querySelector('.tv-power-gate');
  if(!power||!content)return;
 // A static displacement texture bends the entire composited screen, not just its bezel.
 // Generate once; no pixel readbacks or canvas drawing in the galaxy animation loop.
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.position='absolute';
 const filter=document.createElementNS(ns,'filter');filter.id='tube-curvature';
 filter.setAttribute('x','-8%');filter.setAttribute('y','-8%');filter.setAttribute('width','116%');filter.setAttribute('height','116%');filter.setAttribute('color-interpolation-filters','sRGB');
 const map=document.createElementNS(ns,'feImage');map.setAttribute('result','warp');map.setAttribute('x','0');map.setAttribute('y','0');map.setAttribute('width','100%');map.setAttribute('height','100%');map.setAttribute('preserveAspectRatio','none');
 const texture=document.createElement('canvas');texture.width=texture.height=256;
 const context=texture.getContext('2d'),pixels=context.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const nx=x/255*2-1,ny=y/255*2-1,i=(y*256+x)*4;
   pixels.data[i]=Math.round(128+110*nx*ny*ny);pixels.data[i+1]=Math.round(128+110*ny*nx*nx);pixels.data[i+2]=128;pixels.data[i+3]=255;
 }
 context.putImageData(pixels,0,0);map.setAttribute('href',texture.toDataURL());
 const bend=document.createElementNS(ns,'feDisplacementMap');bend.setAttribute('in','SourceGraphic');bend.setAttribute('in2','warp');bend.setAttribute('xChannelSelector','R');bend.setAttribute('yChannelSelector','G');
 const resizeBend=()=>bend.setAttribute('scale',screen.clientWidth<641?'24':'58');
 resizeBend();new ResizeObserver(resizeBend).observe(screen);
 filter.append(map,bend);svg.append(filter);document.body.append(svg);
 screen.classList.add('tube-curved');
 power.addEventListener('click',()=>{
   if(screen.dataset.power!=='off')return;
   power.disabled=true;screen.dataset.power='on';screen.classList.remove('tv-off');
   screen.dispatchEvent(new Event('stellar-power'));
   const finish=()=>{screen.classList.remove('tv-starting');gate.hidden=true;content.inert=false;screen.querySelector('.galaxy-actions a')?.focus({preventScroll:true});};
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return;}
   screen.classList.add('tv-starting');
   content.addEventListener('animationend',event=>{if(event.target===content)finish();},{once:true});
   // Complete even when animations are disabled or the tab loses visibility.
   setTimeout(()=>{if(content.inert)finish();},1550);
 });
})();
