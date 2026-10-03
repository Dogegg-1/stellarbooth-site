const typeMeta = {
  company: { label: "游戏公司", color: "#4de7ff" },
  team: { label: "独立团队", color: "#a78bfa" },
  developer: { label: "开发者", color: "#f6c85f" },
  project: { label: "项目", color: "#6ee7b7" },
  school: { label: "高校", color: "#60a5fa" },
  space: { label: "园区 / 空间", color: "#fb7185" },
  event: { label: "活动", color: "#f97316" },
  media: { label: "媒体", color: "#c084fc" },
  publisher: { label: "发行 / 投资", color: "#22d3ee" },
  investor: { label: "发行 / 投资", color: "#22d3ee" },
  service: { label: "服务机构", color: "#84cc16" },
  other: { label: "其他", color: "#94a3b8" }
};

const districtReferences = window.STAR_MAP_DISTRICTS || {};

const state = {
  resources: [],
  filtered: [],
  activeType: "all",
  activeDistrict: "all",
  activeTags: new Set(),
  activeSource: "all",
  activeVisibility: "registered",
  activeNeed: 'all',
  activeStage: 'all',
  view: 'map',
  sidebarOpen: false,
  sidebarTab: 'list',
  detailOpen: false,
  mapDistrict: null,
  query: "",
  selectedId: null,
  mapZoom: 1,
  mapPanX: 0,
  mapPanY: 0,
  isDraggingMap: false,
  dragStartX: 0,
  dragStartY: 0,
  dragStartPanX: 0,
  dragStartPanY: 0,
  touchMode: null,
  touchStartDistance: 0,
  touchStartZoom: 1,
  touchStartCenterX: 0,
  touchStartCenterY: 0
};

const el = {
  searchInput: document.querySelector("#searchInput"),
  statsGrid: document.querySelector("#statsGrid"),
  typeFilters: document.querySelector("#typeFilters"),
  districtFilters: document.querySelector("#districtFilters"),
  tagFilters: document.querySelector("#tagFilters"),
  sourceFilter: document.querySelector("#sourceFilter"),
  visibilityFilter: document.querySelector("#visibilityFilter"),
  resourceList: document.querySelector("#resourceList"),
  listCount: document.querySelector("#listCount"),
  starsLayer: document.querySelector("#starsLayer"),
  connectionLayer: document.querySelector("#connectionLayer"),
  tooltip: document.querySelector("#tooltip"),
  resultCount: document.querySelector("#resultCount"),
  resetFilters: document.querySelector("#resetFilters"),
  legend: document.querySelector("#legend"),
  detailPanel: document.querySelector("#detailPanel"),
  mapStage: document.querySelector("#mapStage"),
  mapViewport: document.querySelector("#mapViewport"),
  zoomIn: document.querySelector("#zoomIn"),
  zoomOut: document.querySelector("#zoomOut"),
  zoomValue: document.querySelector("#zoomValue")
};

init();

async function init() {
  try {
    state.resources = [...await loadResources(), ...(window.STAR_MAP_DEMOS || [])];
  } catch {
    el.detailPanel.textContent = "数据加载失败，请检查 data/resources.js 文件后刷新。";
    return;
  }
  state.selectedId = null;
  window.StarAtlas?.init();
  buildControls();
  buildExploreControls();
  applyFilters();
  new ResizeObserver(fitMapViewport).observe(el.mapStage);
  if(window.location?.search){
    const params=new URLSearchParams(window.location.search);
    if(params.get("view")==="gallery")setView("gallery");
    const requested=params.get("project");
    if(state.filtered.some(item=>item.id===requested))selectResource(requested,false);
  }
}

async function loadResources() {
  if (Array.isArray(window.STAR_MAP_RESOURCES)) {
    return window.STAR_MAP_RESOURCES;
  }

  const response = await fetch("./data/resources.json");
  return response.json();
}

function buildControls() {
  const typeCounts = countBy(state.resources, "type");
  const orderedTypes = ["all", ...Object.keys(typeCounts)];
  el.typeFilters.innerHTML = orderedTypes.map((type) => {
    const label = type === "all" ? "全部" : typeMeta[type]?.label ?? type;
    const count = type === "all" ? state.resources.length : typeCounts[type];
    return filterButton("type", type, label, count, type === state.activeType);
  }).join("");

  const districts = ["all", ...unique(state.resources.map((item) => item.district))];
  const districtCounts = countBy(state.resources, "district");
  el.districtFilters.innerHTML = districts.map((district) => {
    const label = district === "all" ? "全部区域" : district;
    const count = district === "all" ? state.resources.length : districtCounts[district];
    return filterButton("district", district, label, count, district === state.activeDistrict);
  }).join("");

  const tags = unique(state.resources.flatMap((item) => item.tags));
  el.tagFilters.innerHTML = tags.map((tag) => (
    `<button class="chip" type="button" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>`
  )).join("");

  const sources = unique(state.resources.map((item) => item.source));
  el.sourceFilter.innerHTML = `<option value="all">全部来源</option>${sources.map((source) => (
    `<option value="${escapeAttr(source)}">${escapeHtml(source)}</option>`
  )).join("")}`;

  const legendTypes = unique(state.resources.map((item) => item.type));
  el.legend.innerHTML = legendTypes.map((type) => {
    const meta = typeMeta[type] ?? typeMeta.other;
    return `<span class="legend-item"><i class="legend-dot" style="--star-color:${meta.color}"></i>${meta.label}</span>`;
  }).join("");

  el.typeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter='type']");
    if (!button) return;
    state.activeType = button.dataset.value;
    applyFilters();
  });

  el.districtFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter='district']");
    if (!button) return;
    state.activeDistrict = button.dataset.value;
    applyFilters();
  });

  el.tagFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) return;
    const tag = button.dataset.tag;
    if (state.activeTags.has(tag)) {
      state.activeTags.delete(tag);
    } else {
      state.activeTags.add(tag);
    }
    applyFilters();
  });

  el.sourceFilter.addEventListener("change", () => {
    state.activeSource = el.sourceFilter.value;
    applyFilters();
  });

  el.visibilityFilter.addEventListener("change", () => {
    state.activeVisibility = el.visibilityFilter.value;
    applyFilters();
  });

  el.searchInput.addEventListener("input", () => {
    state.query = el.searchInput.value.trim().toLowerCase();
    applyFilters();
  });

  el.resetFilters.addEventListener("click", () => {
    state.activeType = "all";
    state.activeDistrict = "all";
    state.activeTags.clear();
    state.activeSource = "all";
    state.activeVisibility = "registered";
    state.activeNeed = 'all'; state.activeStage = 'all'; state.mapDistrict = null;
    document.querySelector('#needFilter').value = 'all';
    document.querySelector('#stageFilter').value = 'all';
    state.query = "";
    el.searchInput.value = "";
    el.sourceFilter.value = "all";
    el.visibilityFilter.value = "registered";
    applyFilters();
  });

  el.zoomIn.addEventListener('click', () => window.StarAtlas?.zoom(1));
  el.zoomOut.addEventListener('click', () => window.StarAtlas?.zoom(-1));
  document.querySelector('#resetMap').addEventListener('click', () => window.StarAtlas?.home());
  document.querySelector('#retryMap').addEventListener('click', () => window.StarAtlas?.retry());
  document.querySelector('#focusBrowse').addEventListener('click', () => {
    const active = document.querySelector('.workspace').classList.toggle('focus-browse');
    document.querySelector('#focusBrowse').setAttribute('aria-pressed', String(active));
    document.querySelector('#focusBrowse').textContent = active ? '退出专注' : '专注浏览';
    document.querySelector('#browsePanel').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
    requestAnimationFrame(fitMapViewport);
  });
}

function filterButton(group, value, label, count, active) {
  return `
    <button class="filter-btn ${active ? "active" : ""}" type="button" data-filter="${group}" data-value="${escapeAttr(value)}">
      ${escapeHtml(label)}<span>${count}</span>
    </button>
  `;
}

function applyFilters() {
  state.filtered = state.resources.filter((item) => {
    const matchesType = state.activeType === "all" || item.type === state.activeType;
    const matchesDistrict = state.activeDistrict === "all" || item.district === state.activeDistrict;
    const matchesSource = state.activeSource === "all" || item.source === state.activeSource;
    const matchesVisibility = matchesVisibilityMode(item);
    const matchesNeed = state.activeNeed === 'all' || needsOf(item).includes(state.activeNeed);
    const matchesStage = state.activeStage === 'all' || (item.projectStage || '未填写') === state.activeStage;
    const matchesTags = [...state.activeTags].every((tag) => item.tags.includes(tag));
    const haystack = [
      item.name,
      item.typeLabel,
      item.district,
      item.city,
      item.address,
      item.description,
      item.status,
      item.source,
      item.cooperation,
      item.representativeProject,
      item.supportNeeds,
      item.platformPlan,
      item.projectStage,
      item.tags.join(" ")
    ].join(" ").toLowerCase();
    const matchesQuery = !state.query || haystack.includes(state.query);
    return matchesType && matchesDistrict && matchesSource && matchesVisibility && matchesTags && matchesQuery && matchesNeed && matchesStage;
  });

  if (!state.filtered.some((item) => item.id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.id ?? null;
  }
  hideTooltip();

  updateControlState();
  renderActiveFilters();
  renderStats();
  renderMap();
  renderResourceList();
  renderGallery();
  renderDetail();
}

function activeFilterEntries(){
  const entries=[];if(state.query)entries.push(['query','搜索：'+state.query]);
  for(const [key,label] of [['activeType','类型'],['activeDistrict','区域'],['activeSource','来源'],['activeNeed','需求'],['activeStage','阶段']])if(state[key]!=='all')entries.push([key,label+'：'+(key==='activeType'?(typeMeta[state[key]]?.label||state[key]):state[key])]);
  for(const tag of state.activeTags)entries.push(['tag:'+tag,'标签：'+tag]);
  if(state.activeVisibility!=='registered')entries.push(['activeVisibility','范围：'+({public:'已授权公开',pending:'需确认 / 未授权',demo:'虚构示例',all:'含示例'}[state.activeVisibility]||state.activeVisibility)]);
  return entries;
}
function removeActiveFilter(key){if(key.startsWith('tag:'))state.activeTags.delete(key.slice(4));else if(key==='query'){state.query='';el.searchInput.value='';}else if(key==='activeVisibility')state.activeVisibility='registered';else if(['activeType','activeDistrict','activeSource','activeNeed','activeStage'].includes(key))state[key]='all';else return;
  el.sourceFilter.value=state.activeSource;el.visibilityFilter.value=state.activeVisibility;document.querySelector('#needFilter').value=state.activeNeed;document.querySelector('#stageFilter').value=state.activeStage;state.mapDistrict=null;applyFilters();
}
function renderActiveFilters(){const host=document.querySelector('#activeFilters'),entries=activeFilterEntries();host.hidden=!entries.length;host.innerHTML=entries.map(([key,label])=>'<button type="button" data-remove-filter="'+escapeAttr(key)+'" aria-label="移除'+escapeAttr(label)+'">'+escapeHtml(label)+' <span aria-hidden="true">×</span></button>').join('');host.querySelectorAll('[data-remove-filter]').forEach(b=>b.addEventListener('click',()=>{removeActiveFilter(b.dataset.removeFilter);const next=host.querySelector('button');if(next)next.focus();else el.searchInput.focus();}));}
function adjacentResource(offset){const index=state.filtered.findIndex(i=>i.id===state.selectedId);return index<0?null:state.filtered[index+offset]||null;}

function updateControlState() {
  const available = state.resources.filter(matchesVisibilityMode);
  document.querySelectorAll("[data-filter='type']").forEach((button) => {
    button.classList.toggle("active", button.dataset.value === state.activeType);
    const count = available.filter(item => button.dataset.value === 'all' || item.type === button.dataset.value).length;
    button.querySelector('span').textContent = count;
    button.hidden = !count && button.dataset.value !== 'all' && button.dataset.value !== state.activeType;
  });
  document.querySelectorAll("[data-filter='district']").forEach((button) => {
    button.classList.toggle("active", button.dataset.value === state.activeDistrict);
    const count = available.filter(item => button.dataset.value === 'all' || item.district === button.dataset.value).length;
    button.querySelector('span').textContent = count;
    button.hidden = !count && button.dataset.value !== 'all' && button.dataset.value !== state.activeDistrict;
  });
  document.querySelectorAll("[data-tag]").forEach((button) => {
    button.classList.toggle("active", state.activeTags.has(button.dataset.tag));
    button.hidden = !available.some(item => item.tags.includes(button.dataset.tag)) && !state.activeTags.has(button.dataset.tag);
  });
  el.resultCount.textContent = state.filtered.length;
  el.listCount.textContent = state.filtered.length;
  document.querySelector('#applySidebar').textContent = `查看 ${state.filtered.length} 条结果`;
  const located = state.filtered.filter(item => projectPoint(item)).length;
  const outside = state.filtered.filter(item=>item.locationStatus === 'outside').length;
  document.querySelector('#locationSummary').textContent = `${located} 条杭州区域资料 · ${outside} 条外地 · ${state.filtered.length - located - outside} 条位置待确认`;
  document.querySelector('#mapNotice').textContent = located ? '区域参考点，非办公地址 · 滚轮缩放，拖动浏览' : '当前资源尚无已确认区域，请从资源清单查看详情。';
  document.querySelectorAll('[data-need]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.need===state.activeNeed)));
  const filterCount = Number(state.activeType!=='all') + Number(state.activeDistrict!=='all') + state.activeTags.size + Number(state.activeSource!=='all') + Number(state.activeVisibility!=='registered') + Number(state.activeNeed!=='all') + Number(state.activeStage!=='all') + Number(Boolean(state.query));
  document.querySelector('#filterCount').textContent = filterCount ? `(${filterCount})` : '';
}

function renderStats() {
  const stats = [
    ["登记团队", state.filtered.filter(item=>item.dataKind!=='demo').length],
    ["作品档案", state.filtered.filter(item => item.representativeProject).length],
    ["寻求协作", state.filtered.filter(item=>needsOf(item).some(need=>need!=='暂时没有')).length],
    ["杭州区域", unique(state.filtered.filter(item=>projectPoint(item)).map(item=>item.district)).length]
  ];
  el.statsGrid.innerHTML = stats.map(([label, value]) => (
    `<div class="stat-card"><strong>${value}</strong><span>${label}</span></div>`
  )).join("");
}

function countType(types) {
  return state.filtered.filter((item) => types.includes(item.type)).length;
}

function mapGroups() {
  const groups = new Map();
  state.filtered.filter(item => projectPoint(item)).forEach(item => {
    if (!groups.has(item.district)) groups.set(item.district, []);
    groups.get(item.district).push(item);
  });
  return groups;
}
function renderMap() {
  window.StarAtlas?.render(mapGroups(), state.mapDistrict, district => {
    state.mapDistrict = district;
    renderMap();
    document.querySelector('#closeDistrict')?.focus({preventScroll:true});
  });
  renderDistrictMembers();
}

function renderDistrictMembers(){
  const panel=document.querySelector('#districtMembers');
  const rows=state.filtered.filter(item=>item.district===state.mapDistrict && projectPoint(item));
  panel.hidden=!rows.length;
  panel.innerHTML=rows.length?`<div class="district-heading"><h3>${escapeHtml(state.mapDistrict)} · ${rows.length} 个团队</h3><button type="button" id="closeDistrict" aria-label="关闭区域清单">×</button></div><div>${rows.map(item=>`<button type="button" data-member="${escapeAttr(item.id)}"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.representativeProject||'作品待补充')}</span></button>`).join('')}</div>`:'';
  panel.querySelectorAll('[data-member]').forEach(button=>button.addEventListener('click',()=>selectResource(button.dataset.member,false)));
  document.querySelector('#closeDistrict')?.addEventListener('click',()=>{
    const district=state.mapDistrict; state.mapDistrict=null;renderMap();
    [...document.querySelectorAll('#liveMap [data-district]')].find(button=>button.dataset.district===district)?.focus();
  });
}

function matchesVisibilityMode(item){
  if(state.activeVisibility==='all') return true;
  if(state.activeVisibility==='registered') return item.dataKind!=='demo';
  if(state.activeVisibility==='public') return item.isPublic;
  if(state.activeVisibility==='pending') return item.dataKind!=='demo' && !item.isPublic;
  return item.dataKind==='demo';
}

function needsOf(item){return (item.supportNeeds||'').split(/[、,，]/).map(value=>value.trim()).filter(Boolean);}

function buildExploreControls(){
  const stage=document.querySelector('#stageFilter');
  const need=document.querySelector('#needFilter');
  stage.innerHTML='<option value="all">全部阶段</option>'+unique(state.resources.filter(item=>item.dataKind!=='demo').map(item=>item.projectStage||'未填写')).map(value=>`<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`).join('');
  need.innerHTML='<option value="all">全部需求</option>'+unique(state.resources.flatMap(needsOf)).map(value=>`<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`).join('');
  stage.addEventListener('change',()=>{state.activeStage=stage.value;applyFilters();});
  need.addEventListener('change',()=>{state.activeNeed=need.value;applyFilters();});
  document.querySelector('#needShortcuts').innerHTML=[['all','全部需求'],['测试玩家','找测试玩家'],['发行支持','找发行'],['招募成员','招募伙伴'],['媒体曝光','寻求曝光']].map(([value,label])=>`<button type="button" data-need="${value}" aria-pressed="${value==='all'}">${label}</button>`).join('');
  document.querySelectorAll('[data-need]').forEach(button=>button.addEventListener('click',()=>{state.activeNeed=button.dataset.need;need.value=state.activeNeed;applyFilters();}));
  document.querySelector('#galleryView').addEventListener('click',()=>setView('gallery'));
  document.querySelector('#mapView').addEventListener('click',()=>setView('map'));
  document.querySelector('#drawerBackdrop').addEventListener('click',closeDetail);
  document.querySelector('#filtersTab').addEventListener('click',()=>setSidebarTab('filters'));
  document.querySelector('#listTab').addEventListener('click',()=>setSidebarTab('list'));
  document.querySelector('#openSidebar').addEventListener('click',()=>setSidebarOpen(true));
  document.querySelector('#closeSidebar').addEventListener('click',()=>setSidebarOpen(false));
  document.querySelector('#sidebarBackdrop').addEventListener('click',()=>setSidebarOpen(false));
  document.querySelector('#applySidebar').addEventListener('click',()=>setSidebarOpen(false));
  window.matchMedia('(max-width: 900px)').addEventListener('change',()=>{if(state.sidebarOpen)setSidebarOpen(false);});
  document.addEventListener('keydown',event=>{
    if(!state.detailOpen && !state.sidebarOpen)return;
    if(event.key==='Escape'){state.detailOpen?closeDetail():setSidebarOpen(false);return;}
    if(event.key==='Tab'){
      const panel=state.detailOpen?el.detailPanel:document.querySelector('#filtersPanel');
      const nodes=[...panel.querySelectorAll('button,a[href],input,select')].filter(node=>node.getClientRects().length && !node.disabled);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  const back = document.querySelector('#backToTools');
  back.addEventListener('click', () => {
    window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    el.searchInput.focus({preventScroll: true});
  });
  new IntersectionObserver(([entry]) => {back.hidden = entry.isIntersecting;}, {threshold: 0}).observe(document.querySelector('.explore-bar'));
  setView('map');
}

function setSidebarTab(tab){
  state.sidebarTab=tab;
  document.querySelector('#filterContent').hidden=tab!=='filters';
  document.querySelector('#listContent').hidden=tab!=='list';
  document.querySelector('#filtersTab').setAttribute('aria-pressed',String(tab==='filters'));
  document.querySelector('#listTab').setAttribute('aria-pressed',String(tab==='list'));
}

function setSidebarOpen(open){
  state.sidebarOpen=open;
  document.querySelector('.workspace').classList.toggle('sidebar-open',open);
  document.querySelector('#sidebarBackdrop').hidden=!open;
  document.querySelector('#openSidebar').setAttribute('aria-expanded',String(open));
  const panel=document.querySelector('#filtersPanel');
  panel.setAttribute('role',open?'dialog':'complementary');
  if(open)panel.setAttribute('aria-modal','true');else panel.removeAttribute('aria-modal');
  document.querySelectorAll('.global-site-nav,.map-participation,.topbar,.data-notice,.explore-bar,#activeFilters,.map-panel,#backToTools').forEach(node=>{node.inert=open;});
  if(open)requestAnimationFrame(()=>document.querySelector('#closeSidebar').focus());
  else if(window.matchMedia('(max-width: 900px)').matches)document.querySelector('#openSidebar').focus();
}

function fitMapViewport(){window.StarAtlas?.resize();}

function setView(view){
  state.view=view; state.detailOpen=false;
  document.querySelector('.workspace').classList.toggle('gallery-mode',view==='gallery');
  document.querySelector('#galleryView').setAttribute('aria-pressed',String(view==='gallery'));
  document.querySelector('#mapView').setAttribute('aria-pressed',String(view==='map'));
  document.querySelector('#gallery').hidden=view!=='gallery';
  renderDetail();
  if(view==='map')requestAnimationFrame(fitMapViewport);
  else document.querySelector('#gallery').scrollTop=0;
}

function closeDetail(){
  state.detailOpen=false;renderDetail();
  let target=state.returnFocus?.isConnected?state.returnFocus:null;
  if(!target)target=[...document.querySelectorAll('[data-resource-id], [data-project]')].find(button=>(button.dataset.resourceId||button.dataset.project)===state.selectedId && button.getClientRects().length);
  if(target && target.getClientRects().length)target.focus();
  else document.querySelector(window.matchMedia('(max-width: 900px)').matches?'#openSidebar':'#mapView').focus();
}

function coverMarkup(item,detail=false){const media=window.STAR_MAP_MEDIA?.[item.id];if(!media)return '';try{const u=new URL(media.cover);if(u.protocol!=='https:'||u.hostname!=='shared.fastly.steamstatic.com')return '';}catch{return '';}
  return '<img class="verified-cover" src="'+escapeAttr(media.cover)+'" alt="'+escapeAttr(media.title)+' · Steam 商店封面" loading="'+(detail?'eager':'lazy')+'" decoding="async" referrerpolicy="no-referrer">';
}
function bindCoverImages(root){root.querySelectorAll('.verified-cover').forEach(img=>{const loaded=()=>{if(!img.naturalWidth)return;img.parentElement.classList.add('cover-loaded');const note=img.parentElement.querySelector('.cover-source');if(note)note.textContent='Steam 商店封面';};img.addEventListener('load',loaded,{once:true});img.addEventListener('error',()=>{const parent=img.parentElement;parent.classList.remove('cover-loaded');img.remove();if(parent.classList.contains('detail-cover'))parent.remove();},{once:true});if(img.complete)loaded();});}
function renderGallery(){
  const gallery=document.querySelector('#gallery');
  if(!state.filtered.length){gallery.innerHTML='<div class="gallery-empty"><h2>暂时没有匹配的作品</h2><p>试试减少筛选条件，或点击“重置筛选”。</p></div>';return;}
  gallery.innerHTML=state.filtered.map((item,index)=>{
    const palette=(Number(item.id.replace(/\D/g,''))||0)%5;
    return `<button class="project-card palette-${palette}" style="--card-delay:${Math.min(index,7)*35}ms" type="button" data-project="${escapeAttr(item.id)}" aria-label="查看作品：${escapeAttr(item.representativeProject||item.name)}">
      <div class="project-cover">${coverMarkup(item)}<div class="cover-top"><span>${escapeHtml(item.projectStage||'阶段待补充')}</span><span>${escapeHtml(item.id.replace('team-','NO. '))}</span></div><div class="cover-orbit" aria-hidden="true"></div><h2>${escapeHtml(item.representativeProject||'作品待补充')}</h2><small class="cover-source">文字封面 · 非游戏画面</small></div>
      <div class="project-body">${coverMarkup(item)?'<h3 class="card-work-title">'+escapeHtml(item.representativeProject||item.name)+'</h3>':''}<div class="card-team">${escapeHtml(item.name)}</div><p>${escapeHtml(item.description||'团队尚未填写简介')}</p><div class="project-meta-line">${escapeHtml(item.platformPlan||"平台待补充")} · 登记更新 ${escapeHtml((item.updatedAt||"待补充").slice(0,10))}</div><div class="card-tags">${item.tags.slice(0,2).map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div><div class="card-needs">${escapeHtml(needsOf(item).slice(0,3).join(' / ')||'协作需求待补充')}</div><div class="card-footer"><span>${escapeHtml(item.city ? `${item.city} · ${item.district}` : item.district)}</span><span>查看档案 ↗</span></div></div>
    </button>`;
  }).join('');
  bindCoverImages(gallery);
  gallery.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>selectResource(button.dataset.project,false)));
}

function renderResourceList() {
  if (!state.filtered.length) {
    el.resourceList.innerHTML = `<div class="resource-list-empty">没有匹配资源</div>`;
    return;
  }

  el.resourceList.innerHTML = state.filtered.map((item) => {
    const meta = typeMeta[item.type] ?? typeMeta.other;
    const status = item.dataKind === 'demo' ? '虚构示例' : item.isPublic ? '允许公开' : '仅内部预览';
    return `
      <button class="resource-list-item ${item.id === state.selectedId ? "active" : ""}" type="button" data-resource-id="${escapeAttr(item.id)}">
        <span class="resource-list-head">
          <i style="--star-color:${meta.color}"></i>
          <strong>${escapeHtml(item.name)}</strong>
        </span>
        <span class="resource-list-meta">${escapeHtml(item.typeLabel)} · ${escapeHtml(item.district)} · ${escapeHtml(status)}</span>
      </button>
    `;
  }).join("");

  el.resourceList.querySelectorAll("[data-resource-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectResource(button.dataset.resourceId, true);
    });
  });
}

function selectResource(id, focusMap) {
  if(state.sidebarOpen)setSidebarOpen(false);
  state.selectedId = id;
  state.detailOpen = true;
  state.returnFocus = document.activeElement;
  renderMap();
  renderResourceList();
  renderDetail();

  if (focusMap) {
    focusResourceOnMap(id);
  }
  document.querySelector('#closeDetail')?.focus();
}

function focusResourceOnMap(id) {
  const item = state.resources.find(resource => resource.id === id);
  if (item && projectPoint(item)) window.StarAtlas?.focus(item.district);
}

function renderConnections() {
  // No inferred relationships: future connections require explicit source evidence.
  el.connectionLayer.innerHTML = '';
}

function showTooltip(target, item) {
  const mapRect = document.querySelector("#mapStage").getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  el.tooltip.innerHTML = `
    <strong>${escapeHtml(item.name)}</strong>
    <p>${escapeHtml(item.typeLabel)} · ${escapeHtml(item.district)}（区域示意）</p>
    <div class="mini-tags">${item.tags.slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
  `;
  el.tooltip.hidden = false;
  const left = Math.min(targetRect.left - mapRect.left + 18, mapRect.width - 280);
  const top = Math.max(targetRect.top - mapRect.top - 18, 12);
  el.tooltip.style.left = `${Math.max(left, 12)}px`;
  el.tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  el.tooltip.hidden = true;
}

function renderDetail() {
  const modal = state.detailOpen;
  el.detailPanel.hidden = !state.detailOpen;
  document.querySelector('#drawerBackdrop').hidden = !modal;
  document.body.classList.toggle('drawer-open',modal);
  el.detailPanel.setAttribute('role',modal?'dialog':'complementary');
  el.detailPanel.setAttribute('aria-label','团队与作品详情');
  if(modal) el.detailPanel.setAttribute('aria-modal','true'); else el.detailPanel.removeAttribute('aria-modal');
  document.querySelectorAll('.global-site-nav,.map-participation,.topbar,.data-notice,.explore-bar,#activeFilters,.map-panel,#backToTools').forEach(node=>{node.inert=modal || state.sidebarOpen;});
  document.querySelector('#filtersPanel').inert=modal;
  const item = state.filtered.find((resource) => resource.id === state.selectedId);
  if (!item) {
    el.detailPanel.innerHTML = `
      <div class="empty-state">
        <div class="empty-orbit"></div>
        <h2>没有匹配资源</h2>
        <p>调整筛选条件或搜索关键词，重新查看星图。</p>
      </div>
    `;
    return;
  }
  const meta = typeMeta[item.type] ?? typeMeta.other;
  const index=state.filtered.findIndex(r=>r.id===item.id);
  el.detailPanel.innerHTML = `
    <article class="detail-content">
      <header class="detail-toolbar"><button id="closeDetail" type="button" class="close-detail" aria-label="关闭详情">关闭 ×</button>
      <nav class="detail-pager" aria-label="浏览筛选结果"><button id="previousResource" type="button" ${adjacentResource(-1)?'':'disabled'}>← 上一条</button><span aria-live="polite">${index+1} / ${state.filtered.length}</span><button id="nextResource" type="button" ${adjacentResource(1)?'':'disabled'}>下一条 →</button></nav></header>
      <div class="detail-kicker" style="color:${meta.color}">${escapeHtml(item.typeLabel)} · ${escapeHtml(item.district)}</div>
      <h2 class="detail-title">${escapeHtml(item.name)}</h2>
      ${coverMarkup(item,true)?'<div class="detail-cover">'+coverMarkup(item,true)+'<small class="cover-source">封面加载中 · 来源：Steam 商店</small></div>':''}
      <p class="detail-desc">${escapeHtml(item.description || '暂无简介')}</p>
      <div class="detail-tags">${item.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      <span class="public-badge ${item.isPublic ? '' : 'private'}">${item.dataKind === 'demo' ? '虚构示例 · 非真实资源' : item.isPublic ? '允许公开 · 登记资料' : '仅内部预览 · 尚不可直接公开'}</span>
      ${resourceLinkCards(item)}<div class="detail-update"><span>信息以团队登记为准，发现变化欢迎补充。</span><a href="./intake.html?project=${encodeURIComponent(item.id)}">更新这份档案 / 纠错 ↗</a></div>
      <div class="detail-location-action">${projectPoint(item)?'<button id="detailLocate" type="button">在地图查看 '+escapeHtml(item.district)+' ↗</button><small>区域示意，非团队精确办公地址</small>':'<p>'+escapeHtml(item.locationStatus==='outside'?'团队位于杭州以外，本地图不落点。':'位置待确认，暂不在地图落点。')+'</p>'}</div>
      <div class="meta-grid">
        ${metaRow("团队规模", item.teamSize)}
        ${metaRow("代表项目", item.representativeProject)}
        ${metaRow("合作方向", item.cooperation)}
        ${metaRow("来源渠道", item.source)}
        ${metaRow("位置", item.locationStatus === 'unknown' ? `${item.city || ''} 位置待确认 · 暂不在地图落点` : `${item.city} · ${item.district}${item.locationStatus === 'outside' ? '（杭州以外）' : '（区域示意）'}`)}
        ${metaRow("位置说明", item.locationNote)}
        ${metaRow("项目阶段", item.projectStage)}
        ${metaRow("平台计划", item.platformPlan)}
        ${metaRow("当前支持需求", item.supportNeeds)}
        ${metaRow("授权说明", item.authorization)}
        ${metaRow("登记更新时间", item.updatedAt)}
        ${(item.homepageUrls || []).map((url,i)=>linkRow(`主页 / 商店 ${i+1}`,url)).join('')}
        ${(item.materialUrls || []).map((url,i)=>linkRow(`公开素材 ${i+1}`,url)).join('')}
        ${metaRow("登记更新时间", item.updatedAt)}
        ${metaRow("整理日期", item.importedAt)}
      </div>
    </article>
  `;
  bindCoverImages(el.detailPanel);
  if(modal)window.StellarLibrary?.attach(el.detailPanel.querySelector(".detail-toolbar"),item);
  document.querySelector('#closeDetail')?.addEventListener('click',closeDetail);
  for(const [id,offset] of [['previousResource',-1],['nextResource',1]])document.querySelector('#'+id)?.addEventListener('click',()=>{const next=adjacentResource(offset);if(!next)return;state.selectedId=next.id;renderResourceList();renderDetail();renderMap();el.detailPanel.scrollTop=0;const button=document.querySelector('#'+id);(button?.disabled?document.querySelector('#closeDetail'):button)?.focus();});
  document.querySelector('#detailLocate')?.addEventListener('click',()=>{const district=item.district;closeDetail();setView('map');state.mapDistrict=district;renderMap();focusResourceOnMap(item.id);document.querySelector('#browsePanel').scrollIntoView({block:'start',behavior:'instant'});document.querySelector('#closeDistrict')?.focus({preventScroll:true});});
}

function resourceLinkCards(item){
  const links=[],seen=new Set();
  for(const [category,urls] of [['主页 / 商店',item.homepageUrls],['素材 / 视频',item.materialUrls]])for(const raw of urls||[]){
    let url;try{url=new URL(raw);}catch{continue;}if(!['http:','https:'].includes(url.protocol)||url.username||url.password||seen.has(url.href))continue;seen.add(url.href);
    const host=url.hostname.toLowerCase(),label=host==='store.steampowered.com'?'Steam 商店':host==='space.bilibili.com'?'B站账号主页':host==='bilibili.com'||host.endsWith('.bilibili.com')?(url.pathname.startsWith('/video/')?'B站视频':'B站页面'):host==='itch.io'||host.endsWith('.itch.io')?'itch.io 作品':category;
    const review=window.STAR_LINK_REVIEWS?.[item.id]?.[url.href];
    const note=review?'<span class="link-review-note">'+escapeHtml(review.note)+'<br>核对记录 '+escapeHtml(review.checkedAt)+'</span>':'';
    links.push('<a class="resource-link-card" href="'+escapeAttr(url.href)+'" target="_blank" rel="noopener noreferrer"><strong>'+escapeHtml(review?.label||label)+' ↗</strong><small>'+escapeHtml(host)+'</small>'+note+'</a>');
  }
  return links.length?'<section class="resource-links" aria-label="作品与素材链接"><h3>继续了解作品</h3><div>'+links.join('')+'</div><p>团队登记链接 · 在新窗口打开；商店页与视频不代表可直接试玩</p></section>':'';
}

function metaRow(label, value) {
  if (!value) return "";
  return `<div class="meta-row"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function linkRow(label, value) {
  if (!value) return "";
  try { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return ''; } catch { return ''; }
  return `
    <div class="meta-row">
      <span>${label}</span>
      <a class="detail-link" href="${escapeAttr(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>
    </div>
  `;
}

function projectPoint(item) {
  if (!['district','verified'].includes(item.locationStatus)) return null;
  return districtReferences[item.district] || null;
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] ?? 0) + 1;
    return acc;
  }, {});
}

function unique(values) {
  return [...new Set(values)].filter(Boolean);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
