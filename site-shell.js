/* Navigation replaces only the content frame; the audio owner never unloads. */
(()=>{
 const base=new URL('./',location.href);
 if(parent!==window&&parent.StellarShell){location.replace(new URL('station-scene.html'+location.search+location.hash,base));return;}
 window.StellarShell=true;
 const frame=document.querySelector('#siteContent'),requested=new URLSearchParams(location.search).get('page');
 let target=new URL(requested||'station-scene.html',base);
 if(target.origin!==base.origin||!target.pathname.startsWith(base.pathname)||!target.pathname.endsWith('.html')||target.pathname===base.pathname+'index.html')target=new URL('station-scene.html',base);
 const legacy=window.StationRoutes.resolve(location.href,location.href);if(!requested&&legacy)target=new URL(legacy);
 frame.src=target.href;
 frame.addEventListener('load',()=>{try{document.title=frame.contentDocument.title||'星游集 StellarBooth';}catch{}});
})();
