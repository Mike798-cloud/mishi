(()=>{
 const map=document.getElementById('routeMap'); if(!map)return;
 const target=['EXIT','S1','B12','S2','B15','EQUIP','B17']; let seq=[];
 const log=document.getElementById('routeLog'), solved=document.getElementById('routeSolved');
 const render=()=>{log.textContent=seq.length?seq.join(' → '):'ROUTE TABLE EMPTY / 等待首个门禁节点。'};
 if(localStorage.getItem('jnc_route')==='1'){seq=[...target];map.querySelectorAll('[data-node]').forEach(btn=>btn.classList.toggle('selected',target.includes(btn.dataset.node)));solved.classList.remove('hidden');log.textContent=target.join(' → ')+'\nROUTE MATCH / B17 MANUAL ACCESS CONFIRMED';}
 map.querySelectorAll('[data-node]').forEach(btn=>btn.addEventListener('click',()=>{
   if(localStorage.getItem('jnc_route')==='1') return;
   const n=btn.dataset.node, expected=target[seq.length];
   if(n===expected){seq.push(n);btn.classList.add('selected');render();if(seq.length===target.length){solved.classList.remove('hidden');localStorage.setItem('jnc_route','1');log.textContent+='\nROUTE MATCH / B17 MANUAL ACCESS CONFIRMED';}}
   else{btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),380);seq=[];map.querySelectorAll('.route-node').forEach(x=>x.classList.remove('selected'));log.textContent=`PATH REJECTED / ${n} 与当前门禁记录链不连续。`;}
 }));
 document.getElementById('routeReset')?.addEventListener('click',()=>{seq=[];map.querySelectorAll('.route-node').forEach(x=>x.classList.remove('selected'));solved.classList.add('hidden');render()});
})();
