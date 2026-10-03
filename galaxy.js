(()=>{
  const host=document.querySelector('.galaxy-hero'),canvas=document.querySelector('#projectGalaxy');
  const records=(window.STAR_MAP_RESOURCES||[]).filter(r=>r.dataKind==='registered'&&r.representativeProject);
  const layer=document.querySelector('.galaxy-stars'),picker=document.querySelector('#galaxyPicker'),card=document.querySelector('#galaxyCard');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelector('#galaxyCount').textContent=`${records.length} 个项目`;
  let selected=-1,renderer,scene,camera,frame=0,visible=true,motion=!reduced.matches,last=0,time=0,tx=0,ty=0;
  const buttons=records.map((r,i)=>{
    const button=document.createElement('button');button.className='project-star';button.type='button';button.setAttribute('aria-label',`${r.representativeProject} · ${r.name}，查看项目`);button.setAttribute('aria-pressed','false');
    const label=document.createElement('span');label.textContent=r.representativeProject;button.append(label);layer.append(button);
    button.addEventListener('click',()=>select(i));
    const option=document.createElement('option');option.value=i;option.textContent=r.representativeProject;picker.append(option);return button;
  });
  function select(i){
    if(!records[i])return;selected=i;buttons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));picker.value=String(i);
    const r=records[i];card.hidden=false;card.querySelector('h2').textContent=r.representativeProject;card.querySelector('.star-team').textContent=r.name;
    card.querySelector('.star-description').textContent=r.description||'这颗星的故事，还在创作中。';card.querySelector('.star-stage').textContent=[r.projectStage,r.platformPlan].filter(Boolean).join(' · ');
    const cover=card.querySelector('img'),media=window.STAR_MAP_MEDIA?.[r.id];cover.hidden=true;cover.removeAttribute('src');
    if(media?.cover?.startsWith('https://shared.fastly.steamstatic.com/')){cover.alt=r.representativeProject+'作品封面';cover.onload=()=>{cover.hidden=false;};cover.onerror=()=>{cover.hidden=true;};cover.src=media.cover;}
    card.querySelector('a').href='./map.html?project='+encodeURIComponent(r.id);
    placeCard();
  }
  function placeCard(){
    if(card.hidden||selected<0)return;
    if(host.clientWidth<=640){card.style.left='';card.style.top='';return;}
    const bounds=host.getBoundingClientRect(),star=buttons[selected].getBoundingClientRect();
    const width=card.offsetWidth,height=card.offsetHeight;
    const x=star.right-bounds.left+14;
    card.style.left=Math.max(18,Math.min(x+width>bounds.width-18?star.left-bounds.left-width-14:x,bounds.width-width-18))+'px';
    card.style.top=Math.max(18,Math.min(star.top-bounds.top-height*.3,bounds.height-height-22))+'px';
  }
  new ResizeObserver(placeCard).observe(card);
  new ResizeObserver(placeCard).observe(host);
  function close(){card.hidden=true;buttons.forEach(b=>b.setAttribute('aria-pressed','false'));picker.value='';if(selected>=0)buttons[selected].focus();selected=-1;}
  card.querySelector('button').addEventListener('click',close);host.addEventListener('keydown',e=>{if(e.key==='Escape'&&!card.hidden)close();});picker.addEventListener('change',()=>{if(picker.value!=='')select(Number(picker.value));});
  const toggle=document.querySelector('#galaxyMotion');
  function updateToggle(){const label=motion?'暂停漫游':'开启漫游';toggle.querySelector('.motion-label').textContent=label;toggle.setAttribute('aria-label',label);toggle.title=label;toggle.setAttribute('aria-pressed',String(motion));}
  toggle.addEventListener('click',()=>{motion=!motion;updateToggle();schedule();});updateToggle();
  function fallback(){cancelAnimationFrame(frame);frame=0;host.classList.add('galaxy-fallback');toggle.hidden=true;renderer?.dispose();renderer=null;document.querySelector('#galaxyHint').textContent='从列表中选择项目';}
  if(!records.length){document.querySelector('#galaxyCount').textContent='项目星图正在整理';picker.disabled=true;}
  const T=window.THREE;if(!T){fallback();return;}
  const nodes=[];
  const wake=window.createGalaxyWake(),wakeAspect={value:1};
  let starHovered=false;
  buttons.forEach(button=>{button.addEventListener("pointerenter",()=>{starHovered=true;});button.addEventListener("pointerleave",()=>{starHovered=false;});});
  try{
    renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
    scene=new T.Scene();camera=new T.PerspectiveCamera(42,1,.1,100);camera.position.set(0,6,21);camera.lookAt(0,0,0);
    const group=new T.Group();group.scale.setScalar(1.2);group.rotation.z=-.32;group.rotation.x=.55;scene.add(group);
    const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=64;const ctx=textureCanvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.1,'#ffffffcc');g.addColorStop(.4,'#ffffff28');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const texture=new T.CanvasTexture(textureCanvas);
    const positions=[],colors=[];let seed=731;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    // Soft atmospheric dust is decorative; selectable stars alone represent projects.
    for(let i=0;i<2900;i++){const radius=Math.pow(rand(),.65)*10,arm=i%3*Math.PI*2/3,angle=radius*.48+arm+(rand()-.5)*(.18+radius*.045);positions.push(Math.cos(angle)*radius,(rand()-.5)*(.18+radius*.045),Math.sin(angle)*radius*.8);const c=new T.Color(i%9===0?'#e3eab9':i%3===0?'#b49ae7':'#9694b5');colors.push(c.r,c.g,c.b);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));group.add(new T.Points(geo,new T.PointsMaterial({map:texture,size:.27,transparent:true,opacity:.87,vertexColors:true,depthWrite:false,blending:T.AdditiveBlending})));
    // A dense, fine-particle center avoids the hard circular edges of oversized sprites.
    const corePositions=[];for(let i=0;i<600;i++){const radius=Math.pow(rand(),1.8)*2.6,angle=rand()*Math.PI*2;corePositions.push(Math.cos(angle)*radius,(rand()-.5)*.3,Math.sin(angle)*radius*.8);}const coreGeo=new T.BufferGeometry();coreGeo.setAttribute('position',new T.Float32BufferAttribute(corePositions,3));group.add(new T.Points(coreGeo,new T.PointsMaterial({map:texture,size:.13,transparent:true,opacity:.7,color:'#e5d4ff',depthWrite:false,blending:T.AdditiveBlending})));
    const farPositions=[];for(let i=0;i<70;i++)farPositions.push((rand()-.5)*35,(rand()-.5)*20,-5-rand()*12);const farGeo=new T.BufferGeometry();farGeo.setAttribute('position',new T.Float32BufferAttribute(farPositions,3));scene.add(new T.Points(farGeo,new T.PointsMaterial({map:texture,size:.11,transparent:true,opacity:.45,color:'#ded3ba',depthWrite:false})));
    records.forEach((r,i)=>{const angle=i*2.399963,rad=2.3+Math.sqrt((i+.5)/Math.max(records.length,1))*7.8;const node=new T.Object3D();node.position.set(Math.cos(angle)*rad,(i%5-2)*.23,Math.sin(angle)*rad*.47);group.add(node);nodes.push(node);});
        // Only dust materials get this shader. Project nodes and their hit targets stay intact.
    group.children.filter(child=>child.isPoints).forEach(dust=>{
      dust.material.onBeforeCompile=shader=>{
        shader.uniforms.uWake={value:wake.points};shader.uniforms.uWakeAspect=wakeAspect;
        shader.vertexShader=`uniform vec4 uWake[8];
uniform float uWakeAspect;
`+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
          vec2 screen = gl_Position.xy / gl_Position.w;
          vec2 push = vec2(0.0);
          for (int i=0; i<8; i++) {
            vec2 delta = (screen-uWake[i].xy)*vec2(uWakeAspect,1.0);
            float distanceToMouse = length(delta);
            float influence = 1.0-smoothstep(0.005,0.115,distanceToMouse);
            vec2 direction = delta/max(distanceToMouse,0.008);
            vec2 curl = vec2(-direction.y,direction.x);
            push += (direction*0.005+curl*0.002*uWake[i].w)*influence*uWake[i].z;
          }
          float pushLength=length(push);
          push*=min(1.0,0.014/max(pushLength,0.0001));
          gl_Position.xy += push/vec2(uWakeAspect,1.0)*gl_Position.w;
        `);
      };
      dust.material.customProgramCacheKey=()=> 'stellar-wake-v1';
    });
    const projected=new T.Vector3();let width=1,height=1;
    function resize(){width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);renderer?.setSize(width,height,false);camera.aspect=width/height;wakeAspect.value=camera.aspect;camera.position.z=Math.max(22,12/(Math.tan(21*Math.PI/180)*camera.aspect));camera.fov=42;camera.updateProjectionMatrix();schedule();}
    function draw(now){frame=0;if(!renderer||!visible||document.hidden||host.dataset.power==="off")return;const dt=Math.min((now-(last||now))/1000,.05);last=now;if(motion&&!reduced.matches&&!starHovered&&card.hidden&&!buttons.includes(document.activeElement))time+=dt;camera.position.x+=(tx-camera.position.x)*.07;camera.position.y+=(6+ty-camera.position.y)*.07;camera.lookAt(0,0,0);group.rotation.y=time*.035;group.updateMatrixWorld(true);if(motion&&!reduced.matches)wake.step(dt);else wake.clear();renderer.render(scene,camera);
      nodes.forEach((node,i)=>{node.getWorldPosition(projected);projected.project(camera);const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;buttons[i].style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;});
      if((motion&&!reduced.matches)||Math.abs(camera.position.x-tx)>.01||Math.abs(camera.position.y-6-ty)>.01)schedule();
    }
    function requestDraw(){if(!frame&&renderer&&visible&&!document.hidden&&host.dataset.power!=="off")frame=requestAnimationFrame(draw);}
    schedule=requestDraw;
    host.addEventListener("stellar-power",()=>{last=0;schedule();});
    host.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches||!motion)return;const bounds=canvas.getBoundingClientRect();if(card.hidden&&!e.target.closest('button,a,select'))wake.sample(e.clientX-bounds.left,e.clientY-bounds.top,e.timeStamp,bounds.width,bounds.height);else wake.leave();const r=host.getBoundingClientRect();tx=0;ty=0;schedule();},{passive:true});
    host.addEventListener('pointerleave',()=>{wake.leave();tx=ty=0;schedule();});
    new ResizeObserver(resize).observe(host);
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){last=0;schedule();}else{cancelAnimationFrame(frame);frame=0;}},{threshold:0}).observe(host);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{last=0;schedule();}});
    reduced.addEventListener('change',()=>{motion=!reduced.matches;tx=ty=0;updateToggle();schedule();});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});resize();
  }catch(error){fallback();}
  function schedule(){}
})();
