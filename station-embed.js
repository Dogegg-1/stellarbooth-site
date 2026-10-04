(()=>{if(new URLSearchParams(location.search).get('station')!=='1')return;document.body.classList.add('station-embedded');
 document.addEventListener('click',e=>{if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const a=e.target.closest('a');if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;const u=new URL(a.href,location.href);if(u.origin!==location.origin)return;if(u.hash&&u.pathname===location.pathname)u.searchParams.delete('station');e.preventDefault();const destination=new URL(window.StationRoutes?.resolve(u.href,location.href)||u.href);destination.searchParams.set('preview','receiver11');parent.location.href=destination.href;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&document.querySelector('#galaxyCard')?.hidden)parent.postMessage({type:'station-exit'},location.origin);},true);
})();

(()=>{if(new URLSearchParams(location.search).get('station')!=='1')return;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';
 const sample='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"><path fill="white" d="M4 4h1v1H4z"/></svg>');
 svg.innerHTML='<defs><filter id="embedded-pixels" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage x="0" y="0" width="9" height="9" result="sample"/><feTile in="sample" result="grid"/><feComposite in="SourceGraphic" in2="grid" operator="in"/><feMorphology operator="dilate" radius="4.5"/></filter></defs>';
 svg.querySelector('feImage').setAttribute('href',sample);document.body.prepend(svg);

const send=type=>parent.postMessage({type},location.origin);let pausedByStation=false;
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;
if(e.data?.type==='station-power'){document.querySelector('#tvPower')?.click();requestAnimationFrame(()=>send('station-powered'));}
if(e.data?.type==='station-view')document.body.classList.toggle('station-screen-far',!e.data.near);
if(e.data?.type==='station-visibility'){const b=document.querySelector('#galaxyMotion');if(!e.data.visible&&b?.getAttribute('aria-pressed')==='true'){b.click();pausedByStation=true;}else if(e.data.visible&&pausedByStation){b?.click();pausedByStation=false;}}});
send('station-ready');
})();

