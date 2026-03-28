// FormFillAI Chrome Extension — Popup Logic
// Uses Firebase REST API (no module imports needed in popup scripts)

const FIREBASE_API_KEY = 'AIzaSyDDCJQHjclB8cWnuKV2tGy87vg2Tsb7IoI';
const FIREBASE_PROJECT = 'formfiller-pro-1eb71';
const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

let currentUser = null;
let profiles = [];
let selectedProfile = null;

// ===== Init on DOM ready =====
document.addEventListener('DOMContentLoaded', async () => {
  // Wire up all events here — NO inline handlers in HTML (MV3 CSP requirement)
  document.getElementById('login-form').addEventListener('submit', doLogin);
  document.getElementById('open-dashboard-btn').addEventListener('click', openDashboard);
  document.getElementById('logout-btn').addEventListener('click', doLogout);
  document.getElementById('profile-select').addEventListener('change', onProfileChange);
  document.getElementById('autofill-btn').addEventListener('click', doAutofill);
  document.getElementById('manage-profiles-link').addEventListener('click', openDashboard);

  // Check saved session
  const saved = await getSaved();
  if (saved && saved.idToken && saved.expiresAt > Date.now()) {
    currentUser = saved;
    await showMainView();
  } else {
    showLoginView();
  }
  countFields();
});

// ===== Login =====
async function doLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const email = document.getElementById('ext-email').value.trim();
  const password = document.getElementById('ext-password').value;
  btn.innerHTML = '<span class="loader"></span>';
  btn.disabled = true;
  clearAlert();

  if (!email || !password) {
    showAlert('Please enter both email and password.');
    btn.innerHTML = 'Sign In →';
    btn.disabled = false;
    return;
  }

  try {
    const resp = await fetch(`${AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await resp.json();

    if (data.error) {
      const code = data.error.message || '';
      const msgs = {
        'INVALID_LOGIN_CREDENTIALS': 'Wrong email or password. Please try again.',
        'INVALID_PASSWORD': 'Wrong password. Please try again.',
        'EMAIL_NOT_FOUND': 'No account found. Create one on the website first.',
        'USER_DISABLED': 'This account has been disabled.',
        'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many failed attempts. Try again later.',
        'MISSING_PASSWORD': 'Please enter your password.',
        'INVALID_EMAIL': 'Please enter a valid email address.',
      };
      const matchedKey = Object.keys(msgs).find(k => code.startsWith(k));
      showAlert(matchedKey ? msgs[matchedKey] : `Error: ${code}`);
      btn.innerHTML = 'Sign In →';
      btn.disabled = false;
      return;
    }

    currentUser = {
      idToken: data.idToken,
      localId: data.localId,
      email: data.email,
      displayName: data.displayName || email.split('@')[0],
      expiresAt: Date.now() + parseInt(data.expiresIn) * 1000
    };
    await chrome.storage.local.set({ formfillai_user: currentUser });
    await showMainView();

  } catch (err) {
    if (err.name === 'TypeError') {
      showAlert('Network error — check your internet connection.');
    } else {
      showAlert('Unexpected error: ' + err.message);
    }
    btn.innerHTML = 'Sign In →';
    btn.disabled = false;
  }
}

// ===== Logout =====
async function doLogout() {
  await chrome.storage.local.remove('formfillai_user');
  currentUser = null;
  profiles = [];
  selectedProfile = null;
  showLoginView();
}

// ===== Show Views =====
function showLoginView() {
  document.getElementById('login-view').style.display = 'block';
  document.getElementById('main-view').style.display = 'none';
  setStatus(false, 'Not signed in');
}

async function showMainView() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('main-view').style.display = 'block';

  const name = currentUser.displayName || currentUser.email;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('ext-avatar').textContent = initials;
  document.getElementById('ext-name').textContent = name;
  document.getElementById('ext-email-display').textContent = currentUser.email;

  setStatus(true, 'Connected');
  await loadProfiles();
}

// ===== Load Profiles from Firestore =====
async function loadProfiles() {
  const select = document.getElementById('profile-select');
  select.innerHTML = '<option value="">Loading…</option>';

  try {
    const resp = await fetch(
      `${FIRESTORE_URL}/users/${currentUser.localId}/profiles?pageSize=20`,
      { headers: { 'Authorization': `Bearer ${currentUser.idToken}` } }
    );
    const data = await resp.json();

    if (!data.documents || data.documents.length === 0) {
      select.innerHTML = '<option value="">No profiles — add one on dashboard</option>';
      document.getElementById('profile-preview').style.display = 'none';
      document.getElementById('autofill-btn').disabled = true;
      document.getElementById('autofill-btn').textContent = '⚠️ No Profiles Found';
      return;
    }

    profiles = data.documents.map(d => ({
      id: d.name.split('/').pop(),
      ...parseFirestoreDoc(d.fields)
    }));

    select.innerHTML = profiles.map((p, i) => {
      const label = [p.firstname, p.lastname].filter(Boolean).join(' ') || p.email || `Profile ${i + 1}`;
      return `<option value="${i}">${label}</option>`;
    }).join('');

    selectedProfile = profiles[0];
    updatePreview();
    document.getElementById('autofill-btn').disabled = false;
    document.getElementById('autofill-btn').textContent = '🤖 Autofill This Page';

  } catch (err) {
    select.innerHTML = '<option value="">Failed to load profiles</option>';
    console.error('Profile load error:', err);
  }
}

// ===== Profile Selection Change =====
function onProfileChange() {
  const idx = parseInt(document.getElementById('profile-select').value);
  selectedProfile = isNaN(idx) ? null : profiles[idx];
  updatePreview();
  document.getElementById('autofill-btn').disabled = !selectedProfile;
}

// ===== Profile Preview =====
function updatePreview() {
  const preview = document.getElementById('profile-preview');
  if (!selectedProfile) { preview.style.display = 'none'; return; }

  const show = [
    { k: 'Email', v: selectedProfile.email },
    { k: 'Phone', v: selectedProfile.phone },
    { k: 'Company', v: selectedProfile.company },
    { k: 'City', v: selectedProfile.city ? `${selectedProfile.city}${selectedProfile.country ? ', ' + selectedProfile.country : ''}` : null },
  ].filter(x => x.v);

  if (!show.length) { preview.style.display = 'none'; return; }

  preview.style.display = 'block';
  preview.innerHTML = show.map(x => `
    <div class="preview-row">
      <span class="preview-key">${x.k}</span>
      <span class="preview-val">${escHtml(x.v)}</span>
    </div>
  `).join('');
}

// ===== Autofill =====
async function doAutofill() {
  if (!selectedProfile) return;
  const btn = document.getElementById('autofill-btn');
  const result = document.getElementById('autofill-result');
  btn.innerHTML = '<span class="loader"></span> Filling…';
  btn.disabled = true;
  result.style.display = 'none';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'AUTOFILL',
      profile: selectedProfile
    });

    if (response && response.success) {
      result.textContent = `✓ Filled ${response.filled} of ${response.total} fields`;
      result.className = 'autofill-result success';
    } else {
      result.textContent = '⚠ No matching fields found on this page';
      result.className = 'autofill-result error';
    }
    result.style.display = 'block';
  } catch (err) {
    result.textContent = '⚠ Page not ready. Reload the page and try again.';
    result.className = 'autofill-result error';
    result.style.display = 'block';
  } finally {
    btn.textContent = '🤖 Autofill This Page';
    btn.disabled = false;
  }
}

// ===== Count Fields on Active Tab =====
async function countFields() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const resp = await chrome.tabs.sendMessage(tab.id, { type: 'COUNT_FIELDS' });
    if (resp && resp.count !== undefined) {
      document.getElementById('field-count').textContent = `${resp.count} fields detected`;
    }
  } catch (e) {
    document.getElementById('field-count').textContent = '';
  }
}

// ===== Open Dashboard =====
function openDashboard() {
  chrome.tabs.create({ url: 'http://127.0.0.1:5500/dashboard.html' });
}

// ===== Helpers =====
function setStatus(online, text) {
  document.getElementById('status-dot').className = `status-dot${online ? '' : ' offline'}`;
  document.getElementById('status-text').textContent = text;
}

function showAlert(msg) {
  const el = document.getElementById('login-alert');
  el.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  el.style.display = 'block';
}

function clearAlert() {
  document.getElementById('login-alert').style.display = 'none';
}

async function getSaved() {
  return new Promise(resolve => {
    chrome.storage.local.get('formfillai_user', data => resolve(data.formfillai_user));
  });
}

function parseFirestoreDoc(fields) {
  if (!fields) return {};
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) obj[k] = v.stringValue;
    else if (v.integerValue !== undefined) obj[k] = v.integerValue;
    else if (v.booleanValue !== undefined) obj[k] = v.booleanValue;
    else if (v.timestampValue !== undefined) obj[k] = v.timestampValue;
    else obj[k] = '';
  }
  return obj;
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
