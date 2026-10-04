/* One continuous camera and renderer, including the live physical CRT screen. */
(()=>{
'use strict';
const T=window.THREE,S=window.StationState,canvas=document.querySelector('#stationCanvas'),page=document.body;
const focus=document.querySelector('#tvFocus'),back=document.querySelector('#returnScene');
const status=document.querySelector('#sceneStatus');
const frame=document.querySelector('#tvFrame');let frameReady=false,framePoweredReady=false;
const powerButton=document.querySelector('#tvPower3d'),controls=document.querySelector('#tvControls'),projectSelect=document.querySelector('#tvProjects'),projectLink=document.querySelector('#tvProjectLink'),pauseButton=document.querySelector('#tvPause');
const records=window.STAR_MAP_RESOURCES||[];records.forEach(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=r.representativeProject||r.name;projectSelect.append(o);});
let display,powerGlyph,paused=false,travel=null,outline,nearby=null;
let keyboardInput=false,pendingPointer=null,introElapsed=0;
document.addEventListener("keydown",e=>{if(e.key==="Tab"||e.key==="Enter"||e.key==="Escape")keyboardInput=true;},true);
document.addEventListener("pointerdown",()=>{keyboardInput=false;},true);
function clearHover(){pendingPointer=null;hovered=null;nearby=null;canvas.style.cursor="default";Object.values(buttons).forEach(b=>b.classList.remove("is-hovered"));}
function restoreSceneFocus(){clearHover();if(keyboardInput)buttons.tv.focus({preventScroll:true});else if(document.activeElement instanceof HTMLElement)document.activeElement.blur();}
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),state=S.createState();let motion=!reduced.matches,raf=0,last=0,sceneVisible=true;
const hits=[],anchors={},targetGroups={},buttons=Object.fromEntries([...document.querySelectorAll('[data-hotspot]')].map(b=>[b.dataset.hotspot,b]));
let schedule=()=>{};
let renderer,scene,camera,base,baseLook,closePos,closeLook,pointer={x:0,y:0},mouse={x:0,y:0},hovered=null;
// Same-origin view state is applied synchronously, before revealing the screen.
function syncFrameView(){const far=state.mode==='scene';try{frame.contentDocument?.body?.classList.toggle('station-screen-far',far);}catch(_){}frame.contentWindow?.postMessage({type:'station-view',near:!far},location.origin);}
frame.addEventListener('load',()=>syncFrameView());
function setMode(){page.dataset.mode=state.mode;syncFrameView();frame.inert=state.mode!=='focused';document.querySelector('.hotspots').inert=state.mode!=='scene';document.querySelector('.station-header').inert=state.mode!=='scene';}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow)return;if(e.data?.type==='station-powered'){syncFrameView();framePoweredReady=true;frame.hidden=!(display?.powered&&framePoweredReady);schedule();}if(e.data?.type==='station-ready'){frameReady=true;syncFrameView();frame.contentWindow.postMessage({type:'station-visibility',visible:state.mode==='focused'},location.origin);if(display?.powered)frame.contentWindow.postMessage({type:'station-power'},location.origin);}if(e.data?.type==='station-exit')leaveTV();});
function showFocus(){syncFrameView();frame.contentWindow?.postMessage({type:'station-visibility',visible:true},location.origin);focus.hidden=false;focus.inert=false;focus.classList.add('is-visible');powerButton.hidden=!!display?.powered;controls.hidden=true;if(!frame.src)frame.src=frame.dataset.src;frame.hidden=!(display?.powered&&framePoweredReady);back.focus({preventScroll:true});}
function powerOn(){if(state.mode!=='focused'||display.powered)return;syncFrameView();display.turnOn(reduced.matches);powerButton.hidden=true;powerGlyph.visible=false;controls.hidden=true;if(frameReady)frame.contentWindow.postMessage({type:'station-power'},location.origin);schedule();}
function selectProject(record){if(!record)return;projectSelect.value=record.id;projectLink.textContent='查看项目 ↗';projectLink.href='map.html?project='+encodeURIComponent(record.id);display.select(record);schedule();}
powerButton.onclick=powerOn;projectSelect.onchange=()=>{const record=records.find(r=>r.id===projectSelect.value);if(record)selectProject(record);else{display.select(null);projectLink.href='map.html';projectLink.textContent='全部作品 ↗';schedule();}};
pauseButton.onclick=()=>{paused=!paused;pauseButton.setAttribute('aria-pressed',String(paused));pauseButton.textContent=paused?'继续旋转':'暂停旋转';schedule();};
function enterTV(){if(state.mode!=='scene'||travel)return;if(!frame.src)frame.src=frame.dataset.src;clearHover();S.enter(state,reduced.matches);setMode();status.textContent='正在靠近电视…';if(state.mode==='focused')showFocus();schedule();}
function leaveTV(){if(travel){travel=null;page.style.removeProperty('--travel-fade');setMode();schedule();return;}if(state.mode==='scene')return;focus.classList.remove('is-visible');focus.inert=true;focus.hidden=true;frame.contentWindow?.postMessage({type:'station-visibility',visible:false},location.origin);clearHover();S.exit(state,reduced.matches);setMode();pointer={x:0,y:0};if(state.mode==='scene')restoreSceneFocus();schedule();}
function travelTo(key){
 if(state.mode!=='scene'||travel)return;
 const href={tools:'tools.html?preview=receiver11',map:'map.html?preview=receiver11',about:'about.html?preview=receiver11'}[key];
 if(!href)return;if(reduced.matches||!renderer){location.href=href;return;}
 const target=new T.Vector3();anchors[key].getWorldPosition(target);if(key==='about')targetGroups.about.localToWorld(target.set(1.2,1.1,1.8));else target.y=key==='map'?3.4:1.1;
 const direction=camera.position.clone().sub(target).normalize();
 travel={href,started:performance.now(),progress:0,from:camera.position.clone(),lookFrom:baseLook.clone(),look:target,to:target.clone().add(direction.multiplyScalar(key==='map'?7:key==='about'?13:3.8))};
 page.dataset.mode='navigating';document.querySelector('.hotspots').inert=true;document.querySelector('.station-header').inert=true;schedule();
}
function activate(key){if(state.mode!=='scene'||travel)return;if(key==='tv')enterTV();else travelTo(key);}
Object.entries(buttons).forEach(([key,button])=>button.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();activate(key);}));
back.onclick=leaveTV;document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))leaveTV();});
reduced.addEventListener('change',()=>{motion=!reduced.matches;pointer={x:0,y:0};schedule();});
function fallback(){cancelAnimationFrame(raf);raf=0;S.exit(state,true);setMode();focus.hidden=true;focus.inert=true;focus.classList.remove('is-visible');frame.hidden=true;page.classList.add('no-webgl');document.querySelector('.fallback').hidden=false;status.textContent='已切换为简洁浏览';display?.dispose();outline?.dispose();renderer?.dispose();renderer=null;}
if(!T){fallback();return;}
try{
renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x11101d);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
scene=new T.Scene();scene.fog=new T.FogExp2(0x252a3b,.010);camera=new T.PerspectiveCamera(42,1,.1,1100);
scene.add(new T.HemisphereLight(0x9aabc6,0x302a30,.65));const sunlight=new T.DirectionalLight(0xe0dfff,1.35);sunlight.position.set(-9,18,12);sunlight.castShadow=true;sunlight.shadow.autoUpdate=false;sunlight.shadow.mapSize.set(2048,2048);sunlight.shadow.camera.left=-48;sunlight.shadow.camera.right=40;sunlight.shadow.camera.top=32;sunlight.shadow.camera.bottom=-28;sunlight.shadow.camera.near=.5;sunlight.shadow.camera.far=100;sunlight.shadow.bias=-.00006;sunlight.shadow.normalBias=.012;sunlight.shadow.radius=1.5;scene.add(sunlight);const rim=new T.DirectionalLight(0xa4aecb,1.05);rim.position.set(10,6,-12);scene.add(rim);
const mat=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.92,flatShading:true,...opts});
const graphite=mat(0x34343f),edge=mat(0x595361),metal=mat(0x77717a),dark=mat(0x171924),groundMat=mat(0x514b5c),cream=mat(0xb4a48d),purple=mat(0x71627f);
const glow=mat(0xd9e49c,{emissive:0xcbdc73,emissiveIntensity:1.5}),warm=mat(0xf2dbaf,{emissive:0xf2c881,emissiveIntensity:1.7}),violet=mat(0xaa8dc8,{emissive:0x9579c5,emissiveIntensity:1.3});
function mesh(geo,m,parent,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent,w,h,d,m,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),m,parent,x,y,z);}
function cylinder(parent,r1,r2,h,m,x=0,y=0,z=0,sides=8){return mesh(new T.CylinderGeometry(r1,r2,h,sides),m,parent,x,y,z);}
function rod(parent,a,b,r,m){const v1=new T.Vector3(...a),v2=new T.Vector3(...b),d=v2.clone().sub(v1);const o=cylinder(parent,r,r,d.length(),m);o.position.copy(v1.add(v2).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
function bevel(parent,w,h,d,r,m,x=0,y=0,z=0){const sh=new T.Shape();sh.moveTo(-w/2+r,-h/2);sh.lineTo(w/2-r,-h/2);sh.lineTo(w/2,-h/2+r);sh.lineTo(w/2,h/2-r);sh.lineTo(w/2-r,h/2);sh.lineTo(-w/2+r,h/2);sh.lineTo(-w/2,h/2-r);sh.lineTo(-w/2,-h/2+r);sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.045,bevelThickness:.045});g.translate(0,0,-d/2);return mesh(g,m,parent,x,y,z);}
function textTexture(text,color='#dad3ba',bg=null){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,512,128);}ctx.fillStyle=color;ctx.font='bold 36px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;return tx;}
function label(parent,text,w,h,x,y,z){return mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textTexture(text),transparent:true,depthWrite:false}),parent,x,y,z);}
function anchor(key,group,position){targetGroups[key]=group;const a=new T.Object3D();a.position.set(...position);group.add(a);anchors[key]=a;group.traverse(o=>{if(o.isMesh){o.userData.target=key;o.layers.enable({tv:1,tools:2,map:3,about:4}[key]);hits.push(o);}});}
let seed=437;function random(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
// A continuous spherical surface; shallow irregular relief instead of stamped craters.
const planetRadius=240;
function groundHeight(x,z){const curvature=Math.sqrt(Math.max(0,planetRadius*planetRadius-x*x-z*z))-planetRadius;let relief=.24*Math.sin(x*.19+z*.08)+.14*Math.sin(z*.29-x*.13)+.045*Math.cos(x*.63+z*.41);let h=curvature+relief-.12;for(const [cx,cz,r] of [[-3,2,5],[5,2.5,2.7],[8.5,-8,4]]){const q=Math.min(1,Math.hypot(x-cx,z-cz)/r),mix=q*q*(3-2*q);h=-.12+(h+.12)*mix;}return h;}
const terrain=new T.SphereGeometry(planetRadius,192,128);const pos=terrain.attributes.position;
for(let i=0;i<pos.count;i++){const y=pos.getY(i);pos.setY(i,y>0?groundHeight(pos.getX(i),pos.getZ(i)):y-planetRadius);}terrain.computeVertexNormals();const lunarMaterial=groundMat.clone();lunarMaterial.flatShading=false;
// World-space dust variation avoids the radial UV streaks at a sphere's pole.
const dustColors=[];for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),v=.075+.014*Math.sin(x*.24+Math.sin(z*.17)*2)+.009*Math.cos(z*.38+x*.12);dustColors.push(v*1.03,v*.99,v*.96);}terrain.setAttribute('color',new T.Float32BufferAttribute(dustColors,3));lunarMaterial.vertexColors=true;lunarMaterial.color.setHex(0xffffff);
const terr=mesh(terrain,lunarMaterial,scene);terr.castShadow=false;
// Seat rotated rocks against the same lunar surface before calculating their shadows.
function seatRock(rock){rock.updateMatrixWorld(true);const vertices=rock.geometry.attributes.position,p=new T.Vector3();let lift=-Infinity;for(let i=0;i<vertices.count;i++){p.fromBufferAttribute(vertices,i).applyMatrix4(rock.matrixWorld);lift=Math.max(lift,groundHeight(p.x,p.z)-p.y);}rock.position.y+=lift-.025;rock.updateMatrixWorld(true);}
for(let i=0;i<65;i++){const x=(random()-.5)*85,z=(random()-.5)*72;if(Math.abs(x)<11&&z>-8&&z<9)continue;const size=.10+random()*.38;const rock=mesh(new T.DodecahedronGeometry(size,0),i%3?groundMat:purple,scene,x,groundHeight(x,z)+size*.35,z);rock.scale.set(1.4,.7,1);rock.rotation.set(random(),random()*6,random());seatRock(rock);}
// CRT: tactile clipped corners, inset glass, independent knobs and grilles.
const tv=new T.Group();tv.position.set(-3,0,2);scene.add(tv);
// Low equipment plinth, with seams and corner fasteners rather than a rock pedestal.
bevel(tv,6.6,.35,3.1,.12,graphite,.5,.07,-.1);box(tv,6.5,.065,3.05,metal,.5,.275,-.1);
for(const x of [-2.45,3.4]){box(tv,.15,.25,3.12,edge,x,.07,-.1);for(const z of [-1.3,1.1])cylinder(tv,.055,.055,.025,cream,x,.32,z,8);}
box(tv,1.15,.055,.04,warm,-1.55,.1,1.48);
// Walnut cabinet and a single right-hand control column, based on the supplied set.
const woodCanvas=document.createElement('canvas');woodCanvas.width=256;woodCanvas.height=256;const wc=woodCanvas.getContext('2d');wc.fillStyle='#79513a';wc.fillRect(0,0,256,256);for(let i=0;i<270;i++){const x=random()*256;wc.strokeStyle=i%3?'rgba(39,19,10,.16)':'rgba(211,155,100,.14)';wc.lineWidth=.3+random()*1.6;wc.beginPath();wc.moveTo(x,0);wc.bezierCurveTo(x+8,80,x-9,170,x+2,256);wc.stroke();}const woodTexture=new T.CanvasTexture(woodCanvas);woodTexture.colorSpace=T.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=T.RepeatWrapping;woodTexture.repeat.set(2,1);
const walnut=mat(0xffffff,{map:woodTexture,roughness:.76}),bakelite=mat(0x151619),trim=mat(0x96928a,{metalness:.65,roughness:.34});
bevel(tv,6.05,3.98,2.3,.09,walnut,.58,2.45,-.22);
bevel(tv,5.89,3.81,.12,.055,trim,.58,2.45,.98);
bevel(tv,5.78,3.7,.10,.06,bakelite,.58,2.45,1.06);
// Silver squared surround, then the softer recessed CRT lip.
bevel(tv,4.44,3.41,.11,.1,trim,-.06,2.45,1.13);
bevel(tv,4.34,3.31,.12,.18,graphite,-.06,2.45,1.19);
bevel(tv,4.15,3.12,.08,.25,dark,0,2.45,1.27);
const panelX=2.72;box(tv,.055,3.51,.04,trim,2.25,2.45,1.15);
bevel(tv,.88,1.35,.07,.035,trim,panelX,3.48,1.15);box(tv,.78,1.25,.08,bakelite,panelX,3.48,1.2);
for(let i=0;i<5;i++)box(tv,.68,.022,.018,trim,panelX,3.98-i*.045,1.26);
const dial=cylinder(tv,.245,.245,.16,bakelite,panelX,3.41,1.32,24);dial.rotation.x=Math.PI/2;box(tv,.055,.35,.045,metal,panelX,3.41,1.43).rotation.z=-.35;
for(let i=0;i<10;i++){const angle=i/10*Math.PI*2;const tick=box(tv,.018,.055,.015,cream,panelX+Math.sin(angle)*.33,3.41+Math.cos(angle)*.33,1.26);tick.rotation.z=-angle;}
for(let i=0;i<3;i++){const button=cylinder(tv,.075,.075,.07,trim,panelX-.26+i*.26,2.58,1.23,12);button.rotation.x=Math.PI/2;}
bevel(tv,.88,1.4,.08,.025,trim,panelX,1.6,1.15);box(tv,.8,1.3,.06,bakelite,panelX,1.6,1.22);
for(let i=0;i<19;i++)box(tv,.012,1.13,.025,metal,panelX-.35+i*.039,1.61,1.26);
box(tv,.16,.12,.035,graphite,panelX,1.09,1.29);box(tv,.035,.035,.025,glow,panelX+.3,2.79,1.27);
for(const x of [-1.75,2.45])box(tv,.35,.23,.7,bakelite,x,.38,0);
// Side vent is inset into the visible wooden cabinet.
box(tv,.025,.74,1.1,bakelite,3.65,3.35,-.18);for(let i=0;i<7;i++)box(tv,.035,.025,.92,metal,3.67,3.08+i*.085,-.18);
display=window.StationDisplay.create(T,renderer,records);display.mesh.scale.set(4.05/2.55,2.94/1.82,1);display.mesh.position.set(0,2.45,1.38);tv.add(display.mesh);
const powerCanvas=document.createElement('canvas');powerCanvas.width=powerCanvas.height=128;const pc=powerCanvas.getContext('2d');pc.strokeStyle='#e2d6ba';pc.lineWidth=6;pc.lineCap='round';pc.beginPath();pc.arc(64,68,27,-Math.PI*.32,Math.PI*1.32);pc.stroke();pc.beginPath();pc.moveTo(64,30);pc.lineTo(64,61);pc.stroke();powerGlyph=mesh(new T.PlaneGeometry(.3,.3),new T.MeshBasicMaterial({map:new T.CanvasTexture(powerCanvas),transparent:true}),tv,0,2.45,1.53);
label(tv,'STELLARBOOTH',1.15,.1,0,.77,1.2);cylinder(tv,.32,.4,.16,bakelite,-.3,4.51,-.25,16);for(const end of [[-1.55,6,-.4],[1.05,5.85,-.4]]){rod(tv,[-.3,4.58,-.25],end,.035,metal);mesh(new T.SphereGeometry(.055,8,6),trim,tv,...end);}anchor('tv',tv,[0,.45,1.3]);
const tvLight=new T.PointLight(0xd3e49b,.3,4);tvLight.position.set(-3,2.5,3.4);scene.add(tvLight);
const plinthLight=new T.PointLight(0xffbf7a,5,6,2);plinthLight.position.set(-4.5,.6,3.6);scene.add(plinthLight);
// Tool terminal, several metres to the right; sloped screen and physical buttons.
const terminal=new T.Group();terminal.position.set(5,0,3);terminal.rotation.y=-.24;scene.add(terminal);
const instrument=mat(0x8c8577),paint=mat(0x63676b);
bevel(terminal,2.6,1.55,1.65,.12,paint,0,.72,0);box(terminal,2.8,.14,1.8,graphite,0,.02,0);
for(const x of [-1.3,1.3])box(terminal,.07,1.05,1.1,metal,x,.8,0);
const face=new T.Group();face.position.set(0,1.58,.13);face.rotation.x=-Math.PI/3;terminal.add(face);bevel(face,2.65,1.35,.16,.08,instrument);
bevel(face,1.4,.82,.05,.05,dark,-.35,.1,.11);box(face,1.23,.65,.025,cream,-.35,.1,.21);
// Physical analog meter, a needle and three chunky switches.
for(let i=0;i<11;i++){const a=-1.15+i*.23;const tick=box(face,.018,.065,.018,graphite,-.35+Math.sin(a)*.5,-.13+Math.cos(a)*.42,.24);tick.rotation.z=-a;}
rod(face,[-.35,-.13,.25],[-.12,.42,.25],.017,dark);
for(let i=0;i<3;i++){const knob=cylinder(face,.11,.11,.09,i===0?warm:graphite,.83,.39-i*.35,.15,12);knob.rotation.x=Math.PI/2;}
for(let i=0;i<5;i++)box(face,.13,.1,.035,i===1?glow:graphite,-.83+i*.27,-.47,.15);
for(let i=0;i<10;i++)box(terminal,.045,.38,.025,dark,-.7+i*.15,.63,.84);
anchor('tools',terminal,[0,2.3,0]);
// A single slack cable follows the terrain, avoiding straight floating segments.
const cablePoints=[[-1,2.8],[0,3.5],[1.7,4.5],[3.3,4.25],[4.4,3.5]].map(([x,z])=>new T.Vector3(x,groundHeight(x,z)+.07,z));
mesh(new T.TubeGeometry(new T.CatmullRomCurve3(cablePoints),40,.055,6,false),dark,scene);
// A distant antenna with a faceted concave reflector and independent support frame.
const dish=new T.Group();dish.position.set(8.5,0,-8);scene.add(dish);cylinder(dish,1.5,1.65,.3,graphite,0,.02,0,8);for(const x of [-.85,.85])rod(dish,[x,.5,.45],[0,2.45,0],.11,graphite);rod(dish,[0,.5,-1],[0,2.45,0],.11,graphite);cylinder(dish,.32,.32,.5,metal,0,2.5,0,8);
const bowl=new T.Group();bowl.position.set(0,3.65,0);bowl.rotation.set(-.45,-.6,.2);dish.add(bowl);const verts=[],colors=[];const rings=5,segments=16,radius=2.3;
function dishPoint(r,a){return [Math.cos(a)*r,Math.sin(a)*r,r*r*.16];}
for(let ring=0;ring<rings;ring++)for(let j=0;j<segments;j++){const r0=radius*ring/rings,r1=radius*(ring+1)/rings,a0=j/segments*Math.PI*2,a1=(j+1)/segments*Math.PI*2;const pts=[dishPoint(r0,a0),dishPoint(r1,a0),dishPoint(r1,a1),dishPoint(r0,a0),dishPoint(r1,a1),dishPoint(r0,a1)];const col=new T.Color(j%3?0xb5a3ac:0x9b8d9d);pts.forEach(p=>{verts.push(...p);colors.push(col.r,col.g,col.b);});}
const bowlGeo=new T.BufferGeometry();bowlGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));bowlGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));bowlGeo.computeVertexNormals();mesh(bowlGeo,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1,flatShading:true}),bowl);
for(let i=0;i<3;i++){const a=i*2*Math.PI/3+.6;rod(bowl,[Math.cos(a)*2.15,Math.sin(a)*2.15,.74],[0,0,2.05],.035,graphite);}box(bowl,.16,.16,.35,warm,0,0,2.05);anchor('map',dish,[0,6.55,0]);
// A warm inhabited cabin set back from the television, with a sheltered doorway.
const cabin=new T.Group();cabin.position.set(-30,0,-7);cabin.scale.setScalar(4);cabin.rotation.y=.12;scene.add(cabin);
bevel(cabin,5,2.8,3,.24,paint,0,1.3,0);bevel(cabin,5.3,.25,3.3,.10,graphite,0,2.78,0);
for(const x of [-2.25,2.25])box(cabin,.12,2.6,3.06,metal,x,1.3,0);
bevel(cabin,1.85,1.22,.13,.12,dark,-.9,1.5,1.58);bevel(cabin,1.6,1,.06,.07,warm,-.9,1.5,1.67);
box(cabin,.065,1.03,.07,graphite,-.9,1.5,1.73);box(cabin,1.63,.065,.07,graphite,-.9,1.5,1.73);
bevel(cabin,1.08,2.16,.13,.09,graphite,1.22,1.04,1.59);box(cabin,.07,.29,.08,cream,1.57,1,1.7);
box(cabin,1.5,.12,.7,metal,1.2,2.35,1.85);box(cabin,.55,.055,.12,warm,1.2,2.23,1.85);
box(cabin,3.3,.2,1.25,graphite,.5,.02,2.15);box(cabin,1.65,.12,.5,metal,1.1,-.02,2.95);
rod(cabin,[-1.5,2.9,-.4],[-1.5,4.1,-.4],.035,metal);rod(cabin,[-2,3.7,-.4],[-1,3.7,-.4],.025,metal);
const windowLight=new T.PointLight(0xffba6d,45,24,2);windowLight.position.set(-.7,1.6,2.2);cabin.add(windowLight);
for(const [x,z,w] of [[-3,1,1],[-3.8,.9,.65]]){bevel(cabin,w,.6,.75,.05,graphite,x,.18,z);for(const dx of [-w*.3,w*.3])box(cabin,.055,.62,.78,instrument,x+dx,.18,z);}
// A level foundation on individually grounded piers, rather than flattening the moon.
box(cabin,5.12,.3,3.16,graphite,0,-.22,0);
box(cabin,3.3,.3,1.25,graphite,.5,-.22,2.15);
const cabinSupports=[[-2,-1.2],[2,-1.2],[-2,1.2],[2,1.2],[-.9,2.4],[1.8,2.4]].map(([x,z])=>({x,z,post:box(cabin,.2,1,.2,metal),foot:box(cabin,.5,.12,.5,graphite)}));
function groundCabin(){
 cabin.updateMatrixWorld(true);const points=cabinSupports.map(({x,z})=>new T.Vector3(x,0,z).applyMatrix4(cabin.matrixWorld));
 const levels=points.map(p=>groundHeight(p.x,p.z));cabin.position.y=Math.max(...levels)+1.55;
 cabinSupports.forEach(({x,z,post,foot},i)=>{const bottom=(levels[i]-cabin.position.y)/4,top=-.35;post.position.set(x,(bottom+top)/2,z);post.scale.y=Math.max(.05,top-bottom);foot.position.set(x,bottom+.03,z);});
}
anchor('about',cabin,[1.2,2,1.8]);
// Discrete warm beacons guide the eye through the open environment.
for(const [x,z] of [[-6,-5],[12,-3]]){cylinder(scene,.12,.18,.35,graphite,x,.12,z);rod(scene,[x,.2,z],[x,3,z],.035,metal);bevel(scene,.22,.38,.22,.035,warm,x,3,z);const lamp=new T.PointLight(0xffd0a0,1.4,7,2);lamp.position.set(x,2.8,z);scene.add(lamp);}
const skyPositions=[];for(let i=0;i<200;i++){const angle=random()*Math.PI*2,rad=65+random()*12;skyPositions.push(Math.sin(angle)*rad,2+random()*45,Math.cos(angle)*rad);}const starsGeo=new T.BufferGeometry();starsGeo.setAttribute('position',new T.Float32BufferAttribute(skyPositions,3));const stars=new T.Points(starsGeo,new T.PointsMaterial({color:0xcac2d0,size:.2,transparent:true,opacity:.65,sizeAttenuation:true,fog:false}));scene.add(stars);

// A distant, softly lit world: muted oceans and abstract land, no extra light source.
// Seamless spherical noise gives cloud banks and coastlines several scales of detail.
const worldTexture=new T.TextureLoader().load('assets/station-earth.png',()=>schedule());worldTexture.colorSpace=T.SRGBColorSpace;
const distantWorld=mesh(new T.SphereGeometry(360,128,96),new T.MeshStandardMaterial({map:worldTexture,roughness:1,emissive:0x08111f,emissiveIntensity:.08,fog:false}),scene,40,-388,-430);distantWorld.rotation.set(.15,-.7,-.2);distantWorld.castShadow=false;distantWorld.receiveShadow=false;
// Optical limb haze fades beyond the solid sphere instead of drawing a hard blue ring.
const atmosphereMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,vertexShader:`varying vec3 vPosition;varying vec3 vCenter;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vPosition=p.xyz;vCenter=(modelViewMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 vPosition;varying vec3 vCenter;void main(){vec3 ray=normalize(vPosition);float impact=length(cross(vCenter,ray));float outside=exp(-max(impact-360.0,0.0)/4.5)*(1.0-smoothstep(368.0,374.0,impact));float inside=pow(clamp(impact/360.0,0.0,1.0),18.0);float a=outside*inside*0.46;vec3 color=mix(vec3(0.17,0.35,0.7),vec3(0.57,0.79,1.0),pow(inside,3.0));gl_FragColor=vec4(color,a);}`});
const atmosphere=new T.Mesh(new T.SphereGeometry(374,128,96),atmosphereMaterial);atmosphere.position.copy(distantWorld.position);scene.add(atmosphere);
// Low, uneven veils of dust. Static masks keep the idle renderer inexpensive.
const mistCanvas=document.createElement('canvas');mistCanvas.width=256;mistCanvas.height=64;const mc=mistCanvas.getContext('2d'),mistPixels=mc.createImageData(256,64);
for(let y=0;y<64;y++)for(let x=0;x<256;x++){const nx=x/255*2-1,ny=y/63*2-1,falloff=Math.pow(Math.max(0,1-nx*nx),2)*Math.pow(Math.max(0,1-ny*ny),3),wisps=.6+.2*Math.sin(x*.061+y*.095)+.15*Math.cos(x*.11-y*.07),i=(y*256+x)*4;mistPixels.data[i]=131;mistPixels.data[i+1]=151;mistPixels.data[i+2]=180;mistPixels.data[i+3]=Math.round(falloff*wisps*36);}mc.putImageData(mistPixels,0,0);const mistTexture=new T.CanvasTexture(mistCanvas);mistTexture.colorSpace=T.SRGBColorSpace;
for(const [x,y,z,w,h] of [[-3,.3,-22,43,3.5],[17,-1,-36,48,4],[-20,.1,-18,22,2]]){const veil=new T.Sprite(new T.SpriteMaterial({map:mistTexture,transparent:true,depthWrite:false,fog:false,opacity:.7}));veil.position.set(x,y,z);veil.scale.set(w,h,1);scene.add(veil);}

// Sparse horizon glow and runway markers give the open terrain depth.
const hazeCanvas=document.createElement('canvas');hazeCanvas.width=hazeCanvas.height=128;const hazeContext=hazeCanvas.getContext('2d'),hazeGradient=hazeContext.createRadialGradient(64,64,0,64,64,64);hazeGradient.addColorStop(0,'#8779a745');hazeGradient.addColorStop(.5,'#59578120');hazeGradient.addColorStop(1,'#26234300');hazeContext.fillStyle=hazeGradient;hazeContext.fillRect(0,0,128,128);const haze=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(hazeCanvas),transparent:true,depthWrite:false,fog:false}));haze.position.set(-6,17,-65);haze.scale.set(95,24,1);scene.add(haze);
for(let i=0;i<6;i++){const x=-7+i*3.5,z=-3-i*.7;const y=groundHeight(x,z);box(scene,.25,.12,.35,graphite,x,y+.06,z);box(scene,.16,.035,.22,i%2?glow:warm,x,y+.13,z);}
// Sparse low stones at the edges leave the four destinations readable.
for(const [x,z,size] of [[-12,8,.8],[12,8,.65],[-10,-2,.4]]){const stone=mesh(new T.DodecahedronGeometry(size,1),groundMat,scene,x,groundHeight(x,z)+size*.3,z);stone.scale.set(1.6,.6,1);seatRock(stone);}
outline=window.StationOutline.create(T,renderer,scene,camera);
const ray=new T.Raycaster(),ndc=new T.Vector2(),projected=new T.Vector3();
function updateCamera(){const mobile=innerWidth<700;const aspect=canvas.clientWidth/canvas.clientHeight;cabin.position.set(mobile?-26:-30,0,mobile?-15:-7);groundCabin();dish.position.x=mobile?5:8.5;base=new T.Vector3(mobile?6:12,mobile?15:10,mobile?45:27);if(!mobile&&aspect<1.35)base.z+=5;baseLook=new T.Vector3(-.5,1.8,-2);closePos=new T.Vector3(-3,2.45,3.1+S.focusDistance(aspect));closeLook=new T.Vector3(-3,2.45,2.92);camera.aspect=aspect;camera.updateProjectionMatrix();renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);sunlight.shadow.needsUpdate=true;}
function cast(e){const r=canvas.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera);return ray.intersectObjects(hits,false)[0];}
function hover(e){if(document.querySelector('dialog[open]'))return;const hit=cast(e);if(state.mode==='focused'){const screenHit=ray.intersectObject(display.mesh,false)[0];const record=screenHit&&display.pick(screenHit.uv);canvas.style.cursor=record||(!display.powered&&screenHit)?'pointer':'default';return;}if(state.mode!=='scene')return;const key=hit?.object.userData.target;hovered=key||null;nearby=key||null;canvas.style.cursor=key?'pointer':'default';Object.entries(buttons).forEach(([k,b])=>b.classList.toggle('is-hovered',k===key));}
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){keyboardInput=false;if(Object.values(buttons).includes(document.activeElement))document.activeElement.blur();if(motion&&!reduced.matches)pointer=S.parallax(e.clientX/innerWidth*2-1,e.clientY/innerHeight*2-1);pendingPointer={clientX:e.clientX,clientY:e.clientY};schedule();}},{passive:true});canvas.addEventListener('pointerleave',()=>{pendingPointer=null;canvas.style.cursor='default';pointer={x:0,y:0};hovered=null;nearby=null;Object.values(buttons).forEach(b=>b.classList.remove('is-hovered'));schedule();});
let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<8){if(state.mode==='focused'){const hit=cast(e);if(hit?.object.userData.target!=='tv')leaveTV();else {const screenHit=ray.intersectObject(display.mesh,false)[0];if(screenHit){if(!display.powered)powerOn();else{const record=display.pick(screenHit.uv);if(record)selectProject(record);}}}}else{hover(e);if(hovered)activate(hovered);}}down=null;});canvas.addEventListener('pointercancel',()=>{down=null;});
function draw(now){raf=0;if(!renderer||document.hidden||!sceneVisible)return;const dt=Math.min(.05,(now-(last||now))/1000);last=now;introElapsed=reduced.matches?1.6:Math.min(1.6,introElapsed+dt);const old=state.mode;S.advance(state,dt);const t=state.progress*state.progress*(3-2*state.progress);mouse.x+=(pointer.x-mouse.x)*.035;mouse.y+=(pointer.y-mouse.y)*.035;camera.position.copy(base).lerp(closePos,t);const arrival=1-Math.pow(1-introElapsed/1.6,3);camera.position.addScaledVector(base.clone().sub(baseLook),.12*(1-arrival)*(1-t));camera.position.x+=mouse.x*(.6*(1-t)+.04*t);camera.position.y-=mouse.y*(.24*(1-t)+.02*t);camera.lookAt(baseLook.clone().lerp(closeLook,t));if(travel){travel.progress=Math.min(1,(now-travel.started)/1650);const q=travel.progress*travel.progress*(3-2*travel.progress);camera.position.copy(travel.from).lerp(travel.to,q);camera.lookAt(travel.lookFrom.clone().lerp(travel.look,q));page.style.setProperty('--travel-fade',String(Math.max(0,(travel.progress-.72)/.28)));if(travel.progress===1){location.href=travel.href;return;}}camera.updateMatrixWorld();scene.updateMatrixWorld(true);if(pendingPointer&&!travel&&state.mode==='scene')hover(pendingPointer);
for(const [key,a] of Object.entries(anchors)){a.getWorldPosition(projected);projected.project(camera);buttons[key].style.left=((projected.x*.5+.5)*canvas.clientWidth)+'px';buttons[key].style.top=((-projected.y*.5+.5)*canvas.clientHeight)+'px';}
powerGlyph.visible=!display.powered;powerGlyph.getWorldPosition(projected);projected.project(camera);powerButton.style.left=((projected.x*.5+.5)*canvas.clientWidth)+'px';powerButton.style.top=((-projected.y*.5+.5)*canvas.clientHeight)+'px';
const animate=display.powered&&frame.hidden&&state.mode==='focused'&&!paused&&!reduced.matches&&!document.querySelector('dialog[open]');if(frame.hidden||display.booting)display.update(dt,animate);
if(!frame.hidden){const corners=[[-2.025,1.47], [2.025,1.47], [2.025,-1.47],[-2.025,-1.47]].map(([x,y])=>{const v=new T.Vector3(x,y,0);display.mesh.localToWorld(v.set(x/display.mesh.scale.x,y/display.mesh.scale.y,0));v.project(camera);return [(v.x*.5+.5)*canvas.clientWidth,(-v.y*.5+.5)*canvas.clientHeight];});const m=S.projectiveMatrix(corners,1024,744);frame.style.transform='matrix3d('+m.join(',')+')';}
tvLight.intensity=display.powered?1.8:.3;
renderer.render(scene,camera);if(state.mode==='scene'&&!travel){const focused=keyboardInput&&Object.entries(buttons).find(([,b])=>b.matches(':focus-visible'))?.[0];outline.draw({tv:1,tools:2,map:3,about:4}[focused||nearby]||0);}if(state.mode!==old){setMode();if(state.mode==='focused'){showFocus();schedule();}if(state.mode==='scene'){status.textContent='';restoreSceneFocus();schedule();}}
if(introElapsed<1.6||travel||display.booting||animate||state.mode==='entering'||state.mode==='leaving'||Math.abs(pointer.x-mouse.x)>.002||Math.abs(pointer.y-mouse.y)>.002)schedule();}
schedule=()=>{if(!raf&&renderer&&!document.hidden&&sceneVisible)raf=requestAnimationFrame(draw);};
document.addEventListener('close',()=>schedule(),true);Object.values(buttons).forEach(b=>{b.addEventListener('focus',()=>schedule());b.addEventListener('blur',()=>schedule());});
window.addEventListener('pageshow',e=>{if(e.persisted){travel=null;page.style.removeProperty('--travel-fade');setMode();schedule();}});
window.addEventListener('resize',()=>{updateCamera();schedule();});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;}else schedule();});new IntersectionObserver(([entry])=>{sceneVisible=entry.isIntersecting;last=0;if(sceneVisible)schedule();else{cancelAnimationFrame(raf);raf=0;}}).observe(canvas);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});updateCamera();schedule();
}catch(error){console.error('Station scene unavailable',error);fallback();}

})();
