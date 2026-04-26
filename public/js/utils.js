// UI utility helpers
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium transition-all ${
    type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  }`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'));
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatNumber(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString();
}

function statusBadge(status) {
  const map = {
    active: 'bg-emerald-900 text-emerald-300',
    disabled: 'bg-slate-700 text-slate-400',
    exhausted: 'bg-amber-900 text-amber-300',
    success: 'bg-emerald-900 text-emerald-300',
    error: 'bg-red-900 text-red-300',
  };
  const cls = map[status] || 'bg-slate-700 text-slate-400';
  return `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}">${status}</span>`;
}

function buildQuery(params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  }
  return q.toString() ? `?${q.toString()}` : '';
}

// Sidebar active state
function setSidebarActive(page) {
  document.querySelectorAll('[data-page]').forEach((el) => {
    el.classList.toggle('bg-slate-700', el.dataset.page === page);
    el.classList.toggle('text-white', el.dataset.page === page);
    el.classList.toggle('text-slate-400', el.dataset.page !== page);
  });
}
