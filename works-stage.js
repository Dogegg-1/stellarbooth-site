(()=>{
  const stage=document.querySelector('#works');
  if(!stage||!('IntersectionObserver' in window)||!Element.prototype.animate)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),running=new Set();
  const cards=[...stage.querySelectorAll('.featured-work')];
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      observer.unobserve(entry.target);
      if(reduced.matches)continue;
      const card=entry.target,index=cards.indexOf(card);
      const resting=getComputedStyle(card).transform;
      const animation=card.animate([
        {opacity:.25,transform:`translateY(42px) rotate(${index%2?4:-4}deg)`},
        {opacity:1,transform:resting}
      ],{duration:560,delay:(index%4)*65,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'});
      running.add(animation);
      const clear=()=>running.delete(animation);
      animation.onfinish=clear;animation.oncancel=clear;
      // Interaction wins over the entrance animation, including keyboard focus.
      const cancel=()=>animation.cancel();
      card.addEventListener('pointerenter',cancel,{once:true});
      card.addEventListener('focus',cancel,{once:true});
    }
  },{threshold:.12});
  cards.forEach(card=>observer.observe(card));
  reduced.addEventListener('change',()=>{if(reduced.matches)running.forEach(animation=>animation.cancel());});
})();
