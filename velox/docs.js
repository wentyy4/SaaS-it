/* =========================================================
   VELOX — Docs page (sidebar, search, article switching,
   copy buttons)
   ========================================================= */
(function(){
  let currentArticle = 'quick-start';

  function buildSidebar(){
    const nav = document.getElementById('docsNav');
    if (!nav) return;
    const data = VELOX.DOCS;
    nav.innerHTML = data.sections.map(sec => `
      <div class="docs-section" data-section="${sec.id}">
        <p class="docs-section-head">${sec.title}</p>
        ${sec.items.map(it => `
          <a href="#" class="docs-link" data-article="${it.id}">${it.title}</a>
        `).join('')}
      </div>
    `).join('');
  }

  function renderArticle(id){
    const article = (VELOX.DOCS.articles && VELOX.DOCS.articles[id]);
    const body = document.getElementById('docsBody');
    if (!body) return;
    if (!article){
      body.innerHTML = `
        <h1>Coming soon</h1>
        <div class="doc-meta">In active drafting</div>
        <p>This page is being written. In the meantime, check out the <a href="#" data-doc-link="quick-start">Quick start</a> or the <a href="#" data-doc-link="api-reference">API reference</a>.</p>
        <div class="callout callout-info"><span class="ti">// Help us prioritize</span>Reach out at <code>docs@velox.dev</code> and we'll bump it up.</div>
      `;
    } else {
      body.innerHTML = `
        <h1>${article.title}</h1>
        <div class="doc-meta">${article.meta}</div>
        ${article.body}
      `;
    }
    currentArticle = id;
    // Highlight active sidebar link
    document.querySelectorAll('.docs-link').forEach(a => {
      a.classList.toggle('is-active', a.dataset.article === id);
    });
    // Keep a reload-safe URL for the active article.
    VELOX.replaceRoute?.('docs', { article: id });
    // Close mobile sidebar on selection
    document.getElementById('docsSidebar')?.classList.remove('is-open');
    // Reset scroll on the article
    document.querySelector('.docs-content')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  function wireInteractions(){
    const sidebar = document.getElementById('docsSidebar');
    const body = document.getElementById('docsBody');
    if (!sidebar || sidebar.dataset.wired) return;
    sidebar.dataset.wired = '1';

    // Sidebar link clicks
    sidebar.addEventListener('click', (e) => {
      const a = e.target.closest('.docs-link');
      if (!a) return;
      e.preventDefault();
      renderArticle(a.dataset.article);
    });

    // Search filter
    const search = document.getElementById('docsSearch');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      sidebar.querySelectorAll('.docs-section').forEach(sec => {
        let anyVisible = false;
        sec.querySelectorAll('.docs-link').forEach(a => {
          const match = !q || a.textContent.toLowerCase().includes(q);
          a.style.display = match ? '' : 'none';
          if (match) anyVisible = true;
        });
        sec.style.display = anyVisible ? '' : 'none';
      });
    });

    // Copy buttons (delegated to body — these are added dynamically)
    body.addEventListener('click', async (e) => {
      const btn = e.target.closest('.copy-btn');
      if (btn){
        const code = btn.parentElement;
        // Get text content minus the button label
        const tmp = code.cloneNode(true);
        tmp.querySelector('.copy-btn')?.remove();
        const text = tmp.textContent.trim();
        const ok = await VELOX.copy(text);
        if (ok){
          btn.textContent = 'Copied ✓';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1600);
        } else {
          VELOX.toast('Copy failed — your browser blocked it', 'error');
        }
        return;
      }
      // Internal doc links
      const dl = e.target.closest('[data-doc-link]');
      if (dl){
        e.preventDefault();
        renderArticle(dl.dataset.docLink);
      }
    });

    // Mobile toggle
    const tog = document.getElementById('docsMobileToggle');
    tog?.addEventListener('click', () => {
      sidebar.classList.toggle('is-open');
    });
  }

  window.initDocs = function(q){
    buildSidebar();
    wireInteractions();
    const id = (q && q.article) || 'quick-start';
    renderArticle(id);
  };
})();
