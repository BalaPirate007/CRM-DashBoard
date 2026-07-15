Kresola.requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-icon').innerHTML = Icon('search');

  // Orders are cloned from mock data once, then persisted to localStorage so
  // edits/deletes survive a refresh without needing a real backend.
  let orders = JSON.parse(localStorage.getItem('kresola_orders') || 'null');
  if(!orders){ orders = JSON.parse(JSON.stringify(KresolaData.orders)); saveOrders(); }
  function saveOrders(){ localStorage.setItem('kresola_orders', JSON.stringify(orders)); }

  const state = { query:'', status:'', sortKey:'date', sortDir:'desc', page:1, pageSize:8 };

  // Deep-link support: dashboard search results / KPI cards link here with
  // ?q= and/or ?status= so the filters are pre-applied on arrival.
  const urlParams = new URLSearchParams(window.location.search);
  if(urlParams.get('q')) state.query = urlParams.get('q');
  if(urlParams.get('status')) state.status = urlParams.get('status');

  const tbody = document.getElementById('order-tbody');
  const emptyEl = document.getElementById('order-empty');
  const countEl = document.getElementById('order-count');
  const pagesEl = document.getElementById('order-pages');

  function statusPill(status){
    const map = { Delivered:'success', Processing:'neutral', Pending:'warn', Cancelled:'danger' };
    return `<span class="pill ${map[status]}">${status}</span>`;
  }
  function money(n){ return '$' + n.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}); }

  function getFiltered(){
    let rows = orders.filter(o => {
      const q = state.query.toLowerCase();
      const matchesQ = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q);
      const matchesStatus = !state.status || o.status === state.status;
      return matchesQ && matchesStatus;
    });
    rows.sort((a,b) => {
      let av = a[state.sortKey], bv = b[state.sortKey];
      if(typeof av === 'string'){ av = av.toLowerCase(); bv = bv.toLowerCase(); }
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
      emptyEl.innerHTML = `${Icon('inbox')}<h4>No orders found</h4><p>Try a different search term or clear your filters.</p>`;
    } else {
      emptyEl.style.display = 'none';
      tbody.innerHTML = pageRows.map(o => `
        <tr data-id="${o.id}">
          <td><strong>${o.id}</strong><div class="cell-sub">${o.items} item${o.items>1?'s':''}</div></td>
          <td>${o.customer}<div class="cell-sub">${o.email}</div></td>
          <td>${o.date}</td>
          <td>${money(o.amount)}</td>
          <td>${statusPill(o.status)}</td>
          <td>
            <div style="display:flex;gap:6px;justify-content:flex-end;">
              <button class="icon-btn btn-sm edit-btn" title="Edit status" style="width:32px;height:32px;">${Icon('edit')}</button>
              <button class="icon-btn btn-sm delete-btn" title="Delete order" style="width:32px;height:32px;color:var(--danger);">${Icon('trash')}</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    countEl.textContent = all.length === 0 ? 'No results' : `Showing ${start+1}–${Math.min(start+state.pageSize, all.length)} of ${all.length}`;

    let pageBtns = '';
    pageBtns += `<button class="page-btn" id="order-prev" ${state.page===1?'disabled':''}>‹</button>`;
    for(let p=1; p<=totalPages; p++){
      if(totalPages > 7 && Math.abs(p-state.page) > 2 && p!==1 && p!==totalPages){
        if(p === 2 || p === totalPages-1) pageBtns += `<span style="padding:0 4px;">…</span>`;
        continue;
      }
      pageBtns += `<button class="page-btn ${p===state.page?'active':''}" data-page="${p}">${p}</button>`;
    }
    pageBtns += `<button class="page-btn" id="order-next" ${state.page===totalPages?'disabled':''}>›</button>`;
    pagesEl.innerHTML = pageBtns;

    pagesEl.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => { state.page = +b.dataset.page; render(); }));
    const prevBtn = document.getElementById('order-prev'); if(prevBtn) prevBtn.addEventListener('click', () => { state.page--; render(); });
    const nextBtn = document.getElementById('order-next'); if(nextBtn) nextBtn.addEventListener('click', () => { state.page++; render(); });

    document.querySelectorAll('#order-tbody th').forEach(()=>{});
    document.querySelectorAll('th.sortable .sort-arrow').forEach(a => a.textContent = '↕');
    const activeTh = document.querySelector(`th[data-sort="${state.sortKey}"] .sort-arrow`);
    if(activeTh) activeTh.textContent = state.sortDir === 'asc' ? '↑' : '↓';

    // Bind row actions
    tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.closest('tr').dataset.id)));
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => openDeleteModal(btn.closest('tr').dataset.id)));
  }

  document.getElementById('order-search').value = state.query;
  document.getElementById('order-status-filter').value = state.status;

  document.getElementById('order-search').addEventListener('input', (e) => { state.query = e.target.value; state.page = 1; render(); });
  document.getElementById('order-status-filter').addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; render(); });
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if(state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = key; state.sortDir = 'asc'; }
      Kresola.sound.toggle();
      render();
    });
  });

  // ---- Edit status modal ----
  const editModal = document.getElementById('edit-modal');
  const editSelect = document.getElementById('edit-status-select');
  let editingId = null;
  function openEditModal(id){
    editingId = id;
    const order = orders.find(o => o.id === id);
    document.getElementById('edit-modal-sub').textContent = `${order.id} · ${order.customer}`;
    editSelect.value = order.status;
    editModal.classList.add('open');
    Kresola.sound.open();
  }
  document.getElementById('edit-cancel').addEventListener('click', () => editModal.classList.remove('open'));
  document.getElementById('edit-save').addEventListener('click', () => {
    const order = orders.find(o => o.id === editingId);
    order.status = editSelect.value;
    saveOrders();
    editModal.classList.remove('open');
    Kresola.sound.success();
    Kresola.toast(`${order.id} marked as ${order.status}`);
    render();
  });

  // ---- Delete modal ----
  const deleteModal = document.getElementById('delete-modal');
  let deletingId = null;
  function openDeleteModal(id){
    deletingId = id;
    const order = orders.find(o => o.id === id);
    document.getElementById('delete-modal-sub').textContent = `${order.id} for ${order.customer} will be permanently removed.`;
    deleteModal.classList.add('open');
    Kresola.sound.open();
  }
  document.getElementById('delete-cancel').addEventListener('click', () => deleteModal.classList.remove('open'));
  document.getElementById('delete-confirm').addEventListener('click', () => {
    orders = orders.filter(o => o.id !== deletingId);
    saveOrders();
    deleteModal.classList.remove('open');
    Kresola.sound.error();
    Kresola.toast('Order deleted');
    render();
  });

  [editModal, deleteModal].forEach(m => m.addEventListener('click', (e) => { if(e.target === m) m.classList.remove('open'); }));

  render();
});
