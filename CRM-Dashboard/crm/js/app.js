/* ============================================================
   Kresola CRM — shared app logic (theme, sound, sidebar, auth)
   Loaded on every page. Keeps all pages in sync via localStorage.
   ============================================================ */

const Kresola = (() => {

  /* ---------------- Sound engine ----------------
     Small Web Audio beeps generated in-browser, so no audio
     files are needed and every page shares identical sounds. */
  let audioCtx = null;
  function ctx(){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function tone(freq, dur, type='sine', gainPeak=0.06){
    if(localStorage.getItem('kresola_sound') === 'off') return;
    try{
      const c = ctx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
      osc.connect(gain).connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + dur);
    }catch(e){ /* audio not available, fail silently */ }
  }
  const sound = {
    click: () => tone(720, 0.09, 'sine', 0.05),
    toggle: () => tone(500, 0.07, 'triangle', 0.05),
    success: () => { tone(660, 0.09, 'sine', 0.05); setTimeout(()=>tone(880,0.12,'sine',0.05), 90); },
    error: () => tone(180, 0.16, 'square', 0.04),
    open: () => tone(420, 0.06, 'sine', 0.04),
  };

  // Play a click sound for any button / nav-link / .sound-click element pressed anywhere.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a.nav-link, .sound-click, .page-btn, .chip-toggle button');
    if(!el || el.disabled) return;
    if(el.classList.contains('no-sound')) return;
    sound.click();
  }, true);

  /* ---------------- Theme ---------------- */
  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-switch-input').forEach(i => i.checked = theme === 'dark');
  }
  function getTheme(){ return localStorage.getItem('kresola_theme') || 'light'; }
  function setTheme(theme){
    localStorage.setItem('kresola_theme', theme);
    applyTheme(theme);
  }
  applyTheme(getTheme());

  /* ---------------- Toast ---------------- */
  function toast(msg, kind='default'){
    let wrap = document.querySelector('.toast-wrap');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; }, 2200);
    setTimeout(() => t.remove(), 2500);
  }

  /* ---------------- Auth guard ---------------- */
  function requireAuth(){
    if(!sessionStorage.getItem('kresola_auth')){
      window.location.href = 'index.html';
    }
  }
  function logout(){
    sessionStorage.removeItem('kresola_auth');
    sound.toggle();
    window.location.href = 'index.html';
  }

  /* ---------------- Sidebar (mobile) ---------------- */
  function initSidebar(){
    const sidebar = document.querySelector('.sidebar');
    const scrim = document.querySelector('.sidebar-scrim');
    document.querySelectorAll('[data-toggle-sidebar]').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar && sidebar.classList.toggle('open');
        scrim && scrim.classList.toggle('open');
      });
    });
    scrim && scrim.addEventListener('click', () => {
      sidebar.classList.remove('open');
      scrim.classList.remove('open');
    });
  }

  /* ---------------- Greeting helper ---------------- */
  function greetingText(){
    const h = new Date().getHours();
    if(h < 12) return 'Good morning';
    if(h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /* ---------------- Init common bindings on load ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    document.querySelectorAll('[data-logout]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); logout(); }));
    document.querySelectorAll('.theme-switch-input').forEach(input => {
      input.checked = getTheme() === 'dark';
      input.addEventListener('change', () => {
        setTheme(input.checked ? 'dark' : 'light');
        sound.toggle();
      });
    });
    const userEl = document.querySelector('[data-user-name]');
    const stored = JSON.parse(localStorage.getItem('kresola_profile') || 'null');
    if(userEl && stored && stored.name) userEl.textContent = stored.name.split(' ')[0];
    const greetEl = document.querySelector('[data-greeting]');
    if(greetEl) greetEl.textContent = greetingText();
    const avatarEl = document.querySelector('[data-avatar-initials]');
    if(avatarEl && stored && stored.name){
      avatarEl.textContent = stored.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
    }
  });

  return { sound, toast, requireAuth, logout, setTheme, getTheme, greetingText };
})();
