/* Small fixed-size trail: no particle buffers or DOM nodes allocated per frame. */
(function(root){
  function createWake(){
    const points=new Float32Array(32),ages=new Float32Array(8),power=new Float32Array(8);
    let next=0,last=null;
    function clear(){points.fill(0);ages.fill(0);power.fill(0);last=null;next=0;}
    function sample(x,y,now,width,height){
      if(!Number.isFinite(x+y+now+width+height)||width<=0||height<=0)return;
      if(x<0||y<0||x>width||y>height){last=null;return;}
      const previous=last;last={x,y,now};
      if(!previous||now-previous.now>160||now<=previous.now)return;
      const distance=Math.hypot(x-previous.x,y-previous.y);
      if(distance<2)return;
      const strength=Math.min(.55,.12+distance/(now-previous.now)*.12);
      const i=next;next=(next+1)%8;
      points[i*4]=x/width*2-1;points[i*4+1]=1-y/height*2;
      power[i]=strength;ages[i]=0;points[i*4+2]=strength;points[i*4+3]=0;
    }
    function step(dt){
      for(let i=0;i<8;i++){
        ages[i]+=Math.max(0,Math.min(dt,.1));
        const life=Math.max(0,1-ages[i]/.85);
        points[i*4+2]=power[i]*life*life;points[i*4+3]=1-life;
      }
    }
    return {points,sample,step,clear,leave(){last=null;}};
  }
  if(typeof module==='object'&&module.exports)module.exports=createWake;
  else root.createGalaxyWake=createWake;
})(typeof window==='undefined'?globalThis:window);
