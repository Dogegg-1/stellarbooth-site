/* This navigation and its selection marker survive all content page loads. */
(()=>{
 if(!window.StellarShell)return;
 const frame=document.querySelector('#siteContent'),nav=document.querySelector('.global-site-nav');if(!frame||!nav)return;
 const links=[...nav.querySelectorAll('[data-nav-key]')],slider=document.createElement('i');slider.className='nav-slider no-motion';slider.setAttribute('aria-hidden','true');nav.prepend(slider);let selected='home';
 function place(){const item=links.find(a=>a.dataset.navKey===selected);if(!item)return;const r=item.getBoundingClientRect(),n=nav.getBoundingClientRect();slider.style.width=r.width+'px';slider.style.height=r.height+'px';slider.style.transform=`translate(${r.left-n.left}px,${r.top-n.top}px)`;}
 function select(key){selected=key;for(const a of links){if(a.dataset.navKey===key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}place();}
 function sync(){try{const url=new URL(frame.contentWindow.location.href),name=url.pathname;select(name.includes('/tools/')||name.endsWith('/tools.html')?'tools':name.endsWith('/map.html')?'map':name.endsWith('/about.html')||name.endsWith('/intake.html')?'about':'home');}catch{}}
 nav.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();const key=a.dataset.navKey||'home';select(key);frame.src=new URL(key==='home'?'station-scene.html':key==='tools'?'tools.html':key==='map'?'map.html':'about.html',location.href).href;});
 frame.addEventListener('load',sync);new ResizeObserver(place).observe(nav);window.addEventListener('resize',place);document.fonts?.ready.then(place);sync();requestAnimationFrame(()=>requestAnimationFrame(()=>slider.classList.remove('no-motion')));
})();
