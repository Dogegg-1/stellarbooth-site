(()=>{
 const records=window.STAR_MAP_RESOURCES||[],media=window.STAR_MAP_MEDIA||{};
 function el(tag,text,cls){const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;}
 function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
 const works=document.querySelector('#featuredWorks');
 records.filter(r=>media[r.id]).slice(0,8).forEach(r=>{
   const a=el('a',null,'featured-work');a.href='./map.html?project='+encodeURIComponent(r.id);
   const cover=el('img');cover.alt=r.representativeProject+' · 作品封面';cover.loading='lazy';
   const fallback=()=>cover.replaceWith(el('div','作品封面暂不可用','work-text-cover'));
   cover.addEventListener('error',fallback,{once:true});const url=safeUrl(media[r.id].cover);if(url&&new URL(url).hostname==='shared.fastly.steamstatic.com')cover.src=url;
   a.append(cover);if(!url)fallback();const body=el('div');body.append(el('small',r.projectStage||'阶段待补充'),el('h3',r.representativeProject||r.name),el('p',r.name),el('p',(r.description||'简介待补充').slice(0,95)),el('small','查看作品档案 ↗'));a.append(body);
   // The whole card remains one link. The duplicate visual preview is decorative.
   const preview=el('aside',null,'work-preview');preview.setAttribute('aria-hidden','true');
   if(url&&new URL(url).hostname==='shared.fastly.steamstatic.com'){
     const art=el('img');art.alt='';art.loading='lazy';art.src=url;
     art.addEventListener('error',()=>art.remove(),{once:true});preview.append(art);
   }
   const info=el('div',null,'work-preview-info');
   info.append(el('small',[r.projectStage,r.platformPlan].filter(Boolean).join(' · ')||'项目信息待补充','work-preview-meta'),el('h3',r.representativeProject||r.name),el('p',r.description||'简介待补充','work-preview-summary'),el('span','查看完整作品 ↗','work-preview-action'));
   preview.append(info);a.append(preview);works.append(a);
 });
 if(!works.children.length)works.append(el('p','作品内容正在整理。','community-muted'));
 const events=document.querySelector('#eventList'),now=Date.now();
 const confirmed=(window.STELLAR_EVENTS||[]).filter(e=>e.id&&e.title&&Number.isFinite(Date.parse(e.start))&&Number.isFinite(Date.parse(e.end))&&Date.parse(e.end)>=Date.parse(e.start)&&['open','full','closed'].includes(e.status)).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 const upcoming=confirmed.filter(e=>Date.parse(e.end)>=now),past=confirmed.filter(e=>Date.parse(e.end)<now).reverse();
 function renderEvent(e,parent){const ended=Date.parse(e.end)<now,card=el('article',null,'event-item');card.append(el('small',ended?'往期活动':e.status==='open'?'开放报名':e.status==='full'?'名额已满':'报名已结束'),el('h3',e.title),el('p',new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'medium',timeStyle:'short'}).format(new Date(e.start))+' · '+(e.location||'地点待确认')),el('p',e.summary||''));const href=safeUrl(ended?e.recapUrl:(e.status==='open'?e.registrationUrl:null));if(href){const link=el('a',ended?'查看活动回顾 ↗':'查看详情与报名 ↗');link.href=href;link.target='_blank';link.rel='noopener noreferrer';card.append(link);}else{const link=el('a',ended?'咨询活动资料':'联系主办方');link.href='#contact';card.append(link);}parent.append(card);}
 if(upcoming.length)upcoming.forEach(e=>renderEvent(e,events));else{const empty=el('div',null,'event-empty');empty.append(el('small','NEXT GATHERING','community-kicker'),el('h3','近期活动待公布'),el('p','新的分享、试玩与交流正在准备中。想带 Demo 来，或了解工坊安排，可以先联系星游集。'));const a=el('a','咨询活动与来访 ↗');a.href='#contact';empty.append(a);events.append(empty);}
 if(past.length){document.querySelector('#pastEventsSection').hidden=false;past.slice(0,4).forEach(e=>renderEvent(e,document.querySelector('#pastEvents')));}
})();
