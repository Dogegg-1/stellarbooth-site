(()=>{
  const button=document.querySelector('.copy-address');
  const status=document.querySelector('.copy-status');
  button?.addEventListener('click',async()=>{
    const address='杭州良渚数字文化社区 4 幢 3 层 · 星游集';
    try{await navigator.clipboard.writeText(address);status.textContent='地址已复制';}
    catch{status.textContent='请长按或选中上方地址复制。';}
  });
})();
