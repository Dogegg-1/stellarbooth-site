(()=>{
 const panel=document.querySelector('#browsePanel'),filterContent=document.querySelector('#filterContent');
 const advanced=document.querySelector('.primary-filters'),shortcuts=document.querySelector('#needShortcuts');
 filterContent.prepend(advanced,shortcuts);
 const settings=document.createElement('dialog');settings.className='atlas-settings';settings.id='atlasSettings';settings.setAttribute('aria-label','地图设置');
 const header=document.createElement('header');header.innerHTML='<strong>地图设置</strong><button type="button" aria-label="关闭地图设置">×</button>';settings.append(header);
 const tools=document.createElement('div');tools.className='atlas-settings-tools';
 ['focusBrowse','mapType','resetFilters','fitResults','resetMap'].forEach(id=>{const node=document.getElementById(id);tools.append(id==='mapType'?node.closest('label'):node);});settings.append(tools);document.body.append(settings);header.querySelector('button').onclick=()=>settings.close();
 settings.addEventListener('click',event=>{if(event.target===settings){const r=settings.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)settings.close();}});
 const dock=document.createElement('nav');dock.className='atlas-dock';dock.setAttribute('aria-label','星图工具');
 const icons={list:'<path d="M8 6h12M8 12h12M8 18h12M3 6h.1M3 12h.1M3 18h.1"/>',filters:'<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',fit:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/><circle cx="12" cy="12" r="3"/>'};
 [['list','清单'],['filters','筛选'],['settings','设置'],['fit','全览']].forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.dataset.tool=key;b.title=label;if(key!=='fit'){b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',key==='settings'?'atlasSettings':'filtersPanel');}b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+icons[key]+'</svg><span>'+label+'</span>';b.onclick=()=>{if(key==='settings'){settings.showModal();return;}if(key==='fit'){document.querySelector('#fitResults').click();return;}setSidebarTab(key==='list'?'list':'filters');setSidebarOpen(true);};dock.append(b);});panel.append(dock);
 document.querySelector('#applySidebar').addEventListener('click',()=>dock.querySelector('button').focus());
 document.querySelector('#closeSidebar').addEventListener('click',()=>dock.querySelector('button').focus());
 document.addEventListener('keydown',event=>{if(event.key==='Escape' && document.activeElement===document.querySelector('#openSidebar'))dock.querySelector('button').focus();});
 let lastTrigger=null;
 dock.addEventListener('click',event=>{const button=event.target.closest('button');if(button)lastTrigger=button;});
 const syncDock=()=>{
  const opened=document.querySelector('.workspace').classList.contains('sidebar-open');
  const tab=document.querySelector('#filtersTab').getAttribute('aria-pressed')==='true'?'filters':'list';
  dock.querySelectorAll('button[aria-expanded]').forEach(button=>button.setAttribute('aria-expanded',String(button.dataset.tool==='settings'?settings.open:opened&&button.dataset.tool===tab)));
  if(!opened&&!settings.open&&lastTrigger&&!document.querySelector('#detailPanel:not([hidden])')){lastTrigger.focus({preventScroll:true});lastTrigger=null;}
 };
 new MutationObserver(syncDock).observe(document.querySelector('.workspace'),{attributes:true,attributeFilter:['class']});
 new MutationObserver(syncDock).observe(settings,{attributes:true,attributeFilter:['open']});
 new MutationObserver(syncDock).observe(document.querySelector('#filtersTab'),{attributes:true,attributeFilter:['aria-pressed']});
 const stats=document.querySelector('#statsGrid');const summary=document.createElement('details');summary.className='atlas-data-summary';const title=document.createElement('summary');title.textContent='数据概况';summary.append(title,stats,document.querySelector('#dataNotice'),document.querySelector('.map-participation'));document.querySelector('.explore-bar').append(summary);
 // Keep the canvas as the page surface; secondary information lives in the side sheet.
 const brand=document.querySelector('.brand-block');
 const views=document.querySelector('.view-switch');
  document.querySelector('.topbar').prepend(brand);
 brand.replaceChildren();
 const logo=document.createElement('img');logo.src='./assets/home/stellarbooth-rabbit.png';logo.alt='星游集兔子 Logo';logo.width=48;logo.height=44;
 const heading=document.createElement('h1');heading.textContent='星游集游戏星图';brand.append(logo,heading);
 tools.prepend(views);
 tools.append(document.querySelector('.map-toolbar'),document.querySelector('#regionNav'),summary,document.querySelector('#activeFilters'));
 const viewButton=document.createElement('button');viewButton.type='button';viewButton.title='切换地图与作品展柜';viewButton.setAttribute('aria-label','切换到作品展柜');
 viewButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span>展柜</span>';
 viewButton.onclick=()=>document.querySelector(document.querySelector('#galleryView').getAttribute('aria-pressed')==='true'?'#mapView':'#galleryView').click();
 dock.prepend(viewButton);
 const syncView=()=>{const gallery=document.querySelector('#galleryView').getAttribute('aria-pressed')==='true';viewButton.querySelector('span').textContent=gallery?'地图':'展柜';viewButton.setAttribute('aria-label',gallery?'切换到资源地图':'切换到作品展柜');};
 new MutationObserver(syncView).observe(document.querySelector('#galleryView'),{attributes:true,attributeFilter:['aria-pressed']});syncView();
 requestAnimationFrame(fitMapViewport);
})();
