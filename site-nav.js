(()=>{
  const base=new URL('./',document.currentScript.src);
  const page=document.body.dataset.sitePage;
  const nav=document.createElement('nav');nav.className='global-site-nav';nav.setAttribute('aria-label','星游集网站导航');
  for(const [key,label,path] of [['home','星游集主页','index.html'],['tools','游戏工具库',null],['map','游戏星图','map.html']]){
    const item=document.createElement(path?'a':'span');item.textContent=label;
    if(path){item.style.viewTransitionName='nav-'+key;item.href=new URL(path,base).href;if(page===key)item.setAttribute('aria-current','page');}
    else {item.setAttribute('aria-disabled','true');const badge=document.createElement('small');badge.textContent='筹备中';item.append(badge);}
    nav.append(item);
  }
  document.body.prepend(nav);
})();
