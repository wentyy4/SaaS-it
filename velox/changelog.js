/* =========================================================
   VELOX — Changelog page (timeline, version filter, subscribe)
   ========================================================= */
(function(){
  const TAG_LABEL = { new: 'NEW', imp: 'IMPROVED', fix: 'FIXED' };

  function buildTimeline(filterVer){
    const wrap = document.getElementById('clTimeline');
    if (!wrap) return;
    const entries = VELOX.CHANGELOG || [];
    const filtered = filterVer === 'all' ? entries : entries.filter(e => e.v === filterVer);
    wrap.innerHTML = filtered.map(e => `
      <div class="cl-entry">
        <div class="cl-head">
          <span class="cl-version">${e.v}</span>
          <span class="cl-date">${e.date}</span>
          <span class="cl-tags">
            ${(e.tags || []).map(t => `<span class="cl-tag cl-tag-${t}">${TAG_LABEL[t] || t.toUpperCase()}</span>`).join('')}
          </span>
        </div>
        <h2>${e.title}</h2>
        <ul>${e.items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
    `).join('');
    if (!filtered.length){
      wrap.innerHTML = `<p class="muted" style="text-align:center; padding: 40px 0">No entries for this version yet.</p>`;
    }
  }

  function populateFilter(){
    const sel = document.getElementById('clFilter');
    if (!sel || sel.dataset.done) return;
    sel.dataset.done = '1';
    (VELOX.CHANGELOG || []).forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.v; opt.textContent = e.v;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => buildTimeline(sel.value));
  }

  function wireSubscribe(){
    const form = document.getElementById('clSubscribe');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = form.querySelector('input[type=email]');
      const v = inp.value.trim();
      if (!VELOX.validateEmail(v)){
        VELOX.toast('Please enter a valid email', 'error');
        inp.focus();
        return;
      }
      const btn = form.querySelector('button');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '✓ Subscribed';
        VELOX.toast(`We'll email you at ${v} when we ship`, 'success');
        inp.value = '';
        setTimeout(() => { btn.textContent = orig; }, 3000);
      }, 900);
    });
  }

  window.initChangelog = function(){
    populateFilter();
    wireSubscribe();
    buildTimeline('all');
  };
})();
