/* Permanent scenery-only pixel grid. Does not change geometry or hit testing. */
(()=>{
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';
 // Quantize display-space colors after pixel sampling. 48 levels keeps dark
 // terrain readable while merging nearby shades; alpha and DOM stay untouched.
 const levels=48;
 const palette=Array.from({length:levels},(_,i)=>(i/(levels-1)).toFixed(5)).join(' ');
 const colorSteps='<feComponentTransfer><feFuncR type="discrete" tableValues="'+palette+'"/><feFuncG type="discrete" tableValues="'+palette+'"/><feFuncB type="discrete" tableValues="'+palette+'"/><feFuncA type="identity"/></feComponentTransfer>';
 const sample='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="3" height="3"><path fill="white" d="M1 1h1v1H1z"/></svg>');
 svg.innerHTML='<defs><filter id="receiver-pixels" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage x="0" y="0" width="3" height="3" result="sample"/><feTile in="sample" result="grid"/><feComposite in="SourceGraphic" in2="grid" operator="in"/><feMorphology operator="dilate" radius="1.5"/>'+colorSteps+'</filter></defs>';
 svg.querySelector('feImage').setAttribute('href',sample);document.body.prepend(svg);
 document.body.classList.add('pixel-mode');
})();
