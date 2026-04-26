// Shared auth helpers
const AUTH_KEY = 'admin_token';

function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = '/index.html';
    return null;
  }
  return token;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = '/index.html';
}

// Auto-check auth on load for protected pages
if (typeof window !== 'undefined' && document.currentScript) {
  // Called in head of protected pages
}
