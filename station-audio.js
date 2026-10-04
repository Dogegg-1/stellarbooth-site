/* Shared ambience for full-page navigation. Preferences and playhead stay in this tab. */
(()=>{
 if(window.StellarAudio||new URLSearchParams(location.search).get('station')==='1')return;
 const owner=parent!==window&&parent.StellarShell;
 if(owner){const spacing=document.createElement('style');spacing.textContent='@media(max-width:850px){body[data-site-page]>.global-site-nav{padding-right:64px!important}}';document.head.append(spacing);document.querySelector('.station-audio')?.remove();const unlock=()=>parent.StellarAudioUnlock?.();document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);return;}
 if(document.body.dataset.siteShell!=='true'){
 const root=new URL('./',document.currentScript.src);const entry=new URL('index.html',root);entry.searchParams.set('page',location.href);location.replace(entry.href);return;
 }
 window.StellarAudio=true;
 const base=new URL('./',document.currentScript.src),key='stellar-audio-v1';let saved={};
 try{saved=JSON.parse(sessionStorage.getItem(key)||'{}');}catch{}
 let enabled=saved.enabled!==false,waiting=false,attempt=0;
 let toggle=document.querySelector('#audioToggle'),volume=document.querySelector('#audioVolume');
 if(!toggle){const panel=document.createElement('div');panel.className='station-audio';panel.innerHTML='<button id="audioToggle" type="button" aria-label="背景声音开关"></button><input id="audioVolume" type="range" min="0" max="100" value="35" aria-label="背景音乐音量" hidden>';document.body.append(panel);toggle=panel.querySelector('button');volume=panel.querySelector('input');}
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('site-audio.css?v=3',base).href;document.head.append(style);
 const track=new Audio(new URL('assets/audio/deep-space-static.mp3',base).href);track.loop=true;track.preload='metadata';
 volume.value=Number.isFinite(saved.volume)?Math.max(0,Math.min(100,saved.volume)):35;
 function save(){try{sessionStorage.setItem(key,JSON.stringify({enabled,volume:Number(volume.value),time:track.currentTime||0}));}catch{}}
 function paint(){const active=enabled&&!waiting;toggle.setAttribute('aria-pressed',String(active));toggle.title=!enabled?'开启背景声音':waiting?'点击开启声音':'关闭背景声音';toggle.setAttribute('aria-label',toggle.title);toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>'+ (active?'<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>':'<path d="m16 9 5 6m0-6-5 6"/>')+'</svg>';}

 async function play(){if(!enabled)return;const token=++attempt;try{await track.play();if(!enabled)track.pause();waiting=false;}catch(e){if(token!==attempt)return;waiting=true;}paint();}
 track.addEventListener('loadedmetadata',()=>{if(Number.isFinite(saved.time)&&saved.time>0&&Number.isFinite(track.duration))track.currentTime=saved.time%track.duration;});
 track.addEventListener('timeupdate',save);
 toggle.addEventListener('click',()=>{if(waiting&&enabled){play();return;}enabled=!enabled;if(enabled)play();else{attempt++;track.pause();waiting=false;}save();paint();});
 volume.addEventListener('input',()=>{track.volume=Number(volume.value)/100;save();});
 const unlock=e=>{if(enabled&&waiting&&!e.target.closest?.('.station-audio'))play();};
 document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
 window.addEventListener('pagehide',()=>{save();attempt++;track.pause();});
 window.addEventListener('pageshow',e=>{if(e.persisted){try{const next=JSON.parse(sessionStorage.getItem(key)||'{}');enabled=next.enabled!==false;volume.value=next.volume??35;track.volume=Number(volume.value)/100;if(Number.isFinite(next.time)&&Number.isFinite(track.duration))track.currentTime=next.time%track.duration;}catch{}paint();if(enabled)play();}});
 window.StellarAudioUnlock=()=>{if(enabled&&waiting)play();};
 track.volume=Number(volume.value)/100;paint();if(enabled)play();
})();
