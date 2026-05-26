/* =========================================================
   VELOX — Router. Single-page navigation, history API,
   page enter animation, chrome swapping (marketing/auth/app).
   Loaded LAST so all page-init functions are defined.
   ========================================================= */
(function(){
  const KNOWN = ['landing','features','pricing','docs','blog','blog-post','dashboard','signin','signup','forgot-password','changelog','404'];
  const MARKETING = ['landing','features','pricing','docs','blog','blog-post','changelog'];
  const AUTH      = ['signin','signup','forgot-password'];
  const APP       = ['dashboard'];

  const marketingNav = document.getElementById('marketingNav');
  const authNav      = document.getElementById('authNav');
  const appTop       = document.getElementById('appTop');
  const marketingFoot= document.getElementById('marketingFooter');
  const blogProgress = document.getElementById('blogProgress');

  const initMap = {
    landing:        () => window.initLanding && initLanding(),
    features:       () => window.initFeatures && initFeatures(),
    pricing:        () => window.initPricing && initPricing(),
    docs:           (q) => window.initDocs && initDocs(q),
    blog:           () => window.initBlog && initBlog(),
    'blog-post':    (q) => window.initBlogPost && initBlogPost(q),
    dashboard:      () => window.initDashboard && initDashboard(),
    signin:         () => window.initSignin && initSignin(),
    signup:         (q) => window.initSignup && initSignup(q),
    'forgot-password': () => window.initForgot && initForgot(),
    changelog:      () => window.initChangelog && initChangelog(),
  };

  // Marketing-nav highlight map (nav-id -> what's "active")
  const NAV_MAP = {
    features: 'features',
    pricing: 'pricing',
    docs: 'docs',
    blog: 'blog',
    'blog-post': 'blog',
    changelog: 'changelog',
  };

  function setChrome(page){
    const isMkt = MARKETING.includes(page);
    const isAuth = AUTH.includes(page);
    const isApp = APP.includes(page);
    const is404 = page === '404';

    marketingNav.hidden = !(isMkt || is404);
    authNav.hidden = !isAuth;
    appTop.hidden = !isApp;
    // Show footer on all marketing pages; hide on app + auth + 404 + blog-post (post has its own related section)
    marketingFoot.hidden = !(isMkt && page !== 'blog-post');
    if (is404) marketingFoot.hidden = true;

    // Blog scroll-progress only on blog-post
    blogProgress.hidden = page !== 'blog-post';

    // Body class hooks for global tweaks if needed
    document.body.classList.remove(...Array.from(document.body.classList).filter(c => c.startsWith('on-page-')));
    document.body.classList.add('on-page-' + page);

    // Update active nav link
    document.querySelectorAll('.nav-links a').forEach(a => {
      const targ = NAV_MAP[page] || null;
      a.classList.toggle('active', a.dataset.nav === targ);
    });
  }

  function parsePath(){
    // Hash routes survive reload from a plain static host; pretty paths still
    // work when a deployment supplies an SPA fallback.
    const hashPath = location.hash.startsWith('#/') ? location.hash.slice(1) : '';
    let pathname = hashPath ? hashPath.split('?')[0] : location.pathname;
    const queryString = hashPath && hashPath.includes('?') ? hashPath.split('?')[1] : location.search.slice(1);
    // If we're being served from a deep path (e.g. .../velox/Velox.html or any .html), treat as landing.
    if (!hashPath && /\.html?$/i.test(pathname)) return { page: 'landing', q: {} };
    const path = pathname.replace(/^\/+|\/+$/g, '');
    if (!path) return { page: 'landing', q: {} };
    const parts = path.split('/');
    const head = parts[0];
    const q = Object.fromEntries(new URLSearchParams(queryString));

    if (head === 'features') return { page: 'features', q };
    if (head === 'pricing')  return { page: 'pricing', q };
    if (head === 'changelog')return { page: 'changelog', q };
    if (head === 'signin')   return { page: 'signin', q };
    if (head === 'signup')   return { page: 'signup', q };
    if (head === 'forgot-password') return { page: 'forgot-password', q };
    if (head === 'dashboard')return { page: 'dashboard', q };
    if (head === 'docs')     return { page: 'docs', q: Object.assign(q, parts[1] ? { article: parts[1] } : {}) };
    if (head === 'blog'){
      if (parts[1]) return { page: 'blog-post', q: Object.assign(q, { post: parts[1] }) };
      return { page: 'blog', q };
    }
    if (KNOWN.includes(head)) return { page: head, q };
    return { page: '404', q };
  }

  function routePath(page, q={}){
    let path = '/' + (page === 'landing' ? '' : page);
    if (page === 'blog-post' && q.post) path = '/blog/' + q.post;
    if (page === 'docs' && q.article) path = '/docs/' + q.article;
    const search = q.plan ? '?plan=' + encodeURIComponent(q.plan) : '';
    return path + search;
  }

  function routeHref(page, q={}){
    const entryPath = /\.html?$/i.test(location.pathname) ? location.pathname : '/';
    return entryPath + '#' + routePath(page, q);
  }

  function refreshLinkHrefs(){
    document.querySelectorAll('a[data-link]').forEach(a => {
      const q = {};
      if (a.dataset.plan) q.plan = a.dataset.plan;
      if (a.dataset.doc) q.article = a.dataset.doc;
      if (a.dataset.post) q.post = a.dataset.post;
      a.href = routeHref(a.dataset.link, q);
    });
  }

  function showPage(page, q={}, opts={}){
    if (page === 'blog-post' && !(VELOX.BLOG || []).some(post => post.id === q.post)){
      page = '404';
      q = {};
    }
    if (!document.getElementById('page-' + page)){
      page = '404';
    }
    // Hide all pages
    document.querySelectorAll('[data-page]').forEach(p => {
      p.hidden = true;
      p.classList.remove('is-visible', 'page-enter');
    });
    const target = document.getElementById('page-' + page);
    target.hidden = false;
    target.classList.add('is-visible');
    // Re-run page-enter animation
    requestAnimationFrame(() => target.classList.add('page-enter'));

    setChrome(page);

    // Reset scroll
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });

    // Run page-specific init
    if (initMap[page]) initMap[page](q);

    // (Re-)trigger reveal observer for the now-visible page
    VELOX.observeReveals(target);
    VELOX.closeMobileNav?.();
    refreshLinkHrefs();

    if (!opts.skipPush){
      try { history.pushState({ page, q }, '', routeHref(page, q)); } catch {}
    }

    // Update document title
    const titles = {
      landing: 'Velox — Ship projects 10× faster',
      features: 'Features — Velox',
      pricing: 'Pricing — Velox',
      docs: 'Docs — Velox',
      blog: 'Blog — Velox',
      'blog-post': ((VELOX.BLOG || []).find(post => post.id === q.post)?.title || 'Blog') + ' — Velox',
      dashboard: 'Dashboard — Velox',
      signin: 'Sign in — Velox',
      signup: 'Sign up — Velox',
      'forgot-password': 'Reset password — Velox',
      changelog: 'Changelog — Velox',
      '404': 'Not found — Velox',
    };
    document.title = titles[page] || 'Velox';
  }

  // Public navigate API
  VELOX.go = (page, q={}) => showPage(page, q);
  VELOX.replaceRoute = (page, q={}) => {
    try { history.replaceState({ page, q }, '', routeHref(page, q)); } catch {}
    refreshLinkHrefs();
  };

  // Global click handler for data-link anchors
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-link]');
    if (!a) return;
    // Allow new-tab and modified clicks to do their normal thing
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    const page = a.dataset.link;
    const q = {};
    if (a.dataset.plan) q.plan = a.dataset.plan;
    if (a.dataset.doc) q.article = a.dataset.doc;
    if (a.dataset.post) q.post = a.dataset.post;
    showPage(page, q);
  });

  // Browser back/forward
  addEventListener('popstate', () => {
    const { page, q } = parsePath();
    showPage(page, q, { skipPush: true });
  });

  // Boot
  document.addEventListener('DOMContentLoaded', () => {
    const { page, q } = parsePath();
    showPage(page, q, { skipPush: true });
  });
})();
