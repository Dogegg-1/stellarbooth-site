(()=>{
  if(!('IntersectionObserver' in window)||!Element.prototype.animate)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const active=new Map(),presets=new Map();
  const register=(selector,type)=>document.querySelectorAll(selector).forEach((el,index)=>presets.set(el,{type,index}));
  register('#events .community-heading, #about .hero-copy, #services .section-heading, #space .space-copy, #partners .section-heading, #contact .contact-heading','title');
  register('#events .event-empty, #events .event-card, #participation, #services .service-row, #partners .partner','row');
  register('#about .hero-scene, #space .space-photo, #space .moments figure','photo');
  const finish=el=>{const animation=active.get(el);if(animation){active.delete(el);animation.cancel();}};
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      const el=entry.target;observer.unobserve(el);
      if(reduced.matches||el.contains(document.activeElement))return;
      const {type,index}=presets.get(el),narrow=innerWidth<641;
      const end=getComputedStyle(el).transform;
      const frames=type==='photo' ? [
        {opacity:.5,clipPath:'inset(10% 7% 10% 7%)',transform:'translateY(24px) rotate(2deg)'},
        {opacity:1,clipPath:'inset(0% 0% 0% 0%)',transform:end}
      ] : [
        {opacity:.25,transform:`translate(${type==='title'?-18:(index%2?-24:24)}px,${narrow?18:30}px) rotate(${type==='title'?-2:0}deg)`},
        {opacity:1,transform:end}
      ];
      const animation=el.animate(frames,{duration:type==='photo'?850:620,delay:type==='row'?(index%4)*55:0,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
      active.set(el,animation);
      animation.onfinish=()=>active.delete(el);
      animation.oncancel=()=>active.delete(el);
    });
  },{threshold:.12});
  presets.forEach((_,el)=>observer.observe(el));
  // Never make keyboard navigation or a quick click wait for an entrance.
  document.addEventListener('focusin',event=>active.forEach((_,el)=>{if(el.contains(event.target))finish(el);}));
  document.addEventListener('pointerdown',event=>active.forEach((_,el)=>{if(el.contains(event.target))finish(el);}));
  const stop=()=>{for(const el of [...active.keys()])finish(el);};
  reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
