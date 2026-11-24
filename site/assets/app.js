// Arcwell — frontend only. Every "server" call below is simulated in the browser (no data leaves the page).
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem('arcwell:' + k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem('arcwell:' + k, JSON.stringify(v)),
  del: (k) => localStorage.removeItem('arcwell:' + k),
};
const fakeRequest = (ms = 1200) => new Promise(r => setTimeout(r, ms + Math.random() * 500));
const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
const ref = (p) => p + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();

const LOGO = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 20 12 4l8 16" stroke="#c8f169" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 14h9" stroke="#c8f169" stroke-width="2.6" stroke-linecap="round"/></svg>`;

/* ---------- Layout: header + footer ---------- */
function renderChrome() {
  const page = document.body.dataset.page;
  const user = store.get('session', null);
  const link = (href, label, key) => `<li><a href="${href}" class="${page === key ? 'active' : ''}">${label}</a></li>`;
  const header = $('#site-header');
  if (header) header.innerHTML = `
    <div class="container nav">
      <a href="index.html" class="logo" aria-label="Arcwell home"><span class="logo-mark">${LOGO}</span>Arcwell</a>
      <ul class="nav-links" id="nav-links">
        ${link('index.html#services', 'Services', 'services')}
        ${link('index.html#work', 'Case studies', 'work')}
        ${link('index.html#pricing', 'Pricing', 'pricing')}
        ${link('about.html', 'About', 'about')}
        ${link('contact.html', 'Contact', 'contact')}
      </ul>
      <div class="nav-actions">
        ${user
          ? `<a href="portal.html" class="user-chip"><span class="avatar">${initials(user.name)}</span><span>Portal</span></a>`
          : `<a href="portal.html" class="btn btn-ghost">Client login</a>`}
        <a href="contact.html#book" class="btn btn-primary">Book a call</a>
        <button class="menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
    </div>`;
  const footer = $('#site-footer');
  if (footer) footer.innerHTML = `
    <div class="container">
      <div class="foot-grid">
        <div>
          <a href="index.html" class="logo"><span class="logo-mark">${LOGO.replaceAll('#c8f169', '#0e1a17')}</span>Arcwell</a>
          <p style="max-width:34ch;font-size:.92rem">Strategy and operations consulting for growing companies. Clear plans, measurable results, no 200-page decks.</p>
        </div>
        <div><h4>Company</h4><ul><li><a href="about.html">About</a></li><li><a href="about.html#team">Team</a></li><li><a href="index.html#work">Case studies</a></li><li><a href="contact.html">Careers</a></li></ul></div>
        <div><h4>Services</h4><ul><li><a href="index.html#services">Growth strategy</a></li><li><a href="index.html#services">Operations</a></li><li><a href="index.html#services">Finance & FP&A</a></li><li><a href="index.html#services">Digital transformation</a></li></ul></div>
        <div><h4>Contact</h4><ul><li>hello@arcwell.co</li><li>+1 (415) 555-0142</li><li>350 Market St, San Francisco</li><li><a href="portal.html">Client portal</a></li></ul></div>
      </div>
      <div class="foot-bottom"><span>© ${new Date().getFullYear()} Arcwell Consulting. All rights reserved.</span><span>Privacy · Terms · Cookies</span></div>
    </div>`;

  const toggle = $('#menu-toggle'), links = $('#nav-links');
  toggle?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  links?.addEventListener('click', e => { if (e.target.tagName === 'A') links.classList.remove('open'); });
  const onScroll = () => header?.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ---------- Toasts ---------- */
function toast(title, sub = '', type = 'ok') {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.innerHTML = `<span class="ti">${type === 'error' ? '!' : '✓'}</span><div><b></b><small></small></div>`;
  t.querySelector('b').textContent = title;
  t.querySelector('small').textContent = sub;
  box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 4200);
}

async function withLoading(btn, label, fn) {
  const html = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>${label}`;
  try { await fn(); } finally { btn.disabled = false; btn.innerHTML = html; }
}

/* ---------- Validation ---------- */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function validate(form) {
  let ok = true;
  $$('[data-rule]', form).forEach(input => {
    const field = input.closest('.field');
    const v = input.value.trim();
    const rule = input.dataset.rule;
    const bad = (rule === 'required' && !v) || (rule === 'email' && !EMAIL.test(v)) || (rule === 'min' && v.length < 20);
    field.classList.toggle('err', bad);
    if (bad && ok) { input.focus(); ok = false; }
  });
  return ok;
}
document.addEventListener('input', e => e.target.closest('.field.err')?.classList.remove('err'));

/* ---------- Scroll reveal + counters ---------- */
function initReveal() {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    if (en.target.dataset.count) countUp(en.target);
    io.unobserve(en.target);
  }), { threshold: .15 });
  $$('.reveal, [data-count]').forEach(el => io.observe(el));
}
function countUp(el) {
  const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
  const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / 1600, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + (end * e).toFixed(dec) + suf;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- Case studies: filter + modal ---------- */
function initCases() {
  $$('.filters .chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.filters .chip').forEach(c => c.classList.toggle('active', c === chip));
    const f = chip.dataset.filter;
    $$('.case').forEach(c => c.classList.toggle('hide', f !== 'all' && c.dataset.cat !== f));
  }));
  const modal = $('#case-modal');
  if (!modal) return;
  $$('.case').forEach(c => c.addEventListener('click', e => {
    e.preventDefault();
    const d = c.dataset;
    $('#m-tag', modal).textContent = d.tag;
    $('#m-title', modal).textContent = d.title;
    $('#m-body', modal).textContent = d.body;
    $('#m-metrics', modal).innerHTML = d.metrics.split('|').map(m => { const [b, s] = m.split(':'); return `<div><b>${b}</b><small>${s}</small></div>`; }).join('');
    modal.classList.add('open');
  }));
  const close = () => modal.classList.remove('open');
  modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.modal-close')) close(); });
  addEventListener('keydown', e => e.key === 'Escape' && close());
}

/* ---------- Pricing toggle ---------- */
function initPricing() {
  $$('.toggle button').forEach(b => b.addEventListener('click', () => {
    $$('.toggle button').forEach(x => x.classList.toggle('active', x === b));
    const mode = b.dataset.mode;
    $$('[data-monthly]').forEach(p => {
      p.querySelector('.amt').textContent = p.dataset[mode];
      p.querySelector('small').textContent = mode === 'monthly' ? '/month' : '/month, billed yearly';
    });
  }));
  $$('[data-plan]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    store.set('plan', btn.dataset.plan);
    location.href = 'contact.html?plan=' + encodeURIComponent(btn.dataset.plan) + '#book';
  }));
}

/* ---------- Testimonials ---------- */
function initTesti() {
  const slides = $$('.testi-slide');
  if (!slides.length) return;
  const dots = $('.dots');
  dots.innerHTML = slides.map(() => '<i></i>').join('');
  let i = 0, timer;
  const show = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === i));
    $$('i', dots).forEach((d, k) => d.classList.toggle('on', k === i));
  };
  const auto = () => { clearInterval(timer); timer = setInterval(() => show(i + 1), 6500); };
  $('[data-prev]').addEventListener('click', () => { show(i - 1); auto(); });
  $('[data-next]').addEventListener('click', () => { show(i + 1); auto(); });
  show(0); auto();
}

/* ---------- Booking widget ---------- */
function initBooking() {
  const box = $('#booking');
  if (!box) return;
  const days = $('.days', box), slots = $('.slots', box);
  const list = [];
  const d = new Date();
  while (list.length < 5) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) list.push(new Date(d)); }
  days.innerHTML = list.map((x, k) => `<button type="button" class="day${k ? '' : ' on'}" data-k="${k}"><small>${x.toLocaleDateString('en-US', { weekday: 'short' })}</small><b>${x.getDate()}</b></button>`).join('');
  const times = ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM'];
  let day = 0, time = null;
  const drawSlots = () => {
    // pseudo-random "already booked" slots so each day looks different
    slots.innerHTML = times.map((t, k) => `<button type="button" class="slot" ${(k * 7 + day * 3) % 5 === 0 ? 'disabled' : ''}>${t}</button>`).join('');
    time = null;
  };
  days.addEventListener('click', e => {
    const b = e.target.closest('.day'); if (!b) return;
    $$('.day', days).forEach(x => x.classList.toggle('on', x === b)); day = +b.dataset.k; drawSlots();
  });
  slots.addEventListener('click', e => {
    const b = e.target.closest('.slot'); if (!b || b.disabled) return;
    $$('.slot', slots).forEach(x => x.classList.toggle('on', x === b)); time = b.textContent;
  });
  drawSlots();
  const form = $('form', box);
  const plan = new URLSearchParams(location.search).get('plan');
  if (plan && $('[name=topic]', form)) $('[name=topic]', form).value = plan + ' plan';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!time) return toast('Pick a time slot', 'Choose one of the open times above.', 'error');
    if (!validate(form)) return;
    await withLoading($('button[type=submit]', form), 'Booking…', () => fakeRequest(1400));
    const when = `${list[day].toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${time}`;
    const id = ref('AW');
    const bookings = store.get('bookings', []);
    bookings.push({ id, when, name: form.name.value, email: form.email.value });
    store.set('bookings', bookings);
    box.querySelector('.booking-ui').hidden = true;
    const s = $('.success-box', box);
    s.querySelector('[data-when]').textContent = when;
    s.querySelector('[data-id]').textContent = id;
    s.querySelector('[data-email]').textContent = form.email.value;
    s.classList.add('show');
    toast('Call booked!', `${when} · Confirmation ${id}`);
  });
  $('[data-rebook]', box)?.addEventListener('click', () => {
    box.querySelector('.booking-ui').hidden = false; $('.success-box', box).classList.remove('show'); form.reset(); drawSlots();
  });
}

/* ---------- Contact form ---------- */
function initContact() {
  $$('form[data-contact]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate(form)) return toast('Please check the form', 'Some fields need your attention.', 'error');
    await withLoading($('button[type=submit]', form), 'Sending…', () => fakeRequest(1300));
    const inbox = store.get('messages', []);
    inbox.push({ name: form.name.value, email: form.email.value, at: Date.now() });
    store.set('messages', inbox);
    toast('Message sent successfully!', `Thanks ${form.name.value.split(' ')[0]}, we'll reply within 24 hours.`);
    form.reset();
  }));
}

/* ---------- Newsletter ---------- */
function initNewsletter() {
  $$('form[data-newsletter]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    if (!EMAIL.test(email)) return toast('Invalid email', 'Please enter a valid email address.', 'error');
    const subs = store.get('subs', []);
    if (subs.includes(email)) return toast("You're already subscribed", 'Look out for our next issue on Thursday.');
    await withLoading($('button', form), 'Joining…', () => fakeRequest(900));
    subs.push(email); store.set('subs', subs);
    toast("You're in!", 'Welcome to The Arcwell Brief. Check your inbox to confirm.');
    form.reset();
  }));
}

/* ---------- Client portal ---------- */
function initPortal() {
  const login = $('#portal-login');
  if (!login) return;
  const dash = $('#dashboard');
  const showDash = () => {
    const u = store.get('session');
    login.hidden = true; dash.classList.add('show');
    $('#hello').textContent = 'Good ' + (new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening') + ', ' + u.name.split(' ')[0];
    $('#u-company').textContent = u.company;
    renderTasks(); renderMsgs();
    requestAnimationFrame(() => $$('.bar i').forEach(b => b.style.width = b.dataset.w));
  };
  const form = $('form', login);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate(form)) return;
    await withLoading($('button[type=submit]', form), 'Signing in…', () => fakeRequest(1200));
    const email = form.email.value.trim();
    const name = email.split('@')[0].split(/[._-]/).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ') || 'Client';
    store.set('session', { name, email, company: 'Northbeam Logistics' }); // demo session, password is never stored
    renderChrome(); showDash();
    toast('Signed in', 'Welcome back to your client portal.');
  });
  $('#demo-fill')?.addEventListener('click', () => { form.email.value = 'jordan.lee@northbeam.co'; form.password.value = 'demo-password'; });
  $('#logout')?.addEventListener('click', () => { store.del('session'); location.reload(); });

  const defaults = [
    ['Approve Q1 pricing model', true], ['Share warehouse cost data', true],
    ['Review supplier shortlist', false], ['Book leadership workshop', false], ['Sign off hiring plan', false],
  ];
  function renderTasks() {
    const tasks = store.get('tasks', defaults);
    $('#tasks').innerHTML = tasks.map(([t, d], k) => `<label class="task${d ? ' done' : ''}"><input type="checkbox" data-k="${k}" ${d ? 'checked' : ''}><span>${t}</span></label>`).join('');
    const pct = Math.round(tasks.filter(t => t[1]).length / tasks.length * 100);
    $('#task-pct').textContent = pct + '%';
  }
  $('#tasks')?.addEventListener('change', e => {
    const tasks = store.get('tasks', defaults);
    tasks[e.target.dataset.k][1] = e.target.checked;
    store.set('tasks', tasks); renderTasks();
    if (e.target.checked) toast('Task completed', 'Your consultant has been notified.');
  });

  const seed = [{ me: false, t: "Hi! The supplier shortlist is ready in your files. Let's review it Thursday.", at: 'Yesterday' }];
  function renderMsgs() {
    const list = $('#msgs');
    list.innerHTML = store.get('chat', seed).map(m => `<div class="bubble${m.me ? ' me' : ''}"></div>`).join('');
    $$('.bubble', list).forEach((b, k) => { const m = store.get('chat', seed)[k]; b.textContent = m.t; b.insertAdjacentHTML('beforeend', `<small>${m.me ? 'You' : 'Maya Chen'} · ${m.at}</small>`); });
    list.scrollTop = list.scrollHeight;
  }
  $('#chat-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const input = e.target.msg, t = input.value.trim();
    if (!t) return;
    const chat = store.get('chat', seed);
    chat.push({ me: true, t, at: 'Just now' }); store.set('chat', chat); input.value = ''; renderMsgs();
    $('#typing').textContent = 'Maya is typing…';
    await fakeRequest(1800);
    $('#typing').textContent = '';
    chat.push({ me: false, t: "Thanks, got it! I'll get back to you with details before end of day.", at: 'Just now' });
    store.set('chat', chat); renderMsgs();
  });
  $('#download-report')?.addEventListener('click', e => withLoading(e.currentTarget, 'Preparing…', async () => {
    await fakeRequest(1500); toast('Report ready', 'Q4-Performance-Review.pdf was sent to your email.');
  }));

  if (store.get('session')) showDash();
}

/* ---------- Boot ---------- */
renderChrome();
initReveal();
initCases();
initPricing();
initTesti();
initBooking();
initContact();
initNewsletter();
initPortal();
