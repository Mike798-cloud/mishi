(() => {
  const KEY='bdy_state_v3';
  const AUX_KEYS=['bdy_game_complete','bdy_route','bdy_sync','bdy_timeline','bdy_local_seen','bdy_intro_seen'];
  const defaults={survey:false,surveyData:{},roster:false,p1:false,game:false,staff:false,monitor:false,incident:false,unlock:false,ending:false,visited:{}};
  const load=()=>{try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {...defaults}}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  let state=load();
  const page=document.body.dataset.page||'index';
  state.visited[page]=Date.now(); save(state);


  window.BDY={
    get:()=>load(),
    set:(patch)=>{state=Object.assign(load(),patch);save(state);return state},
    mergeSurvey:(data)=>{state=load();state.survey=true;state.surveyData={...state.surveyData,...data};save(state)},
    reset:()=>{localStorage.removeItem(KEY);AUX_KEYS.forEach(k=>localStorage.removeItem(k));location.href='index.html'}
  };

  document.querySelectorAll('[data-reset]').forEach(el=>el.addEventListener('click',()=>{
    if(confirm('这会清除本机恢复会话、已打开的系统状态和填写记录。确定重新开始吗？')) window.BDY.reset();
  }));
  window.addEventListener('storage',()=>{state=load()});

  // opening: establish the relationship before handing control to the phone.
  const intro=document.querySelector('#storyIntro');
  if(intro){
    const enter=document.querySelector('#storyEnter'), skip=document.querySelector('#storySkip');
    const revealAll=()=>intro.classList.add('reveal-all');
    const closeIntro=()=>{
      localStorage.setItem('bdy_intro_seen','1');
      intro.classList.add('leaving');
      document.body.classList.remove('intro-pending');
      setTimeout(()=>intro.remove(),520);
    };
    if(localStorage.getItem('bdy_intro_seen')==='1'){
      intro.remove(); document.body.classList.remove('intro-pending');
    }else{
      requestAnimationFrame(()=>intro.classList.add('playing'));
      enter?.addEventListener('click',closeIntro);
      skip?.addEventListener('click',revealAll);
      intro.addEventListener('click',e=>{if(e.target===intro)revealAll()});
      document.addEventListener('keydown',e=>{if(!document.body.classList.contains('intro-pending'))return;if(e.key==='Escape')revealAll();if((e.key==='Enter'||e.key===' ')&&intro.classList.contains('reveal-all'))closeIntro()});
    }
  }

  // login forms, with page-specific errors
  const hookLogin=(id,check,patch,next,errorText)=>{
    const f=document.querySelector(id); if(!f)return;
    f.addEventListener('submit',e=>{
      e.preventDefault();
      const vals=[...f.querySelectorAll('input')].map(x=>x.value.trim().toUpperCase());
      const msg=f.querySelector('.form-msg');
      if(check(vals)){window.BDY.set(patch);msg?.classList.remove('show');location.href=next}
      else if(msg){msg.textContent=errorText;msg.classList.add('show')}
    });
  };
  hookLogin('#participantLogin',v=>v[0]==='2714'&&v[1]==='0517',{p1:true},'participant.html','验证信息不一致。请核对报名手机号后四位与出生月日。');
  hookLogin('#staffLogin',v=>v[0]==='042'&&v[1]==='0917',{staff:true},'staff.html','值班身份验证失败。请核对工号与活动日期值班码。');
  hookLogin('#incidentLogin',v=>v[0]==='EVT-9176'&&v[1]==='B17'&&localStorage.getItem('bdy_sync')==='1'&&localStorage.getItem('bdy_route')==='1',{incident:true},'incident.html','归档验证失败。请核对事件号、房间号，并确认录像时间与 B 区路线均已核对。');

  // survey: retain all checkbox values and keep "无特殊情况" exclusive
  const survey=document.querySelector('#surveyForm');
  if(survey){
    const modal=document.querySelector('#surveyConfirm'); const preview=document.querySelector('#surveyPreview');
    const none=survey.querySelector('input[name="health"][value="无特殊情况"]');
    const health=[...survey.querySelectorAll('input[name="health"]')];
    health.forEach(cb=>cb.addEventListener('change',()=>{
      if(cb===none&&cb.checked) health.filter(x=>x!==none).forEach(x=>x.checked=false);
      if(cb!==none&&cb.checked&&none) none.checked=false;
    }));
    survey.addEventListener('submit',e=>{
      e.preventDefault();
      const fd=new FormData(survey), data={};
      for(const [k,v] of fd.entries()) k==='health' ? (data.health??=[]).push(v) : data[k]=v;
      const healthText=(data.health&&data.health.length)?data.health.join('、'):'未选择';
      preview.innerHTML=`<b>报名称呼：</b>${escapeHTML(data.nickname||'未填写')}<br><b>环境偏好：</b>${escapeHTML(data.fear||'未选择')}<br><b>集合安排：</b>${escapeHTML(data.separate||'未选择')}<br><b>身体情况：</b>${escapeHTML(healthText)}<br><b>备注：</b>${escapeHTML(data.note||'无')}`;
      modal.classList.add('show');modal.setAttribute('aria-hidden','false');modal.dataset.payload=JSON.stringify(data);setTimeout(()=>document.querySelector('#surveyBack')?.focus(),0);
    });
    const closeSurvey=()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true');survey.querySelector('button[type="submit"]')?.focus()};
    document.querySelector('#surveyBack')?.addEventListener('click',closeSurvey);
    modal.addEventListener('keydown',e=>{if(e.key==='Escape')closeSurvey()});
    document.querySelector('#surveyAccept')?.addEventListener('click',()=>{window.BDY.mergeSurvey(JSON.parse(modal.dataset.payload||'{}'));modal.querySelector('.modal-card').innerHTML='<h2>预登记已保存</h2><p>现场安排会在正式报名开放后重新确认；当前第 30 场仍处于暂停状态。</p><div class="modal-actions"><button type="button" id="surveyDone" class="primary">知道了</button></div>';document.querySelector('#surveyDone')?.addEventListener('click',()=>{modal.classList.remove('show');modal.setAttribute('aria-hidden','true')})});
  }

  // CCTV inspection + cross-camera event-chain reconstruction
  const cams=[...document.querySelectorAll('.cam[data-cam]')];
  if(cams.length){
    const seq=['04','09','12','10','07','03'];
    const out=document.querySelector('#camOutput');
    const inspectCam=document.querySelector('#inspectCam'), inspectNote=document.querySelector('#inspectNote');
    const chainForm=document.querySelector('#camChainForm'), chainMsg=document.querySelector('#chainMsg');
    const solved=()=>{
      cams.forEach(c=>c.classList.toggle('selected',seq.includes(c.dataset.cam)));
      if(out)out.textContent='事件链已建立：04 → 09 → 12 → 10 → 07 → 03\n最后一路是 B17 的退出请求。三路时钟仍需共同事件校准。';
      document.querySelector('#monitorNext')?.classList.remove('hidden');
      const sels=[...document.querySelectorAll('#camChainForm select')]; sels.forEach((x,i)=>x.value=seq[i]);
      if(chainMsg)chainMsg.textContent='链路核对通过。';
    };
    if(load().monitor) solved();
    cams.forEach(c=>c.addEventListener('click',()=>{
      cams.forEach(x=>x.classList.remove('inspecting')); c.classList.add('inspecting');
      if(inspectCam)inspectCam.textContent=`CAM-${c.dataset.cam} / ${c.dataset.time}`;
      if(inspectNote)inspectNote.textContent=c.dataset.note;
    }));
    chainForm?.addEventListener('submit',e=>{
      e.preventDefault(); if(load().monitor)return;
      const picked=[...chainForm.querySelectorAll('select')].map(x=>x.value);
      if(picked.join('|')===seq.join('|')){window.BDY.set({monitor:true});solved()}
      else if(chainMsg){chainMsg.textContent=picked.some(x=>!x)?'先把六个位置填完整。':'顺序不对。把各机位的事件内容和工作人员记录放在一起看，不要只按原始时间排序。'}
    });
  }

  // incident timeline reconstruction: first merge chronology, then audit the official wording.
  const timelinePuzzle=document.querySelector('[data-timeline-puzzle]');
  if(timelinePuzzle){
    const target=['exit','lock','contact','smoke','call','open'];
    let dragging=null, orderOK=false;
    const status=document.querySelector('#timelineStatus'), audit=document.querySelector('#timelineAudit'), next=document.querySelector('#timelineSolved');
    const confirmBtn=document.querySelector('#timelineConfirm'), auditMsg=document.querySelector('#timelineAuditMsg');
    const items=()=>[...timelinePuzzle.querySelectorAll('[data-event]')];
    const showOrderOK=()=>{orderOK=true;timelinePuzzle.classList.add('solved');if(status)status.textContent='记录顺序已统一。还需要核对正式简报中的“首次发现”时间。';audit?.classList.remove('hidden')};
    const markSolved=()=>{showOrderOK();document.querySelector('input[name="auditConclusion"][value="pre0301"]')?.setAttribute('checked','checked');if(auditMsg)auditMsg.textContent='校核通过：02:41 的退出请求与随后电控插销复位失败，均早于正式简报的 03:01。';next?.classList.remove('hidden')};
    if(localStorage.getItem('bdy_timeline')==='1'){
      target.forEach(id=>{const el=timelinePuzzle.querySelector(`[data-event="${id}"]`);if(el)timelinePuzzle.appendChild(el)});markSolved();
    }
    const check=()=>{
      const order=items().map(x=>x.dataset.event);
      if(order.join('|')===target.join('|')) showOrderOK();
      else {orderOK=false;timelinePuzzle.classList.remove('solved');audit?.classList.add('hidden');next?.classList.add('hidden');if(status)status.textContent='待合并：不同来源的记录还没有按发生先后排好。拖动记录行或使用上下箭头调整。'}
    };
    items().forEach(el=>{
      el.setAttribute('draggable','true');
      el.addEventListener('dragstart',()=>{dragging=el;el.classList.add('dragging')});
      el.addEventListener('dragend',()=>{el.classList.remove('dragging');dragging=null;check()});
      el.addEventListener('dragover',e=>{e.preventDefault();if(!dragging||dragging===el)return;const box=el.getBoundingClientRect();const before=e.clientY<box.top+box.height/2;timelinePuzzle.insertBefore(dragging,before?el:el.nextSibling)});
      el.querySelectorAll('[data-move]').forEach(btn=>btn.addEventListener('click',()=>{
        const dir=btn.dataset.move;
        if(dir==='up'&&el.previousElementSibling) timelinePuzzle.insertBefore(el,el.previousElementSibling);
        if(dir==='down'&&el.nextElementSibling) timelinePuzzle.insertBefore(el.nextElementSibling,el);
        check();
      }));
    });
    confirmBtn?.addEventListener('click',()=>{
      if(!orderOK)return;
      const v=document.querySelector('input[name="auditConclusion"]:checked')?.value;
      if(v==='pre0301'){
        localStorage.setItem('bdy_timeline','1');
        if(auditMsg)auditMsg.textContent='校核通过：02:41 的退出请求与随后电控插销复位失败，均早于正式简报的 03:01。';
        next?.classList.remove('hidden');
      } else if(auditMsg){auditMsg.textContent=v?'这条说法与已合并的原始记录不一致。':'先选择一项再核对。'}
    });
    if(localStorage.getItem('bdy_timeline')!=='1') check();
  }


  function escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
})();
