Kresola.requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-icon').innerHTML = Icon('search');
  document.getElementById('bell-btn').innerHTML = Icon('bell') + document.getElementById('bell-btn').innerHTML;
  document.getElementById('export-csv-btn').innerHTML = Icon('download');
  document.getElementById('qa-icon-user').innerHTML = Icon('user-plus');
  document.getElementById('qa-icon-orders').innerHTML = Icon('bank');
  document.getElementById('qa-icon-cust').innerHTML = Icon('users');
  document.getElementById('qa-icon-settings').innerHTML = Icon('settings');

  /* ---------------- small helpers ---------------- */
  function money(n){ return '$' + Math.round(n).toLocaleString(); }
  function money2(n){ return '$' + n.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}); }
  function initials(name){ return name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase(); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function todayISO(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

  function closeAllPanels(){
    document.getElementById('search-panel').classList.remove('open');
    document.getElementById('notif-panel').classList.remove('open');
  }
  document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-wrap')) document.getElementById('search-panel').classList.remove('open');
    if(!e.target.closest('.notif-wrap')) document.getElementById('notif-panel').classList.remove('open');
  });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeAllPanels(); });

  /* ---------------- theme icon button ---------------- */
  const themeBtn = document.getElementById('theme-icon-btn');
  function paintThemeBtn(){ themeBtn.innerHTML = Icon(Kresola.getTheme() === 'dark' ? 'sun' : 'moon'); }
  paintThemeBtn();
  themeBtn.addEventListener('click', () => {
    Kresola.setTheme(Kresola.getTheme() === 'dark' ? 'light' : 'dark');
    Kresola.sound.toggle();
    paintThemeBtn();
  });

  /* ============================================================
     Global search — searches customers + orders live, deep-links
     into their pages with the query pre-applied.
     ============================================================ */
  const searchInput = document.getElementById('global-search');
  const searchPanel = document.getElementById('search-panel');
  const searchResults = document.getElementById('search-results');

  function renderSearchResults(raw){
    const q = raw.trim().toLowerCase();
    if(!q){ searchPanel.classList.remove('open'); searchResults.innerHTML = ''; return; }

    const custMatches = KresolaData.getAllCustomers().filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    ).slice(0, 4);
    const orderMatches = KresolaData.getAllOrders().filter(o =>
      o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)
    ).slice(0, 4);

    if(custMatches.length === 0 && orderMatches.length === 0){
      searchResults.innerHTML = `<div class="dropdown-empty">No matches for "${escapeHtml(raw)}"</div>`;
    } else {
      let html = '';
      custMatches.forEach(c => {
        html += `<a class="dropdown-item" href="customers.html?q=${encodeURIComponent(c.name)}">
          <span class="dd-icon">${Icon('users')}</span>
          <div><div class="dd-title">${c.name}</div><div class="dd-sub">${c.company} · Customer</div></div>
        </a>`;
      });
      orderMatches.forEach(o => {
        html += `<a class="dropdown-item" href="orders.html?q=${encodeURIComponent(o.id)}">
          <span class="dd-icon">${Icon('bank')}</span>
          <div><div class="dd-title">${o.id}</div><div class="dd-sub">${o.customer} · Order</div></div>
        </a>`;
      });
      searchResults.innerHTML = html;
    }
    searchPanel.classList.add('open');
  }
  searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
  searchInput.addEventListener('focus', (e) => { if(e.target.value.trim()) searchPanel.classList.add('open'); });
  searchInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){
      const first = searchResults.querySelector('a.dropdown-item');
      if(first) window.location.href = first.getAttribute('href');
    }
  });

  /* ============================================================
     Activity feed + notifications share one persisted data source,
     so anything logged (withdrawals, new customers) shows in both.
     ============================================================ */
  const EXTRA_ACTIVITY_KEY = 'kresola_extra_activity';
  function getExtraActivity(){ try{ return JSON.parse(localStorage.getItem(EXTRA_ACTIVITY_KEY) || '[]'); }catch(e){ return []; } }
  function setExtraActivity(arr){ localStorage.setItem(EXTRA_ACTIVITY_KEY, JSON.stringify(arr)); }
  function getCombinedActivity(){
    return getExtraActivity().concat(KresolaData.activity.map((a,i) => ({...a, id: 'base-' + i})));
  }
  function logActivity(who, what, kind){
    const extra = getExtraActivity();
    extra.unshift({ who, what, kind, when: 'Just now', id: 'a-' + Date.now() + '-' + Math.floor(Math.random()*1000) });
    setExtraActivity(extra);
    activityState.visible = Math.max(activityState.visible, 5);
    renderActivity();
    renderNotifications();
  }

  function activityIcon(kind){ return kind === 'success' ? 'check' : kind === 'danger' ? 'alert-triangle' : kind === 'warn' ? 'alert-triangle' : 'inbox'; }

  // ---- Activity feed (with filter + load more) ----
  const activityState = { filter: '', visible: 5 };
  const activityList = document.getElementById('activity-list');
  const activityMoreBtn = document.getElementById('activity-more-btn');

  function renderActivity(){
    const combined = getCombinedActivity().filter(a => !activityState.filter || a.kind === activityState.filter);
    const shown = combined.slice(0, activityState.visible);
    if(shown.length === 0){
      activityList.innerHTML = `<div class="empty-state">${Icon('inbox')}<h4>No activity</h4><p>Nothing matches this filter yet.</p></div>`;
    } else {
      activityList.innerHTML = shown.map(a => `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:12px 0;border-top:1px solid var(--border);">
          <div style="display:flex;gap:12px;">
            <span class="pill ${a.kind}" style="height:fit-content;">${Icon(activityIcon(a.kind))}</span>
            <div>
              <div style="font-size:13px;"><strong>${a.who}</strong> ${a.what}</div>
            </div>
          </div>
          <span class="cell-sub" style="white-space:nowrap;">${a.when}</span>
        </div>
      `).join('');
    }
    activityMoreBtn.style.display = combined.length > activityState.visible ? 'inline-flex' : 'none';
  }
  document.querySelectorAll('#activity-filter button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#activity-filter button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activityState.filter = btn.dataset.filter;
      activityState.visible = 5;
      renderActivity();
    });
  });
  activityMoreBtn.addEventListener('click', () => { activityState.visible += 5; renderActivity(); });

  // ---- Notifications dropdown ----
  const NOTIF_READ_KEY = 'kresola_notif_read';
  function getReadIds(){ try{ return JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || '[]'); }catch(e){ return []; } }
  function setReadIds(ids){ localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(ids)); }

  const notifBtn = document.getElementById('bell-btn');
  const notifPanel = document.getElementById('notif-panel');
  const notifList = document.getElementById('notif-list');
  const notifBadge = document.getElementById('notif-badge');

  function renderNotifications(){
    const combined = getCombinedActivity();
    const readIds = getReadIds();
    const unread = combined.filter(a => !readIds.includes(a.id)).length;
    if(unread > 0){
      notifBadge.textContent = unread > 9 ? '9+' : String(unread);
      notifBadge.className = 'notif-badge';
    } else {
      notifBadge.textContent = '';
      notifBadge.className = '';
    }
    notifList.innerHTML = combined.length === 0
      ? `<div class="dropdown-empty">You're all caught up.</div>`
      : combined.slice(0, 8).map(a => `
        <div class="dropdown-item ${!readIds.includes(a.id) ? 'unread' : ''}" data-id="${a.id}">
          <span class="dd-icon">${Icon(activityIcon(a.kind))}</span>
          <div><div class="dd-title">${a.who}</div><div class="dd-sub">${a.what}</div></div>
        </div>
      `).join('');
    notifList.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', () => {
        const ids = getReadIds();
        if(!ids.includes(el.dataset.id)){ ids.push(el.dataset.id); setReadIds(ids); }
        renderNotifications();
      });
    });
  }
  notifBtn.addEventListener('click', () => {
    searchPanel.classList.remove('open');
    notifPanel.classList.toggle('open');
  });
  document.getElementById('notif-mark-all').addEventListener('click', () => {
    setReadIds(getCombinedActivity().map(a => a.id));
    renderNotifications();
    Kresola.sound.toggle();
  });

  /* ============================================================
     KPI cards — computed from real (mock + persisted) data, and
     each card links to the relevant filtered page.
     ============================================================ */
  const kpiGrid = document.getElementById('kpi-grid');
  function computeKpis(){
    const customersAll = KresolaData.getAllCustomers();
    const ordersAll = KresolaData.getAllOrders();
    const totalRevenue = ordersAll.reduce((s,o) => s + o.amount, 0);
    const activeCount = customersAll.filter(c => c.status === 'Active').length;
    const newCount = KresolaData.getExtraCustomers().length;
    const inactiveCount = customersAll.filter(c => c.status === 'Inactive').length;
    const churn = customersAll.length ? (inactiveCount / customersAll.length * 100) : 0;
    return [
      { label:'Total Revenue', value: money(totalRevenue), delta:'+12.4%', up:true, icon:'wallet', href:'orders.html' },
      { label:'Active Customers', value: activeCount.toLocaleString(), delta:'+4.1%', up:true, icon:'users', href:'customers.html?status=Active' },
      { label:'New Customers', value: String(newCount), delta: newCount > 0 ? `+${newCount} today` : 'None yet', up: newCount > 0, icon:'user-plus', href:'customers.html' },
      { label:'Churn Rate', value: churn.toFixed(1) + '%', delta:'-0.3%', up:false, icon:'trend-down', href:'customers.html?status=Inactive' },
    ];
  }
  function renderKpis(){
    kpiGrid.innerHTML = computeKpis().map(k => `
      <a class="kpi-card" href="${k.href}">
        <div class="kpi-label">
          <span>${k.label}</span>
          <span style="color:var(--text-muted);">${Icon(k.icon)}</span>
        </div>
        <div class="kpi-value">${k.value}</div>
        <span class="kpi-delta ${k.up ? 'up' : 'down'}">${Icon(k.up ? 'trend-up' : 'trend-down')} ${k.delta}</span>
      </a>
    `).join('');
  }

  /* ============================================================
     Top customers — ranked by spend, includes any added via the
     "Add customer" quick action.
     ============================================================ */
  function renderTopCustomers(){
    const top = KresolaData.getAllCustomers().slice().sort((a,b) => b.spend - a.spend).slice(0, 5);
    document.getElementById('top-customers-list').innerHTML = top.map((c,i) => `
      <div class="top-cust-row">
        <div class="rank-badge">${i+1}</div>
        <div class="row-avatar">${initials(c.name)}</div>
        <div style="flex:1;min-width:0;overflow:hidden;">
          <div class="cell-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
          <div class="cell-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.company}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div class="cell-name">${money(c.spend)}</div>
          <div class="cell-sub">${c.plan}</div>
        </div>
      </div>
    `).join('');
  }

  /* ============================================================
     Monthly revenue goal
     ============================================================ */
  const GOAL_KEY = 'kresola_goal';
  const currentMonthRevenue = KresolaData.revenueByMonth[KresolaData.revenueByMonth.length - 1].value;
  function getGoal(){
    const v = parseFloat(localStorage.getItem(GOAL_KEY));
    return !isNaN(v) && v > 0 ? v : Math.round(currentMonthRevenue * 1.2 / 1000) * 1000;
  }
  function setGoal(v){ localStorage.setItem(GOAL_KEY, String(v)); }
  function renderGoal(){
    const goal = getGoal();
    const pct = Math.min(100, Math.round(currentMonthRevenue / goal * 100));
    document.getElementById('goal-amounts').textContent = `${money(currentMonthRevenue)} of ${money(goal)}`;
    document.getElementById('goal-pct').textContent = pct + '%';
    const fill = document.getElementById('goal-fill');
    fill.style.width = pct + '%';
    fill.style.background = pct >= 100 ? 'var(--success)' : 'var(--accent)';
  }
  const goalModal = document.getElementById('goal-modal');
  const goalField = document.getElementById('goal-field');
  const goalInput = document.getElementById('goal-amount-input');
  document.getElementById('edit-goal-btn').addEventListener('click', () => {
    goalInput.value = getGoal();
    goalField.classList.remove('invalid');
    goalModal.classList.add('open');
    Kresola.sound.open();
  });
  document.getElementById('goal-cancel').addEventListener('click', () => goalModal.classList.remove('open'));
  document.getElementById('goal-save').addEventListener('click', () => {
    const v = parseFloat(goalInput.value);
    if(isNaN(v) || v <= 0){ goalField.classList.add('invalid'); Kresola.sound.error(); return; }
    setGoal(v);
    goalModal.classList.remove('open');
    renderGoal();
    Kresola.sound.success();
    Kresola.toast('Revenue goal updated');
  });

  /* ============================================================
     Available balance + withdraw modal
     ============================================================ */
  const BALANCE_KEY = 'kresola_balance';
  function getBalance(){ const v = parseFloat(localStorage.getItem(BALANCE_KEY)); return !isNaN(v) ? v : 150545.90; }
  function setBalance(v){ localStorage.setItem(BALANCE_KEY, String(v)); }
  function renderBalance(){ document.getElementById('balance-value').textContent = money2(getBalance()); }

  const withdrawModal = document.getElementById('withdraw-modal');
  const withdrawField = document.getElementById('withdraw-field');
  const withdrawInput = document.getElementById('withdraw-amount');
  document.getElementById('withdraw-btn').addEventListener('click', () => {
    withdrawInput.value = '';
    withdrawField.classList.remove('invalid');
    document.getElementById('withdraw-modal-sub').textContent = `Available balance: ${money2(getBalance())}`;
    withdrawModal.classList.add('open');
    Kresola.sound.open();
  });
  document.getElementById('withdraw-cancel').addEventListener('click', () => withdrawModal.classList.remove('open'));
  document.getElementById('withdraw-confirm').addEventListener('click', () => {
    const amount = parseFloat(withdrawInput.value);
    const balance = getBalance();
    if(isNaN(amount) || amount <= 0 || amount > balance){
      withdrawField.classList.add('invalid');
      Kresola.sound.error();
      return;
    }
    setBalance(balance - amount);
    renderBalance();
    withdrawModal.classList.remove('open');
    Kresola.sound.success();
    Kresola.toast(`Withdrew ${money2(amount)}`);
    logActivity('You', `withdrew ${money2(amount)} from your available balance`, 'success');
  });
  [withdrawModal, goalModal].forEach(m => m.addEventListener('click', (e) => { if(e.target === m) m.classList.remove('open'); }));

  /* ============================================================
     Add customer (quick action)
     ============================================================ */
  const addCustomerModal = document.getElementById('add-customer-modal');
  const acPlan = document.getElementById('ac-plan');
  KresolaData.plans.forEach(p => acPlan.insertAdjacentHTML('beforeend', `<option>${p}</option>`));

  function resetAddCustomerForm(){
    ['ac-name','ac-email','ac-company'].forEach(id => { document.getElementById(id).value = ''; document.getElementById(id + '-field').classList.remove('invalid'); });
    acPlan.value = KresolaData.plans[0];
  }
  document.getElementById('qa-add-customer').addEventListener('click', () => {
    resetAddCustomerForm();
    addCustomerModal.classList.add('open');
    Kresola.sound.open();
  });
  document.getElementById('ac-cancel').addEventListener('click', () => addCustomerModal.classList.remove('open'));
  addCustomerModal.addEventListener('click', (e) => { if(e.target === addCustomerModal) addCustomerModal.classList.remove('open'); });

  document.getElementById('ac-save').addEventListener('click', () => {
    const name = document.getElementById('ac-name').value.trim();
    const email = document.getElementById('ac-email').value.trim();
    const company = document.getElementById('ac-company').value.trim();
    let valid = true;
    document.getElementById('ac-name-field').classList.toggle('invalid', name.length < 2); if(name.length < 2) valid = false;
    document.getElementById('ac-email-field').classList.toggle('invalid', !isValidEmail(email)); if(!isValidEmail(email)) valid = false;
    document.getElementById('ac-company-field').classList.toggle('invalid', company.length < 2); if(company.length < 2) valid = false;
    if(!valid){ Kresola.sound.error(); return; }

    const customer = {
      id: 'CU-' + Date.now(),
      name, email, company,
      status: 'Active',
      plan: acPlan.value,
      spend: 0,
      joined: todayISO(),
    };
    KresolaData.addCustomer(customer);
    addCustomerModal.classList.remove('open');
    Kresola.sound.success();
    Kresola.toast(`${name} added as a customer`);
    logActivity(name, 'was added as a new customer', 'success');
    renderKpis();
    renderTopCustomers();
  });

  /* ============================================================
     Charts (monochrome, minimal — matches the reference dashboard)
     ============================================================ */
  const isDark = Kresola.getTheme() === 'dark';
  const lineColor = isDark ? '#f4f4f5' : '#101012';
  const gridColor = isDark ? '#2a2a2d' : '#ececed';
  const mutedColor = isDark ? '#8f8f95' : '#8a8a90';

  let currentRangeData = KresolaData.revenueByMonth;
  const revCtx = document.getElementById('revenue-chart');
  const revenueChart = new Chart(revCtx, {
    type: 'line',
    data: {
      labels: currentRangeData.map(d => d.month),
      datasets: [{
        data: currentRangeData.map(d => d.value),
        borderColor: lineColor,
        backgroundColor: 'transparent',
        tension: 0.45,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: lineColor,
        fill: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { intersect: false, mode: 'index' } },
      scales: {
        x: { grid: { display: false }, ticks: { color: mutedColor, font: { size: 11 } } },
        y: { grid: { color: gridColor }, ticks: { color: mutedColor, font: { size: 11 }, callback: (v) => '$' + (v/1000) + 'k' } },
      },
      interaction: { intersect: false, mode: 'index' },
    }
  });

  document.querySelectorAll('#range-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#range-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRangeData = btn.dataset.range === '6m' ? KresolaData.revenueByMonth.slice(-6) : KresolaData.revenueByMonth;
      revenueChart.data.labels = currentRangeData.map(d => d.month);
      revenueChart.data.datasets[0].data = currentRangeData.map(d => d.value);
      revenueChart.update();
    });
  });

  document.getElementById('export-csv-btn').addEventListener('click', () => {
    const lines = ['Month,Revenue'];
    currentRangeData.forEach(d => lines.push(`${d.month},${d.value}`));
    lines.push('');
    lines.push('Metric,Value');
    computeKpis().forEach(k => lines.push(`"${k.label}","${k.value}"`));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kresola-dashboard-export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Kresola.sound.success();
    Kresola.toast('Revenue data exported');
  });

  const barCtx = document.getElementById('analytics-chart');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: KresolaData.analyticsBars.map(d => d.day),
      datasets: [{
        data: KresolaData.analyticsBars.map(d => d.value),
        backgroundColor: lineColor,
        borderRadius: 6,
        maxBarThickness: 20,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: mutedColor, font: { size: 11 } } },
        y: { display: false },
      },
    }
  });

  /* ---------------- initial render ---------------- */
  renderKpis();
  renderTopCustomers();
  renderGoal();
  renderBalance();
  renderActivity();
  renderNotifications();
});
