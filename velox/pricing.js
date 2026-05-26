/* =========================================================
   VELOX — Pricing tiers + toggle (used on Landing & Pricing)
   ========================================================= */
window.VELOX = window.VELOX || {};

(function(){
  const TIERS = [
    {
      name: 'Starter',
      desc: 'For small teams getting their footing.',
      mo: 0, yr: 0,
      perMo: '/mo · forever',
      perYr: '/mo · forever',
      featured: false,
      features: [
        'Up to 5 members',
        'Unlimited issues &amp; docs',
        'GitHub + Slack integration',
        'Public API · 5k req/day',
        'Community support',
      ],
      cta: 'Get started',
      ctaClass: 'btn-glass',
      ctaAction: { link: 'signup' },
    },
    {
      name: 'Pro',
      desc: 'For shipping teams who want the full graph.',
      mo: 49, yr: 39,
      perMo: '/user · /mo',
      perYr: '/user · /mo · billed yearly',
      featured: true,
      features: [
        'Everything in Starter',
        'Roadmap, releases &amp; sprints',
        'AI changelog &amp; standups',
        'Customer feedback graph',
        'Private cloud regions',
        'Unlimited automations',
        'Audit log · 1 year',
        'Priority chat support',
      ],
      cta: 'Start 14-day trial →',
      ctaClass: 'btn-primary',
      ctaAction: { link: 'signup' },
    },
    {
      name: 'Enterprise',
      desc: 'For orgs that buy with Procurement.',
      mo: 'Custom', yr: 'Custom',
      perMo: '',
      perYr: '',
      featured: false,
      features: [
        'Everything in Pro',
        'SAML SSO + SCIM',
        'Self-hosted option',
        '99.99% uptime SLA',
        'Dedicated CSM',
        'Custom DPA &amp; MSA',
      ],
      cta: 'Contact sales',
      ctaClass: 'btn-glass',
      ctaAction: { link: 'signup', plan: 'enterprise' },
    },
  ];

  function tierHTML(t, i){
    const isCustom = typeof t.mo !== 'number';
    const ck = t.featured
      ? '<svg viewBox="0 0 18 18" fill="none" stroke="#00D4FF" stroke-width="2.2" aria-hidden="true"><path d="M3 9l4 4 8-8"/></svg>'
      : '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l4 4 8-8"/></svg>';
    const delay = i + 1;
    return `
      <div class="tier ${t.featured ? 'tier-pro' : ''} reveal" data-delay="${delay}">
        ${t.featured ? '<span class="tier-badge">MOST POPULAR</span>' : ''}
        <h3>${t.name}</h3>
        <p class="desc">${t.desc}</p>
        <div class="price ${isCustom ? 'custom' : ''}">
          <span data-mo="${t.mo}" data-yr="${t.yr}">${isCustom ? t.mo : '$'+t.mo}</span>
          ${t.perMo ? `<span class="per" data-per-mo="${t.perMo}" data-per-yr="${t.perYr}">${t.perMo}</span>` : ''}
        </div>
        <ul>${t.features.map(f => `<li>${ck}${f}</li>`).join('')}</ul>
        <button class="btn ${t.ctaClass}" data-tier-cta data-link="${t.ctaAction.link}" ${t.ctaAction.plan ? `data-plan="${t.ctaAction.plan}"` : ''}>${t.cta}</button>
      </div>`;
  }

  function placeIndicator(tog){
    const ind = tog.querySelector('.indicator');
    const btn = tog.querySelector('button.active');
    if (!btn || !ind) return;
    ind.style.left = btn.offsetLeft + 'px';
    ind.style.width = btn.offsetWidth + 'px';
  }

  VELOX.buildPricing = function(containerId, toggleId){
    const wrap = document.getElementById(containerId);
    const tog = document.getElementById(toggleId);
    if (!wrap) return;
    wrap.innerHTML = TIERS.map((t,i) => tierHTML(t,i)).join('');

    if (tog && !tog.dataset.wired){
      tog.dataset.wired = '1';
      // Use ResizeObserver so the indicator settles correctly the moment
      // the toggle is actually laid out (handles hidden→visible page swaps).
      if ('ResizeObserver' in window){
        const ro = new ResizeObserver(() => placeIndicator(tog));
        ro.observe(tog);
      }
      addEventListener('resize', () => placeIndicator(tog));
      tog.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-period]');
        if (!btn) return;
        tog.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
        placeIndicator(tog);
        applyPeriod(wrap, btn.dataset.period);
      });
    }
    // Place after layout — RAF chain so we run after the page-enter animation starts
    requestAnimationFrame(() => requestAnimationFrame(() => placeIndicator(tog)));
    const period = tog ? tog.querySelector('button.active')?.dataset.period || 'monthly' : 'monthly';
    applyPeriod(wrap, period);
  };

  function applyPeriod(wrap, period){
    wrap.querySelectorAll('.price > [data-mo]').forEach(el => {
      const v = period === 'annual' ? el.dataset.yr : el.dataset.mo;
      if (v === 'Custom') { el.textContent = 'Custom'; return; }
      el.textContent = (v === '0' ? '$0' : '$' + v);
    });
    wrap.querySelectorAll('.price .per').forEach(p => {
      p.textContent = period === 'annual' ? p.dataset.perYr : p.dataset.perMo;
    });
  }

  // Re-place indicators when a hidden page becomes visible (offsetLeft is 0 otherwise)
  VELOX.refreshPricingToggle = function(toggleId){
    const tog = document.getElementById(toggleId);
    if (tog) placeIndicator(tog);
  };

  // =========================================================
  // PRICING PAGE init (called by router)
  // =========================================================
  function buildFAQ(){
    const wrap = document.getElementById('faqList');
    if (!wrap || wrap.dataset.done) return;
    const items = VELOX.FAQ || [];
    const chev = '<svg class="chev" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 9l6 6 6-6"/></svg>';
    wrap.innerHTML = items.map((it, i) => `
      <div class="faq-item" data-idx="${i}">
        <button class="faq-q" type="button" aria-expanded="false">
          <span>${it.q}</span>${chev}
        </button>
        <div class="faq-a"><div class="faq-a-inner"><p>${it.a}</p></div></div>
      </div>
    `).join('');
    wrap.addEventListener('click', (e) => {
      const q = e.target.closest('.faq-q');
      if (!q) return;
      const item = q.closest('.faq-item');
      const open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    wrap.dataset.done = '1';
  }

  function setupEnterpriseForm(){
    const form = document.getElementById('enterpriseForm');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = form.querySelectorAll('[required], select[name="team"]');
      let ok = true;
      inputs.forEach(inp => {
        const v = inp.value.trim();
        if (!v){ VELOX.markFieldError(inp); ok = false; return; }
        if (inp.type === 'email' && !VELOX.validateEmail(v)){ VELOX.markFieldError(inp, 'That doesn’t look like a valid email'); ok = false; return; }
        VELOX.markFieldSuccess(inp);
      });
      if (!ok){ VELOX.toast('Please fix the highlighted fields', 'error'); return; }
      const btn = document.getElementById('entSubmit');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Sending…';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '✓ Sent · we’ll reply within 24h';
        VELOX.toast('Thanks — sales will reach out shortly', 'success');
        form.reset();
        form.querySelectorAll('.field').forEach(f => f.classList.remove('is-success'));
        setTimeout(() => { btn.innerHTML = orig; }, 4000);
      }, 1400);
    });
    // Clear errors on input
    form.addEventListener('input', e => {
      if (e.target.matches('input, select, textarea')) VELOX.clearFieldError(e.target);
    });
  }

  function highlightEnterpriseIfRequested(q){
    if (q && q.plan === 'enterprise'){
      const card = document.getElementById('enterpriseCard');
      if (card){
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.transition = 'box-shadow .6s ease';
        card.style.boxShadow = '0 0 0 2px var(--indigo), 0 0 60px rgba(108,99,255,0.4)';
        setTimeout(() => { card.style.boxShadow = '' }, 2500);
      }
    }
  }

  window.initPricing = function(q){
    VELOX.buildPricing('tiersPage', 'pricingTogglePage');
    setTimeout(() => VELOX.refreshPricingToggle('pricingTogglePage'), 50);
    buildFAQ();
    setupEnterpriseForm();
    highlightEnterpriseIfRequested(q);
  };
})();
