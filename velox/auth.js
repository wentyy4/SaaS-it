/* =========================================================
   VELOX — Auth pages (signin, signup multi-step, forgot)
   ========================================================= */
(function(){
  // -------- Sign in
  function wireSignin(){
    const form = document.getElementById('signinForm');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email;
      const pw = form.password;
      let ok = true;
      if (!VELOX.validateEmail(email.value)){ VELOX.markFieldError(email); ok = false; }
      else VELOX.markFieldSuccess(email);
      if (!pw.value){ VELOX.markFieldError(pw); ok = false; }
      else VELOX.markFieldSuccess(pw);
      if (!ok) return;
      const btn = document.getElementById('signinSubmit');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in…';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = orig;
        VELOX.toast('Welcome back', 'success');
        VELOX.go('dashboard');
      }, 1500);
    });
    form.addEventListener('input', e => { if (e.target.matches('input')) VELOX.clearFieldError(e.target); });

    // OAuth buttons
    document.querySelectorAll('#page-signin [data-oauth]').forEach(btn => {
      btn.addEventListener('click', () => {
        const which = btn.dataset.oauth;
        VELOX.toast(`Redirecting to ${which === 'github' ? 'GitHub' : 'Google'}…`, 'info');
        setTimeout(() => VELOX.go('dashboard'), 1100);
      });
    });
  }

  window.initSignin = function(){ wireSignin(); };

  // -------- Sign up
  let selectedPlan = 'pro';

  function pwStrength(v){
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return Math.min(4, s);
  }
  const STRENGTH_LABEL = ['Too short', 'Weak', 'Decent', 'Strong', 'Excellent'];

  function setStep(n){
    document.querySelectorAll('.signup-step').forEach(s => s.classList.toggle('is-active', s.dataset.step === String(n)));
    document.querySelectorAll('.signup-steps span').forEach((s, i) => s.classList.toggle('is-active', i < n));
  }

  function buildTeamSize(){
    const wrap = document.getElementById('teamSizePills');
    if (!wrap || wrap.dataset.done) return;
    wrap.dataset.done = '1';
    const opts = ['Just me', '2–10', '11–50', '51–200', '200+'];
    wrap.innerHTML = opts.map((o, i) => `
      <label><input type="radio" name="teamsize" value="${o}" ${i===1?'checked':''}><span class="pill">${o}</span></label>
    `).join('');
  }

  function buildSignupPlans(qPlan){
    const wrap = document.getElementById('signupPlanPills');
    if (!wrap || wrap.dataset.done) return;
    wrap.dataset.done = '1';
    const plans = [
      { v: 'starter', label: 'Starter · Free' },
      { v: 'pro', label: 'Pro · $49/user/mo' },
      { v: 'enterprise', label: 'Enterprise · Custom' },
    ];
    const initial = qPlan || 'pro';
    selectedPlan = initial;
    wrap.innerHTML = plans.map(p => `
      <label><input type="radio" name="plan" value="${p.v}" ${p.v===initial?'checked':''}><span class="pill">${p.label}</span></label>
    `).join('');
    wrap.addEventListener('change', e => { if (e.target.name === 'plan') selectedPlan = e.target.value; });
  }

  function wireStep1(){
    const form = document.getElementById('signupStep1');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    const pw = form.password;
    const meter = document.getElementById('pwStrength');
    const label = document.getElementById('pwLabel');
    pw.addEventListener('input', () => {
      const s = pwStrength(pw.value);
      meter.classList.remove('s1','s2','s3','s4');
      if (s > 0) meter.classList.add('s'+s);
      label.textContent = STRENGTH_LABEL[s];
    });
    form.addEventListener('input', e => { if (e.target.matches('input')) VELOX.clearFieldError(e.target); });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      const name = form.name; const email = form.email;
      if (!name.value.trim()){ VELOX.markFieldError(name); ok = false; } else VELOX.markFieldSuccess(name);
      if (!VELOX.validateEmail(email.value)){ VELOX.markFieldError(email); ok = false; } else VELOX.markFieldSuccess(email);
      if (pw.value.length < 8){ VELOX.markFieldError(pw); ok = false; } else VELOX.markFieldSuccess(pw);
      if (!ok) return;
      setStep(2);
    });
  }

  function wireStep2(){
    const form = document.getElementById('signupStep2');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = document.getElementById('signupSubmit');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Creating account…';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = orig;
        VELOX.confetti(42);
        VELOX.toast(selectedPlan === 'enterprise' ? 'Account created — sales will reach out shortly' : 'Account created — welcome aboard!', 'success');
        setTimeout(() => VELOX.go('dashboard'), 900);
      }, 1500);
    });
    document.querySelectorAll('[data-step-back]').forEach(b => {
      if (b.dataset.wired) return;
      b.dataset.wired = '1';
      b.addEventListener('click', () => setStep(1));
    });
  }

  window.initSignup = function(q){
    buildTeamSize();
    buildSignupPlans(q && q.plan);
    wireStep1();
    wireStep2();
    setStep(1);
  };

  // -------- Forgot password
  let resendTimerId = null;
  function startResendTimer(){
    const btn = document.getElementById('resendBtn');
    const span = document.getElementById('resendTimer');
    if (!btn || !span) return;
    let s = 60;
    btn.disabled = true;
    span.textContent = s;
    clearInterval(resendTimerId);
    resendTimerId = setInterval(() => {
      s--;
      if (s <= 0){
        clearInterval(resendTimerId);
        btn.disabled = false;
        btn.textContent = 'Resend email';
        return;
      }
      span.textContent = s;
    }, 1000);
  }

  function wireForgot(){
    const form = document.getElementById('forgotForm');
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    form.addEventListener('input', e => { if (e.target.matches('input')) VELOX.clearFieldError(e.target); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.email;
      if (!VELOX.validateEmail(email.value)){ VELOX.markFieldError(email); return; }
      const btn = document.getElementById('forgotSubmit');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Sending…';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = orig;
        document.getElementById('resetEmail').textContent = email.value.trim();
        document.getElementById('forgotInitial').hidden = true;
        document.getElementById('forgotSuccess').hidden = false;
        startResendTimer();
      }, 1100);
    });

    const resend = document.getElementById('resendBtn');
    if (resend && !resend.dataset.wired){
      resend.dataset.wired = '1';
      resend.addEventListener('click', () => {
        VELOX.toast('Demo reset preview refreshed', 'success');
        startResendTimer();
      });
    }
  }

  window.initForgot = function(){
    // Reset to initial view every time the page is opened
    document.getElementById('forgotInitial').hidden = false;
    document.getElementById('forgotSuccess').hidden = true;
    clearInterval(resendTimerId);
    wireForgot();
  };
})();
