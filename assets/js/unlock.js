(() => {
 const root=document.querySelector('#unlockRoot'); if(!root)return;
 const steps=[
  {id:'power',wait:12,label:'切断控制箱 K2 供电，等待电容放电'},
  {id:'release',wait:14,label:'拉下机械释放杆并保持到指示销归位'},
  {id:'latch',wait:16,label:'退出服务闩保险，再从外侧推门'}
 ];
 let idx=0,running=false,start=0,totalTimer=null;
 const out=document.querySelector('#unlockOutput'),btn=document.querySelector('#unlockAction'),cd=document.querySelector('#unlockCountdown'),door=document.querySelector('#doorStatus');
 const render=()=>{
   document.querySelectorAll('.unlock-step').forEach((el,i)=>{el.classList.toggle('done',i<idx);el.classList.toggle('active',i===idx&&idx<steps.length)});
   if(idx<steps.length){btn.textContent=steps[idx].label;btn.disabled=running}else finish();
 };
 btn.addEventListener('click',()=>{
   if(running||idx>=steps.length)return;
   if(!start){start=Date.now();totalTimer=setInterval(()=>{document.querySelector('#unlockElapsed').textContent=fmt(Date.now()-start)},1000)}
   running=true;btn.disabled=true;let left=steps[idx].wait;cd.textContent=left+'s';
   out.textContent=`正在执行：${steps[idx].label}\n按维护手册保持当前状态，不要提前复位。`;
   const t=setInterval(()=>{left--;cd.textContent=left+'s';if(left<=0){clearInterval(t);running=false;idx++;out.textContent='步骤完成。设备反馈正常，可以继续下一项。';render()}},1000)
 });
 function finish(){
   if(btn.dataset.finished)return;btn.dataset.finished='1';clearInterval(totalTimer);btn.classList.add('hidden');cd.textContent='OPEN';door.textContent='SERVICE LATCH RELEASED / OPEN';door.classList.add('open');
   const ms=Date.now()-start,real=fmt(ms);window.BDY?.set?.({unlock:true});
   out.textContent=`机械释放流程完成。\n训练压缩用时：${real}\n维护培训参考：02:37\n事故当晚，从首次退出请求到门体打开：48:00`;
   document.querySelector('#unlockResult')?.classList.remove('hidden')
 }
 function fmt(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 render();
})();
