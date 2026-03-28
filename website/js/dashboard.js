// FormFillAI — Dashboard Logic (Firebase Firestore CRUD)
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== State =====
let currentUser = null;
let profiles = [];
let editingId = null;

// ===== Auth Guard =====
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  initDashboard();
});

async function initDashboard() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';

  const name = currentUser.displayName || currentUser.email.split('@')[0];
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('dropdown-name').textContent = name;
  document.getElementById('dropdown-email').textContent = currentUser.email;
  document.getElementById('settings-name').value = name;
  document.getElementById('settings-email').value = currentUser.email;

  await loadProfiles();
}

// ===== Load Profiles =====
async function loadProfiles() {
  const grid = document.getElementById('profiles-grid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem"><span class="loader" style="border-color:rgba(79,70,229,0.2);border-top-color:var(--primary)"></span></div>';
  try {
    const q = query(collection(db, 'users', currentUser.uid, 'profiles'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    profiles = [];
    snap.forEach(d => profiles.push({ id: d.id, ...d.data() }));
    document.getElementById('stat-profiles').textContent = profiles.length;
    renderProfiles();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--danger)">Failed to load profiles. Please refresh.</div>';
  }
}

// ===== Render Profiles =====
function renderProfiles() {
  const grid = document.getElementById('profiles-grid');
  const colors = [
    ['#4F46E5','#7C3AED'], ['#0EA5E9','#6366F1'],
    ['#10B981','#059669'], ['#F59E0B','#EF4444'],
    ['#EC4899','#8B5CF6'], ['#14B8A6','#0EA5E9']
  ];

  let html = '';
  profiles.forEach((p, i) => {
    const [a, b] = colors[i % colors.length];
    const fullName = `${p.firstname || ''} ${p.lastname || ''}`.trim() || 'Unnamed Profile';
    const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const hasBank = !!(p.bankname || p.accountnum);
    html += `
      <div class="profile-card">
        <div class="profile-card-header">
          <div class="profile-avatar" style="background:linear-gradient(135deg,${a},${b})">${initials}</div>
          <div>
            <div class="profile-name">${escHtml(fullName)}</div>
            <div class="profile-email">${escHtml(p.email || '')}</div>
            ${hasBank ? '<span class="profile-bank-chip" style="margin-top:0.3rem">🏦 Banking</span>' : ''}
          </div>
        </div>
        <div class="profile-details">
          ${p.phone ? `<div class="profile-detail"><span class="detail-icon">📞</span>${escHtml(p.phone)}</div>` : ''}
          ${p.company ? `<div class="profile-detail"><span class="detail-icon">🏢</span>${escHtml(p.company)}</div>` : ''}
          ${p.city ? `<div class="profile-detail"><span class="detail-icon">📍</span>${escHtml(p.city)}${p.country ? ', ' + escHtml(p.country) : ''}</div>` : ''}
          ${p.jobtitle ? `<div class="profile-detail"><span class="detail-icon">💼</span>${escHtml(p.jobtitle)}</div>` : ''}
        </div>
        <div class="profile-card-footer">
          <button class="btn btn-secondary btn-sm" style="flex:1" onclick="openModal('${p.id}')">✏️ Edit</button>
          <button class="btn btn-sm" style="flex:1;background:rgba(244,63,94,0.1);color:var(--danger)" onclick="deleteProfile('${p.id}', '${escHtml(fullName)}')">🗑 Delete</button>
        </div>
      </div>`;
  });

  // Add card
  html += `
    <div class="profile-card add-profile-card" onclick="openModal()">
      <div class="add-icon">+</div>
      <h4>Add New Profile</h4>
      <p>Store personal, address, professional &amp; banking data</p>
    </div>`;

  grid.innerHTML = html;
}

// ===== Modal =====
window.openModal = function(profileId = null) {
  editingId = profileId;
  document.getElementById('modal-title').textContent = profileId ? 'Edit Profile' : 'Add New Profile';
  document.getElementById('modal-save-btn').textContent = profileId ? 'Update Profile' : 'Save Profile';

  // Reset form
  const fields = [
    'firstname','middlename','lastname','email','phone','altphone','dob','gender','marital',
    'fathername','mothername','nationality','religion','languages','website',
    'address','area','postoffice','district','taluka','city','state','zip','country','domicile',
    'corraddress','corrcity','corrstate','corrzip',
    'category','caste','pwd','exserviceman','aadhar','pan','voterid','passport','drivinglicence','rollno',
    'school10','board10','year10','markstype10','marks10','maxmarks10','percent10','rollno10',
    'school12','board12','stream12','year12','marks12','maxmarks12','percent12','rollno12',
    'college','university','degree','branch','yeardegree','durationdegree','marksdegree','maxmarksdegree','percentdegree','enrolldegree',
    'pgcollege','pguniversity','pgdegree','pgbranch','yearpg','percentpg',
    'diploma','diplomainstitute','diplomayear','diplomascore',
    'company','jobtitle','experience','emptype','servicestart','serviceend','skills','linkedin','bio',
    'bankname','bankbranch','accountnum','ifsc','accounttype','micr','cardholder','upi','cardnum','expiry','routing',
  ];
  fields.forEach(f => {
    const el = document.getElementById('f-' + f);
    if (el) el.value = '';
  });

  // Switch to first tab
  switchModalTab('personal', document.querySelector('.tab-btn'));

  if (profileId) {
    const p = profiles.find(x => x.id === profileId);
    if (p) {
      fields.forEach(f => {
        const el = document.getElementById('f-' + f);
        if (el && p[f]) el.value = p[f];
      });
    }
  }

  document.getElementById('modal-overlay').classList.add('open');
};

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.remove('open');
  editingId = null;
};

window.closeModalOnOverlay = function(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
};

window.switchModalTab = function(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('modal-tab-' + tab).classList.add('active');
};

// ===== Save Profile =====
window.saveProfile = async function() {
  const firstname = document.getElementById('f-firstname').value.trim();
  const email = document.getElementById('f-email').value.trim();
  if (!firstname) { showToast('First name is required', 'error'); switchModalTab('personal', document.querySelectorAll('.tab-btn')[0]); return; }
  if (email && !isValidEmail(email)) { showToast('Enter a valid email address', 'error'); return; }

  const btn = document.getElementById('modal-save-btn');
  btn.innerHTML = '<span class="loader"></span> Saving...';
  btn.disabled = true;

  const fields = [
    'firstname','middlename','lastname','email','phone','altphone','dob','gender','marital',
    'fathername','mothername','nationality','religion','languages','website',
    'address','area','postoffice','district','taluka','city','state','zip','country','domicile',
    'corraddress','corrcity','corrstate','corrzip',
    'category','caste','pwd','exserviceman','aadhar','pan','voterid','passport','drivinglicence','rollno',
    'school10','board10','year10','markstype10','marks10','maxmarks10','percent10','rollno10',
    'school12','board12','stream12','year12','marks12','maxmarks12','percent12','rollno12',
    'college','university','degree','branch','yeardegree','durationdegree','marksdegree','maxmarksdegree','percentdegree','enrolldegree',
    'pgcollege','pguniversity','pgdegree','pgbranch','yearpg','percentpg',
    'diploma','diplomainstitute','diplomayear','diplomascore',
    'company','jobtitle','experience','emptype','servicestart','serviceend','skills','linkedin','bio',
    'bankname','bankbranch','accountnum','ifsc','accounttype','micr','cardholder','upi','cardnum','expiry','routing',
  ];
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById('f-' + f);
    if (el) data[f] = el.value.trim();
  });

  try {
    if (editingId) {
      data.updatedAt = serverTimestamp();
      await updateDoc(doc(db, 'users', currentUser.uid, 'profiles', editingId), data);
      showToast('Profile updated successfully ✓');
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'users', currentUser.uid, 'profiles'), data);
      showToast('Profile created successfully ✓');
    }
    closeModal();
    await loadProfiles();
  } catch (err) {
    console.error(err);
    showToast('Failed to save profile. Try again.', 'error');
  } finally {
    btn.innerHTML = editingId ? 'Update Profile' : 'Save Profile';
    btn.disabled = false;
  }
};

// ===== Delete Profile =====
window.deleteProfile = async function(id, name) {
  if (!confirm(`Delete profile "${name}"? This cannot be undone.`)) return;
  try {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'profiles', id));
    showToast('Profile deleted');
    await loadProfiles();
  } catch (err) {
    showToast('Failed to delete profile', 'error');
  }
};

// ===== Logout =====
window.handleLogout = async function() {
  await signOut(auth);
  window.location.href = 'login.html';
};

// ===== Section Tabs =====
window.showSection = function(section) {
  document.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + section).classList.add('active');
  document.getElementById('panel-' + section).classList.add('active');
  document.getElementById('user-dropdown').classList.remove('open');
};

// ===== Dropdown =====
window.toggleDropdown = function() {
  document.getElementById('user-dropdown').classList.toggle('open');
};
document.addEventListener('click', e => {
  const menu = document.getElementById('user-menu');
  if (!e.target.closest('.user-menu')) {
    document.getElementById('user-dropdown').classList.remove('open');
  }
});

// ===== Settings =====
window.saveSettings = async function() {
  const name = document.getElementById('settings-name').value.trim();
  if (!name) { showToast('Name cannot be empty', 'error'); return; }
  try {
    await updateProfile(currentUser, { displayName: name });
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('dropdown-name').textContent = name;
    showToast('Settings saved ✓');
  } catch (err) {
    showToast('Failed to save settings', 'error');
  }
};

// ===== Helpers =====
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
