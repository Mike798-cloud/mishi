(() => {
 const root=document.querySelector('#unlockRoot'); if(!root)return;
 const steps=[
  {id:'power',wait:12,label:'切断控制箱 K2 供电，等待电容放电'},
  {id:'release',wait:14,label:'拉下机械释放杆并保持到指示销归位'},
  {id:'latch',wait:16,label:'从服务侧退出保险闩，再推开门体'}
 ];
 let idx=0, running=false,start=0,totalTimer=null;
 const out=document.querySelector('#unlockOutput'),btn=document.querySelector('#unlockAction'),cd=document.querySelector('#unlockCountdown');
 const render=()=>{document.querySelectorAll('.unlock-step').forEach((el,i)=>el.classList.toggle('done',i<idx)); if(idx<steps.length){btn.textContent=steps[idx].label;btn.disabled=running}else{finish()}};
 btn.addEventListener('click',()=>{if(running||idx>=steps.length)return;if(!start){start=Date.now();totalTimer=setInterval(()=>{document.querySelector('#unlockElapsed').textContent=fmt(Date.now()-start)},1000)}running=true;btn.disabled=true;let left=steps[idx].wait;cd.textContent=left+'s';out.textContent=`正在执行：${steps[idx].label}\n按照维护手册保持当前状态，不要提前恢复供电。`;const t=setInterval(()=>{left--;cd.textContent=left+'s';if(left<=0){clearInterval(t);running=false;idx++;out.textContent='步骤完成。设备反馈正常，可以继续下一项。';render()}},1000)});
 function finish(){clearInterval(totalTimer);btn.classList.add('hidden');cd.textContent='OPEN';document.querySelector('.door-leaf')?.classList.add('open');document.querySelector('.lock-led')?.classList.add('off');const ms=Date.now()-start;const real=fmt(ms);window.JNC?.set?.({unlock:true});out.textContent=`机械解锁完成。\n本次模拟用时：${real}\n维护培训参考：02:37（训练镜像采用压缩计时）\n事故当晚，从首次退出请求到房门开启：48:00`;document.querySelector('#unlockResult')?.classList.remove('hidden')}
 function fmt(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 render();
})();
