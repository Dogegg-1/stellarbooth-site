(()=>{
 const dialog=document.createElement('dialog');dialog.className='home-project-dialog';dialog.setAttribute('aria-labelledby','homeProjectTitle');document.body.append(dialog);
 const make=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 let origin;
 const safe=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}};
 function open(record,trigger){
  origin=trigger;dialog.replaceChildren();
  const header=make('header',null,'home-project-header'),label=make('span','团队与作品'),close=make('button','×');close.type='button';close.setAttribute('aria-label','关闭作品详情');close.onclick=()=>dialog.close();header.append(label,close);dialog.append(header);
  const main=make('article'),title=make('h2',record.representativeProject||record.name);title.id='homeProjectTitle';main.append(title,make('p',record.name,'home-project-team'));
  const cover=window.STAR_MAP_MEDIA?.[record.id]?.cover;
  if(cover?.startsWith('https://shared.fastly.steamstatic.com/')){const img=make('img');img.src=cover;img.alt=(record.representativeProject||record.name)+'作品封面';img.onerror=()=>img.remove();main.append(img);}
  main.append(make('p',record.description||'简介待补充','home-project-description'));
  const dl=make('dl');
  const fields=[['项目阶段',record.projectStage],['平台',record.platformPlan],['团队规模',record.teamSize],['合作方向',record.cooperation],['支持需求',record.supportNeeds],['位置',record.locationStatus==='unknown'?'位置待确认':[record.city,record.district].filter(Boolean).join(' · ')],['标签',(record.tags||[]).join(' · ')]];
  fields.forEach(([name,value])=>{if(value)dl.append(make('dt',name),make('dd',String(value)));});main.append(dl);
  const links=make('div',null,'home-project-links');
  const seen=new Set();[...(record.homepageUrls||[]),...(record.materialUrls||[])].forEach(raw=>{const url=safe(raw);if(!url||seen.has(url))return;seen.add(url);const review=window.STAR_LINK_REVIEWS?.[record.id]?.[raw];const host=new URL(url).hostname;const label=host==='store.steampowered.com'?'Steam 商店':host.endsWith('bilibili.com')?'B站视频 / 主页':host==='itch.io'||host.endsWith('.itch.io')?'itch.io 作品':'查看资料 · '+host;const a=make('a',review?.label||label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);if(review?.note)links.append(make('small',review.note));});main.append(links);main.append(make('p',links.children.length?'团队登记入口；商店页或视频不代表已开放试玩。':'暂无登记的作品入口，等待团队补充。','home-project-status'));
  main.append(make('small',record.isPublic?'允许公开 · 登记资料':'内部预览 · 原始授权状态未变','home-project-status'));
  const actions=make('footer');const map=make('a','在游戏星图查看 ↗');map.href='./map.html?project='+encodeURIComponent(record.id);const update=make('a','资料纠错 ↗');update.href='./intake.html?project='+encodeURIComponent(record.id);actions.append(map,update);main.append(actions);dialog.append(main);window.StellarLibrary?.attach(actions,record);
  document.body.classList.add('home-project-open');dialog.showModal();dialog.scrollTop=0;close.focus();
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const a=event.target.closest('a[href]');if(!a||dialog.contains(a))return;
  const url=new URL(a.href,location.href);if(url.origin!==location.origin||!url.pathname.endsWith('/map.html')||!url.searchParams.has('project'))return;
  const record=(window.STAR_MAP_RESOURCES||[]).find(r=>r.id===url.searchParams.get('project'));if(!record)return;
  event.preventDefault();open(record,a);
 });
 dialog.addEventListener('close',()=>{document.body.classList.remove('home-project-open');origin?.focus({preventScroll:true});});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
})();
