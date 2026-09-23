(()=>{
 const photo=document.querySelector('#trainingPhoto'), img=document.querySelector('#trainingImage'), spots=document.querySelector('#trainingHotspots');
 if(!photo||!img||!spots)return;
 const levelEl=document.querySelector('#trainingLevel'),countEl=document.querySelector('#trainingCount'),taskEl=document.querySelector('#trainingTask'),log=document.querySelector('#trainingLog'),next=document.querySelector('#trainingNext'),stamp=document.querySelector('#trainingStamp');
 const stages=[
  {name:'L1 / 闭店层',task:'确认闭店区域的通道边界与临时隔离位置。',img:'https://upload.wikimedia.org/wikipedia/commons/1/1f/Gfp-corridor-of-shopping-mall.jpg',pts:[{x:34,y:60,w:18,h:20,label:'通道边界 / 已确认'},{x:70,y:42,w:16,h:22,label:'隔离位置 / 已确认'}]},
  {name:'L2 / 收场区',task:'确认收场区的临时堆放位与人员通行边界。',img:'https://upload.wikimedia.org/wikipedia/commons/0/0e/Sugarloaf_Mills_Food_Court.jpg',pts:[{x:18,y:56,w:18,h:19,label:'临时堆放位 / 已确认'},{x:63,y:48,w:19,h:22,label:'通道边界 / 已确认'}]},
  {name:'L3 / 未开放路线',task:'确认后勤路线的转折点和服务区方向。完成后读取当班设备编号。',img:'https://upload.wikimedia.org/wikipedia/commons/9/97/Sugarloaf_Mills_south_corridor.jpg',pts:[{x:24,y:30,w:19,h:27,label:'路线转折 / 已确认'},{x:67,y:39,w:17,h:25,label:'服务区方向 / 已确认'}]}
 ];
 let level=0,found=new Set(),offline=false;
 function render(){
  if(localStorage.getItem('jnc_game_complete')==='1'){document.querySelector('#gameResult')?.classList.remove('hidden');next.disabled=true;next.textContent='已完成';stamp.textContent='归档完成';stamp.classList.add('done');}
  const s=stages[level]; found=new Set(); offline=false;photo.classList.remove('offline-training'); levelEl.textContent=s.name; taskEl.textContent=s.task; countEl.textContent='0 / 2'; next.disabled=true; stamp.textContent='待巡检'; stamp.classList.remove('done'); log.textContent='等待巡检确认。'; img.src=s.img; spots.innerHTML='';
  s.pts.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='training-hotspot';b.style.left=p.x+'%';b.style.top=p.y+'%';b.style.width=p.w+'%';b.style.height=p.h+'%';b.setAttribute('aria-label',`巡检点 ${i+1}`);b.addEventListener('click',()=>hit(i,b,p.label));spots.appendChild(b)});
 }
 function hit(i,b,label){if(found.has(i))return;found.add(i);b.classList.add('found');b.textContent='✓';log.textContent='记录：'+label;countEl.textContent=`${found.size} / 2`;if(found.size===2){next.disabled=false;stamp.textContent='本段通过';stamp.classList.add('done');log.textContent='本段记录完整。下一段已开放。'}}
 next.addEventListener('click',()=>{if(found.size<2)return;if(level<stages.length-1){level++;render();}else{localStorage.setItem('jnc_game_complete','1');window.JNC?.set?.({game:true});document.querySelector('#gameResult')?.classList.remove('hidden');next.disabled=true;next.textContent='已完成';stamp.textContent='归档完成';}});
 img.addEventListener('error',()=>{offline=true;photo.classList.add('offline-training');img.removeAttribute('src');[...spots.querySelectorAll('.training-hotspot')].forEach((b,i)=>{b.textContent='巡检点 '+(i+1);b.classList.add('offline-choice')});log.textContent='IMAGE CACHE MISS / 已切换文字巡检模式；本段可继续登记。';});
 render();
})();
