/* Leaflet adapter. Only administrative reference points are placed on this map. */
window.StarAtlas = (() => {
  let map, markers, tiles, outlines, lastRender, mapType = 'simple';
  const points = window.STAR_MAP_DISTRICTS || {};
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const home = () => map?.fitBounds(Object.values(points).map(p => [p.lat, p.lng]), {padding: [65, 65], maxZoom: 11, animate: !reduced()});
  function init() {
    const status = document.querySelector('#mapStatus');
    if (!window.L) {
      status.textContent = '地图组件未加载，请刷新。资源清单与作品仍可浏览。';
      return;
    }
    // Let the tile layer set the zoom ceiling: Retina uses the next native zoom.
    map = L.map('liveMap', {zoomControl: false, scrollWheelZoom: true, wheelDebounceTime: 80, wheelPxPerZoomLevel: 100, minZoom: 5, maxZoom: L.Browser.retina ? 18 : 19, zoomAnimation: !reduced(), fadeAnimation: !reduced()});
    tiles = L.tileLayer(window.STAR_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      detectRetina: true, maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
    });
    outlines = L.geoJSON(window.STAR_MAP_BOUNDARIES, {
      style: boundaryStyle,
      onEachFeature: (feature, layer) => {
        if (feature.properties.level === 'city') return;
        layer.bindTooltip(feature.properties.name, {sticky: true, className: 'boundary-tooltip'});
        layer.on('click', () => {
          const district = feature.properties.name;
          if (lastRender?.[0]?.has(district)) {focus(district); lastRender[2](district);}
        });
      },
      attribution: '轮廓 &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
    });
    tiles.on('tileerror', () => {if(mapType==='simple')return; status.hidden = false; status.textContent = '部分地图瓦片未加载，请检查网络后点击“重试底图”。';});
    tiles.on('loading', () => {if(mapType==='simple')return; status.hidden = false; status.textContent = '正在加载街道底图…';});
    tiles.on('load', () => {
      if(mapType==='simple')return;
      const failed = [...document.querySelectorAll('#liveMap .leaflet-tile')].some(img => !img.naturalWidth);
      status.hidden = !failed;
      if (failed) status.textContent = '部分底图不可用；区域标记仍可查看。请检查网络后重试。';
    });
    markers = L.layerGroup().addTo(map);
    const select = document.querySelector('#mapType');
    try {mapType = localStorage.getItem('xingyouji.mapType') || 'simple';} catch {}
    setType(mapType);
    select.addEventListener('change', () => setType(select.value));
    document.querySelector('#fitResults').addEventListener('click', fitResults);
    L.control.scale({imperial: false, position: 'bottomleft'}).addTo(map);
    map.on('zoomend', () => {
      document.querySelector('#zoomValue').textContent = `Z${map.getZoom()}`;
      if (lastRender) render(...lastRender);
      document.querySelector('#zoomIn').disabled = map.getZoom() >= map.getMaxZoom();
      document.querySelector('#zoomOut').disabled = map.getZoom() <= map.getMinZoom();
    });
    home();
  }
  function boundaryStyle(feature) {
    const city = feature.properties.level === 'city';
    const active = lastRender?.[1] === feature.properties.name;
    const hasResources = lastRender?.[0]?.has(feature.properties.name);
    return {color: city ? '#9b88b8' : active ? '#e5efc9' : hasResources ? '#c0a8df' : '#61566f', weight: active ? 2.5 : city ? 2 : 1.25, opacity: city ? .65 : hasResources ? .95 : .45,
      fillColor: active ? 'url(#atlasActiveFill)' : hasResources ? 'url(#atlasDistrictFill)' : '#11121c', fillOpacity: city ? .55 : .94, className: 'atlas-boundary'};
  }
  function setType(value) {
    mapType = ['simple','street','night'].includes(value) ? value : 'simple';
    const host = document.querySelector('#liveMap');
    const status = document.querySelector('#mapStatus');
    host.classList.toggle('simple-map', mapType === 'simple');
    host.classList.toggle('night-map', mapType === 'night');
    document.querySelector('#mapType').value = mapType;
    document.querySelector('#retryMap').hidden = mapType === 'simple';
    host.setAttribute('aria-label', mapType === 'simple' ? '杭州简化区域地图' : '杭州街道地图');
    document.querySelector('.map-overlay-title small').textContent = mapType === 'simple' ? '简化轮廓 · 区域聚合 · 非办公地址' : '街道底图 · 区域聚合 · 非办公地址';
    status.hidden = true;
    if (mapType === 'simple') {
      if (map.hasLayer(tiles)) map.removeLayer(tiles);
      if (!map.hasLayer(outlines)) outlines.addTo(map);
    } else {
      if (map.hasLayer(outlines)) map.removeLayer(outlines);
      if(location.protocol === 'file:') {
        status.hidden = false; status.textContent = '街道底图需通过本地预览服务打开；可切回简化轮廓离线浏览。';
      } else if (!map.hasLayer(tiles)) tiles.addTo(map);
    }
    try {localStorage.setItem('xingyouji.mapType', mapType);} catch {}
  }
  function render(groups, selected, select) {
    if (!map) return;
    lastRender = [groups, selected, select];
    document.querySelector('#fitResults').disabled = groups.size === 0;
    renderRegionNav(groups, selected, select);
    outlines?.setStyle(boundaryStyle);
    markers.clearLayers();
    const clusters = [];
    for (const [district, rows] of groups) {
      const p = points[district]; if (!p) continue;
      const pixel = map.latLngToLayerPoint([p.lat, p.lng]);
      const cluster = clusters.find(c => c.pixel.distanceTo(pixel) < 65);
      if (cluster) cluster.entries.push({district, rows, point: p});
      else clusters.push({pixel, entries: [{district, rows, point: p}]});
    }
    for (const {entries} of clusters) {
      const multiple = entries.length > 1;
      const district = multiple ? `${entries.length} 个区域` : entries[0].district;
      const total = entries.reduce((sum, entry) => sum + entry.rows.length, 0);
      const point = {lat: entries.reduce((sum,e) => sum + e.point.lat, 0) / entries.length, lng: entries.reduce((sum,e) => sum + e.point.lng, 0) / entries.length};
      const button = document.createElement('button');
      button.className = `atlas-beacon${selected === district ? ' active' : ''}`;
      button.type = 'button'; button.dataset.district = district;
      button.setAttribute('aria-label', `${district} · ${total} 个团队 · ${multiple ? '点击展开区域' : '区域聚合，非办公地址'}`);
      button.setAttribute('aria-pressed', String(selected === district));
      const count = document.createElement('b'); count.textContent = total;
      const label = document.createElement('span'); label.textContent = district;
      button.append(count, label);
      L.DomEvent.disableClickPropagation(button);
      button.addEventListener('click', () => {
        if (multiple) {
          map.flyToBounds(entries.map(e => [e.point.lat, e.point.lng]), {padding: [70, 70], maxZoom: 14, animate: !reduced(), duration: .7});
        } else {focus(district); select(district);}
      });
      L.marker([point.lat, point.lng], {icon: L.divIcon({className: 'atlas-marker', html: button, iconSize: [42, 42], iconAnchor: [21, 21]}), keyboard: false}).addTo(markers);
    }
  }
  function fitResults() {
    const visible = [...(lastRender?.[0]?.keys() || [])].map(name => points[name]).filter(Boolean);
    if (!visible.length) return;
    map.flyToBounds(visible.map(p => [p.lat, p.lng]), {padding: [75, 75], maxZoom: visible.length === 1 ? 12 : 11, animate: !reduced(), duration: .7});
  }
  function renderRegionNav(groups, selected, select) {
    const nav = document.querySelector('#regionNav');
    const signature = JSON.stringify([...groups].map(([name, rows]) => [name, rows.length]));
    if (nav.dataset.signature !== signature) {
      nav.dataset.signature = signature;
      nav.replaceChildren();
      if (!groups.size) {
        const empty = document.createElement('span'); empty.textContent = '暂无可定位区域 · 可从资源清单查看资料'; nav.append(empty);
      }
      for (const [name, rows] of groups) {
        const button = document.createElement('button');
        button.type = 'button'; button.dataset.region = name;
        button.textContent = `${name}  ${rows.length}`;
        button.setAttribute('aria-label', `定位${name}，${rows.length}个团队`);
        button.addEventListener('click', () => {focus(name); lastRender[2](name);});
        nav.append(button);
      }
    }
    nav.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.region === selected)));
  }
  function focus(district) {
    const p = points[district]; if (!p || !map) return;
    map.flyTo([p.lat, p.lng], Math.max(12, map.getZoom()), {animate: !reduced(), duration: .7});
  }
  return {init, render, focus, home, resize: () => map?.invalidateSize({pan: false}), zoom: delta => map?.setZoom(map.getZoom() + delta), retry: () => tiles?.redraw()};
})();
