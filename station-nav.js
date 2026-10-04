// Compatibility for saved pages; current pages load site-nav.js directly.
(()=>{if(document.querySelector('.global-site-nav'))return;const script=document.createElement('script');script.src=new URL('site-nav.js?v=12',document.currentScript.src).href;document.head.append(script);})();
