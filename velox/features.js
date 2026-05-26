/* =========================================================
   VELOX — Features page (typewriter AI msg + comparison table)
   ========================================================= */
(function(){
  let typeTimer = null;
  function typewriter(){
    const el = document.getElementById('aiTyped');
    if (!el) return;
    clearInterval(typeTimer);
    const lines = VELOX.AI_LINES || [''];
    let lineIdx = 0, charIdx = 0, holding = 0, phase = 'type';
    el.innerHTML = '';
    const caret = document.createElement('span');
    caret.className = 'caret';
    const text = document.createElement('span');
    el.appendChild(text);
    el.appendChild(caret);

    typeTimer = setInterval(() => {
      const line = lines[lineIdx];
      if (phase === 'type'){
        text.textContent = line.slice(0, ++charIdx);
        if (charIdx >= line.length){ phase = 'hold'; holding = 0; }
      } else if (phase === 'hold'){
        if (++holding > 18){ phase = 'erase'; }
      } else if (phase === 'erase'){
        text.textContent = line.slice(0, --charIdx);
        if (charIdx <= 0){ phase = 'type'; lineIdx = (lineIdx + 1) % lines.length; }
      }
    }, 55);
  }

  function buildComparison(){
    const tbody = document.getElementById('compareTbody');
    if (!tbody || tbody.dataset.done) return;
    const rows = VELOX.COMPARISON || [];
    const ck = '<svg class="cmp-check" viewBox="0 0 18 18" fill="none" stroke="#00D4FF" stroke-width="2.2"><path d="M3 9l4 4 8-8"/></svg>';
    const x = '<span class="cmp-x">×</span>';
    const lim = '<span class="mono" style="font-size:11px; color: var(--ink-faint)">limited</span>';
    const render = (v, idx) => {
      const cls = idx === 0 ? ' class="is-velox"' : '';
      if (v === 'check') return `<td${cls}>${ck}</td>`;
      if (v === 'x') return `<td${cls}>${x}</td>`;
      if (v === 'limited') return `<td${cls}>${lim}</td>`;
      return `<td${cls}>${v}</td>`;
    };
    tbody.innerHTML = rows.map(r => {
      return `<tr><td>${r[0]}</td>${render(r[1], 0)}${render(r[2], 1)}${render(r[3], 2)}${render(r[4], 3)}</tr>`;
    }).join('');
    tbody.dataset.done = '1';
  }

  window.initFeatures = function(){
    typewriter();
    buildComparison();
  };
})();
