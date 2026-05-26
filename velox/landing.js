/* =========================================================
   VELOX — Landing page init (cursor, mockup reflection,
   sparkline, count-up, before/after, pricing, demo modal,
   page-enter idempotency)
   ========================================================= */
(function(){
  let initialized = false;

  function setupMockupReflection(){
    const mockup = document.getElementById('heroMockup');
    const reflection = document.getElementById('heroReflection');
    if (!mockup || !reflection || reflection.dataset.done) return;
    const clone = mockup.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.boxShadow = 'none';
    clone.style.border = '1px solid var(--line)';
    reflection.innerHTML = '';
    reflection.appendChild(clone);
    reflection.dataset.done = '1';
  }

  function setupMarquee(){
    const track = document.getElementById('marqueeTrack');
    if (!track || track.dataset.dup) return;
    track.innerHTML = track.innerHTML + track.innerHTML;
    track.dataset.dup = '1';
  }

  function buildSpark(){
    const path = document.getElementById('sparkPath');
    if (!path || path.dataset.done) return;
    const w = 320, h = 80, n = 36;
    const pts = [];
    for (let i = 0; i < n; i++){
      const x = (i / (n - 1)) * w;
      const base = 55 - (i / n) * 18;
      const noise = (Math.sin(i * 0.7) + Math.sin(i * 1.4)) * 5;
      pts.push([x, Math.max(8, Math.min(72, base + noise))]);
    }
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++){
      const [px, py] = pts[i - 1];
      const [cx, cy] = pts[i];
      d += ` Q ${px} ${py} ${(px+cx)/2} ${(py+cy)/2}`;
    }
    d += ` T ${pts[pts.length-1][0]} ${pts[pts.length-1][1]}`;
    path.setAttribute('d', d);
    document.getElementById('sparkArea').setAttribute('d', d + ` L ${w} ${h} L 0 ${h} Z`);
    path.dataset.done = '1';
  }

  function setupCountUp(){
    const upEl = document.getElementById('upNum');
    if (!upEl || upEl.dataset.done) return;
    upEl.dataset.done = '1';
    const target = 99.987;
    const animate = () => {
      if (VELOX.reduce) { upEl.textContent = target.toFixed(2); return; }
      const dur = 1800;
      const start = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        upEl.textContent = (target * eased).toFixed(2);
        if (k < 1) requestAnimationFrame(step);
        else upEl.textContent = target.toFixed(2);
      };
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window){
      const sio = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting){ animate(); sio.disconnect(); } });
      }, { threshold: 0.5 });
      sio.observe(upEl);
    } else { animate(); }
  }

  function setupCompare(){
    const range = document.getElementById('compareRange');
    const after = document.getElementById('compareAfter');
    const handle = document.getElementById('compareHandle');
    const knob = document.getElementById('compareKnob');
    if (!range || range.dataset.wired) return;
    range.dataset.wired = '1';
    const setCmp = (v) => {
      const pct = Math.max(0, Math.min(100, +v));
      after.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = pct + '%';
      knob.style.left = pct + '%';
    };
    range.addEventListener('input', e => setCmp(e.target.value));
    setCmp(50);
  }

  function setupWatchDemo(){
    document.querySelectorAll('[data-action="watch-demo"]').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex; flex-direction:column; gap: 12px';
        wrap.innerHTML = `
          <div id="demoPlayer" style="aspect-ratio: 16/9; border-radius: 12px; background:
            radial-gradient(ellipse at 30% 30%, rgba(108,99,255,0.35), transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(0,212,255,0.25), transparent 60%),
            linear-gradient(135deg, #0E1020, #1A1040);
            display:flex; align-items:center; justify-content:center; position: relative; overflow: hidden; cursor: pointer">
            <button id="demoPlayBtn" aria-label="Play demo" style="width: 86px; height: 86px; border-radius: 50%; background: rgba(255,255,255,0.9); color: var(--bg); display:flex; align-items:center; justify-content:center; box-shadow: 0 20px 60px -20px rgba(108,99,255,0.6); border: 0; cursor: pointer">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M9 4v24l20-12z"/></svg>
            </button>
            <div style="position:absolute; left: 18px; top: 18px; font-family: 'JetBrains Mono'; font-size: 11px; color: rgba(255,255,255,0.7); letter-spacing: 0.1em">VELOX · PRODUCT DEMO · 2:48</div>
            <div id="playhead" style="position: absolute; left: 18px; right: 18px; bottom: 18px; display: flex; align-items: center; gap: 12px; font-family: 'JetBrains Mono'; font-size: 11px; color: #fff">
              <span id="curTime">0:00</span>
              <div style="flex: 1; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.18); overflow: hidden"><div id="playProg" style="height: 100%; width: 0; background: linear-gradient(90deg, var(--indigo), var(--cyan)); transition: width .2s linear"></div></div>
              <span>2:48</span>
            </div>
          </div>
          <p class="muted" style="margin: 6px 0 0; font-size: 13px; text-align: center">Real demo — see how a sprint planning meeting goes from 90 minutes to 11.</p>
        `;
        // Fake playback
        const totalSec = 168;
        let cur = 0, playing = false, timer = null;
        const stopPlayback = () => {
          playing = false;
          if (timer){
            clearInterval(timer);
            timer = null;
          }
        };
        VELOX.openModal(wrap, { title: 'PRODUCT DEMO', onClose: stopPlayback });

        const playBtn = document.getElementById('demoPlayBtn');
        const prog = document.getElementById('playProg');
        const curTime = document.getElementById('curTime');
        const fmt = s => Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
        const tick = () => {
          if (!playing) return;
          cur = Math.min(cur + 0.2, totalSec);
          prog.style.width = (cur/totalSec*100) + '%';
          curTime.textContent = fmt(Math.floor(cur));
          if (cur >= totalSec){
            stopPlayback();
            playBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M9 4v24l20-12z"/></svg>';
          }
        };
        const toggle = () => {
          playing = !playing;
          if (playing){
            if (cur >= totalSec){
              cur = 0;
              prog.style.width = '0%';
              curTime.textContent = '0:00';
            }
            playBtn.innerHTML = '<svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor"><rect x="7" y="5" width="6" height="22"/><rect x="19" y="5" width="6" height="22"/></svg>';
            if (!timer) timer = setInterval(tick, 200);
          } else {
            playBtn.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M9 4v24l20-12z"/></svg>';
            stopPlayback();
          }
        };
        document.getElementById('demoPlayer').addEventListener('click', toggle);
      });
    });
  }

  window.initLanding = function(){
    setupMockupReflection();
    setupMarquee();
    buildSpark();
    setupCountUp();
    setupCompare();
    setupWatchDemo();
    VELOX.buildPricing('tiersLanding', 'pricingToggleLanding');
    // Defer indicator placement until page is visible & laid out
    setTimeout(() => VELOX.refreshPricingToggle('pricingToggleLanding'), 50);
    initialized = true;
  };
})();
