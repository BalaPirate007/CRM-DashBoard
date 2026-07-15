Kresola.requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-icon').innerHTML = Icon('search');

  const planFilter = document.getElementById('plan-filter');
  KresolaData.plans.forEach(p => planFilter.insertAdjacentHTML('beforeend', `<option>${p}</option>`));

  const state = { query:'', status:'', plan:'', sortKey:'joined', sortDir:'desc', page:1, pageSize:8 };

  // Deep-link support: dashboard search results / KPI cards link here with
  // ?q= and/or ?status= so the filters are pre-applied on arrival.
  const urlParams = new URLSearchParams(window.location.search);
  if(urlParams.get('q')) state.query = urlParams.get('q');
  if(urlParams.get('status')) state.status = urlParams.get('status');

  const tbody = document.getElementById('cust-tbody');
  const emptyEl = document.getElementById('cust-empty');
  const countEl = document.getElementById('cust-count');
  const pagesEl = document.getElementById('cust-pages');

  function statusPill(status){
    const map = { Active:'success', Pending:'warn', Inactive:'neutral' };
    return `<span class="pill ${map[status]}">${status}</span>`;
  }
  function initials(name){ return name.split(' ').map(n=>n[0]).slice(0,2).join(''); }
  function money(n){ return '$' + n.toLocaleString(); }

  function getFiltered(){
    let rows = KresolaData.getAllCustomers().filter(c => {
      const q = state.query.toLowerCase();
      const matchesQ = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q);
      const matchesStatus = !state.status || c.status === state.status;
      const matchesPlan = !state.plan || c.plan === state.plan;
      return matchesQ && matchesStatus && matchesPlan;
    });
    rows.sort((a,b) => {
      let av = a[state.sortKey], bv = b[state.sortKey];
      if(typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if(av < bv) return state.sortDir === 'asc' ? -1 : 1;
      if(av > bv) return state.sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }

  function render(){
    const all = getFiltered();
    const totalPages = Math.max(1, Math.ceil(all.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    const pageRows = all.slice(start, start + state.pageSize);

    if(pageRows.length === 0){
      tbody.innerHTML = '';
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = `${Icon('inbox')}<h4>No customers found</h4><p>Try a different search term or clear your filters.</p>`;
    } else {
      emptyEl.style.display = 'none';
      tbody.innerHTML = pageRows.map(c => `
        <tr>
          <td>
            <div class="cell-flex">
              <div class="row-avatar">${initials(c.name)}</div>
              <div>
                <div class="cell-name">${c.name}</div>
                <div class="cell-sub">${c.email}</div>
              </div>
            </div>
          </td>
          <td>${c.company}</td>
          <td>${c.plan}</td>
          <td>${money(c.spend)}</td>
          <td>${c.joined}</td>
          <td>${statusPill(c.status)}</td>
        </tr>
      `).join('');
    }

    countEl.textContent = all.length === 0 ? 'No results' : `Showing ${start+1}–${Math.min(start+state.pageSize, all.length)} of ${all.length}`;

    let pageBtns = '';
    pageBtns += `<button class="page-btn" id="cust-prev" ${state.page===1?'disabled':''}>‹</button>`;
    for(let p=1; p<=totalPages; p++){
      if(totalPages > 7 && Math.abs(p-state.page) > 2 && p!==1 && p!==totalPages){
        if(p === 2 || p === totalPages-1) pageBtns += `<span style="padding:0 4px;">…</span>`;
        continue;
      }
      pageBtns += `<button class="page-btn ${p===state.page?'active':''}" data-page="${p}">${p}</button>`;
    }
    pageBtns += `<button class="page-btn" id="cust-next" ${state.page===totalPages?'disabled':''}>›</button>`;
    pagesEl.innerHTML = pageBtns;

    pagesEl.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => { state.page = +b.dataset.page; render(); }));
    const prevBtn = document.getElementById('cust-prev'); if(prevBtn) prevBtn.addEventListener('click', () => { state.page--; render(); });
    const nextBtn = document.getElementById('cust-next'); if(nextBtn) nextBtn.addEventListener('click', () => { state.page++; render(); });

    document.querySelectorAll('th.sortable .sort-arrow').forEach(a => a.textContent = '↕');
    const activeTh = document.querySelector(`th[data-sort="${state.sortKey}"] .sort-arrow`);
    if(activeTh) activeTh.textContent = state.sortDir === 'asc' ? '↑' : '↓';
  }

  document.getElementById('cust-search').value = state.query;
  document.getElementById('status-filter').value = state.status;

  document.getElementById('cust-search').addEventListener('input', (e) => { state.query = e.target.value; state.page = 1; render(); });
  document.getElementById('status-filter').addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; render(); });
  document.getElementById('plan-filter').addEventListener('change', (e) => { state.plan = e.target.value; state.page = 1; render(); });

  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if(state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      Kresola.sound.toggle();
      render();
    });
  });

  render();
});
