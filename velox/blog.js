/* =========================================================
   VELOX — Blog: grid, filters, blog post page with
   scroll-progress, share buttons, related posts.
   ========================================================= */
(function(){
  let currentFilter = 'all';
  let currentPost = null;
  const initialPostBody = document.getElementById('postBody')?.innerHTML || '';
  const POST_BODIES = {
    'ai-workflows': initialPostBody,
    'graph-rewrite': `
      <p>Our graph layer began as a clear, comfortable abstraction. Then customer workspaces grew, edges multiplied, and ordinary board queries started spending more time rebuilding context than returning useful results.</p>
      <p>We spent one focused weekend replacing eager traversal with indexed adjacency lists and a small invalidation log. It was fast by Sunday night. It was also missing two edge cases that production found immediately.</p>
      <h2>The change</h2>
      <p>Reads now ask for a bounded view of the graph and reuse indexed neighborhoods. Writes append invalidations so live boards refresh only the nodes affected by an update.</p>
      <div class="callout callout-warn"><span class="ti">// What broke</span>Archived dependencies briefly appeared in release views, and simultaneous drag operations could reapply an older board position. Both issues came from treating ordering metadata as immutable.</div>
      <h2>What survived the weekend</h2>
      <p>We kept the new read path, moved ordering updates behind one transactional operation, and added concurrency tests around board moves. Median board sync is now 40ms instead of 180ms, with much less drama attached to that number.</p>
    `,
    'design-system': `
      <p>Component libraries gave us speed at the beginning, but eventually every product decision required negotiating somebody else's spacing, state model, and accessibility defaults.</p>
      <p>We did not stop using components. We stopped outsourcing the primitives that define how Velox feels: tokens, focus states, layout rhythm, and data-dense surfaces.</p>
      <h2>Own the constraints</h2>
      <p>Our internal system starts with a small set of tokens and composable patterns. A kanban card and a billing card should share a visual language, without pretending they have the same behavior.</p>
      <blockquote>A design system is useful when it preserves product decisions, not when it hides them.</blockquote>
      <p>The result is fewer overrides, stronger keyboard behavior, and a UI that can evolve without waiting for an upstream release.</p>
    `,
    'series-a': `
      <p>We raised a Series A to keep building the project platform we wanted as engineers: fast, calm, and honest about how software gets shipped.</p>
      <p>The funding lets us invest in reliability, integrations, and a larger support team while keeping read-only collaboration accessible to every customer.</p>
      <h2>What changes</h2>
      <p>You will see more work on performance, enterprise security controls, and migration tooling. You will not see artificial complexity added just to justify a pricing page.</p>
      <p>Thanks to every team that trusted an early product with real work. That trust is the part we intend to compound.</p>
    `,
    'roadmap-public': `
      <p>Product roadmaps are most useful when the people affected by them can see the thinking, not just a polished quarterly screenshot.</p>
      <p>Public roadmap pages now let teams share selected initiatives, status changes, and feedback links without exposing internal issues or discussions.</p>
      <h2>Built from the same graph</h2>
      <p>A public page is a filtered view of the same underlying release data, so it changes when work changes. There is no duplicate board to curate on Friday afternoon.</p>
      <p>We are starting with read-only sharing and RSS. Voting and customer-specific views are next on the list.</p>
    `,
    'principles': `
      <p>We keep six hiring principles because a short list can still affect a decision when the calendar is full and a team is under pressure.</p>
      <h2>The short version</h2>
      <ul>
        <li>Write clearly before escalating urgency.</li>
        <li>Prefer durable fixes over impressive recoveries.</li>
        <li>Make room for people who see the problem differently.</li>
        <li>Treat customer time as carefully as your own.</li>
      </ul>
      <p>Principles are not a poster or a substitute for judgment. They are a shared starting point, revisited whenever reality shows us a better one.</p>
    `
  };

  function wireCards(scope){
    scope.querySelectorAll('.blog-card').forEach(card => {
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          VELOX.go('blog-post', { post: card.dataset.post });
        }
      });
    });
  }

  function buildGrid(){
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    const posts = VELOX.BLOG || [];
    grid.innerHTML = posts.map(p => `
      <article class="blog-card ${p.large ? '' : 'is-small'}" data-link="blog-post" data-post="${p.id}" data-cat="${p.cat}" role="link" tabindex="0">
        <div class="blog-cover ${p.cover}"><div class="glyph">${p.glyph}</div></div>
        <div class="blog-body">
          <span class="blog-cat cat-${p.cat}">${p.cat.toUpperCase()}</span>
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
          <div class="blog-meta">
            <span class="ava" style="background:${VELOX.AVA_GRADIENTS.a2}"></span>
            <span>${p.author}</span>
            <span class="dot"></span>
            <span>${p.date}</span>
            <span class="dot"></span>
            <span>${p.read} read</span>
          </div>
        </div>
      </article>
    `).join('');
    wireCards(grid);
  }

  function applyFilter(cat){
    currentFilter = cat;
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    grid.querySelectorAll('.blog-card').forEach(card => {
      const match = cat === 'all' || card.dataset.cat === cat;
      card.classList.toggle('is-faded', !match);
    });
    document.querySelectorAll('#blogFilters button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.filter === cat);
    });
  }

  function wireFilters(){
    const filt = document.getElementById('blogFilters');
    if (!filt || filt.dataset.wired) return;
    filt.dataset.wired = '1';
    filt.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      applyFilter(b.dataset.filter);
    });
  }

  window.initBlog = function(){
    buildGrid();
    wireFilters();
    applyFilter(currentFilter);
  };

  // =========================================================
  // BLOG POST page
  // =========================================================
  function renderPost(id){
    const post = (VELOX.BLOG || []).find(p => p.id === id);
    if (!post) return false;
    currentPost = post;
    document.getElementById('postGlyph').textContent = post.glyph;
    document.getElementById('postCover').className = 'post-cover ' + post.cover;
    const cat = document.getElementById('postCategory');
    cat.className = 'blog-cat cat-' + post.cat;
    cat.textContent = post.cat;
    document.getElementById('postDate').textContent = post.date + ' - ' + post.read + ' read';
    document.getElementById('postTitle').textContent = post.title;
    document.getElementById('postAuthor').innerHTML = `<b>${post.author}</b> - ${post.role}`;
    document.getElementById('postCategoryLabel').textContent = post.cat;
    document.getElementById('postBody').innerHTML = POST_BODIES[post.id] || `<p>${post.excerpt}</p>`;
    document.getElementById('postSharePath').textContent = 'velox.dev/blog/' + post.id;
    return true;
  }

  function buildRelated(id){
    const grid = document.getElementById('relatedGrid');
    if (!grid) return;
    const posts = (VELOX.BLOG || []).filter(p => p.id !== id).slice(0, 3);
    grid.innerHTML = posts.map(p => `
      <article class="blog-card is-small" data-link="blog-post" data-post="${p.id}" role="link" tabindex="0">
        <div class="blog-cover ${p.cover}"><div class="glyph">${p.glyph}</div></div>
        <div class="blog-body">
          <span class="blog-cat cat-${p.cat}">${p.cat.toUpperCase()}</span>
          <h3>${p.title}</h3>
          <div class="blog-meta">
            <span>${p.author}</span>
            <span class="dot"></span>
            <span>${p.date}</span>
          </div>
        </div>
      </article>
    `).join('');
    wireCards(grid);
  }

  let scrollHandler = null;
  function attachScrollProgress(){
    const bar = document.getElementById('blogProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      bar.style.width = Math.min(100, Math.max(0, (scrollY / max) * 100)) + '%';
    };
    if (scrollHandler) removeEventListener('scroll', scrollHandler);
    scrollHandler = update;
    addEventListener('scroll', update, { passive: true });
    update();
  }

  function wireShare(){
    const root = document.getElementById('page-blog-post');
    if (!root || root.dataset.wired) return;
    root.dataset.wired = '1';
    root.addEventListener('click', async (e) => {
      const btn = e.target.closest('.share-btn');
      const copyCode = e.target.closest('.copy-btn');
      if (copyCode){
        const code = copyCode.parentElement.cloneNode(true);
        code.querySelector('.copy-btn')?.remove();
        const ok = await VELOX.copy(code.textContent.trim());
        VELOX.toast(ok ? 'Code copied!' : 'Copy failed', ok ? 'success' : 'error');
        return;
      }
      if (!btn) return;
      const url = location.href;
      if (btn.dataset.share === 'copy'){
        const ok = await VELOX.copy(url);
        VELOX.toast(ok ? 'Link copied!' : 'Copy failed', ok ? 'success' : 'error');
      } else if (btn.dataset.share === 'x'){
        VELOX.toast('Opening X share (mocked)', 'info');
      } else if (btn.dataset.share === 'ln'){
        VELOX.toast('Opening LinkedIn share (mocked)', 'info');
      }
    });
  }

  window.initBlogPost = function(q){
    const id = q?.post || 'ai-workflows';
    if (!renderPost(id)){
      VELOX.go('404');
      return;
    }
    buildRelated(id);
    attachScrollProgress();
    wireShare();
  };
})();
