(() => {
  const KEY='jnc_state_v1';
  const AUX_KEYS=['jnc_game_complete','jnc_route','jnc_sync','jnc_timeline'];
  const defaults={survey:false,surveyData:{},p1:false,game:false,staff:false,monitor:false,incident:false,unlock:false,ending:false,visited:{}};
  const load=()=>{try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return {...defaults}}};
  const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
  let state=load();
  const page=document.body.dataset.page||'index';
  state.visited[page]=Date.now(); save(state);

  const flags=()=>{
    const s=load();
    return {
      survey:!!s.survey,p1:!!s.p1,game:!!s.game||localStorage.getItem('jnc_game_complete')==='1',
      staff:!!s.staff,monitor:!!s.monitor,route:localStorage.getItem('jnc_route')==='1',
      sync:localStorage.getItem('jnc_sync')==='1',incident:!!s.incident,
      timeline:localStorage.getItem('jnc_timeline')==='1',unlock:!!s.unlock,ending:!!s.ending
    };
  };
  const progress=()=>{const f=flags();let p=5;if(f.survey)p=12;if(f.p1)p=22;if(f.game)p=36;if(f.staff)p=48;if(f.monitor)p=62;if(f.route)p=72;if(f.sync)p=80;if(f.incident)p=88;if(f.timeline)p=92;if(f.unlock)p=96;if(f.ending)p=100;return p};
  const prog=progress();
  const bar=document.querySelector('.progress-bar'); if(bar) bar.style.width=prog+'%';
  const cap=document.querySelector('.progress-caption'); if(cap) cap.textContent=`调查进度 ${prog}%`;

  window.JNC={
    get:()=>load(),
    set:(patch)=>{state=Object.assign(load(),patch);save(state);return state},
    mergeSurvey:(data)=>{state=load();state.survey=true;state.surveyData={...state.surveyData,...data};save(state)},
    reset:()=>{localStorage.removeItem(KEY);AUX_KEYS.forEach(k=>localStorage.removeItem(k));location.href='index.html'}
  };

  document.querySelectorAll('[data-reset]').forEach(el=>el.addEventListener('click',()=>{
    if(confirm('这会清除本浏览器里的调查进度、问卷和小游戏记录。确定重新开始吗？')) JNC.reset();
  }));
  window.addEventListener('storage',()=>{state=load()});

  // login forms, with page-specific errors
  const hookLogin=(id,check,patch,next,errorText)=>{
    const f=document.querySelector(id); if(!f)return;
    f.addEventListener('submit',e=>{
      e.preventDefault();
      const vals=[...f.querySelectorAll('input')].map(x=>x.value.trim().toUpperCase());
      const msg=f.querySelector('.form-msg');
      if(check(vals)){JNC.set(patch);msg?.classList.remove('show');location.href=next}
      else if(msg){msg.textContent=errorText;msg.classList.add('show')}
    });
  };
  hookLogin('#participantLogin',v=>v[0]==='2714'&&v[1]==='0517',{p1:true},'participant.html','验证信息不一致。请核对报名手机号后四位与出生月日。');
  hookLogin('#staffLogin',v=>v[0]==='042'&&v[1]==='0917',{staff:true},'staff.html','值班身份验证失败。请核对工号与活动日期值班码。');
  hookLogin('#incidentLogin',v=>v[0]==='EVT-9176'&&v[1]==='B17'&&localStorage.getItem('jnc_sync')==='1',{incident:true},'incident.html','归档验证失败。请核对事件号、房间号，并确认录像时间已经完成校准。');

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
    document.querySelector('#surveyAccept')?.addEventListener('click',()=>{JNC.mergeSurvey(JSON.parse(modal.dataset.payload||'{}'));const w=window.open('participant-login.html','_blank','noopener');if(!w)location.href='participant-login.html'});
  }

  // monitoring minigame + refresh restore
  const cams=[...document.querySelectorAll('.cam[data-cam]')];
  if(cams.length){
    const seq=['04','09','12','07','03']; let pos=0; const out=document.querySelector('#camOutput');
    const solved=()=>{
      seq.forEach(n=>document.querySelector(`.cam[data-cam="${n}"]`)?.classList.add('selected'));
      out.textContent='路线核对已完成：04 → 09 → 12 → 07 → 03\n02:41，B17 房间收到“退出”请求。关联事件号 EVT-9176。';
      document.querySelector('#monitorNext')?.classList.remove('hidden');
    };
    if(load().monitor) solved();
    cams.forEach(c=>c.addEventListener('click',()=>{
      if(load().monitor) return;
      const n=c.dataset.cam;
      if(n===seq[pos]){
        c.classList.add('selected');pos++;out.textContent+=`${pos===1?'':'\n'}${c.dataset.time}  CAM-${n}  ${c.dataset.note}`;
        if(pos===seq.length){JNC.set({monitor:true});out.textContent+='\n\n路线核对完成：02:41，B17 房间收到“退出”请求。关联事件号 EVT-9176。';document.querySelector('#monitorNext')?.classList.remove('hidden')}
      } else {
        pos=0;cams.forEach(x=>x.classList.remove('selected'));out.textContent='SEQUENCE RESET / 当前机位与巡查表下一编号不一致。';
      }
    }));
  }

  // incident timeline reconstruction; restore solved state on refresh
  const timelinePuzzle=document.querySelector('[data-timeline-puzzle]');
  if(timelinePuzzle){
    const target=['exit','lock','contact','smoke','call','open'];
    let dragging=null; const status=document.querySelector('#timelineStatus'), next=document.querySelector('#timelineSolved');
    const items=()=>[...timelinePuzzle.querySelectorAll('[data-event]')];
    const markSolved=()=>{timelinePuzzle.classList.add('solved');if(status)status.textContent='MERGE OK / 值班、电话与门禁记录已按统一基准合并。';next?.classList.remove('hidden')};
    if(localStorage.getItem('jnc_timeline')==='1'){
      target.forEach(id=>{const el=timelinePuzzle.querySelector(`[data-event="${id}"]`);if(el)timelinePuzzle.appendChild(el)});markSolved();
    }
    const check=()=>{
      const order=items().map(x=>x.dataset.event);
      if(order.join('|')===target.join('|')){markSolved();localStorage.setItem('jnc_timeline','1')}
      else if(status){status.textContent='待合并：不同系统时间尚未统一。拖动记录行或使用上下箭头调整顺序。'}
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
    if(localStorage.getItem('jnc_timeline')!=='1') check();
  }

  // later staff cache echoes the player's own pre-registration
  const surveyEcho=document.querySelector('#surveyEcho');
  if(surveyEcho){
    const st=load(),d=st.surveyData||{};
    if(st.survey){
      const note=d.note?escapeHTML(d.note):'（未填写备注）';
      const health=Array.isArray(d.health)?d.health.join('、'):(d.health||'未选择');
      surveyEcho.innerHTML=`<b>${escapeHTML(d.nickname||'未填写称呼')}</b><br>环境项：${escapeHTML(d.fear||'未选择')}<br>集合点处理：${escapeHTML(d.separate||'未选择')}<br>身体情况：${escapeHTML(health)}<br>备注：${note}<br><span class="small">状态：等待现场组查看</span>`;
    } else surveyEcho.textContent='未找到本机的下一期预登记缓存。';
  }

  function escapeHTML(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
})();
