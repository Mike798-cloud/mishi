(()=>{
  const SEEN='bdy_support_seen_v1';
  const DONE='bdy_support_done_v1';
  const qrCandidates=[
    'https://mike798-cloud.github.io/songtao-grainstation/paycode.png',
    'https://raw.githubusercontent.com/Mike798-cloud/songtao-grainstation/main/paycode.png',
    'https://mike798-cloud.github.io/xu-yuan/paycode.png',
    'https://raw.githubusercontent.com/Mike798-cloud/xu-yuan/main/paycode.png'
  ];
  const cookieHas=key=>document.cookie.split('; ').some(x=>x===key+'=1');
  const hasDone=()=>localStorage.getItem(DONE)==='1'||sessionStorage.getItem(DONE)==='1'||cookieHas(DONE);
  const markDone=()=>{localStorage.setItem(DONE,'1');sessionStorage.setItem(DONE,'1');document.cookie=`${DONE}=1; Max-Age=31536000; Path=/; SameSite=Lax`};
  const hasSeen=()=>localStorage.getItem(SEEN)==='1'||sessionStorage.getItem(SEEN)==='1'||cookieHas(SEEN);
  const markSeen=()=>{localStorage.setItem(SEEN,'1');sessionStorage.setItem(SEEN,'1');document.cookie=`${SEEN}=1; Max-Age=31536000; Path=/; SameSite=Lax`};

  const root=document.createElement('div');
  root.className='support-overlay';
  root.setAttribute('aria-hidden','true');
  root.innerHTML=`<section class="support-sheet" role="dialog" aria-modal="true" aria-labelledby="supportTitle">
    <div class="support-topline"><span>《闭店夜逃》 / 作者支持</span><button class="support-close" type="button" aria-label="关闭支持窗口">×</button></div>
    <div class="support-body">
      <div class="support-copy">
        <h2 id="supportTitle">如果你愿意，留下一块钱</h2>
        <div class="support-kicker">1元自愿支持 · 不影响任何线索、结局或后续游玩</div>
        <p>做到这里，你应该已经翻过报名记录，也开始和那些不太好用的旧系统打交道了。做这部作品时，很多时间其实花在不太显眼的地方：值班表里的一行备注、柜号牌摆在哪里，还有两个人聊天时那些没什么要紧的小事。你如果愿意留下一块钱支持，我会很开心——至少说明这些细节真的有人认真看过。</p>
        <p>不支持也没关系。把窗口关掉，后面的线索和结局都不会少，继续把这件事查完就好。</p>
      </div>
      <div class="support-qr-wrap">
        <img class="support-qr" alt="1元自愿支持收款码">
        <div class="support-qr-fail">收款码这次没有加载出来。你可以直接关掉窗口继续玩；它不会影响游戏，也不会因此再次自动弹出。</div>
        <p class="support-qr-caption">扫码后直接回到游戏就好。页面不会核验到账，也不会锁住后续内容。</p>
      </div>
    </div>
    <div class="support-actions"><button class="support-done" type="button">我支持了一下</button><button class="support-later" type="button">继续调查</button><span class="support-foot">只会自动出现一次，之后可从“￥ 支持作者”重新打开。</span></div>
  </section>`;
  document.body.appendChild(root);
  const toast=document.createElement('div');toast.className='support-toast';toast.textContent='谢谢。回去把这件事查完吧。';document.body.appendChild(toast);
  const qr=root.querySelector('.support-qr'),fail=root.querySelector('.support-qr-fail');
  let qrIndex=0;
  const loadQR=()=>{if(qrIndex>=qrCandidates.length){qr.style.display='none';fail.style.display='flex';return}qr.src=qrCandidates[qrIndex++]};
  qr.addEventListener('error',loadQR);loadQR();

  let lastFocus=null;
  const open=({automatic=false}={})=>{
    if(automatic){if(hasSeen()||hasDone())return;markSeen()}
    lastFocus=document.activeElement;
    root.classList.add('open');root.setAttribute('aria-hidden','false');
    setTimeout(()=>root.querySelector('.support-close')?.focus(),0);
  };
  const close=()=>{root.classList.remove('open');root.setAttribute('aria-hidden','true');lastFocus?.focus?.()};
  root.querySelector('.support-close').addEventListener('click',close);
  root.querySelector('.support-later').addEventListener('click',close);
  root.addEventListener('click',e=>{if(e.target===root)close()});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close()}});
  root.querySelector('.support-done').addEventListener('click',()=>{markDone();close();toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2300);updateEntries()});
  const updateEntries=()=>document.querySelectorAll('[data-pay-open]').forEach(el=>{if(hasDone())el.setAttribute('data-supported','true');else el.removeAttribute('data-supported')});
  document.querySelectorAll('[data-pay-open]').forEach(el=>el.addEventListener('click',()=>open()));
  updateEntries();
  window.addEventListener('bdy:pay-moment',()=>setTimeout(()=>open({automatic:true}),850),{once:true});
  window.BDYSupport={open,close,done:hasDone};
})();
