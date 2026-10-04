(()=>{
  if(document.querySelector('.global-site-nav'))return;
  const base=new URL('./',document.currentScript.src);
  if(parent!==window&&parent.StellarShell){const css=document.createElement('style');css.textContent=':root{--site-nav-height:0px!important}body[data-site-page]{padding-top:0!important}body>.global-site-nav{display:none!important}';document.head.append(css);}
  const page=document.body.dataset.sitePage;
  const home=parent!==window&&parent.StellarShell?'station-scene.html':'index.html';
  const nav=document.createElement('nav');nav.className='global-site-nav';nav.setAttribute('aria-label','星游集网站导航');if(document.body.classList.contains('station-page'))nav.classList.add('station-header');const brand=document.createElement('a');brand.className='site-brand';brand.href=new URL(home,base).href;brand.setAttribute('aria-label','星游集 · 返回接收站');const logo=document.createElement('img');logo.src=new URL('assets/home/stellarbooth-rabbit.png',base).href;logo.alt='';const name=document.createElement('span');name.textContent='星游集';const en=document.createElement('small');en.textContent='StellarBooth';name.append(en);brand.append(logo,name);nav.append(brand);
  for(const [key,label,path] of [['home','主页',home],['tools','游戏工具库','tools.html'],['map','游戏星图','map.html'],['about','关于我们','about.html']]){
    const item=document.createElement(path?'a':'span');item.textContent=label;
    if(path){item.dataset.navKey=key;item.style.viewTransitionName='nav-'+key;item.href=new URL(path,base).href;if(page===key)item.setAttribute('aria-current','page');}
    else {item.setAttribute('aria-disabled','true');const badge=document.createElement('small');badge.textContent='筹备中';item.append(badge);}
    nav.append(item);
  }
  document.body.prepend(nav);
})();
