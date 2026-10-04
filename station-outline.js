/* Screen-space silhouette: one small mask pass only while an object is near/focused. */
window.StationOutline={create(T,renderer,scene,camera){
 const target=new T.WebGLRenderTarget(1,1,{depthBuffer:true});
 const white=new T.MeshBasicMaterial({color:0xffffff,fog:false});
 const overlay=new T.Scene(),ortho=new T.OrthographicCamera(-1,1,1,-1,0,1);
 const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
  uniforms:{mask:{value:target.texture},pixel:{value:new T.Vector2(1,1)}},
  vertexShader:'varying vec2 uvMask;void main(){uvMask=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D mask;uniform vec2 pixel;varying vec2 uvMask;
   void main(){float center=texture2D(mask,uvMask).r;float edge=0.;
    for(int i=0;i<16;i++){float a=float(i)*6.2831853/16.;edge=max(edge,texture2D(mask,uvMask+vec2(cos(a),sin(a))*pixel*2.4).r);}
    gl_FragColor=vec4(.85,.9,.65,max(0.,edge-center)*.94);}`});
 const quad=new T.Mesh(new T.PlaneGeometry(2,2),material);overlay.add(quad);
 return {draw(layer){if(!layer)return;
  const w=renderer.domElement.clientWidth,h=renderer.domElement.clientHeight;
  if(target.width!==w||target.height!==h){target.setSize(w,h);material.uniforms.pixel.value.set(1/w,1/h);}
  const oldMask=camera.layers.mask,oldOverride=scene.overrideMaterial,oldTarget=renderer.getRenderTarget(),oldClear=renderer.getClearColor(new T.Color()),oldAlpha=renderer.getClearAlpha(),oldAuto=renderer.autoClear;
  try{camera.layers.set(layer);scene.overrideMaterial=white;renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.autoClear=true;renderer.clear();renderer.render(scene,camera);
   renderer.setRenderTarget(oldTarget);renderer.autoClear=false;renderer.render(overlay,ortho);
  }finally{camera.layers.mask=oldMask;scene.overrideMaterial=oldOverride;renderer.setRenderTarget(oldTarget);renderer.setClearColor(oldClear,oldAlpha);renderer.autoClear=oldAuto;}
 },dispose(){target.dispose();white.dispose();material.dispose();quad.geometry.dispose();}};
}};
