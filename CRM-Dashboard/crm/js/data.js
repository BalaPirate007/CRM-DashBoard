/* ============================================================
   Kresola CRM — static mock data (no backend required)
   ============================================================ */

const KresolaData = (() => {

  const firstNames = ['Olivia','Liam','Emma','Noah','Ava','Ethan','Sophia','Mason','Isabella','Lucas','Mia','Elijah','Amelia','James','Harper','Benjamin','Evelyn','Henry','Abigail','Alexander','Ella','Michael','Scarlett','Daniel','Grace','Jack','Chloe','Owen','Zoey','Leo'];
  const lastNames = ['Carter','Bennett','Reyes','Morgan','Hayes','Coleman','Foster','Bishop','Lawson','Chan','Whitfield','Ortega','Pierce','Nolan','Marsh','Fenwick','Doyle','Lambert','Sullivan','Ashford'];
  const companies = ['Northwind Labs','Bluepeak Studio','Vertex Traders','Lumen Digital','Cascade Foods','Orbit Freight','Amberly Retail','Pinecrest Realty','Stratus Cloud','Ridgeline Media','Fairway Bank','Solace Health','Cobalt Systems','Marbleworks','Halcyon Travel'];
  const statuses = ['Active','Pending','Inactive'];
  const plans = ['Starter','Growth','Scale','Enterprise'];

  function seededRandom(seed){
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  const rand = seededRandom(42);
  function pick(arr){ return arr[Math.floor(rand()*arr.length)]; }
  function pad(n){ return String(n).padStart(2,'0'); }

  const customers = Array.from({length:48}).map((_, i) => {
    const fn = pick(firstNames), ln = pick(lastNames);
    const day = 1 + Math.floor(rand()*27);
    const month = 1 + Math.floor(rand()*12);
    return {
      id: 'CU-' + String(1000 + i),
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${pick(companies).toLowerCase().replace(/[^a-z]/g,'').slice(0,8)}.com`,
      company: pick(companies),
      status: statuses[i % 7 === 0 ? 2 : (i % 3 === 0 ? 1 : 0)],
      plan: pick(plans),
      spend: Math.round((rand()*9000+200)),
      joined: `2025-${pad(month)}-${pad(day)}`,
    };
  });

  const orderStatuses = ['Delivered','Processing','Pending','Cancelled'];
  const orders = Array.from({length:40}).map((_, i) => {
    const cust = customers[i % customers.length];
    const day = 1 + Math.floor(rand()*27);
    const month = 1 + Math.floor(rand()*12);
    return {
      id: 'ORD-' + String(58210 + i),
      customer: cust.name,
      email: cust.email,
      date: `2026-${pad(month)}-${pad(day)}`,
      status: orderStatuses[i % 9 === 0 ? 3 : (i % 4 === 0 ? 1 : (i % 5 === 0 ? 2 : 0))],
      amount: Math.round((rand()*1400+35)*100)/100,
      items: 1 + Math.floor(rand()*5),
    };
  });

  const revenueByMonth = [42,38,45,52,49,58,55,63,60,68,72,77].map((v,i)=>({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    value: v * 1000 + Math.round(rand()*4000)
  }));

  const analyticsBars = [62,74,58,81,69,90,76].map((v,i)=>({
    day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
    value: v
  }));

  const activity = [
    {who:'Olivia Carter', what:'upgraded to the Growth plan', when:'2 min ago', kind:'success'},
    {who:'Ridgeline Media', what:'submitted a new order · ORD-58231', when:'18 min ago', kind:'neutral'},
    {who:'Payment failed', what:'for invoice INV-2291 · Cobalt Systems', when:'46 min ago', kind:'danger'},
    {who:'Noah Bennett', what:'requested a refund on ORD-58198', when:'1 hr ago', kind:'warn'},
    {who:'Stratus Cloud', what:'renewed their annual contract', when:'3 hr ago', kind:'success'},
  ];

  const kpis = [
    {label:'Total Revenue', value:'$864,320', delta:'+12.4%', up:true, icon:'wallet'},
    {label:'Active Customers', value:'2,584', delta:'+4.1%', up:true, icon:'users'},
    {label:'New Customers', value:'186', delta:'+18.9%', up:true, icon:'user-plus'},
    {label:'Churn Rate', value:'1.8%', delta:'-0.3%', up:false, icon:'trend-down'},
  ];

  /* ---------------- Cross-page persistence helpers ----------------
     Customers added from the dashboard's "Add customer" quick action
     are stored separately in localStorage and merged on top of the
     static mock list, so they show up on /customers.html too. */
  const EXTRA_CUSTOMERS_KEY = 'kresola_extra_customers';
  function getExtraCustomers(){
    try{ return JSON.parse(localStorage.getItem(EXTRA_CUSTOMERS_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function getAllCustomers(){
    return getExtraCustomers().concat(customers);
  }
  function addCustomer(c){
    const extra = getExtraCustomers();
    extra.unshift(c);
    localStorage.setItem(EXTRA_CUSTOMERS_KEY, JSON.stringify(extra));
    return c;
  }

  /* Orders edited/deleted on /orders.html are persisted under this key;
     the dashboard reads the same key (falling back to the static mock
     list) so its KPIs/search/activity reflect real edits. */
  const ORDERS_KEY = 'kresola_orders';
  function getAllOrders(){
    try{
      const stored = JSON.parse(localStorage.getItem(ORDERS_KEY) || 'null');
      if(stored) return stored;
    }catch(e){ /* fall through to mock data */ }
    return orders;
  }

  return {
    customers, orders, revenueByMonth, analyticsBars, activity, kpis, plans,
    getAllCustomers, addCustomer, getExtraCustomers, getAllOrders,
  };
})();
