(function(root){
  const KEY='stellar-project-library-v1';
  function create(storage,known){
    const valid=new Set(known);let saved={favorites:[],recent:[]},persistent=true;
    const clean=items=>Array.isArray(items)?[...new Set(items.filter(id=>typeof id==='string'&&valid.has(id)))]:[];
    try{const raw=JSON.parse(storage.getItem(KEY)||'{}');saved={favorites:clean(raw?.favorites),recent:clean(raw?.recent).slice(0,20)};}catch{persistent=false;}
    const write=()=>{try{storage.setItem(KEY,JSON.stringify(saved));persistent=true;}catch{persistent=false;}};
    return {list:kind=>[...(saved[kind]||[])],has:id=>saved.favorites.includes(id),persistent:()=>persistent,
      toggle(id){if(!valid.has(id))return;saved.favorites=saved.favorites.includes(id)?saved.favorites.filter(x=>x!==id):[id,...saved.favorites];write();},
      visit(id){if(!valid.has(id))return;saved.recent=[id,...saved.recent.filter(x=>x!==id)].slice(0,20);write();},
      clearRecent(){saved.recent=[];write();}
    };
  }
  if(typeof module!=='undefined')module.exports={create};else root.StellarCollectionStore={create};
})(typeof window==='undefined'?globalThis:window);
