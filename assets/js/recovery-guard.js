(()=>{
  const KEY='bdy_state_v3';
  let state={};
  try{state=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}
  const allowed=!!(state.incident||state.unlock||state.ending);
  if(!allowed){
    sessionStorage.setItem('bdy_recovery_blocked','1');
    location.replace('index.html');
    return;
  }
  localStorage.setItem('bdy_local_seen','1');
})();
