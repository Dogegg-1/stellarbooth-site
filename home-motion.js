(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const sections=document.querySelectorAll('.section-heading,.gather-card,.destination-grid,.participation,.closing');
  let observer;
  if('IntersectionObserver' in window&&!reduced.matches){
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
    sections.forEach(el=>{el.classList.add('reveal-ready');observer.observe(el);});
  }
  let frame=0;
  document.querySelectorAll('.hero-art,.destination').forEach(el=>{
    el.addEventListener('pointermove',event=>{
      if(reduced.matches||!fine.matches)return;
      cancelAnimationFrame(frame);
      const x=event.clientX,y=event.clientY;
      frame=requestAnimationFrame(()=>{
        const r=el.getBoundingClientRect(),px=(x-r.left)/r.width,py=(y-r.top)/r.height;
        el.style.setProperty('--glow-x',`${px*100}%`);el.style.setProperty('--glow-y',`${py*100}%`);
        if(el.classList.contains('hero-art')){el.style.setProperty('--move-x',`${(px-.5)*9}px`);el.style.setProperty('--move-y',`${(py-.5)*7}px`);}
      });
    },{passive:true});
    el.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);el.style.removeProperty('--move-x');el.style.removeProperty('--move-y');el.style.removeProperty('--glow-x');el.style.removeProperty('--glow-y');});
  });
  reduced.addEventListener('change',()=>{if(reduced.matches){observer?.disconnect();sections.forEach(el=>el.classList.add('is-visible'));cancelAnimationFrame(frame);}});
})();
