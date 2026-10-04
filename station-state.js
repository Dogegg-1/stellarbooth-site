(function(root){
 const clamp=v=>Number.isFinite(v)?Math.max(-1,Math.min(1,v)):0;
 const api={createState:()=>({mode:'scene',progress:0}),parallax:(x,y)=>({x:clamp(x),y:clamp(y)}),
 projectiveMatrix(p,w,h){const [a,b,c,d]=p,dx1=b[0]-c[0],dx2=d[0]-c[0],dx3=a[0]-b[0]+c[0]-d[0],dy1=b[1]-c[1],dy2=d[1]-c[1],dy3=a[1]-b[1]+c[1]-d[1],det=dx1*dy2-dx2*dy1;const g=Math.abs(det)<1e-8?0:(dx3*dy2-dx2*dy3)/det,k=Math.abs(det)<1e-8?0:(dx1*dy3-dx3*dy1)/det;return [(b[0]-a[0]+g*b[0])/w,(b[1]-a[1]+g*b[1])/w,0,g/w,(d[0]-a[0]+k*d[0])/h,(d[1]-a[1]+k*d[1])/h,0,k/h,0,0,1,0,a[0],a[1],0,1];},
 screenBoot(t){const p=Math.max(0,Math.min(1,t));return {width:Math.min(1,p*4),height:p===0?0:.012+.988*Math.max(0,Math.min(1,(p-.27)/.46)),picture:Math.max(0,Math.min(1,(p-.65)/.35))};},
 focusDistance(aspect){return Math.max(2.94/.91,4.05/(Math.max(.2,aspect)*.94))/(2*Math.tan(21*Math.PI/180));},
 enter(s,reduced=false){if(s.mode==='scene'||s.mode==='leaving'){s.mode=reduced?'focused':'entering';if(reduced)s.progress=1;}},
 exit(s,reduced=false){if(s.mode!=='scene'){s.mode=reduced?'scene':'leaving';if(reduced)s.progress=0;}},
 advance(s,dt){if(s.mode==='entering'){s.progress=Math.min(1,s.progress+dt/1.8);if(s.progress>=1-1e-8){s.progress=1;s.mode='focused';}}else if(s.mode==='leaving'){s.progress=Math.max(0,s.progress-dt/1.3);if(s.progress===0)s.mode='scene';}}
 };if(typeof module==='object')module.exports=api;else root.StationState=api;
})(typeof window==='object'?window:globalThis);
