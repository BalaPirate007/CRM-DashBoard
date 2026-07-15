/* Renders the sidebar + mobile scrim into #sidebar-root.
   The active link is decided by <body data-page="..."> so every
   page shares the exact same markup and never drifts out of sync. */
(function(){
  const page = document.body.getAttribute('data-page') || '';
  const nav = [
    {group:'Menu', items:[
      {id:'dashboard', label:'Home', icon:'home', href:'dashboard.html'},
      {id:'customers', label:'Customers', icon:'users', href:'customers.html'},
      {id:'orders', label:'Orders', icon:'card', href:'orders.html'},
      {id:'settings', label:'Settings', icon:'settings', href:'settings.html'},
    ]},
  ];

  const linkHtml = (item) => `
    <a class="nav-link${item.id===page ? ' active' : ''}" href="${item.href}">
      ${Icon(item.icon)}<span>${item.label}</span>
    </a>`;

  const groupsHtml = nav.map(g => `
    <div>
      <div class="nav-section-label">${g.group}</div>
      <ul class="nav-list">
        ${g.items.map(i => `<li>${linkHtml(i)}</li>`).join('')}
      </ul>
    </div>`).join('');

  const html = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div class="brand-name">Kresola</div>
      </div>
      ${groupsHtml}
      <div class="sidebar-footer">
        <a class="nav-link" href="#" data-logout>${Icon('logout')}<span>Log Out</span></a>
      </div>
    </aside>
    <div class="sidebar-scrim"></div>
  `;

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('sidebar-root');
    if(root) root.outerHTML = html;
  });
})();
