(()=>{
  document.querySelectorAll('video[data-clip-start]').forEach(v=>{
    const start=Number(v.dataset.clipStart||0), end=Number(v.dataset.clipEnd||0), loop=v.dataset.clipLoop==='1';
    const seek=()=>{try{ if(Math.abs(v.currentTime-start)>.35) v.currentTime=start; }catch(e){}};
    v.addEventListener('loadedmetadata',seek);
    v.addEventListener('play',()=>{ if(v.currentTime<start-.3 || (end&&v.currentTime>=end)) seek(); });
    v.addEventListener('timeupdate',()=>{ if(end&&v.currentTime>=end){ if(loop){v.currentTime=start;v.play().catch(()=>{});} else {v.pause();v.currentTime=Math.min(end,v.duration||end);} } });
    v.addEventListener('error',()=>{
      v.classList.add('media-unavailable');
      const n=document.createElement('div'); n.className='media-error'; n.textContent='录像源暂时无法读取，请稍后重试。'; v.after(n);
    },{once:true});
  });
})();
