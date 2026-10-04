/* A live galaxy rendered into the physical CRT. No document or camera swap. */
window.StationDisplay={create(T,renderer,records){
 const target=new T.WebGLRenderTarget(1024,768,{depthBuffer:true});
 const world=new T.Scene();world.background=new T.Color(0x060810);
 const camera=new T.PerspectiveCamera(42,4/3,.1,50);camera.position.set(0,4.3,6.7);camera.lookAt(0,0,0);
 const galaxy=new T.Group();world.add(galaxy);
 let seed=92;const random=()=>{seed=seed*16807%2147483647;return (seed-1)/2147483646;};
 const dot=document.createElement('canvas');dot.width=dot.height=64;const ctx=dot.getContext('2d'),gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'#fff');gradient.addColorStop(.16,'#fff');gradient.addColorStop(.42,'#ffffff70');gradient.addColorStop(1,'#ffffff00');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const dotMap=new T.CanvasTexture(dot);
 const positions=[],colors=[];for(let i=0;i<1100;i++){const r=.12+Math.pow(random(),.6)*2.9;const a=(i%3)*Math.PI*2/3+r*1.65+(random()-.5)*.5;positions.push(Math.cos(a)*r,(random()-.5)*.15,Math.sin(a)*r);const c=new T.Color(i%5?0x958ab3:0xc2c995);colors.push(c.r,c.g,c.b);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));galaxy.add(new T.Points(geometry,new T.PointsMaterial({map:dotMap,size:.075,vertexColors:true,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending})));
 const nodes=records.map((record,i)=>{const radius=.5+Math.sqrt(random())*2.15,a=random()*Math.PI*2;const node=new T.Sprite(new T.SpriteMaterial({map:dotMap,color:i%3?0xc9b9ee:0xdbe7a3,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));node.position.set(Math.cos(a)*radius,.07,Math.sin(a)*radius);node.scale.setScalar(.2);node.userData.record=record;galaxy.add(node);return node;});
 const hud=document.createElement('canvas');hud.width=1024;hud.height=768;const hc=hud.getContext('2d');hc.fillStyle='#e4dec9';hc.font='bold 44px "Microsoft Yahei",sans-serif';hc.fillText('星游集',105,100);hc.fillStyle='#b9abc9';hc.font='18px monospace';hc.fillText('STELLARBOOTH / GAME SIGNALS',106,139);hc.font='17px "Microsoft Yahei",sans-serif';hc.fillText(records.length+' 个项目信号 · 点击星星',106,682);hc.textAlign='right';hc.fillStyle='#d3dba8';hc.fillText('LIVE  ◦',911,682);const hudMap=new T.CanvasTexture(hud);hudMap.colorSpace=T.SRGBColorSpace;
 const uniforms={picture:{value:target.texture},hud:{value:hudMap},power:{value:0},width:{value:0},height:{value:0},reveal:{value:0}};
 const material=new T.ShaderMaterial({uniforms,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D picture;uniform sampler2D hud;uniform float power,width,height,reveal;varying vec2 vUv;
 void main(){vec2 q=abs(vUv-.5);vec2 corner=max(q-vec2(.43,.41),0.);if(length(corner)>.075)discard;
 vec3 base=vec3(.003,.004,.008);float edge=1.-.4*pow(length((vUv-.5)*1.5),2.);vec3 stars=texture2D(picture,vUv).rgb;vec4 text=texture2D(hud,vUv);vec3 lit=mix(stars,text.rgb,text.a)*edge;lit*=.94+.06*sin(vUv.y*768.*3.14159);float area=(1.-smoothstep(width*.49,width*.49+.012,q.x))*(1.-smoothstep(height*.49,height*.49+.008,q.y));vec3 boot=mix(vec3(.9,.91,.94),lit,reveal);vec3 color=mix(base,boot,area*power);color+=vec3(.018,.016,.023)*pow(1.-vUv.y,5.);gl_FragColor=vec4(color,1.);
#include <colorspace_fragment>
}`});
 const screenGeometry=new T.PlaneGeometry(2.55,1.82,32,24),p=screenGeometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)/1.275,y=p.getY(i)/.91;p.setZ(i,.13*(1-x*x)*(1-y*y));}screenGeometry.computeVertexNormals();
 const mesh=new T.Mesh(screenGeometry,material);mesh.position.set(-.33,2.19,1.04);
 const ray=new T.Raycaster();let elapsed=0,powered=false,selected=null;
 return {mesh,get powered(){return powered;},get booting(){return powered&&elapsed<1.1;},turnOn(reduced){powered=true;elapsed=reduced?1.1:0;},select(record){selected=record;},
 update(dt,animate){if(!powered)return;elapsed=Math.min(1.1,elapsed+dt);const boot=window.StationState.screenBoot(elapsed/1.1);uniforms.power.value=1;uniforms.width.value=boot.width;uniforms.height.value=boot.height;uniforms.reveal.value=boot.picture;if(animate)galaxy.rotation.y+=dt*.035;nodes.forEach(n=>n.scale.setScalar(n.userData.record===selected? .3 : .2));renderer.setRenderTarget(target);renderer.render(world,camera);renderer.setRenderTarget(null);},
 pick(uv){if(!powered||elapsed<1.1)return null;ray.setFromCamera(new T.Vector2(uv.x*2-1,uv.y*2-1),camera);world.updateMatrixWorld(true);return ray.intersectObjects(nodes,false)[0]?.object.userData.record||null;},
 dispose(){target.dispose();geometry.dispose();screenGeometry.dispose();material.dispose();dotMap.dispose();hudMap.dispose();galaxy.traverse(o=>{o.material?.dispose();});}
 };
}};

