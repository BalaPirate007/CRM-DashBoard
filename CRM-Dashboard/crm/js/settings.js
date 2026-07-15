Kresola.requireAuth();

document.addEventListener('DOMContentLoaded', () => {
  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('settings-email'),
    phone: document.getElementById('phone'),
    role: document.getElementById('role'),
    bio: document.getElementById('bio'),
  };

  function loadProfile(){
    const p = JSON.parse(localStorage.getItem('kresola_profile') || '{}');
    fields.name.value = p.name || '';
    fields.email.value = p.email || '';
    fields.phone.value = p.phone || '';
    fields.role.value = p.role || 'Founder';
    fields.bio.value = p.bio || '';
  }
  loadProfile();

  // Sound switch
  const soundSwitch = document.getElementById('sound-switch');
  soundSwitch.checked = localStorage.getItem('kresola_sound') !== 'off';
  soundSwitch.addEventListener('change', () => {
    localStorage.setItem('kresola_sound', soundSwitch.checked ? 'on' : 'off');
    if(soundSwitch.checked) Kresola.sound.toggle();
  });

  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validPhone(v){ return v.trim() === '' || /^[\d+\-()\s]{7,16}$/.test(v.trim()); }

  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const nameField = document.getElementById('name-field');
    const emailField = document.getElementById('settings-email-field');
    const phoneField = document.getElementById('phone-field');

    if(fields.name.value.trim().length < 2){ nameField.classList.add('invalid'); ok = false; } else nameField.classList.remove('invalid');
    if(!validEmail(fields.email.value.trim())){ emailField.classList.add('invalid'); ok = false; } else emailField.classList.remove('invalid');
    if(!validPhone(fields.phone.value)){ phoneField.classList.add('invalid'); ok = false; } else phoneField.classList.remove('invalid');

    if(!ok){ Kresola.sound.error(); Kresola.toast('Please fix the highlighted fields'); return; }

    localStorage.setItem('kresola_profile', JSON.stringify({
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      role: fields.role.value,
      bio: fields.bio.value.trim(),
    }));
    Kresola.sound.success();
    Kresola.toast('Profile saved');
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    loadProfile();
    document.querySelectorAll('.field').forEach(f => f.classList.remove('invalid'));
    Kresola.sound.toggle();
    Kresola.toast('Changes reset');
  });

  // Clear-data modal
  const clearModal = document.getElementById('clear-modal');
  document.getElementById('clear-data-btn').addEventListener('click', () => clearModal.classList.add('open'));
  document.getElementById('clear-cancel').addEventListener('click', () => clearModal.classList.remove('open'));
  clearModal.addEventListener('click', (e) => { if(e.target === clearModal) clearModal.classList.remove('open'); });
  document.getElementById('clear-confirm').addEventListener('click', () => {
    const authFlag = sessionStorage.getItem('kresola_auth');
    localStorage.clear();
    if(authFlag) sessionStorage.setItem('kresola_auth', authFlag);
    Kresola.sound.error();
    setTimeout(() => window.location.reload(), 300);
  });
});
