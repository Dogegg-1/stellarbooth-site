(()=>{
 const records=window.STAR_MAP_RESOURCES||[];let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error();},setItem(){throw Error();}};}
 const store=StellarCollectionStore.create(storage,records.map(r=>r.id));
 const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const dialog=el('dialog');dialog.className='project-library';dialog.setAttribute('aria-label','我的作品收藏与最近浏览');
 const header=el('header'),heading=el('h2','我的作品架'),close=el('button','×');close.type='button';close.setAttribute('aria-label','关闭作品架');close.onclick=()=>dialog.close();header.append(heading,close);
 const note=el('p','只保存在当前浏览器；换设备不会同步。'),tabs=el('div'),content=el('div'),clear=el('button','清空最近浏览');tabs.className='library-tabs';content.className='library-items';clear.type='button';
 let kind='favorites',origin;
 const buttons=['favorites','recent'].map((key,i)=>{const b=el('button',i?'最近浏览':'我的收藏');b.type='button';b.onclick=()=>{kind=key;render();};tabs.append(b);return b;});
 function render(){buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(kind===(i?'recent':'favorites'))));content.replaceChildren();clear.hidden=kind!=='recent'||!store.list('recent').length;
  note.textContent=store.persistent()?'只保存在当前浏览器；换设备不会同步。':'浏览器无法保存，目前仅在本次页面停留期间有效。';
  const ids=store.list(kind);if(!ids.length)content.append(el('p',kind==='favorites'?'还没有收藏。打开作品详情，点“收藏作品”。':'还没有浏览记录，打开作品详情后会出现在这里。'));
  ids.forEach(id=>{const record=records.find(r=>r.id===id),row=el('div'),link=el('a',record.representativeProject||record.name);link.href='./map.html?project='+encodeURIComponent(id);link.append(el('small',record.name));link.onclick=()=>dialog.close();row.append(link);if(kind==='favorites'){const remove=el('button','取消收藏');remove.type='button';remove.setAttribute('aria-label','取消收藏：'+(record.representativeProject||record.name));remove.onclick=()=>{store.toggle(id);sync();render();};row.append(remove);}content.append(row);});
 }
 clear.onclick=()=>{store.clearRecent();render();};dialog.append(header,note,tabs,content,clear);document.body.append(dialog);
 dialog.addEventListener('close',()=>origin?.focus({preventScroll:true}));dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 function sync(){document.querySelectorAll('[data-save-project]').forEach(b=>{const active=store.has(b.dataset.saveProject);b.textContent=active?'★ 已收藏':'☆ 收藏作品';b.setAttribute('aria-pressed',String(active));});}
 window.StellarLibrary={
  attach(host,record){store.visit(record.id);const button=el('button');button.type='button';button.className='save-project';button.dataset.saveProject=record.id;button.onclick=()=>{store.toggle(record.id);sync();};host.append(button);sync();},
  open(trigger){origin=trigger;render();dialog.showModal();},
 };
 const setup=()=>{
  const dock=document.querySelector('.atlas-dock'),works=document.querySelector('#works .community-heading');
  if(dock||works){const button=el('button');button.type='button';button.setAttribute('aria-label','我的作品架');button.className='library-launch';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z"/></svg><span>作品架</span>';button.onclick=()=>StellarLibrary.open(button);(dock||works).append(button);}
  const host=document.querySelector('#filterContent')||document.querySelector('#works .community-heading');if(!host)return;
  const quick=el('div');quick.className='discovery-shortcuts';quick.setAttribute('aria-label','发现作品');
  [['stage','Demo','Demo 阶段'],['need','测试玩家','寻找测试玩家'],['need','招募成员','招募伙伴']].forEach(([field,value,label])=>{const b=el(dock?'button':'a',label);if(dock){b.type='button';b.onclick=()=>{const select=document.querySelector(field==='stage'?'#stageFilter':'#needFilter');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));};}else b.href='./map.html?view=gallery&'+field+'='+encodeURIComponent(value);quick.append(b);});host.append(quick);
  if(dock){const params=new URLSearchParams(location.search);[['stage','#stageFilter'],['need','#needFilter']].forEach(([key,selector])=>{const value=params.get(key),select=document.querySelector(selector);if(value&&[...select.options].some(o=>o.value===value)){select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));}});}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
