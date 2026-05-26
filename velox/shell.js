/* =========================================================
   VELOX — Shell utilities (toast, modal, cursor, reveal,
   validation helpers). Loaded on every page.
   ========================================================= */
window.VELOX = window.VELOX || {};

(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  VELOX.reduce = reduce;

  // -------- Toast
  const stack = document.getElementById('toastStack');
  VELOX.toast = function(message, type='success', timeout=3000){
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = '<span class="dot"></span><span></span>';
    el.lastChild.textContent = message;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, timeout);
  };

  // -------- Modal
  let modalEl = null;
  let modalCleanup = null;
  VELOX.openModal = function(html, opts={}){
    VELOX.closeModal();
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div class="mono" style="font-size:12px; color:var(--ink-mute); letter-spacing:0.1em">${opts.title || ''}</div>
          <button class="modal-close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l10 10M13 3L3 13"/></svg>
          </button>
        </div>
        <div class="modal-body"></div>
      </div>`;
    back.querySelector('.modal-body').appendChild(typeof html === 'string' ? Object.assign(document.createElement('div'),{innerHTML:html}) : html);
    document.body.appendChild(back);
    modalEl = back;
    modalCleanup = typeof opts.onClose === 'function' ? opts.onClose : null;
    back.addEventListener('click', e => { if (e.target === back) VELOX.closeModal(); });
    back.querySelector('.modal-close').addEventListener('click', VELOX.closeModal);
    document.addEventListener('keydown', escClose);
  };
  function escClose(e){ if (e.key === 'Escape') VELOX.closeModal(); }
  VELOX.closeModal = function(){
    if (!modalEl) return;
    modalEl.remove();
    modalEl = null;
    document.removeEventListener('keydown', escClose);
    if (modalCleanup){
      const cleanup = modalCleanup;
      modalCleanup = null;
      cleanup();
    }
  };

  // -------- Responsive marketing navigation
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const marketingLinks = document.getElementById('marketingLinks');
  function closeMobileNav(){
    marketingLinks?.classList.remove('is-open');
    mobileNavToggle?.setAttribute('aria-expanded', 'false');
  }
  VELOX.closeMobileNav = closeMobileNav;
  if (mobileNavToggle && marketingLinks){
    mobileNavToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = marketingLinks.classList.toggle('is-open');
      mobileNavToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!marketingLinks.contains(e.target) && e.target !== mobileNavToggle) closeMobileNav();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // -------- Cursor
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (dot && ring && !window.matchMedia('(pointer:coarse)').matches) {
    // Hide until first mousemove so we never see a stuck dot in the corner
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my, ready = false;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!ready){
        ready = true;
        rx = mx; ry = my;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        document.body.classList.add('cursor-ready');
      }
    });
    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx - 4}px, ${my - 4}px)`;
      ring.style.transform = `translate(${rx - 15}px, ${ry - 15}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, input, textarea, select, [role="button"], .compare-knob, .k-task')) {
        ring.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a, button, input, textarea, select, [role="button"], .compare-knob, .k-task')) {
        ring.classList.remove('is-hover');
      }
    });
  }

  // -------- Reveal observer (re-bind whenever we add new .reveal nodes)
  VELOX.observeReveals = function(scope){
    const els = (scope || document).querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window) || reduce){
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  };

  // -------- Sticky-blur nav
  function navScroll(){
    const nav = document.getElementById('marketingNav');
    if (!nav) return;
    nav.classList.toggle('scrolled', scrollY > 12);
  }
  addEventListener('scroll', navScroll, { passive: true });

  // -------- Validation helpers
  VELOX.validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  VELOX.markFieldError = (input, msg) => {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.add('is-error');
    field.classList.remove('is-success');
    const err = field.querySelector('.field-error');
    if (err && msg) err.textContent = msg;
  };
  VELOX.clearFieldError = (input) => {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.remove('is-error');
  };
  VELOX.markFieldSuccess = (input) => {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.add('is-success');
    field.classList.remove('is-error');
  };

  // -------- Confetti
  VELOX.confetti = function(count=36){
    if (reduce) return;
    const c = document.createElement('div');
    c.className = 'confetti';
    const colors = ['#6C63FF', '#00D4FF', '#00E5A0', '#FFC857', '#FF6BA1', '#B8B0FF'];
    for (let i = 0; i < count; i++){
      const it = document.createElement('i');
      const ang = Math.random() * Math.PI * 2;
      const dist = 220 + Math.random() * 300;
      it.style.background = colors[i % colors.length];
      it.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      it.style.setProperty('--dy', `${Math.sin(ang) * dist + 200}px`);
      it.style.setProperty('--dr', `${(Math.random() - 0.5) * 720}deg`);
      it.style.animationDelay = (Math.random() * 100) + 'ms';
      c.appendChild(it);
    }
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1800);
  };

  // -------- Copy to clipboard (with fallback)
  VELOX.copy = async function(text){
    try {
      if (navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  };

  // -------- Toggle-password buttons (event delegation)
  document.addEventListener('click', (e) => {
    const tog = e.target.closest('[data-toggle-pw]');
    if (tog){
      const inp = tog.parentElement.querySelector('input');
      if (inp){
        const showing = inp.type === 'password';
        inp.type = showing ? 'text' : 'password';
        tog.classList.toggle('is-active', showing);
        tog.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
      }
      e.preventDefault();
    }
  });

  // Initial reveal pass
  document.addEventListener('DOMContentLoaded', () => VELOX.observeReveals());
})();
