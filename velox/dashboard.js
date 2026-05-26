/* =========================================================
   VELOX — Dashboard (kanban, drag, task panel, analytics)
   ========================================================= */
(function(){
  let state = {
    view: 'board',
    project: 'Atlas',
    tasks: null,                            // initialized from VELOX.TASKS (deep-cloned)
    selectedTask: null,                     // {col, idx}
    notifUnread: 3,
  };

  const COLS = [
    { id: 'backlog', label: 'Backlog' },
    { id: 'inprogress', label: 'In Progress' },
    { id: 'review', label: 'In Review' },
    { id: 'done', label: 'Done' },
  ];

  const TAG_LABEL = { bug: 'BUG', feat: 'FEAT', perf: 'PERF', doc: 'DOCS', chore: 'CHORE' };
  const STORAGE_KEY = 'velox.dashboard.v1';

  function cloneTasks(){ return JSON.parse(JSON.stringify(VELOX.TASKS)); }
  function escapeHTML(v){
    return String(v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }
  function savedState(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
  }
  function loadTasks(project){
    return savedState().tasks?.[project] || cloneTasks();
  }
  function persistTasks(){
    try {
      const saved = savedState();
      saved.project = state.project;
      saved.tasks = saved.tasks || {};
      saved.tasks[state.project] = state.tasks;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {}
  }

  // ---------- Render team list (sidebar)
  function renderTeam(){
    const wrap = document.getElementById('teamList');
    if (!wrap) return;
    wrap.innerHTML = (VELOX.TEAM || []).map(m => `
      <div class="team-member ${m.online ? '' : 'offline'}">
        <span class="ava" style="background:${VELOX.AVA_GRADIENTS[m.ava]}"></span>
        <div><div style="color:#fff; font-size:13px">${m.name}</div><div style="color:var(--ink-faint); font-size: 11px">${m.role}</div></div>
      </div>
    `).join('');
  }

  // ---------- Render the BOARD view
  function renderBoard(){
    const main = document.getElementById('appMain');
    if (!main) return;
    main.innerHTML = `
      <div class="app-main-head">
        <div>
          <div class="breadcrumb">${state.project.toUpperCase()} · BOARD</div>
          <h1>Sprint 24 — ships Friday</h1>
        </div>
        <div class="actions">
          <button class="btn btn-glass btn-sm">⌥ Filter</button>
          <button class="btn btn-glass btn-sm">⌘K</button>
          <button class="btn btn-primary btn-sm" data-new-task="inprogress">+ New issue</button>
        </div>
      </div>
      <div class="kanban" id="kanban">
        ${COLS.map(c => renderColumn(c)).join('')}
      </div>
    `;
    wireBoardInteractions();
  }

  function renderColumn(col){
    const tasks = state.tasks[col.id] || [];
    return `
      <div class="k-col" data-col="${col.id}">
        <h3>${col.label} <span class="cnt">${tasks.length}</span></h3>
        ${tasks.map((t, i) => renderTask(t, col.id, i)).join('')}
        <div class="k-newtask-form" data-form-for="${col.id}">
          <input type="text" placeholder="Task title…" name="title">
          <div class="row">
            <select name="tag"><option value="feat">FEAT</option><option value="bug">BUG</option><option value="perf">PERF</option><option value="doc">DOCS</option><option value="chore">CHORE</option></select>
            <select name="assignee"><option value="a2">Sam</option><option value="a3">Priya</option><option value="a4">Alex</option><option value="a5">Maya</option><option value="a1">Diego</option></select>
          </div>
          <div class="row" style="justify-content:flex-end; gap: 6px">
            <button class="btn btn-ghost btn-sm" type="button" data-form-cancel>Cancel</button>
            <button class="btn btn-primary btn-sm" type="button" data-form-add>Add task</button>
          </div>
        </div>
        <button class="k-newtask" data-show-form="${col.id}">+ New task</button>
      </div>
    `;
  }

  function renderTask(t, col, i){
    return `
      <article class="k-task" draggable="true" tabindex="0" role="button" aria-label="Open issue ${escapeHTML(t.id)}: ${escapeHTML(t.title)}" data-col="${col}" data-idx="${i}" data-id="${t.id}">
          <span class="ktag tag-${escapeHTML(t.tag)}">${TAG_LABEL[t.tag] || escapeHTML(t.tag.toUpperCase())}</span>
        <p class="ktitle">${escapeHTML(t.title)}</p>
        <div class="kmeta">
          <span class="pri pri-${t.pri}" title="Priority: ${t.pri}"></span>
          <span class="mono">${t.id}</span>
          <span class="dot" style="opacity:0.5; width:3px; height:3px; border-radius:50%; background:var(--ink-faint)"></span>
          <span class="mono">${t.due}</span>
          <span class="subs"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 3h8M1 5h6M1 7h8"/></svg>${t.subs}</span>
          <span class="ava" style="background:${VELOX.AVA_GRADIENTS[t.assignee]}"></span>
        </div>
      </article>
    `;
  }

  // ---------- Wire board interactions: drag, click, new-task
  function wireBoardInteractions(){
    const kanban = document.getElementById('kanban');
    if (!kanban) return;

    // Task click → open panel
    kanban.addEventListener('click', (e) => {
      const task = e.target.closest('.k-task');
      if (task){ openTaskPanel(task.dataset.col, +task.dataset.idx); return; }

      // Show form
      const showBtn = e.target.closest('[data-show-form]');
      if (showBtn){
        const colId = showBtn.dataset.showForm;
        showBtn.parentElement.querySelector(`[data-form-for="${colId}"]`)?.classList.add('is-open');
        showBtn.style.display = 'none';
        showBtn.parentElement.querySelector('input[name="title"]')?.focus();
        return;
      }
      // Cancel form
      if (e.target.closest('[data-form-cancel]')){
        const form = e.target.closest('.k-newtask-form');
        form.classList.remove('is-open');
        form.parentElement.querySelector('.k-newtask').style.display = '';
        return;
      }
      // Add new task
      if (e.target.closest('[data-form-add]')){
        const form = e.target.closest('.k-newtask-form');
        const colId = form.dataset.formFor;
        const title = form.querySelector('input[name="title"]').value.trim();
        if (!title){ VELOX.toast('Title required', 'error'); return; }
        const tag = form.querySelector('select[name="tag"]').value;
        const ava = form.querySelector('select[name="assignee"]').value;
        const idNum = 300 + Math.floor(Math.random() * 99);
        state.tasks[colId].push({ id: 'VLX-' + idNum, title, tag, pri: 'med', assignee: ava, due: 'in 3d', subs: '0/0' });
        persistTasks();
        renderBoard();
        VELOX.toast('Task added', 'success');
        return;
      }

      // Top-bar quick-add button
      if (e.target.closest('[data-new-task]')){
        const colId = e.target.closest('[data-new-task]').dataset.newTask;
        const col = document.querySelector(`[data-col="${colId}"]`);
        col?.querySelector(`.k-newtask`)?.click();
      }
    });
    kanban.addEventListener('keydown', (e) => {
      const task = e.target.closest('.k-task');
      if (task && (e.key === 'Enter' || e.key === ' ')){
        e.preventDefault();
        openTaskPanel(task.dataset.col, +task.dataset.idx);
      }
    });

    // Drag and drop
    let dragId = null;
    kanban.addEventListener('dragstart', (e) => {
      const t = e.target.closest('.k-task');
      if (!t) return;
      dragId = { col: t.dataset.col, idx: +t.dataset.idx };
      t.classList.add('is-dragging');
      try { e.dataTransfer.setData('text/plain', t.dataset.id); e.dataTransfer.effectAllowed = 'move'; } catch {}
    });
    kanban.addEventListener('dragend', (e) => {
      const t = e.target.closest('.k-task');
      if (t) t.classList.remove('is-dragging');
      kanban.querySelectorAll('.k-col.is-dragover').forEach(c => c.classList.remove('is-dragover'));
      dragId = null;
    });
    kanban.addEventListener('dragover', (e) => {
      const col = e.target.closest('.k-col');
      if (!col) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      kanban.querySelectorAll('.k-col.is-dragover').forEach(c => { if (c !== col) c.classList.remove('is-dragover'); });
      col.classList.add('is-dragover');
    });
    kanban.addEventListener('drop', (e) => {
      const col = e.target.closest('.k-col');
      if (!col || !dragId) return;
      e.preventDefault();
      const toCol = col.dataset.col;
      const { col: fromCol, idx } = dragId;
      const task = state.tasks[fromCol][idx];
      state.tasks[fromCol].splice(idx, 1);
      state.tasks[toCol].push(task);
      persistTasks();
      renderBoard();
      VELOX.toast(`Moved to ${COLS.find(c => c.id === toCol).label}`, 'success', 1600);
    });
  }

  // ---------- Task detail panel
  function openTaskPanel(col, idx){
    const t = state.tasks[col]?.[idx];
    if (!t) return;
    state.selectedTask = { col, idx };
    const panel = document.getElementById('taskPanel');
    const shell = document.getElementById('appShell');
    if (!panel || !shell) return;
    shell.classList.add('with-panel');
    panel.classList.add('is-open');
    panel.innerHTML = `
      <div class="task-panel-head">
        <div style="display:flex; align-items:center; gap: 10px">
          <span class="ktag tag-${t.tag}">${TAG_LABEL[t.tag] || t.tag.toUpperCase()}</span>
          <span class="mono" style="font-size: 11px; color: var(--ink-faint)">${t.id}</span>
        </div>
        <button class="icon-btn" data-close-panel aria-label="Close panel">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l10 10M13 3L3 13"/></svg>
        </button>
      </div>
      <input class="tp-title" value="${escapeHTML(t.title)}" data-tp-field="title">
      <div class="tp-row"><label class="tp-label" for="tpStatus">Status</label><select class="tp-select" id="tpStatus">${COLS.map(c => `<option value="${c.id}" ${c.id === col ? 'selected' : ''}>${c.label}</option>`).join('')}</select></div>
      <div class="tp-row"><span class="tp-label">Priority</span><span class="tp-value"><span class="pri pri-${t.pri}" style="width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px"></span>${t.pri}</span></div>
      <div class="tp-row"><span class="tp-label">Assignee</span><span class="tp-value"><span class="ava" style="background:${VELOX.AVA_GRADIENTS[t.assignee]}"></span>${assigneeName(t.assignee)}</span></div>
      <div class="tp-row"><span class="tp-label">Due</span><span class="tp-value mono">${t.due}</span></div>
      <div class="tp-row"><span class="tp-label">Subtasks</span><span class="tp-value mono">${t.subs}</span></div>
      <div class="tp-section-head">Description</div>
      <textarea class="tp-desc" data-tp-field="desc">${descFor(t)}</textarea>
      <div class="tp-section-head">Activity</div>
      <ul class="tp-activity">
        <li><span class="when">2h</span><span><b>Sam</b> moved this to In Progress</span></li>
        <li><span class="when">4h</span><span><b>Priya</b> commented</span></li>
        <li><span class="when">1d</span><span><b>Diego</b> set priority to High</span></li>
        <li><span class="when">2d</span><span>Created from PR <code>#2418</code></span></li>
      </ul>
      <div class="tp-section-head">Comments</div>
      <div id="tpComments">
        <div class="tp-comment">
          <span class="ava" style="background:${VELOX.AVA_GRADIENTS.a3}"></span>
          <div>
            <div class="cmeta"><b>Priya Raman</b> · 4h ago</div>
            <div>Repro confirmed — it only happens on the second concurrent drag. Going to try a lock-free swap on the board store next.</div>
          </div>
        </div>
      </div>
      <div class="tp-comment-form">
        <input type="text" placeholder="Write a comment…" id="tpCommentInput">
        <button class="btn btn-primary btn-sm" id="tpCommentSend">Post</button>
      </div>
    `;
    wirePanel();
  }

  function assigneeName(av){
    return ({a1:'Diego Santos',a2:'Sam Chen',a3:'Priya Raman',a4:'Alex Park',a5:'Maya Patel'})[av] || 'Unassigned';
  }
  function descFor(t){
    return `Repro: open the same board in two windows, drag a task in one — it sometimes snaps back. Suspected race in the optimistic-update queue. See thread on #eng-board for traces.`;
  }

  function wirePanel(){
    const panel = document.getElementById('taskPanel');
    const shell = document.getElementById('appShell');
    panel.querySelector('[data-close-panel]').addEventListener('click', () => {
      panel.classList.remove('is-open');
      shell.classList.remove('with-panel');
      state.selectedTask = null;
    });
    // Editable title
    panel.querySelector('[data-tp-field="title"]').addEventListener('change', (e) => {
      if (state.selectedTask){
        const { col, idx } = state.selectedTask;
        state.tasks[col][idx].title = e.target.value;
        persistTasks();
        renderBoard();
        // Re-open: index may shift on the board re-render but selection stays valid since we didn't change order
        openTaskPanelSameSelection();
      }
    });
    panel.querySelector('#tpStatus').addEventListener('change', (e) => {
      if (!state.selectedTask || e.target.value === state.selectedTask.col) return;
      const { col, idx } = state.selectedTask;
      const targetCol = e.target.value;
      const task = state.tasks[col].splice(idx, 1)[0];
      state.tasks[targetCol].push(task);
      state.selectedTask = { col: targetCol, idx: state.tasks[targetCol].length - 1 };
      persistTasks();
      renderBoard();
      openTaskPanelSameSelection();
      VELOX.toast(`Moved to ${COLS.find(c => c.id === targetCol).label}`, 'success', 1600);
    });
    // Post comment
    const input = panel.querySelector('#tpCommentInput');
    const send = panel.querySelector('#tpCommentSend');
    const post = () => {
      const v = input.value.trim();
      if (!v) return;
      const comments = panel.querySelector('#tpComments');
      const div = document.createElement('div');
      div.className = 'tp-comment';
      div.innerHTML = `<span class="ava" style="background:${VELOX.AVA_GRADIENTS.a2}"></span><div><div class="cmeta"><b>You</b> · just now</div><div>${v.replace(/</g,'&lt;')}</div></div>`;
      comments.appendChild(div);
      input.value = '';
      VELOX.toast('Comment posted', 'success', 1600);
    };
    send.addEventListener('click', post);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') post(); });
  }
  function openTaskPanelSameSelection(){
    if (!state.selectedTask) return;
    openTaskPanel(state.selectedTask.col, state.selectedTask.idx);
  }

  // ---------- Analytics view
  function renderAnalytics(){
    const main = document.getElementById('appMain');
    if (!main) return;
    main.innerHTML = `
      <div class="app-main-head">
        <div>
          <div class="breadcrumb">${state.project.toUpperCase()} · ANALYTICS</div>
          <h1>How this sprint is going</h1>
        </div>
        <div class="actions">
          <button class="btn btn-glass btn-sm">Last 8 weeks ▾</button>
          <button class="btn btn-glass btn-sm">Export CSV</button>
        </div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card"><div class="lbl">Tasks completed</div><div class="val" id="mt1">0</div><div class="trend">↑ 12 vs last sprint</div></div>
        <div class="metric-card"><div class="lbl">Velocity</div><div class="val"><span id="mt2">0</span>%</div><div class="trend">↑ 12% vs last sprint</div></div>
        <div class="metric-card"><div class="lbl">On-time</div><div class="val"><span id="mt3">0</span>%</div><div class="trend">↑ 4% vs last sprint</div></div>
      </div>
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-head">
            <div><h3>Velocity</h3><p>Completed issues - last 8 weeks</p></div>
            <span class="chart-pill up">+12%</span>
          </div>
          <div class="chart-stage">
            <svg class="chart-svg" id="velocitySvg" viewBox="0 0 720 252" preserveAspectRatio="none"></svg>
            <div class="chart-tooltip" id="velocityTip"></div>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-head">
            <div><h3>Tasks by category</h3><p>Current sprint workload</p></div>
          </div>
          <svg class="chart-svg chart-svg-bars" id="barSvg" viewBox="0 0 360 252"></svg>
        </div>
      </div>
    `;
    countUp('mt1', 48, 1000);
    countUp('mt2', 12, 1200);
    countUp('mt3', 94, 1200);
    drawVelocity();
    drawBars();
  }

  function renderPlaceholder(view){
    const main = document.getElementById('appMain');
    if (!main) return;
    const surfaces = {
      inbox: {
        title: 'Inbox',
        copy: 'Three updates need your attention before the sprint closes.',
        items: ['Sam mentioned you on VLX-217', 'Build #4218 passed on main', 'Priya approved your PR']
      },
      roadmap: {
        title: 'Roadmap',
        copy: 'Upcoming milestones for ' + state.project + ' are collected here.',
        items: ['Auth v3 - June', 'Realtime collaboration - July', 'Billing migration - August']
      },
      docs: {
        title: 'Project docs',
        copy: 'Decision records and shipping notes connected to this project.',
        items: ['Sprint 24 delivery notes', 'OAuth PKCE migration guide', 'Incident response playbook']
      },
      settings: {
        title: 'Workspace settings',
        copy: 'Settings are read-only in this demo workspace.',
        items: ['Members and permissions', 'Integrations', 'Billing and security']
      }
    };
    const item = surfaces[view] || surfaces.inbox;
    main.innerHTML = `
      <div class="app-main-head">
        <div><div class="breadcrumb">${escapeHTML(state.project.toUpperCase())} - ${item.title.toUpperCase()}</div><h1>${item.title}</h1></div>
      </div>
      <div class="app-empty">
        <h2>${item.title}</h2>
        <p>${item.copy}</p>
        <div class="app-empty-list">${item.items.map(text => `<div>${text}</div>`).join('')}</div>
      </div>
    `;
  }

  function renderView(){
    if (state.view === 'board') renderBoard();
    else if (state.view === 'analytics') renderAnalytics();
    else renderPlaceholder(state.view);
  }

  function countUp(id, target, dur){
    const el = document.getElementById(id);
    if (!el) return;
    if (VELOX.reduce){ el.textContent = target; return; }
    const start = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function drawVelocity(){
    const svg = document.getElementById('velocitySvg');
    if (!svg) return;
    const data = [18, 24, 22, 28, 26, 34, 30, 42];
    const labels = ['W17','W18','W19','W20','W21','W22','W23','W24'];
    const max = 48;
    const w = 720, h = 252, left = 42, right = 18, top = 18, bottom = 32;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const stepX = (w - left - right) / (data.length - 1);
    const chartH = h - top - bottom;
    const pts = data.map((d, i) => [left + i*stepX, h - bottom - (d/max) * chartH]);

    // Catmull-Rom to Bezier keeps the smooth line passing through every marker.
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++){
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const cp2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C ${cp1[0]} ${cp1[1]} ${cp2[0]} ${cp2[1]} ${p2[0]} ${p2[1]}`;
    }
    const area = d + ` L ${pts[pts.length-1][0]} ${h-bottom} L ${pts[0][0]} ${h-bottom} Z`;

    // Gridlines
    const grids = [];
    [0, 16, 32, 48].forEach(val => {
      const y = h - bottom - (val/max) * chartH;
      grids.push(`<line x1="${left}" y1="${y}" x2="${w-right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`);
      grids.push(`<text x="0" y="${y + 4}" fill="rgba(255,255,255,0.34)" font-size="10" font-family="JetBrains Mono">${val}</text>`);
    });
    const labelEls = labels.map((l, i) => `<text x="${left + i*stepX}" y="${h - 8}" fill="rgba(255,255,255,0.42)" font-size="10" font-family="JetBrains Mono" text-anchor="middle">${l}</text>`);

    svg.innerHTML = `
      <defs>
        <linearGradient id="vFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6C63FF" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#6C63FF" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="vLine" x1="0" x2="1">
          <stop offset="0%" stop-color="#6C63FF"/>
          <stop offset="100%" stop-color="#00D4FF"/>
        </linearGradient>
      </defs>
      ${grids.join('')}
      <path d="${area}" fill="url(#vFill)"/>
      <path d="${d}" stroke="url(#vLine)" stroke-width="2.8" fill="none" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="#11131c" stroke="${i === pts.length - 1 ? '#00D4FF' : '#A8A3FF'}" stroke-width="2.2" data-idx="${i}" data-val="${data[i]}" data-lbl="${labels[i]}" style="cursor:pointer"/>`).join('')}
      ${labelEls.join('')}
    `;

    // Hover tooltip
    const tip = document.getElementById('velocityTip');
    svg.querySelectorAll('circle[data-idx]').forEach(c => {
      c.addEventListener('mouseenter', () => {
        const bb = svg.getBoundingClientRect();
        const cx = (+c.getAttribute('cx') / w) * bb.width;
        const cy = (+c.getAttribute('cy') / h) * bb.height;
        tip.style.left = cx + 'px';
        const showBelow = cy < 48;
        tip.style.top = (showBelow ? cy + 12 : cy - 12) + 'px';
        tip.style.transform = showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)';
        tip.textContent = `${c.dataset.lbl} · ${c.dataset.val} tasks`;
        tip.classList.add('is-visible');
      });
      c.addEventListener('mouseleave', () => tip.classList.remove('is-visible'));
    });
  }

  function drawBars(){
    const svg = document.getElementById('barSvg');
    if (!svg || !state.tasks) return;
    const colors = { feat: '#6C63FF', bug: '#FF5F6D', perf: '#00D4FF', doc: '#00E5A0', chore: '#FFC857' };
    const values = Object.values(state.tasks).flat().reduce((counts, task) => {
      counts[task.tag] = (counts[task.tag] || 0) + 1;
      return counts;
    }, {});
    const data = Object.entries(values)
      .map(([key, value]) => ({ key, label: TAG_LABEL[key] || key.toUpperCase(), value, color: colors[key] || '#B8B0FF' }))
      .sort((a, b) => b.value - a.value);
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const max = Math.max(...data.map(entry => entry.value), 1);
    const startX = 12, barX = 82, valueX = 340, barW = 218, rowH = 37, startY = 54;

    svg.innerHTML = `
      <text x="${startX}" y="22" fill="#fff" font-size="28" font-family="Syne" font-weight="700">${total}</text>
      <text x="52" y="22" fill="rgba(255,255,255,0.42)" font-size="11" font-family="JetBrains Mono">TOTAL TASKS</text>
      ${data.map((entry, i) => {
        const y = startY + i * rowH;
        const width = Math.max(12, (entry.value / max) * barW);
        return `
          <text x="${startX}" y="${y + 13}" fill="rgba(255,255,255,0.62)" font-size="11" font-family="JetBrains Mono">${entry.label}</text>
          <rect x="${barX}" y="${y}" width="${barW}" height="16" rx="8" fill="rgba(255,255,255,0.05)"/>
          <rect x="${barX}" y="${y}" width="${width}" height="16" rx="8" fill="${entry.color}" fill-opacity="0.86"/>
          <text x="${valueX}" y="${y + 13}" fill="#fff" font-size="12" font-family="JetBrains Mono" text-anchor="end">${entry.value}</text>
        `;
      }).join('')}
    `;
  }



  // ---------- Sidebar view switching (Board/Analytics)
  function wireAppNav(){
    const nav = document.getElementById('appNav');
    if (!nav || nav.dataset.wired) return;
    nav.dataset.wired = '1';
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      e.preventDefault();
      nav.querySelectorAll('a').forEach(x => x.classList.toggle('is-active', x === a));
      const view = a.dataset.view;
      state.view = view;
      // Close any panel
      document.getElementById('taskPanel')?.classList.remove('is-open');
      document.getElementById('appShell')?.classList.remove('with-panel');
      document.getElementById('appSidebar')?.classList.remove('is-open');
      document.getElementById('appMenuToggle')?.setAttribute('aria-expanded', 'false');
      renderView();
    });
  }

  // ---------- Project switcher
  function wireProjectSwitcher(){
    const sw = document.getElementById('projectSwitcher');
    const menu = document.getElementById('projectMenu');
    if (!sw || sw.dataset.wired) return;
    sw.dataset.wired = '1';

    sw.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('is-open');
      sw.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', () => {
      menu.classList.remove('is-open');
      sw.setAttribute('aria-expanded', 'false');
    });
    menu.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-project]');
      if (!a) return;
      e.preventDefault(); e.stopPropagation();
      menu.querySelectorAll('a').forEach(x => x.classList.toggle('is-active', x === a));
      state.project = a.dataset.project;
      document.getElementById('currentProject').textContent = state.project;
      menu.classList.remove('is-open');
      sw.setAttribute('aria-expanded', 'false');
      state.tasks = loadTasks(state.project);
      persistTasks();
      renderView();
      VELOX.toast(`Switched to ${state.project}`, 'info', 1500);
    });
    sw.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){
        menu.classList.remove('is-open');
        sw.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function wireAppMenu(){
    const btn = document.getElementById('appMenuToggle');
    const sidebar = document.getElementById('appSidebar');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', () => {
      const open = sidebar.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape'){
        sidebar.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------- Notifications
  function wireNotifications(){
    const btn = document.getElementById('notifBtn');
    const dd = document.getElementById('notifDropdown');
    const badge = document.getElementById('notifBadge');
    if (!btn || btn.dataset.wired) return;
    btn.dataset.wired = '1';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dd.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!dd.contains(e.target) && e.target !== btn){
        dd.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.getElementById('markAllRead')?.addEventListener('click', (e) => {
      e.stopPropagation();
      dd.querySelectorAll('.notif-item.unread').forEach(n => n.classList.remove('unread'));
      badge.style.display = 'none';
      btn.setAttribute('aria-expanded', 'false');
      dd.classList.remove('is-open');
      state.notifUnread = 0;
      VELOX.toast('Marked as read', 'success', 1500);
    });
  }

  // ---------- Entry point
  window.initDashboard = function(){
    const saved = savedState();
    state.project = saved.project || state.project;
    document.getElementById('currentProject').textContent = state.project;
    document.querySelectorAll('#projectMenu [data-project]').forEach(a => a.classList.toggle('is-active', a.dataset.project === state.project));
    state.tasks = loadTasks(state.project);
    renderTeam();
    wireAppNav();
    wireProjectSwitcher();
    wireAppMenu();
    wireNotifications();
    renderView();
  };
})();
