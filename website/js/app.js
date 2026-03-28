// FormFillAI — Shared Utilities

// Show toast notification
export function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// Format Firestore timestamp
export function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Get initials from name
export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// Truncate string
export function truncate(str, n = 30) {
  return str && str.length > n ? str.slice(0, n) + '…' : str;
}

// Debounce
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Set loading state on button
export function setLoading(btn, loading) {
  if (loading) {
    btn.dataset.text = btn.innerHTML;
    btn.innerHTML = '<span class="loader"></span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.text || 'Submit';
    btn.disabled = false;
  }
}

// Avatar gradient colors
const avatarColors = [
  ['#4F46E5','#7C3AED'], ['#0EA5E9','#6366F1'],
  ['#10B981','#059669'], ['#F59E0B','#EF4444'],
  ['#EC4899','#8B5CF6'], ['#14B8A6','#0EA5E9'],
];
export function getAvatarColor(str = '') {
  const i = str.charCodeAt(0) % avatarColors.length;
  const [a, b] = avatarColors[i];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
