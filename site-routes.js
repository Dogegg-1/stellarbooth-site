(function(root){
 const api={resolve(href,base){const u=new URL(href,base),b=new URL(base);if(u.origin!==b.origin||(!/(?:index|home-classic)\.html$/.test(u.pathname)&&!u.pathname.endsWith('/')))return null;
 if(u.searchParams.has('project')||['map','gallery'].includes(u.searchParams.get('view')))return new URL('map.html'+u.search+u.hash,u).href;
 if(u.hash==='#works')return new URL('map.html?view=gallery',u).href;
 if(['#about','#events','#services','#space','#partners','#contact','#participation'].includes(u.hash))return new URL('about.html'+u.hash,u).href;return null;}};
 if(typeof module==='object')module.exports=api;else{root.StationRoutes=api;if(document.body?.classList.contains('station-page')||document.documentElement.dataset.stationEntry==='true'){const next=api.resolve(location.href,location.href);if(next)location.replace(next);}}
})(typeof window==='object'?window:globalThis);

